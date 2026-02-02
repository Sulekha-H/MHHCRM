"use client";

import { useEffect, useCallback } from "react";
import { useClerk } from "@clerk/nextjs";

/**
 * IdleTimer component to automatically log out users after a period of inactivity.
 * @param {number} timeout - Inactivity timeout in milliseconds (default: 30 minutes).
 */
export default function IdleTimer({ timeout = 30 * 60 * 1000 }) {
  const { signOut } = useClerk();
  const STORAGE_KEY = "myhope_last_activity";
  const LOGOUT_SIGNAL_KEY = "myhope_force_logout";

  const handleLogout = useCallback(async () => {
    try {
      console.log("🕒 Inactivity timeout reached. Logging out...");
      // Set the signal for other tabs to log out as well
      localStorage.setItem(LOGOUT_SIGNAL_KEY, Date.now().toString());
      await signOut();
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Inactivity logout failed:", error);
      window.location.href = "/sign-in";
    }
  }, [signOut]);

  useEffect(() => {
    // Initialize activity timestamp on mount if not exists
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }

    const resetActivity = () => {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    };

    // Listen for storage events from other tabs
    const handleStorageEvent = (event) => {
      if (event.key === LOGOUT_SIGNAL_KEY) {
        console.log("🕒 Received logout signal from another tab.");
        window.location.href = "/sign-in";
      }
    };

    // Periodic check for inactivity
    const checkInterval = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem(STORAGE_KEY) || "0");
      const currentTime = Date.now();

      if (currentTime - lastActivity >= timeout) {
        clearInterval(checkInterval);
        handleLogout();
      }
    }, 10000); // Check every 10 seconds

    // Events to track user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetActivity);
    });
    window.addEventListener("storage", handleStorageEvent);

    // Cleanup
    return () => {
      clearInterval(checkInterval);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetActivity);
      });
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [handleLogout, timeout]);

  return null;
}
