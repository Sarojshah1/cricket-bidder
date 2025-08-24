"use client";
import React, { createContext } from "react";
import { loginService } from "@/services/auth";
import { registerService } from "@/services/auth";
import type { LoginPayload, RegisterPayload } from "@/types/auth";

interface AuthValue {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthValue>({
  login: async (email: string, password: string) => {
    const payload: LoginPayload = { email, password };
    const res = await loginService(payload);
    if (res.success) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("email", res.data.user.email);
      window.location.href = "/dashboard";
      return;
    }
    throw new Error(res.error?.message || "Login failed");
  },
  register: async (email: string, username: string, password: string) => {
    const payload: RegisterPayload = { email, username, password } as RegisterPayload;
    const res = await registerService(payload);
    if (res.success) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("email", res.data.user.email);
      window.location.href = "/dashboard";
      return;
    }
    throw new Error(res.error?.message || "Registration failed");
  },
});

export default AuthContext;
