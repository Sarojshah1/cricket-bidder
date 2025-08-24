import path from 'path';
import fs from 'fs';
import { connectDB } from '../config/database';
import { Player } from '../models/Player';

interface RawPlayer {
  name: string;
  age: number;
  nationality: string;
  role: 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  battingStyle?: 'right-handed' | 'left-handed' | null;
  bowlingStyle?: 'fast' | 'medium' | 'spin' | 'leg-spin' | 'off-spin' | null;
  basePrice: number;
  stats: {
    matches: number;
    runs?: number;
    wickets?: number;
    catches?: number;
    stumpings?: number;
    average?: number;
    economy?: number;
  };
}

async function seedPlayers() {
  try {
    console.log('🚀 Connecting to database...');
    await connectDB();

    // CLI args:
    // --file=path.json (single)
    // --files=path1.json,path2.json (multiple)
    const fileArg = process.argv.find(a => a.startsWith('--file='));
    const filesArg = process.argv.find(a => a.startsWith('--files='));

    let filePaths: string[] = [];
    if (filesArg) {
      const list = filesArg.split('=')[1];
      filePaths = list.split(',').map(p => p.trim()).filter(Boolean);
    } else if (fileArg) {
      filePaths = [fileArg.split('=')[1]];
    } else {
      filePaths = ['../data/iplPlayers.json'];
    }

    const absPaths = filePaths.map(p => path.resolve(__dirname, p));
    console.log('📄 Reading data from:', absPaths);

    const mergedMap = new Map<string, RawPlayer>();
    for (const pth of absPaths) {
      const raw = fs.readFileSync(pth, 'utf-8');
      const chunk: RawPlayer[] = JSON.parse(raw);
      for (const rp of chunk) {
        // de-dup by name (case-insensitive)
        const key = rp.name.trim().toLowerCase();
        if (!mergedMap.has(key)) mergedMap.set(key, rp);
      }
    }

    const players: RawPlayer[] = Array.from(mergedMap.values());
    console.log(`🏏 Preparing to upsert ${players.length} players...`);

    let upserted = 0;
    for (const p of players) {
      const doc = {
        name: p.name,
        age: p.age,
        nationality: p.nationality,
        role: p.role,
        battingStyle: p.battingStyle ?? undefined,
        bowlingStyle: p.bowlingStyle ?? undefined,
        basePrice: p.basePrice,
        currentPrice: p.basePrice,
        isSold: false,
        stats: {
          matches: p.stats.matches ?? 0,
          runs: p.stats.runs ?? 0,
          wickets: p.stats.wickets ?? 0,
          catches: p.stats.catches ?? 0,
          stumpings: p.stats.stumpings ?? 0,
          average: p.stats.average ?? 0,
          economy: p.stats.economy ?? 0,
        },
        isActive: true,
      };

      await Player.findOneAndUpdate(
        { name: p.name },
        doc,
        { upsert: true, new: true }
      );
      upserted += 1;
    }

    console.log(`✅ Upserted ${upserted} players successfully.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed players:', err);
    process.exit(1);
  }
}

seedPlayers();
