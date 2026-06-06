"use strict";
import { useState, useEffect } from "react";
import { Card, Badge, ListGroup, Button, Alert } from "react-bootstrap";

export default function ExecutionView({ result, onDone }) {
    const [shown, setShown] = useState(0);

    useEffect(() => {
        if (!result.valid) return;
        if (shown >= result.steps.length) return;
        const id = setTimeout(() => setShown((s) => s + 1), 1150);
        return () => clearTimeout(id);
    }, [shown, result]);

    if (!result.valid) {
        return (
            <Card>
                <h3 className="atm-band fs-5"><span className="station-dot" />Execution</h3>
                <div className="p-3">
                    <Alert variant="danger" className="mb-3">
                        Your route was invalid or incomplete{result.expired ? " (time ran out)" : ""}. You lose all your coins.
                    </Alert>
                    <Button onClick={onDone}>See result</Button>
                </div>
            </Card>
        );
    }

    const done = shown >= result.steps.length;
    const coins = shown > 0 ? result.steps[shown - 1].coinsAfter : 20;

    return (
        <Card>
            <h3 className="atm-band fs-5"><span className="station-dot" />Execution</h3>
            <div className="p-3">
                <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="eyebrow">Coins</span>
                    <Badge bg="warning" text="dark" className="fs-4 tabular">{coins}</Badge>
                </div>
                <ListGroup>
                    {result.steps.slice(0, shown).map((step, i) => (
                        <ListGroup.Item key={i} className="d-flex justify-content-between align-items-center gap-3">
                            <span>
                                <b>{step.from.name}</b> <span className="text-muted">→</span> <b>{step.to.name}</b>
                                <span className="d-block text-muted" style={{ fontSize: ".85rem" }}>{step.event.description}</span>
                            </span>
                            <Badge bg={step.event.effect >= 0 ? "success" : "danger"} className="tabular">
                                {step.event.effect >= 0 ? "+" : ""}{step.event.effect} → {step.coinsAfter}
                            </Badge>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
                {done && <Button className="mt-3" onClick={onDone}>See final result</Button>}
            </div>
        </Card>
    );
}
