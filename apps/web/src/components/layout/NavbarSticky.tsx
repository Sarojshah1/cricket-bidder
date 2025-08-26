"use client";
import React from "react";
import Link from "next/link";
import { Avatar, Button } from "@nextui-org/react";

export default function NavbarSticky() {
  return (
    <header className="sticky top-0 z-40 bg-[#1B1F3B]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1B1F3B]/80 shadow">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FFD700] grid place-items-center text-black font-bold">🏏</div>
          <Link href="/" className="font-semibold tracking-wide">Cricket Bidder</Link>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="hover:text-[#00B894]">Home</Link>
          <Link href="/auction-rooms" className="hover:text-[#00B894]">Rooms</Link>
          <Link href="/players" className="hover:text-[#00B894]">Players</Link>
          <Link href="/leaderboard" className="hover:text-[#00B894]">Leaderboard</Link>
        </nav>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-[#00B894] text-black text-sm font-semibold">Wallet: ₹ 0 Lakh</div>
          <Button size="sm" variant="light" className="text-white hover:text-[#FFD700]">🔔</Button>
          <Avatar name="U" className="border border-white/20" />
        </div>
      </div>
    </header>
  );
}
