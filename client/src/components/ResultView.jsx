"use strict";
import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function ResultView({ result, onPlayAgain }) {
  return (
    <Card>
      <h2 className="atm-band fs-5"><span className="station-dot" />Final result</h2>
      <div className="atm-ticket text-center m-3">
        <p className="eyebrow mb-2">Coins remaining</p>
        <div className="score-figure">{result.finalScore}<span className="unit"> coins</span></div>
        {!result.valid && <p className="text-danger mt-2 mb-0">Invalid or incomplete route — scored 0.</p>}
        <div className="d-flex justify-content-center gap-3 mt-4">
          <Button onClick={onPlayAgain}>Play again</Button>
          <Button variant="outline-info" as={Link} to="/ranking">View ranking</Button>
        </div>
      </div>
    </Card>
  );
}
