import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BiBuildings } from 'react-icons/bi';
import { BsPersonBadgeFill, BsSearch, BsThreeDotsVertical } from 'react-icons/bs';
import { IoIosClose } from 'react-icons/io';
import { MdAdd, MdApps, MdBlock, MdBusiness, MdDeleteOutline, MdDesktopWindows, MdMoreVert, MdOutlineGroup, MdPhoneIphone, MdTableRows, MdViewKanban } from 'react-icons/md';
import ComposeMessageOverlay, { ScreenSkeleton, PhoneSkeleton, PermanentDeleteOverlay } from './ComposeMessageOverlay';

type UserRole = 'super-admin' | 'executive-approver';

function useRole(): UserRole {
  const param = new URLSearchParams(window.location.search).get('role');
  return param === 'executive-approver' ? 'executive-approver' : 'super-admin';
}

// Prototype affordance: switch the viewer's role in one click (no URL editing).
// Visible in the deployed build too, so PM/QA can self-serve both perspectives.
function RoleToggle({ role }: { role: UserRole }) {
  const switchRole = (next: UserRole) => {
    if (next === role) return;
    const url = new URL(window.location.href);
    if (next === 'super-admin') url.searchParams.delete('role');
    else url.searchParams.set('role', next);
    window.location.href = url.toString();
  };
  const options: Array<{ key: UserRole; label: string; activeBg: string }> = [
    { key: 'super-admin', label: 'Super Admin', activeBg: '#2699fb' },
    { key: 'executive-approver', label: 'Executive Approver', activeBg: '#27496D' },
  ];
  return (
    <div className="fixed bottom-[16px] left-[16px] z-[9999] flex flex-col items-start gap-[4px]">
      <span
        className="font-['Montserrat',sans-serif] font-semibold text-[9px] uppercase tracking-[0.08em] pl-[2px]"
        style={{ color: '#8b8b8b' }}
      >
        Viewing as
      </span>
      <div
        className="flex items-center rounded-[8px] overflow-hidden border"
        style={{ borderColor: '#E5E5E5', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.10)' }}
      >
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
    </div>
  );
}

type ViewMode = 'datagrid' | 'kanban';

// FEATURE FLAG: set to true to restore the datagrid/kanban toggle button
const SHOW_VIEW_TOGGLE = false;

type MessageStatus = 'Live' | 'Pending' | 'Draft' | 'Rejected' | 'Discontinued';
type MessageType = '' | 'Announcement' | 'Emergency';

interface MessageFormData {
  body?: string; reason?: string; displayFormat?: string; placement?: string; featurePath?: string;
  messageColor?: string; frequency?: string; searchMode?: string; statesOrAgencies?: string[];
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
}

const STATUS_COLOR: Record<MessageStatus, string> = {
  Live: '#00aa00',
  Pending: '#ff8800',
  Draft: '#8a8a8a',
  Rejected: '#DA4040',
  Discontinued: '#FC7F15',
};

const STATUS_BG: Record<MessageStatus, string> = {
  Live: '#eeffee',
  Pending: '#fefad1',
  Draft: '#f0f0f0',
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

function getDiscardedBucket(row: BroadcastMessageRow): DiscardedBucket | null {
  if (row.status === 'Rejected') return 'Rejected';
  if (row.status === 'Discontinued') return 'Discontinued';
  if (row.status === 'Live' && row.endDate !== '—') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(row.endDate);
    if (today > end) return 'Expired';
  }
  return null;
}

function getRetentionDaysLeft(row: BroadcastMessageRow, bucket: DiscardedBucket): number {
  const enteredAt = bucket === 'Expired'
    ? new Date(row.endDate)
    : (row.statusChangedAt ? new Date(row.statusChangedAt) : new Date());
  const elapsedDays = Math.floor((Date.now() - enteredAt.getTime()) / MS_PER_DAY);
  return Math.max(0, RETENTION_DAYS - elapsedDays);
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

const INITIAL_MESSAGES: BroadcastMessageRow[] = [
  // ---- DRAFTS ----
  {
    id: 'seed-d1',
    subject: 'Q3 Training Reminder',
    type: 'Announcement',
    audience: 'Sunrise Home Care +2',
    channel: 'Email',
    status: 'Draft',
    startDate: 'Aug 1, 2026',
    endDate: 'Aug 8, 2026',
    recipients: null,
    formData: {
      body: 'Q3 compliance training is now available. Please complete all assigned modules before the end of the quarter to stay certified.',
      reason: 'Quarterly compliance',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: true,
      ctaLabel: 'Start training',
      ctaDestination: '#',
      statesOrAgencies: ['Sunrise Home Care', 'Golden Gate Health Partners', 'Lone Star Caregivers'],
      packages: [],
      roles: [],
    },
  },
  {
    id: 'seed-d2',
    subject: 'Referral Program Launch',
    type: 'Announcement',
    audience: 'All',
    channel: 'Email',
    status: 'Draft',
    startDate: '—',
    endDate: '—',
    recipients: null,
    formData: {
      body: 'Introducing our new employee referral program — earn bonuses for every successful hire you refer.',
      displayFormat: 'Banner',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: false,
      statesOrAgencies: ['Austin Family Support'],
      packages: [],
      roles: [],
    },
  },

  // ---- PENDING APPROVAL ----
  {
    id: 'seed-p1',
    subject: 'Holiday Closure Notice',
    type: 'Announcement',
    audience: 'Sunrise Home Care +3',
    channel: 'Email',
    status: 'Pending',
    startDate: 'Jul 20, 2026',
    endDate: 'Jul 27, 2026',
    recipients: 3150,
    formData: {
      body: 'Our offices will be closed for the upcoming holiday. Emergency on-call support remains available throughout the closure.',
      reason: 'Holiday schedule',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: true,
      ctaLabel: 'View schedule',
      ctaDestination: '#',
      statesOrAgencies: ['Sunrise Home Care', 'Golden Gate Health Partners', 'Lone Star Caregivers', 'Empire Homecare Group'],
      packages: ['Premium Support'],
      roles: [],
    },
  },
  {
    id: 'seed-p2',
    subject: 'Client Portal Maintenance',
    type: 'Emergency',
    audience: 'All',
    channel: 'Push',
    status: 'Pending',
    startDate: 'Jul 18, 2026',
    endDate: 'Jul 19, 2026',
    recipients: 892,
    formData: {
      body: 'The client portal will undergo emergency maintenance tonight from 11 PM to 2 AM. Access will be intermittent during this window.',
      reason: 'Emergency maintenance',
      displayFormat: 'Banner',
      placement: 'Global',
      messageColor: '#DA4040',
      dismissible: 'Non-Dismissible',
      hasCta: false,
      pushNotification: true,
      statesOrAgencies: ['Austin Family Support', 'Empire Homecare Group'],
      packages: [],
      roles: ['Administrator'],
    },
  },

  // ---- APPROVED ----
  {
    id: 'seed-a1',
    subject: 'Summer Schedule Update',
    type: 'Announcement',
    audience: 'Sunrise Home Care +2',
    channel: 'Email',
    status: 'Live',
    startDate: 'Jul 20, 2026',
    endDate: 'Jul 27, 2026',
    recipients: 1204,
    formData: {
      body: 'Summer hours are now in effect. Review the updated shift schedule to see how your availability windows have changed.',
      displayFormat: 'Banner',
      placement: 'Feature Specific',
      featurePath: 'Scheduling',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: true,
      ctaLabel: 'View schedule',
      ctaDestination: '#',
      statesOrAgencies: ['Sunrise Home Care', 'Golden Gate Health Partners', 'Lone Star Caregivers'],
      packages: [],
      roles: [],
    },
  },
  {
    id: 'seed-a2',
    subject: 'New Overtime Policy',
    type: 'Emergency',
    audience: 'All',
    channel: 'Push',
    status: 'Live',
    startDate: 'Jul 22, 2026',
    endDate: 'Jul 28, 2026',
    recipients: 42,
    formData: {
      body: 'Effective immediately: overtime must be pre-approved by a supervisor. Unapproved overtime will not be compensated.',
      reason: 'Policy change',
      displayFormat: 'Banner',
      placement: 'Global',
      messageColor: '#DA4040',
      dismissible: 'Non-Dismissible',
      hasCta: false,
      pushNotification: true,
      statesOrAgencies: ['Empire Homecare Group'],
      packages: [],
      roles: ['Caregiver', 'Administrator'],
    },
  },
  {
    id: 'seed-a3',
    subject: 'Open Enrollment Opens',
    type: 'Announcement',
    audience: 'Sunrise Home Care +1',
    channel: 'Email',
    status: 'Live',
    startDate: 'Aug 1, 2026',
    endDate: 'Aug 15, 2026',
    recipients: 560,
    formData: {
      body: 'Benefits open enrollment begins August 1st. Take a few minutes to review your options and make any changes for the coming year.',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: true,
      ctaLabel: 'Review benefits',
      ctaDestination: '#',
      statesOrAgencies: ['Sunrise Home Care', 'Austin Family Support'],
      packages: [],
      roles: [],
    },
  },

  // ---- REJECTED ----
  {
    id: 'seed-r1',
    subject: 'Weekend Overtime Bonus',
    type: 'Announcement',
    audience: 'All',
    channel: 'Email',
    status: 'Rejected',
    startDate: 'Jul 25, 2026',
    endDate: 'Aug 1, 2026',
    recipients: 480,
    statusChangedAt: '2026-07-20T00:00:00.000Z',
    formData: {
      body: 'Placeholder rejected message for prototyping the Rejected bucket.',
      reason: 'Needs budget sign-off',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: false,
      statesOrAgencies: [],
      packages: [],
      roles: [],
    },
  },
  {
    id: 'seed-r2',
    subject: 'Placeholder Rejected Message',
    type: 'Announcement',
    audience: 'All',
    channel: 'Email',
    status: 'Rejected',
    startDate: '—',
    endDate: '—',
    recipients: 210,
    statusChangedAt: '2026-07-22T00:00:00.000Z',
    formData: {
      body: 'This is a placeholder message for prototyping purposes.',
      reason: 'Placeholder reason',
      displayFormat: 'Banner',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: false,
      statesOrAgencies: [],
      packages: [],
      roles: [],
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
    startDate: 'Jul 10, 2026',
    endDate: 'Jul 24, 2026',
    recipients: 640,
    statusChangedAt: '2026-07-24T00:00:00.000Z',
    formData: {
      body: 'The legacy client portal has been discontinued. Please use the new portal for all requests going forward.',
      reason: 'Superseded by new portal',
      displayFormat: 'Overlay',
      placement: 'Global',
      messageColor: '#27496D',
      dismissible: 'Dismissible',
      hasCta: false,
      statesOrAgencies: ['Sunrise Home Care', 'Golden Gate Health Partners'],
      packages: [],
      roles: [],
    },
  },
];

const STORAGE_KEY = 'bs-messages-v6';

function useSharedMessages() {
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
      className="bg-[#2699fb] content-stretch flex gap-[6px] items-center px-[12px] py-[8px] rounded-[8px] shrink-0 cursor-pointer"
      data-name="New Message Button"
    >
      <MdAdd className="shrink-0" size={17} color="white" />
      <span className="font-['Montserrat',sans-serif] font-medium text-[13px] text-white whitespace-nowrap">NEW MESSAGE</span>
    </button>
  );
}

function ShowDiscardedToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-[8px] cursor-pointer shrink-0"
    >
      <span
        className="w-[32px] h-[18px] rounded-full flex items-center px-[2px] transition-colors shrink-0"
        style={{ backgroundColor: checked ? '#2699fb' : '#d0d0d0', justifyContent: checked ? 'flex-end' : 'flex-start' }}
      >
        <span className="size-[14px] rounded-full bg-white shadow shrink-0" />
      </span>
      <span className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[18px] uppercase whitespace-nowrap transition-colors text-[#27486d] group-hover:text-[#2699fb] group-hover:underline">
        Show Discarded
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
    <div className="bg-white content-stretch flex gap-[8px] items-center px-[13px] py-[10px] relative rounded-[4px] shrink-0 w-[285px]" data-name="Input">
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

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative inline-flex group">
      {children}
      <div className="pointer-events-none absolute right-0 top-full mt-[8px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 whitespace-nowrap">
        <div className="rounded-[6px] p-[12px] font-['Montserrat',sans-serif] font-medium text-[12px] text-white" style={{ backgroundColor: '#3B5C79' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function getActionTooltip(status: MessageStatus, role: UserRole): string {
  const isSuperAdmin = role === 'super-admin';
  if (status === 'Draft') return 'Edit this draft message';
  if (status === 'Pending') {
    return isSuperAdmin ? 'Review only, no editing' : 'Approve or reject this message';
  }
  return 'Preview this live message';
}

function AudienceChip({ label, variant }: { label: string; variant: 'agency' | 'package' | 'role' }) {
  const iconMap = {
    agency: <BiBuildings size={12} color="white" />,
    package: <MdApps size={11} color="white" />,
    role: <BsPersonBadgeFill size={11} color="white" />,
  };
  const bgMap = { agency: '#2699FB', package: '#2699FB', role: '#2ECC71' };
  return (
    <span className="flex items-center gap-[8px] pl-[4px] pr-[8px] h-[29px] rounded-full border shrink-0" style={{ backgroundColor: '#F2F2F2', borderColor: '#E5E5E5' }}>
      <span className="rounded-full size-[20px] flex items-center justify-center shrink-0" style={{ backgroundColor: bgMap[variant] }}>
        {iconMap[variant]}
      </span>
      <span className="font-['Montserrat',sans-serif] font-medium text-[12px] text-black leading-[17px] whitespace-nowrap">{label}</span>
    </span>
  );
}

function AudienceSection({ label, items, variant }: { label: string; items: string[]; variant: 'agency' | 'package' | 'role' }) {
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

function AudienceOverlay({ formData, onClose }: { formData: NonNullable<BroadcastMessageRow['formData']>; onClose: () => void }) {
  const agencies = formData.statesOrAgencies ?? [];
  const packages = formData.packages ?? [];
  const roles = formData.roles ?? [];
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 bottom-0 w-[399px] bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-[16px] shrink-0" style={{ borderBottom: '1px solid #CFCFCF', height: '56px' }}>
          <p className="font-['Montserrat',sans-serif] font-medium text-[15px] leading-[21px] text-black">Audience</p>
          <button type="button" onClick={onClose} className="cursor-pointer flex items-center">
            <IoIosClose size={26} color="#27496D" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-[16px] py-[16px] flex flex-col gap-[12px]">
          <AudienceSection label="Agencies" items={agencies} variant="agency" />
          <AudienceSection label="Packages" items={packages} variant="package" />
          <AudienceSection label="Roles" items={roles} variant="role" />
        </div>
        {/* Footer */}
        <div className="flex items-center px-[16px] shrink-0" style={{ borderTop: '1px solid #CFCFCF', backgroundColor: '#f8f8f8', height: '60px' }}>
          <button
            type="button"
            onClick={onClose}
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

function DeleteConfirmOverlay({ subject, onConfirm, onClose, mode = 'delete' }: { subject: string; onConfirm: () => void; onClose: () => void; mode?: 'delete' | 'discontinue' }) {
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
        className="absolute right-0 top-0 bottom-0 w-[399px] bg-white flex flex-col transition-transform duration-300 ease-out"
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
            You are about to {verb} the <span className="font-semibold">"{subject}"</span> message which is live right now. This will remove the announcement from all the recipients immediately.
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

function KanbanCard({ row, role, onEdit, onDelete, onDiscontinue, onSendForApproval, onApprove, onReject }: {
  row: BroadcastMessageRow;
  role: UserRole;
  onEdit?: () => void;
  onDelete?: () => void;
  onDiscontinue?: () => void;
  onSendForApproval?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const color = STATUS_COLOR[row.status];
  const dateRange = row.startDate === '—' ? '—' : `${row.startDate} – ${row.endDate}`;
  const isSuperAdmin = role === 'super-admin';
  const isDraft = row.status === 'Draft';
  const isPending = row.status === 'Pending';
  const [showAudience, setShowAudience] = useState(false);
  const [showKebab, setShowKebab] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const kebabRef = useRef<HTMLDivElement>(null);

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
      <AudienceOverlay formData={row.formData} onClose={() => setShowAudience(false)} />
    )}
    {showDeleteConfirm && (
      <DeleteConfirmOverlay
        subject={row.subject}
        mode={row.status === 'Live' ? 'discontinue' : 'delete'}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { setShowDeleteConfirm(false); row.status === 'Live' ? onDiscontinue?.() : onDelete?.(); }}
      />
    )}
    <div className="bg-white rounded-[8px] border border-[#e5e5e5] flex" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex flex-col gap-[10px] p-[14px] flex-1 min-w-0">
        <div className="flex items-start justify-between gap-[6px]">
          <div className="flex flex-col flex-1 min-w-0">
            <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px] text-[#000000]">{row.subject}</p>
            {(row.type || dateRange !== '—') && (
              <p className="font-['Montserrat',sans-serif] font-normal text-[12px] leading-[17px] text-[#8b8b8b] mt-[2px]">
                {row.type}{row.type && dateRange !== '—' && <span> • </span>}{dateRange !== '—' && dateRange}
              </p>
            )}
          </div>
          {(isDraft || row.status === 'Live') && (
            <div className="relative shrink-0" ref={kebabRef}>
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
                      if (row.status === 'Live' && row.startDate !== '—') {
                        const today = new Date(); today.setHours(0, 0, 0, 0);
                        const start = new Date(row.startDate);
                        const end = new Date(row.endDate !== '—' ? row.endDate : row.startDate);
                        if (today >= start && today <= end) { setShowDeleteConfirm(true); return; }
                      }
                      row.status === 'Live' ? onDiscontinue?.() : onDelete?.();
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
        {row.status === 'Live' && row.startDate !== '—' && (() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const start = new Date(row.startDate);
          const end = new Date(row.endDate !== '—' ? row.endDate : row.startDate);
          const isLive = today >= start && today <= end;
          const isScheduled = today < start;
          if (isLive) return (
            <span className="flex items-center gap-[5px] self-start font-['Montserrat',sans-serif] font-medium text-[11px] px-[8px] py-[3px] rounded-[4px]" style={{ backgroundColor: '#EEFFEE', color: '#00AA00' }}>
              <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: '#00AA00' }} />
              Live
            </span>
          );
          if (isScheduled) return (
            <span className="flex items-center gap-[5px] self-start font-['Montserrat',sans-serif] font-medium text-[11px] px-[8px] py-[3px] rounded-[4px]" style={{ backgroundColor: '#E8F4FF', color: '#2699FB' }}>
              <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: '#2699FB' }} />
              Scheduled
            </span>
          );
          return null;
        })()}
        <div className="flex items-center justify-between gap-[8px]">
          {(() => {
            const agencies = row.formData?.statesOrAgencies ?? [];
            const packages = row.formData?.packages ?? [];
            const roles = row.formData?.roles ?? [];
            const count = agencies.length + packages.length + roles.length || (row.recipients ?? 0);
            if (count === 0) return <span />;
            const hasDetail = agencies.length > 0 || packages.length > 0 || roles.length > 0;
            return (
              <button
                type="button"
                className="flex items-center gap-[5px]"
                style={{ cursor: hasDetail ? 'pointer' : 'default' }}
                onClick={() => hasDetail && setShowAudience(true)}
              >
                <MdOutlineGroup size={15} color="#27496D" />
                <span className="font-['Montserrat',sans-serif] font-medium text-[12px] leading-[17px]" style={{ color: '#27496D' }}>{count} {count === 1 ? 'Recipient' : 'Recipients'}</span>
              </button>
            );
          })()}
          {isDraft && (
            <Tooltip label={getActionTooltip('Draft', role)}>
              <button
                type="button"
                className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[13px] px-[12px] py-[8px] rounded-[6px] border transition-colors duration-100 cursor-pointer"
                style={{ color: isButtonHovered ? 'white' : color, borderColor: color, backgroundColor: isButtonHovered ? color : 'white' }}
                onMouseEnter={() => setIsButtonHovered(true)}
                onMouseLeave={() => setIsButtonHovered(false)}
                onClick={onEdit}
              >
                Edit
              </button>
            </Tooltip>
          )}
          {isPending && (
            <Tooltip label={getActionTooltip('Pending', role)}>
              <button
                type="button"
                className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[13px] px-[12px] py-[8px] rounded-[6px] border transition-colors duration-100 cursor-pointer"
                style={{ color: isButtonHovered ? 'white' : color, borderColor: color, backgroundColor: isButtonHovered ? color : 'white' }}
                onMouseEnter={() => setIsButtonHovered(true)}
                onMouseLeave={() => setIsButtonHovered(false)}
                onClick={onEdit}
              >
                Review
              </button>
            </Tooltip>
          )}
          {row.status === 'Live' && (
            <Tooltip label={getActionTooltip('Live', role)}>
              <button
                type="button"
                className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[13px] px-[12px] py-[8px] rounded-[6px] border transition-colors duration-100 cursor-pointer"
                style={{ color: isButtonHovered ? 'white' : color, borderColor: color, backgroundColor: isButtonHovered ? color : 'white' }}
                onMouseEnter={() => setIsButtonHovered(true)}
                onMouseLeave={() => setIsButtonHovered(false)}
                onClick={onEdit}
              >
                View
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

function DiscardedCard({ row, bucket, onView, onDelete }: {
  row: BroadcastMessageRow;
  bucket: DiscardedBucket;
  onView: () => void;
  onDelete: () => void;
}) {
  const dateRange = row.startDate === '—' ? '—' : `${row.startDate} – ${row.endDate}`;
  const bucketColor = BUCKET_COLOR[bucket];
  const [viewHovered, setViewHovered] = useState(false);
  const [showAudience, setShowAudience] = useState(false);
  const [showKebab, setShowKebab] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const kebabRef = useRef<HTMLDivElement>(null);
  const daysLeft = getRetentionDaysLeft(row, bucket);

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
      <AudienceOverlay formData={row.formData} onClose={() => setShowAudience(false)} />
    )}
    {showDeleteConfirm && (
      <PermanentDeleteOverlay
        subject={row.subject}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { setShowDeleteConfirm(false); onDelete(); }}
      />
    )}
    <div className="bg-white rounded-[8px] border border-[#e5e5e5] flex" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex flex-col gap-[10px] p-[14px] flex-1 min-w-0">
        <div className="flex items-start justify-between gap-[6px]">
          <div className="flex flex-col flex-1 min-w-0">
            <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px] text-[#000000]">{row.subject}</p>
            {(row.type || dateRange !== '—') && (
              <p className="font-['Montserrat',sans-serif] font-normal text-[12px] leading-[17px] text-[#8b8b8b] mt-[2px]">
                {row.type}{row.type && dateRange !== '—' && <span> • </span>}{dateRange !== '—' && dateRange}
              </p>
            )}
            <p className="font-['Montserrat',sans-serif] font-normal text-[11px] leading-[15px] text-[#b8b8b8] mt-[2px]">
              Auto-deletes in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div className="relative shrink-0" ref={kebabRef}>
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
        <div className="flex items-center justify-between gap-[8px]">
          {(() => {
            const agencies = row.formData?.statesOrAgencies ?? [];
            const packages = row.formData?.packages ?? [];
            const roles = row.formData?.roles ?? [];
            const count = agencies.length + packages.length + roles.length || (row.recipients ?? 0);
            if (count === 0) return <span />;
            const hasDetail = agencies.length > 0 || packages.length > 0 || roles.length > 0;
            return (
              <button
                type="button"
                className="flex items-center gap-[5px]"
                style={{ cursor: hasDetail ? 'pointer' : 'default' }}
                onClick={() => hasDetail && setShowAudience(true)}
              >
                <MdOutlineGroup size={15} color="#27496D" />
                <span className="font-['Montserrat',sans-serif] font-medium text-[12px] leading-[17px]" style={{ color: '#27496D' }}>{count} {count === 1 ? 'Recipient' : 'Recipients'}</span>
              </button>
            );
          })()}
          <button
            type="button"
            className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[13px] px-[12px] py-[8px] rounded-[6px] border transition-colors duration-100 cursor-pointer"
            style={{ color: viewHovered ? 'white' : bucketColor, borderColor: bucketColor, backgroundColor: viewHovered ? bucketColor : 'white' }}
            onMouseEnter={() => setViewHovered(true)}
            onMouseLeave={() => setViewHovered(false)}
            onClick={onView}
          >
            View
          </button>
        </div>
      </div>
    </div>
    </>
  );
}

const DISCARDED_COLUMNS: DiscardedBucket[] = ['Rejected', 'Expired', 'Discontinued'];

function DiscardedBoard({ rows, onView, onDelete }: {
  rows: BroadcastMessageRow[];
  onView: (row: BroadcastMessageRow, bucket: DiscardedBucket) => void;
  onDelete: (id: string) => void;
}) {
  const bucketed = rows
    .map((row) => ({ row, bucket: getDiscardedBucket(row) }))
    .filter((x): x is { row: BroadcastMessageRow; bucket: DiscardedBucket } => x.bucket !== null);

  return (
    <div className="flex gap-[16px] w-full items-start">
      {DISCARDED_COLUMNS.map((bucket) => {
        const colRows = bucketed.filter((x) => x.bucket === bucket).map((x) => x.row);
        const color = BUCKET_COLOR[bucket];
        return (
          <div key={bucket} className="flex flex-col gap-[10px] flex-1 min-w-0 bg-[#fcfcfc] rounded-[10px] p-[12px]">
            <div className="flex items-center justify-between px-[2px]">
              <div className="flex items-center gap-[7px]">
                <span className="font-['Montserrat',sans-serif] font-semibold text-[11px] tracking-[0.06em] uppercase" style={{ color }}>{bucket}</span>
              </div>
              <span className="font-['Montserrat',sans-serif] font-medium text-[11px] text-[#9a9a9a] bg-[#efefef] rounded-full px-[7px] py-[2px]">{colRows.length}</span>
            </div>
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
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const KANBAN_COLUMNS: Array<{ status: MessageStatus; label: string }> = [
  { status: 'Draft', label: 'Drafts' },
  { status: 'Pending', label: 'Pending Approval' },
  { status: 'Live', label: 'Approved' },
];

function KanbanBoard({ rows, role, onEdit, onDelete, onDiscontinue, onSendForApproval, onApprove, onReject }: {
  rows: BroadcastMessageRow[];
  role: UserRole;
  onEdit: (row: BroadcastMessageRow) => void;
  onDelete: (id: string) => void;
  onDiscontinue: (id: string) => void;
  onSendForApproval: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="flex gap-[16px] w-full items-start">
      {KANBAN_COLUMNS.map(({ status, label }) => {
        const colRows = rows.filter((r) => r.status === status && getDiscardedBucket(r) === null);
        const color = STATUS_COLOR[status];
        return (
          <div key={status} className="flex flex-col gap-[10px] flex-1 min-w-0 bg-[#fcfcfc] rounded-[10px] p-[12px]">
            <div className="flex items-center justify-between px-[2px]">
              <div className="flex items-center gap-[7px]">
                <span className="font-['Montserrat',sans-serif] font-semibold text-[11px] tracking-[0.06em] uppercase" style={{ color }}>{label}</span>
              </div>
              <span className="font-['Montserrat',sans-serif] font-medium text-[11px] text-[#9a9a9a] bg-[#efefef] rounded-full px-[7px] py-[2px]">{colRows.length}</span>
            </div>
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
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MessagePreviewModal({ row, onClose }: {
  row: BroadcastMessageRow;
  onClose: () => void;
}) {
  const [deviceView, setDeviceView] = useState<'desktop' | 'phone'>('desktop');

  const isEmergency = row.type === 'Emergency';
  const effectiveFormat: 'Overlay' | 'Banner' = isEmergency ? 'Banner' : ((row.formData?.displayFormat as 'Overlay' | 'Banner') || 'Overlay');
  const color = isEmergency ? '#DA4040' : (row.formData?.messageColor || '#27496D');
  const body = row.formData?.body || row.subject;
  const hasCta = row.formData?.hasCta ?? false;
  const ctaLabel = row.formData?.ctaLabel || 'Learn more';
  const dismissible = !isEmergency && row.formData?.dismissible !== 'Non-Dismissible';
  const isFeatureSpecific = row.formData?.placement === 'Feature Specific';
  const featurePath = row.formData?.featurePath || '';

  // Determine live vs scheduled for the status chip.
  let previewStatus: 'Live' | 'Scheduled' | null = null;
  if (row.startDate !== '—') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(row.startDate);
    const end = new Date(row.endDate !== '—' ? row.endDate : row.startDate);
    if (today < start) previewStatus = 'Scheduled';
    else if (today >= start && today <= end) previewStatus = 'Live';
  }
  const chipBg = previewStatus === 'Live' ? '#EEFFEE' : previewStatus === 'Scheduled' ? '#E8F4FF' : '#F2F2F2';
  const chipColor = previewStatus === 'Live' ? '#00AA00' : previewStatus === 'Scheduled' ? '#2699FB' : '#585858';
  const scheduleRange = row.endDate !== '—' ? `${row.startDate} – ${row.endDate}` : row.startDate;
  const statusChipText = previewStatus ? `${previewStatus}: ${scheduleRange}` : null;
  const placementChips = isFeatureSpecific ? ['Feature Specific', ...(featurePath ? [featurePath] : [])] : ['App-wide'];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-white flex flex-col overflow-hidden">
          {/* Header — the modal's own close is always the exit */}
          <div className="flex items-center justify-between px-[20px] shrink-0" style={{ borderBottom: '1px solid #E5E5E5', height: '56px' }}>
            <div className="flex flex-col gap-[4px]">
              <p className="font-['Montserrat',sans-serif] font-semibold text-[15px] leading-[20px] text-black">Message Preview</p>
              <p className="font-['Montserrat',sans-serif] font-normal text-[12px] leading-[16px]" style={{ color: '#8b8b8b' }}>{row.subject}</p>
            </div>
            <button type="button" onClick={onClose} className="cursor-pointer flex items-center">
              <IoIosClose size={26} color="#27496D" />
            </button>
          </div>

          {/* Context bar — device toggle + "what recipients see" + push indicator */}
          <div className="flex items-center justify-between gap-[12px] px-[20px] py-[10px] shrink-0" style={{ borderBottom: '1px solid #E5E5E5', backgroundColor: '#ffffff' }}>
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
              {row.type && (
                <span
                  className="flex items-center font-['Montserrat',sans-serif] font-medium text-[11px] leading-[15px] px-[8px] py-[3px] rounded-[4px] shrink-0 whitespace-nowrap"
                  style={{ backgroundColor: chipBg, color: chipColor }}
                >
                  {row.type}
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

          {/* Stage — faithful in-context render, always contained */}
          <div className="flex-1 min-h-0 p-[20px]" style={{ backgroundColor: '#f5f6f7' }}>
            {deviceView === 'desktop' ? (
              <div className="w-full h-full flex justify-center">
                <div style={{ aspectRatio: '16 / 10', height: '100%', maxWidth: '100%' }}>
                  <ScreenSkeleton effectiveFormat={effectiveFormat} title={row.subject} body={body} color={color} dismissible={dismissible} hasCta={hasCta} ctaLabel={ctaLabel} />
                </div>
              </div>
            ) : (
              <PhoneSkeleton effectiveFormat={effectiveFormat} title={row.subject} body={body} color={color} dismissible={dismissible} hasCta={hasCta} ctaLabel={ctaLabel} />
            )}
          </div>
      </div>
    </div>
  );
}

export default function BroadcastStudioDashboard() {
  const role = useRole();

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
  const [viewingRow, setViewingRow] = useState<BroadcastMessageRow | null>(null);
  const [viewingDiscardedRow, setViewingDiscardedRow] = useState<{ row: BroadcastMessageRow; bucket: DiscardedBucket } | null>(null);

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
  };

  const handleApprove = (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'Live' } : m));
  };

  const handleReject = (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'Rejected', statusChangedAt: new Date().toISOString() } : m));
  };

  const handleDiscontinue = (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'Discontinued', statusChangedAt: new Date().toISOString() } : m));
  };

  const handleCopyToDrafts = (row: BroadcastMessageRow) => {
    const draft: BroadcastMessageRow = {
      ...row,
      id: Date.now().toString(),
      status: 'Draft',
      startDate: '—',
      endDate: '—',
      recipients: null,
      statusChangedAt: undefined,
    };
    setMessages((prev) => [draft, ...prev]);
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
  };

  const liveCount = messages.filter((m) => m.status === 'Live' && getDiscardedBucket(m) === null).length;
  const pendingCount = messages.filter((m) => m.status === 'Pending').length;
  const draftCount = messages.filter((m) => m.status === 'Draft').length;

  const query = search.trim().toLowerCase();
  const searchFiltered = messages.filter(
    (row) =>
      query.length === 0 ||
      row.subject.toLowerCase().includes(query) ||
      row.audience.toLowerCase().includes(query)
  );

  const filteredRows = searchFiltered.filter((row) => row.status === selectedStatus);

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

      <div className="flex items-center gap-[12px] w-full">
        <SearchInput value={search} onChange={setSearch} />
        <NewMessageButton onClick={() => setIsComposeOpen(true)} />
        <ShowDiscardedToggle checked={showDiscarded} onChange={setShowDiscarded} />
        <div className="flex-1" />
        {SHOW_VIEW_TOGGLE && <ViewToggle view={viewMode} onChange={setViewMode} />}
      </div>

      {showDiscarded ? (
        <DiscardedBoard
          rows={searchFiltered}
          onView={(row, bucket) => setViewingDiscardedRow({ row, bucket })}
          onDelete={handleDelete}
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
        />
      )}

      {editingRow && (
        <ComposeMessageOverlay
          onClose={() => setEditingRow(null)}
          overlayTitle="Edit Message"
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
              formData: data,
            }, ...prev.filter((m) => m.id !== editingRow!.id)]);
            setSelectedStatus('Draft');
            setEditingRow(null);
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
            onReject: () => { handleReject(reviewingRow.id); setReviewingRow(null); },
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

      {viewingRow && (
        <MessagePreviewModal
          row={viewingRow}
          onClose={() => setViewingRow(null)}
        />
      )}

      {viewingDiscardedRow && (
        <ComposeMessageOverlay
          onClose={() => setViewingDiscardedRow(null)}
          overlayTitle={`${viewingDiscardedRow.bucket} Message`}
          readOnly
          initialData={{
            title: viewingDiscardedRow.row.subject,
            messageType: viewingDiscardedRow.row.type,
            startDate: parseDisplayDate(viewingDiscardedRow.row.startDate),
            endDate: parseDisplayDate(viewingDiscardedRow.row.endDate),
            ...viewingDiscardedRow.row.formData,
          }}
          onDeleteRow={() => { handleDelete(viewingDiscardedRow.row.id); setViewingDiscardedRow(null); }}
          onCopyToDrafts={role === 'super-admin' ? () => { handleCopyToDrafts(viewingDiscardedRow.row); setViewingDiscardedRow(null); } : undefined}
        />
      )}

      <RoleToggle role={role} />

      {isComposeOpen && (
        <ComposeMessageOverlay
          onClose={() => setIsComposeOpen(false)}
          onMessageCreated={handleMessageCreated}
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
                formData: data,
              },
              ...prev,
            ]);
            setSelectedStatus('Draft');
          }}
        />
      )}
    </div>
  );
}
