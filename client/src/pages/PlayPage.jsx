"use strict";
import { useState } from "react";
import { Alert } from "react-bootstrap";
import { API } from "../api/API.js";
import SetupView from "../components/SetupView.jsx";
import PlanningView from "../components/PlanningView.jsx";
import ExecutionView from "../components/ExecutionView.jsx";
import ResultView from "../components/ResultView.jsx";

export default function PlayPage() {
    const [phase, setPhase] = useState("setup"); // setup | planning | execution | result
    const [game, setGame] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const startPlanning = async () => {
        try {
            const g = await API.startGame();
            setGame(g);
            setPhase("planning");
        }
        catch (e) { setError(e.message); }
    };

    const submitRoute = async (route) => {
        try {
            const r = await API.submitRoute(game.gameId, route);
            setResult(r);
            setPhase("execution");
        }
        catch (e) { setError(e.message); }
    };

    const restart = () => {
        setGame(null);
        setResult(null);
        setError("");
        setPhase("setup");
    };

    if (error) return <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>;

    return (
        <>
            {phase === "setup" && <SetupView onReady={startPlanning} />}
            {phase === "planning" && game && <PlanningView game={game} onSubmit={submitRoute} />}
            {phase === "execution" && result && <ExecutionView result={result} onDone={() => setPhase("result")} />}
            {phase === "result" && result && <ResultView result={result} onPlayAgain={restart} />}
        </>
    );
}
