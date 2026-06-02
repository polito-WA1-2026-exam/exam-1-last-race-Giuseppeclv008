"use strict";
import { useState } from "react";
import { Form, Button, Alert, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) { setError("Enter username and password"); return; }
    try { await login(username.trim(), password); navigate("/play"); }
    catch (err) { setError(err.message); }
  };

  return (
    <Card className="mx-auto mt-5" style={{ maxWidth: 400 }}>
      <h1 className="atm-band fs-5"><span className="station-dot" />Login</h1>
      <div className="p-4">
        <p className="eyebrow mb-3">Access your travelcard</p>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Form.Group>
          <Button type="submit" className="w-100">Login</Button>
        </Form>
      </div>
    </Card>
  );
}
