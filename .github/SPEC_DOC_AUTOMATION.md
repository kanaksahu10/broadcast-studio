# Spec-doc auto-sync (CI)

Keeps [`spec-doc/broadcast-studio-spec.md`](../spec-doc/broadcast-studio-spec.md)
in step with the prototype code. Implemented in
[`.github/workflows/spec-doc-sync.yml`](workflows/spec-doc-sync.yml).

## What it does

On **every merge to `main` that touches `src/**`**, a GitHub Action runs Claude
Code headless. It:

1. Diffs the merge.
2. Decides whether the change affects the spec (UX behavior, visual specs, design
   tokens, component structure, or acceptance criteria).
3. If yes → edits **only** `spec-doc/broadcast-studio-spec.md` and **opens a PR**
   against `main` for a human to review and merge.
4. If nothing spec-relevant changed → does nothing (no PR, no noise).

It **never** commits to `main` directly — every doc change goes through a
reviewable PR.

## Works for the whole team

This is repository-level automation running on GitHub's runners, keyed to a repo
secret — not to anyone's machine or account. Whoever merges to `main` (you or any
collaborator) triggers it identically. No local setup for contributors.

## One-time setup (required — it no-ops until done)

1. **Install the Claude GitHub App** on this repo: <https://github.com/apps/claude>
2. **Add the repo secret** `ANTHROPIC_API_KEY`
   (Settings → Secrets and variables → Actions → New repository secret).

Until the secret exists, the workflow runs and safely does nothing.

> Recommended: have security/DevOps sign off first — this is an agent with
> write access running in CI. The safety design below is meant to make that an
> easy yes.

## Safety design

- **Trigger:** `push` to `main` only — never `pull_request` from forks, so the
  API key is never exposed to untrusted PRs.
- **Least privilege:** `contents: write` + `pull-requests: write` only.
- **Output is a PR, never a direct push to `main`** — a human reviews every doc
  change before it lands.
- **Scoped edits:** the prompt restricts Claude to editing only
  `spec-doc/broadcast-studio-spec.md`.
- **Loop guard:** `if: github.actor != 'claude[bot]'` stops the bot's own PRs
  from re-triggering it.
- **Prompt-injection guard:** the prompt instructs Claude to treat all repo
  content as data, not instructions.
- **Cost/runaway guard:** `timeout-minutes: 15` and `--max-turns 15`.

## Turning it off

Disable the workflow in the Actions tab, or delete
`.github/workflows/spec-doc-sync.yml`. Removing the `ANTHROPIC_API_KEY` secret
also renders it inert.

## Phase 2 (not yet wired): Confluence sync

This workflow keeps the **in-repo markdown** in sync. To also update the
Confluence PRD sub-page
([Broadcast Studio — Prototype Spec & Handoff (UX)](https://geoh.atlassian.net/wiki/spaces/GM/pages/975241218/Broadcast+Studio+Prototype+Spec+Handoff+UX)),
add a second step that pushes the **merged** markdown to Confluence via the
Atlassian REST API — using an `ATLASSIAN_API_TOKEN` secret and syncing from the
reviewed doc, not raw model output. Deferred until the token/approach is decided.
