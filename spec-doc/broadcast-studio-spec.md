# Broadcast Studio — Prototype Spec & Handoff

> **Status:** Draft v1 · **Owner:** UX · **Parent:** [PRD: GEOH Broadcast Studio](https://geoh.atlassian.net/wiki/spaces/GM/pages/780828674/PRD+GEOH+Broadcast+Studio) · **Source of truth for UX/behavior:** the working prototype (no Figma — the prototype defines both visual and interaction)

---

## 1. Overview

This is the **UX / interaction spec and dev-handoff** layer beneath the [PRD](https://geoh.atlassian.net/wiki/spaces/GM/pages/780828674/PRD+GEOH+Broadcast+Studio). The PRD owns *what and why* (requirements, approval governance, success metrics); this page owns *how it looks and behaves*, with per-feature acceptance criteria for **Dev** (reimplement in the Azure DevOps codebase), **PM** (scope & sign-off), and **QA** (test against the prototype).

**Roles** (per PRD personas)
- `super-admin` — GEOH Message Author: composes messages, sends for approval, manages drafts/live.
- `executive-approver` — Extra-Super Admin / Executive Approver: reviews pending messages and approves/rejects.

Role is switched via an **in-app toggle** — a "Viewing as" segmented control fixed to the bottom-left of the screen (Super Admin | Executive Approver). Clicking the inactive option updates the `?role=` URL param and reloads, so the whole app re-renders under that role. This replaces the old "share two separate URLs" workflow: reviewers self-serve both perspectives from a single link. The toggle is visible in the deployed build (not dev-only) so PM/QA can use it directly. The URL param (`?role=super-admin` / `?role=executive-approver`) still works on its own if a direct link is needed.

### Relationship to the PRD & terminology mapping

The prototype realizes the PRD's P0/P1 flows. A few naming differences to reconcile during build:

| Prototype term | PRD term | Notes |
|---|---|---|
| Message Type: **Announcement** | In-App Message / Banner (non-emergency) | Announcement + **Display Format = Overlay** ≈ PRD "In-App Message" (modal/card); Announcement + **Display Format = Banner** ≈ PRD "Banner (Billing/Account Notice)" |
| Message Type: **Emergency** | Banner — Emergency subtype | Locked to non-dismissible, app-wide red banner; push-eligible (emergency only) |
| **Placement: App-wide / Feature Specific** | (targeting/placement) | Feature Specific adds a Feature Path |
| Statuses: Draft / Pending / Live (+ Scheduled) | Draft / Pending Approval / Approved / Live / Expired / Rejected | Prototype currently models Draft, Pending, Approved(Live/Scheduled); **Rejected & Expired not yet visualized — open item** |
| Audience: agencies / packages / roles / states | Targeting: By State / Agency / Role / Package | Aligned |

> **Not yet in the prototype (from PRD, flag for build):** explicit **Rejected** and **Expired** states; a possible **Marketing sign-off** step before executive approval (PRD open question); zero-recipient targeting guard (REQ error state).

---

## 2. How to access

| | |
|---|---|
| **Live prototype** | _<deploy URL — TBD>_ |
| **Source repo (reference only, not for merge)** | _<Azure DevOps / GitHub URL — TBD>_ |
| **Role switch** | click the "Viewing as" toggle, bottom-left of the screen — or append `?role=executive-approver` to the URL |

> Devs reimplement in their own codebase; the prototype source is a **reference**, not something to merge. Exact px/hex/timing values live in the code and in §3.

---

## 3. Design tokens

**Font family:** Montserrat (weights: regular 400, medium 500, semibold 600, bold 700)

### Core colors
| Token | Hex |
|---|---|
| Primary / Main | `#2699FB` |
| Primary / Background | `#E8F4FF` |
| Secondary / Main (navy) | `#27496D` |
| Success / Live — Main / Bg | `#00AA00` / `#EEFFEE` |
| Warning / Pending | `#FF8800` / `#FEFAD1` |
| Error / Emergency | `#DA4040` / `#FFE9E9` |
| Scheduled (uses Primary) | `#2699FB` / `#E8F4FF` |

### Text
| Token | Hex |
|---|---|
| Text / Label | `#585858` |
| Text / Light | `#8B8B8B` |
| Text / Extra Light | `#B8B8B8` |
| Text / Regular | `#383838` |

### Border / surface
| Token | Hex |
|---|---|
| Border / Light | `#E5E5E5` |
| Border / Dark | `#CFCFCF` |
| Hover / Light Hover | `#EFEFEF` |
| Background / Global | `#F8F8F8` |

### Spacing & radius
`xxs 2 · xs 4 · sm 6 · md 8 · lg 12 · xl 16 · xxl 32` · radius `sm 4 · md 8 · lg 16`

### Type scale (px / line-height)
`large 15/21 · regular 14/20 · small 13/18 · x-small 12/17 · tiny 11/17`

---

## 4. Features & acceptance criteria

> Acceptance criteria are written Given/When/Then so QA can lift them into test cases and verify against the live prototype.

### 4.1 Dashboard — Kanban board
Three columns: **Drafts**, **Pending Approval**, **Approved**. Each column header shows a count. Empty columns show a "No messages" placeholder. A search field and a **+ NEW MESSAGE** button sit above the board.

- **AC1** Given messages exist, each appears in the column matching its status (Draft → Drafts, Pending → Pending Approval, Live → Approved).
- **AC2** Given a column has no messages, it shows the "No messages" empty state and a count of 0.
- **AC3** The board and its actions are identical across roles except where noted in §4.6.
- **AC4** **Drafts are private to their author.** A draft is only visible to the same role that created it — a draft saved while viewing as Super Admin does not appear in the Drafts column (or its count) while viewing as Executive Approver, and vice versa. Pending and Approved are shared across roles as before; only Draft is scoped. In the prototype, "author" is approximated by the create-time role (there are no individual user accounts to tag) — see the build note in §6.

### 4.2 Message card
Card shows subject, type + date range, a recipient count, and a primary action. Approved cards show a **Live** (green) or **Scheduled** (blue) chip based on today's date vs the message's start/end.

- **AC1** A card whose start ≤ today ≤ end shows a green **Live** chip (with dot); a card whose start is in the future shows a blue **Scheduled** chip (with dot).
- **AC2** Primary action by status: Draft → **Edit**, Pending → **Review**, Approved → **View**. On hover the button inverts to a filled state in its status color.
- **AC3** Clicking the recipient count opens the Audience overlay (§4.4).
- **AC4** A kebab (⋮) menu appears on Draft and Approved (Live) cards with a **Delete** action; hovering Delete uses Light Hover `#EFEFEF`.

### 4.3 Compose / Edit message overlay
Full-screen overlay with a form (left) and a live message preview (right, desktop/phone toggle).

- **Message Type** — Announcement | Emergency.
  - **AC1** Selecting **Emergency** locks the message to a non-dismissible, app-wide red banner and shows helper text ("Emergency messages are always sent as a non-dismissible, app-wide red banner.") in Text/Extra Light `#B8B8B8`, 4px below the field.
  - **AC2** Selecting **Announcement** reveals **Display Format** (Overlay | Banner) and format-dependent fields (message color for Banner, CTA, dismissible).
- **Placement** — App-wide | Feature Specific (+ a required Feature Path when Feature Specific).
- **Audience** — agencies / packages / roles selectors.
- **AC3** The right-side preview updates live to reflect type, format, color, body, CTA, and dismissibility.
- **AC4** super-admin footer: **Save as Draft** + **Send for Approval**. Required-field validation gates submission.

### 4.4 Audience overlay
399px right-side panel (backdrop blur). Shows Agencies / Packages / Roles as **vertically-stacked** chips with type icons.

- **AC1** Only non-empty sections render; each chip shows the correct icon (agency/package/role) and label.
- **AC2** Chips stack vertically (one per row), left-aligned.

### 4.5 Message Preview (View)
Full-screen **contained** preview. Renders the real banner/overlay in an in-app skeleton (desktop/phone toggle). The modal's own **X is the only exit** — the message's own dismissibility is never the exit.

- **AC1** The banner/overlay renders faithfully in-context (correct color, body, CTA, dismiss control shown as recipients would see it).
- **AC2** A **non-dismissable emergency banner** renders WITHOUT a close control (faithful) but the reviewer can always close the preview via the modal X. _(No trap.)_
- **AC3** Context bar shows chips in the status color, no dots except the status chip: **[● Live: date–date]** or **[● Scheduled: date–date]**, then **[Announcement|Emergency]**, then placement **[App-wide]** or **[Feature Specific][<feature>]**.
- **AC4** Desktop/phone toggle switches the preview frame; context bar background is white.

### 4.6 Review / approve flow (executive-approver)
- **AC1** As executive-approver, a Pending card's **Review** opens the message read-only with **Approve** / **Reject** actions.
- **AC2** Approve moves the message to Approved; Reject returns it (with optional reason).

### 4.7 Delete
- **AC1** Deleting a Draft removes it immediately.
- **AC2** Deleting an **Approved message that is currently Live** opens a confirmation overlay ("You are about to delete the "<subject>" message which is live right now. This will remove the announcement from all the recipients immediately.") with Cancel / **Delete** (red). Scheduled (not-yet-live) approved messages delete without the confirmation.

### 4.8 Sidebar (collapsed)
- **AC1** Collapsing narrows the rail to 69px; each item shows its icon over a **first-word-only** label (e.g. "Super Administrator" → "Super") in 8px Montserrat.
- **AC2** All rail icons render at 17×17. Active item (Broadcast Studio) and the Super Administrator group show a full-height left indicator bar (blue for active/header, grey for the rest).
- **AC3** The org avatar and group name appear as two stacked 45px boxes at the top (30px avatar; group name ellipsis-truncated).
- **AC4** Expanding restores full labels and the full org switcher; the expanded layout is unchanged.

### 4.9 Role toggle
A "Viewing as" control fixed to the bottom-left of the screen: the label sits above a two-option segmented control (**Super Admin** | **Executive Approver**). Prototype-only affordance — stands in for real authentication/role assignment, which the shipped product will have.

- **AC1** The label reads "VIEWING AS" (small, uppercase, muted grey) directly above the toggle.
- **AC2** The active role's pill is filled in its role color (Super Admin = Primary `#2699FB`; Executive Approver = Secondary navy `#27496D`) with white text; the inactive pill is white with grey text.
- **AC3** Clicking the inactive pill switches roles: it updates the `?role=` URL param and reloads, so the entire app (board, message actions, Review/Approve flow, submit-button labels, browser tab title) re-renders under the new role.
- **AC4** Clicking the already-active pill is a no-op.
- **AC5** The toggle is visible in the deployed build, not just local dev — PM/QA can switch roles themselves without two separate links.

---

## 5. Key decisions & rationale

- **Preview is contained, not "actually live."** Clicking View *inspects* a message; it does not inject the live banner into the reviewer's session. Reason: an uncontained non-dismissable emergency banner would trap the reviewer, and a contained render is visually identical while always giving a safe exit. See §4.5.
- **The exit belongs to the preview harness, never the message.** The banner keeps its true (non-dismissable) behavior; the modal provides the escape.
- **Wording: "Live" not "Active."** Matches the broadcast domain and the rest of the app's status language.
- **Role switching is a single in-app toggle, not two shared links.** A prototype-only control (§4.9) — real role assignment in the shipped product comes from auth, not a URL param.

---

## 6. Open questions / future

- **"Preview on my screen"** — a possible second action that renders the real banner/overlay live in the reviewer's *own* session (scoped to the current user), with a forced exit (floating "Exit preview" control + Esc + navigate-clear) so non-dismissable banners don't trap. Not yet built.
- Confirm real data sources for Agencies / Packages / Roles / Feature Paths.
- Confirm analytics/metrics (open rate, click rate) requirements — currently stubbed and hidden.
- **Draft privacy needs real per-user scoping, not per-role (build note).** The prototype has no individual user accounts — only a Super Admin / Executive Approver role toggle (§4.9) — so §4.1 AC4 approximates "private to the author" as "private to the author's role." In production there will be many individual Super Admins (and Executive Approvers); each one's drafts must be private to *them*, not visible to every other user sharing their role. When real auth/user accounts land, drafts should be scoped to the authenticated user's id, not their role.

---

_This spec is generated from the working prototype. When behavior and this doc disagree, the prototype wins — flag the mismatch so we update the doc._

_**Kept up to date manually.** When a PR changes UX behavior, visual specs, design tokens, or acceptance criteria, update this doc in the same PR. The mirrored Confluence page ([UX] Prototype Spec & Handoff, under the PRD) should be updated to match._
