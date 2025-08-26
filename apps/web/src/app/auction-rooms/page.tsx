"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Skeleton,
  Tooltip
} from "@nextui-org/react";
import { Clock, Users, Plus, Trophy } from "lucide-react";
import { listRooms, createRoom, type AuctionRoom, startAuction, cancelAuctionRoom, joinRoomAsUser } from "@/services/auctionRooms";

export default function AuctionRoomsPage() {
  const [rooms, setRooms] = useState<AuctionRoom[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [minInc, setMinInc] = useState<string>("50000");
  const [timePerBid, setTimePerBid] = useState<string>("30");
  const [startTime, setStartTime] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [fetchError, setFetchError] = useState<string>("");
  const router = useRouter();

  // derive isAdmin from JWT in localStorage (if present)
  const isAdmin = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const roles: string[] = payload?.roles || payload?.role ? [payload.role].filter(Boolean) : [];
      return roles.includes('admin') || payload?.role === 'admin';
    } catch {
      return false;
    }
  }, []);

  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [joinBusy, setJoinBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await listRooms();
        setRooms(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setFetchError((e as Error)?.message || "Failed to load rooms");
        setRooms([]);
      }
    })();
  }, []);

  const handleCreate = async () => {
    setFormError("");
    if (name.trim().length < 3) {
      setFormError("Room name must be at least 3 characters");
      return;
    }
    if (!desc.trim() || desc.trim().length < 10 || desc.trim().length > 500) {
      setFormError("Description must be 10–500 characters");
      return;
    }
    if (!startTime) {
      setFormError("Start time is required");
      return;
    }
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime()) || start <= new Date()) {
      setFormError("Start time must be a valid future time");
      return;
    }
    const minIncNum = Number(minInc);
    const timeNum = Number(timePerBid);
    if (Number.isNaN(minIncNum) || minIncNum < 10000) {
      setFormError("Min bid increment must be at least 10,000");
      return;
    }
    if (Number.isNaN(timeNum) || timeNum < 10 || timeNum > 120) {
      setFormError("Time per bid must be between 10 and 120 seconds");
      return;
    }
    try {
      setLoading(true);
      const room = await createRoom({ name: name.trim(), description: desc.trim(), startTime: start.toISOString(), minBidIncrement: minIncNum, timePerBid: timeNum });
      setRooms((prev) => [room, ...((prev || []) as AuctionRoom[])]);
      setName("");
      setDesc("");
      setMinInc("50000");
      setTimePerBid("30");
      setStartTime("");
      setCreateOpen(false);
      router.push(`/auction-room/${room._id}`);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (room: AuctionRoom) => {
    if (room.status === 'completed' || room.status === 'cancelled') {
      router.push(`/auction-room/${room._id}`);
      return;
    }
    try {
      setJoinBusy(room._id);
      // Attempt to join as user; backend should add current user to room.teams
      await joinRoomAsUser(room._id);
    } catch (e) {
      // Fallback: still navigate to view; error might indicate already joined or endpoint not available
      console.warn('Join failed, navigating anyway:', (e as Error).message);
    } finally {
      setJoinBusy(null);
      router.push(`/auction-room/${room._id}`);
    }
  };

  const isLoadingInitial = rooms === null;
  const isFormValid = (
    name.trim().length >= 3 &&
    desc.trim().length >= 10 && desc.trim().length <= 500 &&
    !!startTime && new Date(startTime) > new Date() &&
    !Number.isNaN(Number(minInc)) && Number(minInc) >= 10000 &&
    !Number.isNaN(Number(timePerBid)) && Number(timePerBid) >= 10 && Number(timePerBid) <= 120
  );

  const handleStart = async (roomId: string) => {
    try {
      setActionBusy(roomId + ':start');
      const updated = await startAuction(roomId);
      setRooms((prev) => (Array.isArray(prev) ? prev.map(r => r._id === roomId ? updated : r) : prev));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  const handleCancel = async (roomId: string) => {
    try {
      setActionBusy(roomId + ':cancel');
      const updated = await cancelAuctionRoom(roomId);
      setRooms((prev) => (Array.isArray(prev) ? prev.map(r => r._id === roomId ? updated : r) : prev));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <main className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
            Auction Rooms
          </h1>
          <p className="mt-1 text-sm text-white/60">Create, manage and join live cricket player auctions.</p>
        </div>
        <Button startContent={<Plus size={18} />} className="bg-trophy-gold text-black font-semibold shadow hover:opacity-90" onPress={() => setCreateOpen(true)}>
          New Room
        </Button>
      </div>

      {/* Stats (placeholder visuals) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white/5 border border-white/10">
          <CardBody className="flex items-center gap-3">
            <Users className="text-white/70" size={20} />
            <div>
              <p className="text-xs text-white/60">Total Rooms</p>
              <p className="text-lg font-semibold">{Array.isArray(rooms) ? rooms.length : 0}</p>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-white/5 border border-white/10">
          <CardBody className="flex items-center gap-3">
            <Clock className="text-white/70" size={20} />
            <div>
              <p className="text-xs text-white/60">Active Auctions</p>
              <p className="text-lg font-semibold">{Array.isArray(rooms) ? rooms.filter(r => r.status === 'active').length : 0}</p>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-white/5 border border-white/10">
          <CardBody className="flex items-center gap-3">
            <Trophy className="text-white/70" size={20} />
            <div>
              <p className="text-xs text-white/60">Completed</p>
              <p className="text-lg font-semibold">{Array.isArray(rooms) ? rooms.filter(r => r.status === 'completed').length : 0}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Rooms Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {fetchError && (
          <Card className="md:col-span-2 lg:col-span-3 bg-red-500/10 border border-red-500/30">
            <CardBody className="text-sm text-red-400">
              Failed to load rooms: {fetchError}
            </CardBody>
          </Card>
        )}
        {isLoadingInitial && Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-white/5 border border-white/10">
            <CardBody>
              <Skeleton className="rounded-lg h-5 w-3/4 mb-2" />
              <Skeleton className="rounded-lg h-4 w-1/2" />
            </CardBody>
          </Card>
        ))}

        {!isLoadingInitial && Array.isArray(rooms) && rooms.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3 bg-white/5 border border-white/10">
            <CardBody className="text-center py-14">
              <p className="text-white/70">No rooms yet. Create your first auction room.</p>
              <Button startContent={<Plus size={18} />} className="mt-4 bg-trophy-gold text-black font-semibold" onPress={() => setCreateOpen(true)}>Create Room</Button>
            </CardBody>
          </Card>
        )}

        {Array.isArray(rooms) && rooms.map((r) => (
          <Card key={r._id} className="group relative bg-white/5 backdrop-blur-sm border border-white/10 hover:border-emerald-300/40 transition shadow hover:shadow-emerald-500/10">
            <CardHeader className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold tracking-tight group-hover:text-emerald-300 transition-colors">{r.name}</h3>
                <p className="text-xs text-white/60 mt-1 line-clamp-2">{r.description || "No description"}</p>
              </div>
              <Chip size="sm" variant="flat" color={r.status === 'active' ? 'success' : r.status === 'completed' ? 'secondary' : r.status === 'cancelled' ? 'danger' : 'warning'}>
                {r.status}
              </Chip>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60">
                  {typeof r.timePerBid === 'number' && (
                    <span>⏱️ {r.timePerBid}s/bid</span>
                  )}
                  {typeof r.minBidIncrement === 'number' && (
                    <span className="ml-3">₹ Min +{r.minBidIncrement.toLocaleString()}</span>
                  )}
                  {r.startTime && (
                    <span className="ml-3">Starts: {new Date(r.startTime).toLocaleString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {r.status === 'completed' || r.status === 'cancelled' ? (
                    <Link href={`/auction-room/${r._id}`}>
                      <Button size="sm" variant="flat" className="font-semibold">View</Button>
                    </Link>
                  ) : (
                    <Button size="sm" color="success" className="font-semibold" isLoading={joinBusy === r._id} onPress={() => handleJoin(r)}>
                      {r.status === 'active' ? 'Join' : 'Enter lobby'}
                    </Button>
                  )}
                  {isAdmin && (
                    <>
                      {r.status === 'waiting' && (
                        <Button size="sm" variant="flat" className="bg-emerald-500/20 text-emerald-300" isLoading={actionBusy === r._id + ':start'} onPress={() => handleStart(r._id)}>Start</Button>
                      )}
                      {(r.status === 'waiting' || r.status === 'active') && (
                        <Button size="sm" variant="flat" className="bg-red-500/20 text-red-300" isLoading={actionBusy === r._id + ':cancel'} onPress={() => handleCancel(r._id)}>Cancel</Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Create Room Modal */}
      <Modal isOpen={createOpen} onOpenChange={setCreateOpen} placement="center" backdrop="blur">
        <ModalContent className="bg-slate-950 border border-white/10 shadow-2xl max-w-xl">
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <span className="text-lg font-bold bg-gradient-to-r from-emerald-300 via-yellow-300 to-amber-300 bg-clip-text text-transparent">Create Auction Room</span>
              </ModalHeader>
              <ModalBody>
                <Input
                  type="datetime-local"
                  placeholder="Start time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min={new Date().toISOString().slice(0,16)}
                />
                <Input
                  placeholder="Room name (e.g., IPL 2025 - Main Auction)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && isFormValid && handleCreate()}
                />
                <Textarea
                  placeholder="Short description (10–500 chars)"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  minRows={2}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Min bid increment (≥ 10,000)"
                    value={minInc}
                    onChange={(e) => setMinInc(e.target.value)}
                    min={10000}
                    startContent={<span className="text-sm text-white/70">₹</span>}
                    onKeyDown={(e) => e.key === 'Enter' && isFormValid && handleCreate()}
                  />
                  <Input
                    type="number"
                    placeholder="Time per bid (10–120s)"
                    value={timePerBid}
                    onChange={(e) => setTimePerBid(e.target.value)}
                    min={10}
                    max={120}
                    endContent={<span className="text-xs text-white/70">sec</span>}
                    onKeyDown={(e) => e.key === 'Enter' && isFormValid && handleCreate()}
                  />
                </div>
                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                <p className="text-[11px] text-white/40">Note: Only admins can create rooms. Others can view and join public rooms.</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose} disabled={loading}>Cancel</Button>
                <Tooltip content={!isFormValid ? 'Fill all fields correctly to proceed' : ''} isDisabled={isFormValid} placement="top">
                  <Button className="bg-gradient-to-r from-amber-300 to-yellow-300 text-black font-semibold shadow hover:opacity-90" isLoading={loading} isDisabled={!isFormValid} onPress={handleCreate}>Create Room</Button>
                </Tooltip>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </main>
  );
}
