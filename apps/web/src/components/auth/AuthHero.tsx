"use client";
import { Shield, Trophy } from "lucide-react";
import React from "react";

interface AuthHeroProps {
  imageSrc?: string;
  imageAlt?: string;
}

export function AuthHero({ imageSrc = "/placeholder.svg?height=1600&width=1200", imageAlt = "Cricket stadium at night" }: AuthHeroProps) {
  return (
    <div className="relative hidden items-center justify-center md:flex">
      <img
        src={imageSrc}
        alt={imageAlt}
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
          {"Build Your Dream Team."}
          <br />
          <span className="text-yellow-300">{"Win the Auction."}</span>
        </h1>
        <p className="mt-4 text-white/80">
          Real-time bidding. Live leaderboards. Smart team strength scoring.
        </p>
        <div className="mt-8 flex items-center gap-3 text-white/80">
          <Shield className="h-6 w-6 text-yellow-300" />
          <span className="font-medium">Cricket Bidder</span>
        </div>
      </div>
    </div>
  );
}

export default AuthHero;
