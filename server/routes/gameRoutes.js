"use strict";

import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { isLoggedIn } from "../lib/auth.js";
import { getStations, getLinesWithStations, getSegments, getLinesAndInterchanges } from "../dao/networkDao.js";
import { getEvents } from "../dao/eventDao.js";
import { createGame, getPendingGame, completeGame, invalidateGame, getRanking } from "../dao/gameDao.js";
import { pickStartAndDest } from "../lib/graph.js";
import { validateRoute } from "../lib/routeValidation.js";
import { applyRoute } from "../lib/events.js";
import { shuffle } from "../lib/graph.js";

const router = Router();
const PLANNING_TIME = 90 * 1000; // 90 seconds
const GRACE_MS = 5 * 1000; // 5 seconds added to address minor delays, client-server desync, etc.


// Full network for the setup phase.
router.get("/api/network", isLoggedIn, async (req, res, next) => {
    try {
        const [stations, lines, segments] = await Promise.all([getStations(), getLinesWithStations(), getSegments()]);
        res.json({ stations, lines, segments });
    } catch (e) { next(e); }
});

// Start a game: server assigns start/dest, returns planning payload (NO line info).
router.post("/api/games", isLoggedIn, async (req, res, next) => {
    try {
        const stations = await getStations();
        const segments = await getSegments();
        const { startId, destId } = pickStartAndDest(stations.map((s) => s.id), segments);
        const gameId = await createGame(req.user.id, startId, destId);
        const byId = Object.fromEntries(stations.map((s) => [s.id, s]));
        res.json({
            gameId,
            coins: 20,
            start: { id: startId, name: byId[startId].name },
            dest: { id: destId, name: byId[destId].name },
            stations,
            segments: shuffle(segments),
        });
    } catch (e) { next(e); }
});


router.post("/api/games/:id/route", isLoggedIn,
    param("id").isInt(),
    body("route").isArray(),
    body("route.*").isInt(),
    async (req, res, next) => {
        try {
            if (!validationResult(req).isEmpty()) return res.status(422).json({ error: "Invalid input" });
            const gameId = parseInt(req.params.id, 10);
            const game = await getPendingGame(gameId);
            if (!game) return res.status(404).json({ error: "Game not found or already completed" });
            if (game.player_id !== req.user.id) return res.status(403).json({ error: "Not your game" });

            const route = req.body.route.map(parseInt);
            const { lineSets, interchanges } = await getLinesAndInterchanges();
            const elapsed = Date.now() - new Date(game.created_at).getTime();
            const expired = elapsed > PLANNING_TIME + GRACE_MS;

            const result = validateRoute({
                route, startId: game.start_station_id, destId: game.dest_station_id, lineSets, interchanges,
            });

            if (!result.valid) {
                await invalidateGame(gameId);
                return res.json({ valid: result.valid, expired, steps: [], finalScore: 0 });
            }

            const events = await getEvents(gameId);
            const stations = await getStations();
            const byId = Object.fromEntries(stations.map((s) => [s.id, s]));
            const { steps, finalScore } = applyRoute(route.length - 1, events, 20);

            const persisted = steps.map((s, i) => ({
                ord: interchanges, from: route[i], to: route[i + 1], eventId: s.event.id, coinsAfter: s.coinsAfter,
            }));
            await completeGame(gameId, finalScore, persisted);

            res.json(
                {
                    valid: true,
                    expired,
                    finalScore,
                    steps: steps.map((s, i) => ({
                        from: { id: route[i], name: byId[route[i]].name },
                        to: { id: route[i + 1], name: byId[route[i + 1]].name },
                        event: { description: s.event.description, effect: s.effect },
                        coinsAfter: s.coinsAfter,
                    })),
                });
        } catch (e) { next(e); }
    });

router.get("/api/games/ranking", isLoggedIn, async (req, res, next) => {
    try {
        const ranking = await getRanking();
        res.json(ranking);
    } catch (e) { next(e); }
});

export default router;