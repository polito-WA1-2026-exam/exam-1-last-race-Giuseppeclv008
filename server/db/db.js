"use strict";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

let dbPromise;

export function getDb() {
  if (!dbPromise) {
    dbPromise = new sqlite3.Database("lastrace.db", 
        (err) =>{if (err) throw err;});
  }
  return dbPromise;
}
