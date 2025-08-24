export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  balance?: number;
}

export interface AuthData {
  user: User;
  token: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorShape {
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorShape;
}

export type AuthResponse = ApiSuccess<AuthData> | ApiErrorResponse;

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}
