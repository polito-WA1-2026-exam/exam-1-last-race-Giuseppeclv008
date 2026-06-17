"use strict";

const segKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
// Decide wheater a submitted route is Valid. A Route is valid when it:
// 1. Has at least 2 segments and starts at startId and ends at destId
// 2. Each segment corresponds to an edge in the graph
// 3. Only changes line at an interchange station (a station with degree >= 3 in the graph)
// Inputs: lineSet = Map<"a-b", Set<lineId>>, edges = [ [from, to], ...],
// interchanges = Set<stationId>, route = [ stationId, ...]
// Returns valid: true if the route is valid, {valid: false reason:"reason"} otherwise. Does not throw.

export function isValidRoute(route, startId, destId, lineSets, interchanges) {
    if (!Array.isArray(route) || route.length < 2) return { valid: false, reason: "route too short" };
    if (route[0] !== startId) return { valid: false, reason: "wrong start" };
    if (route[route.length - 1] !== destId) return { valid: false, reason: "route does not end at the correct station" };

    const segLines = [];
    const usedSegments = new Set(); // a segment may be travelled at most once 
    //  check segments and build the list of lines for each segment, if any
    for (let i = 0; i < route.length - 1; i++) {
        const key = segKey(route[i], route[i + 1]); // undirected key, handles both directions
        if (usedSegments.has(key)) return { valid: false, reason: `segment ${key} used more than once` };
        usedSegments.add(key);
        const ls = lineSets.get(key); // set of lines for the current segment
        if (!ls || ls.size === 0) return { valid: false, reason: `no connection ${route[i]}-${route[i + 1]}` };
        segLines.push(ls);
    }

    let carried = new Set(segLines[0]); // tracks which metro liens the player could currently be riding. Starts with the lines available on the first seg
    for (let i = 0; i< segLines.length; i++) { 
        const inter = new Set([...carried].filter(x => segLines[i].has(x))); // checks if any of the line that I'm currently riding is available on the next station
        if (inter.size > 0){
            carried = inter; // if the next station is on any of the lines that I was running I can stay on the train 
        } else { // if it isn't I have to change line (train) 
            const junction = route[i]; // route[i] is the station where happens the train switch
            if(!interchanges.has(junction)) return { valid: false, reason: `line change at non interchange station ${junction}` }; // illegal change
            carried = new Set(segLines[i]); // change line at the interchange station
        }
    }
    return { valid: true };
}
