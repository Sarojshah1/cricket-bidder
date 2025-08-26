import api, { extractApiError } from "@/lib/api";

export interface AuctionRoom {
  _id: string;
  name: string;
  description?: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  timePerBid?: number;
  minBidIncrement?: number;
}

export interface CreateRoomPayload {
  name: string;
  description?: string;
  startTime: string;
  maxTeams?: number;
  minBidIncrement?: number;
  timePerBid?: number;
}

export async function listRooms(): Promise<AuctionRoom[]> {
  const { data } = await api.get("/auction-rooms");
  if (Array.isArray(data)) return data as AuctionRoom[];
  // common server response envelopes
  const anyData: any = data;
  if (Array.isArray(anyData?.rooms)) return anyData.rooms as AuctionRoom[];
  if (Array.isArray(anyData?.items)) return anyData.items as AuctionRoom[];
  if (Array.isArray(anyData?.results)) return anyData.results as AuctionRoom[];
  if (Array.isArray(anyData?.docs)) return anyData.docs as AuctionRoom[];
  if (Array.isArray(anyData?.list)) return anyData.list as AuctionRoom[];
  if (Array.isArray(anyData?.data?.rooms)) return anyData.data.rooms as AuctionRoom[];
  if (Array.isArray(anyData?.data?.items)) return anyData.data.items as AuctionRoom[];
  if (Array.isArray(anyData?.data?.results)) return anyData.data.results as AuctionRoom[];
  if (Array.isArray(anyData?.data?.docs)) return anyData.data.docs as AuctionRoom[];
  if (Array.isArray(anyData?.data?.list)) return anyData.data.list as AuctionRoom[];
  // look for a nested { rooms: { docs: [...] } } shape
  if (Array.isArray(anyData?.rooms?.docs)) return anyData.rooms.docs as AuctionRoom[];
  if (Array.isArray(anyData?.data?.rooms?.docs)) return anyData.data.rooms.docs as AuctionRoom[];
  // last resort: pick the first array property found at top-level or under data
  const firstArrayTop = Object.values(anyData).find((v) => Array.isArray(v)) as AuctionRoom[] | undefined;
  if (firstArrayTop) return firstArrayTop;
  const firstArrayData = anyData?.data && Object.values(anyData.data).find((v) => Array.isArray(v)) as AuctionRoom[] | undefined;
  if (firstArrayData) return firstArrayData;
  // unexpected shape; log once in dev to help diagnose
  if (typeof window !== 'undefined') {
    console.debug('[auctionRooms.listRooms] Unexpected response shape:', anyData);
  }
  return [];
}

export async function createRoom(payload: CreateRoomPayload): Promise<AuctionRoom> {
  try {
    const { data } = await api.post("/auction-rooms", payload);
    return ((data as any)?.room ?? data) as AuctionRoom;
  } catch (err) {
    throw new Error(extractApiError(err));
  }
}

export async function getRoom(id: string): Promise<AuctionRoom> {
  const { data } = await api.get(`/auction-rooms/${id}`);
  const anyData: any = data;
  return (
    anyData?.auctionRoom ||
    anyData?.data?.auctionRoom ||
    anyData?.room ||
    anyData?.data?.room ||
    anyData
  ) as AuctionRoom;
}

export async function startAuction(roomId: string): Promise<AuctionRoom> {
  try {
    const { data } = await api.post(`/auction-rooms/${roomId}/start`, {});
    return ((data as any)?.room ?? data) as AuctionRoom;
  } catch (err) {
    throw new Error(extractApiError(err));
  }
}

export async function cancelAuctionRoom(roomId: string): Promise<AuctionRoom> {
  try {
    const { data } = await api.post(`/auction-rooms/${roomId}/cancel`, {});
    return ((data as any)?.room ?? data) as AuctionRoom;
  } catch (err) {
    throw new Error(extractApiError(err));
  }
}

export interface TeamPayload {
  name: string;
  ownerUserId?: string;
  budget?: number;
}

export async function addTeamsToRoom(roomId: string, teams: TeamPayload[]): Promise<AuctionRoom> {
  try {
    const { data } = await api.post(`/auction-rooms/${roomId}/teams`, { teams });
    return ((data as any)?.room ?? data) as AuctionRoom;
  } catch (err) {
    throw new Error(extractApiError(err));
  }
}

// Any authenticated user joins the room; backend adds the user to room.teams
export async function joinRoomAsUser(roomId: string): Promise<AuctionRoom> {
  try {
    const { data } = await api.post(`/auction-rooms/${roomId}/join`, {});
    const anyData: any = data;
    return (
      anyData?.auctionRoom ||
      anyData?.data?.auctionRoom ||
      anyData?.room ||
      anyData?.data?.room ||
      anyData
    ) as AuctionRoom;
  } catch (err) {
    throw new Error(extractApiError(err));
  }
}

export interface BidHistoryItem {
  playerId: string;
  amount: number;
  teamId: string;
  bidderId: string;
  timestamp: string;
}

export async function getBidHistory(roomId: string): Promise<BidHistoryItem[]> {
  const { data } = await api.get(`/auction-rooms/${roomId}/bid-history`);
  const anyData: any = data;
  return (
    anyData?.bidHistory ||
    anyData?.data?.bidHistory ||
    anyData?.history ||
    anyData
  ) as BidHistoryItem[];
}
