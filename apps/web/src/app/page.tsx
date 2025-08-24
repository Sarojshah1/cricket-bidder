"use client";

import Link from "next/link";
import { Trophy, Users, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="relative min-h-[calc(100vh-64px)] bg-black text-white">
      {/* Background stadium vibe */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(253,224,71,0.10),transparent_35%)]" />

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-16 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs backdrop-blur">
          <Trophy className="h-4 w-4 text-yellow-300" />
          Live cricket auctions • Build your champion squad
        </div>
        <h1 className="text-pretty text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
          Cricket Bidder
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-white/80">
          Experience the thrill of real-time player auctions. Manage your budget, outbid opponents, and craft your dream XI.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/login">
            <Button className="gap-2 bg-gradient-to-r from-yellow-300 to-amber-300 text-black hover:from-yellow-200 hover:to-amber-200">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline">Learn More</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 container mx-auto px-4 pb-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center">
            <CardHeader>
              <Trophy className="mx-auto mb-2 h-12 w-12 text-yellow-300" />
              <CardTitle>Live Auctions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Participate in real-time player auctions</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="mx-auto mb-2 h-12 w-12 text-emerald-400" />
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Build and manage your cricket team</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <DollarSign className="mx-auto mb-2 h-12 w-12 text-green-400" />
              <CardTitle>Budget Control</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Spend wisely and outbid rivals</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="mx-auto mb-2 h-12 w-12 text-purple-400" />
              <CardTitle>Player Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Use insights to make smart bids</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Current Auctions Section (static mock) */}
      <section className="relative z-10 container mx-auto px-4 pb-16">
        <h2 className="mb-6 text-center text-3xl font-bold">Current Auctions</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[{title:'Mumbai Indians', tag:'Active'},{title:'Chennai Super Kings', tag:'Starting Soon'},{title:'Royal Challengers', tag:'Upcoming'}].map((r) => (
            <Card key={r.title}>
              <CardHeader>
                <p className="text-xs uppercase tracking-wide text-white/70">IPL 2024</p>
                <CardTitle className="mt-1">{r.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">High-stakes bidding for star players</CardDescription>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/80">{r.tag}</span>
                  <Link href="/login"><Button size="sm">Join Auction</Button></Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
 