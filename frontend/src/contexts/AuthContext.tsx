"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "@/lib/api";

export type AppRole = "client" | "provider" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
}

interface AuthContextType {
  user: AuthUser | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: string | null; role?: AppRole }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: AppRole }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => {
        setUser({ ...data, id: String(data.id) });
      })
      .catch(() => {
        localStorage.removeItem("auth_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null; role?: AppRole }> => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("auth_token", data.token);
      setUser({ ...data.user, id: String(data.user.id) });
      return { error: null, role: data.user.role as AppRole };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      return { error: message ?? "შეცდომა. სცადეთ თავიდან." };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: AppRole,
  ): Promise<{ error: string | null; role?: AppRole }> => {
    try {
      const { data } = await api.post("/auth/register", {
        name: fullName,
        email,
        password,
        password_confirmation: password,
        role,
      });
      localStorage.setItem("auth_token", data.token);
      setUser({ ...data.user, id: String(data.user.id) });
      return { error: null, role: data.user.role as AppRole };
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response?.data;
      if (response?.errors) {
        const first = Object.values(response.errors)[0] as string[];
        return { error: first[0] };
      }
      return { error: response?.message ?? "შეცდომა. სცადეთ თავიდან." };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
      // token may already be invalid
    }
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      await api.post("/auth/forgot-password", { email });
      return { error: null };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      return { error: message ?? "შეცდომა. სცადეთ თავიდან." };
    }
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
