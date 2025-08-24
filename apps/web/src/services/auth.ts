import api, { extractApiError } from "@/lib/api";
import { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth";

export async function loginService(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  } catch (err) {
    return { success: false, error: { message: extractApiError(err) } };
  }
}

export async function registerService(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  } catch (err) {
    return { success: false, error: { message: extractApiError(err) } };
  }
}

export async function profileService() {
  const { data } = await api.get("/auth/profile");
  return data;
}
