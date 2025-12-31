const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database.db");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS committee_counter (
    committee TEXT PRIMARY KEY,
    last_number INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    committee TEXT,
    file_number TEXT UNIQUE,
    submission_date TEXT,
    document_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  ["PAC","DPC","DRC","HEAD"].forEach(c => {
    db.run("INSERT OR IGNORE INTO committee_counter VALUES (?,0)", [c]);
  });
});

db.close();
