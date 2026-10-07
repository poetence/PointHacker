"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard focus for the picker dialogs: on open, focus moves into the panel
 * (to a `data-autofocus` element if there is one, else the first control —
 * but never a text field on a touch screen, where that pops the keyboard);
 * Tab and Shift+Tab wrap around inside it; on close, focus goes back to the
 * button that opened it. Without this a keyboard user was left behind the
 * backdrop, tabbing through the page they could no longer see.
 *
 * Escape stays with each dialog, since closing is the caller's state.
 */
export function useDialogFocus(
  isOpen: boolean,
  panelRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const panel = panelRef.current;
    // The trigger stays mounted while the dialog is open, so grab it now.
    const trigger = triggerRef.current;
    if (!isOpen || !panel) return;

    let initial =
      panel.querySelector<HTMLElement>("[data-autofocus]") ??
      panel.querySelector<HTMLElement>(FOCUSABLE) ??
      panel;
    // On touch screens, focusing a text field opens the keyboard over half the
    // picker before the user has asked to type, so land on the panel instead.
    const typesText = initial instanceof HTMLInputElement || initial instanceof HTMLTextAreaElement;
    if (typesText && window.matchMedia("(pointer: coarse)").matches) {
      initial = panel;
    }
    initial.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !panel) return;

      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const outside = !panel.contains(active);

      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [isOpen, panelRef, triggerRef]);
}
