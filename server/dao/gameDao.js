"use strict";

import { dbAll, dbGet, dbRun } from "../db/db.js";

export async function createGame(userId, startId, destId) {
    const r = await dbRun(
        "INSERT INTO games (user_id, start_station_id, dest_station_id, status, created_at) VALUES (?, ?, ?, ?, ?)",
        [userId, startId, destId, "pending", new Date().toISOString()]);
    return r.lastID;
}

export async function getPendingGame(gameId) {
    return await dbGet("SELECT * FROM games WHERE id = ? AND status = 'pending'", [gameId]);
}

export async function invalidateGame(gameId) {
    await dbRun("UPDATE games SET status = 'invalid' WHERE id = ?", [gameId]);
}

export async function completeGame(gameId, finalScore, steps) {
    await dbRun("UPDATE games SET status = 'completed', final_score = ? WHERE id = ?", [score, gameId]);
    for (const s of steps) {
        await dbRun(
            "INSERT INTO game_segments (game_id, ord, from_station_id, to_station_id, event_id, coins_after) VALUES (?, ?, ?, ?, ?, ?)",
            [gameId, s.ord, s.from, s.to, s.eventId, s.coinsAfter]);
    }
}

export async function getRanking() {
    return dbAll(
        `SELECT u.name AS name, MAX(g.score) AS bestScore
         FROM users u
         JOIN games g ON u.id = g.user_id
         WHERE g.status = 'completed'
         GROUP BY u.id, u.name
         ORDER BY bestScore DESC, u.name ASC`);
}