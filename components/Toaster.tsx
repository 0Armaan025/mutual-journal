"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Toast = { id: number; message: string; error?: boolean };
type ToastCtx = { toast: (message: string, error?: boolean) => void };

const Ctx = createContext<ToastCtx>({ toast: () => {} });

let seq = 0;

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, error?: boolean) => {
      const id = ++seq;
      setToasts((prev) => [...prev, { id, message, error }]);
      setTimeout(() => remove(id), error ? 4000 : 2400);
    },
    [remove]
  );

  return (
    <Ctx.Provider value={{ toast: push }}>
      {children}
      <ToastList toasts={toasts} />
    </Ctx.Provider>
  );
}

function ToastList({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast${t.error ? " err" : ""}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  return useContext(Ctx).toast;
}
