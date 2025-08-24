"use client"

import Link from "next/link"
import { useContext, useState } from "react"
import { AuthContext } from "../../components/auth-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Chrome, Eye, EyeOff, Loader2, Shield, Trophy, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const { register } = useContext(AuthContext)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [agree, setAgree] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)

    // Simple client-side validation
    const emailOk = /\S+@\S+\.\S+/.test(email)
    if (!emailOk) {
      setError("Invalid email address")
      return
    }
    if (!username) {
      setError("Username is required")
      return
    }
    const usernameOk = /^[a-zA-Z0-9_]{3,30}$/.test(username)
    if (!usernameOk) {
      setError("Username must be 3-30 chars and only letters, numbers, underscores")
      return
    }
    if (!password) {
      setError("Password is required")
      return
    }
    const passwordOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password)
    if (!passwordOk) {
      setError("Password must be 6+ chars with lowercase, uppercase, and a number")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    if (!agree) {
      setError("Please agree to the Terms and Privacy Policy.")
      return
    }

    setLoading(true)
    try {
      await register(email, username, password)
      // AuthProvider routes to /dashboard on success
    } catch (err: any) {
      setError(err?.message || "Registration failed")
      setLoading(false)
    }
  }

  return (
    <main className="relative grid min-h-[100svh] bg-black text-white md:grid-cols-2">
      {/* Left: Hero with cricket vibe */}
      <div className="relative hidden items-center justify-center md:flex">
        <img
           src="npl.png"
          alt="Cricket stadium at night with floodlights and crowd"
          className="absolute inset-0 h-full w-full object-contain opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-800/70 via-black/60 to-black/90" />
        {/* Glow accents */}
        <div className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-10 h-56 w-56 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-lg px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs backdrop-blur">
            <Trophy className="h-4 w-4 text-yellow-300" />
            {"Start with 100 Cr • Build a winning squad"}
          </div>
          <h1 className="text-pretty text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
            {"Join the League."}
            <br />
            <span className="text-yellow-300">{"Own the Auction."}</span>
          </h1>
          <p className="mt-4 text-white/80">
            Create your account to host rooms, invite friends, and bid in real-time.
          </p>
          <div className="mt-8 flex items-center gap-3 text-white/80">
            <Shield className="h-6 w-6 text-yellow-300" />
            <span className="font-medium">Cricket Bidder</span>
          </div>
        </div>
      </div>

      {/* Right: Register Card */}
      <div className="relative flex items-center justify-center px-4 py-10 md:px-8">
        {/* Subtle background pattern */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(253,224,71,0.10),transparent_35%)]" />

        <Card className="relative z-10 w-full max-w-md border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-300/90">
                <UserPlus className="h-5 w-5 text-black" />
              </div>
              <span className="text-lg font-semibold">Create account</span>
            </div>
            <CardTitle className="text-2xl">Get started</CardTitle>
            <CardDescription className="text-white/70">
              Register to create or join auction rooms
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
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
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  autoComplete="nickname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your cricket handle"
                  className="border-white/20 bg-white text-black placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
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

              <div className="grid gap-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="border-white/20 bg-white text-black placeholder:text-gray-500 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-900"
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    title={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
                  <Checkbox
                    checked={agree}
                    onCheckedChange={(v) => setAgree(Boolean(v))}
                    className="data-[state=checked]:bg-yellow-300 data-[state=checked]:text-black"
                  />
                  <span>
                    I agree to the{" "}
                    <a href="#" className="text-yellow-300 underline-offset-2 hover:underline">
                      Terms
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-yellow-300 underline-offset-2 hover:underline">
                      Privacy
                    </a>
                    .
                  </span>
                </label>
                <span className="text-xs text-white/60">No spam, ever.</span>
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-md border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                >
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
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-white/70">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-yellow-300 underline-offset-2 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
