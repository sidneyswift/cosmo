#!/usr/bin/env node
/**
 * Session Indexer — Parse OpenClaw JSONL session files and populate the FTS5 index.
 *
 * Reads all *.jsonl files from ~/.openclaw/agents/main/sessions/
 * Skips deleted (.deleted.) and reset (.reset.) files.
 * Tracks file mtime to avoid re-indexing unchanged files.
 *
 * Usage: node index-sessions.mjs [--force] [--quiet]
 */

import { execSync } from "child_process";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, basename } from "path";
import { homedir } from "os";

const SESSIONS_DIR = join(homedir(), ".openclaw", "agents", "main", "sessions");
const DB_PATH = join(homedir(), ".openclaw", "workspace", "db", "sessions.db");
const SETUP_SCRIPT = join(
  homedir(),
  ".openclaw",
  "workspace",
  "skills",
  "session-search",
  "scripts",
  "setup-session-db.sh"
);

const args = process.argv.slice(2);
const force = args.includes("--force");
const quiet = args.includes("--quiet");

function log(...msg) {
  if (!quiet) console.log(...msg);
}

function sqlEscape(str) {
  if (str == null) return "NULL";
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function sqlExec(sql) {
  try {
    execSync(`sqlite3 "${DB_PATH}"`, {
      input: sql,
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch (e) {
    console.error("SQL error:", e.stderr?.toString()?.slice(0, 500));
    throw e;
  }
}

function sqlQuery(sql) {
  try {
    const result = execSync(`sqlite3 -json "${DB_PATH}"`, {
      input: sql,
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 10 * 1024 * 1024,
    });
    const text = result.toString().trim();
    if (!text) return [];
    return JSON.parse(text);
  } catch (e) {
    return [];
  }
}

// Ensure DB exists
try {
  statSync(DB_PATH);
} catch {
  log("Database not found, running setup...");
  execSync(`bash "${SETUP_SCRIPT}"`, { stdio: "inherit" });
}

// Get already-indexed sessions with their mtimes
const indexed = new Map();
for (const row of sqlQuery(
  "SELECT id, file_mtime FROM sessions"
)) {
  indexed.set(row.id, row.file_mtime);
}

// List session files
let files;
try {
  files = readdirSync(SESSIONS_DIR).filter(
    (f) =>
      f.endsWith(".jsonl") &&
      !f.includes(".deleted.") &&
      !f.includes(".reset.")
  );
} catch (e) {
  console.error("Cannot read sessions directory:", SESSIONS_DIR);
  process.exit(1);
}

log(`Found ${files.length} session files, ${indexed.size} already indexed`);

let newCount = 0;
let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

for (const file of files) {
  const filePath = join(SESSIONS_DIR, file);
  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    continue;
  }

  const mtime = stat.mtimeMs;

  // Extract session ID from filename (UUID part before any -topic- suffix)
  const sessionId = basename(file, ".jsonl").split("-topic-")[0];

  // Skip if already indexed and not modified
  if (!force && indexed.has(sessionId) && indexed.get(sessionId) >= mtime) {
    skippedCount++;
    continue;
  }

  // Parse the JSONL file
  let lines;
  try {
    lines = readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
  } catch (e) {
    errorCount++;
    continue;
  }

  let sessionMeta = {};
  const messages = [];
  let seq = 0;

  for (const line of lines) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (entry.type === "session") {
      sessionMeta = {
        id: entry.id || sessionId,
        timestamp: entry.timestamp,
      };
    } else if (entry.type === "model_change") {
      sessionMeta.model = entry.modelId || entry.model;
    } else if (entry.type === "message") {
      const msg = entry.message || {};
      const role = msg.role;
      if (!role || !["user", "assistant", "toolResult"].includes(role)) continue;

      // Extract text content
      let text = "";
      const content = msg.content;
      if (typeof content === "string") {
        text = content;
      } else if (Array.isArray(content)) {
        text = content
          .filter((c) => c.type === "text" && c.text)
          .map((c) => c.text)
          .join(" ");
      }

      if (!text.trim()) continue;

      // Skip thinking blocks
      if (
        Array.isArray(content) &&
        content.length === 1 &&
        content[0].type === "thinking"
      )
        continue;

      seq++;
      messages.push({
        messageId: entry.id,
        role: role === "toolResult" ? "tool" : role,
        content: text.slice(0, 10000), // Cap per-message to prevent huge entries
        timestamp: entry.timestamp,
        seq,
      });
    }
  }

  if (messages.length === 0) {
    skippedCount++;
    continue;
  }

  const sid = sessionMeta.id || sessionId;

  // Determine source from first user message
  const firstUser = messages.find((m) => m.role === "user");
  const firstUserText = firstUser?.content || "";
  let source = "cli";
  if (firstUserText.startsWith("[cron:")) source = "cron";
  else if (firstUserText.includes("HEARTBEAT")) source = "heartbeat";
  else if (file.includes("-topic-")) source = "thread";

  // Build SQL batch
  let sql = "BEGIN TRANSACTION;\n";

  // Delete old data if re-indexing
  if (indexed.has(sessionId)) {
    sql += `DELETE FROM messages WHERE session_id = ${sqlEscape(sid)};\n`;
    sql += `DELETE FROM sessions WHERE id = ${sqlEscape(sid)};\n`;
    updatedCount++;
  } else {
    newCount++;
  }

  // Insert session
  sql += `INSERT OR REPLACE INTO sessions (id, file_path, started_at, source, model, message_count, first_user_message, last_message_at, file_mtime) VALUES (`;
  sql += `${sqlEscape(sid)}, `;
  sql += `${sqlEscape(filePath)}, `;
  sql += `${sqlEscape(sessionMeta.timestamp)}, `;
  sql += `${sqlEscape(source)}, `;
  sql += `${sqlEscape(sessionMeta.model)}, `;
  sql += `${messages.length}, `;
  sql += `${sqlEscape(firstUserText.slice(0, 200))}, `;
  sql += `${sqlEscape(messages[messages.length - 1]?.timestamp)}, `;
  sql += `${mtime});\n`;

  // Insert messages
  for (const msg of messages) {
    sql += `INSERT INTO messages (session_id, message_id, role, content, timestamp, seq) VALUES (`;
    sql += `${sqlEscape(sid)}, `;
    sql += `${sqlEscape(msg.messageId)}, `;
    sql += `${sqlEscape(msg.role)}, `;
    sql += `${sqlEscape(msg.content)}, `;
    sql += `${sqlEscape(msg.timestamp)}, `;
    sql += `${msg.seq});\n`;
  }

  sql += "COMMIT;\n";

  try {
    sqlExec(sql);
  } catch (e) {
    errorCount++;
    log(`Error indexing ${file}: ${e.message?.slice(0, 200)}`);
    // Try to rollback
    try {
      sqlExec("ROLLBACK;");
    } catch {}
  }
}

// Update indexer state
try {
  sqlExec(
    `INSERT OR REPLACE INTO indexer_state (key, value) VALUES ('last_indexed_at', '${new Date().toISOString()}');`
  );
} catch {}

// Get totals
const totalSessions = sqlQuery("SELECT count(*) as c FROM sessions")[0]?.c || 0;
const totalMessages = sqlQuery("SELECT count(*) as c FROM messages")[0]?.c || 0;

log(`\n✅ Indexing complete:`);
log(`   New: ${newCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
log(`   Total: ${totalSessions} sessions, ${totalMessages} messages indexed`);
