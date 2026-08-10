# Broadcast Studio — Email Notifications

Companion to *[UX] Prototype Spec & Handoff*. Covers the emails Broadcast Studio
sends when a message changes status: who receives each one, what triggers it,
and what it says.

Not built in the prototype — this is a build spec. Screenshots of each email
accompany this page in Confluence.

---

## 1. Principles

These four rules resolve most of the edge cases below, so they are stated once
rather than repeated per row.

1. **One email per transition.** A single status change never produces two
   emails. Where a transition implies another (approving an unscheduled message
   publishes it immediately), the two are merged into one email.
2. **Never notify someone about their own action.** A recipient is dropped from
   a send if they are the person who performed it. An approver who discontinues
   a message does not get told that it was discontinued.
3. **The author is always told.** Every transition affecting a message reaches
   its author, including the ones nobody triggered (expiry, lapsed approval).
4. **Terminology follows the product, not the PRD.** The approver role is
   **Executive Approver** — the term users see in the app. "Extra-super admin"
   does not appear in any email.

---

## 2. Who receives what

| # | Status change | Trigger | Recipient(s) | Timing |
|---|---|---|---|---|
| 1 | Draft → Pending Approval | Author submits for approval | Executive Approvers (approver pool) | Immediate |
| 2 | Pending Approval → Approved | Approver approves; go-live is **scheduled** | Author | Immediate |
| 3 | Pending Approval → Approved **and Live** | Approver approves; go-live is **immediate** | Author | Immediate |
| 4 | Pending Approval → Rejected | Approver rejects | Author | Immediate |
| 5 | Pending Approval → Rejected | **Nobody acted** before the display window ended | Author + Executive Approvers | At window end |
| 6 | Approved → Live | Scheduled go-live reached | Author + the approver who approved it | At go-live |
| 7 | Live → Expired | Display end date reached | Author | At expiration |
| 8 | Live → Discontinued | **Executive Approver** ends it early | Author + **all** Executive Approvers | Immediate |

### What changed from the original table, and why

- **Row 5 is new.** A Pending message whose display window passes is currently
  moved to Rejected with nobody informed — the message simply dies. The author
  needs to know it never ran; the approver pool needs to know one lapsed. This
  is the largest gap in the original spec.
- **Rows 2 and 3 split what was one row.** The original said go-live is
  "immediate if unscheduled", which means approving an unscheduled message fired
  *"approved"* and *"now live"* seconds apart. Row 3 is a single combined email
  for that case; row 2 covers genuinely scheduled sends.
- **Row 6 adds the approver.** The original told only the author when a message
  went live, yet told the approver when one was discontinued. If approvers care
  that a message came down, they care that it went up.
- **Row 8 is approver-only, and reaches the whole approver pool.** The original
  allowed "author or extra-super admin" to discontinue; discontinuing is an
  Executive Approver action and an author cannot take their own live message
  down. Recipients are the author plus *every* Executive Approver, not just the
  one who approved it: taking a live message down reverses a published decision
  the pool collectively owns, and any approver may be asked why the message
  disappeared. Per principle 2 the approver who performed it is dropped, so they
  do not get told about their own click.

  Row 6 deliberately stays narrower — the author plus the approver who approved
  it. A scheduled message going live is that approver's own decision taking
  effect on time, not news the pool needs. If you would rather both be
  pool-wide for consistency, that is a one-line change.

---

## 3. Email content

Common to every email: sender **GEOH Broadcast Studio**, a status pill matching
the message's new status, and a **View in Broadcast Studio** link to that
message — see §3.9 for where that link lands and how it behaves when it cannot
deliver what it promises.

Field labels below use the product's own names. In particular **Category** is
the Message Category field (Billing Notice / Emergency / New Release / Upsell /
custom), and **Type** is Message Type (Announcement / Emergency) — the original
samples labelled the category as "Type", which points at the wrong field.

### 3.1 Message pending your review → Executive Approvers

> **Subject:** Message pending your review
> **Body:** A message staged by {author} is ready for your review before it can go live.

| Field | Example |
|---|---|
| Type | Announcement |
| Category | Billing Notice |
| Author | Ben |
| Targeting | Advantage package, Indiana, agency admins |
| Display window | Aug 12 – Aug 19, 2026 |
| Dismissible | Yes |

Footer: *No message publishes without explicit approval from an Executive
Approver.*

Emergency messages are non-dismissible and app-wide; show **Dismissible: No**
and state the audience as *All agencies, all roles* rather than a targeting
summary.

### 3.2 Your message was approved → Author

Scheduled go-live only. If go-live is immediate, send 3.3 instead.

> **Subject:** Your message was approved
> **Body:** Your staged message was approved by {approver} and is scheduled to go live.

| Field | Example |
|---|---|
| Message | Executive Package upsell banner |
| Approved by | Priya |
| Goes live | Aug 14, 2026, 8:00 AM |

### 3.3 Your message was approved and is now live → Author

The merged email for an approval with no future start date.

> **Subject:** Your message was approved and is now live
> **Body:** Your staged message was approved by {approver} and published immediately. It is now visible to its targeted audience.

| Field | Example |
|---|---|
| Message | Emergency banner |
| Approved by | Priya |
| Live since | Aug 10, 2026, 7:42 AM |
| Display window | Until manually discontinued |

### 3.4 Your message was rejected → Author

> **Subject:** Your message was rejected
> **Body:** Your staged message was reviewed and rejected. Use **Copy to Drafts** to revise it and submit again.

| Field | Example |
|---|---|
| Message | New release announcement |
| Rejected by | Priya |
| Reason | Link points to a draft knowledge base article. Please swap in the published URL before resubmitting. |

