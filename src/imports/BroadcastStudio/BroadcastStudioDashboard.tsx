import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BiBuildings } from 'react-icons/bi';
import { BsPersonBadgeFill, BsSearch, BsThreeDotsVertical } from 'react-icons/bs';
import { IoIosClose, IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { MdOutlineLocationOn, MdOutlinedFlag, MdAdd, MdApps, MdBlock, MdBusiness, MdCheckCircleOutline, MdDateRange, MdDeleteOutline, MdDesktopWindows, MdErrorOutline, MdInfoOutline, MdMoreVert, MdOutlineGroup, MdOutlineNotificationsActive, MdPersonOutline, MdPhoneIphone, MdTableRows, MdViewKanban, MdVisibility } from 'react-icons/md';
import { FaRegTimesCircle } from 'react-icons/fa';
import ComposeMessageOverlay, { ScreenSkeleton, PhoneSkeleton, PermanentDeleteOverlay, getAudienceRecipientCount, TextAreaField, ScaledMock, MOCK_WIDTH, PHONE_WIDTH, PHONE_HEIGHT } from './ComposeMessageOverlay';
import { useIsBelowDesktop, useIsPhone } from './useIsPhone';
import { getUserIdentity, type UserRole } from './userIdentity';

// Prototype affordance: switch the viewer's role in one click (no URL editing).
// Visible in the deployed build too, so PM/QA can self-serve both perspectives.
function RoleToggle({ role, onChange }: { role: UserRole; onChange: (next: UserRole) => void }) {
  // Phone only: the switch rides off the left edge, leaving a thin tab behind.
  // A permanently-visible switch costs screen the phone can't spare, and this
  // is a prototype affordance rather than product UI, so it shouldn't hold
  // space it isn't actively using.
  const [peekOpen, setPeekOpen] = useState(false);
  const switchRole = (next: UserRole) => {
    if (next === role) return;
    onChange(next);
  };
  const options: Array<{ key: UserRole; label: string; activeBg: string }> = [
    { key: 'super-admin', label: 'Super Admin', activeBg: '#2699fb' },
    { key: 'executive-approver', label: 'Executive Approver', activeBg: '#27496D' },
  ];

  const switchButtons = (
    <div className="flex items-center overflow-hidden" style={{ backgroundColor: 'white' }}>
      {options.map((o) => {
        const active = role === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => switchRole(o.key)}
            className="font-['Montserrat',sans-serif] font-medium text-[11px] px-[10px] py-[5px] transition-colors duration-100 cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: active ? o.activeBg : 'white', color: active ? 'white' : '#585858' }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop / tablet: parked top-right, always open — there's room. */}
      <div className="hidden sm:flex fixed top-[13px] right-[90px] z-[9999] flex-col items-end gap-[4px]">
        <div
          className="flex items-center rounded-[8px] overflow-hidden border"
          style={{ borderColor: '#E5E5E5', boxShadow: '0 1px 3px rgba(0,0,0,0.10)' }}
        >
          {switchButtons}
        </div>
      </div>

      {/* Phone: slides in from the left, collapsing to a tab. Animating
          max-width keeps the tab pinned to the panel's edge without having to
          measure the panel first. */}
      <div className="sm:hidden fixed left-0 bottom-[16px] z-[9999] flex items-stretch">
        <div
          className="overflow-hidden transition-[max-width] duration-200 ease-out border-y border-r rounded-r-[8px]"
          style={{
            maxWidth: peekOpen ? 280 : 0,
            borderColor: '#E5E5E5',
            boxShadow: peekOpen ? '0 1px 6px rgba(0,0,0,0.12)' : 'none',
          }}
        >
          {switchButtons}
        </div>
        <button
          type="button"
          aria-label={peekOpen ? 'Hide role switcher' : 'Show role switcher'}
          onClick={() => setPeekOpen((o) => !o)}
          className="flex items-center justify-center w-[18px] h-[44px] shrink-0 cursor-pointer border-y border-r rounded-r-[8px]"
          style={{ backgroundColor: 'white', borderColor: '#E5E5E5', boxShadow: '1px 1px 4px rgba(0,0,0,0.10)' }}
        >
          {peekOpen ? <IoIosArrowBack size={14} color="#585858" /> : <IoIosArrowForward size={14} color="#585858" />}
        </button>
      </div>
    </>
  );
}

type ViewMode = 'datagrid' | 'kanban';

// FEATURE FLAG: set to true to restore the datagrid/kanban toggle button
const SHOW_VIEW_TOGGLE = false;


type MessageStatus = 'Live' | 'Pending' | 'Draft' | 'Rejected' | 'Discontinued';
type MessageType = '' | 'Announcement' | 'Emergency';

interface MessageFormData {
  body?: string; reason?: string; department?: string; messageCategory?: string; customCategoryName?: string; author?: string; noEndDate?: boolean; displayFormat?: string; placement?: string; featurePath?: string;
  messageColor?: string; allowOptOut?: boolean; searchMode?: string; statesOrAgencies?: string[]; states?: string[]; featureFlags?: string[];
  packages?: string[]; roles?: string[]; dismissible?: string; hasCta?: boolean;
  ctaLabel?: string; ctaDestination?: string; pushNotification?: boolean;
}

interface BroadcastMessageRow {
  id: string;
  subject: string;
  type: MessageType;
  audience: string;
  channel: 'Email' | 'SMS' | 'Push';
  status: MessageStatus;
  startDate: string;
  endDate: string;
  recipients: number | null;
  formData?: MessageFormData;
  statusChangedAt?: string;
  /**
   * Who authored this draft. Only meaningful while status is 'Draft' — drafts
   * are private to the role that created them. Stand-in for a real per-user
   * author id: this prototype only models two roles (no individual accounts),
   * so scoping is per-role rather than per-person. The real backend should
   * scope drafts to the individual author, since many people can share a role.
   */
  authorRole?: UserRole;
  /** Optional note the approver left when rejecting. Only set on rejected messages. */
  rejectionReason?: string;
  /**
   * Which discarded bucket this row was moved to Draft from, via "Edit as
   * Draft". Only meaningful while status is 'Draft' — lets the Drafts-column
   * edit view retitle itself ("Edit Message - Rejected") and keep showing
   * the rejection reason banner even after the message has left the
   * discarded board entirely. A message resubmitted from here becomes a
   * brand-new row that doesn't carry this forward.
   */
  originBucket?: DiscardedBucket;
  /**
   * Who authored this message before "Edit as Draft" reassigned ownership to
   * whoever clicked it. Captured once, separately from formData.author —
   * that field itself gets overwritten to the new editor on the very first
   * save, so without a separate copy a second reopen would show the new
   * editor's own name back to themselves as the "original" author.
   */
  originalAuthor?: string;
}

const STATUS_COLOR: Record<MessageStatus, string> = {
  Live: '#00aa00',
  Pending: '#ff8800',
  Draft: '#787774', // Tag/Grey text-border token
  Rejected: '#DA4040',
  Discontinued: '#FC7F15',
};

const STATUS_BG: Record<MessageStatus, string> = {
  Live: '#eeffee',
  Pending: '#fefad1',
  Draft: '#F1F1EF', // Tag/Grey background token
  Rejected: '#fdeaea',
  Discontinued: '#fef1e4',
};

const STATUS_HOVER_BORDER: Record<MessageStatus, string> = {
  Live: '#008800',
  Pending: '#ff8800',
  Draft: '#6a6a6a',
  Rejected: '#b83333',
  Discontinued: '#d9690f',
};

const STATUS_HOVER_SHADOW: Record<MessageStatus, string> = {
  Live: '0px 0px 8px #c6e2c1',
  Pending: '0px 0px 8px #e0c7b4',
  Draft: '0px 0px 8px #c8c8c8',
  Rejected: '0px 0px 8px #f0c7c7',
  Discontinued: '0px 0px 8px #f7dcb8',
};

type DiscardedBucket = 'Rejected' | 'Expired' | 'Discontinued';

const BUCKET_COLOR: Record<DiscardedBucket, string> = {
  Rejected: STATUS_COLOR.Rejected,
  Expired: '#27496D',
  Discontinued: STATUS_COLOR.Discontinued,
};

const RETENTION_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getDiscardedBucket(row: BroadcastMessageRow): DiscardedBucket | null {
  if (row.status === 'Rejected') return 'Rejected';
  if (row.status === 'Discontinued') return 'Discontinued';
  if (row.status === 'Live' && row.endDate !== '—') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(row.endDate);
    if (today > end) return 'Expired';
  }
  // A Pending message that goes past its own start (live) date without a
  // decision is treated as rejected — it's too late to start on schedule,
  // and sitting in the queue forever would just be noise for the approver.
  if (row.status === 'Pending' && row.startDate !== '—') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(row.startDate);
    if (today > start) return 'Rejected';
  }
  return null;
}

/**
 * The reason shown on a Rejected message.
 *
 * A Pending message whose live date passed is displayed as Rejected without
 * anyone having rejected it, so falling back to "no reason was provided by
 * the approver" would be actively misleading — the lapse *is* the reason.
 * Nothing writes a reason for that case, so it is derived here rather than
 * stored.
 */
function getRejectionReason(row: BroadcastMessageRow): string | undefined {
  const lapsed = row.status === 'Pending' && getDiscardedBucket(row) === 'Rejected';
  if (!lapsed) return row.rejectionReason;
  const window = row.startDate === '—' ? '' : ` (was due to go live ${row.startDate})`;
  return `Not reviewed before its scheduled live date${window}, so it can no longer run. The message was never published.`;
}

// Identifies which column/bucket a row currently renders in, so we can tell
// when a card has moved somewhere new since the user last saw the board.
function getColumnKey(row: BroadcastMessageRow): string {
  const bucket = getDiscardedBucket(row);
  return bucket ? `discarded:${bucket}` : `kanban:${row.status}`;
}

const SEEN_COLUMNS_KEY = 'bs-seen-columns-v1';

// A newly-moved card's border holds its highlight color for this long
// before dropping back — a single flicker, not a repeating blink. The color
// change itself eases in and back out over FLICKER_FADE_MS, rather than
// snapping instantly.
const FLICKER_HOLD_MS = 600;
const FLICKER_FADE_MS = 300;

function getRetentionDaysLeft(row: BroadcastMessageRow, bucket: DiscardedBucket): number {
  // Expired (Live past its window) and auto-rejected (Pending past its window)
  // are both date-driven, not action-driven, so retention counts from the
  // message's own end date rather than a statusChangedAt that was never set.
  const enteredAt = bucket === 'Expired' || (bucket === 'Rejected' && row.status === 'Pending')
    ? new Date(row.endDate)
    : (row.statusChangedAt ? new Date(row.statusChangedAt) : new Date());
  const elapsedDays = Math.floor((Date.now() - enteredAt.getTime()) / MS_PER_DAY);
  return Math.max(0, RETENTION_DAYS - elapsedDays);
}

/**
 * Drafts are private to the role that authored them; every other status is
 * shared across roles. This prototype has no individual user accounts (only
 * a super-admin/executive-approver role toggle), so "private" here means
 * per-role — the real backend should scope drafts to the individual author.
 */
function isDraftVisibleToRole(row: BroadcastMessageRow, role: UserRole): boolean {
  return row.status !== 'Draft' || row.authorRole === role;
}

/**
 * Where a message sits in its display window today.
 *
 * A message with no end date runs until someone stops it, so its window has no
 * upper bound. Treating the missing end as the start date — which three copies
 * of this calculation used to do — made such a message Live for exactly one
 * day and then neither Live nor Scheduled, so its card lost its badge
 * entirely the day after it started.
 */
function getDisplayWindowStatus(row: BroadcastMessageRow): 'Live' | 'Scheduled' | 'Ended' | null {
  if (row.startDate === '—') return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(row.startDate);
  if (today < start) return 'Scheduled';
  if (row.endDate === '—') return 'Live'; // open-ended: started, never expires on its own
  return today <= new Date(row.endDate) ? 'Live' : 'Ended';
}

function isMessageCurrentlyLive(row: BroadcastMessageRow): boolean {
  return row.status === 'Live' && getDisplayWindowStatus(row) === 'Live';
}

// Whole days from today to a display-formatted date string ("Aug 10, 2026").
// Negative means the date is in the past. Null for unset ('—') or unparsable
// dates, so callers can push those to the end of a sort rather than treating
// them as "today".
function daysUntilDate(dateStr: string): number | null {
  if (!dateStr || dateStr === '—') return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

// The optional "Message Category" tag: the chosen preset label, or the
// author's own typed name when they picked "Custom". Empty/unset shows no tag.
function getCategoryLabel(row: BroadcastMessageRow): string | null {
  const category = row.formData?.messageCategory;
  if (!category) return null;
  if (category === 'Custom') {
    const custom = row.formData?.customCategoryName?.trim();
    return custom || null;
  }
  return category;
}

function CategoryTag({ label }: { label: string }) {
  return (
    <span
      className="flex items-center self-start font-['Montserrat',sans-serif] font-medium text-[11px] px-[8px] py-[3px] rounded-[4px]"
      style={{ backgroundColor: '#F2F2F2', color: '#585858' }}
    >
      {label}
    </span>
  );
}

function getRecipientCount(row: BroadcastMessageRow): number {
  const f = row.formData;
  const agencies = f?.statesOrAgencies ?? [];
  const states = f?.states ?? [];
  if (agencies.length === 0 && states.length === 0) return row.recipients ?? 0;
  return getAudienceRecipientCount({
    agencies, states, packages: f?.packages ?? [], roles: f?.roles ?? [], featureFlags: f?.featureFlags ?? [],
  }) || (row.recipients ?? 0);
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseDisplayDate(str: string): string {
  if (!str || str === '—') return '';
  const d = new Date(str);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Display-formatted date `offsetDays` from today ("Aug 12, 2026"), for demo
// seed data whose relevance depends on staying relative to "now" — e.g. the
// Pending Approval urgency indicator and Live "expiring soon" caption both
// key off real elapsed time, so a fixed calendar date would look wrong (or
// silently auto-reject/expire) the moment the demo runs on a later day.
function daysFromNow(offsetDays: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ISO timestamp `daysAgo` days back, for seed `statusChangedAt` values. The
// 30-day retention sweep prunes discarded rows on mount, so a hardcoded
// calendar date silently empties the Rejected/Expired/Discontinued buckets
// once it drifts past the window — every seeded row must stay relative.
// Every state, i.e. "all agencies". Package/role/feature-flag facets only
// narrow an existing set — agencies or states have to seed it — so a message
// aimed at "everyone on a given feature flag" spells out the states.
const ALL_STATES = ['California', 'Texas', 'New York', 'Florida', 'Washington', 'Illinois'];

function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

const INITIAL_MESSAGES: BroadcastMessageRow[] = [
  // Each card below is a distinct scenario, not a variation in wording — the
  // set is meant to exercise every display/targeting/lifecycle combination the
  // board can render, so a walkthrough can reach any state without authoring.

  // ---- DRAFTS ----
  // Private per role: super-admin and executive-approver each own some, so
  // neither role sees an empty Drafts column.
  {
    id: 'seed-d1',
    subject: 'Q3 Training Reminder',
    type: 'Announcement',
    audience: 'Sunrise Home Care +2',
    channel: 'Email',
    status: 'Draft',
    startDate: daysFromNow(6),
    endDate: daysFromNow(20),
    recipients: null,
    authorRole: 'super-admin',
    formData: {
      author: 'John Doe',
      department: 'Support',
      messageCategory: 'Custom', customCategoryName: 'Compliance',
      body: 'Q3 compliance training is now available. Please complete all assigned modules before the end of the quarter to stay certified.',
      reason: 'Quarterly compliance',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      allowOptOut: true,
      hasCta: true,
      ctaLabel: 'Start training',
      ctaDestination: '#',
      statesOrAgencies: ['Sunrise Home Care', 'Golden Gate Health Partners', 'Lone Star Caregivers'],
      states: [], featureFlags: [], packages: [], roles: [],
    },
  },
  {
    id: 'seed-d2',
    subject: 'Scheduling Tips Banner',
    type: 'Announcement',
    audience: 'Advanced Scheduling agencies',
    channel: 'Email',
    status: 'Draft',
    startDate: '—',
    endDate: '—',
    recipients: null,
    authorRole: 'executive-approver',
    // Feature-specific placement + feature-flag targeting: the banner only
    // shows inside Scheduling, and only to agencies that have it turned on.
    formData: {
      author: 'Jennifer James',
      department: 'Product',
      messageCategory: 'New Release',
      body: 'Drag-and-drop shift swapping is now built into the scheduler. Try it from any open shift.',
      reason: 'Feature adoption',
      displayFormat: 'Banner',
      placement: 'Feature Specific',
      featurePath: 'Scheduling',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      allowOptOut: true,
      hasCta: true,
      ctaLabel: 'Open scheduler',
      ctaDestination: '#',
      statesOrAgencies: [],
      states: ALL_STATES, featureFlags: ['Advanced Scheduling'], packages: [], roles: [],
    },
  },
  {
    id: 'seed-d3',
    subject: 'System Outage Alert',
    type: 'Emergency',
    audience: 'All',
    channel: 'Push',
    status: 'Draft',
    startDate: daysFromNow(0),
    endDate: '—',
    recipients: null,
    authorRole: 'super-admin',
    // Emergency shape: red, non-dismissible, open-ended, push on, no opt-out.
    formData: {
      author: 'John Doe',
      department: 'Product',
      messageCategory: 'Emergency',
      noEndDate: true,
      body: 'We are currently investigating reports of a service disruption. Updates will follow as more information becomes available.',
      reason: 'Incident response',
      displayFormat: 'Banner',
      placement: 'Global',
      messageColor: '#DA4040',
      dismissible: 'Non-Dismissible',
      hasCta: false,
      pushNotification: true,
      statesOrAgencies: [],
      states: ALL_STATES, featureFlags: [], packages: [], roles: [],
    },
  },
  {
    id: 'seed-d4',
    subject: 'Billing Executive Package Upsell',
    type: 'Announcement',
    audience: 'California · Billing Executive',
    channel: 'Email',
    status: 'Draft',
    startDate: '—',
    endDate: '—',
    recipients: null,
    authorRole: 'executive-approver',
    // Targeted with no agency chips at all — State + Package only.
    formData: {
      author: 'Jennifer James',
      department: 'Marketing',
      messageCategory: 'Upsell',
      body: 'Billing Executive adds unlimited custom reports and priority onboarding. See what your agency would gain.',
      reason: 'Expansion campaign',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      allowOptOut: true,
      hasCta: true,
      ctaLabel: 'Compare packages',
      ctaDestination: '#',
      statesOrAgencies: [],
      states: ['California'], featureFlags: [], packages: ['Billing Executive'], roles: [],
    },
  },
  {
    id: 'seed-d5',
    subject: 'Billing Portal Migration',
    type: 'Announcement',
    audience: 'Everglades Health Network',
    channel: 'Push',
    status: 'Draft',
    startDate: daysFromNow(10),
    endDate: daysFromNow(17),
    recipients: null,
    authorRole: 'super-admin',
    // Push is on but this agency has no app adoption at all, so submitting is
    // blocked until push is switched off or the audience widens. Open this one
    // to demo the push-reach guard.
    formData: {
      author: 'Priya Nair',
      department: 'Billing',
      messageCategory: 'Billing Notice',
      body: 'Invoices move to the new billing portal next month. Your saved payment methods carry over automatically.',
      reason: 'Billing migration',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: false,
      pushNotification: true,
      statesOrAgencies: ['Everglades Health Network'],
      states: [], featureFlags: [], packages: [], roles: [],
    },
  },

  // ---- PENDING APPROVAL ----
  // Spread across the urgency range: one due tomorrow, one a month out.
  {
    id: 'seed-p1',
    subject: 'Holiday Closure Notice',
    type: 'Announcement',
    audience: 'Sunrise Home Care +3',
    channel: 'Email',
    status: 'Pending',
    startDate: daysFromNow(14),
    endDate: daysFromNow(21),
    recipients: 2700,
    formData: {
      author: 'Priya Nair',
      department: 'Support',
      body: 'Our offices will be closed for the upcoming holiday. Emergency on-call support remains available throughout the closure.',
      reason: 'Holiday schedule',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      allowOptOut: true,
      hasCta: true,
      ctaLabel: 'View schedule',
      ctaDestination: '#',
      statesOrAgencies: ['Sunrise Home Care', 'Golden Gate Health Partners', 'Lone Star Caregivers', 'Empire Homecare Group'],
      states: [], featureFlags: [], packages: [], roles: [],
    },
  },
  {
    id: 'seed-p2',
    subject: 'Client Portal Maintenance Tonight',
    type: 'Emergency',
    audience: 'New York',
    channel: 'Push',
    status: 'Pending',
    startDate: daysFromNow(1),
    endDate: daysFromNow(2),
    recipients: 1225,
    // Goes live tomorrow and still unreviewed — the urgent end of the queue.
    formData: {
      author: 'Marcus Chen',
      department: 'Product',
      messageCategory: 'Emergency',
      body: 'The client portal will undergo emergency maintenance tonight from 11 PM to 2 AM. Access will be intermittent during this window.',
      reason: 'Emergency maintenance',
      displayFormat: 'Banner',
      placement: 'Global',
      messageColor: '#DA4040',
      dismissible: 'Non-Dismissible',
      hasCta: false,
      pushNotification: true,
      statesOrAgencies: [],
      states: ['New York'], featureFlags: [], packages: [], roles: [],
    },
  },
  {
    id: 'seed-p3',
    subject: 'eMAR Charting Update',
    type: 'Announcement',
    audience: 'eMAR agencies',
    channel: 'Email',
    status: 'Pending',
    startDate: daysFromNow(18),
    endDate: daysFromNow(32),
    recipients: 2095,
    formData: {
      author: 'John Doe',
      department: 'Product',
      messageCategory: 'New Release',
      body: 'Medication charting now supports partial doses and PRN follow-ups. Existing records are unchanged.',
      reason: 'Product launch',
      displayFormat: 'Banner',
      placement: 'Feature Specific',
      featurePath: 'eMAR',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: true,
      ctaLabel: "See what's new",
      ctaDestination: '#',
      statesOrAgencies: [],
      states: ALL_STATES, featureFlags: ['eMAR'], packages: [], roles: [],
    },
  },
  {
    id: 'seed-p4',
    subject: 'Updated Data Retention Policy',
    type: 'Announcement',
    audience: 'Admins',
    channel: 'Email',
    status: 'Pending',
    startDate: daysFromNow(30),
    endDate: daysFromNow(44),
    recipients: 685,
    // Role-only targeting: everyone with the Admin role, regardless of agency.
    formData: {
      author: 'Elena Rodriguez',
      department: 'Admin Services',
      messageCategory: 'Custom', customCategoryName: 'Compliance',
      body: 'Our data retention policy has been updated to align with new state requirements. Review the changes before they take effect.',
      reason: 'Policy update',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      allowOptOut: true,
      hasCta: true,
      ctaLabel: 'Read the policy',
      ctaDestination: '#',
      statesOrAgencies: [],
      states: ALL_STATES, featureFlags: [], packages: [], roles: ['Admin'],
    },
  },
  {
    id: 'seed-p5',
    subject: 'Fall Enrollment Campaign Kickoff',
    type: 'Announcement',
    audience: 'Texas',
    channel: 'Email',
    status: 'Pending',
    startDate: daysFromNow(25),
    endDate: daysFromNow(54),
    recipients: 390,
    formData: {
      author: 'Elena Rodriguez',
      department: 'Marketing',
      messageCategory: 'Upsell',
      body: 'Open enrollment kicks off next month — remind your team to complete their benefits selections before the deadline.',
      reason: 'Enrollment campaign',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: true,
      ctaLabel: 'Start enrollment',
      ctaDestination: '#',
      statesOrAgencies: [],
      states: ['Texas'], featureFlags: [], packages: [], roles: [],
    },
  },

  // ---- APPROVED ----
  // Covers all three window states the card badge can show: Live, Scheduled,
  // and Live-with-no-end-date.
  {
    id: 'seed-a1',
    subject: 'Summer Schedule Update',
    type: 'Announcement',
    audience: 'Sunrise Home Care +1',
    channel: 'Email',
    status: 'Live',
    startDate: daysFromNow(-4),
    endDate: daysFromNow(3),
    recipients: 1540,
    // Live and close to its end date — drives the "expiring soon" caption.
    formData: {
      author: 'John Doe',
      department: 'Support',
      messageCategory: 'New Release',
      body: 'Summer hours are now in effect. Review the updated shift schedule to see how your availability windows have changed.',
      displayFormat: 'Banner',
      placement: 'Feature Specific',
      featurePath: 'Scheduling',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      allowOptOut: true,
      hasCta: true,
      ctaLabel: 'View schedule',
      ctaDestination: '#',
      statesOrAgencies: ['Sunrise Home Care', 'Golden Gate Health Partners'],
      states: [], featureFlags: [], packages: [], roles: [],
    },
  },
  {
    id: 'seed-a2',
    subject: 'New Wellness Program',
    type: 'Announcement',
    audience: 'Billing Executive package',
    channel: 'Email',
    status: 'Live',
    startDate: daysFromNow(-9),
    endDate: '—',
    recipients: 2680,
    // Open-ended: started, never expires on its own, runs until discontinued.
    formData: {
      author: 'John Doe',
      department: 'Customer Success',
      noEndDate: true,
      body: 'Our employee wellness program is live, offering mental health resources and fitness reimbursements to every enrolled agency.',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      allowOptOut: true,
      hasCta: true,
      ctaLabel: 'Learn more',
      ctaDestination: '#',
      statesOrAgencies: [],
      states: ALL_STATES, featureFlags: [], packages: ['Billing Executive'], roles: [],
    },
  },
  {
    id: 'seed-a3',
    subject: 'Open Enrollment Opens',
    type: 'Announcement',
    audience: 'Cascade Caregivers',
    channel: 'Email',
    status: 'Live',
    startDate: daysFromNow(7),
    endDate: daysFromNow(21),
    recipients: 530,
    // Approved but not started yet — shows as Scheduled, not Live.
    formData: {
      author: 'Marcus Chen',
      department: 'Customer Success',
      messageCategory: 'Billing Notice',
      body: 'Benefits open enrollment begins next week. Take a few minutes to review your options and make any changes for the coming year.',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: true,
      ctaLabel: 'Review benefits',
      ctaDestination: '#',
      statesOrAgencies: ['Cascade Caregivers'],
      states: [], featureFlags: [], packages: [], roles: [],
    },
  },
  {
    id: 'seed-a4',
    subject: 'Severe Weather Advisory',
    type: 'Emergency',
    audience: 'All',
    channel: 'Push',
    status: 'Live',
    startDate: daysFromNow(-1),
    endDate: daysFromNow(2),
    recipients: 4555,
    // Live emergency reaching every agency — the widest possible audience.
    formData: {
      author: 'Elena Rodriguez',
      department: 'Admin Services',
      messageCategory: 'Emergency',
      body: "A severe weather advisory is in effect for your area. Please review your agency's emergency procedures.",
      reason: 'Safety notice',
      displayFormat: 'Banner',
      placement: 'Global',
      messageColor: '#DA4040',
      dismissible: 'Non-Dismissible',
      hasCta: false,
      pushNotification: true,
      statesOrAgencies: [],
      states: ALL_STATES, featureFlags: [], packages: [], roles: [],
    },
  },
  {
    id: 'seed-a5',
    subject: 'Family Portal Invitations',
    type: 'Announcement',
    audience: 'Family Portal agencies',
    channel: 'Email',
    status: 'Live',
    startDate: daysFromNow(-12),
    endDate: daysFromNow(16),
    recipients: 3035,
    formData: {
      author: 'Priya Nair',
      department: 'Customer Success',
      body: 'Families can now be invited straight from a client record. Invitations expire after seven days.',
      reason: 'Feature adoption',
      displayFormat: 'Banner',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      allowOptOut: true,
      hasCta: true,
      ctaLabel: 'Invite a family',
      ctaDestination: '#',
      statesOrAgencies: [],
      states: ALL_STATES, featureFlags: ['Family Portal'], packages: [], roles: [],
    },
  },

  // ---- REJECTED ----
  {
    id: 'seed-r1',
    subject: 'Weekend Overtime Bonus',
    type: 'Announcement',
    audience: 'Lone Star Caregivers +1',
    channel: 'Email',
    status: 'Rejected',
    startDate: daysFromNow(-2),
    endDate: daysFromNow(12),
    recipients: 390,
    statusChangedAt: isoDaysAgo(3),
    // Rejected with a written reason.
    rejectionReason: 'Bonus amounts have not been approved by Finance yet. Hold this until the Q4 budget is signed off, then resubmit with the confirmed figures.',
    formData: {
      author: 'Priya Nair',
      department: 'Billing',
      messageCategory: 'Billing Notice',
      body: 'Pick up a weekend shift this month and earn an additional bonus on top of your standard overtime rate.',
      reason: 'Staffing incentive',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: false,
      statesOrAgencies: ['Lone Star Caregivers', 'Austin Family Support'],
      states: [], featureFlags: [], packages: [], roles: [],
    },
  },
  {
    id: 'seed-r2',
    subject: 'Referral Program Launch',
    type: 'Announcement',
    audience: 'Empire Homecare Group',
    channel: 'Email',
    status: 'Rejected',
    startDate: daysFromNow(-8),
    endDate: daysFromNow(6),
    recipients: 950,
    statusChangedAt: isoDaysAgo(14),
    // Rejected with the reason left blank — exercises the fallback banner.
    formData: {
      author: 'Marcus Chen',
      department: 'Marketing',
      messageCategory: 'Upsell',
      body: 'Introducing our new employee referral program — earn a bonus for every successful hire you refer.',
      reason: 'Recruitment drive',
      displayFormat: 'Banner',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: false,
      statesOrAgencies: ['Empire Homecare Group'],
      states: [], featureFlags: [], packages: [], roles: [],
    },
  },
  {
    id: 'seed-r3',
    subject: 'Payroll Maintenance Window',
    type: 'Emergency',
    audience: 'Windy City Homecare',
    channel: 'Push',
    status: 'Pending',
    startDate: daysFromNow(-5),
    endDate: daysFromNow(-1),
    recipients: 295,
    // Still Pending, but its go-live date passed with nobody acting — it lands
    // in Rejected with a system-generated reason instead of an approver's note.
    formData: {
      author: 'Priya Nair',
      department: 'Billing',
      messageCategory: 'Emergency',
      body: 'Payroll systems will be offline for scheduled maintenance. Time-off requests submitted during this window may be delayed.',
      reason: 'Planned maintenance',
      displayFormat: 'Banner',
      placement: 'Global',
      messageColor: '#DA4040',
      dismissible: 'Non-Dismissible',
      hasCta: false,
      pushNotification: true,
      statesOrAgencies: ['Windy City Homecare'],
      states: [], featureFlags: [], packages: [], roles: [],
    },
  },

  // ---- EXPIRED ----
  // Status stays Live; the bucket is derived from the end date having passed.
  {
    id: 'seed-e1',
    subject: 'Spring Onboarding Series',
    type: 'Announcement',
    audience: 'Sunshine State Care',
    channel: 'Email',
    status: 'Live',
    startDate: daysFromNow(-18),
    endDate: daysFromNow(-4),
    recipients: 410,
    formData: {
      author: 'Elena Rodriguez',
      department: 'Support',
      messageCategory: 'New Release',
      body: 'Our spring onboarding series covered scheduling, billing and eMAR. Recordings remain available in the help centre.',
      reason: 'Training series',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: true,
      ctaLabel: 'Watch recordings',
      ctaDestination: '#',
      statesOrAgencies: ['Sunshine State Care'],
      states: [], featureFlags: [], packages: [], roles: [],
    },
  },
  {
    id: 'seed-e2',
    subject: 'Tax Document Deadline',
    type: 'Announcement',
    audience: 'Washington',
    channel: 'Email',
    status: 'Live',
    startDate: daysFromNow(-40),
    endDate: daysFromNow(-26),
    recipients: 530,
    // Nearly through its 30-day retention — shows the low "days left" state.
    formData: {
      author: 'Marcus Chen',
      department: 'Billing',
      messageCategory: 'Billing Notice',
      body: 'Year-end tax documents are ready to download. Verify your mailing address before the filing deadline.',
      reason: 'Tax season',
      displayFormat: 'Banner',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: false,
      statesOrAgencies: [],
      states: ['Washington'], featureFlags: [], packages: [], roles: [],
    },
  },

  // ---- DISCONTINUED ----
  {
    id: 'seed-x1',
    subject: 'Legacy Portal Sunset Notice',
    type: 'Announcement',
    audience: 'Sunrise Home Care +1',
    channel: 'Email',
    status: 'Discontinued',
    startDate: daysFromNow(-20),
    endDate: daysFromNow(9),
    recipients: 1540,
    statusChangedAt: isoDaysAgo(2),
    // Taken down early by an approver, well before its end date.
    formData: {
      author: 'Elena Rodriguez',
      department: 'Product',
      messageCategory: 'New Release',
      body: 'The legacy client portal has been discontinued. Please use the new portal for all requests going forward.',
      reason: 'Superseded by new portal',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: false,
      statesOrAgencies: ['Sunrise Home Care', 'Golden Gate Health Partners'],
      states: [], featureFlags: [], packages: [], roles: [],
    },
  },
  {
    id: 'seed-x2',
    subject: 'Regional Service Disruption',
    type: 'Emergency',
    audience: 'Brooklyn Senior Services',
    channel: 'Push',
    status: 'Discontinued',
    startDate: daysFromNow(-16),
    endDate: '—',
    recipients: 275,
    statusChangedAt: isoDaysAgo(11),
    // An open-ended emergency banner pulled down once the incident resolved —
    // the only way a message with no end date ever comes off the board.
    formData: {
      author: 'Marcus Chen',
      department: 'Customer Success',
      messageCategory: 'Emergency',
      noEndDate: true,
      body: 'We are aware of a service disruption affecting East Coast agencies and are actively working on a fix. Updates to follow.',
      reason: 'Active incident',
      displayFormat: 'Banner',
      placement: 'Global',
      messageColor: '#DA4040',
      dismissible: 'Non-Dismissible',
      hasCta: false,
      pushNotification: true,
      statesOrAgencies: ['Brooklyn Senior Services'],
      states: [], featureFlags: [], packages: [], roles: [],
    },
  },
];

const STORAGE_KEY = 'bs-messages-v18';

export function useSharedMessages() {
  const [messages, setMessagesRaw] = useState<BroadcastMessageRow[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MESSAGES));
    return INITIAL_MESSAGES;
  });

  const setMessages = useCallback((updater: BroadcastMessageRow[] | ((prev: BroadcastMessageRow[]) => BroadcastMessageRow[])) => {
    setMessagesRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setMessagesRaw(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return [messages, setMessages] as const;
}

const FILTERS: Array<'All' | MessageStatus> = ['All', 'Live', 'Pending', 'Draft'];

function StatusCard({ label, count, color, bg, hoverBorder, hoverShadow, active, onClick, neutralStyle }: { label: string; count: number; color: string; bg: string; hoverBorder: string; hoverShadow: string; active: boolean; onClick: () => void; neutralStyle?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const cardBg = neutralStyle ? '#ffffff' : (active ? bg : '#fcfcfc');
  const cardBorder = neutralStyle ? '#e5e5e5' : (active ? (hovered ? hoverBorder : color) : '#dfdfdf');
  const cardText = active ? color : '#a1a3a4';
  const cardShadow = !neutralStyle && active && hovered ? hoverShadow : 'none';
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-[5px] border p-[12px] flex flex-col gap-[4px] w-[222px] shrink-0 cursor-pointer text-left transition-all duration-150"
      style={{ backgroundColor: cardBg, borderColor: cardBorder, boxShadow: cardShadow }}
    >
      <p className="font-['Montserrat',sans-serif] font-medium text-[28px] leading-[28px]" style={{ color: cardText }}>{count}</p>
      <p className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[18px]" style={{ color: cardText }}>{label}</p>
    </button>
  );
}

function NewMessageButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-[#2699fb] hover:bg-[#2C9FFF] transition-colors duration-150 content-stretch flex gap-[6px] items-center px-[12px] py-[8px] rounded-[8px] shrink-0 cursor-pointer"
      data-name="New Message Button"
    >
      <MdAdd className="shrink-0" size={17} color="white" />
      <span className="font-['Montserrat',sans-serif] font-medium text-[13px] text-white whitespace-nowrap">NEW MESSAGE</span>
    </button>
  );
}

// A button rather than a toggle: it's not "on/off" settings state, it's a
// view switch (active bucket vs. discarded bucket), so the control should
// read like a navigation action — and its own label flips to say where it
// would take you *back* to, same as the icon does.
function ShowDiscardedButton({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  // Text-only, no bounding box — matches the plain-link button style used
  // elsewhere in the app (e.g. the Clients screen's own "Show Discharged").
  // Dark blue is the resting look regardless of checked state; hover is the
  // only state that goes light blue, and only the label underlines there —
  // a click doesn't leave the button looking "hovered".
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-[6px] shrink-0 cursor-pointer"
    >
      {checked ? (
        <MdVisibility className="shrink-0 text-[#27486d] group-hover:text-[#2699fb] transition-colors" size={16} />
      ) : (
        <MdDeleteOutline className="shrink-0 text-[#27486d] group-hover:text-[#2699fb] transition-colors" size={16} />
      )}
      <span className="font-['Montserrat',sans-serif] font-medium text-[13px] uppercase whitespace-nowrap transition-colors text-[#27486d] group-hover:text-[#2699fb] group-hover:underline">
        {checked ? 'Show Active' : 'Show Discarded'}
      </span>
    </button>
  );
}

function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`content-stretch flex items-center px-[14px] py-[8px] rounded-[8px] shrink-0 cursor-pointer font-['Montserrat',sans-serif] font-medium text-[13px] whitespace-nowrap ${
        active ? 'bg-[#27496d] text-white' : 'bg-white text-[#27496d] border border-[#e5e5e5]'
      }`}
    >
      {label}
    </button>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="bg-white content-stretch flex gap-[8px] items-center px-[13px] py-[10px] relative rounded-[4px] shrink-0 w-[285px] max-sm:w-full" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <BsSearch className="shrink-0" size={12} color="#c3c3c3" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by keywords..."
        className="flex-1 font-['Montserrat',sans-serif] font-normal text-[14px] text-[#000000] placeholder:text-[#b8b8b8] outline-none bg-transparent"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: MessageStatus }) {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <div className="rounded-full size-[8px] shrink-0" style={{ backgroundColor: STATUS_COLOR[status] }} />
      <p className="font-['Montserrat',sans-serif] font-normal leading-[17px] text-[12px] text-[#000000] whitespace-nowrap">{status}</p>
    </div>
  );
}

