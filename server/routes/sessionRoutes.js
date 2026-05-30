"use strict";

import { Router } from "express";
import { body, validationResult } from "express-validator";
import { passport } from "../lib/auth.js";

const router = Router();

router.post("api/sessions",
    body("username").isString().notEmpty(),
    body("password").isString().notEmpty(),
    (req, res, next) => {
        if (!validationResult(req).isEmpty()) return res.status(400).json({ error: "Invalid input" });
        passport.authenticate("local", (err, user, info) => {
            if (err) return next(err);
            if (!user) return res.status(401).json({ error: info.message || "Login failed" });
            req.login(user, (err) => {
                if (err) return next(err);
                return res.json({ id: user.id, username: user.username, name: user.name });
            });
        })(req, res, next);
    });

router.get("/api/sessions/current", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    return res.json(req.user);
});

router.delete("/api/sessions/current", (req, res) => {
    req.logout(() => {
        res.status(204).end();
    });
});

export default router;