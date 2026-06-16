"use strict";
import { useState, useCallback, useMemo } from "react";
import { Row, Col, Card, Badge } from "react-bootstrap";
import NetworkMap from "./NetworkMap.jsx";
import CountdownTimer from "./CountdownTimer.jsx";
import SegmentList from "./SegmentList.jsx";
import RouteBuilder from "./RouteBuilder.jsx";

const segKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export default function PlanningView({ game, onSubmit }) {
    const stationsById = Object.fromEntries(game.stations.map((s) => [s.id, s]));
    // The player may pick ANY segment, in any order — including ones that do not
    // connect, or do not start at the assigned start. We keep the chosen segments
    // and derive the station route from them; the server is the sole judge of
    // validity (a wrong/incomplete route scores 0).
    const [picks, setPicks] = useState([]);

    const route = useMemo(() => {
        const r = [];
        for (const seg of picks) {
            if (r.length === 0) {
                // orient the first segment so the start station leads, when it is part of it
                if (seg.to === game.start.id) r.push(seg.to, seg.from);
                else r.push(seg.from, seg.to);
            } else {
                const last = r[r.length - 1];
                if (seg.from === last) r.push(seg.to);       // chains forward
                else if (seg.to === last) r.push(seg.from);  // chains (reversed)
                else r.push(seg.from, seg.to);               // disconnected jump — allowed (server marks it invalid)
            }
        }
        return r;
    }, [picks, game.start.id]);

    // segments already in the route, so the list can disable them (each used once)
    const usedKeys = useMemo(() => new Set(picks.map((s) => segKey(s.from, s.to))), [picks]);

    const pickSegment = (seg) => setPicks((prev) => [...prev, seg]);
    const undo = () => setPicks((prev) => prev.slice(0, -1));
    const submit = useCallback(() => onSubmit(route), [route, onSubmit]);

    return (
        <div>
            <div className="d-flex justify-content-between align-items-end mb-3">
                <div>
                    <p className="eyebrow mb-1">Planning</p>
                    <h3 className="mb-0">Build your route</h3>
                </div>
                <CountdownTimer seconds={90} onExpire={submit} />
            </div>

            <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                <span className="d-inline-flex align-items-center gap-2">
                    <Badge bg="success">Start</Badge> <b>{game.start.name}</b>
                </span>
                <span className="text-muted">→</span>
                <span className="d-inline-flex align-items-center gap-2">
                    <Badge bg="danger">Arrival</Badge> <b>{game.dest.name}</b>
                </span>
                <span className="ms-auto d-inline-flex align-items-center gap-2">
                    <span className="eyebrow">Coins</span>
                    <Badge bg="warning" text="dark" className="fs-6 tabular">{game.coins}</Badge>
                </span>
            </div>

            <Row className="mb-3">
                <Col xs={12}>
                    <NetworkMap stations={game.stations} highlight={{ start: game.start.id, dest: game.dest.id }} />
                </Col>
            </Row>
            <Row className="g-3">
                <Col md={7}>
                    <Card>
                        <h5 className="atm-band m4 fs-6"><span className="station-dot" />Segments</h5>
                        <div className="p-2">
                            <SegmentList segments={game.segments} stationsById={stationsById} usedKeys={usedKeys} onPick={pickSegment} />
                        </div>
                    </Card>
                </Col>
                <Col md={5}>
                    <RouteBuilder route={route} stationsById={stationsById}
                        startId={game.start.id} destId={game.dest.id} onUndo={undo} onSubmit={submit} />
                </Col>
            </Row>
        </div>
    );
}