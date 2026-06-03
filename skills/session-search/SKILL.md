---
name: session-search
version: 1.0.0
description: |
  Full-text search across past conversations using SQLite FTS5. Three modes:
  DISCOVER (query search), SCROLL (anchor + window), BROWSE (recent sessions).
  Adapted from Hermes Agent's session_search_tool pattern.
triggers:
  - "what did we discuss about X"
  - "find the conversation where"
  - "where did we leave off with"
  - "search past sessions"
  - "what was I working on"
  - "session search"
tools:
  - exec
  - read
mutating: false
---

# Session Search — Long-Term Conversation Recall

Search past conversations stored in the local session DB. FTS5-backed retrieval
over a SQLite index of all session transcripts. Zero LLM cost for search — pure
database queries.

## Contract

This skill guarantees:
- Fast full-text search across all past conversations
- Three calling shapes: DISCOVER, SCROLL, BROWSE
- Current session excluded from results (already in context)
- Heartbeat/cron sessions filtered by default

## Prerequisites

The session search database must be initialized. Run setup if it doesn't exist:
```bash
bash ~/.openclaw/workspace/skills/session-search/scripts/setup-session-db.sh
```

Then index existing sessions:
```bash
node ~/.openclaw/workspace/skills/session-search/scripts/index-sessions.mjs
```

The indexer should run periodically (add to HEARTBEAT.md or cron).

## Shape 1: DISCOVER — Search by Query

Use when: "what did we discuss about X", "find the session where we talked about Y"

```bash
node ~/.openclaw/workspace/skills/session-search/scripts/search-sessions.mjs \
  --query "auth refactor" \
  --limit 3
```

Returns for each hit:
- `session_id` — unique session identifier
- `timestamp` — when the session started
- `snippet` — FTS5-highlighted match excerpt
- `bookend_start` — first 3 user+assistant messages (the goal/kickoff)
- `messages` — ±5 messages around the match (the hit in context)
- `bookend_end` — last 3 user+assistant messages (the resolution)
- `match_message_id` — ID of the matched message for scrolling

Bookends + window = goal → match → resolution without loading the full transcript.

### FTS5 Query Syntax

- Multi-word: all terms required by default (implicit AND)
- Boolean: `alpha OR beta`, `python NOT java`
- Quoted phrases: `"docker networking"`
- Prefix wildcards: `deploy*`
- Combine: `"api key" OR authentication NOT oauth`

## Shape 2: SCROLL — Read Around a Known Point

Use when: you found a match via DISCOVER and need more context.

```bash
node ~/.openclaw/workspace/skills/session-search/scripts/search-sessions.mjs \
  --session-id "abc-123" \
  --around 42 \
  --window 10
```

Returns ±window messages centered on the anchor message. No FTS5, no bookends.

- To scroll FORWARD: pass the last message's ID as the new anchor
- To scroll BACKWARD: pass the first message's ID as the new anchor
- When `messages_before` or `messages_after` < window, you're at session boundary

## Shape 3: BROWSE — Recent Sessions

Use when: "what was I working on", "show recent conversations"

```bash
node ~/.openclaw/workspace/skills/session-search/scripts/search-sessions.mjs \
  --browse \
  --limit 10
```

Returns recent sessions chronologically: session_id, timestamp, preview, message count.

## When to Use

Reach for session search on ANY:
- "What did we do about X?"
- "Where did we leave Y?"
- "Find the session where Z"
- "How did we handle this before?"
- "What was the decision on X?"

Use BEFORE web search, filesystem inspection, or external APIs. The session DB
carries what was said when; external tools show current world state.

## Indexing

The indexer parses OpenClaw's JSONL session files and populates the FTS5 index.

### Manual Index Run
```bash
node ~/.openclaw/workspace/skills/session-search/scripts/index-sessions.mjs
```

### What Gets Indexed
- All `*.jsonl` session files in `~/.openclaw/agents/main/sessions/`
- Message roles: user, assistant, toolResult
- Text content only (thinking blocks, tool calls excluded from FTS)
- Session metadata: start time, source, model

### What Gets Skipped
- Deleted sessions (`*.deleted.*`)
- Reset sessions (`*.reset.*`)
- Already-indexed sessions (tracked by file mtime)

## Output Format

When presenting search results to the user, format as:

```
📍 Session from <date> (<source>):
   Snippet: "...matched text..."
   Context:
   [user] <message>
   [assistant] <response>
   ...
```

For browse results:
```
📋 Recent sessions:
   1. <date> — <preview> (N messages)
   2. <date> — <preview> (N messages)
   ...
```

## Anti-Patterns

- ❌ Searching for things already in the current conversation context
- ❌ Using session search for brain/wiki lookups (use gbrain for that)
- ❌ Returning raw JSON to the user (format it human-readable)
- ❌ Loading full session transcripts when bookends + window suffice
