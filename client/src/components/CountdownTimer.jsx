"use strict";
import { useState, useEffect, useRef } from "react";
import { Badge } from "react-bootstrap";

export default function CountdownTimer({ seconds, onExpire }) {
    const [remaining, setRemaining] = useState(seconds);
    const expiredRef = useRef(false);
    // Keep the latest onExpire in a ref so the interval effect can stay mounted
    // once (deps []) instead of being torn down/recreated whenever the parent
    // passes a new onExpire identity (which would reset the 1s tick on every pick).
    const onExpireRef = useRef(onExpire);
    useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

    useEffect(() => {
        const id = setInterval(() => {
            setRemaining((r) => {
                if (r <= 1) {
                    clearInterval(id);
                    if (!expiredRef.current) { expiredRef.current = true; onExpireRef.current(); }
                    return 0;
                }
                return r - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, []);

    const variant = remaining <= 15 ? "danger" : remaining <= 30 ? "warning" : "info";
    return (
        <span className="d-inline-flex align-items-center gap-2">
            <span className="eyebrow">Time left</span>
            <Badge bg={variant} text={variant === "warning" ? "dark" : undefined} className="fs-5 tabular">{remaining}s</Badge>
        </span>
    );
}
