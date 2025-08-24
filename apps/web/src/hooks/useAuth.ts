"use client";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { loginService, registerService, profileService } from "@/services/auth";
import { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth";

export function useLogin() {
  return useMutation((payload: LoginPayload) => loginService(payload));
}

export function useRegister() {
  return useMutation((payload: RegisterPayload) => registerService(payload));
}

export function useProfile(enabled = false) {
  return useQuery(["profile"], () => profileService(), { enabled });
}

export function useAuthBootstrap() {
  const qc = useQueryClient();
  return async function bootstrap(auth: AuthResponse) {
    if (auth.success) {
      localStorage.setItem("token", auth.data.token);
      localStorage.setItem("email", auth.data.user.email);
      await qc.invalidateQueries(["profile"]);
    }
  };
}
