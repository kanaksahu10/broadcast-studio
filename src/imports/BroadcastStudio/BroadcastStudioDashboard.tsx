import { useMemo, useState } from 'react';
import { BsSearch } from 'react-icons/bs';
import { MdAdd } from 'react-icons/md';

type MessageStatus = 'Live' | 'Pending' | 'Draft';

interface BroadcastMessageRow {
  id: string;
  subject: string;
  audience: string;
  channel: 'Email' | 'SMS' | 'Push';
  status: MessageStatus;
  date: string;
  recipients: number | null;
}

const STATUS_COLOR: Record<MessageStatus, string> = {
  Live: '#0078d4',
  Pending: '#c17f16',
  Draft: '#8a8a8a',
};

const MESSAGES: BroadcastMessageRow[] = [
  { id: '1', subject: 'Summer Schedule Update', audience: 'All Field Staff', channel: 'Email', status: 'Live', date: 'Jul 10, 2026', recipients: 1204 },
  { id: '2', subject: 'New Overtime Policy', audience: 'Payroll Admins', channel: 'Email', status: 'Live', date: 'Jul 8, 2026', recipients: 42 },
  { id: '3', subject: 'Holiday Closure Notice', audience: 'All Employees', channel: 'SMS', status: 'Pending', date: 'Jul 20, 2026', recipients: 3150 },
  { id: '4', subject: 'Client Portal Maintenance', audience: 'All Clients', channel: 'Email', status: 'Pending', date: 'Jul 18, 2026', recipients: 892 },
  { id: '5', subject: 'Q3 Training Reminder', audience: 'Field Staff — Region A', channel: 'Push', status: 'Draft', date: '—', recipients: null },
  { id: '6', subject: 'Referral Program Launch', audience: 'All Agencies', channel: 'Email', status: 'Draft', date: '—', recipients: null },
];

const FILTERS: Array<'All' | MessageStatus> = ['All', 'Live', 'Pending', 'Draft'];

function StatusCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="bg-white rounded-[8px] border border-[#e5e5e5] p-[16px] flex items-center gap-[12px] w-[220px] shrink-0">
      <div className="h-[40px] w-[4px] rounded-full shrink-0" style={{ backgroundColor: color }} />
      <div className="flex flex-col">
        <p className="font-['Montserrat',sans-serif] font-bold text-[28px] leading-[34px] text-[#27496d]">{count}</p>
        <p className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[18px] text-[#717182]">{label}</p>
      </div>
    </div>
  );
}

function NewMessageButton() {
  return (
    <button
      type="button"
      className="bg-[#2699fb] content-stretch flex gap-[6px] h-[38px] items-center px-[14px] rounded-[8px] shrink-0 cursor-pointer"
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
    <div className="bg-white content-stretch flex gap-[8px] items-center px-[13px] py-[10px] relative rounded-[4px] shrink-0 w-[302px]" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <BsSearch className="shrink-0" size={12} color="#c3c3c3" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search messages by subject or audience...."
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
  { key: 'subject', label: 'Message', width: 240 },
  { key: 'audience', label: 'Audience', width: 200 },
  { key: 'channel', label: 'Channel', width: 110 },
  { key: 'status', label: 'Status', width: 110 },
  { key: 'date', label: 'Date Sent', width: 130 },
  { key: 'recipients', label: 'Recipients', width: 120 },
];

function MessageTable({ rows }: { rows: BroadcastMessageRow[] }) {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Table">
      <div className="content-stretch flex flex-col items-start overflow-x-auto relative rounded-[inherit] size-full">
        <div className="bg-white content-stretch flex h-[48px] items-center relative shrink-0 w-full" data-name=".Row">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              className="h-full flex items-center px-[12px] py-[10px] shrink-0 border-r border-[#e5e5e5] last:border-r-0"
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
              <div className="h-full flex items-center px-[12px] py-[10px] shrink-0 border-r border-[#e5e5e5]" style={{ width: 240 }}>
                <p className="font-['Montserrat',sans-serif] font-normal leading-[17px] text-[#000000] text-[12px] whitespace-nowrap overflow-hidden text-ellipsis">{row.subject}</p>
              </div>
              <div className="h-full flex items-center px-[12px] py-[10px] shrink-0 border-r border-[#e5e5e5]" style={{ width: 200 }}>
                <p className="font-['Montserrat',sans-serif] font-normal leading-[17px] text-[#000000] text-[12px] whitespace-nowrap">{row.audience}</p>
              </div>
              <div className="h-full flex items-center px-[12px] py-[10px] shrink-0 border-r border-[#e5e5e5]" style={{ width: 110 }}>
                <p className="font-['Montserrat',sans-serif] font-normal leading-[17px] text-[#000000] text-[12px] whitespace-nowrap">{row.channel}</p>
              </div>
              <div className="h-full flex items-center px-[12px] py-[10px] shrink-0 border-r border-[#e5e5e5]" style={{ width: 110 }}>
                <StatusBadge status={row.status} />
              </div>
              <div className="h-full flex items-center px-[12px] py-[10px] shrink-0 border-r border-[#e5e5e5]" style={{ width: 130 }}>
                <p className="font-['Montserrat',sans-serif] font-normal leading-[17px] text-[#000000] text-[12px] whitespace-nowrap">{row.date}</p>
              </div>
              <div className="h-full flex items-center px-[12px] py-[10px] shrink-0" style={{ width: 120 }}>
                <p className="font-['Montserrat',sans-serif] font-normal leading-[17px] text-[#000000] text-[12px] whitespace-nowrap">
                  {row.recipients === null ? '—' : row.recipients.toLocaleString()}
                </p>
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

export default function BroadcastStudioDashboard() {
  const [filter, setFilter] = useState<'All' | MessageStatus>('All');
  const [search, setSearch] = useState('');

  const liveCount = MESSAGES.filter((m) => m.status === 'Live').length;
  const pendingCount = MESSAGES.filter((m) => m.status === 'Pending').length;
  const draftCount = MESSAGES.filter((m) => m.status === 'Draft').length;

  const filteredRows = MESSAGES.filter((row) => {
    const matchesFilter = filter === 'All' || row.status === filter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      row.subject.toLowerCase().includes(query) ||
      row.audience.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-[20px] items-start w-full pb-[8px]" data-name="Broadcast Studio Dashboard">
      <div className="flex items-center gap-[12px] w-full">
        <SearchInput value={search} onChange={setSearch} />
        <div className="flex-1" />
        <NewMessageButton />
      </div>

      <MessageTable rows={filteredRows} />

      <AudienceMetrics rows={MESSAGES} />
    </div>
  );
}
