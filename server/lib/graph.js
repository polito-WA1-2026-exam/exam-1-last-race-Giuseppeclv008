"use strict";

// Utility function to build an adjacency list from a list of edges for a non oriented graph
export function buildAdjacency(edges) {
    const adj = new Map();

    const add = (u, v) => {
        if (!adj.has(u)) adj.set(u, new Set());
        adj.get(u).add(v);
    };

    for (const [from, to] of edges) {
        add(from, to);
        add(to, from);
    }
    return adj;

}

// breadth first search to compute distances from a start node in a non oriented graph represented as an adjacency list
export function bfsDistances(adj, startId) {
    const distances = new Map([[startId, 0]]);
    const queue = [startId];
    while(queue.length > 0) {
        const current = queue.shift();
        for (const next of adj.get(current) ?? []) {
            if (!distances.has(next)) {
                distances.set(next, distances.get(current) + 1);
                queue.push(next);
            }
        }
    }
    return distances;
}

// Randomly choose a start station and a destination that is reachable from it
// and at least 3 stops away (BFS distance >= 3), as required by the game spec.
// rng is injectable for deterministic tests. Throws if no valid pair exists.
export function pickStartAndDest(stationsId, edges, rng= Math.random) {
    const adj = buildAdjacency(edges);
    const shuffledStart = [...stationsId].sort(() => rng() - 0.5);
    for (const startId of shuffledStart) {
        const distances = bfsDistances(adj, startId);
        const eligible = stationsId.filter((id)=>( distances.get(id) ?? 0 ) >= 3);
        if (eligible.length > 0) {
            const destId = eligible[Math.floor(rng() * eligible.length)];
            return { startId, destId };
        }
    }
    throw new Error("No station pair found with distance >= 3");
}