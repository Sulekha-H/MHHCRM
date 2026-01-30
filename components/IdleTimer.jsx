"use client";

import { useEffect, useCallback } from "react";
import { useClerk } from "@clerk/nextjs";

/**
 * IdleTimer component to automatically log out users after a period of inactivity.
 * @param {number} timeout - Inactivity timeout in milliseconds (default: 30 minutes).
 */
export default function IdleTimer({ timeout = 30 * 60 * 1000 }) {
  const { signOut } = useClerk();

  const handleLogout = useCallback(async () => {
    try {
      console.log("🕒 Inactivity timeout reached. Logging out...");
      await signOut();
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Inactivity logout failed:", error);
      window.location.href = "/sign-in";
    }
  }, [signOut]);

  useEffect(() => {
    let timer;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(handleLogout, timeout);
    };

    // Events to track user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Initialize timer
    resetTimer();

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timer) clearTimeout(timer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [handleLogout, timeout]);

  return null;
}
