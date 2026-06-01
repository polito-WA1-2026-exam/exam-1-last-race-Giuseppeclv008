"use strict";

const segKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
// Decide wheater a submitted route is Valid. A Route is valid when it:
// 1. Has at least 2 segments and starts at stratId and ends at destId
// 2. Each segment corresponds to an edge in the graph
// 3. Only changes line at an interchange station (a station with degree >= 3 in the graph)
// Inputs: lineSet = Map<"a-b", Set<lineId>>, edges = [ [from, to], ...],
// interchanges = Set<stationId>, route = [ stationId, ...]
// Returns valid: true if the route is valid, {valid: false reason}, otherwise. Does not throw.

export function isValidRoute(route, startId, destId, lineSets, interchanges) {
    if (!Array.isArray(route) || route.length < 2) return { valid: false, reason: "rout too short" };
    if (route[0] !== startId) return { valid: false, reason: "wrong start" };
    if (route[route.length - 1] !== destId) return { valid: false, reason: "route does not end at the correct station" };

    const segLines = [];
    //  check segments and build the list of lines for each segment, if any
    for (let i = 0; i < route.length - 1; i++) {
        const ls = lineSets.get(segKey(route[i], route[i + 1])); // set of lines for the current segment, using segKey to handle both directions
        if (!ls || ls.size === 0) return { valid: false, reason: `no connection ${route[i]}-${route[i + 1]}` };
        segLines.push(ls);
    }

    let carried = new Set(segLines[0]); // lines that can be taken at the current station
    for (let i = 0; i< segLines.length; i++) {
        const inter = new Set([...carried].filter(x => segLines[i].has(x))); // lines that can be taken at the next station
        if (inter.size > 0){
            carried = inter; // if there is an intersection, we can continue with the same line
        } else {
            const junction = route[i]; // station between the current and the next segment
            if(!interchanges.has(junction)) return { valid: false, reason: `line change at non interchange station ${junction}` };
            carried = new Set(segLines[i]); // change line at the interchange station
        }
    }
    return { valid: true };
}
