import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { interviewsApi } from "@/api/interviews";

const LiveInterviewContext = createContext(null);

const STORAGE_KEY = "hiresense_active_live_session";

export function LiveInterviewProvider({ children }) {
  const [activeSession, setActiveSession] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Sync to sessionStorage
  useEffect(() => {
    if (activeSession) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(activeSession));
      } catch (e) {
        console.warn("Could not cache active session to sessionStorage", e);
      }
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [activeSession]);

  // Check backend on mount if session is active
  useEffect(() => {
    let isMounted = true;
    interviewsApi
      .getActiveSession()
      .then((res) => {
        if (!isMounted) return;
        if (res?.session) {
          const s = res.session;
          setActiveSession({
            sessionId: s._id,
            targetRole: s.targetJob || s.jobAnalysis?.targetRole || "Software Engineer",
            startedAt: s.startedAt || new Date().toISOString(),
            durationMinutes: s.duration || 30,
            status: s.status,
          });
        } else if (!sessionStorage.getItem(STORAGE_KEY)) {
          setActiveSession(null);
        }
      })
      .catch(() => {
        // Ignore background check failure
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Live timer for active session
  useEffect(() => {
    if (!activeSession?.startedAt) {
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const calcElapsed = () => {
      const startMs = new Date(activeSession.startedAt).getTime();
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSec);
    };

    calcElapsed();
    timerRef.current = setInterval(calcElapsed, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession?.startedAt]);

  const startLiveSession = useCallback((sessionData) => {
    const sessionObj = {
      sessionId: sessionData._id || sessionData.sessionId,
      targetRole: sessionData.targetJob || sessionData.targetRole || "Software Engineer",
      startedAt: sessionData.startedAt || new Date().toISOString(),
      durationMinutes: sessionData.duration || 30,
      status: "active",
    };
    setActiveSession(sessionObj);
  }, []);

  const endLiveSession = useCallback(() => {
    setActiveSession(null);
    setElapsedSeconds(0);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const formatElapsed = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, []);

  return (
    <LiveInterviewContext.Provider
      value={{
        activeSession,
        hasActiveSession: !!activeSession,
        elapsedSeconds,
        formattedElapsed: formatElapsed(elapsedSeconds),
        startLiveSession,
        endLiveSession,
      }}
    >
      {children}
    </LiveInterviewContext.Provider>
  );
}

export function useLiveInterview() {
  const context = useContext(LiveInterviewContext);
  if (!context) {
    throw new Error("useLiveInterview must be used within a LiveInterviewProvider");
  }
  return context;
}

