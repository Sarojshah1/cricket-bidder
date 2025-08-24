"use client";
import React, { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Input, Avatar } from "@nextui-org/react";
import io from "socket.io-client";

interface Player {
  _id: string;
  name: string;
  team: string;
  stats?: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export default function PlayersListPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socket.on("players-list", (data: Player[]) => setPlayers(data));
    socket.emit("get-players-list");
    return () => { socket.disconnect(); };
  }, []);

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.team.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center py-8">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Players List</h2>
          </CardHeader>
          <CardBody>
            <Input
              placeholder="Search by player or team"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-6"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filtered.length ? filtered.map(player => (
                <div key={player._id} className="p-3 border rounded-lg bg-white shadow-sm flex flex-col items-center">
                  <Avatar name={player.name} className="mb-2" />
                  <div className="text-center">
                    <h4 className="font-semibold">{player.name}</h4>
                    <p className="text-gray-500 text-sm">{player.team}</p>
                    {player.stats && <p className="text-gray-400 text-xs">{player.stats}</p>}
                  </div>
                </div>
              )) : <p className="text-gray-500">No players found.</p>}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
