"use client";
import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Chrome, Eye, EyeOff, Loader2, Shield } from "lucide-react";

export default function LoginCard() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const last = localStorage.getItem("cb:last-email");
    if (last) setEmail(last);
  }, []);

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    // Simple client-side validation
    const emailOk = /\S+@\S+\.\S+/.test(email);
    if (!emailOk) {
      setError("Invalid email address");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      if (remember) localStorage.setItem("cb:last-email", email);
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Login failed");
      setLoading(false);
    }
  }

  return (
    <Card className="relative z-10 w-full max-w-md border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-300/90">
            <Shield className="h-5 w-5 text-black" />
          </div>
          <span className="text-lg font-semibold">Cricket Bidder</span>
        </div>
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        {/* OAuth (placeholder) */}
        <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
            onClick={() => alert("OAuth placeholder. Connect real provider later.")}
          >
            <Chrome className="mr-2 h-4 w-4 text-yellow-300" />
            Continue with Google
          </Button>
        </div>

        <div className="relative">
          <Separator className="border-white/10" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%] bg-transparent px-2 text-xs text-white/60">
            or
          </span>
        </div>

        <form className="grid gap-4" onSubmit={onSubmit} noValidate>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="border-white/20 bg-white text-black placeholder:text-gray-500"
              required
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="text-xs text-yellow-300/90 underline-offset-2 hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="border-white/20 bg-white text-black placeholder:text-gray-500 pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-900"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-white/80">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(Boolean(v))}
                className="data-[state=checked]:bg-yellow-300 data-[state=checked]:text-black"
              />
              Remember me
            </label>
            <span className="text-xs text-white/60">Secure login</span>
          </div>

          {error && (
            <div role="alert" aria-live="polite" className="rounded-md border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="group relative mt-1 w-full gap-2 overflow-hidden bg-gradient-to-r from-yellow-300 to-amber-300 text-black hover:from-yellow-200 hover:to-amber-200"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-white/70">
          New here?{" "}
          <Link href="/register" className="font-medium text-yellow-300 underline-offset-2 hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
