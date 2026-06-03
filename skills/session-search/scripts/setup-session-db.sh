#!/usr/bin/env bash
# Setup the session search SQLite database with FTS5 index.
# Run once, or re-run safely (uses IF NOT EXISTS).

set -euo pipefail

DB_DIR="${HOME}/.openclaw/workspace/db"
DB_PATH="${DB_DIR}/sessions.db"

mkdir -p "$DB_DIR"

echo "Setting up session search database at ${DB_PATH}..."

sqlite3 "$DB_PATH" <<'SQL'
-- Enable WAL mode for concurrent readers + one writer
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    started_at TEXT,
    source TEXT DEFAULT 'cli',
    model TEXT,
    message_count INTEGER DEFAULT 0,
    first_user_message TEXT,
    last_message_at TEXT,
    file_mtime REAL NOT NULL,
    indexed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_source ON sessions(source);
CREATE INDEX IF NOT EXISTS idx_sessions_file_mtime ON sessions(file_mtime);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    message_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TEXT,
    seq INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
    content,
    content='messages',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2'
);

-- Triggers to keep FTS5 in sync with messages table
CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
    INSERT INTO messages_fts(rowid, content) VALUES (new.id, new.content);
END;

CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, content) VALUES('delete', old.id, old.content);
END;

CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, content) VALUES('delete', old.id, old.content);
    INSERT INTO messages_fts(rowid, content) VALUES (new.id, new.content);
END;

-- Indexer state tracking
CREATE TABLE IF NOT EXISTS indexer_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
SQL

echo "✅ Session search database ready at ${DB_PATH}"
echo "   Tables: sessions, messages, messages_fts"
echo "   Mode: WAL"
echo ""
echo "Next: run 'node ~/.openclaw/workspace/skills/session-search/scripts/index-sessions.mjs' to index sessions"
