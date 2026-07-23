import { useCallback, useEffect, useMemo, useState } from 'react';
import { BsSearch } from 'react-icons/bs';
import { FiExternalLink } from 'react-icons/fi';
import { IoIosClose } from 'react-icons/io';
import { MdAdd, MdTableRows, MdViewKanban } from 'react-icons/md';
import ComposeMessageOverlay from './ComposeMessageOverlay';

type UserRole = 'super-admin' | 'extra-super-admin';

function useRole(): UserRole {
  const param = new URLSearchParams(window.location.search).get('role');
  return param === 'extra-super-admin' ? 'extra-super-admin' : 'super-admin';
}

function RoleBadge({ role }: { role: UserRole }) {
  if (import.meta.env.PROD) return null;
  const isExtra = role === 'extra-super-admin';
  return (
    <div
      className="fixed bottom-[16px] left-[16px] z-[9999] px-[10px] py-[5px] rounded-[6px] font-['Montserrat',sans-serif] font-medium text-[11px] pointer-events-none"
      style={{ backgroundColor: isExtra ? '#27496D' : '#2699fb', color: 'white', opacity: 0.9 }}
    >
      {isExtra ? 'Extra Super Admin' : 'Super Admin'}
    </div>
  );
}

type ViewMode = 'datagrid' | 'kanban';

// FEATURE FLAG: set to true to restore the datagrid/kanban toggle button
const SHOW_VIEW_TOGGLE = false;

type MessageStatus = 'Live' | 'Pending' | 'Draft';
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
}

const STATUS_COLOR: Record<MessageStatus, string> = {
  Live: '#00aa00',
  Pending: '#ff8800',
  Draft: '#8a8a8a',
};

const STATUS_BG: Record<MessageStatus, string> = {
  Live: '#eeffee',
  Pending: '#fefad1',
  Draft: '#f0f0f0',
};

const STATUS_HOVER_BORDER: Record<MessageStatus, string> = {
  Live: '#008800',
  Pending: '#ff8800',
  Draft: '#6a6a6a',
};

const STATUS_HOVER_SHADOW: Record<MessageStatus, string> = {
  Live: '0px 0px 8px #c6e2c1',
  Pending: '0px 0px 8px #e0c7b4',
  Draft: '0px 0px 8px #c8c8c8',
};

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
  { id: '1', subject: 'Summer Schedule Update', type: 'Announcement', audience: 'All Field Staff', channel: 'Email', status: 'Live', startDate: 'Jul 10, 2026', endDate: 'Jul 17, 2026', recipients: 1204 },
  { id: '2', subject: 'New Overtime Policy', type: 'Emergency', audience: 'Payroll Admins', channel: 'Email', status: 'Live', startDate: 'Jul 8, 2026', endDate: 'Jul 15, 2026', recipients: 42 },
  { id: '3', subject: 'Holiday Closure Notice', type: 'Announcement', audience: 'All Employees', channel: 'SMS', status: 'Pending', startDate: 'Jul 20, 2026', endDate: 'Jul 27, 2026', recipients: 3150 },
  { id: '4', subject: 'Client Portal Maintenance', type: 'Emergency', audience: 'All Clients', channel: 'Email', status: 'Pending', startDate: 'Jul 18, 2026', endDate: 'Jul 19, 2026', recipients: 892 },
  { id: '5', subject: 'Q3 Training Reminder', type: 'Announcement', audience: 'Field Staff — Region A', channel: 'Push', status: 'Draft', startDate: '—', endDate: '—', recipients: null },
  { id: '6', subject: 'Referral Program Launch', type: 'Announcement', audience: 'All Agencies', channel: 'Email', status: 'Draft', startDate: '—', endDate: '—', recipients: null },
];

const STORAGE_KEY = 'bs-messages';

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
      className="bg-[#2699fb] content-stretch flex gap-[6px] h-[32px] items-center px-[14px] rounded-[8px] shrink-0 cursor-pointer"
      data-name="New Message Button"
    >
      <MdAdd className="shrink-0" size={17} color="white" />
      <span className="font-['Montserrat',sans-serif] font-medium text-[13px] text-white whitespace-nowrap">New Message</span>
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
};

