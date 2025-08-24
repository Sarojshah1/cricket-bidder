"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import io, { Socket } from "socket.io-client";
import { Button, Card, CardBody, CardHeader, Input, Chip, Avatar, Divider, Badge, Progress, Select, SelectItem } from "@nextui-org/react";
import { useRouter } from "next/navigation";

// Types
interface Player {
  _id: string;
  name: string;
  team: string;
  stats?: string;
  role?: string;
  nationality?: string;
  basePrice?: number;
}
interface Bid {
  amount: number;
  user: string;
  timestamp: string;
}
interface ChatMessage {
  username: string;
  message: string;
  timestamp: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

// Helpers
const toLakh = (rupees?: number) => {
  if (!rupees || rupees <= 0) return "—";
  const lakh = Math.round(rupees / 100000);
  return `₹ ${lakh} Lakh`;
};

function classNames(...cls: Array<string | false | undefined>) {
  return cls.filter(Boolean).join(" ");
}

export default function AuctionRoom() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [bidAmount, setBidAmount] = useState(0);
  const [chatMsg, setChatMsg] = useState("");
  const [timer, setTimer] = useState(30);
  const [username, setUsername] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Prompt for username (for demo)
    let uname = window.localStorage.getItem("username");
    if (!uname) {
      uname = prompt("Enter your username:") || "Guest";
      window.localStorage.setItem("username", uname);
    }
    setUsername(uname);
  }, []);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      auth: { token: window.localStorage.getItem("token") },
      transports: ["websocket"],
    });
    setSocket(s);
    s.on("connect", () => {
      s.emit("join-auction-room", { username });
    });
    s.on("players-list", (data: Player[]) => setPlayers(data));
    s.on("current-player", (data: Player) => setCurrentPlayer(data));
    s.on("bid-history", (data: Bid[]) => setBids(data));
    s.on("auction-timer", (data: number) => setTimer(data));
    s.on("chat-messages", (data: ChatMessage[]) => setChat(data));
    s.on("new-bid", (bid: Bid) => setBids(prev => [...prev, bid]));
    s.on("chat-message", (msg: ChatMessage) => setChat(prev => [...prev, msg]));
    return () => { s.disconnect(); };
  }, [username]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter(p => {
      const matchesQ = !q || p.name.toLowerCase().includes(q) || (p.team ?? "").toLowerCase().includes(q);
      const matchesRole = !roleFilter || (p.role?.toLowerCase() === roleFilter.toLowerCase());
      return matchesQ && matchesRole;
    });
  }, [players, search, roleFilter]);

  const handleBid = () => {
    if (!socket || !currentPlayer) return;
    socket.emit("place-bid", { playerId: currentPlayer._id, amount: bidAmount, username });
    setBidAmount(0);
  };

  const handleSendChat = () => {
    if (!socket || !chatMsg.trim()) return;
    socket.emit("chat-message", { message: chatMsg, username });
    setChatMsg("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-fuchsia-50 flex flex-col items-center py-8">
      <div className="w-full max-w-6xl px-3 md:px-0">
        {/* Header */}
        <Card className="mb-6 shadow-lg border border-white/60 bg-white/70 backdrop-blur">
          <CardHeader className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">IPL 2025 Live Auction</h2>
              <p className="text-gray-500">Bid for your favorite players in real time</p>
            </div>
            <div className="flex items-center gap-3">
              <Chip color="success" variant="flat">LIVE</Chip>
              <div className="w-40">
                <div className="text-xs text-gray-500 mb-1">Lot Timer</div>
                <Progress aria-label="Auction Timer" value={Math.max(0, (timer/30)*100)} color="warning" className="bg-orange-50" />
                <div className="text-right text-sm font-medium text-gray-700 mt-1">{timer}s</div>
              </div>
              <Button color="danger" variant="flat" onClick={() => router.push("/")}>Exit</Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Auction Player & Bidding */}
          <Card className="md:col-span-2 shadow-lg border border-white/60 bg-white/80 backdrop-blur">
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Current Player</h3>
              {currentPlayer?.role && (
                <Badge color="primary" variant="flat">{currentPlayer.role}</Badge>
              )}
            </CardHeader>
            <CardBody>
              {currentPlayer ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <Avatar size="lg" name={currentPlayer.name} className="text-3xl shadow" />
                  <div className="w-full">
                    <h4 className="text-lg md:text-2xl font-bold">{currentPlayer.name}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      <Chip size="sm" variant="flat">Team: {currentPlayer.team}</Chip>
                      {currentPlayer.nationality && <Chip size="sm" variant="flat">{currentPlayer.nationality}</Chip>}
                      {typeof currentPlayer.basePrice === "number" && <Chip size="sm" color="warning" variant="flat">Base: {toLakh(currentPlayer.basePrice)}</Chip>}
                    </div>
                    {currentPlayer.stats && <p className="text-gray-500 mt-2 text-sm">{currentPlayer.stats}</p>}
                  </div>
                  <div className="md:ml-auto w-full md:w-auto">
                    <div className="text-xs text-gray-500 mb-1">Place your bid</div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={Number.isNaN(bidAmount) ? "" : bidAmount.toString()}
                        onChange={e => setBidAmount(Number(e.target.value))}
                        min={0}
                        placeholder="Amount (₹ Lakh)"
                        className="w-36"
                      />
                      <Button color="success" onClick={handleBid}>Bid</Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[5,10,25,50].map(inc => (
                        <Button key={inc} size="sm" variant="flat" onClick={() => setBidAmount((prev) => (Number(prev)||0) + inc)}>+{inc}L</Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : <p>No player up for auction right now.</p>}
              <Divider className="my-4" />
              <h4 className="text-md font-semibold mb-2">Bid History</h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {bids.length ? bids.map((bid, i) => (
                  <div key={i} className={classNames("flex items-center justify-between rounded-md border px-3 py-2",
                    i % 2 === 0 ? "bg-white/60" : "bg-white/40")}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={bid.user} size="sm" className="text-xs" />
                      <span className="font-medium text-gray-800">{bid.user}</span>
                    </div>
                    <span className="font-semibold text-emerald-700">₹ {bid.amount} Lakh</span>
                    <span className="text-xs text-gray-500">{new Date(bid.timestamp).toLocaleTimeString()}</span>
                  </div>
                )) : <p className="text-gray-500">No bids yet.</p>}
              </div>
            </CardBody>
          </Card>
          {/* Chat */}
          <Card className="h-full flex flex-col shadow-lg border border-white/60 bg-white/80 backdrop-blur">
            <CardHeader>
              <h3 className="text-xl font-semibold">Live Chat</h3>
            </CardHeader>
            <CardBody className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                {chat.map((msg, i) => (
                  <div key={i} className="rounded-lg border bg-white/60 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={msg.username} size="sm" className="text-xs" />
                      <span className="font-semibold text-blue-700">{msg.username}</span>
                      <span className="ml-auto text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="mt-1 text-gray-700">{msg.message}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={e => e.key === "Enter" && handleSendChat()}
                />
                <Button color="primary" onClick={handleSendChat}>Send</Button>
              </div>
            </CardBody>
          </Card>
        </div>
        {/* Players List */}
        <Card className="mt-8 shadow-lg border border-white/60 bg-white/80 backdrop-blur">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Players List</h3>
              <p className="text-gray-500 text-sm">Browse and search all available players</p>
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or team" className="w-full md:w-64"/>
              <Select
                selectedKeys={roleFilter ? [roleFilter] : []}
                onChange={e => setRoleFilter(e.target.value || null)}
                placeholder="Role"
                className="w-40"
              >
                {['BATTER','BOWLER','ALL-ROUNDER','WICKETKEEPER'].map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </Select>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredPlayers.length ? filteredPlayers.map((player) => (
                <div key={player._id} className="p-3 border rounded-xl bg-white/70 backdrop-blur shadow-sm flex flex-col items-center hover:shadow-md transition">
                  <Avatar name={player.name} className="mb-2" />
                  <div className="text-center">
                    <h4 className="font-semibold">{player.name}</h4>
                    <div className="mt-1 flex items-center justify-center gap-2">
                      <Chip size="sm" variant="flat">{player.team}</Chip>
                      {player.role && <Chip size="sm" color="primary" variant="flat">{player.role}</Chip>}
                    </div>
                    {typeof player.basePrice === "number" && (
                      <div className="mt-1 text-xs text-amber-700 font-medium">Base {toLakh(player.basePrice)}</div>
                    )}
                    {player.stats && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{player.stats}</p>}
                  </div>
                </div>
              )) : <p className="text-gray-500">No players available.</p>}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
