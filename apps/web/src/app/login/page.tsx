"use client"

import { Trophy } from 'lucide-react'
import AuthHero from "@/components/auth/AuthHero"
import LoginCard from "@/components/auth/LoginCard"

export default function LoginPage() {
  return (
    <main className="relative grid min-h-[100svh] bg-black text-white md:grid-cols-2">
      {/* Left: Hero with cricket vibe */}
      <AuthHero imageSrc="ipl.png" imageAlt="Cricket stadium at night" />

      {/* Right: Auth Card */}
      <div className="relative flex items-center justify-center px-4 py-10 md:px-8">
        {/* Subtle background pattern */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(253,224,71,0.10),transparent_35%)]" />

        <div className="relative z-10 w-full max-w-md">
          <LoginCard />
        </div>
      </div>
    </main>
  )
}
