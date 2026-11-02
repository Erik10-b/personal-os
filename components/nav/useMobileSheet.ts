"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnimationEvent, MouseEvent, PointerEvent, SyntheticEvent } from "react";

type Phase = "closed" | "open" | "closing";

export function useMobileSheet() {
  const sheetRef = useRef<HTMLDialogElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closingRef = useRef(false);
  const dragRef = useRef<{ id: number; startY: number; started: number; distance: number } | null>(null);
  const [phase, setPhase] = useState<Phase>("closed");
  const isOpen = phase !== "closed";

  const finishClose = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    closingRef.current = false;
    dragRef.current = null;
    const sheet = sheetRef.current;
    if (sheet?.open) sheet.close();
    sheet?.style.removeProperty("--sheet-offset");
    if (sheet) delete sheet.dataset.dragging;
    setPhase("closed");
  }, []);

  const closeSheet = useCallback(() => {
    if (!sheetRef.current?.open || closingRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishClose();
      return;
    }
    closingRef.current = true;
    setPhase("closing");
    // Also finish if the animation is interrupted by a browser or display change.
    timerRef.current = setTimeout(finishClose, 280);
  }, [finishClose]);

  const openSheet = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    closingRef.current = false;
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.style.removeProperty("--sheet-offset");
    if (!sheet.open) sheet.showModal();
    setPhase("open");
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousRoot = document.documentElement.style.overflow;
    const previousBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousRoot;
      document.body.style.overflow = previousBody;
    };
  }, [isOpen]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function resetDrag() {
    dragRef.current = null;
    const sheet = sheetRef.current;
    if (sheet) {
      delete sheet.dataset.dragging;
      sheet.style.setProperty("--sheet-offset", "0px");
    }
  }

  return {
    sheetRef,
    isOpen,
    openSheet,
    closeSheet,
    dialogProps: {
      "data-phase": phase,
      onClose: finishClose,
      onCancel: (event: SyntheticEvent<HTMLDialogElement>) => {
        event.preventDefault();
        closeSheet();
      },
      onClick: (event: MouseEvent<HTMLDialogElement>) => {
        if (event.target === event.currentTarget) closeSheet();
      },
      onAnimationEnd: (event: AnimationEvent<HTMLDialogElement>) => {
        if (event.target === event.currentTarget && event.animationName === "os-sheet-out") finishClose();
      },
    },
    dragProps: {
      onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
        if (closingRef.current || (event.pointerType === "mouse" && event.button !== 0)) return;
        dragRef.current = { id: event.pointerId, startY: event.clientY, started: performance.now(), distance: 0 };
        event.currentTarget.setPointerCapture(event.pointerId);
        if (sheetRef.current) sheetRef.current.dataset.dragging = "true";
      },
      onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.id !== event.pointerId) return;
        drag.distance = Math.max(0, event.clientY - drag.startY);
        sheetRef.current?.style.setProperty("--sheet-offset", `${drag.distance}px`);
      },
      onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.id !== event.pointerId) return;
        const velocity = drag.distance / Math.max(1, performance.now() - drag.started);
        if (sheetRef.current) delete sheetRef.current.dataset.dragging;
        dragRef.current = null;
        if (drag.distance > 72 || (drag.distance > 24 && velocity > .5)) closeSheet();
        else resetDrag();
      },
      onPointerCancel: resetDrag,
    },
  };
}