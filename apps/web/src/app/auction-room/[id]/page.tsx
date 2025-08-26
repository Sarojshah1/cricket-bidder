"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input, Chip, Avatar, Divider, Badge, Spinner } from "@nextui-org/react";
import { createSocket } from "@/lib/socket";
import { getRoom, getBidHistory, joinRoomAsUser, startAuction, type AuctionRoom } from "@/services/auctionRooms";
import type { Socket } from "socket.io-client";
import CircularTimer from "@/components/auction/CircularTimer";
import BidsLeaderboard from "@/components/auction/BidsLeaderboard";

interface BidHistoryItem {
  playerId: string;
  amount: number;
  teamId: string;
  bidderId: string;
  bidderName?: string;
  roomId?: string;
  timestamp: string;
}

interface CurrentPlayer {
  _id: string;
  name: string;
  role?: string;
  basePrice?: number;
  stats?: any;
  age?: number;
  nationality?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  imageUrl?: string;
}

export default function AuctionRoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const router = useRouter();

  const [socketReady, setSocketReady] = useState(false);
  const [timer, setTimer] = useState(30);
  const [room, setRoom] = useState<AuctionRoom | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<CurrentPlayer | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [history, setHistory] = useState<BidHistoryItem[]>([]);
  const [chatMsg, setChatMsg] = useState("");
  const [chat, setChat] = useState<{ username: string; message: string; timestamp: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [meUserId, setMeUserId] = useState<string | null>(null);
  const [meRole, setMeRole] = useState<string | null>(null);
  const [meName, setMeName] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Load initial room and history
  useEffect(() => {
    if (!roomId) return;
    // Reset view to avoid flashing previous room data
    setRoom(null as any);
    setCurrentPlayer(null);
    setHistory([]);
    setChat([]);
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [r, h] = await Promise.all([getRoom(roomId), getBidHistory(roomId)]);
        setRoom(r);
        // populate current player from initial room load if present
        const anyR: any = r as any;
        if (anyR?.currentPlayer?._id) {
          setCurrentPlayer({
            _id: anyR.currentPlayer._id,
            name: anyR.currentPlayer.name,
            role: anyR.currentPlayer.role,
            basePrice: anyR.currentPlayer.basePrice,
            stats: anyR.currentPlayer.stats,
            age: anyR.currentPlayer.age,
            nationality: anyR.currentPlayer.nationality,
            battingStyle: anyR.currentPlayer.battingStyle,
            bowlingStyle: anyR.currentPlayer.bowlingStyle,
            imageUrl: anyR.currentPlayer.imageUrl,
          });
        }
        setHistory(Array.isArray(h) ? h.map((e: any) => ({ ...e, roomId })) : []);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to load room");
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId]);

  // Socket wiring
  useEffect(() => {
    if (!roomId) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;
    // decode my user id for membership checks
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        const id = payload?.userId || payload?.id || payload?._id || null;
        setMeUserId(typeof id === "string" ? id : null);
        const role = payload?.role || payload?.userRole || null;
        setMeRole(typeof role === "string" ? role : null);
        const nameGuess = payload?.username || payload?.name || payload?.email || null;
        setMeName(typeof nameGuess === "string" ? nameGuess : null);
      } catch {}
    }
    const s = createSocket(token);
    socketRef.current = s;

    s.on("connect", () => {
      s.emit("join-room", { roomId });
      setSocketReady(true);
    });

    // Timer ticks
    s.on("bid-timer", (data: { timeLeft: number }) => setTimer(data.timeLeft));

    // New bid
    s.on("new-bid", (data: { roomId?: string; playerId: string; amount: number; teamId: string; bidderName: string; timestamp: string }) => {
      if (data?.roomId && String(data.roomId) !== String(roomId)) return; // ignore other rooms
      setHistory((prev) => [
        ...prev,
        {
          playerId: data.playerId,
          amount: data.amount,
          teamId: data.teamId,
          bidderId: String(data.teamId),
          bidderName: data.bidderName,
          roomId: String(roomId),
          timestamp: data.timestamp || new Date().toISOString(),
        },
      ]);
    });

    // Auction started payload can include room and currentPlayer
    s.on("auction-started", (payload: { room: AuctionRoom; currentPlayer: CurrentPlayer }) => {
      const payloadRoomId: any = (payload as any)?.room?._id || (payload as any)?.room?.id;
      if (payloadRoomId && String(payloadRoomId) !== String(roomId)) return; // ignore other rooms
      setRoom(payload.room);
      setCurrentPlayer(payload.currentPlayer);
      setStarting(false);
    });

    // Player sold -> move to next current player
    s.on("player-sold", async (payload: { prevPlayerId: string; soldTo?: string; soldPrice?: number; nextPlayerId?: string }) => {
      try {
        if (!roomId) return;
        const fresh = await getRoom(roomId);
        setRoom(fresh);
        const anyFresh: any = fresh as any;
        if (anyFresh?.currentPlayer?._id) {
          setCurrentPlayer({
            _id: anyFresh.currentPlayer._id,
            name: anyFresh.currentPlayer.name,
            role: anyFresh.currentPlayer.role,
            basePrice: anyFresh.currentPlayer.basePrice,
            stats: anyFresh.currentPlayer.stats,
            age: anyFresh.currentPlayer.age,
            nationality: anyFresh.currentPlayer.nationality,
            battingStyle: anyFresh.currentPlayer.battingStyle,
            bowlingStyle: anyFresh.currentPlayer.bowlingStyle,
            imageUrl: anyFresh.currentPlayer.imageUrl,
          });
        } else {
          setCurrentPlayer(null);
        }
        // reset local bid state for next player
        setHistory([]);
        setBidAmount(0);
      } catch (e) {
        // ignore
      }
    });

    // Auction completed
    s.on("auction-completed", () => {
      setCurrentPlayer(null);
      setTimer(0);
      setError(null);
      // Optionally navigate to rankings or show a toast
    });

    // Generic socket error handler to surface start/bid errors
    s.on("error", (err: any) => {
      if (err?.message) setError(err.message);
      setStarting(false);
    });

    // Chat (filter by room)
    s.on("chat-message", (msg: { roomId?: string; username: string; message: string; createdAt?: string }) => {
      if (msg?.roomId && String(msg.roomId) !== String(roomId)) return;
      setChat((prev) => [
        ...prev,
        { username: msg.username, message: msg.message, timestamp: msg.createdAt || new Date().toISOString() }
      ]);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  // Only show bids for the current player
  const visibleHistory = useMemo(() => {
    if (!currentPlayer) return [] as BidHistoryItem[];
    return history.filter(h => (
      (!h.roomId || String(h.roomId) === String(roomId)) &&
      String(h.playerId) === String(currentPlayer._id)
    ));
  }, [history, currentPlayer, roomId]);

  const lastBid = useMemo(() => visibleHistory.length ? visibleHistory[visibleHistory.length - 1] : null, [visibleHistory]);
  const toLakh = (n?: number) => (typeof n === "number" ? `₹ ${Math.round(n / 100000)} Lakh` : "—");

  const isMember = useMemo(() => {
    if (!room || !meUserId) return false;
    const anyRoom: any = room as any;
    const teams: any[] | undefined = anyRoom?.teams;
    if (!Array.isArray(teams)) return false;
    // membership: user owns a team that is part of this room
    return teams.some((t: any) => {
      if (!t) return false;
      // t can be an ObjectId or populated Team
      // When populated, check owner matches meUserId
      const owner = (t as any).owner;
      const ownerId = typeof owner === 'string' ? owner : (owner?._id || owner?.id);
      return ownerId && String(ownerId) === String(meUserId);
    });
  }, [room, meUserId]);

  const minInc = (room as any)?.minBidIncrement ?? 0;
  const canBid = socketReady && !!currentPlayer && !!roomId && (room as any)?.status === "active" && isMember;

  // Team label resolver for leaderboard (team username/name)
  const teamLabelOf = useMemo(() => {
    const anyRoom: any = room as any;
    const teams: any[] = Array.isArray(anyRoom?.teams) ? anyRoom.teams : [];
    const cache = new Map<string, string>();
    const resolve = (id: any): string => {
      const key = String(id ?? "");
      if (!key) return "—";
      if (cache.has(key)) return cache.get(key)!;
      const tm = teams.find((t: any) => String(t?._id || t?.id || t) === key);
      const label = tm?.teamName || tm?.username || tm?.name || tm?.displayName || tm?.email || (key ? key.slice(0, 6) + "…" : "—");
      cache.set(key, label);
      return label;
    };
    return resolve;
  }, [room]);

  // Prefill input for first bid on new player
  useEffect(() => {
    if (!currentPlayer) return;
    if (!lastBid && typeof currentPlayer.basePrice === 'number') {
      setBidAmount(currentPlayer.basePrice);
    }
  }, [currentPlayer, lastBid]);

  // Teams list for display
  const teamsList = useMemo(() => {
    const anyRoom: any = room as any;
    const teams: any[] = Array.isArray(anyRoom?.teams) ? anyRoom.teams : [];
    const players: any[] = Array.isArray(anyRoom?.players) ? anyRoom.players : [];
    // Build index of sold players by teamId
    const byTeam = new Map<string, Array<{ _id: string; name: string; role?: string; price?: number; stats?: any }>>();
    players.forEach((p: any) => {
      if (p?.isSold && p?.soldTo) {
        const key = String(p.soldTo);
        const arr = byTeam.get(key) || [];
        arr.push({ _id: String(p._id || ''), name: p.name, role: p.role, price: p.soldPrice, stats: p.stats });
        byTeam.set(key, arr);
      }
    });
    return teams.map((t: any) => {
      const owner = t?.owner;
      const ownerId = typeof owner === 'string' ? owner : (owner?._id || owner?.id);
      const idStr = String(t?._id || '');
      return {
        _id: idStr,
        name: t?.name || t?.teamName || '—',
        remainingBudget: typeof t?.remainingBudget === 'number' ? t.remainingBudget : undefined,
        budget: typeof t?.budget === 'number' ? t.budget : undefined,
        isMine: ownerId && meUserId ? String(ownerId) === String(meUserId) : false,
        players: byTeam.get(idStr) || [],
      };
    });
  }, [room, meUserId]);

  const isAdmin = meRole === "admin";

  // Auto-join silently when connected and not a member
  useEffect(() => {
    const shouldJoin = !!roomId && socketReady && room && !isMember && (room as any)?.status && ["waiting", "active"].includes((room as any).status);
    if (!shouldJoin || joining) return;
    (async () => {
      try {
        setJoining(true);
        const updated = await joinRoomAsUser(roomId as string);
        setRoom(updated);
        // now that membership exists, join the socket room
        try { socketRef.current?.emit("join-room", { roomId }); } catch {}
      } catch {
        // ignore
      } finally {
        setJoining(false);
      }
    })();
  }, [roomId, socketReady, room, isMember, joining]);

  const handleStartAuction = async () => {
    if (!roomId || starting) return;
    setError(null);
    setStarting(true);
    try {
      if (socketReady) {
        socketRef.current?.emit("start-auction", { roomId });
        // Wait for auction-started event to update UI
      } else {
        // Fallback to REST; admin-only
        const updated = await startAuction(roomId);
        setRoom(updated);
        // Immediately refetch to get populated currentPlayer from GET /auction-rooms/:id
        try {
          const fresh = await getRoom(roomId);
          setRoom(fresh);
          const anyFresh: any = fresh as any;
          if (anyFresh?.currentPlayer?._id) {
            setCurrentPlayer({
              _id: anyFresh.currentPlayer._id,
              name: anyFresh.currentPlayer.name,
              role: anyFresh.currentPlayer.role,
              basePrice: anyFresh.currentPlayer.basePrice,
              stats: anyFresh.currentPlayer.stats,
              age: anyFresh.currentPlayer.age,
              nationality: anyFresh.currentPlayer.nationality,
              battingStyle: anyFresh.currentPlayer.battingStyle,
              bowlingStyle: anyFresh.currentPlayer.bowlingStyle,
              imageUrl: anyFresh.currentPlayer.imageUrl,
            });
          }
        } catch {}
        setStarting(false);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to start auction");
      setStarting(false);
    }
  };

  const handleBid = () => {
    if (!socketReady || !currentPlayer || !roomId) return;
    const basePrice = typeof currentPlayer.basePrice === 'number' ? currentPlayer.basePrice : 0;
    const minAllowed = lastBid ? (lastBid.amount + (typeof minInc === 'number' ? minInc : 0)) : basePrice;
    const typed = Number(bidAmount);
    const hasTyped = Number.isFinite(typed) && typed > 0;
    const amount = hasTyped ? Math.max(typed, minAllowed) : minAllowed;
    socketRef.current?.emit("place-bid", { roomId, playerId: currentPlayer._id, amount });
    setBidAmount(amount);
  };

  const handleQuickBid = (delta: number) => {
    const baseFrom = lastBid?.amount ?? (typeof currentPlayer?.basePrice === 'number' ? currentPlayer!.basePrice : 0);
    const next = baseFrom + Math.max(delta, minInc || 0);
    setBidAmount(next);
  };

  const handleJoin = async () => {
    if (!roomId || joining) return;
    setJoining(true);
    setError(null);
    try {
      const updated = await joinRoomAsUser(roomId);
      setRoom(updated);
      // ensure socket joins the room after successful membership
      try { socketRef.current?.emit("join-room", { roomId }); } catch {}
    } catch (e: any) {
      setError(e?.message || "Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  const handleSendChat = () => {
    if (!socketReady || !roomId || !chatMsg.trim()) return;
    socketRef.current?.emit("chat-message", { roomId, message: chatMsg.trim() });
    setChatMsg("");
  };

  return (
    <main className="container mx-auto px-4 py-8  min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{room?.name || 'Auction Room'}</h1>
          <p className="text-sm text-gray-400">Live player auction • Real-time bidding</p>
        </div>

      

      
        <div className="flex items-center gap-3">
          {room && (
            <>
              <Chip size="sm" variant="flat" color={room.status === 'active' ? 'success' : room.status === 'waiting' ? 'warning' : 'default'}>
                {room.status?.toUpperCase?.() || '—'}
              </Chip>
              {Array.isArray((room as any).teams) && (
                <Chip size="sm" variant="flat">Members: {(room as any).teams.length}</Chip>
              )}
            </>
          )}
          {(room?.status === 'waiting' || (room?.status === 'active' && !currentPlayer)) && isAdmin && (
            <Button color="primary" onClick={handleStartAuction} isLoading={starting}>
              Start Auction
            </Button>
          )}
          <Button variant="flat" color="danger" onClick={() => router.push("/auction-rooms")}>Exit</Button>
        </div>
      </div>

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-gray-600"><Spinner size="sm" /> Loading room…</div>
      )}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Current Player</h3>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-xs text-gray-500">Bid Timer</div>
              <CircularTimer seconds={timer} total={(room as any)?.timePerBid || 30} />
            </div>
          </CardHeader>
          <CardBody>
            {currentPlayer ? (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <Avatar size="lg" name={currentPlayer.name} src={currentPlayer.imageUrl} className="text-3xl shadow" />
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold tracking-tight">{currentPlayer.name}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      {currentPlayer.role && <Chip size="sm" variant="flat">{currentPlayer.role}</Chip>}
                      {typeof currentPlayer.basePrice === "number" && <Chip size="sm" color="warning" variant="flat">Base: {toLakh(currentPlayer.basePrice)}</Chip>}
                      {lastBid && <Chip size="sm" color="success" variant="flat">Current: {toLakh(lastBid.amount)}</Chip>}
                    </div>
                    <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                      {typeof currentPlayer.age === 'number' && <span>Age: <span className="font-medium text-gray-800">{currentPlayer.age}</span></span>}
                      {currentPlayer.nationality && <span>Nationality: <span className="font-medium text-gray-800">{currentPlayer.nationality}</span></span>}
                      {currentPlayer.battingStyle && <span>Batting: <span className="font-medium text-gray-800 capitalize">{currentPlayer.battingStyle}</span></span>}
                      {currentPlayer.bowlingStyle && <span>Bowling: <span className="font-medium text-gray-800 capitalize">{currentPlayer.bowlingStyle}</span></span>}
                    </div>
                    {currentPlayer.stats && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        {typeof currentPlayer.stats.runs === 'number' && (
                          <div className="rounded-md bg-gray-50 p-3 border">
                            <div className="text-xs text-gray-500">Runs</div>
                            <div className="text-lg text-gray-800 font-semibold">{currentPlayer.stats.runs}</div>
                          </div>
                        )}
                        {typeof currentPlayer.stats.wickets === 'number' && (
                          <div className="rounded-md bg-gray-50 p-3 border">
                            <div className="text-xs text-gray-500">Wickets</div>
                            <div className="text-lg text-gray-800 font-semibold">{currentPlayer.stats.wickets}</div>
                          </div>
                        )}
                        {typeof currentPlayer.stats.matches === 'number' && (
                          <div className="rounded-md bg-gray-50 p-3 border">
                            <div className="text-xs text-gray-500">Matches</div>
                            <div className="text-lg text-gray-800 font-semibold">{currentPlayer.stats.matches}</div>
                          </div>
                        )}
                        {typeof currentPlayer.stats.catches === 'number' && (
                          <div className="rounded-md bg-gray-50 p-3 border">
                            <div className="text-xs text-gray-500">Catches</div>
                            <div className="text-lg text-gray-800 font-semibold">{currentPlayer.stats.catches}</div>
                          </div>
                        )}
                        {typeof currentPlayer.stats.stumpings === 'number' && (
                          <div className="rounded-md bg-gray-50 p-3 border">
                            <div className="text-xs text-gray-500">Stumpings</div>
                            <div className="text-lg text-gray-800   font-semibold">{currentPlayer.stats.stumpings}</div>
                          </div>
                        )}
                        {typeof currentPlayer.stats.average === 'number' && (
                          <div className="rounded-md bg-gray-50 p-3 border">
                            <div className="text-xs text-gray-500">Average</div>
                            <div className="text-lg text-gray-800 font-semibold">{currentPlayer.stats.average}</div>
                          </div>
                        )}
                        {typeof currentPlayer.stats.economy === 'number' && (
                          <div className="rounded-md bg-gray-50 p-3 border">
                            <div className="text-xs text-gray-500">Economy</div>
                            <div className="text-lg text-gray-800 font-semibold">{currentPlayer.stats.economy}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="md:ml-auto w-full md:w-auto">
                    <div className="text-xs text-gray-500 mb-1">Place your bid</div>
                    {!isMember && (
                      <div className="mb-2 text-xs text-orange-600">Join the room to place bids.</div>
                    )}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input type="number" value={Number.isNaN(bidAmount) ? "" : String(bidAmount)} onChange={e => setBidAmount(Number(e.target.value))} min={0} placeholder="Amount (₹)" className="w-40" isDisabled={!canBid} />
                        <Button color="success" onClick={handleBid} isDisabled={!canBid}>Bid</Button>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <Button size="sm" variant="flat" onClick={() => handleQuickBid(500000)} isDisabled={!canBid}>+ 5L</Button>
                        <Button size="sm" variant="flat" onClick={() => handleQuickBid(1000000)} isDisabled={!canBid}>+ 10L</Button>
                        <Button size="sm" variant="flat" onClick={() => handleQuickBid(2000000)} isDisabled={!canBid}>+ 20L</Button>
                        <Button size="sm" variant="flat" onClick={() => handleQuickBid(minInc || 0)} isDisabled={!canBid}>+ Min ({toLakh(minInc)})</Button>
                      </div>
                      {lastBid && (
                        <div className="text-xs text-gray-600">Highest bid: <span className="font-semibold text-emerald-700">{toLakh(lastBid.amount)}</span></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upcoming queue */}
                <Divider className="my-1" />
                <h4 className="text-md font-semibold">Up Next</h4>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {(() => {
                    const anyRoom: any = room as any;
                    const players: any[] = Array.isArray(anyRoom?.players) ? anyRoom.players : [];
                    const idx = players.findIndex((p) => String(p?._id || p) === String(currentPlayer._id));
                    const upcoming = idx >= 0 ? players.slice(idx + 1, idx + 6) : players.slice(0, 5);
                    return upcoming.map((p: any, i: number) => (
                      <div key={(p?._id || i)} className="min-w-[180px] rounded-lg border bg-white p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar name={p?.name} src={p?.imageUrl} size="sm" />
                          <div className="font-semibold text-gray-800 truncate">{p?.name || '—'}</div>
                        </div>
                        <div className="text-xs text-gray-500 capitalize">{p?.role || 'player'}</div>
                        {typeof p?.basePrice === 'number' && (
                          <div className="mt-1 text-xs text-gray-700">Base: {toLakh(p.basePrice)}</div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <p>No active player yet.</p>
            )}

            <Divider className="my-4" />
            <BidsLeaderboard history={visibleHistory} teamLabelOf={teamLabelOf} />
          </CardBody>
        </Card>

        <Card className="h-full flex flex-col shadow-lg">
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Live Chat</h3>
            <span className="text-xs text-gray-500">Be respectful • Real-time</span>
          </CardHeader>
          <CardBody className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-1">
              {chat.length === 0 && (
                <div className="text-sm text-gray-500">No messages yet. Be the first to say hi 👋</div>
              )}
              {chat.map((m, i) => {
                const mine = meName && m.username && String(m.username).toLowerCase() === String(meName).toLowerCase();
                return (
                  <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl border px-3 py-2 shadow-sm ${mine ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        {!mine && <Avatar name={m.username} size="sm" className="text-xs" />}
                        <span className={`font-semibold ${mine ? 'text-emerald-700' : 'text-gray-800'}`}>{m.username}</span>
                        <span className="ml-auto text-[10px] text-gray-400">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="mt-1 text-gray-700 whitespace-pre-wrap break-words">{m.message}</div>
                      <div className="mt-1 flex gap-1 text-sm">
                        <button className="hover:scale-110 transition" onClick={() => setChatMsg((prev) => (prev ? prev + ' 👍' : '👍'))}>👍</button>
                        <button className="hover:scale-110 transition" onClick={() => setChatMsg((prev) => (prev ? prev + ' 🔥' : '🔥'))}>🔥</button>
                        <button className="hover:scale-110 transition" onClick={() => setChatMsg((prev) => (prev ? prev + ' 👏' : '👏'))}>👏</button>
                        <button className="hover:scale-110 transition" onClick={() => setChatMsg((prev) => (prev ? prev + ' 🏏' : '🏏'))}>🏏</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="hidden sm:flex gap-1">
                <Button size="sm" variant="flat" onClick={() => setChatMsg((p) => (p ? p + ' 👍' : '👍'))}>👍</Button>
                <Button size="sm" variant="flat" onClick={() => setChatMsg((p) => (p ? p + ' 🔥' : '🔥'))}>🔥</Button>
                <Button size="sm" variant="flat" onClick={() => setChatMsg((p) => (p ? p + ' 👏' : '👏'))}>👏</Button>
                <Button size="sm" variant="flat" onClick={() => setChatMsg((p) => (p ? p + ' 🏏' : '🏏'))}>🏏</Button>
              </div>
              <Input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === "Enter" && handleSendChat()} radius="lg" className="flex-1" />
              <Button color="primary" onClick={handleSendChat} radius="lg">Send</Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Footer actions */}
      <div className="mt-6 flex items-center justify-between">
        <div>
          {room && (
            <div className="text-xs text-gray-500">Min increment: {toLakh(minInc)}{lastBid ? ` • Last bid: ${toLakh(lastBid.amount)}` : ""}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isMember && (room?.status === 'waiting' || room?.status === 'active') && (
            <Button color="warning" onClick={handleJoin} isLoading={joining}>Join Room</Button>
          )}
          {isMember && (
            <Badge color="success" variant="flat">You joined</Badge>
          )}
        </div>
      </div>

      {/* Teams details */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold tracking-tight mb-3">Teams</h3>
        {teamsList.length === 0 ? (
          <p className="text-sm text-gray-500">No teams have joined yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamsList.map((t) => (
              <div key={t._id} className="rounded-lg border p-4 bg-white/50">
                <div className="flex items-center justify-between">
                  <div className="font-semibold truncate">
                    {t.name}
                    {t.isMine && <span className="ml-2 text-xs text-emerald-700">(You)</span>}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <div>Budget: {t.budget != null ? toLakh(t.budget) : '—'}</div>
                  <div>Remaining: {t.remainingBudget != null ? toLakh(t.remainingBudget) : '—'}</div>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-700 mb-1">Players ({t.players.length})</div>
                  {t.players.length === 0 ? (
                    <div className="text-xs text-gray-500">No players yet.</div>
                  ) : (
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      {t.players.slice(0, 6).map((p) => (
                        <li key={p._id} className="flex flex-col gap-0.5">
                          <div className="flex justify-between gap-2">
                            <span className="truncate font-medium">{p.name}</span>
                            {typeof p.price === 'number' && (
                              <span className="text-gray-600">{toLakh(p.price)}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex flex-wrap gap-x-3">
                            {p.role && <span className="capitalize">Role: <span className="text-gray-700">{p.role}</span></span>}
                            {typeof p.stats?.runs === 'number' && <span>Runs: <span className="text-gray-700">{p.stats.runs}</span></span>}
                            {typeof p.stats?.wickets === 'number' && <span>Wickets: <span className="text-gray-700">{p.stats.wickets}</span></span>}
                          </div>
                        </li>
                      ))}
                      {t.players.length > 6 && (
                        <li className="text-xs text-gray-500">+{t.players.length - 6} more</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
