"use strict";
import { Router } from "express";
import { body, validationResult } from "express-validator";
import { passport } from "../lib/auth.js";

const router = Router();

router.post("/api/sessions",
  body("username").isString().notEmpty(),
  body("password").isString().notEmpty(),
  (req, res, next) => {
    if (!validationResult(req).isEmpty()) return res.status(422).json({ error: "Invalid input" });
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Login failed" });
      req.login(user, (e) => {
        if (e) return next(e);
        return res.json({ id: user.id, username: user.username, name: user.name });
      });
    })(req, res, next);
  });

router.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  return res.status(401).json({ error: "Not authenticated" });
});

router.delete("/api/sessions/current", (req, res) => {
  req.logout(() => res.end());
});

export default router;
