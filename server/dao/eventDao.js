"use strict";
import { dbAll } from "../db/db.js";

export async function getEvents() {
    return dbAll("SELECT id, description, effect, weight FROM events");
}