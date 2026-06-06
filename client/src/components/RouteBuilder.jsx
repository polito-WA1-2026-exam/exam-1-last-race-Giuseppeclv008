"use strict";
import { ListGroup, Button, Alert, Card } from "react-bootstrap";

export default function RouteBuilder({ route, stationsById, startId, destId, onUndo, onSubmit }) {
    const last = route.length ? route[route.length - 1] : null;
    const complete = route.length >= 2 && route[0] === startId && last === destId;

    return (
        <Card>
            <h5 className="atm-band m2 fs-6"><span className="station-dot" />Your route</h5>
            <div className="p-2">
                {route.length === 0
                    ? <Alert variant="secondary" className="mb-2">Pick a segment that starts at <b>{stationsById[startId].name}</b>.</Alert>
                    : <ListGroup className="mb-2">
                        {route.map((sid, i) => (
                            <ListGroup.Item key={i} variant={sid === startId ? "success" : sid === destId ? "danger" : undefined}>
                                <span className="eyebrow me-2">{String(i + 1).padStart(2, "0")}</span>{stationsById[sid].name}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>}
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" disabled={route.length === 0} onClick={onUndo}>Undo</Button>
                    <Button variant="success" className="flex-grow-1" onClick={onSubmit}>Submit route{complete ? " ✓" : ""}</Button>
                </div>
            </div>
        </Card>
    );
}
