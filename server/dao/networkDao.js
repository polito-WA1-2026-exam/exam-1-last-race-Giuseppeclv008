"use strict";
import { dbAll } from "../db/db.js";

export async function getStations() {
  return dbAll("SELECT id, name, x, y FROM stations ORDER BY name");
}

//associates each line to its stations ordered by position
export async function getLinesWithStations() {
  const lines = await dbAll("SELECT id, name, color FROM lines ORDER BY id");
  for (const line of lines) {
    const rows = await dbAll(
      "SELECT station_id FROM line_stations WHERE line_id = ? ORDER BY position", [line.id]);
    line.stations = rows.map((r) => r.station_id);
  }
  return lines;
}

// Returns [{from,to}] for every consecutive pair on every line (removed redundancy, sorted ids).
export async function getSegments() {
  const lines = await getLinesWithStations();
  const seen = new Set();
  const segments = [];
  for (const line of lines) {
    for (let i = 0; i < line.stations.length - 1; i++) {
      const a = line.stations[i], b = line.stations[i + 1];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!seen.has(key)) { seen.add(key); segments.push({ from: a, to: b }); }
    }
  }
  return segments;
}

// Map<"a-b", Set<lineId>> and Set of interchange station ids.
export async function getLineSetsAndInterchanges() {
  const lines = await getLinesWithStations();
  const lineSets = new Map();
  const stationLineCount = new Map();
  for (const line of lines) {
    for (let i = 0; i < line.stations.length - 1; i++) {
      const a = line.stations[i], b = line.stations[i + 1];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!lineSets.has(key)) lineSets.set(key, new Set());
      lineSets.get(key).add(line.id);
    }

  // Wrap in a Set so circular lines don't double-count their own stations, 
  // then increment the global counter to track how many *different* lines stop here.
    for (const sid of new Set(line.stations)) {
      stationLineCount.set(sid, (stationLineCount.get(sid) ?? 0) + 1);
    }
  }

  // [...statioLineCount] converts the map into an array of pairs, lookking like [[StationID, count], [StationID, count]]
  // .filter(([,c]) => c>1).map . ..... filters away stations with a count <1 and map throws away
  // the count number, keeping only StationIDs, Set wraps everything to make an efficient search to check if
  // a station is an interchange
  const interchanges = new Set([...stationLineCount].filter(([, c]) => c > 1).map(([id]) => id));
  return { lineSets, interchanges };
}
