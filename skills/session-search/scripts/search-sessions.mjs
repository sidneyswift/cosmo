#!/usr/bin/env node
/**
 * Session Search — Three-shape search tool for past conversations.
 *
 * DISCOVER: --query "search terms" [--limit N] [--sort newest|oldest]
 * SCROLL:   --session-id UUID --around MSG_ID [--window N]
 * BROWSE:   --browse [--limit N]
 *
 * Usage:
 *   node search-sessions.mjs --query "auth refactor" --limit 3
 *   node search-sessions.mjs --session-id abc-123 --around 42 --window 10
 *   node search-sessions.mjs --browse --limit 10
 */

import { execSync } from "child_process";
import { homedir } from "os";
import { join } from "path";

const DB_PATH = join(homedir(), ".openclaw", "workspace", "db", "sessions.db");

// Parse args
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  if (idx === -1) return undefined;
  return args[idx + 1];
}
function hasFlag(name) {
  return args.includes(name);
}

const query = getArg("--query");
const sessionId = getArg("--session-id");
const around = getArg("--around");
const window = parseInt(getArg("--window") || "5", 10);
const limit = parseInt(getArg("--limit") || "3", 10);
const sort = getArg("--sort"); // newest | oldest
const browse = hasFlag("--browse");
const jsonOutput = hasFlag("--json");

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
    const stderr = e.stderr?.toString() || "";
    if (stderr.includes("no such table")) {
      console.error(
        "Session search database not initialized. Run:\n  bash ~/.openclaw/workspace/skills/session-search/scripts/setup-session-db.sh"
      );
      process.exit(1);
    }
    return [];
  }
}

function sanitizeFts5Query(q) {
  // Remove unmatched quotes
  const quoteCount = (q.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    q = q.replace(/"/g, "");
  }
  // Remove unmatched parens
  q = q.replace(/[()]/g, "");
  // Escape remaining special chars
  q = q.replace(/[{}[\]^~]/g, "");
  // Wrap hyphenated/dotted terms in quotes so FTS5 doesn't split them
  q = q.replace(/\b([\w][\w.-]+[\w])\b/g, (match) => {
    if (match.includes("-") || match.includes(".")) {
      return `"${match}"`;
    }
    return match;
  });
  return q.trim();
}

function escSql(s) {
  if (s == null) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function formatTimestamp(ts) {
  if (!ts) return "unknown";
  try {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

// ── BROWSE shape ──
if (browse || (!query && !sessionId)) {
  const rows = sqlQuery(`
    SELECT id, started_at, source, model, message_count, first_user_message
    FROM sessions
    WHERE source NOT IN ('cron', 'heartbeat')
    ORDER BY started_at DESC
    LIMIT ${Math.min(limit, 20)}
  `);

  if (jsonOutput) {
    console.log(JSON.stringify({ mode: "browse", results: rows }, null, 2));
  } else {
    if (rows.length === 0) {
      console.log("No sessions found. Run the indexer first.");
      process.exit(0);
    }
    console.log(`📋 Recent sessions (${rows.length}):\n`);
    for (const [i, r] of rows.entries()) {
      const preview = (r.first_user_message || "").slice(0, 80).replace(/\n/g, " ");
      console.log(
        `  ${i + 1}. ${formatTimestamp(r.started_at)} [${r.source}] (${r.message_count} msgs)`
      );
      console.log(`     ${preview}${preview.length >= 80 ? "..." : ""}`);
      console.log(`     id: ${r.id}\n`);
    }
  }
  process.exit(0);
}

// ── SCROLL shape ──
if (sessionId && around) {
  const anchorId = parseInt(around, 10);
  const halfWindow = Math.min(window, 20);

  const rows = sqlQuery(`
    SELECT id, role, content, timestamp, seq
    FROM messages
    WHERE session_id = ${escSql(sessionId)}
      AND seq BETWEEN (
        SELECT seq FROM messages WHERE id = ${anchorId}
      ) - ${halfWindow}
      AND (
        SELECT seq FROM messages WHERE id = ${anchorId}
      ) + ${halfWindow}
    ORDER BY seq
  `);

  // Count messages before/after
  const countBefore = sqlQuery(`
    SELECT count(*) as c FROM messages
    WHERE session_id = ${escSql(sessionId)}
      AND seq < (SELECT seq FROM messages WHERE id = ${anchorId}) - ${halfWindow}
  `)[0]?.c || 0;

  const countAfter = sqlQuery(`
    SELECT count(*) as c FROM messages
    WHERE session_id = ${escSql(sessionId)}
      AND seq > (SELECT seq FROM messages WHERE id = ${anchorId}) + ${halfWindow}
  `)[0]?.c || 0;

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          mode: "scroll",
          session_id: sessionId,
          around_message_id: anchorId,
          window: halfWindow,
          messages: rows,
          messages_before: countBefore,
          messages_after: countAfter,
        },
        null,
        2
      )
    );
  } else {
    if (rows.length === 0) {
      console.log("No messages found at that anchor point.");
      process.exit(0);
    }
    console.log(`📍 Session ${sessionId} — window around message ${anchorId}:\n`);
    console.log(
      `   (${countBefore} messages before | showing ${rows.length} | ${countAfter} messages after)\n`
    );
    for (const m of rows) {
      const marker = m.id === anchorId ? " ⟵ match" : "";
      const text = (m.content || "").slice(0, 300).replace(/\n/g, "\n     ");
      console.log(`   [${m.role}]${marker} ${text}\n`);
    }
  }
  process.exit(0);
}

