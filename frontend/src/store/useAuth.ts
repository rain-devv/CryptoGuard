import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Operation {
  id: string;
  type: "encrypt" | "decrypt" | "steganography" | "extract";
  label: string;
  timestamp: Date;
  success: boolean;
}

interface AuthState {
  isLoggedIn: boolean;
  username: string;
  operations: Operation[];
  lastActivity: number;
  login: (username: string, password: string) => Promise<{ success: boolean; error: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error: string }>;
  logout: () => void;
  updateActivity: () => void;
  checkAutoLogout: () => void;
  addOperation: (op: Omit<Operation, "id" | "timestamp">) => void;
}

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const API_BASE = "http://127.0.0.1:8000/api/users";

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      username: "",
      operations: [],
      lastActivity: Date.now(),

      // ── تسجيل الدخول عبر الباك엔드 ──────────────────────────
      login: async (username: string, password: string) => {
        try {
          const res = await fetch(`${API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.detail || "خطأ في تسجيل الدخول" };
          }
          set({ isLoggedIn: true, username: data.username, lastActivity: Date.now() });
          return { success: true, error: "" };
        } catch {
          return { success: false, error: "تعذر الاتصال بالخادم. تأكد من تشغيل الباك إند." };
        }
      },

      // ── إنشاء حساب عبر الباك엔드 ─────────────────────────────
      register: async (username: string, password: string) => {
        try {
          const res = await fetch(`${API_BASE}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.detail || "خطأ في إنشاء الحساب" };
          }
          set({ isLoggedIn: true, username: data.username, lastActivity: Date.now() });
          return { success: true, error: "" };
        } catch {
          return { success: false, error: "تعذر الاتصال بالخادم. تأكد من تشغيل الباك إند." };
        }
      },

      // ── تسجيل الخروج ─────────────────────────────────────────
      logout: () => set((state) => ({
        isLoggedIn: false,
        username: "",
        operations: state.operations,
      })),

      updateActivity: () => set({ lastActivity: Date.now() }),

      checkAutoLogout: () => {
        const { isLoggedIn, lastActivity, logout } = get();
        if (isLoggedIn && Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
          logout();
        }
      },

      addOperation: (op) => {
        const newOp: Operation = {
          ...op,
          id: Math.random().toString(36).slice(2),
          timestamp: new Date(),
        };
        set((state) => ({
          operations: [newOp, ...state.operations].slice(0, 50),
          lastActivity: Date.now(),
        }));
      },
    }),
    {
      name: "cryptoguard-auth",
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        username: state.username,
        operations: state.operations,
        lastActivity: state.lastActivity,
      }),
    }
  )
);
