"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { useDialogFocus } from "./use-dialog-focus";

/**
 * The modal shell the picker dialogs share: a dimmed backdrop that closes on
 * click, a scrolling panel, Escape to close, and useDialogFocus's focus
 * handling. Render it only while the picker is open; unmounting is what hands
 * focus back to `triggerRef`.
 */
export function PickerDialog({
  label,
  triggerRef,
  onClose,
  children,
}: {
  label: string;
  triggerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(true, panelRef, triggerRef);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="flex max-h-[80vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto overscroll-contain rounded-lg bg-white p-6 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
