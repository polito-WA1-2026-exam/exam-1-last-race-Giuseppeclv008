"use strict";
import sqlite3 from "sqlite3";
export const DB_PATH = "db/lastrace.db";

// Singleton pattern to ensure that only one database connection is established
// If the database connection has already been established, it returns the existing object

let db;

export function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, 
        (err) =>{if (err) throw err;});
    db.run("PRAGMA foreign_keys = ON");
  }
  return db;
}

export function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        getDb().all(sql, params, (err, rows) => { (err) ? reject(err) : resolve(rows); });
    });
}

export function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        getDb().get(sql, params, (err, row) => { (err) ? reject(err) : resolve(row); });
    });
}

export function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        getDb().run(sql, params, function(err) {
             if (err) reject(err);
             else resolve({lastID: this.lastID, changes: this.changes});
        });
    });
}