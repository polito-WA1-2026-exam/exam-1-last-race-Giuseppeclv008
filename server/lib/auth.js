"use strict";

import passport from "passport";
import session from "express-session";
import { Strategy as LocalStrategy } from "passport-local";
import { getUserByUsername, getUserById, verifyPassword } from "../dao/userDao.js";

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await getUserByUsername(username);
        if (!user || !(await verifyPassword(user, password))) return done(null, false, { message: "Incorrect username or password." });
        return done(null, { id: user.id, username: user.username, name: user.name });
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await getUserById(id);
        if (!user) return done(new Error("User not found"));
        return done(null, user);
    } catch (err) {
        return done(err);
    }
});

export const sessionMiddleware = session({
    secret: "What is the color of the white horse of Napoleon?",
    resave: false,
    saveUninitialized: false
});

export function isLoggedIn(req, res, next){
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: "Unauthorized" });
}

export { passport };