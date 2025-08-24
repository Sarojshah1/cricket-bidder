#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// Parse a TSV-formatted IPL auction list into our Player JSON schema.
// Usage:
//   node src/scripts/parseAuctionTsv.mjs --input <csv-or-tsv> --output <json>
// Options:
//   --filter-country="India"  (optional) only include matching country rows
// Assumptions:
// - File may be CSV or TSV. We auto-detect the delimiter per header line.
// - Columns include: First Name, Surname, Country, Age, Specialism, and a reserve price column (e.g., "Price Rs"/"Reserve").
// - Batting hand often appears as RHB/LHB; bowling style contains RIGHT/LEFT ARM + Fast/Medium/Off Spin/Leg Spin/Slow Orthodox.

function argVal(flag) {
  const a = process.argv.find(x => x.startsWith(flag + '='));
  return a ? a.split('=')[1] : undefined;
}

const inputPath = argVal('--input');
const outputPath = argVal('--output') || 'iplPlayers_2025.json';
const filterCountry = argVal('--filter-country');
if (!inputPath) {
  console.error('Error: --input=<tsv file> is required');
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(process.cwd(), inputPath), 'utf-8');
const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);

// Find the header: pick the first line that has many columns and likely contains "First Name".
let headerLineIdx = lines.findIndex(l => /first\s*name/i.test(l) && /surname|last\s*name/i.test(l));
if (headerLineIdx === -1) headerLineIdx = 0; // fallback

// Detect delimiter: prefer tab if present and produces many cols; else use CSV
function detectDelimiter(line) {
  const tabCount = (line.match(/\t/g) || []).length;
  const commaCount = (line.match(/,/g) || []).length;
  // Prefer tab when present; otherwise comma
  return tabCount > 0 ? '\t' : ',';
}

const delimiter = detectDelimiter(lines[headerLineIdx]);

// CSV-safe split that respects quoted fields
function splitRow(line, delim) {
  if (delim === '\t') return line.split('\t');
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { // escaped quote
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const headers = splitRow(lines[headerLineIdx], delimiter).map(h => h.trim());
function findCol(...cands) {
  const idx = headers.findIndex(h => cands.some(c => h.toLowerCase().includes(c.toLowerCase())));
  return idx;
}

const idx = {
  firstName: findCol('first name', 'firstname', 'first'),
  surname: findCol('surname', 'last name', 'lastname', 'last'),
  country: findCol('country'),
  age: findCol('age'),
  specialism: findCol('specialism', 'role'),
  price: findCol('price rs', 'reserve', 'price'),
};

function toRole(s) {
  const v = (s || '').toLowerCase();
  if (v.includes('wicket')) return 'WICKETKEEPER';
  if (v.includes('all')) return 'ALL-ROUNDER';
  if (v.includes('bowl')) return 'BOWLER';
  if (v.includes('bat')) return 'BATTER';
  return 'BATTER';
}

function detectBatting(cells) {
  const joined = cells.join(' ').toUpperCase();
  if (joined.includes(' LHB') || cells.some(c => c.trim().toUpperCase() === 'LHB')) return 'Left-hand bat';
  if (joined.includes(' RHB') || cells.some(c => c.trim().toUpperCase() === 'RHB')) return 'Right-hand bat';
  return null;
}

function detectBowling(cells) {
  const t = cells.join(' ').toLowerCase();
  if (!t.includes('arm')) return null;
  const arm = t.includes('left arm') ? 'Left-arm' : 'Right-arm';
  if (t.includes('off spin')) return `${arm} offbreak`;
  if (t.includes('leg spin')) return `${arm} legbreak`;
  if (t.includes('slow orthodox') || t.includes('orthodox')) return `${arm} orthodox`;
  if (t.includes('fast medium') || (t.includes('fast') && t.includes('medium'))) return `${arm} fast-medium`;
  if (t.includes('fast')) return `${arm} fast`;
  if (t.includes('medium')) return `${arm} medium`;
  return `${arm} spin`;
}

function parsePriceToBase(p) {
  if (!p) return 100000; // minimum
  // Extract number from like "200" (lakh)
  const m = String(p).replace(/[\,\s]/g, '').match(/(\d+)(?:\.\d+)?/);
  if (!m) return 100000;
  const lakh = parseFloat(m[1]);
  const rupees = Math.round(lakh * 100000);
  return Math.max(100000, rupees);
}

const players = [];
function getCell(cols, i) {
  return (typeof i === 'number' && i >= 0 && i < cols.length) ? (cols[i] ?? '').trim() : '';
}
for (let i = headerLineIdx + 1; i < lines.length; i++) {
  const cols = splitRow(lines[i], delimiter).map(c => c.trim());
  // Skip sub-headers or blank-like rows
  if (cols.length < 5) continue;
  const first = getCell(cols, idx.firstName);
  const last = getCell(cols, idx.surname);
  const name = [first, last].filter(Boolean).join(' ').trim();
  if (!name) continue;
  // Skip banner/subheader lines
  const lowerJoined = cols.join(' ').toLowerCase();
  if (/list\s*sr\.no\./i.test(name) || /reserve|lakh|association|state/i.test(lowerJoined)) continue;

  const country = getCell(cols, idx.country);
  if (filterCountry && country && country.toLowerCase() !== filterCountry.toLowerCase()) {
    continue;
  }
  const ageStr = getCell(cols, idx.age);
  const age = parseInt(ageStr, 10) || 25;
  const specialism = getCell(cols, idx.specialism);
  const role = toRole(specialism);
  const battingStyle = detectBatting(cols);
  const bowlingStyle = detectBowling(cols);
  const priceCell = getCell(cols, idx.price);
  const basePrice = parsePriceToBase(priceCell);

  players.push({
    name,
    age,
    nationality: country || 'Indian',
    role,
    battingStyle: battingStyle || null,
    bowlingStyle: bowlingStyle || null,
    basePrice,
    stats: {
      matches: 0,
      runs: 0,
      wickets: 0,
      strikeRate: null,
      economy: null,
      battingAverage: null,
      bowlingAverage: null
    }
  });
}

const outPath = path.resolve(process.cwd(), outputPath);
fs.writeFileSync(outPath, JSON.stringify(players, null, 2));
console.log(`✅ Wrote ${players.length} players to`, outPath);
