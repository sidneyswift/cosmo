# Skill Archive Candidates

Skills that may be unused or redundant. Review before archiving.

## Candidates

### Likely Dead
- **linkedin-saas-playbook** — One-off LinkedIn strategy playbook. Likely used once and done.
- **html-lead-magnet** — HTML lead magnet generator. No evidence of recent use.
- **social-slides** — May be superseded by auto-slides in content-engine.

### Possibly Redundant
- **article-enrichment** vs **enrich** — Two enrichment skills. Check if one supersedes the other.
- **data-research** vs **perplexity-research** — Overlapping research capabilities.
- **skill-creator** vs **skillify** — Both create skills. Check which is canonical.
- **daily-task-manager** vs **daily-task-prep** — Similar names, may overlap.

### Check Usage
- **cross-modal-review** — Specialized review skill. Check if actively triggered.
- **functional-area-resolver** — May be internal-only tooling.
- **signal-detector** — Check if any cron or heartbeat triggers this.
- **nightly-value** — Check if this is content-engine's nightly or separate.
- **book-mirror** — Specialized. Check last use.

## How to Verify
1. `grep -r "skill-name" ~/.openclaw/workspace/` — check if referenced
2. Check cron jobs for skill triggers
3. Check HEARTBEAT.md for skill references
4. Ask Sid which ones he actively uses
