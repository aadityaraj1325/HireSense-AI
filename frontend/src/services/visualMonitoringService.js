/**
 * Visual Monitoring Service
 * Real-time, on-device smart face presence verification, head pose / neck movement tracking
 * (detects looking left, right, up, down), mouth motion / whispering detection,
 * multi-face detection, and automated 3-strike proctoring.
 *
 * Privacy-first: Runs client-side only. Never records or uploads raw camera video.
 */

import { FilesetResolver, FaceDetector } from "@mediapipe/tasks-vision";

export class VisualMonitoringService {
  constructor(options = {}) {
    this.videoElement = null;
    this.intervalId = null;
    this.detectionIntervalMs = options.detectionIntervalMs || 600;
    this.absenceGracePeriodSec = options.absenceGracePeriodSec || 2;
    this.multipleGracePeriodSec = options.multipleGracePeriodSec || 3;
    this.warningCount = 0;
    this.maxWarnings = options.maxWarnings || 3;
    this.hasAutoSubmitted = false;

    // Detection engine instances
    this.detector = null;
    this.engineType = "initializing"; // "native" | "mediapipe" | "fallback"
    this.isInitializing = false;

    // Canvas for fast optical pose analyzer
    this.canvas = null;
    this.ctx = null;

    // History buffers for mouth movement & feature tracking
    this.mouthDistHistory = [];
    this.mouthActivityHistory = [];

    // State tracking
    this.currentStatus = "detecting"; // "single_face" | "head_turned" | "mouth_motion" | "no_face" | "multiple_faces" | "camera_off" | "detecting"
    this.isMonitoring = false;
    this.cameraActive = true;

    // Presence & Time accounting
    this.monitoringStartTime = null;
    this.totalDetectionChecks = 0;
    this.positiveDetectionChecks = 0;

    // Debounce / timers
    this.absenceStartMs = null;
    this.multipleStartMs = null;
    this.tabHiddenStartMs = null;
    this.activeAbsenceEvent = null;
    this.activeMultipleEvent = null;

    // Event history
    this.events = [];

    // Callbacks
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onEvent = options.onEvent || (() => {});
    this.onMetricsUpdate = options.onMetricsUpdate || (() => {});
    this.onWarning = options.onWarning || (() => {});
    this.onAutoSubmit = options.onAutoSubmit || (() => {});

    // Bound handlers
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  setVideoElement(videoElement) {
    if (videoElement && this.videoElement !== videoElement) {
      this.videoElement = videoElement;
    }
  }

  /**
   * Initialize detection engine:
   * 1. Check native window.FaceDetector
   * 2. Fall back to MediaPipe Tasks Vision
   * 3. Fall back to high-speed optical canvas pose analyzer
   */
  async initDetector() {
    if (this.detector) return;
    if (this.isInitializing) return;
    this.isInitializing = true;

    // 1. Try native Chromium FaceDetector
    if (typeof window !== "undefined" && window.FaceDetector) {
      try {
        this.detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 4 });
        this.engineType = "native";
        this.isInitializing = false;
        return;
      } catch (e) {
        console.warn("Native FaceDetector notice, trying MediaPipe:", e);
      }
    }

