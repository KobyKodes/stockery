"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

// One quiet line of text that appears after an action and leaves on its own.
// It is a polite live region so screen readers hear "Saved" too.

type Toast = { id: number; text: string; tone: "plain" | "error" };
type ToastApi = { toast: (text: string, tone?: Toast["tone"]) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const toast = useCallback((text: string, tone: Toast["tone"] = "plain") => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    timers.current.set(
      id,
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
        timers.current.delete(id);
      }, 3200),
    );
  }, []);

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach(clearTimeout);
  }, []);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex flex-col items-center gap-2 px-4 desk:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              t.tone === "error"
                ? "rounded-control border-s-[3px] border-bay-red bg-paper px-4 py-3 text-base shadow-sheet"
                : "rounded-control bg-stencil px-4 py-3 text-base text-paper shadow-sheet"
            }
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
