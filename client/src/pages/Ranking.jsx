"use strict";
import { useState, useEffect } from "react";
import { Card, Table, Spinner, Alert } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { API } from "../api/API.js";

const MEDAL = ["", "silver", "bronze"];

export default function Ranking() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const location = useLocation();

  useEffect(() => {
    let active = true;
    setRows(null);
    setError("");
    API.getRanking().then((r) => { if (active) setRows(r); }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [location.key]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!rows) return <Spinner animation="border" />;

  return (
    <Card>
      <h3 className="atm-band fs-5"><span className="station-dot" />Global ranking — best scores</h3>
      <div className="p-3">
        <Table hover responsive className="table-leaderboard align-middle">
          <thead><tr><th style={{ width: "4rem" }}>Pos</th><th>Player</th><th className="text-end">Best score</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td><span className={`rank-num ${MEDAL[i] || ""}`}>{i + 1}</span></td>
                <td>{r.name}</td>
                <td className="text-end tabular">{r.bestScore}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}