The reason is optional. When the approver leaves it blank, show the Reason block
with *No reason was provided by the approver.* rather than hiding it — an absent
block reads as an email that forgot to say why.

The original copy said the message was "returned to Rejected so you can revise
and resubmit". A Rejected message cannot be edited in place; the available
action is **Copy to Drafts**, and the copy now says so. If revise-in-place is
wanted instead, that is a product change, not a copy change.

### 3.5 Your message was not approved in time → Author + Executive Approvers

New. Covers row 5.

> **Subject:** Your message was not approved in time
> **Body:** This message's display window ended before it was reviewed, so it has been moved to Rejected and never published.

| Field | Example |
|---|---|
| Message | Billing Notice — Ohio |
| Author | Ben |
| Submitted | Aug 2, 2026 |
| Window that passed | Aug 5 – Aug 9, 2026 |

Wording avoids blame: it states what happened rather than that an approver
failed to act. To the author it is *"your message was not approved in time"*; to
approvers the same email reads as a lapsed item.

**The message carries a system-generated rejection reason.** A lapsed message
lands in the Rejected bucket without anyone having rejected it, so the reason
banner cannot fall back to *"No reason was provided by the approver"* — there was
no approver. The reason is generated from the window that passed:

> **Rejection Reason:** Not reviewed before the display window ended
> (Jul 18, 2026 – Jul 19, 2026), so it can no longer run. The message was never
> published.

This is derived at display time rather than stored, since nothing writes a
reason for a transition no one performed. Built in the prototype as
`getRejectionReason()`; an approver's own rejection still shows their note, or
the "no reason" fallback when they left it blank.

### 3.6 Message is now live → Author + approving approver

> **Subject:** Message is now live
> **Body:** Your approved message has published and is now visible to its targeted audience.

| Field | Example |
|---|---|
| Message | Emergency banner |
| Audience | All agencies, all roles |
| Live since | Aug 10, 2026, 7:42 AM |
| Display window | Until manually discontinued |

### 3.7 Message expired → Author

> **Subject:** Message expired
> **Body:** Your message reached the end of its configured display window and is no longer visible to users. No action is needed.

| Field | Example |
|---|---|
| Message | Billing Notice — Ohio |
| Audience | Billing package, Ohio |
| Display window | Aug 1 – Aug 10, 2026 |

### 3.8 Message discontinued → Author + all Executive Approvers

> **Subject:** Message discontinued
> **Body:** This live message was manually taken down by {approver} before its scheduled end date.

| Field | Example |
|---|---|
| Message | System maintenance alert |
| Discontinued by | Priya |
| Was scheduled until | Aug 16, 2026 |

### 3.9 The "View in Broadcast Studio" link

Every email carries exactly one link, and it is the only interactive element.
It always deep-links to **the specific message**, never to the board in general —
an approver with a queue of twelve should not have to find the one the email is
about.

**Label.** *View in Broadcast Studio*. The sender line already reads "GEOH
Broadcast Studio", so repeating GEOH in the link is redundant; if the product
prefers the fully qualified name everywhere, *View in GEOH Broadcast Studio* is
the alternative — pick one and use it in all eight emails.

**Where it lands**, by email:

| Email | Opens |
|---|---|
| 3.1 Pending your review | The message's **Review** overlay, actions ready |
| 3.2 / 3.3 Approved | The message preview |
| 3.4 Rejected | The Rejected message, reason banner visible |
| 3.5 Not approved in time | The Rejected message, generated reason visible |
| 3.6 Now live | The message preview |
| 3.7 Expired | The Expired message |
| 3.8 Discontinued | The Discontinued message |

**When the link cannot do what it promises.** These are the cases worth
designing, because an email outlives the state that produced it:

- **Already actioned.** Two approvers get 3.1; one approves; the other clicks
  their link. It must open the message in its *current* state rather than a
  review screen with dead buttons, and say who actioned it and when.
- **Message deleted.** Discarded messages auto-delete after 30 days
  (`RETENTION_DAYS`), so any email older than that points at nothing. Land on
  Broadcast Studio with a plain "This message is no longer available — discarded
  messages are removed after 30 days" rather than a generic 404.
- **Recipient lost access.** A user who is no longer an Executive Approver, or
  no longer with the org, should meet the normal sign-in and permission
  behaviour, not a broken screen.
- **Not signed in.** The link should survive authentication and land on the
  message afterwards, rather than dropping the user on the dashboard.

---

## 4. Build notes

- **Rows 5, 6 and 7 need a scheduler.** Live, Expired and lapsed-Pending are
  currently *derived from dates when the board renders* — there is no moment at
  which the system decides a message has expired, so there is nothing to hang a
  send on. These three need a job that evaluates display windows and records
  which notifications have already gone out, so a message cannot email its
  author every time the job runs.
- **"The approver who approved it" needs storing.** Row 6 addresses the
  approving approver, and 3.2/3.3 name them in the body. The prototype records
  no such field; approval needs to persist the acting user's id.
- **Recipients need real accounts.** Row 1 goes to "the approver pool" and
  principle 2 drops the acting user — both need individual users, not the
  prototype's two-role toggle. Same underlying gap as draft privacy (see the
  main spec's open questions).
- **Volume.** Rows 1 and 8 send to every Executive Approver. If the pool is
  large or submissions frequent, this wants a per-approver digest option.
  Flagged, not specified.
- **Approver-only discontinue is already enforced** in the prototype, in both
  places it is offered: the preview modal guards it with `role ===
  'executive-approver'`, and a Live card only renders its kebab when the viewer
  is not a Super Admin. Row 8's trigger needs no product change.

---

_Screenshots of each email accompany this page in Confluence. When behavior and
this doc disagree, the prototype wins — flag the mismatch so we update the doc._
