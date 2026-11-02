/**
 * Interview Media Manager
 * Robust, privacy-first management of candidate camera & microphone MediaStreams,
 * device enumeration, live audio level analysis, and track lifecycles.
 */

export class InterviewMediaManager {
  /**
   * Check if the client browser supports media devices
   */
  static isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Enumerate available video and audio input devices
   */
  static async enumerateDevices() {
    if (!this.isSupported()) {
      return { videoDevices: [], audioDevices: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }));

      const audioDevices = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${i + 1}`,
        }));

      return { videoDevices, audioDevices };
    } catch (err) {
      console.warn("Device enumeration failed:", err);
      return { videoDevices: [], audioDevices: [] };
    }
  }

  /**
   * Request user media stream with optional device constraints
   */
  static async acquireStream({
    video = true,
    audio = true,
    videoDeviceId = null,
    audioDeviceId = null,
  } = {}) {
    if (!this.isSupported()) {
      throw new Error("Your browser does not support webcam or microphone media capture.");
    }

    const constraints = {
      video: video
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            deviceId: videoDeviceId ? { ideal: videoDeviceId } : undefined,
          }
        : false,
      audio: audio
        ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            deviceId: audioDeviceId ? { ideal: audioDeviceId } : undefined,
          }
        : false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (err) {
      // Map user-friendly error messages
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        throw new Error("Camera or microphone permission was denied. Please allow access in your browser settings to proceed.");
      }
      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        throw new Error("No camera or microphone device found. Please ensure your webcam/mic are connected.");
      }
      if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        throw new Error("Camera or microphone is already in use by another application. Please close other video apps and retry.");
      }
      if (err.name === "OverconstrainedError") {
        // Fallback to basic unconstrained stream
        return await navigator.mediaDevices.getUserMedia({ video: !!video, audio: !!audio });
      }
      throw err;
    }
  }

  /**
   * Safely stop all tracks on a MediaStream
   */
  static stopStream(stream) {
    if (!stream) return;
    try {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Track stop error:", e);
        }
      });
    } catch (err) {
      console.warn("Error stopping stream tracks:", err);
    }
  }

  /**
   * Toggle track enabled state without destroying the stream
   */
  static setTrackEnabled(stream, kind, enabled) {
    if (!stream) return;
    const tracks = kind === "video" ? stream.getVideoTracks() : stream.getAudioTracks();
    tracks.forEach((track) => {
      track.enabled = enabled;
    });
  }

  /**
   * Create a lightweight real-time audio input meter (0 - 100 level)
   */
  static createAudioMeter(stream, onLevel) {
    if (!stream || !stream.getAudioTracks().length) return () => {};

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return () => {};

      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let animId = null;
      let active = true;

      const checkVolume = () => {
        if (!active) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));

        onLevel(normalized);
        animId = requestAnimationFrame(checkVolume);
      };

      checkVolume();

      return () => {
        active = false;
        if (animId) cancelAnimationFrame(animId);
        try {
          source.disconnect();
          analyser.disconnect();
          audioCtx.close();
        } catch {
          // Ignore close error
        }
      };
    } catch (err) {
      console.warn("Audio meter initialization skipped:", err);
      return () => {};
    }
  }
}

