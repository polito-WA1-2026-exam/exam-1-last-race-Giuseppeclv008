"use strict";
const BASE = "http://localhost:3000";

async function handle(res) {
  if (!res.ok) {
    let msg = "Request failed";
    try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const opts = (method, body) => ({
  method,
  credentials: "include",
  headers: body ? { "Content-Type": "application/json" } : undefined,
  body: body ? JSON.stringify(body) : undefined,
});

export const API = {
  login: (username, password) => fetch(`${BASE}/api/sessions`, opts("POST", { username, password })).then(handle),
  logout: () => fetch(`${BASE}/api/sessions/current`, opts("DELETE")).then(handle),
  getCurrentUser: () => fetch(`${BASE}/api/sessions/current`, opts("GET")).then(handle),
  getNetwork: () => fetch(`${BASE}/api/network`, opts("GET")).then(handle),
  startGame: () => fetch(`${BASE}/api/games`, opts("POST")).then(handle),
  submitRoute: (gameId, route) => fetch(`${BASE}/api/games/${gameId}/route`, opts("POST", { route })).then(handle),
  getRanking: () => fetch(`${BASE}/api/ranking`, opts("GET")).then(handle),
};

