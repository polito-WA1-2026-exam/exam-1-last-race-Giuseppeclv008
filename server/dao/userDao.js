"use strict";

import crypto from "crypto";
import { dbGet } from "../db/db.js";

export async function getUserByUsername(username) {
    return await dbGet("SELECT * FROM users WHERE username = ?", [username]);
}

export async function getUserById(id) {
    const u = await dbGet("SELECT * FROM users WHERE id = ?", [id]);
    return u || null;
}

export async function verifyPassword(user, password) {
    const hashBuffer = Buffer.from(user.hash, "hex");
    const test = crypto.scryptSync(password, user.salt, 32); // hash the provided password with the same salt and key length
    return hashBuffer.length === test.length && crypto.timingSafeEqual(hashBuffer, test);
}
