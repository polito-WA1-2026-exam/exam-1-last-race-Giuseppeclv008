"use strict";
import { useState, useEffect, useRef } from "react";
import { Badge } from "react-bootstrap";

export default function CountdownTimer({ seconds, onExpire }) {
    const [remaining, setRemaining] = useState(seconds);
    const expiredRef = useRef(false);

    useEffect(() => {
        const id = setInterval(() => {
            setRemaining((r) => {
                if (r <= 1) {
                    clearInterval(id);
                    if (!expiredRef.current) { expiredRef.current = true; onExpire(); }
                    return 0;
                }
                return r - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [onExpire]);

    const variant = remaining <= 15 ? "danger" : remaining <= 30 ? "warning" : "info";
    return (
        <span className="d-inline-flex align-items-center gap-2">
            <span className="eyebrow">Time left</span>
            <Badge bg={variant} text={variant === "warning" ? "dark" : undefined} className="fs-5 tabular">{remaining}s</Badge>
        </span>
    );
}