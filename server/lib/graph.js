"use strict";


// Fisher-Yates shuffle
export function shuffle(arr, rng = Math.random) {
    const a = [...arr]; //a is a shallow copy of arr
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1)); //rng() generates a decimal between [0,1[
        const temp = a[i];
        a[i] = a[j];
        a[j] = temp;
    }
    return a;
}

// Utility function to build an adjacency list from a list of edges for a non oriented graph
export function buildAdjacency(edges) {
    const adj = new Map();

    const add = (u, v) => {
        if (!adj.has(u)) adj.set(u, new Set());
        adj.get(u).add(v);
    };

    for (const e of edges) {
        // accepts edges in two different formats, added for testing purpose
        // if an edge is represented as an array gets the "from" stop from the index 0 if e is a json object gets the id using the property name
        const from = Array.isArray(e) ? e[0] : e.from;
        const to = Array.isArray(e) ? e[1] : e.to;
        // needed two adds becasue the graph is undirected - tracks go both ways
        add(from, to);
        add(to, from);
    }
    return adj;

}
// BFS is optimal for this application due to the fact that the edges are unweighted (every segment is 1 hop, if we had a travel time Dijkstra would have been better)
// breadth first search to compute distances from a start node in a non oriented graph represented as an adjacency list
export function bfsDistances(adj, startId) {
    const distances = new Map([[startId, 0]]);//the distance from its self is 0
    const queue = [startId];
    while(queue.length > 0) {
        const current = queue.shift();// pulls the first station from the front to evaluate it 
        for (const next of adj.get(current) ?? []) { // gets from the adjacency list the set of adjacency of the current station and loops in it, if found
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
    const shuffledStart = shuffle(stationsId);
    for (const startId of shuffledStart) {
        const distances = bfsDistances(adj, startId);
        const eligible = stationsId.filter((id)=>( distances.get(id) ?? 0 ) >= 3); // checks if there are stations with a distance >= 3 from the starting station 
        if (eligible.length > 0) {
            const destId = eligible[Math.floor(rng() * eligible.length)]; //randomly selects from the array an element 
            return { startId, destId };
        }
    }
    throw new Error("No station pair found with distance >= 3");
}