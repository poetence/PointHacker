"use client";

import { useEffect } from "react";

/**
 * Asks before a reload, tab close or off-site navigation would throw away a
 * half-filled form. In-app <Link> navigation isn't covered: the App Router
 * has no route-change guard to hook, and beforeunload doesn't fire for it.
 */
export function useWarnOnLeave(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);
}
