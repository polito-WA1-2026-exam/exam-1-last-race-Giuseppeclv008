"use strict";
import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const LINES = [
    { id: "m1", pill: "M1", label: "Rossa" },
    { id: "m2", pill: "M2", label: "Verde" },
    { id: "m3", pill: "M3", label: "Gialla" },
    { id: "m4", pill: "M4", label: "Blu" },
];

export default function Instructions() {
    const { user } = useAuth();
    return (
        <Card>
            <h1 className="atm-band fs-4"><span className="station-dot" />How to play Last Race</h1>
            <div className="p-4">
                <p className="eyebrow mb-3">A single-player metro-routing game</p>
                <ol className="lh-lg ps-3" style={{ maxWidth: "62ch" }}>
                    <li>You start each game with <b>20 coins</b>.</li>
                    <li><b>Setup</b> — study the metro map: stations, connections and lines.</li>
                    <li><b>Planning</b> — you get a start and a destination plus a shuffled list of segments. In 90 seconds, rebuild the network in your head and pick segments in order to form a valid route. Lines may only change at interchange stations.</li>
                    <li><b>Execution</b> — each segment triggers a random event that adds or removes coins.</li>
                    <li><b>Result</b> — your score is the coins left (never below 0). An invalid or incomplete route scores 0.</li>
                </ol>

                {user ? (
                    <>
                        <div className="line-legend my-4" aria-label="Metro lines">
                            {LINES.map((l) => (
                                <span className="leg" key={l.id}>
                                    <span className={`line-pill ${l.id}`}>{l.pill}</span> {l.label}
                                </span>
                            ))}
                        </div>
                        <Button as={Link} to="/play">Start playing</Button>
                    </>
                ) : (
                    <p className="text-muted mb-0 mt-2">
                        Log in to see the network map and play. Anonymous visitors can only read these instructions.
                    </p>
                )}
            </div>
        </Card>
    );
}
