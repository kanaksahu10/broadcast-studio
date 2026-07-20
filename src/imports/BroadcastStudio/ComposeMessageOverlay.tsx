import { useEffect, useRef, useState } from 'react';
import { IoIosClose } from 'react-icons/io';
import { IoMdArrowDropdown } from 'react-icons/io';
import { BiCalendarEvent } from 'react-icons/bi';
import { MdCheck, MdClose, MdPreview, MdSend } from 'react-icons/md';
import { GrAnnounce } from 'react-icons/gr';

type MessageType = '' | 'Announcement' | 'Emergency';
type DisplayFormat = '' | 'Overlay' | 'Banner';
type Placement = '' | 'App-wide' | 'Feature Specific';
type SearchMode = 'Agency' | 'State';
type Dismissible = 'Dismissible' | 'Non-Dismissible';

interface Agency {
  id: string;
  name: string;
  state: string;
  package: string;
  role: string;
}

const AGENCIES: Agency[] = [
  { id: '1', name: 'Sunrise Home Care', state: 'California', package: 'Enterprise', role: 'Owner' },
  { id: '2', name: 'Golden Gate Health Partners', state: 'California', package: 'Premium', role: 'Admin' },
  { id: '3', name: 'Lone Star Caregivers', state: 'Texas', package: 'Standard', role: 'Care Coordinator' },
  { id: '4', name: 'Austin Family Support', state: 'Texas', package: 'Premium', role: 'Admin' },
  { id: '5', name: 'Empire Homecare Group', state: 'New York', package: 'Enterprise', role: 'Owner' },
  { id: '6', name: 'Brooklyn Senior Services', state: 'New York', package: 'Standard', role: 'Field Staff' },
  { id: '7', name: 'Sunshine State Care', state: 'Florida', package: 'Premium', role: 'Care Coordinator' },
  { id: '8', name: 'Everglades Health Network', state: 'Florida', package: 'Standard', role: 'Admin' },
  { id: '9', name: 'Cascade Caregivers', state: 'Washington', package: 'Enterprise', role: 'Owner' },
  { id: '10', name: 'Windy City Homecare', state: 'Illinois', package: 'Premium', role: 'Field Staff' },
];

const STATES = Array.from(new Set(AGENCIES.map((a) => a.state)));
const PACKAGES = Array.from(new Set(AGENCIES.map((a) => a.package)));
const ROLES = Array.from(new Set(AGENCIES.map((a) => a.role)));
const FEATURE_PATHS = ['Dashboard', 'Scheduling', 'Billing', 'Clients', 'Employees', 'Broadcast Studio'];
const FREQUENCY_OPTIONS = ['Once', 'Every Login', 'Daily', 'Weekly'];

/* -- Design tokens copied from the GEOH "Overlay - New Message" Figma frame -- */
const BORDER = '#e5e5e5';
const LABEL_GREY = '#646464';
const NAVY = '#334c6d';
const PRIMARY = '#2699fb';
const PLACEHOLDER = '#b8b8b8';

function SectionHeader({ children }: { children: string }) {
  return <p className="font-['Montserrat',sans-serif] font-medium text-[14px] leading-[20px] text-black w-full">{children}</p>;
}

