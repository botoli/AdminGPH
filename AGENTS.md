# AGENTS.md

## Purpose

This repository uses `AI_PROJECT_CONTEXT.md` as the primary project memory file for AI coding agents.

Before making code changes, every AI agent must read `AI_PROJECT_CONTEXT.md` first and use it as the main architectural guide.

The goal is to avoid unnecessary full-repository scans, reduce context usage, and keep changes aligned with the existing architecture.

---

## Required First Step

Before starting any task:

1. Open `AI_PROJECT_CONTEXT.md`.
2. Read the relevant sections:
   - Project Summary
   - Directory Map
   - High-Level Architecture
   - Core Modules
   - Legacy Zones
   - Dangerous / Sensitive Areas
   - Recommended Verification Commands

3. Only then inspect task-specific files.

If `AI_PROJECT_CONTEXT.md` is missing, outdated, or obviously incomplete, analyze the repository and create/update it before making feature changes.

---

## Repository Analysis Rule

When asked to analyze the project architecture, create or update:

`AI_PROJECT_CONTEXT.md`

Do not modify application code during architecture analysis unless explicitly instructed.

The analysis must be factual, based on real files and paths. Do not invent architecture. Mark uncertainty as:

`Needs verification`

---

## Change Strategy

Prefer small, localized changes.

Before editing:

1. Identify the relevant module/domain.
2. Find nearby similar implementations.
3. Follow existing project conventions.
4. Avoid introducing new architecture unless requested.
5. Do not rewrite large areas of legacy code unless the task explicitly requires it.

---

## Context Usage Rules

Do not scan the entire repository unless necessary.

Recommended order:

1. `AI_PROJECT_CONTEXT.md`
2. Relevant entry point
3. Relevant module/domain folder
4. Related shared utilities
5. Tests
6. Config/build files only if needed

Avoid reading unrelated folders.

---

## Legacy Code Rules

Legacy areas must be treated carefully.

Before changing legacy code:

1. Check whether the area is listed in `AI_PROJECT_CONTEXT.md`.
2. Identify dependencies and side effects.
3. Prefer minimal safe patches.
4. Avoid broad refactors.
5. Preserve existing behavior unless the task says otherwise.

---

## Dangerous Areas

Be extra careful with:

- authentication
- authorization
- payments
- billing
- database migrations
- schemas
- background jobs
- queues
- caching
- deployment scripts
- infrastructure
- global configuration
- shared clients
- shared state
- security-sensitive code

Do not modify these casually.

---

## Verification

After changes, run the verification commands listed in `AI_PROJECT_CONTEXT.md`.

If commands are unavailable, inspect project config and infer the correct ones.

Typical commands may include:

```bash
npm run lint
npm run test
npm run build
npm run typecheck
```

or equivalents for the detected stack.

Examples:

```bash
go test ./...
mvn test
gradle test
pytest
cargo test
dotnet test
```

Report which commands were run and whether they passed.

---

## AI Agent Behavior

When working in this repository:

- Be concrete.
- Use real file paths.
- Prefer existing patterns.
- Do not invent missing abstractions.
- Do not silently ignore errors.
- Do not make unrelated changes.
- Do not remove legacy code without confirmation.
- Do not change formatting across unrelated files.
- Keep diffs focused.
- Explain risks when touching sensitive areas.

---

## Updating AI_PROJECT_CONTEXT.md

Update `AI_PROJECT_CONTEXT.md` when:

- architecture changes
- new major modules are added
- entry points change
- build/test commands change
- data layer changes
- deployment changes
- dangerous areas change
- legacy zones are removed or introduced

Keep it concise and useful for future agents.

---

## Final Response Requirements

After completing work, summarize:

1. What changed
2. Files modified
3. Verification commands run
4. Risks or follow-up notes
5. Whether `AI_PROJECT_CONTEXT.md` was used or updated
