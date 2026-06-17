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

//Saves only the user's ID into the session, binding it to the user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

//takes the ID and queries the database -> smaller payload and always up to date infos
//the middleware reads a cookie, looks up the session and finds the serialized id
//then dserializes the id and gets the user payload
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