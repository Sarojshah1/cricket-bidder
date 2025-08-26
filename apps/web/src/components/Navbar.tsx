'use client';

import { Button } from '@nextui-org/react';
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

export default function AppNavbar() {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      pathname === href
        ? 'bg-white/15 text-white'
        : 'text-white/85 hover:text-white hover:bg-white/10'
    }`;

  return (
    <nav className="sticky top-0 z-50">
      <div className="backdrop-blur-md bg-black/20 shadow-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="inline-block w-6 h-6 rounded-full bg-trophy-gold" />
            <span>Cricket Bidder</span>
          </Link>
          <div className="hidden md:flex items-center gap-2">
            <Link href="/" className={linkClass('/')}>Home</Link>
            <Link href="/auction-rooms" className={linkClass('/auction-rooms')}>Auction Rooms</Link>
            <Link href="/players-list" className={linkClass('/players-list')}>Players List</Link>
            <Link href="/login">
              <Button size="sm" className="bg-trophy-gold text-black font-semibold shadow hover:opacity-90">Login</Button>
            </Link>
          </div>
          <button aria-label="Menu" className="md:hidden text-white/90 hover:text-white">
            <Menu size={22} />
          </button>
        </div>
      </div>
    </nav>
  );
}