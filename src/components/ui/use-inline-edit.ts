"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Edit mode for a row whose Edit button is swapped out for an inline form.
 * Unmounting the focused button drops keyboard focus to <body>, so this moves
 * it on purpose: into the form's first field on open, and back to the Edit
 * button after Save or Cancel. Nothing moves on first render.
 */
export function useInlineEdit<Editor extends HTMLElement>() {
  const [isEditing, setIsEditingState] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<Editor>(null);
  const hasToggled = useRef(false);

  useEffect(() => {
    if (!hasToggled.current) return;
    if (isEditing) {
      editorRef.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
    } else {
      editButtonRef.current?.focus();
    }
  }, [isEditing]);

  function setIsEditing(next: boolean) {
    hasToggled.current = true;
    setIsEditingState(next);
  }

  return { isEditing, setIsEditing, editButtonRef, editorRef };
}
