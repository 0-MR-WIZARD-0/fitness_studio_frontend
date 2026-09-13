"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { accountMe, type AccountUser } from "@/lib/api";
import { AccountAuthForm } from "./AccountAuthForm";

interface AccountCtx {
  user: AccountUser | null | undefined;
  loading: boolean;
  setUser: (user: AccountUser | null) => void;
  refresh: () => void;
  openAuth: (mode?: "login" | "register") => void;
}

const Ctx = createContext<AccountCtx | null>(null);

export function useAccount(): AccountCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAccount вне AccountProvider");
  return ctx;
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AccountUser | null | undefined>(undefined);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);

  const refresh = useCallback(() => {
    accountMe()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!authMode) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [authMode]);

  return (
    <Ctx.Provider
      value={{
        user,
        loading: user === undefined,
        setUser,
        refresh,
        openAuth: (mode = "login") => setAuthMode(mode),
      }}
    >
      {children}
      {authMode && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto overlay-dim backdrop-blur-sm p-4"
          onClick={() => setAuthMode(null)}
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-sub text-xl text-heading">Личный кабинет</p>
              <button
                onClick={() => setAuthMode(null)}
                className="text-2xl leading-none text-text/60 hover:text-heading"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <AccountAuthForm
              initialMode={authMode}
              className="mt-0"
              onSuccess={(u) => {
                setUser(u);
                setAuthMode(null);
              }}
            />
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
