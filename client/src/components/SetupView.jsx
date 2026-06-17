"use strict";
import { useState, useEffect } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import { API } from "../api/API.js";
import NetworkMap from "./NetworkMap.jsx";

const PILL = { M1: "m1", M2: "m2", M3: "m3", M4: "m4" };

export default function SetupView({ onReady }) {
  const [network, setNetwork] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    API.getNetwork().then((n) => { if (active) setNetwork(n); }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!network) return <Spinner animation="border" />;

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-3 gap-2">
        <div>
          <p className="eyebrow mb-1">Setup</p>
          <h3 className="mb-0">Study the network</h3>
        </div>
        <div className="line-legend">
          {network.lines.map((l) => (
            <span className="leg" key={l.id}>
              <span className={`line-pill ${PILL[l.name] || "m1"}`}>{l.name}</span>
            </span>
          ))}
        </div>
      </div>
      <NetworkMap stations={network.stations} lines={network.lines} showLines />
      <Button className="mt-3" onClick={() => onReady(network)}>I&apos;m ready - start planning</Button>
    </div>
  );
}
