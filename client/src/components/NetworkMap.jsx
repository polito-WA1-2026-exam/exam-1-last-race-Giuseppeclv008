"use strict";

// Schematic Milano metro map (Beck/Noorda style): white casing under the
// coloured lines, ringed interchange circles, uppercase Helvetica labels.
export default function NetworkMap({ stations, lines = [], showLines = false, highlight = {} }) {
    const byId = Object.fromEntries(stations.map((s) => [s.id, s]));

    // station id -> colours of the lines serving it (length > 1 ⇒ interchange)
    const stationColors = {};
    lines.forEach((line) =>
        line.stations.forEach((sid) => {
            (stationColors[sid] = stationColors[sid] || []).push(line.color);
        })
    );

    const segs = [];
    if (showLines) {
        lines.forEach((line) =>
            line.stations.slice(0, -1).forEach((sid, i) => {
                const a = byId[sid], b = byId[line.stations[i + 1]];
                if (a && b) segs.push({ key: `${line.id}-${i}`, a, b, color: line.color });
            })
        );
    }

    return (
        <svg viewBox="0 0 1000 700" className="network-map" role="img" aria-label="Milano metro network map">
            {/* white casing so crossing lines read cleanly */}
            {segs.map((s) => (
                <line key={`case-${s.key}`} x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y}
                    stroke="#ffffff" strokeWidth="11" strokeLinecap="round" />
            ))}
            {segs.map((s) => (
                <line key={s.key} x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y}
                    stroke={s.color} strokeWidth="6.5" strokeLinecap="round" />
            ))}

            {stations.map((s) => {
                const cols = stationColors[s.id] || [];
                const interchange = cols.length > 1;
                const isStart = highlight.start === s.id;
                const isDest = highlight.dest === s.id;

                let r = 6, fill = "#ffffff", stroke = cols[0] || "#181818", sw = 3;
                if (interchange) { r = 9.5; stroke = "#181818"; sw = 3.5; }
                if (isStart) { r = 11; fill = "#007E3A"; stroke = "#ffffff"; sw = 3; }
                if (isDest) { r = 11; fill = "#E2001A"; stroke = "#ffffff"; sw = 3; }

                return (
                    <g key={s.id}>
                        {(isStart || isDest) && (
                            <text x={s.x + 16} y={s.y - 13} className="map-tag" fill={isStart ? "#007E3A" : "#E2001A"}>
                                {isStart ? "START" : "ARRIVAL"}
                            </text>
                        )}
                        <circle cx={s.x} cy={s.y} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />
                        <text x={s.x + 16} y={s.y + 5} className="map-label">{s.name.toUpperCase()}</text>
                    </g>
                );
            })}
        </svg>
    );
}