function KanbanCard({ row, role, onEdit, onSendForApproval, onApprove, onReject }: {
  row: BroadcastMessageRow;
  role: UserRole;
  onEdit?: () => void;
  onSendForApproval?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const color = STATUS_COLOR[row.status];
  const dateRange = row.startDate === '—' ? '—' : `${row.startDate} – ${row.endDate}`;
  const isSuperAdmin = role === 'super-admin';
  const isDraft = row.status === 'Draft';
  const isPending = row.status === 'Pending';
  return (
    <div className="bg-white rounded-[8px] border border-[#e5e5e5] overflow-hidden flex" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="w-[4px] shrink-0" style={{ backgroundColor: color }} />
      <div className="flex flex-col gap-[10px] p-[14px] flex-1 min-w-0">
        <div>
          <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px] text-[#000000]">{row.subject}</p>
          {(row.type || dateRange !== '—') && (
            <p className="font-['Montserrat',sans-serif] font-normal text-[12px] leading-[17px] text-[#8b8b8b] mt-[2px]">
              {row.type}{row.type && dateRange !== '—' && <span> • </span>}{dateRange !== '—' && dateRange}
            </p>
          )}
        </div>
        {row.recipients !== null && (
          <span className="font-['Montserrat',sans-serif] font-medium text-[11px] px-[8px] py-[3px] rounded-[4px] bg-[#e8f3ff] text-[#2699fb] whitespace-nowrap self-start">{row.recipients.toLocaleString()} Agencies</span>
        )}
        <div className="flex items-center justify-end gap-[8px]">
          {isDraft && (
            <button
              type="button"
              className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[13px] px-[12px] h-[32px] rounded-[6px] border transition-colors duration-100"
              style={{ color, borderColor: color, backgroundColor: 'white' }}
              onClick={onEdit}
            >
              Edit
            </button>
          )}
          {isPending && (
            <button
              type="button"
              className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[13px] px-[12px] h-[32px] rounded-[6px] border transition-colors duration-100"
              style={{ color, borderColor: color, backgroundColor: 'white' }}
              onClick={onEdit}
            >
              Review
            </button>
          )}
          {row.status === 'Live' && (
            <button
              type="button"
              className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[13px] px-[12px] h-[32px] rounded-[6px] border transition-colors duration-100"
              style={{ color, borderColor: color, backgroundColor: 'white' }}
              onClick={onEdit}
            >
              View
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const KANBAN_COLUMNS: Array<{ status: MessageStatus; label: string }> = [
  { status: 'Draft', label: 'Drafts' },
  { status: 'Pending', label: 'Pending Approval' },
  { status: 'Live', label: 'Live' },
];

function KanbanBoard({ rows, role, onEdit, onSendForApproval, onApprove, onReject }: {
  rows: BroadcastMessageRow[];
  role: UserRole;
  onEdit: (row: BroadcastMessageRow) => void;
  onSendForApproval: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="flex gap-[16px] w-full items-start">
      {KANBAN_COLUMNS.map(({ status, label }) => {
        const colRows = rows.filter((r) => r.status === status);
        const color = STATUS_COLOR[status];
        return (
          <div key={status} className="flex flex-col gap-[10px] flex-1 min-w-0 bg-[#fcfcfc] rounded-[10px] p-[12px]">
            <div className="flex items-center justify-between px-[2px]">
              <div className="flex items-center gap-[7px]">
                <div className="rounded-full size-[8px] shrink-0" style={{ backgroundColor: color }} />
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

function LiveMessagePreview({ row, onClose }: { row: BroadcastMessageRow; onClose: () => void }) {
  const isEmergency = row.type === 'Emergency';
  const displayFormat = isEmergency ? 'Banner' : (row.formData?.displayFormat || 'Overlay');
  const bannerColor = isEmergency ? '#DA4040' : (row.formData?.messageColor || '#27496D');
  const body = row.formData?.body || row.subject;
  const hasCta = row.formData?.hasCta ?? false;
  const ctaLabel = row.formData?.ctaLabel || 'Learn more';
  const ctaDestination = row.formData?.ctaDestination || '#';
  const isDismissible = !isEmergency && row.formData?.dismissible !== 'Non-Dismissible';
  const isFeatureSpecific = row.formData?.placement === 'Feature Specific';
  const featurePath = row.formData?.featurePath || '';

  const handleAction = () => {
    if (isFeatureSpecific && featurePath) {
      window.location.href = featurePath;
    } else {
      onClose();
    }
  };

  if (displayFormat === 'Banner') {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-[16px] px-[16px] py-[12px] w-full"
        style={{ backgroundColor: bannerColor }}
      >
        {isDismissible && <div className="shrink-0" style={{ width: 18 }} />}
        <p className="font-['Montserrat',sans-serif] font-normal text-[13px] text-white flex-1 text-center">
          {body}
          {hasCta && ctaLabel && (
            <> <span onClick={handleAction} className="font-medium underline cursor-pointer">{ctaLabel}</span></>
          )}
        </p>
        {isDismissible ? (
          <button type="button" onClick={onClose} className="cursor-pointer flex items-center shrink-0">
            <IoIosClose size={18} color="white" />
          </button>
        ) : (
          <div className="shrink-0" style={{ width: 18 }} />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
        onClick={isDismissible ? onClose : undefined}
      />
      <div className="absolute right-0 top-0 bottom-0 w-[399px] bg-white flex flex-col">
        <div
          className="flex items-center justify-between px-[16px] shrink-0"
          style={{ borderBottom: '1px solid #E5E5E5', height: '56px' }}
        >
          <p className="font-['Montserrat',sans-serif] font-semibold text-[16px] text-black">{row.subject}</p>
          {isDismissible && (
            <button type="button" onClick={onClose} className="cursor-pointer flex items-center">
              <IoIosClose size={26} color="#000000" />
            </button>
          )}
        </div>
        <div className="flex-1 px-[16px] py-[24px] overflow-y-auto flex flex-col gap-[16px]">
          <p className="font-['Montserrat',sans-serif] font-normal text-[14px] text-black leading-[1.5]">{body}</p>
          {hasCta && (
            <a
              href={ctaDestination}
              className="flex items-center gap-[6px] cursor-pointer font-['Montserrat',sans-serif] font-medium text-[13px] underline"
              style={{ color: '#27496D' }}
              target="_blank"
              rel="noreferrer"
            >
              <FiExternalLink size={14} className="shrink-0" />
              {ctaLabel}
            </a>
          )}
        </div>
        <div
          className="flex items-center justify-between px-[16px] shrink-0"
          style={{ borderTop: '1px solid #E5E5E5', backgroundColor: '#f8f8f8', height: '60px' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="font-['Montserrat',sans-serif] font-medium text-[14px] cursor-pointer"
            style={{ color: '#27496D' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAction}
            className="font-['Montserrat',sans-serif] font-semibold text-[13px] text-white px-[16px] h-[32px] rounded-[8px] cursor-pointer"
            style={{ backgroundColor: '#2699FB' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BroadcastStudioDashboard() {
  const role = useRole();

  useEffect(() => {
    document.title = role === 'extra-super-admin' ? 'BS - Extra Super Admin' : 'BS - Super Admin';
  }, [role]);

  const [messages, setMessages] = useSharedMessages();
  const [selectedStatus, setSelectedStatus] = useState<MessageStatus>('Live');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<BroadcastMessageRow | null>(null);
  const [reviewingRow, setReviewingRow] = useState<BroadcastMessageRow | null>(null);
  const [viewingRow, setViewingRow] = useState<BroadcastMessageRow | null>(null);

  const handleSendForApproval = (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'Pending' } : m));
  };

  const handleApprove = (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'Live' } : m));
  };

  const handleReject = (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: 'Draft' } : m));
  };

  const handleMessageCreated = (data: MessageFormData & { title?: string; messageType?: string; startDate?: string; endDate?: string; statesOrAgencies?: string[]; searchMode?: string }) => {
    const agencies = data.statesOrAgencies ?? [];
    const audience = agencies.length === 0 ? 'All' : agencies.length <= 2 ? agencies.join(', ') : `${agencies.slice(0, 2).join(', ')} +${agencies.length - 2}`;
    const newStatus = role === 'extra-super-admin' ? 'Live' : 'Pending';
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

  const liveCount = messages.filter((m) => m.status === 'Live').length;
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
      {viewMode === 'datagrid' && (
        <div className="flex items-center gap-[16px] w-full">
          <StatusCard label="Live" count={liveCount} color={STATUS_COLOR.Live} bg={STATUS_BG.Live} hoverBorder={STATUS_HOVER_BORDER.Live} hoverShadow={STATUS_HOVER_SHADOW.Live} active={selectedStatus === 'Live'} onClick={() => setSelectedStatus('Live')} />
          <StatusCard label="Pending Approval" count={pendingCount} color={STATUS_COLOR.Pending} bg={STATUS_BG.Pending} hoverBorder={STATUS_HOVER_BORDER.Pending} hoverShadow={STATUS_HOVER_SHADOW.Pending} active={selectedStatus === 'Pending'} onClick={() => setSelectedStatus('Pending')} />
          <StatusCard label="Drafts" count={draftCount} color={STATUS_COLOR.Draft} bg={STATUS_BG.Draft} hoverBorder={STATUS_HOVER_BORDER.Draft} hoverShadow={STATUS_HOVER_SHADOW.Draft} active={selectedStatus === 'Draft'} onClick={() => setSelectedStatus('Draft')} />
        </div>
      )}

      {viewMode === 'kanban' && <AudienceMetrics rows={messages} />}

      <div className="flex items-center gap-[12px] w-full">
        <SearchInput value={search} onChange={setSearch} />
        <NewMessageButton onClick={() => setIsComposeOpen(true)} />
        <div className="flex-1" />
        {SHOW_VIEW_TOGGLE && <ViewToggle view={viewMode} onChange={setViewMode} />}
      </div>

      {viewMode === 'datagrid' ? (
        <MessageTable rows={filteredRows} />
      ) : (
        <KanbanBoard
          rows={searchFiltered}
          role={role}
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
          readOnly
          {...(role === 'extra-super-admin' ? {
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
        <LiveMessagePreview row={viewingRow} onClose={() => setViewingRow(null)} />
      )}

      <RoleBadge role={role} />

      {isComposeOpen && (
        <ComposeMessageOverlay
          onClose={() => setIsComposeOpen(false)}
          onMessageCreated={handleMessageCreated}
          submitLabel={role === 'extra-super-admin' ? 'Publish' : 'Send for Approval'}
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
