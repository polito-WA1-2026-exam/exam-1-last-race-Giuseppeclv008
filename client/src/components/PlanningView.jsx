"use strict";
import { useState, useCallback } from "react";
import { Row, Col, Card, Badge } from "react-bootstrap";
import NetworkMap from "./NetworkMap.jsx";
import CountdownTimer from "./CountdownTimer.jsx";
import SegmentList from "./SegmentList.jsx";
import RouteBuilder from "./RouteBuilder.jsx";

export default function PlanningView({ game, onSubmit }) {
    const stationsById = Object.fromEntries(game.stations.map((s) => [s.id, s]));
    const [route, setRoute] = useState([]);

    const pickSegment = (seg) => {
        setRoute((prev) => {
            if (prev.length === 0) {
                if (seg.from === game.start.id) return [seg.from, seg.to];
                if (seg.to === game.start.id) return [seg.to, seg.from];
                return prev; // must start at the assigned start station
            }
            const last = prev[prev.length - 1];
            if (seg.from === last) return [...prev, seg.to];
            if (seg.to === last) return [...prev, seg.from];
            return prev; // not contiguous
        });
    };
    const undo = () => setRoute((prev) => (prev.length <= 2 ? [] : prev.slice(0, -1)));
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
                            <SegmentList segments={game.segments} stationsById={stationsById} onPick={pickSegment} />
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