// ── DISCOVER shape ──
if (query) {
  const sanitized = sanitizeFts5Query(query);
  if (!sanitized) {
    console.error("Empty query after sanitization");
    process.exit(1);
  }

  // FTS5 search
  let orderClause = "ORDER BY rank"; // BM25 relevance
  if (sort === "newest") orderClause = "ORDER BY m.timestamp DESC";
  if (sort === "oldest") orderClause = "ORDER BY m.timestamp ASC";

  const hits = sqlQuery(`
    SELECT
      m.id,
      m.session_id,
      m.role,
      m.content,
      m.timestamp,
      m.seq,
      s.started_at,
      s.source,
      s.model,
      s.message_count,
      snippet(messages_fts, 0, '>>>', '<<<', '...', 40) as snippet
    FROM messages_fts
    JOIN messages m ON m.id = messages_fts.rowid
    JOIN sessions s ON s.id = m.session_id
    WHERE messages_fts MATCH ${escSql(sanitized)}
      AND s.source NOT IN ('cron', 'heartbeat')
    ${orderClause}
    LIMIT ${Math.min(limit * 5, 50)}
  `);

  // Deduplicate by session — keep first hit per session
  const seenSessions = new Set();
  const dedupedHits = [];
  for (const hit of hits) {
    if (seenSessions.has(hit.session_id)) continue;
    seenSessions.add(hit.session_id);
    dedupedHits.push(hit);
    if (dedupedHits.length >= limit) break;
  }

  if (dedupedHits.length === 0) {
    if (jsonOutput) {
      console.log(JSON.stringify({ mode: "discover", query, results: [], count: 0 }));
    } else {
      console.log(`No results found for: "${query}"`);
    }
    process.exit(0);
  }

  // For each hit, get bookends + window
  const results = [];
  for (const hit of dedupedHits) {
    const sid = hit.session_id;
    const matchSeq = hit.seq;

    // Bookend start: first 3 user+assistant messages
    const bookendStart = sqlQuery(`
      SELECT id, role, content, timestamp, seq FROM messages
      WHERE session_id = ${escSql(sid)} AND role IN ('user', 'assistant')
      ORDER BY seq LIMIT 3
    `);

    // Window: ±5 around match
    const windowMsgs = sqlQuery(`
      SELECT id, role, content, timestamp, seq FROM messages
      WHERE session_id = ${escSql(sid)}
        AND seq BETWEEN ${matchSeq - 5} AND ${matchSeq + 5}
      ORDER BY seq
    `);

    // Bookend end: last 3 user+assistant messages
    const bookendEnd = sqlQuery(`
      SELECT id, role, content, timestamp, seq FROM messages
      WHERE session_id = ${escSql(sid)} AND role IN ('user', 'assistant')
      ORDER BY seq DESC LIMIT 3
    `);

    // Count before/after
    const msgsBefore = sqlQuery(`
      SELECT count(*) as c FROM messages
      WHERE session_id = ${escSql(sid)} AND seq < ${matchSeq - 5}
    `)[0]?.c || 0;

    const msgsAfter = sqlQuery(`
      SELECT count(*) as c FROM messages
      WHERE session_id = ${escSql(sid)} AND seq > ${matchSeq + 5}
    `)[0]?.c || 0;

    results.push({
      session_id: sid,
      when: hit.started_at,
      source: hit.source,
      model: hit.model,
      matched_role: hit.role,
      match_message_id: hit.id,
      snippet: hit.snippet,
      bookend_start: bookendStart,
      messages: windowMsgs,
      bookend_end: bookendEnd.reverse(),
      messages_before: msgsBefore,
      messages_after: msgsAfter,
    });
  }

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        { mode: "discover", query, results, count: results.length },
        null,
        2
      )
    );
  } else {
    console.log(`🔍 Search results for "${query}" (${results.length} sessions):\n`);
    for (const [i, r] of results.entries()) {
      console.log(`━━━ ${i + 1}. Session from ${formatTimestamp(r.when)} [${r.source}] ━━━`);
      console.log(`    ID: ${r.session_id}`);
      const snippet = (r.snippet || "")
        .replace(/>>>/g, "**")
        .replace(/<<</g, "**");
      console.log(`    Snippet: ${snippet}\n`);

      // Show bookend start
      if (r.bookend_start.length > 0) {
        console.log("    ┌─ Session start:");
        for (const m of r.bookend_start) {
          const text = (m.content || "").slice(0, 150).replace(/\n/g, " ");
          console.log(`    │ [${m.role}] ${text}`);
        }
        if (r.messages_before > 0) {
          console.log(`    │ ... (${r.messages_before} messages) ...`);
        }
      }

      // Show match window
      console.log("    ├─ Around match:");
      for (const m of r.messages) {
        const marker = m.id === r.match_message_id ? " ⟵" : "";
        const text = (m.content || "").slice(0, 200).replace(/\n/g, " ");
        console.log(`    │ [${m.role}]${marker} ${text}`);
      }

      // Show bookend end
      if (r.messages_after > 0) {
        console.log(`    │ ... (${r.messages_after} messages) ...`);
      }
      if (r.bookend_end.length > 0) {
        console.log("    └─ Session end:");
        for (const m of r.bookend_end) {
          const text = (m.content || "").slice(0, 150).replace(/\n/g, " ");
          console.log(`      [${m.role}] ${text}`);
        }
      }
      console.log();
    }
  }
  process.exit(0);
}

console.error(
  "Usage:\n" +
    "  --query <text> [--limit N] [--sort newest|oldest]  Search sessions\n" +
    "  --session-id <id> --around <msg_id> [--window N]   Scroll in session\n" +
    "  --browse [--limit N]                                Recent sessions\n" +
    "  --json                                              JSON output"
);
process.exit(1);