const COLUMNS: Array<{ key: keyof BroadcastMessageRow | 'recipients'; label: string; width: number }> = [
  { key: 'subject', label: 'Message Title', width: 240 },
  { key: 'type', label: 'Type', width: 130 },
  { key: 'audience', label: 'Audience', width: 120 },
  { key: 'status', label: 'Status', width: 110 },
  { key: 'startDate', label: 'Start Date', width: 130 },
  { key: 'endDate', label: 'End Date', width: 130 },
];

function MessageTable({ rows }: { rows: BroadcastMessageRow[] }) {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Table">
      <div className="content-stretch flex flex-col items-start overflow-x-auto relative rounded-[inherit] size-full">
        <div className="bg-white content-stretch flex h-[48px] items-center relative shrink-0 w-full border-b border-[#e5e5e5]" data-name=".Row">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              className="h-full flex items-center px-[12px] py-[10px] shrink-0"
              style={{ width: col.width }}
            >
              <p className="font-['Montserrat',sans-serif] font-medium leading-[17px] text-[#27496d] text-[12px] whitespace-nowrap">{col.label}</p>
            </div>
          ))}
        </div>
        {rows.length === 0 ? (
          <div className="flex flex-col gap-[4px] items-center justify-center py-[48px] w-full text-[#b8b8b8] text-center">
            <p className="font-['Montserrat',sans-serif] font-medium text-[15px] leading-[21px]">No messages match your filters</p>
            <p className="font-['Montserrat',sans-serif] font-normal text-[13px] leading-[18px]">Try a different status or search term.</p>
          </div>
        ) : (
          rows.map((row, index) => (
            <div
              key={row.id}
              className="content-stretch flex h-[48px] items-center relative shrink-0 w-full"
              style={{ backgroundColor: index % 2 === 0 ? '#F7FBFF' : '#FFFFFF' }}
              data-name=".Row"
            >
              <div className="h-full flex items-center px-[12px] py-[10px] shrink-0" style={{ width: 240 }}>
                <p className="font-['Montserrat',sans-serif] font-normal leading-[17px] text-[#000000] text-[12px] whitespace-nowrap overflow-hidden text-ellipsis">{row.subject}</p>
              </div>
              <div className="h-full flex items-center px-[12px] py-[10px] shrink-0" style={{ width: 130 }}>
                <p className="font-['Montserrat',sans-serif] font-normal leading-[17px] text-[#000000] text-[12px] whitespace-nowrap">{row.type}</p>
              </div>
              <div className="h-full flex items-center px-[12px] py-[10px] shrink-0" style={{ width: 120 }}>
                <p className="font-['Montserrat',sans-serif] font-normal leading-[17px] text-[#000000] text-[12px] whitespace-nowrap">
                  {row.recipients === null ? '—' : row.recipients.toLocaleString()}
                </p>
              </div>
              <div className="h-full flex items-center px-[12px] py-[10px] shrink-0" style={{ width: 110 }}>
                <StatusBadge status={row.status} />
              </div>
              <div className="h-full flex items-center px-[12px] py-[10px] shrink-0" style={{ width: 130 }}>
                <p className="font-['Montserrat',sans-serif] font-normal leading-[17px] text-[#000000] text-[12px] whitespace-nowrap">{row.startDate}</p>
              </div>
              <div className="h-full flex items-center px-[12px] py-[10px] shrink-0" style={{ width: 130 }}>
                <p className="font-['Montserrat',sans-serif] font-normal leading-[17px] text-[#000000] text-[12px] whitespace-nowrap">{row.endDate}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[4px] items-start">
      <p className="font-['Montserrat',sans-serif] font-bold text-[22px] leading-[28px] text-[#27496d]">{value}</p>
      <p className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[18px] text-[#717182] whitespace-nowrap">{label}</p>
    </div>
  );
}

function AudienceMetrics({ rows }: { rows: BroadcastMessageRow[] }) {
  const totalRecipients = rows.reduce((sum, r) => sum + (r.recipients ?? 0), 0);
  const activeAudiences = useMemo(() => new Set(rows.map((r) => r.audience)).size, [rows]);

  return (
    <div className="flex flex-col gap-[12px] items-start w-full">
      <p className="font-['Montserrat',sans-serif] font-medium text-[15px] leading-[15px] text-black">Audience Metrics</p>
      <div className="bg-white rounded-[8px] border border-[#e5e5e5] px-[24px] py-[20px] flex items-center gap-[48px] w-full flex-wrap">
        <MetricItem label="Total Recipients" value={totalRecipients.toLocaleString()} />
        <MetricItem label="Active Audiences" value={String(activeAudiences)} />
        <MetricItem label="Avg. Open Rate" value="68%" />
        <MetricItem label="Avg. Click Rate" value="24%" />
      </div>
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center rounded-[6px] border border-[#e5e5e5] bg-white overflow-hidden shrink-0">
      <button
        type="button"
        onClick={() => onChange('datagrid')}
        className="flex items-center justify-center w-[32px] h-[32px] transition-colors duration-150"
        style={{ backgroundColor: view === 'datagrid' ? '#27496d' : 'white' }}
        title="Datagrid view"
      >
        <MdTableRows size={16} color={view === 'datagrid' ? 'white' : '#8a8a8a'} />
      </button>
      <button
        type="button"
        onClick={() => onChange('kanban')}
        className="flex items-center justify-center w-[32px] h-[32px] transition-colors duration-150"
        style={{ backgroundColor: view === 'kanban' ? '#27496d' : 'white' }}
        title="Kanban view"
      >
        <MdViewKanban size={16} color={view === 'kanban' ? 'white' : '#8a8a8a'} />
      </button>
    </div>
  );
}

const ACTION_LABEL: Record<MessageStatus, string> = {
  Live: 'View',
  Pending: 'Review',
  Draft: 'Edit',
  Rejected: 'View',
  Discontinued: 'View',
};

function getActionTooltip(status: MessageStatus, role: UserRole): string {
  const isSuperAdmin = role === 'super-admin';
  if (status === 'Draft') return 'Messages you’re still working on before sending them for approval. These are private to you.';
  if (status === 'Pending') {
    return isSuperAdmin
      ? 'Messages waiting for approval. You can review but not edit them.'
      : 'Messages waiting for your approval or rejection';
  }
  return 'Messages that are live now or scheduled to go live';
}

function getBucketTooltip(bucket: DiscardedBucket): string {
  if (bucket === 'Rejected') return 'Messages an approver rejected during review';
  if (bucket === 'Expired') return 'Messages whose live window has already ended';
  return 'Messages that were manually stopped while live';
}

// A small info icon next to a column/bucket header explaining what that
// whole bucket holds. Replaces the old per-card hover tooltip, which
// covered the entire card and got in the way.
function ColumnInfoTooltip({ label, icon }: { label: string; icon?: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  // Fades in only after a short hover-intent delay, rather than snapping in
  // instantly.
  const [visible, setVisible] = useState(false);
  // Opens below the icon by default, then nudges itself left by however many
  // pixels it actually overflows the real viewport edge by — measured
  // directly, rather than a binary left/right flip, so it can't still run
  // off-screen under some fixed chrome docked at the edge.
  const [shiftX, setShiftX] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hovered) {
      showTimerRef.current = setTimeout(() => setVisible(true), 300);
    } else if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
    }
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [hovered]);

  useLayoutEffect(() => {
    if (!hovered) return;
    const el = tooltipRef.current;
    if (!el) return;
    // Wider than a bare "don't clip the viewport" margin — the host portal
    // this widget is embedded in docks a persistent icon rail along the
    // right edge that isn't part of this app's own DOM, so a tight margin
    // still lets the tooltip render underneath it.
    const margin = 100;
    const rect = el.getBoundingClientRect();
    let shift = 0;
    if (rect.right > window.innerWidth - margin) {
      shift = window.innerWidth - margin - rect.right; // negative: pull left
    }
    if (rect.left + shift < margin) {
      shift = margin - rect.left; // don't overcorrect off the left edge either
    }
    if (shift !== 0) setShiftX(shift);
  }, [hovered]);

  return (
    <div
      className="relative inline-flex items-center shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setVisible(false); setShiftX(0); }}
    >
      {icon ?? <MdInfoOutline size={14} color="#27496D" />}
      {hovered && (
        <div
          ref={tooltipRef}
          className="absolute left-0 top-full mt-[8px] z-30 whitespace-normal rounded-[6px] px-[12px] py-[8px] font-['Montserrat',sans-serif] font-normal text-[12px] text-white transition-opacity duration-200 ease-out pointer-events-none"
          style={{ backgroundColor: '#3B5C79', width: 'max-content', maxWidth: '240px', transform: `translateX(${shiftX}px)`, opacity: visible ? 1 : 0 }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

function AudienceChip({ label, variant }: { label: string; variant: 'agency' | 'state' | 'package' | 'role' | 'feature' }) {
  const iconMap = {
    agency: <BiBuildings size={12} color="white" />,
    state: <MdOutlineLocationOn size={12} color="white" />,
    feature: <MdOutlinedFlag size={12} color="white" />,
    package: <MdApps size={11} color="white" />,
    role: <BsPersonBadgeFill size={11} color="white" />,
  };
  const bgMap = { agency: '#2699FB', state: '#8E44AD', feature: '#2699FB', package: '#2699FB', role: '#2ECC71' };
  return (
    <span className="flex items-center gap-[8px] pl-[4px] pr-[8px] h-[29px] rounded-full border shrink-0" style={{ backgroundColor: '#F2F2F2', borderColor: '#E5E5E5' }}>
      <span className="rounded-full size-[20px] flex items-center justify-center shrink-0" style={{ backgroundColor: bgMap[variant] }}>
        {iconMap[variant]}
      </span>
      <span className="font-['Montserrat',sans-serif] font-medium text-[12px] text-black leading-[17px] whitespace-nowrap">{label}</span>
    </span>
  );
}

function AudienceSection({ label, items, variant }: { label: string; items: string[]; variant: 'agency' | 'state' | 'package' | 'role' | 'feature' }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-white border rounded-[4px] flex flex-col gap-[8px] px-[8px] py-[12px]" style={{ borderColor: '#E5E5E5' }}>
      <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px]" style={{ color: '#585858' }}>{label}</p>
      <div className="flex flex-col items-start gap-[4px]">
        {items.map(item => <AudienceChip key={item} label={item} variant={variant} />)}
      </div>
    </div>
  );
}

function AudienceOverlay({ formData, recipientCount, onClose }: { formData: NonNullable<BroadcastMessageRow['formData']>; recipientCount: number; onClose: () => void }) {
  const agencies = formData.statesOrAgencies ?? [];
  const states = formData.states ?? [];
  const featureFlags = formData.featureFlags ?? [];
  const packages = formData.packages ?? [];
  const roles = formData.roles ?? [];
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
        onClick={handleClose}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-[305px] min-w-[305px] max-w-[305px] sm:w-[399px] sm:min-w-[399px] sm:max-w-[399px] bg-white flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: mounted && !closing ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[16px] shrink-0" style={{ borderBottom: '1px solid #CFCFCF', height: '56px' }}>
          <p className="font-['Montserrat',sans-serif] font-medium text-[15px] leading-[21px] text-black">Audience</p>
          <button type="button" onClick={handleClose} className="cursor-pointer flex items-center">
            <IoIosClose size={26} color="#27496D" />
          </button>
        </div>
        <p className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[18px] text-[#585858] px-[16px] pt-[12px] shrink-0">
            {recipientCount} {recipientCount === 1 ? 'recipient' : 'recipients'} will see this message
        </p>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-[16px] py-[16px] flex flex-col gap-[12px]">
          <AudienceSection label="Agencies" items={agencies} variant="agency" />
          <AudienceSection label="States" items={states} variant="state" />
          <AudienceSection label="Feature Flags" items={featureFlags} variant="feature" />
          <AudienceSection label="Packages" items={packages} variant="package" />
          <AudienceSection label="Roles" items={roles} variant="role" />
        </div>
        {/* Footer */}
        <div className="flex items-center px-[16px] shrink-0" style={{ borderTop: '1px solid #CFCFCF', backgroundColor: '#f8f8f8', height: '60px' }}>
          <button
            type="button"
            onClick={handleClose}
            className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[18px] cursor-pointer px-[12px] py-[8px]"
            style={{ color: '#27496D' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// A brief top-right confirmation after an action completes — save draft,
// send for approval, approve, reject, discontinue. Slides/fades in, holds,
// then fades back out on its own; `key`-ing this by a fresh id on every
// call is what restarts the animation for back-to-back toasts.
function ActionToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const hideTimer = setTimeout(() => setVisible(false), 4700);
    const unmountTimer = setTimeout(onDismiss, 5000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hideTimer);
      clearTimeout(unmountTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed top-[36px] left-0 right-0 z-[10000] flex items-center justify-center pointer-events-none">
      <div
        className="flex items-center gap-[8px] rounded-[9px] px-[16px] py-[12px] transition-all duration-300 ease-out"
        style={{
          backgroundColor: '#E0FFE0',
          border: '1.5px solid #00AA00',
          transform: visible ? 'scale(1)' : 'scale(0.92)',
          opacity: visible ? 1 : 0,
        }}
      >
        <MdCheckCircleOutline size={17} color="#00AA00" />
        <span className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[16px] whitespace-nowrap" style={{ color: '#00AA00' }}>{message}</span>
      </div>
    </div>
  );
}

/**
 * Approver-facing reject step. Mirrors DeleteConfirmOverlay so every
 * destructive confirmation in the board looks the same, with an optional
 * reason the approver can leave for the author.
 *
 * Sits above the Review overlay (z-60 vs z-50) so the message stays visible
 * behind it while the approver types.
 */
function RejectConfirmOverlay({ subject, onConfirm, onClose }: { subject: string; onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };
  const handleConfirm = () => {
    setClosing(true);
    setTimeout(() => onConfirm(reason.trim()), 300);
  };
  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
        onClick={handleClose}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-[305px] min-w-[305px] max-w-[305px] sm:w-[399px] sm:min-w-[399px] sm:max-w-[399px] bg-white flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: mounted && !closing ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="flex items-center justify-between px-[16px] shrink-0" style={{ borderBottom: '1px solid #CFCFCF', height: '56px' }}>
          <p className="font-['Montserrat',sans-serif] font-medium text-[15px] leading-[21px] text-black">Reject Message</p>
          <button type="button" onClick={handleClose} className="cursor-pointer flex items-center">
            <IoIosClose size={26} color="#27496D" />
          </button>
        </div>
        <div className="flex-1 px-[16px] pt-[16px] pb-[24px] flex flex-col gap-[16px]">
          <p className="font-['Montserrat',sans-serif] font-medium text-[14px] leading-[20px]" style={{ color: '#343434' }}>
            You are about to reject the <span className="font-semibold">"{subject}"</span> message. It will move to the Rejected bucket and the author can copy it back to Drafts to revise it.
          </p>
          <TextAreaField
            label="Reason"
            value={reason}
            onChange={setReason}
            placeholder="Optional — shared with the author"
          />
        </div>
        <div className="flex items-center justify-between px-[16px] shrink-0" style={{ borderTop: '1px solid #CFCFCF', backgroundColor: '#f8f8f8', height: '60px' }}>
          <button
            type="button"
            onClick={handleClose}
            className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[18px] cursor-pointer px-[12px] py-[8px]"
            style={{ color: '#27496D' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[18px] cursor-pointer px-[12px] py-[8px] rounded-[8px] border flex items-center gap-[6px]"
            style={{ color: '#DA4040', borderColor: '#DA4040', backgroundColor: '#fdeaea' }}
          >
            <FaRegTimesCircle size={15} color="#DA4040" />
            REJECT
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmOverlay({ subject, onConfirm, onClose, mode = 'delete', isLive = true }: { subject: string; onConfirm: () => void; onClose: () => void; mode?: 'delete' | 'discontinue'; isLive?: boolean }) {
  const isDiscontinue = mode === 'discontinue';
  const verb = isDiscontinue ? 'discontinue' : 'delete';
  const actionLabel = isDiscontinue ? 'DISCONTINUE' : 'DELETE';
  const title = isDiscontinue ? 'Discontinue Message' : 'Delete Message';
  const Icon = isDiscontinue ? MdBlock : MdDeleteOutline;
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };
  const handleConfirm = () => {
    setClosing(true);
    setTimeout(onConfirm, 300);
  };
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
        onClick={handleClose}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-[305px] min-w-[305px] max-w-[305px] sm:w-[399px] sm:min-w-[399px] sm:max-w-[399px] bg-white flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: mounted && !closing ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="flex items-center justify-between px-[16px] shrink-0" style={{ borderBottom: '1px solid #CFCFCF', height: '56px' }}>
          <p className="font-['Montserrat',sans-serif] font-medium text-[15px] leading-[21px] text-black">{title}</p>
          <button type="button" onClick={handleClose} className="cursor-pointer flex items-center">
            <IoIosClose size={26} color="#27496D" />
          </button>
        </div>
        <div className="flex-1 px-[16px] pt-[16px] pb-[24px]">
          <p className="font-['Montserrat',sans-serif] font-medium text-[14px] leading-[20px]" style={{ color: '#343434' }}>
            {isLive
              ? <>You are about to {verb} the <span className="font-semibold">"{subject}"</span> message which is live right now. This will remove the announcement from all the recipients immediately.</>
              : <>You are about to {verb} the <span className="font-semibold">"{subject}"</span> message before it goes live. This will cancel it so it's never shown to any recipients.</>}
          </p>
        </div>
        <div className="flex items-center justify-between px-[16px] shrink-0" style={{ borderTop: '1px solid #CFCFCF', backgroundColor: '#f8f8f8', height: '60px' }}>
          <button
            type="button"
            onClick={handleClose}
            className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[18px] cursor-pointer px-[12px] py-[8px]"
            style={{ color: '#27496D' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[18px] cursor-pointer px-[12px] py-[8px] rounded-[8px] border flex items-center gap-[6px]"
            style={{ color: '#DA4040', borderColor: '#DA4040', backgroundColor: '#fdeaea' }}
          >
            <Icon size={15} color="#DA4040" />
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ row, role, onEdit, onDelete, onDiscontinue, onSendForApproval, onApprove, onReject, highlight }: {
  row: BroadcastMessageRow;
  role: UserRole;
  onEdit?: () => void;
  onDelete?: () => void;
  onDiscontinue?: () => void;
  onSendForApproval?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  highlight?: boolean;
}) {
  const color = STATUS_COLOR[row.status];
  const dateRange = row.startDate === '—' ? '—' : row.endDate === '—' ? `${row.startDate} – Until stopped` : `${row.startDate} – ${row.endDate}`;
  const isSuperAdmin = role === 'super-admin';
  const isDraft = row.status === 'Draft';
  const isPending = row.status === 'Pending';
  const [showAudience, setShowAudience] = useState(false);
  const [showKebab, setShowKebab] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  // A single border flicker for a card that just landed in this column: eases
  // in, holds, eases back out. `highlight` often flips true a tick after this
  // component's first mount (the parent's own-mount diff effect runs after
  // the initial commit), so this reacts to the prop rather than only seeding
  // state from it at mount time.
  const [flickerOn, setFlickerOn] = useState(false);
  const [flickerActive, setFlickerActive] = useState(false);
  const kebabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlight) return;
    setFlickerActive(true);
    setFlickerOn(true);
    const offId = setTimeout(() => setFlickerOn(false), FLICKER_HOLD_MS);
    const doneId = setTimeout(() => setFlickerActive(false), FLICKER_HOLD_MS + FLICKER_FADE_MS);
    return () => { clearTimeout(offId); clearTimeout(doneId); };
  }, [highlight]);

  useEffect(() => {
    if (!showKebab) return;
    const handler = (e: MouseEvent) => {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setShowKebab(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showKebab]);

  return (
    <>
    {showAudience && row.formData && (
      <AudienceOverlay formData={row.formData} recipientCount={getRecipientCount(row)} onClose={() => setShowAudience(false)} />
    )}
    {showDeleteConfirm && (
      <DeleteConfirmOverlay
        subject={row.subject}
        mode={row.status === 'Live' ? 'discontinue' : 'delete'}
        isLive={isMessageCurrentlyLive(row)}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { setShowDeleteConfirm(false); row.status === 'Live' ? onDiscontinue?.() : onDelete?.(); }}
      />
    )}
    <div
      className="bg-white rounded-[8px] border flex w-full cursor-pointer"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        borderColor: isCardHovered || flickerOn ? color : '#e5e5e5',
        transitionProperty: 'border-color',
        transitionDuration: flickerActive ? `${FLICKER_FADE_MS}ms` : '100ms',
        transitionTimingFunction: 'ease-in-out',
      }}
      onClick={onEdit}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
      <div className="flex flex-col gap-[10px] p-[14px] flex-1 min-w-0">
        <div className="flex items-start justify-between gap-[6px]">
          <div className="flex flex-col flex-1 min-w-0">
            <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px] text-[#000000]">{row.subject}</p>
            {row.formData?.author && (
              <p className="flex items-center gap-[5px] font-['Montserrat',sans-serif] font-normal text-[12px] leading-[17px] text-[#8b8b8b] mt-[2px]">
                <MdPersonOutline size={13} color="#8b8b8b" />
                {row.formData.author}
              </p>
            )}
            {dateRange !== '—' && (
              <p className="flex items-center gap-[5px] font-['Montserrat',sans-serif] font-normal text-[12px] leading-[17px] text-[#8b8b8b] mt-[2px]">
                <MdDateRange size={13} color="#8b8b8b" />
                {dateRange}
                {isPending && (() => {
                  const daysToStart = daysUntilDate(row.startDate);
                  if (daysToStart === null || daysToStart > 5) return null;
                  const label = daysToStart < 0
                    ? `Was due to go live ${Math.abs(daysToStart)} ${Math.abs(daysToStart) === 1 ? 'day' : 'days'} ago and still hasn't been reviewed`
                    : daysToStart === 0
                      ? "Due to go live today and hasn't been reviewed yet"
                      : `Going live in ${daysToStart} ${daysToStart === 1 ? 'day' : 'days'} — review needed soon`;
                  return <ColumnInfoTooltip icon={<MdErrorOutline size={14} color="#DA4040" />} label={label} />;
                })()}
              </p>
            )}
          </div>
          {(isDraft || (row.status === 'Live' && !isSuperAdmin)) && (
            <div className="relative shrink-0" ref={kebabRef} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="flex items-center justify-center w-[24px] h-[24px] rounded-[4px] cursor-pointer hover:bg-[#f2f2f2]"
                onClick={() => setShowKebab(v => !v)}
              >
                <BsThreeDotsVertical size={16} color="#27496D" />
              </button>
              {showKebab && (
                <div
                  className="absolute top-full right-0 mt-[2px] bg-white rounded-[6px] border z-20 overflow-hidden"
                  style={{ borderColor: '#E5E5E5', boxShadow: '0 4px 12px rgba(0,0,0,0.10)', minWidth: '120px' }}
                >
                  <button
                    type="button"
                    className="flex items-center gap-[8px] w-full px-[12px] h-[36px] cursor-pointer hover:bg-[#EFEFEF]"
                    onClick={() => {
                      setShowKebab(false);
                      if (row.status === 'Live') { setShowDeleteConfirm(true); return; }
                      onDelete?.();
                    }}
                  >
                    {row.status === 'Live' ? (
                      <>
                        <MdBlock size={15} color="#DA4040" />
                        <span className="font-['Montserrat',sans-serif] font-medium text-[13px]" style={{ color: '#DA4040' }}>Discontinue</span>
                      </>
                    ) : (
                      <>
                        <MdDeleteOutline size={15} color="#DA4040" />
                        <span className="font-['Montserrat',sans-serif] font-medium text-[13px]" style={{ color: '#DA4040' }}>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {(() => {
          const categoryLabel = getCategoryLabel(row);
          let liveBadge: React.ReactNode = null;
          let expiringCaption: React.ReactNode = null;
          if (row.status === 'Live' && row.startDate !== '—') {
            const windowStatus = getDisplayWindowStatus(row);
            const isLive = windowStatus === 'Live';
            const isScheduled = windowStatus === 'Scheduled';
            if (isLive) {
              liveBadge = (
                <span className="flex items-center gap-[5px] font-['Montserrat',sans-serif] font-medium text-[11px] px-[8px] py-[3px] rounded-[4px]" style={{ backgroundColor: '#EEFFEE', color: '#00AA00' }}>
                  <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: '#00AA00' }} />
                  Live
                </span>
              );
              // Only a real end date can lapse — "Until stopped" messages
              // have nothing to count down to.
              if (row.endDate !== '—') {
                const daysToEnd = daysUntilDate(row.endDate);
                if (daysToEnd !== null && daysToEnd >= 0 && daysToEnd <= 5) {
                  expiringCaption = (
                    <p className="font-['Montserrat',sans-serif] font-normal text-[11px] leading-[15px] text-[#b8b8b8]">
                      Expiring in {daysToEnd} {daysToEnd === 1 ? 'day' : 'days'}
                    </p>
                  );
                }
              }
            } else if (isScheduled) {
              liveBadge = (
                <span className="flex items-center gap-[5px] font-['Montserrat',sans-serif] font-medium text-[11px] px-[8px] py-[3px] rounded-[4px]" style={{ backgroundColor: '#E8F4FF', color: '#2699FB' }}>
                  <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: '#2699FB' }} />
                  Scheduled
                </span>
              );
            }
          }
          if (!liveBadge && !categoryLabel) return null;
          return (
            <div className="flex flex-col gap-[4px] self-start">
              <div className="flex items-center gap-[6px] flex-wrap">
                {liveBadge}
                {categoryLabel && <CategoryTag label={categoryLabel} />}
              </div>
              {expiringCaption}
            </div>
          );
        })()}
        <div className="flex items-center justify-between gap-[8px]">
          {(() => {
            // Shown on every active card now (Draft/Pending/Live alike) — even
            // before a message is live, its formData already carries a draft
            // audience, and always opening the same detail overlay (like the
            // Live cards always did) is simpler than a status-gated condition
            // that used to hide it on anything not yet approved.
            const count = getRecipientCount(row);
            return (
              <button
                type="button"
                className="flex items-center gap-[5px] group/recipients cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setShowAudience(true); }}
              >
                <MdOutlineGroup size={15} color="#27496D" />
                <span className="font-['Montserrat',sans-serif] font-medium text-[12px] leading-[17px] text-[#27496d] transition-colors group-hover/recipients:text-[#2699fb] group-hover/recipients:underline">{count} {count === 1 ? 'Recipient' : 'Recipients'}</span>
              </button>
            );
          })()}
        </div>
      </div>
    </div>
    </>
  );
}

function DiscardedCard({ row, bucket, onView, onDelete, highlight }: {
  row: BroadcastMessageRow;
  bucket: DiscardedBucket;
  onView: () => void;
  onDelete: () => void;
  highlight?: boolean;
}) {
  const dateRange = row.startDate === '—' ? '—' : row.endDate === '—' ? `${row.startDate} – Until stopped` : `${row.startDate} – ${row.endDate}`;
  const bucketColor = BUCKET_COLOR[bucket];
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [showKebab, setShowKebab] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAudience, setShowAudience] = useState(false);
  const [flickerOn, setFlickerOn] = useState(false);
  const [flickerActive, setFlickerActive] = useState(false);
  const kebabRef = useRef<HTMLDivElement>(null);
  const daysLeft = getRetentionDaysLeft(row, bucket);

  useEffect(() => {
    if (!highlight) return;
    setFlickerActive(true);
    setFlickerOn(true);
    const offId = setTimeout(() => setFlickerOn(false), FLICKER_HOLD_MS);
    const doneId = setTimeout(() => setFlickerActive(false), FLICKER_HOLD_MS + FLICKER_FADE_MS);
    return () => { clearTimeout(offId); clearTimeout(doneId); };
  }, [highlight]);

  useEffect(() => {
    if (!showKebab) return;
    const handler = (e: MouseEvent) => {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setShowKebab(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showKebab]);

  return (
    <>
    {showAudience && row.formData && (
      <AudienceOverlay formData={row.formData} recipientCount={getRecipientCount(row)} onClose={() => setShowAudience(false)} />
    )}
    {showDeleteConfirm && (
      <PermanentDeleteOverlay
        subject={row.subject}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { setShowDeleteConfirm(false); onDelete(); }}
      />
    )}
    <div
      className="bg-white rounded-[8px] border flex w-full cursor-pointer"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        borderColor: isCardHovered || flickerOn ? bucketColor : '#e5e5e5',
        transitionProperty: 'border-color',
        transitionDuration: flickerActive ? `${FLICKER_FADE_MS}ms` : '100ms',
        transitionTimingFunction: 'ease-in-out',
      }}
      onClick={onView}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
    >
      <div className="flex flex-col gap-[10px] p-[14px] flex-1 min-w-0">
        <div className="flex items-start justify-between gap-[6px]">
          <div className="flex flex-col flex-1 min-w-0">
            <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px] text-[#000000]">{row.subject}</p>
            {row.formData?.author && (
              <p className="flex items-center gap-[5px] font-['Montserrat',sans-serif] font-normal text-[12px] leading-[17px] text-[#8b8b8b] mt-[2px]">
                <MdPersonOutline size={13} color="#8b8b8b" />
                {row.formData.author}
              </p>
            )}
            {dateRange !== '—' && (
              <p className="flex items-center gap-[5px] font-['Montserrat',sans-serif] font-normal text-[12px] leading-[17px] text-[#8b8b8b] mt-[2px]">
                <MdDateRange size={13} color="#8b8b8b" />
                {dateRange}
              </p>
            )}
          </div>
          <div className="relative shrink-0" ref={kebabRef} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="flex items-center justify-center w-[24px] h-[24px] rounded-[4px] cursor-pointer hover:bg-[#f2f2f2]"
              onClick={() => setShowKebab(v => !v)}
            >
              <BsThreeDotsVertical size={16} color="#27496D" />
            </button>
            {showKebab && (
              <div
                className="absolute top-full right-0 mt-[2px] bg-white rounded-[6px] border z-20 overflow-hidden"
                style={{ borderColor: '#E5E5E5', boxShadow: '0 4px 12px rgba(0,0,0,0.10)', minWidth: '120px' }}
              >
                <button
                  type="button"
                  className="flex items-center gap-[8px] w-full px-[12px] h-[36px] cursor-pointer hover:bg-[#EFEFEF]"
                  onClick={() => { setShowKebab(false); setShowDeleteConfirm(true); }}
                >
                  <MdDeleteOutline size={15} color="#DA4040" />
                  <span className="font-['Montserrat',sans-serif] font-medium text-[13px]" style={{ color: '#DA4040' }}>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
        {getCategoryLabel(row) && <CategoryTag label={getCategoryLabel(row)!} />}
        <div className="flex items-center justify-between gap-[8px]">
          <button
            type="button"
            className="flex items-center gap-[5px] group/recipients cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setShowAudience(true); }}
          >
            <MdOutlineGroup size={15} color="#27496D" />
            <span className="font-['Montserrat',sans-serif] font-medium text-[12px] leading-[17px] text-[#27496d] transition-colors group-hover/recipients:text-[#2699fb] group-hover/recipients:underline">{getRecipientCount(row)} {getRecipientCount(row) === 1 ? 'Recipient' : 'Recipients'}</span>
          </button>
          <p className="font-['Montserrat',sans-serif] font-normal text-[11px] leading-[15px] text-[#b8b8b8] shrink-0">
            Auto-deletes in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

/**
 * Phone layout for any board: a snap-scrolling row of columns with pagination
 * dots underneath.
 *
 * Columns are 88% wide rather than 100% so the next one peeks in, which
 * signals there's more to swipe to before the dots are even noticed. Each
 * column already carries its own name and count in its header, so no tab
 * strip sits above them — that would repeat the same information twice on a
 * screen with little room to spare. The dots stay tappable as a way to jump
 * between columns without swiping.
 */
type BoardColumn = { key: string; label: string; count: number; color: string; header: React.ReactNode; body: React.ReactNode };

/**
 * Pagination is for phones only. Tablet and desktop both keep the columns at
 * full width and scroll sideways instead — a tablet cannot fit three 300px
 * columns either (1023px of viewport leaves the board about 862px against the
 * ~932px needed), but scrolling shows that honestly without swapping to a
 * different interaction partway up the size range.
 */
function ResponsiveBoard({ columns }: { columns: BoardColumn[] }) {
  const isPhone = useIsPhone();
  return isPhone ? <MobileBoardColumns columns={columns} /> : <ScrollingBoardColumns columns={columns} />;
}

function ScrollingBoardColumns({ columns }: { columns: BoardColumn[] }) {
  return (
    <div className="flex gap-[16px] w-full items-start overflow-x-auto pb-[4px]">
      {columns.map((c) => (
        <div key={c.key} className="flex flex-col gap-[10px] flex-1 min-w-[300px] bg-[#fcfcfc] rounded-[10px] p-[12px]">
          {c.header}
          {c.body}
        </div>
      ))}
    </div>
  );
}

function MobileBoardColumns({ columns }: { columns: BoardColumn[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[i] as HTMLElement | undefined;
    if (child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
  };

  // Derive the active column from scroll position so a swipe drives the dots,
  // not just an explicit dot tap.
  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    // At the far right the last columns share the view, so the leftmost one is
    // no longer the answer — without this the final dot could never light up.
    if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
      setActive(columns.length - 1);
      return;
    }
    const kids = [...el.children] as HTMLElement[];
    let best = 0;
    let bestDist = Infinity;
    kids.forEach((c, i) => {
      const dist = Math.abs((c.offsetLeft - el.offsetLeft) - el.scrollLeft);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setActive(best);
  };


  return (
    <div className="flex flex-col gap-[10px] w-full">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex gap-[16px] w-full items-stretch overflow-x-auto snap-x snap-mandatory scroll-smooth h-[calc(100dvh-290px)] min-h-[300px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {columns.map((c) => (
          <div key={c.key} className="snap-start shrink-0 w-[88%] h-full flex flex-col gap-[10px] bg-[#fcfcfc] rounded-[10px] p-[12px]">
            {c.header}
            {/* Only the card list scrolls, so the bucket name and count stay
                put and every column is the same height — which in turn keeps
                the dots below at one fixed position instead of drifting with
                the number of cards. */}
            {/* The list reaches into the column's 12px right padding so the 6px
                scrollbar sits centred in that gutter — 3px either side — while
                the cards keep the width they have everywhere else. */}
            <div className="flex-1 min-h-0 overflow-y-auto -mr-[9px] pr-[3px] [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d0d0d0]">
              {c.body}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-[6px] shrink-0 pt-[2px]">
        {columns.map((c, i) => (
          <button
            key={c.key}
            type="button"
            aria-label={`Go to ${c.label}`}
            onClick={() => goTo(i)}
            className="rounded-full transition-all duration-150 cursor-pointer"
            style={{
              width: i === active ? 18 : 6,
              height: 6,
              backgroundColor: i === active ? '#2699FB' : '#d0d0d0',
            }}
          />
        ))}
      </div>
    </div>
  );
}

const DISCARDED_COLUMNS: DiscardedBucket[] = ['Rejected', 'Expired', 'Discontinued'];

function DiscardedBoard({ rows, onView, onDelete, highlightIds }: {
  rows: BroadcastMessageRow[];
  onView: (row: BroadcastMessageRow, bucket: DiscardedBucket) => void;
  onDelete: (id: string) => void;
  highlightIds: Set<string>;
}) {
  const bucketed = rows
    .map((row) => ({ row, bucket: getDiscardedBucket(row) }))
    .filter((x): x is { row: BroadcastMessageRow; bucket: DiscardedBucket } => x.bucket !== null);

  // One definition of a bucket's header + cards, reused by the desktop row
  // and the phone tab/swipe view so they can't drift apart.
  const built = DISCARDED_COLUMNS.map((bucket) => {
    const colRows = bucketed.filter((x) => x.bucket === bucket).map((x) => x.row);
    const color = BUCKET_COLOR[bucket];
    return {
      key: bucket,
      label: bucket,
      count: colRows.length,
      color,
      header: (
          <div className="flex items-center justify-between px-[2px]">
            <div className="flex items-center gap-[7px]">
              <span className="font-['Montserrat',sans-serif] font-semibold text-[11px] tracking-[0.06em] uppercase" style={{ color }}>{bucket}</span>
              <ColumnInfoTooltip label={getBucketTooltip(bucket)} />
            </div>
            <span className="font-['Montserrat',sans-serif] font-medium text-[11px] text-[#9a9a9a] bg-[#efefef] rounded-[4px] size-[17px] flex items-center justify-center shrink-0">{colRows.length}</span>
          </div>
      ),
      body: (
          <div className="flex flex-col gap-[8px]">
            {colRows.length === 0 ? (
              <div className="border border-dashed border-[#e5e5e5] rounded-[8px] py-[28px] flex items-center justify-center bg-white">
                <p className="font-['Montserrat',sans-serif] font-normal text-[12px] text-[#b8b8b8]">No messages</p>
              </div>
            ) : (
              colRows.map((row) => (
                <DiscardedCard
                  key={row.id}
                  row={row}
                  bucket={bucket}
                  onView={() => onView(row, bucket)}
                  onDelete={() => onDelete(row.id)}
                  highlight={highlightIds.has(row.id)}
                />
              ))
            )}
          </div>
      ),
    };
  });

  return (
    <ResponsiveBoard columns={built} />
  );
}

const KANBAN_COLUMNS: Array<{ status: MessageStatus; label: string }> = [
  { status: 'Draft', label: 'Drafts' },
  { status: 'Pending', label: 'Pending Approval' },
  { status: 'Live', label: 'Approved' },
];

function KanbanBoard({ rows, role, onEdit, onDelete, onDiscontinue, onSendForApproval, onApprove, onReject, highlightIds }: {
  rows: BroadcastMessageRow[];
  role: UserRole;
  onEdit: (row: BroadcastMessageRow) => void;
  onDelete: (id: string) => void;
  onDiscontinue: (id: string) => void;
  onSendForApproval: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  highlightIds: Set<string>;
}) {
  const built = KANBAN_COLUMNS.map(({ status, label }) => {
    const colRows = rows.filter((r) => r.status === status && getDiscardedBucket(r) === null && isDraftVisibleToRole(r, role));
    // Pending Approval surfaces whatever's closest to going live at the top,
    // since that's the one an approver should look at first. Every other
    // column stays in "latest saved" order (new items are prepended when
    // created, so the array's own order already does this) — live date isn't
    // relevant once a message has already been approved, rejected, etc.
    if (status === 'Pending') {
      colRows.sort((a, b) => {
        const da = daysUntilDate(a.startDate);
        const db = daysUntilDate(b.startDate);
        if (da === null && db === null) return 0;
        if (da === null) return 1;
        if (db === null) return -1;
        return da - db;
      });
    }
    const color = STATUS_COLOR[status];
    return {
      key: status,
      label,
      count: colRows.length,
      color,
      header: (
          <div className="flex items-center justify-between px-[2px]">
            <div className="flex items-center gap-[7px]">
              <span className="font-['Montserrat',sans-serif] font-semibold text-[11px] tracking-[0.06em] uppercase" style={{ color }}>{label}</span>
              <ColumnInfoTooltip label={getActionTooltip(status, role)} />
            </div>
            <span className="font-['Montserrat',sans-serif] font-medium text-[11px] text-[#9a9a9a] bg-[#efefef] rounded-[4px] size-[17px] flex items-center justify-center shrink-0">{colRows.length}</span>
          </div>
      ),
      body: (
          <div className="flex flex-col gap-[8px]">
            {colRows.length === 0 ? (
              <div className="border border-dashed border-[#e5e5e5] rounded-[8px] py-[28px] flex items-center justify-center bg-white">
                <p className="font-['Montserrat',sans-serif] font-normal text-[12px] text-[#b8b8b8]">No messages</p>
              </div>
            ) : (
              colRows.map((row) => (
                <KanbanCard
                  key={row.id}
                  row={row}
                  role={role}
                  onEdit={() => onEdit(row)}
                  onDelete={() => onDelete(row.id)}
                  onDiscontinue={() => onDiscontinue(row.id)}
                  onSendForApproval={() => onSendForApproval(row.id)}
                  onApprove={() => onApprove(row.id)}
                  onReject={() => onReject(row.id)}
                  highlight={highlightIds.has(row.id)}
                />
              ))
            )}
          </div>
      ),
    };
  });

  return (
    <ResponsiveBoard columns={built} />
  );
}

function MessagePreviewModal({ row, role, onClose, onDiscontinue }: {
  row: BroadcastMessageRow;
  role: UserRole;
  onClose: () => void;
  onDiscontinue?: () => void;
}) {
  const [deviceView, setDeviceView] = useState<'desktop' | 'phone'>('desktop');
  const [showDiscontinueConfirm, setShowDiscontinueConfirm] = useState(false);
  const isBelowDesktop = useIsBelowDesktop();

  const isEmergency = row.type === 'Emergency';
  const effectiveFormat: 'Overlay' | 'Banner' = isEmergency ? 'Banner' : ((row.formData?.displayFormat as 'Overlay' | 'Banner') || 'Overlay');
  const color = isEmergency ? '#DA4040' : (row.formData?.messageColor || '#27496D');
  const body = row.formData?.body || row.subject;
  const hasCta = row.formData?.hasCta ?? false;
  const ctaLabel = row.formData?.ctaLabel || 'Learn more';
  const dismissible = row.formData?.dismissible !== 'Non-Dismissible';
  // Older rows predate the field and always showed the link, so treat a missing
  // value as "offered" rather than silently removing it from existing messages.
  const allowOptOut = row.formData?.allowOptOut ?? true;
  const isFeatureSpecific = row.formData?.placement === 'Feature Specific';
  const featurePath = row.formData?.featurePath || '';

  // Determine live vs scheduled for the status chip.
  const windowStatus = getDisplayWindowStatus(row);
  const previewStatus: 'Live' | 'Scheduled' | null =
    windowStatus === 'Live' || windowStatus === 'Scheduled' ? windowStatus : null;
  const chipBg = previewStatus === 'Live' ? '#EEFFEE' : previewStatus === 'Scheduled' ? '#E8F4FF' : '#F2F2F2';
  const chipColor = previewStatus === 'Live' ? '#00AA00' : previewStatus === 'Scheduled' ? '#2699FB' : '#585858';
  const scheduleRange = row.endDate !== '—' ? `${row.startDate} – ${row.endDate}` : row.startDate;
  const statusChipText = previewStatus ? `${previewStatus}: ${scheduleRange}` : null;
  const placementChips = isFeatureSpecific ? ['Feature Specific', ...(featurePath ? [featurePath] : [])] : ['App-wide'];

  const canDiscontinue = role === 'executive-approver' && row.status === 'Live';

  return (
    <div className="fixed inset-0 z-50">
      {showDiscontinueConfirm && (
        <DeleteConfirmOverlay
          subject={row.subject}
          mode="discontinue"
          isLive={isMessageCurrentlyLive(row)}
          onClose={() => setShowDiscontinueConfirm(false)}
          onConfirm={() => { setShowDiscontinueConfirm(false); onDiscontinue?.(); }}
        />
      )}
      <div className="absolute inset-0 bg-white flex flex-col overflow-hidden">
          {/* Header — the modal's own close is always the exit */}
          <div className="flex items-center justify-between gap-[16px] px-[20px] py-[12px] shrink-0" style={{ borderBottom: '1px solid #E5E5E5', minHeight: '56px' }}>
            <p className="font-['Montserrat',sans-serif] font-semibold text-[15px] leading-[20px] text-black">Message Preview</p>
            <button type="button" onClick={onClose} className="cursor-pointer flex items-center shrink-0">
              <IoIosClose size={26} color="#27496D" />
            </button>
          </div>

          {/* Context bar — device toggle + "what recipients see" + push indicator */}
          <div className="flex flex-col gap-[8px] px-[20px] py-[10px] shrink-0" style={{ borderBottom: '1px solid #E5E5E5', backgroundColor: '#ffffff' }}>
            {/* Which message this is, on its own full-width line above the
                chips — in the header it had to share the row with the close
                button and wrapped into it on narrow screens. */}
            <p className="font-['Montserrat',sans-serif] font-normal text-[12px] leading-[16px]" style={{ color: '#8b8b8b' }}>
              {[row.subject, row.formData?.author, row.formData?.department].filter(Boolean).join(' · ')}
            </p>
            <div className="flex items-center justify-between gap-[12px]">
              <div className="flex items-center gap-[6px] min-w-0 flex-wrap">
                {statusChipText && (
                  <span
                    className="flex items-center gap-[5px] font-['Montserrat',sans-serif] font-medium text-[11px] leading-[15px] px-[8px] py-[3px] rounded-[4px] shrink-0 whitespace-nowrap"
                    style={{ backgroundColor: chipBg, color: chipColor }}
                  >
                    <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: chipColor }} />
                    {statusChipText}
                  </span>
                )}
                {placementChips.map((chip) => (
                  <span
                    key={chip}
                    className="flex items-center font-['Montserrat',sans-serif] font-medium text-[11px] leading-[15px] px-[8px] py-[3px] rounded-[4px] shrink-0 whitespace-nowrap"
                    style={{ backgroundColor: chipBg, color: chipColor }}
                  >
                    {chip}
                  </span>
                ))}
                {effectiveFormat === 'Banner' && row.formData?.pushNotification && (
                  <span
                    className="flex items-center gap-[4px] font-['Montserrat',sans-serif] font-medium text-[11px] leading-[15px] px-[8px] py-[3px] rounded-[4px] shrink-0 whitespace-nowrap"
                    style={{ backgroundColor: chipBg, color: chipColor }}
                  >
                    <MdOutlineNotificationsActive size={12} />
                    Push Notification
                  </span>
                )}
              </div>
            <div className="flex items-center rounded-[6px] border border-[#e5e5e5] bg-white overflow-hidden shrink-0">
              <button type="button" onClick={() => setDeviceView('desktop')} className="flex items-center justify-center w-[32px] h-[32px] transition-colors duration-150" style={{ backgroundColor: deviceView === 'desktop' ? '#27496d' : 'white' }} title="Desktop view">
                <MdDesktopWindows size={16} color={deviceView === 'desktop' ? 'white' : '#8a8a8a'} />
              </button>
              <button type="button" onClick={() => setDeviceView('phone')} className="flex items-center justify-center w-[32px] h-[32px] transition-colors duration-150" style={{ backgroundColor: deviceView === 'phone' ? '#27496d' : 'white' }} title="Phone view">
                <MdPhoneIphone size={16} color={deviceView === 'phone' ? 'white' : '#8a8a8a'} />
              </button>
            </div>
            </div>
          </div>

          {/* Stage — faithful in-context render, always contained */}
          <div className="flex-1 min-h-0 p-[20px]" style={{ backgroundColor: '#f5f6f7' }}>
            {deviceView === 'desktop' ? (
              isBelowDesktop ? (
                // Below desktop this box is narrow, and driving the mock off
                // height lets max-width override the ratio — the "desktop"
                // screen comes out portrait and its 320px message panel then
                // covers the app behind it. Scale a real-size mock instead.
                <ScaledMock baseWidth={MOCK_WIDTH} baseHeight={MOCK_WIDTH / 1.6}>
                  <ScreenSkeleton effectiveFormat={effectiveFormat} title={row.subject} body={body} color={color} dismissible={dismissible} allowOptOut={allowOptOut} hasCta={hasCta} ctaLabel={ctaLabel} />
                </ScaledMock>
              ) : (
                <div className="w-full h-full flex justify-center">
                  <div style={{ aspectRatio: '16 / 10', height: '100%', maxWidth: '100%' }}>
                    <ScreenSkeleton effectiveFormat={effectiveFormat} title={row.subject} body={body} color={color} dismissible={dismissible} allowOptOut={allowOptOut} hasCta={hasCta} ctaLabel={ctaLabel} />
                  </div>
                </div>
              )
            ) : (
              <ScaledMock baseWidth={PHONE_WIDTH} baseHeight={PHONE_HEIGHT}>
                <PhoneSkeleton effectiveFormat={effectiveFormat} title={row.subject} body={body} color={color} dismissible={dismissible} allowOptOut={allowOptOut} hasCta={hasCta} ctaLabel={ctaLabel} />
              </ScaledMock>
            )}
          </div>

          {/* Footer — Discontinue is the only action here, and only for the
              Executive Approver, mirroring the kebab-menu flow on the card. */}
          {canDiscontinue && (
            <div className="shrink-0 border-t px-[24px] py-[16px] flex items-center justify-end" style={{ borderColor: '#E5E5E5', backgroundColor: 'white' }}>
              <button
                type="button"
                className="flex items-center gap-[6px] font-['Montserrat',sans-serif] font-medium text-[13px] leading-[18px] uppercase whitespace-nowrap transition-colors cursor-pointer hover:underline"
                style={{ color: '#DA4040' }}
                onClick={() => setShowDiscontinueConfirm(true)}
              >
                <MdBlock size={17} color="#DA4040" />
                Discontinue
              </button>
            </div>
          )}
      </div>
    </div>
  );
}

export default function BroadcastStudioDashboard({ role, onRoleChange }: { role: UserRole; onRoleChange: (next: UserRole) => void }) {

  useEffect(() => {
    document.title = role === 'executive-approver' ? 'BS - Executive Approver' : 'BS - Super Admin';
  }, [role]);

  const [messages, setMessages] = useSharedMessages();
  const [selectedStatus, setSelectedStatus] = useState<MessageStatus>('Live');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [editingRow, setEditingRow] = useState<BroadcastMessageRow | null>(null);
  const [reviewingRow, setReviewingRow] = useState<BroadcastMessageRow | null>(null);
  const [rejectingRow, setRejectingRow] = useState<BroadcastMessageRow | null>(null);
  const [viewingRow, setViewingRow] = useState<BroadcastMessageRow | null>(null);
  const [viewingDiscardedRow, setViewingDiscardedRow] = useState<{ row: BroadcastMessageRow; bucket: DiscardedBucket } | null>(null);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const showToast = (message: string) => setToast({ id: Date.now(), message });

  const anyOverlayOpen =
    isComposeOpen || !!editingRow || !!reviewingRow || !!rejectingRow || !!viewingRow || !!viewingDiscardedRow;

  // Diffs each card's current column/bucket against a baseline every time
  // `messages` changes — whether that's a fresh mount (baseline = whatever
  // was last persisted to localStorage from a previous visit) or a live
  // in-session move (baseline = the map from just before this update, held
  // in the ref). Either way, anything that moved — Draft → Pending, Pending
  // → Approved, into a discarded bucket, or a brand-new card appearing (send
  // for approval, approve, reject, discontinue, copy to drafts, save as
  // draft, new message) — gets flagged to flicker right away, live or not.
  // A truly first-ever install (no persisted snapshot at all yet) is treated
  // as a clean baseline rather than a wave of "new" cards.
  const lastColumnsRef = useRef<Record<string, string> | null>(null);
  useEffect(() => {
    const current: Record<string, string> = {};
    messages.forEach((m) => { current[m.id] = getColumnKey(m); });

    let baseline = lastColumnsRef.current;
    if (baseline === null) {
      try {
        const raw = localStorage.getItem(SEEN_COLUMNS_KEY);
        baseline = raw ? JSON.parse(raw) : null;
      } catch {
        baseline = null;
      }
    }

    if (baseline !== null) {
      const moved = new Set<string>();
      messages.forEach((m) => {
        if (baseline![m.id] !== current[m.id]) moved.add(m.id);
      });
      if (moved.size > 0) {
        setHighlightIds((prev) => {
          const next = new Set(prev);
          moved.forEach((id) => next.add(id));
          return next;
        });
      }
    }

    localStorage.setItem(SEEN_COLUMNS_KEY, JSON.stringify(current));
    lastColumnsRef.current = current;
  }, [messages]);

  // Prune anything past its 30-day retention window in the discarded buckets.
  useEffect(() => {
    setMessages((prev) => prev.filter((m) => {
      const bucket = getDiscardedBucket(m);
      if (!bucket) return true;
      return getRetentionDaysLeft(m, bucket) > 0;
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSendForApproval = (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'Pending' } : m));
    showToast('Message sent for approval');
  };

  const handleApprove = (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'Live' } : m));
    showToast('Message approved');
  };

  const handleReject = (id: string, reason?: string) => {
    setMessages((prev) => prev.map((m) => m.id === id
      ? { ...m, status: 'Rejected', statusChangedAt: new Date().toISOString(), ...(reason ? { rejectionReason: reason } : {}) }
      : m));
    showToast('Message rejected');
  };

  const handleDiscontinue = (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'Discontinued', statusChangedAt: new Date().toISOString() } : m));
    showToast('Message discontinued');
  };

  // Moves a discarded (Rejected/Expired/Discontinued) message straight into
  // Drafts — same row, same id, just a status change — rather than copying
  // it into a brand-new row and leaving the original sitting in the
  // discarded bucket. Fired the instant "Edit as Draft" is clicked, before
  // the user has touched a single field: the overlay then switches itself
  // into an editor for this same now-Draft row in place.
  const handleEditAsDraft = (row: BroadcastMessageRow, bucket: DiscardedBucket) => {
    setMessages((prev) => prev.map((m) => m.id === row.id ? {
      ...m,
      status: 'Draft',
      startDate: '—',
      endDate: '—',
      recipients: null,
      statusChangedAt: undefined,
      // Retained (not cleared) — the Drafts-column edit view still shows the
      // rejection reason banner (muted styling) and needs it. originBucket is
      // what lets that view — and its title — know this Draft came from here.
      originBucket: bucket,
      // Snapshot the pre-transition author before formData.author below gets
      // reassigned — this is what the "Original Author" box reads from,
      // kept separate from formData.author so it survives that field being
      // overwritten again on save.
      originalAuthor: m.formData?.author,
      authorRole: role,
      // Reassigned immediately (not just inside the editor's own display, and
      // not deferred until the first Save) — this is what the Drafts board
      // card itself reads, and it's the user's own draft now, not whoever
      // originally sent the message.
      formData: m.formData ? { ...m.formData, author: getUserIdentity(role).name } : m.formData,
    } : m));
    setSelectedStatus('Draft');
  };

  const handleMessageCreated = (data: MessageFormData & { title?: string; messageType?: string; startDate?: string; endDate?: string; statesOrAgencies?: string[]; searchMode?: string }) => {
    const agencies = data.statesOrAgencies ?? [];
    const audience = agencies.length === 0 ? 'All' : agencies.length <= 2 ? agencies.join(', ') : `${agencies.slice(0, 2).join(', ')} +${agencies.length - 2}`;
    const newStatus = role === 'executive-approver' ? 'Live' : 'Pending';
    const newMessage: BroadcastMessageRow = {
      id: Date.now().toString(),
      subject: data.title ?? '',
      type: (data.messageType as MessageType) ?? '',
      audience,
      channel: 'Email',
      status: newStatus,
      startDate: data.startDate ? formatDisplayDate(data.startDate) : '—',
      endDate: data.endDate ? formatDisplayDate(data.endDate) : '—',
      recipients: null,
      formData: data,
    };
    setMessages((prev) => [newMessage, ...prev]);
    setSelectedStatus(newStatus);
    showToast(role === 'executive-approver' ? 'Message published' : 'Message sent for approval');
  };

  const liveCount = messages.filter((m) => m.status === 'Live' && getDiscardedBucket(m) === null).length;
  const pendingCount = messages.filter((m) => m.status === 'Pending').length;
  const draftCount = messages.filter((m) => m.status === 'Draft' && m.authorRole === role).length;

  const query = search.trim().toLowerCase();
  const searchFiltered = messages.filter(
    (row) =>
      query.length === 0 ||
      row.subject.toLowerCase().includes(query) ||
      row.audience.toLowerCase().includes(query)
  );

  const filteredRows = searchFiltered.filter((row) => row.status === selectedStatus && isDraftVisibleToRole(row, role));

  return (
    <div className="flex flex-col gap-[20px] items-start w-full pb-[8px]" data-name="Broadcast Studio Dashboard">
      {viewMode === 'datagrid' && !showDiscarded && (
        <div className="flex items-center gap-[16px] w-full">
          <StatusCard label="Live" count={liveCount} color={STATUS_COLOR.Live} bg={STATUS_BG.Live} hoverBorder={STATUS_HOVER_BORDER.Live} hoverShadow={STATUS_HOVER_SHADOW.Live} active={selectedStatus === 'Live'} onClick={() => setSelectedStatus('Live')} />
          <StatusCard label="Pending Approval" count={pendingCount} color={STATUS_COLOR.Pending} bg={STATUS_BG.Pending} hoverBorder={STATUS_HOVER_BORDER.Pending} hoverShadow={STATUS_HOVER_SHADOW.Pending} active={selectedStatus === 'Pending'} onClick={() => setSelectedStatus('Pending')} />
          <StatusCard label="Drafts" count={draftCount} color={STATUS_COLOR.Draft} bg={STATUS_BG.Draft} hoverBorder={STATUS_HOVER_BORDER.Draft} hoverShadow={STATUS_HOVER_SHADOW.Draft} active={selectedStatus === 'Draft'} onClick={() => setSelectedStatus('Draft')} />
        </div>
      )}

      {/* {viewMode === 'kanban' && <AudienceMetrics rows={messages} />} */}

      {/* Wraps at any width, not just on phones: the toolbar runs out of room
          well before 640px once the sidebar and notification rail take their
          share, and the controls are fixed-width, so without this they overflow
          rather than reflow. */}
      <div className="flex items-center gap-[12px] w-full flex-wrap">
        <SearchInput value={search} onChange={setSearch} />
        <ShowDiscardedButton checked={showDiscarded} onChange={setShowDiscarded} />
        <NewMessageButton onClick={() => setIsComposeOpen(true)} />
        {/* The spacer only exists to push the view toggle right, so it is tied
            to it — left on its own in a wrapping row it would swallow the free
            space and shove the controls onto a line of their own. */}
        {SHOW_VIEW_TOGGLE && (
          <>
            <div className="flex-1" />
            <ViewToggle view={viewMode} onChange={setViewMode} />
          </>
        )}
      </div>

      {showDiscarded ? (
        <DiscardedBoard
          rows={searchFiltered}
          onView={(row, bucket) => setViewingDiscardedRow({ row, bucket })}
          onDelete={handleDelete}
          highlightIds={highlightIds}
        />
      ) : viewMode === 'datagrid' ? (
        <MessageTable rows={filteredRows} />
      ) : (
        <KanbanBoard
          rows={searchFiltered}
          role={role}
          onDelete={handleDelete}
          onDiscontinue={handleDiscontinue}
          onEdit={(row) => {
            if (row.status === 'Live') {
              setViewingRow(row);
            } else if (row.status === 'Pending') {
              setReviewingRow(row);
            } else {
              setEditingRow(row);
            }
          }}
          onSendForApproval={handleSendForApproval}
          onApprove={handleApprove}
          onReject={handleReject}
          highlightIds={highlightIds}
        />
      )}

      {editingRow && (
        <ComposeMessageOverlay
          onClose={() => setEditingRow(null)}
          overlayTitle={editingRow.originBucket ? `Edit Message - ${editingRow.originBucket}` : 'Edit Message'}
          discardedBucketLabel={editingRow.originBucket}
          originalAuthorName={editingRow.originalAuthor}
          currentUserName={getUserIdentity(role).name}
          submitLabel={role === 'executive-approver' ? 'Publish' : 'Send for Approval'}
          rejectionReason={editingRow.rejectionReason}
          rejected={editingRow.originBucket === 'Rejected'}
          initialData={{
            title: editingRow.subject,
            messageType: editingRow.type,
            startDate: parseDisplayDate(editingRow.startDate),
            endDate: parseDisplayDate(editingRow.endDate),
            ...editingRow.formData,
          }}
          onMessageCreated={(data) => {
            setMessages((prev) => prev.filter((m) => m.id !== editingRow!.id));
            handleMessageCreated(data);
            setEditingRow(null);
          }}
          onSaveAsDraft={(data) => {
            const agencies = data.statesOrAgencies ?? [];
            const audience = agencies.length === 0 ? 'All' : agencies.length <= 2 ? agencies.join(', ') : `${agencies.slice(0, 2).join(', ')} +${agencies.length - 2}`;
            setMessages((prev) => [{
              id: Date.now().toString(),
              subject: data.title || 'Untitled Draft',
              type: (data.messageType as MessageType) || '',
              audience,
              channel: 'Email',
              status: 'Draft',
              startDate: data.startDate ? formatDisplayDate(data.startDate) : '—',
              endDate: data.endDate ? formatDisplayDate(data.endDate) : '—',
              recipients: null,
              authorRole: role,
              formData: data,
              // Carried forward so re-saving a draft that came from a
              // discarded message doesn't silently lose its "Edit Message -
              // Rejected" title / reason banner / original-author note on
              // the next open.
              originBucket: editingRow!.originBucket,
              rejectionReason: editingRow!.rejectionReason,
              originalAuthor: editingRow!.originalAuthor,
            }, ...prev.filter((m) => m.id !== editingRow!.id)]);
            setSelectedStatus('Draft');
            setEditingRow(null);
            showToast('Draft saved');
          }}
        />
      )}

      {reviewingRow && (
        <ComposeMessageOverlay
          onClose={() => setReviewingRow(null)}
          overlayTitle="Review Message"
          readOnly={role !== 'executive-approver'}
          {...(role === 'executive-approver' ? {
            onApprove: () => { handleApprove(reviewingRow.id); setReviewingRow(null); },
            onReject: () => setRejectingRow(reviewingRow),
          } : {})}
          initialData={{
            title: reviewingRow.subject,
            messageType: reviewingRow.type,
            startDate: parseDisplayDate(reviewingRow.startDate),
            endDate: parseDisplayDate(reviewingRow.endDate),
            ...reviewingRow.formData,
          }}
        />
      )}

      {rejectingRow && (
        <RejectConfirmOverlay
          subject={rejectingRow.subject}
          onClose={() => setRejectingRow(null)}
          onConfirm={(reason) => {
            handleReject(rejectingRow.id, reason);
            setRejectingRow(null);
            setReviewingRow(null);
          }}
        />
      )}

      {viewingRow && (
        <MessagePreviewModal
          row={viewingRow}
          role={role}
          onClose={() => setViewingRow(null)}
          onDiscontinue={() => { handleDiscontinue(viewingRow.id); setViewingRow(null); }}
        />
      )}

      {viewingDiscardedRow && (
        <ComposeMessageOverlay
          onClose={() => setViewingDiscardedRow(null)}
          overlayTitle={`${viewingDiscardedRow.bucket} Message`}
          discardedBucketLabel={viewingDiscardedRow.bucket}
          // Falls back to the row's current formData.author for the very
          // first "Edit as Draft" (before originalAuthor has ever been set);
          // once set, that field takes over on any later reopen so this
          // can't drift to whoever most recently edited it.
          originalAuthorName={viewingDiscardedRow.row.originalAuthor ?? viewingDiscardedRow.row.formData?.author}
          currentUserName={getUserIdentity(role).name}
          submitLabel={role === 'executive-approver' ? 'Publish' : 'Send for Approval'}
          readOnly
          rejectionReason={getRejectionReason(viewingDiscardedRow.row)}
          rejected={viewingDiscardedRow.bucket === 'Rejected'}
          initialData={{
            title: viewingDiscardedRow.row.subject,
            messageType: viewingDiscardedRow.row.type,
            startDate: parseDisplayDate(viewingDiscardedRow.row.startDate),
            endDate: parseDisplayDate(viewingDiscardedRow.row.endDate),
            ...viewingDiscardedRow.row.formData,
          }}
          onDeleteRow={() => { handleDelete(viewingDiscardedRow.row.id); setViewingDiscardedRow(null); }}
          // Moves the row to Draft immediately — the overlay itself then
          // flips into an editor for this same row, in place. Nothing
          // closes here; onSaveAsDraft/onMessageCreated below (reachable
          // only once that edit mode is on) are what eventually close it.
          // Available to any role — resurrecting a discarded message into a
          // draft isn't a Super Admin-only action, same as Delete above.
          onEditAsDraft={() => handleEditAsDraft(viewingDiscardedRow.row, viewingDiscardedRow.bucket)}
          onSaveAsDraft={(data) => {
            const agencies = data.statesOrAgencies ?? [];
            const audience = agencies.length === 0 ? 'All' : agencies.length <= 2 ? agencies.join(', ') : `${agencies.slice(0, 2).join(', ')} +${agencies.length - 2}`;
            setMessages((prev) => prev.map((m) => m.id === viewingDiscardedRow.row.id ? {
              ...m,
              subject: data.title || 'Untitled Draft',
              type: (data.messageType as MessageType) || '',
              audience,
              startDate: data.startDate ? formatDisplayDate(data.startDate) : '—',
              endDate: data.endDate ? formatDisplayDate(data.endDate) : '—',
              formData: data,
            } : m));
            setSelectedStatus('Draft');
            setViewingDiscardedRow(null);
            showToast('Draft saved');
          }}
          onMessageCreated={(data) => {
            setMessages((prev) => prev.filter((m) => m.id !== viewingDiscardedRow.row.id));
            handleMessageCreated(data);
            setViewingDiscardedRow(null);
          }}
        />
      )}

      {/* The switcher floats bottom-left, which on a phone is exactly where the
          overlay's left-hand action now sits. It is a demo control and the
          overlay is modal, so it stands down while one is open. */}
      {!anyOverlayOpen && <RoleToggle role={role} onChange={onRoleChange} />}

      {isComposeOpen && (
        <ComposeMessageOverlay
          onClose={() => setIsComposeOpen(false)}
          onMessageCreated={handleMessageCreated}
          currentUserName={getUserIdentity(role).name}
          submitLabel={role === 'executive-approver' ? 'Publish' : 'Send for Approval'}
          onSaveAsDraft={(data) => {
            const agencies = data.statesOrAgencies ?? [];
            const audience = agencies.length === 0 ? 'All' : agencies.length <= 2 ? agencies.join(', ') : `${agencies.slice(0, 2).join(', ')} +${agencies.length - 2}`;
            setMessages((prev) => [
              {
                id: Date.now().toString(),
                subject: data.title || 'Untitled Draft',
                type: (data.messageType as MessageType) || '',
                audience,
                channel: 'Email',
                status: 'Draft',
                startDate: data.startDate ? formatDisplayDate(data.startDate) : '—',
                endDate: data.endDate ? formatDisplayDate(data.endDate) : '—',
                recipients: null,
                authorRole: role,
                formData: data,
              },
              ...prev,
            ]);
            setSelectedStatus('Draft');
            showToast('Draft saved');
          }}
        />
      )}

      {toast && <ActionToast key={toast.id} message={toast.message} onDismiss={() => setToast(null)} />}
    </div>
  );
}