function FieldShell({ label, height, children }: { label: string; height?: number; children: React.ReactNode }) {
  return (
    <div
      className="bg-white border rounded-[4px] px-[12px] py-[8px] flex flex-col gap-[8px] justify-center w-full"
      style={{ borderColor: BORDER, borderWidth: '1px', minHeight: height ?? 70 }}
    >
      <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px]" style={{ color: LABEL_GREY }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <FieldShell label={label}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-['Montserrat',sans-serif] font-normal text-[13px] text-black placeholder:text-[#b8b8b8] outline-none bg-transparent w-full"
      />
    </FieldShell>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <FieldShell label={label}>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        className="font-['Montserrat',sans-serif] font-normal text-[13px] text-black placeholder:text-[#b8b8b8] outline-none bg-transparent w-full resize-none overflow-hidden"
      />
    </FieldShell>
  );
}

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`bg-white w-full flex flex-col gap-[8px] justify-center px-[8px] py-[12px] text-left cursor-pointer border border-[#e5e5e5] ${
          open ? 'rounded-tl-[4px] rounded-tr-[4px]' : 'rounded-[4px]'
        }`}
      >
        <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px]" style={{ color: LABEL_GREY }}>
          {label}
        </p>
        <div className="flex items-center justify-between w-full">
          <span
            className="font-['Montserrat',sans-serif] font-normal text-[13px]"
            style={{ color: value ? '#000000' : PLACEHOLDER }}
          >
            {value || placeholder}
          </span>
          <IoMdArrowDropdown
            size={20}
            color="#27496D"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}
          />
        </div>
      </button>
      {open && (
        <div className="absolute z-10 top-full left-0 w-full">
          {options.map((opt, idx) => {
            const isLast = idx === options.length - 1;
            return (
              <button
                type="button"
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`w-full flex items-center h-[40px] px-[8px] py-[4px] text-left hover:bg-[#efefef] cursor-pointer bg-white border-l border-r border-[#e5e5e5] ${
                  isLast ? 'border-b rounded-bl-[4px] rounded-br-[4px]' : ''
                }`}
              >
                <span className="font-['Montserrat',sans-serif] font-medium text-[12px] text-black">{opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <FieldShell label={label}>
      <div className="flex items-center justify-between w-full relative">
        <div className="relative flex-1 pr-[24px]">
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="date-input-no-native-icon font-['Montserrat',sans-serif] font-normal text-[13px] outline-none bg-transparent w-full"
            style={{ color: value ? '#000000' : focused ? '#B8B8B8' : 'transparent' }}
          />
          {!value && !focused && (
            <span
              className="absolute inset-0 font-['Montserrat',sans-serif] font-normal text-[13px] pointer-events-none flex items-center"
              style={{ color: '#B8B8B8' }}
            >
              00 / 00 / 0000
            </span>
          )}
        </div>
        <BiCalendarEvent className="absolute right-0 pointer-events-none" size={18} color="#27496D" />
      </div>
    </FieldShell>
  );
}

function MultiSelectField({
  label,
  values,
  onChange,
  placeholder,
  options,
  caption,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  options: string[];
  caption?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (opt: string) => {
    onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full text-left cursor-pointer">
        <FieldShell label={label} height={values.length > 0 ? undefined : 70}>
          <div className="flex items-center justify-between w-full gap-[8px]">
            <div className="flex flex-wrap gap-[6px] flex-1 min-w-0">
              {values.length === 0 ? (
                <span className="font-['Montserrat',sans-serif] font-normal text-[13px]" style={{ color: PLACEHOLDER }}>
                  {placeholder}
                </span>
              ) : (
                values.map((v) => (
                  <span
                    key={v}
                    className="bg-[#eaf4fe] font-medium text-[12px] rounded-[4px] px-[8px] py-[2px] flex items-center gap-[4px]"
                    style={{ color: PRIMARY }}
                  >
                    {v}
                  </span>
                ))
              )}
            </div>
            <IoMdArrowDropdown className="shrink-0" size={20} color="#27496D" />
          </div>
        </FieldShell>
      </button>
      {caption && (
        <p className="font-['Montserrat',sans-serif] font-medium text-[12px] mt-[6px]" style={{ color: NAVY }}>
          {caption}
        </p>
      )}
      {open && (
        <div className="absolute z-10 top-full left-0 mt-[4px] w-full bg-white border rounded-[4px] shadow-lg max-h-[220px] overflow-y-auto" style={{ borderColor: BORDER }}>
          {options.map((opt) => {
            const checked = values.includes(opt);
            return (
              <button
                type="button"
                key={opt}
                onClick={() => toggle(opt)}
                className="w-full flex items-center gap-[8px] px-[12px] py-[10px] text-left hover:bg-[#f7fbff] cursor-pointer"
              >
                <span
                  className="size-[16px] rounded-[3px] border flex items-center justify-center shrink-0"
                  style={{ borderColor: checked ? PRIMARY : BORDER, backgroundColor: checked ? PRIMARY : 'white' }}
                >
                  {checked && <MdCheck size={12} color="white" />}
                </span>
                <span className="font-['Montserrat',sans-serif] text-[13px] text-black">{opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className="flex items-center justify-center size-[20px] rounded-full border-2 shrink-0"
      style={{ borderColor: selected ? PRIMARY : BORDER }}
    >
      {selected && <span className="size-[10px] rounded-full" style={{ backgroundColor: PRIMARY }} />}
    </span>
  );
}

function RadioField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <FieldShell label={label}>
      <div className="flex gap-[16px] items-center w-full">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(opt)} className="flex items-center gap-[8px] cursor-pointer">
            <RadioDot selected={value === opt} />
            <span className="font-['Montserrat',sans-serif] font-medium text-[12px] text-black">{opt}</span>
          </button>
        ))}
      </div>
    </FieldShell>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-[44px] h-[24px] rounded-full flex items-center px-[2px] transition-colors shrink-0 cursor-pointer"
      style={{ backgroundColor: checked ? PRIMARY : '#e0e0e0', justifyContent: checked ? 'flex-end' : 'flex-start' }}
    >
      <span className="size-[20px] rounded-full bg-white shadow" />
    </button>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="bg-[#fcfcfc] border rounded-[4px] px-[12px] py-[16px] flex items-center justify-between w-full" style={{ borderColor: BORDER }}>
      <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px]" style={{ color: NAVY }}>
        {label}
      </p>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

function CtaBox({ checked, onChange, label, destination, onLabelChange, onDestinationChange }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  destination: string;
  onLabelChange: (v: string) => void;
  onDestinationChange: (v: string) => void;
}) {
  return (
    <div className="bg-[#fcfcfc] border rounded-[4px] px-[12px] py-[16px] flex flex-col gap-[16px] w-full" style={{ borderColor: BORDER }}>
      <div className="flex items-center justify-between w-full">
        <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px]" style={{ color: NAVY }}>
          Call To Action
        </p>
        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
      {checked && (
        <div className="flex flex-col gap-[16px] w-full">
          <TextField label="Label" value={label} onChange={onLabelChange} placeholder="e.g. Learn More" />
          <TextField label="Destination URL" value={destination} onChange={onDestinationChange} placeholder="https://..." />
        </div>
      )}
    </div>
  );
}

function BannerPreview({
  body,
  color,
  dismissible,
  hasCta,
  ctaLabel,
  rounded = true,
}: {
  body: string;
  color: string;
  dismissible: boolean;
  hasCta: boolean;
  ctaLabel: string;
  rounded?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-[16px] px-[16px] py-[12px] w-full ${rounded ? 'rounded-[6px]' : ''}`}
      style={{ backgroundColor: color }}
    >
      {dismissible && <div className="shrink-0" style={{ width: 18 }} />}
      <p className="font-['Montserrat',sans-serif] font-normal text-[13px] text-white flex-1 text-center">
        {body || 'Your message body will appear here.'}
        {hasCta && ctaLabel && (
          <>
            {' '}
            <span className="font-medium underline cursor-pointer">{ctaLabel}</span>
          </>
        )}
      </p>
      {dismissible && <MdClose size={18} color="white" className="shrink-0 cursor-pointer" />}
    </div>
  );
}

function OverlayPreview({
  title,
  body,
  dismissible,
  hasCta,
  ctaLabel,
  rounded = true,
}: {
  title: string;
  body: string;
  dismissible: boolean;
  hasCta: boolean;
  ctaLabel: string;
  rounded?: boolean;
}) {
  return (
    <div
      className={`bg-white border flex flex-col w-[320px] h-full ${rounded ? 'rounded-[8px] shadow-md' : 'border-t-0 border-r-0 border-b-0'}`}
      style={{ borderColor: BORDER }}
    >
      <div className="flex items-center justify-between px-[16px] py-[12px] border-b shrink-0" style={{ borderColor: BORDER }}>
        <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">{title || 'Message Title'}</p>
        {dismissible && <MdClose size={18} color="#000000" className="cursor-pointer shrink-0" />}
      </div>
      <div className="px-[16px] py-[14px] flex flex-col gap-[10px] flex-1 overflow-y-auto">
        <p className="font-['Montserrat',sans-serif] font-normal text-[13px] text-[#383838] whitespace-pre-wrap">
          {body || 'Your message body will appear here.'}
        </p>
        {hasCta && ctaLabel && (
          <p className="font-['Montserrat',sans-serif] font-medium text-[13px] underline cursor-pointer" style={{ color: PRIMARY }}>
            {ctaLabel}
          </p>
        )}
      </div>
      {dismissible && (
        <div className="flex items-center justify-between px-[16px] py-[10px] border-t shrink-0" style={{ borderColor: BORDER, backgroundColor: '#fafafa' }}>
          <span className="font-['Montserrat',sans-serif] font-medium text-[11px] uppercase tracking-wide cursor-pointer" style={{ color: NAVY }}>
            Don't show again
          </span>
          <button
            type="button"
            className="rounded-[6px] px-[12px] py-[6px] font-['Montserrat',sans-serif] font-medium text-[12px] text-white flex items-center gap-[4px] cursor-pointer"
            style={{ backgroundColor: PRIMARY }}
          >
            <MdCheck size={14} /> Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

const SKELETON = {
  grey: '#e2e2e2',
  greyLight: '#ececec',
  avatar: '#8b3fe0',
  statBlue: '#dceafd',
  statBlueBorder: '#a9cdf7',
  statRed: '#fbdcdc',
  statRedBorder: '#f0a8a8',
  rowTint: '#eef5ff',
  badgeRed: '#e05c5c',
  checkbox: '#2699fb',
};

function SkeletonBar({ width, height = 8, color }: { width: string; height?: number; color?: string }) {
  return <div className="rounded-[2px] shrink-0" style={{ width, height, backgroundColor: color ?? SKELETON.grey }} />;
}

function CheckboxSkeleton() {
  return <div className="w-[9px] h-[9px] rounded-[2px] border-[1.5px] shrink-0" style={{ borderColor: SKELETON.checkbox }} />;
}

function StatCardSkeleton({ color, borderColor }: { color?: string; borderColor?: string }) {
  return (
    <div
      className="rounded-[4px] border flex-1"
      style={{ height: 42, backgroundColor: color ?? '#ffffff', borderColor: borderColor ?? BORDER }}
    />
  );
}

function TableRowSkeleton({ index }: { index: number }) {
  return (
    <div className="flex items-center gap-[8px] px-[8px] py-[10px] shrink-0" style={{ backgroundColor: index % 2 === 0 ? SKELETON.rowTint : '#ffffff' }}>
      <CheckboxSkeleton />
      <SkeletonBar width="15%" />
      <SkeletonBar width="17%" height={11} color={SKELETON.badgeRed} />
      <SkeletonBar width="15%" />
      <div className="w-[9px] h-[9px] rounded-[2px] border shrink-0" style={{ borderColor: SKELETON.grey }} />
      <div className="flex flex-col gap-[3px]" style={{ width: '24%' }}>
        <SkeletonBar width="100%" />
        <SkeletonBar width="45%" height={6} />
      </div>
      <div style={{ width: '19%' }} />
    </div>
  );
}

function ScreenSkeleton({
  effectiveFormat,
  title,
  body,
  color,
  dismissible,
  hasCta,
  ctaLabel,
}: {
  effectiveFormat: DisplayFormat;
  title: string;
  body: string;
  color: string;
  dismissible: boolean;
  hasCta: boolean;
  ctaLabel: string;
}) {
  return (
    <div className="relative w-full h-full bg-white rounded-[8px] border overflow-hidden flex" style={{ borderColor: BORDER }}>
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Topbar skeleton */}
        <div className="h-[36px] border-b flex items-center gap-[10px] px-[12px] shrink-0" style={{ borderColor: BORDER }}>
          <div className="w-[14px] h-[14px] rounded-[3px]" style={{ backgroundColor: SKELETON.grey }} />
          <div className="h-[16px] rounded-[4px] w-[180px]" style={{ backgroundColor: SKELETON.greyLight }} />
          <div className="ml-auto w-[18px] h-[18px] rounded-full" style={{ backgroundColor: SKELETON.avatar }} />
        </div>
        <div className="flex flex-1 min-h-0">
          {/* Sidebar skeleton */}
          <div className="w-[140px] border-r flex flex-col gap-[10px] p-[10px] shrink-0" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-[6px]">
              <div className="w-[20px] h-[20px] rounded-[5px] shrink-0" style={{ backgroundColor: SKELETON.avatar }} />
              <SkeletonBar width="60%" height={8} />
            </div>
            <div className="flex flex-col gap-[7px] mt-[4px]">
              {Array.from({ length: 9 }).map((_, i) => {
                const active = i === 1 || i === 2;
                return (
                  <div
                    key={i}
                    className="rounded-[2px] flex items-center relative"
                    style={{ backgroundColor: active ? '#e2e2e2' : 'transparent', height: 10 }}
                  >
                    {i === 2 && <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: PRIMARY }} />}
                    <SkeletonBar width={i === 2 ? '85%' : i % 3 === 0 ? '95%' : '70%'} height={7} color={active ? '#d4d4d4' : SKELETON.greyLight} />
                  </div>
                );
              })}
            </div>
          </div>
          {/* Main content skeleton */}
          <div className="flex-1 min-w-0 p-[12px] flex flex-col gap-[10px] overflow-hidden">
            {/* Stat cards */}
            <div className="flex gap-[8px]">
              <StatCardSkeleton color={SKELETON.statBlue} borderColor={SKELETON.statBlueBorder} />
              <StatCardSkeleton color={SKELETON.statRed} borderColor={SKELETON.statRedBorder} />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
            <div className="flex gap-[8px]">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <div className="flex-1" style={{ visibility: 'hidden' }} />
              <div className="flex-1" style={{ visibility: 'hidden' }} />
              <div className="flex-1" style={{ visibility: 'hidden' }} />
            </div>
            {/* Toolbar */}
            <div className="flex items-center gap-[8px] mt-[2px]">
              <div className="h-[18px] rounded-[4px] border flex-1 max-w-[160px]" style={{ borderColor: BORDER }} />
              <div className="h-[12px] w-[54px] rounded-[3px]" style={{ backgroundColor: SKELETON.greyLight }} />
              <div className="h-[12px] w-[54px] rounded-[3px]" style={{ backgroundColor: SKELETON.greyLight }} />
            </div>
            {/* Table */}
            <div className="rounded-[4px] border flex-1 min-h-0 overflow-hidden flex flex-col" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-[8px] px-[8px] py-[8px] border-b shrink-0" style={{ borderColor: BORDER }}>
                <CheckboxSkeleton />
                <SkeletonBar width="15%" height={6} />
                <SkeletonBar width="17%" height={6} />
                <SkeletonBar width="15%" height={6} />
                <SkeletonBar width="9%" height={6} />
                <SkeletonBar width="24%" height={6} />
                <SkeletonBar width="19%" height={6} />
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification rail skeleton */}
      <div className="w-[28px] border-l flex flex-col items-center gap-[10px] py-[10px] shrink-0" style={{ borderColor: BORDER }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[14px] h-[14px] rounded-[3px]" style={{ backgroundColor: SKELETON.greyLight }} />
        ))}
      </div>

      {effectiveFormat === 'Overlay' && (
        <div className="absolute inset-0 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
          <OverlayPreview title={title} body={body} dismissible={dismissible} hasCta={hasCta} ctaLabel={ctaLabel} rounded={false} />
        </div>
      )}

      {effectiveFormat === 'Banner' && (
        <div className="absolute left-0 right-0 bottom-0">
          <BannerPreview body={body} color={color} dismissible={dismissible} hasCta={hasCta} ctaLabel={ctaLabel} rounded={false} />
        </div>
      )}
    </div>
  );
}

export default function ComposeMessageOverlay({ onClose, onMessageCreated, onSaveAsDraft, initialData }: {
  onClose: () => void;
  onMessageCreated?: (data: { title: string; messageType: string; statesOrAgencies: string[]; searchMode: string; startDate: string; endDate: string; }) => void;
  onSaveAsDraft?: (data: { title: string; messageType: string; statesOrAgencies: string[]; searchMode: string; startDate: string; endDate: string; }) => void;
  initialData?: { title?: string; messageType?: string; startDate?: string; endDate?: string; };
}) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [body, setBody] = useState('');
  const [reason, setReason] = useState('');
  const [messageType, setMessageType] = useState<MessageType>((initialData?.messageType as MessageType) ?? '');
  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>('');
  const [placement, setPlacement] = useState<Placement>('');
  const [featurePath, setFeaturePath] = useState('');
  const [hasCta, setHasCta] = useState(false);
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaDestination, setCtaDestination] = useState('');

  const [searchMode, setSearchMode] = useState<SearchMode>('Agency');
  const [statesOrAgencies, setStatesOrAgencies] = useState<string[]>([]);
  const [packages, setPackages] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);

  const [startDate, setStartDate] = useState(initialData?.startDate ?? '');
  const [endDate, setEndDate] = useState(initialData?.endDate ?? '');
  const [frequency, setFrequency] = useState('');
  const [dismissible, setDismissible] = useState<Dismissible>('Dismissible');
  const [pushNotification, setPushNotification] = useState(false);
  const [previewTab, setPreviewTab] = useState<'banner' | 'screen'>('banner');

  const isAnnouncement = messageType === 'Announcement';
  const isEmergency = messageType === 'Emergency';

  let matching = searchMode === 'State'
    ? (statesOrAgencies.length > 0 ? AGENCIES.filter((a) => statesOrAgencies.includes(a.state)) : [])
    : (statesOrAgencies.length > 0 ? AGENCIES.filter((a) => statesOrAgencies.includes(a.name)) : []);
  if (packages.length > 0) matching = matching.filter((a) => packages.includes(a.package));
  if (roles.length > 0) matching = matching.filter((a) => roles.includes(a.role));
  const audienceCount = matching.length;

  const isFormValid =
    title.trim() !== '' &&
    body.trim() !== '' &&
    reason.trim() !== '' &&
    messageType !== '' &&
    startDate !== '' &&
    frequency !== '' &&
    statesOrAgencies.length > 0 &&
    (messageType !== 'Announcement' || (
      displayFormat !== '' &&
      placement !== '' &&
      (placement !== 'Feature Specific' || featurePath !== '')
    ));

  const handleSearchModeChange = (v: string) => {
    setSearchMode(v as SearchMode);
    setStatesOrAgencies([]);
  };

  const handleSubmit = () => {
    onMessageCreated?.({ title, messageType, statesOrAgencies, searchMode, startDate, endDate });
    onClose();
  };

  const handleSaveAsDraft = () => {
    onSaveAsDraft?.({ title, messageType, statesOrAgencies, searchMode, startDate, endDate });
    onClose();
  };

  const effectiveFormat: DisplayFormat = isEmergency ? 'Banner' : isAnnouncement ? displayFormat : '';
  const effectiveDismissible = isEmergency ? false : dismissible === 'Dismissible';
  const hasPreview = effectiveFormat !== '';

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <style>{`.date-input-no-native-icon::-webkit-calendar-picker-indicator { opacity: 0; position: absolute; right: 0; width: 24px; height: 100%; cursor: pointer; }`}</style>

      {/* Top header bar */}
      <div className="flex items-center justify-between h-[56px] px-[24px] border-b shrink-0" style={{ borderColor: BORDER }}>
        <h2 className="font-['Montserrat',sans-serif] font-semibold text-[16px] text-black">New Message</h2>
        <button type="button" onClick={onClose} className="cursor-pointer flex items-center">
          <IoIosClose size={26} color="#000000" />
        </button>
      </div>

      {/* Body: left form + right preview */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT — scrollable form, fixed 399px */}
        <div style={{ width: '399px', minWidth: '399px', maxWidth: '399px', overflowY: 'auto', borderRight: `1px solid ${BORDER}` }} className="p-[24px] flex flex-col gap-[16px]">

          {/* Message Basics card */}
          <div className="bg-white rounded-[8px] border flex flex-col gap-[16px] p-[20px]" style={{ borderColor: BORDER }}>
            <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">Message Basics</p>
            <TextField label="Message Title *" value={title} onChange={setTitle} placeholder="Type message title" />
            <TextAreaField label="Message Body *" value={body} onChange={setBody} placeholder="Type the message body" />
            <TextField label="Message Reason *" value={reason} onChange={setReason} placeholder="Why is this message being sent?" />
            <SelectField label="Message Type *" value={messageType} onChange={(v) => setMessageType(v as MessageType)} placeholder="Select message type..." options={['Announcement', 'Emergency']} />
            {isEmergency && (
              <p className="font-['Montserrat',sans-serif] font-normal text-[12px] text-[#717182]">
                Emergency messages are always sent as a non-dismissible, app-wide banner.
              </p>
            )}
            {isAnnouncement && (
              <>
                <SelectField label="Display Format *" value={displayFormat} onChange={(v) => setDisplayFormat(v as DisplayFormat)} placeholder="Select display format..." options={['Overlay', 'Banner']} />
                <SelectField label="Placement *" value={placement} onChange={(v) => setPlacement(v as Placement)} placeholder="Select placement..." options={['App-wide', 'Feature Specific']} />
                {placement === 'Feature Specific' && (
                  <SelectField label="Feature Path *" value={featurePath} onChange={setFeaturePath} placeholder="Select a feature..." options={FEATURE_PATHS} />
                )}
              </>
            )}
          </div>

          {/* Date & Time card */}
          <div className="bg-white rounded-[8px] border flex flex-col gap-[16px] p-[20px]" style={{ borderColor: BORDER }}>
            <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">Date &amp; Time</p>
            <DateField label="Start Date *" value={startDate} onChange={setStartDate} />
            <DateField label="End Date" value={endDate} onChange={setEndDate} />
            <SelectField label="Frequency *" value={frequency} onChange={setFrequency} placeholder="Select frequency..." options={FREQUENCY_OPTIONS} />
          </div>

          {/* Audience card */}
          <div className="bg-white rounded-[8px] border flex flex-col gap-[16px] p-[20px]" style={{ borderColor: BORDER }}>
            <div className="flex flex-wrap items-center justify-between gap-x-[8px] gap-y-[2px]">
              <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">Audience</p>
              <span className="font-['Montserrat',sans-serif] font-medium text-[12px] shrink-0" style={{ color: NAVY }}>
                {audienceCount} {audienceCount === 1 ? 'agency' : 'agencies'} will see this message
              </span>
            </div>
            <RadioField label="Search By *" value={searchMode} onChange={handleSearchModeChange} options={['Agency', 'State']} />
            <MultiSelectField
              label={searchMode === 'Agency' ? 'Agency *' : 'State *'}
              values={statesOrAgencies}
              onChange={setStatesOrAgencies}
              placeholder={searchMode === 'State' ? 'Select states...' : 'Select agencies...'}
              options={searchMode === 'Agency' ? AGENCIES.map((a) => a.name) : STATES}
            />
            <MultiSelectField label="Package" values={packages} onChange={setPackages} placeholder="Select packages..." options={PACKAGES} />
            <MultiSelectField label="Role" values={roles} onChange={setRoles} placeholder="Select roles..." options={ROLES} />
          </div>

          {/* Display Settings card */}
          <div className="bg-white rounded-[8px] border flex flex-col gap-[16px] p-[20px]" style={{ borderColor: BORDER }}>
            <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">Display Settings</p>
            <RadioField label="Display" value={dismissible} onChange={(v) => setDismissible(v as Dismissible)} options={['Dismissible', 'Non-Dismissible']} />
            <CtaBox
              checked={hasCta}
              onChange={setHasCta}
              label={ctaLabel}
              destination={ctaDestination}
              onLabelChange={setCtaLabel}
              onDestinationChange={setCtaDestination}
            />
            {isEmergency && <ToggleRow label="Also send as push notification" checked={pushNotification} onChange={setPushNotification} />}
          </div>
        </div>

        {/* RIGHT — preview + actions */}
        <div style={{ flex: 1, minWidth: 0, backgroundColor: '#f8f8f8' }} className="flex flex-col p-[24px] gap-[16px]">
          {/* Preview card */}
          <div className="bg-white rounded-[8px] border flex flex-col flex-1 overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="px-[16px] py-[12px] border-b flex items-center justify-between gap-[12px] shrink-0" style={{ borderColor: BORDER }}>
              <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] text-black">Message Preview</p>
              <div className="flex items-center gap-[2px] bg-[#f0f0f0] rounded-[6px] p-[2px] shrink-0">
                {(['banner', 'screen'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setPreviewTab(tab)}
                    className="rounded-[4px] px-[10px] py-[5px] font-['Montserrat',sans-serif] font-medium text-[12px] cursor-pointer whitespace-nowrap"
                    style={{
                      backgroundColor: previewTab === tab ? NAVY : 'transparent',
                      color: previewTab === tab ? '#ffffff' : LABEL_GREY,
                    }}
                  >
                    {tab === 'banner' ? 'Just the banner' : 'With screen'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col p-[16px] gap-[12px]">
              {previewTab === 'screen' ? (
                hasPreview ? (
                  <div className="flex-1 min-h-0">
                    <ScreenSkeleton
                      effectiveFormat={effectiveFormat}
                      title={title}
                      body={body}
                      color={isEmergency ? '#d4183d' : NAVY}
                      dismissible={effectiveDismissible}
                      hasCta={hasCta}
                      ctaLabel={ctaLabel}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-[10px] py-[40px]">
                    <MdPreview size={40} color="#d1d3d4" />
                    <p className="font-['Montserrat',sans-serif] font-normal text-[12px] text-[#b8b8b8] text-center max-w-[220px]">
                      {messageType === ''
                        ? 'Preview will appear here once you select a message type.'
                        : 'Preview will appear here once you select a display format.'}
                    </p>
                  </div>
                )
              ) : hasPreview ? (
                <>
                  <div
                    className="flex-1 min-h-0 flex justify-center"
                    style={{ alignItems: effectiveFormat === 'Overlay' ? 'stretch' : 'center' }}
                  >
                    {effectiveFormat === 'Banner' && (
                      <div className="w-full self-center">
                        <BannerPreview
                          body={body}
                          color={isEmergency ? '#d4183d' : NAVY}
                          dismissible={effectiveDismissible}
                          hasCta={hasCta}
                          ctaLabel={ctaLabel}
                        />
                      </div>
                    )}
                    {effectiveFormat === 'Overlay' && (
                      <OverlayPreview
                        title={title}
                        body={body}
                        dismissible={effectiveDismissible}
                        hasCta={hasCta}
                        ctaLabel={ctaLabel}
                      />
                    )}
                  </div>
                  {/* Meta */}
                  <div className="flex flex-wrap gap-[8px] shrink-0">
                    {startDate && <span className="text-[11px] font-['Montserrat',sans-serif] text-[#8b8b8b]">Starts {startDate}</span>}
                    {audienceCount > 0 && <span className="text-[11px] font-['Montserrat',sans-serif] text-[#8b8b8b]">• {audienceCount} {audienceCount === 1 ? 'agency' : 'agencies'}</span>}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-[10px] py-[40px]">
                  <MdPreview size={40} color="#d1d3d4" />
                  <p className="font-['Montserrat',sans-serif] font-normal text-[12px] text-[#b8b8b8] text-center max-w-[220px]">
                    {messageType === ''
                      ? 'Preview will appear here once you select a message type.'
                      : 'Preview will appear here once you select a display format.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons below preview */}
          <div className="flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="font-['Montserrat',sans-serif] font-medium text-[13px] capitalize cursor-pointer"
              style={{ color: NAVY }}
            >
              Cancel
            </button>
            <div className="flex items-center gap-[8px]">
              <button
                type="button"
                onClick={handleSaveAsDraft}
                className="rounded-[8px] px-[12px] h-[32px] flex items-center gap-[4px] border cursor-pointer"
                style={{ backgroundColor: '#e8f4ff', borderColor: PRIMARY, borderWidth: '1px' }}
              >
                <span className="font-['Montserrat',sans-serif] font-medium text-[13px] uppercase" style={{ color: PRIMARY }}>
                  Save as Draft
                </span>
              </button>
              <button
                type="button"
                onClick={isFormValid ? handleSubmit : undefined}
                disabled={!isFormValid}
                className="rounded-[8px] px-[16px] h-[32px] flex items-center gap-[8px]"
                style={{
                  backgroundColor: isFormValid ? PRIMARY : '#e1e3e4',
                  cursor: isFormValid ? 'pointer' : 'not-allowed',
                }}
              >
                <MdSend size={17} color={isFormValid ? 'white' : '#a1a3a4'} />
                <span
                  className="font-['Montserrat',sans-serif] font-medium text-[13px] uppercase"
                  style={{ color: isFormValid ? 'white' : '#a1a3a4' }}
                >
                  Send for Approval
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