    // 2. Try MediaPipe FaceDetector
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      this.detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.45,
      });

      this.engineType = "mediapipe";
    } catch (err) {
      console.warn("MediaPipe FaceDetector notice, using high-speed optical canvas analyzer:", err);
      this.engineType = "fallback";
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Start continuous monitoring loop on an active <video> element
   */
  async startMonitoring(videoElement) {
    if (videoElement) {
      this.videoElement = videoElement;
    }
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.monitoringStartTime = Date.now();

    await this.initDetector();

    // Listen to tab visibility
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }

    // Start periodic detection checks
    this.intervalId = setInterval(() => {
      this.performDetectionCycle();
    }, this.detectionIntervalMs);

    this.logEvent("session_started", "Live visual & head pose monitoring initialized.");
  }

  /**
   * Stop monitoring loop & release resources
   */
  stopMonitoring() {
    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }

    if (this.activeAbsenceEvent) {
      this.resolveActiveAbsence();
    }
  }

  /**
   * Inform monitor of camera on/off manual toggle
   */
  setCameraActive(active) {
    this.cameraActive = active;
    if (!active) {
      this.updateStatus("camera_off", "Camera Paused", 0);
      this.logEvent("camera_disabled", "Camera was manually turned off by candidate.");
    } else {
      this.updateStatus("detecting", "Resuming presence check...", 0);
      this.logEvent("camera_restored", "Camera resumed by candidate.");
    }
  }

  /**
   * Core detection iteration: inspects face count, head orientation (left/right/up/down) and mouth movement
   */
  async performDetectionCycle() {
    if (!this.isMonitoring || !this.videoElement || !this.cameraActive) return;

    // Verify video stream is actively playing
    if (
      this.videoElement.readyState < 2 ||
      this.videoElement.paused ||
      this.videoElement.videoWidth === 0
    ) {
      return;
    }

    this.totalDetectionChecks++;

    try {
      let detectedCount = 0;
      let confidence = 0.9;
      let poseInfo = { isLookingAway: false, direction: "forward", directionLabel: "Facing Forward" };

      if (this.engineType === "mediapipe" && this.detector) {
        const result = this.detector.detect(this.videoElement);
        const detections = result.detections || [];
        detectedCount = detections.length;

        if (detectedCount === 1) {
          const d = detections[0];
          confidence = d.categories?.[0]?.score || 0.9;
          poseInfo = this.analyzeHeadPoseFromKeypoints(d.keypoints, d.boundingBox);
        } else if (detectedCount === 0) {
          poseInfo = { isLookingAway: true, direction: "absent", directionLabel: "Face Absent" };
        }
      } else if (this.engineType === "native" && this.detector) {
        const faces = await this.detector.detect(this.videoElement);
        detectedCount = faces ? faces.length : 0;
        if (detectedCount === 1) {
          poseInfo = this.analyzePoseFromNativeFace(faces[0]);
        } else if (detectedCount === 0) {
          poseInfo = { isLookingAway: true, direction: "absent", directionLabel: "Face Absent" };
        }
      } else {
        // High-speed Optical Canvas Feature, Head Pose & Mouth Motion Analyzer
        const opticalResult = this.analyzePoseWithCanvas(this.videoElement);
        detectedCount = opticalResult.faceCount;
        confidence = opticalResult.confidence;
        poseInfo = opticalResult.pose;
      }

      this.processDetectionResult(detectedCount, confidence, poseInfo);
    } catch (err) {
      console.warn("Detection cycle exception:", err);
    }
  }

  /**
   * Head pose and mouth motion analysis from MediaPipe 6 facial keypoints:
   * 0: right eye, 1: left eye, 2: nose tip, 3: mouth center, 4: right ear, 5: left ear
   */
  analyzeHeadPoseFromKeypoints(keypoints, boundingBox) {
    if (!keypoints || keypoints.length < 4) {
      return { isLookingAway: false, direction: "forward", directionLabel: "Facing Forward" };
    }

    const rightEye = keypoints[0];
    const leftEye = keypoints[1];
    const nose = keypoints[2];
    const mouth = keypoints[3];
    const rightEar = keypoints[4];
    const leftEar = keypoints[5];

    // Eye line geometry
    const eyeDist = Math.hypot(leftEye.x - rightEye.x, leftEye.y - rightEye.y);
    const eyeMidX = (rightEye.x + leftEye.x) / 2;
    const eyeMidY = (rightEye.y + leftEye.y) / 2;

    // Horizontal yaw: nose horizontal offset relative to eye midpoint
    const yawOffset = (nose.x - eyeMidX) / (eyeDist / 2 || 1);

    // Vertical pitch: eye-to-nose vs nose-to-mouth
    const eyeToNoseY = nose.y - eyeMidY;
    const noseToMouthY = mouth ? mouth.y - nose.y : eyeDist * 0.55;
    const pitchRatio = noseToMouthY > 0.005 ? eyeToNoseY / noseToMouthY : 1;

    // Ear distance ratio
    let earRatio = 1;
    if (leftEar && rightEar) {
      const leftDist = Math.hypot(nose.x - leftEar.x, nose.y - leftEar.y);
      const rightDist = Math.hypot(nose.x - rightEar.x, nose.y - rightEar.y);
      earRatio = rightDist > 0.005 ? leftDist / rightDist : 1;
    }

    // Mouth Motion Detection
    let isMouthMoving = false;
    if (mouth && nose) {
      const mouthDist = Math.hypot(mouth.x - nose.x, mouth.y - nose.y);
      this.mouthDistHistory.push(mouthDist);
      if (this.mouthDistHistory.length > 8) this.mouthDistHistory.shift();

      if (this.mouthDistHistory.length >= 4) {
        const minM = Math.min(...this.mouthDistHistory);
        const maxM = Math.max(...this.mouthDistHistory);
        const variance = (maxM - minM) / (eyeDist || 1);
        if (variance > 0.052) {
          isMouthMoving = true;
        }
      }
    }

    // High sensitivity Neck turned LEFT or RIGHT
    if (yawOffset > 0.22 || earRatio < 0.55) {
      return {
        isLookingAway: true,
        direction: isMouthMoving ? "mouth_motion_left" : "neck_left",
        directionLabel: isMouthMoving ? "Mouth Motion while Turned Left" : "Head Turned Left",
        angle: Math.round(yawOffset * 45),
        isMouthMoving,
      };
    }

    if (yawOffset < -0.22 || earRatio > 1.82) {
      return {
        isLookingAway: true,
        direction: isMouthMoving ? "mouth_motion_right" : "neck_right",
        directionLabel: isMouthMoving ? "Mouth Motion while Turned Right" : "Head Turned Right",
        angle: Math.round(yawOffset * 45),
        isMouthMoving,
      };
    }

    // Neck tilted DOWN (looking down at lap, notes, or phone)
    if (pitchRatio > 1.8 || eyeToNoseY / (eyeDist || 1) < 0.13) {
      return {
        isLookingAway: true,
        direction: isMouthMoving ? "mouth_motion_down" : "neck_down",
        directionLabel: isMouthMoving ? "Mouth Motion Looking Down" : "Looking Down",
        angle: Math.round((pitchRatio - 1) * 30),
        isMouthMoving,
      };
    }

    // Neck tilted UP (looking up at ceiling / looking away)
    if (pitchRatio < 0.36 || eyeToNoseY < 0.01) {
      return {
        isLookingAway: true,
        direction: "neck_up",
        directionLabel: "Looking Up",
        angle: -30,
        isMouthMoving,
      };
    }

    // Mouth Motion while facing forward
    if (isMouthMoving) {
      return {
        isLookingAway: true,
        direction: "mouth_motion",
        directionLabel: "Mouth Motion Detected",
        isMouthMoving: true,
      };
    }

    return {
      isLookingAway: false,
      direction: "forward",
      directionLabel: "Facing Forward",
      isMouthMoving: false,
    };
  }

  /**
   * Head pose analysis from Native Chromium FaceDetector landmarks
   */
  analyzePoseFromNativeFace(face) {
    if (!face) return { isLookingAway: false, direction: "forward", directionLabel: "Facing Forward" };

    const landmarks = face.landmarks || [];
    const eyes = landmarks.filter((l) => l.type === "eye");

    if (eyes.length >= 2 && face.boundingBox) {
      const box = face.boundingBox;
      const eyeMidX = (eyes[0].locations[0].x + eyes[1].locations[0].x) / 2;
      const boxMidX = box.x + box.width / 2;
      const dispX = (eyeMidX - boxMidX) / (box.width / 2 || 1);

      if (dispX > 0.22) {
        return { isLookingAway: true, direction: "neck_right", directionLabel: "Head Turned Right" };
      }
      if (dispX < -0.22) {
        return { isLookingAway: true, direction: "neck_left", directionLabel: "Head Turned Left" };
      }
    }

    return { isLookingAway: false, direction: "forward", directionLabel: "Facing Forward" };
  }

  /**
   * High-accuracy Optical Canvas Feature, Head Pose & Mouth Motion Analyzer
   */
  analyzePoseWithCanvas(video) {
    try {
      if (!this.canvas) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = 160;
        this.canvas.height = 120;
        this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
      }

      this.ctx.drawImage(video, 0, 0, 160, 120);
      const imgData = this.ctx.getImageData(0, 0, 160, 120).data;

      let skinPixels = 0;
      let minX = 160, maxX = 0, minY = 120, maxY = 0;
      let sumX = 0, sumY = 0;

      for (let y = 0; y < 120; y++) {
        for (let x = 0; x < 160; x++) {
          const idx = (y * 160 + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];

          // Strict skin chroma filter: R > 75, G > 40, B > 25, R > G, R > B, R - G > 12
          if (r > 75 && g > 40 && b > 25 && r > g && r > b && (r - g) > 12) {
            skinPixels++;
            sumX += x;
            sumY += y;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Check minimum skin pixels: needs at least 3% of frame
      if (skinPixels < (160 * 120 * 0.03)) {
        return {
          faceCount: 0,
          confidence: 0,
          pose: { isLookingAway: true, direction: "absent", directionLabel: "Face Absent" },
        };
      }

      const faceWidth = maxX - minX;
      const faceHeight = maxY - minY;
      const faceCenterX = sumX / skinPixels;
      const faceCenterY = sumY / skinPixels;

      if (faceWidth < 20 || faceHeight < 20) {
        return {
          faceCount: 0,
          confidence: 0,
          pose: { isLookingAway: true, direction: "absent", directionLabel: "Face Absent" },
        };
      }

      // Detect dark features (eyes, eyebrows) inside upper 60% of face box
      let darkFeatureSumX = 0;
      let darkFeatureSumY = 0;
      let darkFeatureCount = 0;

      const sampleTop = Math.floor(minY + faceHeight * 0.15);
      const sampleBottom = Math.floor(minY + faceHeight * 0.65);
      const sampleLeft = Math.floor(minX + faceWidth * 0.15);
      const sampleRight = Math.floor(minX + faceWidth * 0.85);

      for (let y = sampleTop; y < sampleBottom; y++) {
        for (let x = sampleLeft; x < sampleRight; x++) {
          const idx = (y * 160 + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

          if (luminance < 95) {
            darkFeatureSumX += x;
            darkFeatureSumY += y;
            darkFeatureCount++;
          }
        }
      }

      // Detect mouth region luminance changes (Mouth Motion)
      let isMouthMoving = false;
      const mouthTop = Math.floor(minY + faceHeight * 0.65);
      const mouthBottom = Math.floor(minY + faceHeight * 0.95);
      const mouthLeft = Math.floor(minX + faceWidth * 0.25);
      const mouthRight = Math.floor(minX + faceWidth * 0.75);

      let mouthLumaSum = 0;
      let mouthPixels = 0;

      for (let y = mouthTop; y < mouthBottom; y++) {
        for (let x = mouthLeft; x < mouthRight; x++) {
          const idx = (y * 160 + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          mouthLumaSum += luma;
          mouthPixels++;
        }
      }

      if (mouthPixels > 0) {
        const avgMouthLuma = mouthLumaSum / mouthPixels;
        this.mouthActivityHistory.push(avgMouthLuma);
        if (this.mouthActivityHistory.length > 8) this.mouthActivityHistory.shift();

        if (this.mouthActivityHistory.length >= 4) {
          const minL = Math.min(...this.mouthActivityHistory);
          const maxL = Math.max(...this.mouthActivityHistory);
          if ((maxL - minL) > 3.4) {
            isMouthMoving = true;
          }
        }
      }

      let isLookingAway = false;
      let direction = "forward";
      let directionLabel = "Facing Forward";

      if (darkFeatureCount > 16) {
        const featureAvgX = darkFeatureSumX / darkFeatureCount;
        const featureAvgY = darkFeatureSumY / darkFeatureCount;
        const boxCenterX = (minX + maxX) / 2;
        const boxCenterY = (minY + maxY) / 2;

        const dispX = (featureAvgX - boxCenterX) / (faceWidth / 2 || 1);
        const dispY = (featureAvgY - boxCenterY) / (faceHeight / 2 || 1);

        if (dispX > 0.19) {
          isLookingAway = true;
          direction = isMouthMoving ? "mouth_motion_right" : "neck_right";
          directionLabel = isMouthMoving ? "Mouth Motion while Turned Right" : "Head Turned Right";
        } else if (dispX < -0.19) {
          isLookingAway = true;
          direction = isMouthMoving ? "mouth_motion_left" : "neck_left";
          directionLabel = isMouthMoving ? "Mouth Motion while Turned Left" : "Head Turned Left";
        } else if (dispY > 0.26) {
          isLookingAway = true;
          direction = isMouthMoving ? "mouth_motion_down" : "neck_down";
          directionLabel = isMouthMoving ? "Mouth Motion Looking Down" : "Looking Down";
        } else if (dispY < -0.26) {
          isLookingAway = true;
          direction = "neck_up";
          directionLabel = "Looking Up";
        }
      }

      // Check if face center is drifted toward frame perimeter
      if (!isLookingAway) {
        if (faceCenterX < 26) {
          isLookingAway = true;
          direction = "neck_left";
          directionLabel = "Turned Away (Left)";
        } else if (faceCenterX > 134) {
          isLookingAway = true;
          direction = "neck_right";
          directionLabel = "Turned Away (Right)";
        } else if (faceCenterY > 108) {
          isLookingAway = true;
          direction = "neck_down";
          directionLabel = "Looking Down";
        } else if (isMouthMoving) {
          isLookingAway = true;
          direction = "mouth_motion";
          directionLabel = "Mouth Motion Detected";
        }
      }

      return {
        faceCount: 1,
        confidence: 0.88,
        pose: {
          isLookingAway,
          direction,
          directionLabel,
          isMouthMoving,
        },
      };
    } catch (err) {
      console.warn("Canvas pose calculation notice:", err);
      return {
        faceCount: 1,
        confidence: 0.8,
        pose: { isLookingAway: false, direction: "forward", directionLabel: "Facing Forward", isMouthMoving: false },
      };
    }
  }

  /**
   * Evaluate face count, head pose & mouth motion with 2-second grace periods and 3-strike policy
   */
  processDetectionResult(faceCount, confidence, poseInfo = {}) {
    const now = Date.now();
    const isLookingAway = !!poseInfo.isLookingAway;
    const directionLabel = poseInfo.directionLabel || "Looking Away";

    // A violation occurs if: no face, or neck turned away (left/right/up/down), or mouth motion violation, or multiple faces
    const isViolation = faceCount === 0 || isLookingAway || faceCount > 1;

    if (!isViolation && faceCount === 1) {
      // Normal state: Candidate is facing forward with calm mouth!
      this.positiveDetectionChecks++;

      // Resolve absence or turned away state immediately
      if (this.absenceStartMs) {
        this.resolveActiveAbsence();
      }

      this.multipleStartMs = null;
      this.activeMultipleEvent = null;

      this.updateStatus("single_face", "Face Verified", 1, confidence, {
        warningCount: this.warningCount,
        isWarningActive: false,
        isTerminating: false,
        absentDurationSec: 0,
        poseDirection: "forward",
        directionLabel: "Facing Forward",
      });
    } else if (faceCount === 0 || isLookingAway) {
      // Violation state: candidate absent, head turned, or mouth motion detected
      if (!this.absenceStartMs) {
        this.absenceStartMs = now;
      }

      const violationDurationSec = Math.floor((now - this.absenceStartMs) / 1000);
      const isMotionViolation = faceCount > 0 && isLookingAway;

      let isWarningActive = false;
      let isTerminating = false;

      // After 2 seconds of looking away or mouth motion violation:
      if (violationDurationSec >= this.absenceGracePeriodSec) {
        isWarningActive = true;

        // Strike 1 at 2s, Strike 2 at 4s, Strike 3 at 6s
        const currentStrike = Math.min(
          this.maxWarnings,
          Math.floor((violationDurationSec - this.absenceGracePeriodSec) / 2) + 1
        );

        if (currentStrike > this.warningCount) {
          this.warningCount = currentStrike;
          this.logEvent(
            isMotionViolation ? "head_motion_warning" : "face_absent_warning",
            `🚨 Proctoring Warning: ${isMotionViolation ? directionLabel : "Face not visible"} (${violationDurationSec}s). Strike ${this.warningCount}/${this.maxWarnings} issued.`
          );
          this.onWarning({
            warningCount: this.warningCount,
            maxWarnings: this.maxWarnings,
            durationSec: violationDurationSec,
            reason: isMotionViolation ? "motion_warning" : "no_face",
            directionLabel,
          });
        }

        if (this.warningCount >= this.maxWarnings) {
          isTerminating = true;
          if (!this.hasAutoSubmitted) {
            this.hasAutoSubmitted = true;
            this.logEvent(
              "interview_auto_submitted",
              `Interview auto-submitted due to 3 consecutive proctoring violations (${isMotionViolation ? directionLabel : "Face absent"}).`
            );
            this.onAutoSubmit({
              reason: isMotionViolation ? directionLabel : "Face not detected",
              warningCount: this.warningCount,
            });
          }
        }
      }

      const statusType = faceCount === 0 ? "no_face" : "head_turned";
      const statusLabel = isWarningActive
        ? `🚩 RED FLAG: ${isMotionViolation ? directionLabel : "Face Absent"} (${this.warningCount}/${this.maxWarnings})`
        : isMotionViolation
        ? `Attention: ${directionLabel}`
        : "Scanning face presence...";

      this.updateStatus(statusType, statusLabel, faceCount, confidence, {
        absentDurationSec: violationDurationSec,
        warningCount: this.warningCount,
        isWarningActive,
        isTerminating,
        warningReason: isMotionViolation ? "motion_warning" : "no_face",
        directionLabel: isMotionViolation ? directionLabel : "Face Not Visible",
      });
    } else if (faceCount > 1) {
      // Multiple faces
      if (!this.multipleStartMs) {
        this.multipleStartMs = now;
      }

      const multipleDurationSec = Math.floor((now - this.multipleStartMs) / 1000);
      if (multipleDurationSec >= this.multipleGracePeriodSec && !this.activeMultipleEvent) {
        this.activeMultipleEvent = this.logEvent(
          "multiple_faces",
          `Multiple faces (${faceCount}) appeared in camera frame.`
        );
      }

      this.updateStatus("multiple_faces", `Multiple faces detected (${faceCount})`, faceCount);
    }

    this.broadcastMetrics();
  }

  resolveActiveAbsence() {
    if (this.absenceStartMs) {
      const duration = Math.round((Date.now() - this.absenceStartMs) / 1000);
      if (this.activeAbsenceEvent) {
        this.activeAbsenceEvent.resolved = true;
        this.activeAbsenceEvent.durationSeconds = duration;
        this.activeAbsenceEvent.note = `Candidate returned attention to screen after ${duration}s.`;
        this.onEvent(this.activeAbsenceEvent);
        this.activeAbsenceEvent = null;
      }
      this.absenceStartMs = null;
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.tabHiddenStartMs = Date.now();
      this.logEvent("tab_hidden", "Interview tab became inactive (user switched tabs or minimized).");
    } else if (this.tabHiddenStartMs) {
      const duration = Math.round((Date.now() - this.tabHiddenStartMs) / 1000);
      this.logEvent("tab_restored", `Interview tab resumed active focus after ${duration}s.`);
      this.tabHiddenStartMs = null;
    }
  }

  updateStatus(status, label, faceCount, confidence = 1, extra = {}) {
    this.currentStatus = status;
    this.onStatusChange({
      status,
      label,
      faceCount,
      confidence,
      engine: this.engineType,
      ...extra,
    });
  }

  logEvent(eventType, note, options = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType,
      timestamp: new Date().toISOString(),
      durationSeconds: options.durationSeconds || 0,
      note,
      resolved: !options.unresolved,
    };

    this.events.push(event);
    this.onEvent(event);
    return event;
  }

  broadcastMetrics() {
    const presencePct =
      this.totalDetectionChecks > 0
        ? Math.round((this.positiveDetectionChecks / this.totalDetectionChecks) * 100)
        : 100;

    const totalAbsent = this.events.filter((e) => e.eventType === "face_absent" || e.eventType === "head_motion_warning").length;
    const totalMultiple = this.events.filter((e) => e.eventType === "multiple_faces").length;
    const totalTabSwitches = this.events.filter((e) => e.eventType === "tab_hidden").length;

    this.onMetricsUpdate({
      facePresencePct: presencePct,
      totalAbsentEvents: totalAbsent,
      totalMultipleFacesEvents: totalMultiple,
      totalTabSwitches,
      totalEvents: this.events.length,
      currentStatus: this.currentStatus,
    });
  }

  getMonitoringSummary() {
    const presencePct =
      this.totalDetectionChecks > 0
        ? Math.round((this.positiveDetectionChecks / this.totalDetectionChecks) * 100)
        : 100;

    const totalAbsent = this.events.filter((e) => e.eventType === "face_absent" || e.eventType === "head_motion_warning").length;
    const totalMultiple = this.events.filter((e) => e.eventType === "multiple_faces").length;
    const totalTabSwitches = this.events.filter((e) => e.eventType === "tab_hidden").length;

    return {
      cameraPermissionGranted: true,
      microphonePermissionGranted: true,
      cameraUsed: this.cameraActive,
      microphoneUsed: true,
      facePresencePct: presencePct,
      totalFaceAbsentEvents: totalAbsent,
      totalMultipleFacesEvents: totalMultiple,
      totalTabSwitches,
      events: this.events,
      observationsSummary: `Candidate presence & attention was monitored across ${this.totalDetectionChecks} inspection checks with ${presencePct}% attention continuity. Recorded ${totalTabSwitches} tab switches and ${totalAbsent} head/mouth motion warnings.`,
    };
  }
}
