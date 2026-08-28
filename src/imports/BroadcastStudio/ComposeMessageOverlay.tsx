import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useIsBelowDesktop } from './useIsPhone';
import { IoIosClose } from 'react-icons/io';
import { IoMdArrowDropdown } from 'react-icons/io';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { BiCalendarEvent } from 'react-icons/bi';
import { MdOutlinedFlag, MdCheck, MdClose, MdPreview, MdSend, MdDesktopWindows, MdPhoneIphone, MdBusiness, MdManageAccounts, MdApps, MdOutlineSaveAlt, MdModeEditOutline, MdPersonOutline, MdUndo } from 'react-icons/md';
import { BsPersonBadgeFill } from 'react-icons/bs';
import { FiExternalLink } from 'react-icons/fi';
import { FaRegCheckCircle, FaRegTimesCircle } from 'react-icons/fa';
import { GrAnnounce } from 'react-icons/gr';
import { RiDeleteBinLine, RiCheckLine, RiErrorWarningLine } from 'react-icons/ri';

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
  /** Feature flags enabled for this agency — an agency can have several. */
  featureFlags: string[];
  /**
   * How many of this agency's people can actually receive a push: app
   * installed and notifications allowed. Always <= employeeCount, and the gap
   * varies by agency, so it is stored rather than derived from a flat rate.
   */
  pushEnabledCount: number;
  employeeCount: number;
}

const AGENCIES: Agency[] = [
  { id: '1', name: 'Sunrise Home Care', state: 'California', package: 'Billing Executive', role: 'Owner', featureFlags: ['Smart Billing', 'Advanced Scheduling', 'Family Portal'], pushEnabledCount: 910, employeeCount: 1200 },
  { id: '2', name: 'Golden Gate Health Partners', state: 'California', package: 'Billing', role: 'Admin', featureFlags: ['Smart Billing', 'eMAR'], pushEnabledCount: 244, employeeCount: 340 },
  { id: '3', name: 'Lone Star Caregivers', state: 'Texas', package: 'Advantage', role: 'Care Coordinator', featureFlags: ['Advanced Scheduling'], pushEnabledCount: 121, employeeCount: 210 },
  { id: '4', name: 'Austin Family Support', state: 'Texas', package: 'Billing', role: 'Admin', featureFlags: ['Smart Billing', 'Family Portal'], pushEnabledCount: 143, employeeCount: 180 },
  { id: '5', name: 'Empire Homecare Group', state: 'New York', package: 'Billing Executive', role: 'Owner', featureFlags: ['Smart Billing', 'Advanced Scheduling', 'eMAR', 'Family Portal'], pushEnabledCount: 602, employeeCount: 950 },
  { id: '6', name: 'Brooklyn Senior Services', state: 'New York', package: 'Advantage', role: 'Field Staff', featureFlags: ['eMAR'], pushEnabledCount: 198, employeeCount: 275 },
  { id: '7', name: 'Sunshine State Care', state: 'Florida', package: 'Billing', role: 'Care Coordinator', featureFlags: ['Advanced Scheduling', 'Family Portal'], pushEnabledCount: 351, employeeCount: 410 },
  { id: '8', name: 'Everglades Health Network', state: 'Florida', package: 'Advantage', role: 'Admin', featureFlags: ['Smart Billing'], pushEnabledCount: 0, employeeCount: 165 },
  { id: '9', name: 'Cascade Caregivers', state: 'Washington', package: 'Billing Executive', role: 'Owner', featureFlags: ['Advanced Scheduling', 'eMAR'], pushEnabledCount: 404, employeeCount: 530 },
  { id: '10', name: 'Windy City Homecare', state: 'Illinois', package: 'Billing', role: 'Field Staff', featureFlags: ['Family Portal'], pushEnabledCount: 166, employeeCount: 295 },
];

const STATES = Array.from(new Set(AGENCIES.map((a) => a.state)));
const PACKAGES = Array.from(new Set(AGENCIES.map((a) => a.package)));
const ROLES = Array.from(new Set(AGENCIES.map((a) => a.role)));
const FEATURE_FLAGS = Array.from(new Set(AGENCIES.flatMap((a) => a.featureFlags))).sort();

/**
 * Recipient count = number of employees within the selected agencies/states,
 * further filtered down by package and role (an intersection over AGENCIES,
 * not a count of selected filter chips).
 */
export type AudienceSelection = {
  agencies?: string[];
  states?: string[];
  packages?: string[];
  roles?: string[];
  featureFlags?: string[];
};

/**
 * Every facet is independent — none of them require another to be set first.
 * A facet with no selection is "no constraint" and simply doesn't filter;
 * facets that do have a selection AND together. The only case that targets
 * nobody is every facet being empty at once (nothing selected anywhere).
 */
function getMatchingAgencies({ agencies = [], states = [], packages = [], roles = [], featureFlags = [] }: AudienceSelection): Agency[] {
  if (agencies.length === 0 && states.length === 0 && packages.length === 0 && roles.length === 0 && featureFlags.length === 0) return [];
  let matching = AGENCIES;
  if (agencies.length > 0) matching = matching.filter((a) => agencies.includes(a.name));
  if (states.length > 0) matching = matching.filter((a) => states.includes(a.state));
  if (packages.length > 0) matching = matching.filter((a) => packages.includes(a.package));
  if (roles.length > 0) matching = matching.filter((a) => roles.includes(a.role));
  if (featureFlags.length > 0) matching = matching.filter((a) => featureFlags.some((f) => a.featureFlags.includes(f)));
  return matching;
}

export function getAudienceRecipientCount(selection: AudienceSelection): number {
  return getMatchingAgencies(selection).reduce((sum, a) => sum + a.employeeCount, 0);
}

/**
 * How many of the selected audience can actually be reached by push. Always a
 * subset of the recipient count — the rest see the message in-app only.
 */
export function getAudiencePushCount(selection: AudienceSelection): number {
  return getMatchingAgencies(selection).reduce((sum, a) => sum + a.pushEnabledCount, 0);
}
const STATE_ABBR: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY',
};
const STATE_BG_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF8C42', '#A78BFA', '#34D399', '#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6'];
function stateColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return STATE_BG_COLORS[Math.abs(h) % STATE_BG_COLORS.length];
}

const ROLE_SUBTEXT: Record<string, string> = {
  'Owner': 'Full access to all agency features',
  'Admin': 'Manage agency settings and staff',
  'Care Coordinator': 'Schedule and coordinate care',
  'Field Staff': 'Caregiver and field worker',
};

// Mirrors the app's main nav, so a feature-specific message targets a real destination.
const FEATURE_PATHS = ['Dashboard', 'Operations', 'Scheduling', 'Payroll', 'Billing', 'Clients', 'Employees', 'Smart Billing', 'Reporting', 'Fax', 'Agency Management', 'My Account'];
const DEPARTMENT_OPTIONS = ['Admin Services', 'Billing', 'Customer Success', 'Marketing', 'Product', 'Support'];
const CATEGORY_OPTIONS = ['Billing Notice', 'Emergency', 'New Release', 'Upsell', 'Custom'];
// Stand-in for real per-user auth: this prototype has no individual accounts,
// only the org user shown in the sidebar, so Author auto-populates with that
// same name rather than a selectable/editable value.
const CURRENT_USER_NAME = 'John Doe';
const MESSAGE_COLOR_OPTIONS = ['#DA4040', '#27496D'];
// Layout toggle: false = form left / preview right (default). true = preview left / form right.
// Kept as a flag (not deleted) so both layouts stay available to switch back to.
const PREVIEW_ON_LEFT = false;

/* -- Design tokens copied from the GEOH "Overlay - New Message" Figma frame -- */
const BORDER = '#e5e5e5';
const LABEL_GREY = '#646464';
/** Figma Text.Light — the subtext colour under a bounded-card label. */
const TEXT_LIGHT = '#8B8B8B';
const NAVY = '#334c6d';
const PRIMARY = '#2699fb';
/** Core/Primary/Background — the tinted blue behind primary-flavoured rows. */
const PRIMARY_BG = '#E8F4FF';
const ICON_LIGHT = '#8a8a8a';
const PLACEHOLDER = '#b8b8b8';

function SectionHeader({ children }: { children: string }) {
  return <p className="font-['Montserrat',sans-serif] font-medium text-[14px] leading-[20px] text-black w-full">{children}</p>;
}

function FieldShell({ label, height, disabled, open, subtext, children }: { label: string; height?: number; disabled?: boolean; open?: boolean; subtext?: string; children: React.ReactNode }) {
  return (
    <div
      className={`border px-[12px] py-[8px] flex flex-col gap-[8px] justify-center w-full ${open ? 'rounded-t-[4px]' : 'rounded-[4px]'}`}
      style={{ borderColor: BORDER, borderWidth: '1px', borderBottomWidth: open ? 0 : 1, minHeight: height ?? 70, backgroundColor: disabled ? '#f2f2f2' : 'white' }}
    >
      <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px]" style={{ color: disabled ? '#585858' : LABEL_GREY }}>
        {label}
      </p>
      {children}
      {subtext && (
        <p className="font-['Montserrat',sans-serif] font-normal text-[12px] leading-[17px] mt-[4px]" style={{ color: '#B8B8B8' }}>
          {subtext}
        </p>
      )}
    </div>
  );
}

// A single-line-looking field that's actually a growing textarea underneath:
// a plain <input> can only truncate or scroll a long value out of view,
// never wrap it, so anything with a real length limit (a title, a label)
// needs this instead. Enter is suppressed — it still reads as "one field,"
// just one that can wrap onto a second line rather than hide the overflow.
export function TextField({ label, value, onChange, placeholder, disabled, maxLength }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; disabled?: boolean; maxLength?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <FieldShell label={label} disabled={disabled}>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={1}
        className="font-['Montserrat',sans-serif] font-normal text-[13px] placeholder:text-[#b8b8b8] outline-none bg-transparent w-full resize-none overflow-hidden"
        style={{ color: '#000000' }}
      />
    </FieldShell>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, disabled, maxLength }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; disabled?: boolean; maxLength?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <FieldShell label={label} disabled={disabled}>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={1}
        className="font-['Montserrat',sans-serif] font-normal text-[13px] placeholder:text-[#b8b8b8] outline-none bg-transparent w-full resize-none overflow-hidden"
        style={{ color: '#000000' }}
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
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
  disabled?: boolean;
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
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex flex-col gap-[8px] justify-center px-[8px] py-[12px] text-left cursor-pointer border border-[#e5e5e5] ${
          open ? 'rounded-tl-[4px] rounded-tr-[4px]' : 'rounded-[4px]'
        }`}
        style={{ backgroundColor: disabled ? '#f2f2f2' : 'white' }}
      >
        <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px]" style={{ color: disabled ? '#585858' : LABEL_GREY }}>
          {label}
        </p>
        <div className="flex items-center justify-between w-full">
          <span
            className="font-['Montserrat',sans-serif] font-normal text-[13px]"
            style={{ color: value ? '#000000' : PLACEHOLDER }}
          >
            {value || placeholder}
          </span>
          {!disabled && (
            <IoMdArrowDropdown
              size={20}
              color="#27496D"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}
            />
          )}
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

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_OF_WEEK_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function dateToISO(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function isSameDay(a: Date | null, b: Date | null) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function DateField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;

  const displayValue = value
    ? (() => { const [yyyy, mm, dd] = value.split('-'); return `${mm} / ${dd} / ${yyyy}`; })()
    : null;

  const openCalendar = () => {
    const base = selectedDate ?? today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setOpen(true);
  };

  const changeMonth = (delta: number) => {
    let y = viewYear;
    let m = viewMonth + delta;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewYear(y);
    setViewMonth(m);
  };

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: Array<{ day: number; date: Date; inMonth: boolean }> = [];
  for (let i = 0; i < startWeekday; i++) {
    const day = daysInPrevMonth - startWeekday + 1 + i;
    cells.push({ day, date: new Date(viewYear, viewMonth - 1, day), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(viewYear, viewMonth, d), inMonth: true });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ day: nextDay, date: new Date(viewYear, viewMonth + 1, nextDay), inMonth: false });
    nextDay++;
  }

  const calendarOpen = open && !disabled;

  return (
    <div className="relative w-full" ref={containerRef}>
      <FieldShell label={label} disabled={disabled} open={calendarOpen}>
        <div className="flex items-center justify-between w-full gap-[8px]">
          <span
            className="font-['Montserrat',sans-serif] font-normal text-[13px] select-none"
            style={{ color: value ? '#000000' : '#B8B8B8' }}
          >
            {displayValue ?? '00 / 00 / 0000'}
          </span>
          {!disabled && (
            <div className="flex items-center gap-[8px] shrink-0">
              {value && (
                <button type="button" onClick={() => onChange('')} className="flex items-center justify-center cursor-pointer">
                  <IoIosClose size={22} color="#27496D" />
                </button>
              )}
              <button
                type="button"
                onClick={openCalendar}
                className="flex items-center justify-center cursor-pointer"
                style={{ width: 22, height: 22 }}
              >
                <BiCalendarEvent size={16} color="#27496D" />
              </button>
            </div>
          )}
        </div>
      </FieldShell>

      {calendarOpen && (
          <div
            className="absolute top-full left-0 w-full bg-white rounded-b-[4px] border shadow-lg z-50 overflow-hidden"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center justify-between px-[16px] h-[45px]">
              <p className="font-['Montserrat',sans-serif] font-medium text-[14px] text-black">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </p>
              <div className="flex items-center gap-[14px]">
                <BiCalendarEvent size={16} color="#27496D" />
                <button type="button" onClick={() => changeMonth(-1)} className="cursor-pointer flex items-center">
                  <IoIosArrowBack size={16} color="#27496D" />
                </button>
                <button type="button" onClick={() => changeMonth(1)} className="cursor-pointer flex items-center">
                  <IoIosArrowForward size={16} color="#27496D" />
                </button>
              </div>
            </div>
            {/* 237px grid: 33px weekday row + 6 day rows at 34px, matching the design-system spec. */}
            <div className="grid grid-cols-7 border-t [&>*:nth-child(7n)]:border-r-0 [&>*:nth-last-child(-n+7)]:border-b-0" style={{ borderColor: BORDER }}>
              {DAY_OF_WEEK_LABELS.map((d, i) => (
                <div
                  key={`wd-${i}`}
                  className="flex items-center justify-center h-[33px] border-r border-b"
                  style={{ borderColor: BORDER, backgroundColor: '#F8F8F8' }}
                >
                  <span className="font-['Montserrat',sans-serif] font-semibold text-[13px]" style={{ color: '#050505' }}>{d}</span>
                </div>
              ))}
              {cells.map((cell, i) => {
                const isToday = isSameDay(cell.date, today);
                const isSelected = isSameDay(cell.date, selectedDate);
                // Only today and future dates are selectable — a broadcast can't be scheduled backwards.
                const isDisabledCell = cell.date < today;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isDisabledCell}
                    onClick={() => { onChange(dateToISO(cell.date)); setOpen(false); }}
                    className={`h-[34px] px-[3px] py-[2px] border-r border-b ${isDisabledCell ? 'cursor-default' : 'cursor-pointer'}`}
                    style={{ borderColor: BORDER, backgroundColor: cell.inMonth ? '#FFFFFF' : '#F2F2F2' }}
                  >
                    <span
                      className={`flex items-center justify-center w-full h-full rounded-[8px] border font-['Montserrat',sans-serif] text-[13px] ${
                        isSelected || isDisabledCell ? 'border-transparent' : 'border-transparent hover:bg-[#E8F4FF] hover:border-[#2699FB]/[0.6667]'
                      }`}
                      style={{
                        fontWeight: isToday || isSelected ? 700 : 400,
                        color: isSelected ? '#FFFFFF' : isDisabledCell ? '#D1D3D4' : '#27496D',
                        backgroundColor: isSelected ? '#2699FB' : 'transparent',
                        borderColor: isSelected ? 'rgba(38,153,251,0.6667)' : undefined,
                      }}
                    >
                      {cell.day}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
      )}
    </div>
  );
}

type MultiSelectVariant = 'agency' | 'state' | 'package' | 'role' | 'feature' | 'default';

function OptionIcon({ variant, name }: { variant: MultiSelectVariant; name: string }) {
  const base = 'size-[20px] rounded-full flex items-center justify-center shrink-0';
  if (variant === 'agency') return <span className={base} style={{ backgroundColor: '#2699FB' }}><MdBusiness size={11} color="white" /></span>;
  if (variant === 'role') return <span className={base} style={{ backgroundColor: '#2ECC71' }}><BsPersonBadgeFill size={11} color="white" /></span>;
  if (variant === 'package') return <span className={base} style={{ backgroundColor: '#2699FB' }}><MdApps size={11} color="white" /></span>;
  if (variant === 'feature') return <span className={base} style={{ backgroundColor: '#2699FB' }}><MdOutlinedFlag size={11} color="white" /></span>;
  if (variant === 'state') {
    const abbr = (STATE_ABBR[name] ?? name.slice(0, 2)).toUpperCase();
    return <span className={`${base} font-['Montserrat',sans-serif] font-bold text-[8px] text-white`} style={{ backgroundColor: stateColor(name) }}>{abbr}</span>;
  }
  return null;
}

function MultiSelectField({
  label,
  values,
  onChange,
  placeholder,
  options,
  caption,
  disabled,
  variant = 'default',
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  options: string[];
  caption?: string;
  disabled?: boolean;
  variant?: MultiSelectVariant;
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

  const hasIcon = variant !== 'default';

  return (
    <div className="relative w-full" ref={ref}>
      <button type="button" onClick={() => !disabled && setOpen((o) => !o)} className="w-full text-left" disabled={disabled}>
        <FieldShell label={label} disabled={disabled} open={open}>
          <div className="flex flex-col gap-[6px]">
            {values.length > 0 && (
              <div className="flex flex-col gap-[6px] items-start">
                {values.map((v) => (
                  <span
                    key={v}
                    className="border rounded-full pl-[5px] pr-[8px] h-[29px] flex items-center gap-[5px]"
                    style={{ borderColor: '#E5E5E5', backgroundColor: '#F2F2F2' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hasIcon && <OptionIcon variant={variant} name={v} />}
                    <span className="font-['Montserrat',sans-serif] font-medium text-[12px] text-black">{v}</span>
                    {!disabled && (
                      <span role="button" onClick={(e) => { e.stopPropagation(); toggle(v); }} className="cursor-pointer flex items-center">
                        <IoIosClose size={16} color="#27496D" />
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-['Montserrat',sans-serif] font-normal text-[13px]" style={{ color: PLACEHOLDER }}>
                {placeholder}
              </span>
              {!disabled && <IoMdArrowDropdown className="shrink-0" size={20} color="#27496D" />}
            </div>
          </div>
        </FieldShell>
      </button>
      {caption && (
        <p className="font-['Montserrat',sans-serif] font-medium text-[12px] mt-[6px]" style={{ color: NAVY }}>
          {caption}
        </p>
      )}
      {open && (
        <div className="absolute z-10 top-full left-0 w-full bg-white border rounded-b-[4px] shadow-lg" style={{ borderColor: BORDER }}>
          <div className="max-h-[220px] overflow-y-auto">
            {options.filter((opt) => !values.includes(opt)).map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={(e) => { e.stopPropagation(); toggle(opt); setOpen(false); }}
                className={`w-full flex items-center gap-[10px] px-[12px] ${variant === 'role' ? 'h-[44px]' : 'h-[40px]'} text-left cursor-pointer`}
                style={{ backgroundColor: 'white' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#EFEFEF'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white'; }}
              >
                {hasIcon && <OptionIcon variant={variant} name={opt} />}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-['Montserrat',sans-serif] font-medium text-[12px] text-black leading-[17px]">{opt}</span>
                  {variant === 'role' && ROLE_SUBTEXT[opt] && (
                    <span className="font-['Montserrat',sans-serif] text-[12px] mt-[2px] leading-[17px]" style={{ color: PLACEHOLDER }}>{ROLE_SUBTEXT[opt]}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="border-t flex justify-end px-[12px] py-[8px]" style={{ borderColor: BORDER }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange([...options]); setOpen(false); }}
              className="font-['Montserrat',sans-serif] font-medium text-[13px] cursor-pointer"
              style={{ color: '#27496D' }}
            >
              SELECT ALL
            </button>
          </div>
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

function RadioField({ label, value, onChange, options, disabled, subtext }: { label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean; subtext?: string }) {
  return (
    <FieldShell label={label} disabled={disabled} subtext={subtext}>
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

function ColorField({ label, value, onChange, options, optionLabels, disabled, subtext }: { label: string; value: string; onChange: (v: string) => void; options: string[]; optionLabels?: Record<string, string>; disabled?: boolean; subtext?: string }) {
  return (
    <FieldShell label={label} disabled={disabled} subtext={subtext}>
      <div className="flex flex-col gap-[14px] w-full pb-[6px]">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="flex items-center gap-[8px] cursor-pointer"
          >
            <span
              className="flex items-center justify-center rounded-full shrink-0"
              style={{
                width: 26,
                height: 26,
                backgroundColor: opt,
                boxShadow: value === opt ? `0 0 0 2px #ffffff, 0 0 0 4px ${opt}` : 'none',
              }}
              aria-label={opt}
            >
              {value === opt && <MdCheck size={14} color="white" />}
            </span>
            {optionLabels?.[opt] && (
              <span className="font-['Montserrat',sans-serif] font-medium text-[12px] text-black">{optionLabels[opt]}</span>
            )}
          </button>
        ))}
      </div>
    </FieldShell>
  );
}

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className="w-[44px] h-[24px] rounded-full flex items-center px-[2px] transition-colors shrink-0"
      style={{ backgroundColor: checked ? PRIMARY : '#e0e0e0', justifyContent: checked ? 'flex-end' : 'flex-start', cursor: disabled ? 'default' : 'pointer' }}
    >
      <span className="size-[20px] rounded-full bg-white shadow" />
    </button>
  );
}

/**
 * A bounded checkbox card — same frame as ToggleRow, so the opt-in controls at
 * the foot of Display Settings read as one family. Carries a description line
 * because "Don't Show Again" alone does not say who it affects.
 */
function CheckboxCard({ title, description, checked, onChange, disabled }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className="border rounded-[4px] px-[12px] py-[16px] flex items-start gap-[10px] w-full text-left"
      style={{ borderColor: BORDER, backgroundColor: disabled ? '#f2f2f2' : '#fcfcfc', cursor: disabled ? 'default' : 'pointer' }}
    >
      <span
        className="flex items-center justify-center shrink-0 transition-colors mt-[1px]"
        style={{
          width: 18,
          height: 18,
          border: `1.5px solid ${checked ? PRIMARY : ICON_LIGHT}`,
          backgroundColor: 'white',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {checked && <RiCheckLine size={13} color={PRIMARY} />}
      </span>
      <span className="flex flex-col gap-[2px] min-w-0">
        <span className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px]" style={{ color: NAVY }}>{title}</span>
        <span className="font-['Montserrat',sans-serif] font-normal text-[12px] leading-[17px]" style={{ color: TEXT_LIGHT }}>{description}</span>
      </span>
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange, disabled }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="border rounded-[4px] px-[12px] py-[16px] flex items-center justify-between gap-[12px] w-full" style={{ borderColor: BORDER, backgroundColor: disabled ? '#f2f2f2' : '#fcfcfc' }}>
      <span className="flex flex-col gap-[2px] min-w-0">
        <span className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px]" style={{ color: NAVY }}>
          {label}
        </span>
        {description && (
          <span className="font-['Montserrat',sans-serif] font-normal text-[12px] leading-[17px]" style={{ color: TEXT_LIGHT }}>
            {description}
          </span>
        )}
      </span>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function CheckboxRow({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className="flex items-start gap-[8px] w-full"
      style={{ cursor: disabled ? 'default' : 'pointer' }}
    >
      <span
        className="flex items-center justify-center rounded-none shrink-0 transition-colors"
        style={{
          width: 18,
          height: 18,
          border: `1.5px solid ${checked ? PRIMARY : ICON_LIGHT}`,
          backgroundColor: 'white',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {checked && <RiCheckLine size={13} color={PRIMARY} />}
      </span>
      <span className="font-['Montserrat',sans-serif] font-medium text-[12px] text-black text-left">{label}</span>
    </button>
  );
}

function CtaBox({ checked, onChange, label, destination, onLabelChange, onDestinationChange, stopOnClick, onStopOnClickChange, disabled }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  destination: string;
  onLabelChange: (v: string) => void;
  onDestinationChange: (v: string) => void;
  stopOnClick: boolean;
  onStopOnClickChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="border rounded-[4px] px-[12px] py-[16px] flex flex-col gap-[16px] w-full" style={{ borderColor: BORDER, backgroundColor: disabled ? '#f2f2f2' : '#fcfcfc' }}>
      <div className="flex items-center justify-between w-full">
        <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px]" style={{ color: NAVY }}>
          Call To Action
        </p>
        <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
      </div>
      {checked && (
        <div className="flex flex-col gap-[16px] w-full">
          <TextAreaField label="Label *" value={label} onChange={onLabelChange} placeholder="Link text shown in banner & overlay" disabled={disabled} maxLength={255} />
          <TextField label="Destination URL *" value={destination} onChange={onDestinationChange} placeholder="https://..." disabled={disabled} />
          <CheckboxRow label="Stop showing the message once clicked" checked={stopOnClick} onChange={onStopOnClickChange} disabled={disabled} />
        </div>
      )}
    </div>
  );
}

function BannerPreview({
  body,
  color,
  dismissible,
  allowOptOut,
  hasCta,
  ctaLabel,
  rounded = true,
}: {
  body: string;
  color: string;
  dismissible: boolean;
  allowOptOut?: boolean;
  hasCta: boolean;
  ctaLabel: string;
  rounded?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-[6px] px-[16px] py-[12px] w-full ${rounded ? 'rounded-[6px]' : ''}`}
      style={{ backgroundColor: color }}
    >
    <div className="flex items-center gap-[16px] w-full">
      {dismissible && <div className="shrink-0" style={{ width: 18 }} />}
      {/* min-w-0 lets the flex item shrink below its content, and break-words
          splits a long unbroken string — without both, a single long "word"
          pushes the banner past the edge of the screen it sits in. */}
      <p className="font-['Montserrat',sans-serif] font-normal text-[13px] text-white flex-1 min-w-0 text-center break-words">
        {body || 'Your message body will appear here.'}
        {hasCta && ctaLabel && (
          <>
            {' '}
            {/* Same external-link cue the overlay's CTA carries, so a banner
                link is visibly a link that leaves the page. Underline stays on
                the words only — the icon sits beside them, as in the overlay. */}
            <span className="inline-flex items-center gap-[4px] align-middle cursor-pointer">
              <span className="font-medium underline">{ctaLabel}</span>
              <FiExternalLink size={12} className="shrink-0" />
            </span>
          </>
        )}
      </p>
      {dismissible && <MdClose size={18} color="white" className="shrink-0 cursor-pointer" />}
    </div>
    {/* Inside the bar, on its own line under the message and centred on the
        same axis. Slightly muted so it sits below the CTA in the hierarchy —
        it is the way out, not the thing we are asking them to do. */}
    {allowOptOut && (
      <div className="w-full flex items-center justify-center">
        <span
          className="font-['Montserrat',sans-serif] font-medium text-[11px] tracking-wide uppercase whitespace-nowrap underline cursor-pointer"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          Don't show again
        </span>
      </div>
    )}
    </div>
  );
}

function OverlayPreview({
  title,
  body,
  dismissible,
  allowOptOut,
  hasCta,
  ctaLabel,
  rounded = true,
  widthClass = 'w-[320px]',
  compact = false,
}: {
  title: string;
  body: string;
  dismissible: boolean;
  allowOptOut?: boolean;
  hasCta: boolean;
  ctaLabel: string;
  rounded?: boolean;
  widthClass?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`bg-white border flex flex-col ${widthClass} h-full ${rounded ? 'rounded-[8px] shadow-md' : 'border-t-0 border-r-0 border-b-0'}`}
      style={{ borderColor: BORDER }}
    >
      <div className={`flex items-center justify-between gap-[8px] ${compact ? 'px-[12px] py-[10px]' : 'px-[16px] py-[12px]'} border-b shrink-0`} style={{ borderColor: BORDER }}>
        <p className={`font-['Montserrat',sans-serif] font-semibold ${compact ? 'text-[13px]' : 'text-[14px]'} text-black truncate`}>{title || 'Message Title'}</p>
        {dismissible && <MdClose size={compact ? 16 : 18} color="#27496D" className="cursor-pointer shrink-0" />}
      </div>
      <div className={`${compact ? 'px-[12px] py-[10px]' : 'px-[16px] py-[14px]'} flex flex-col gap-[10px] flex-1 min-w-0 overflow-y-auto`}>
        <p className={`font-['Montserrat',sans-serif] font-normal ${compact ? 'text-[12px]' : 'text-[13px]'} text-[#383838] whitespace-pre-wrap break-words`}>
          {body || 'Your message body will appear here.'}
        </p>
        {hasCta && ctaLabel && (
          <div className="flex items-start gap-[6px] min-w-0 cursor-pointer" style={{ color: '#27496D' }}>
            <p className="font-['Montserrat',sans-serif] font-medium text-[13px] underline break-words min-w-0">{ctaLabel}</p>
            <FiExternalLink size={14} className="shrink-0 mt-[2px]" />
          </div>
        )}
      </div>
      {(dismissible || allowOptOut) && (
        <div className={`flex items-center justify-between gap-[8px] ${compact ? 'px-[12px] py-[8px]' : 'px-[16px] py-[10px]'} border-t shrink-0`} style={{ borderColor: BORDER, backgroundColor: '#fafafa' }}>
          {/* "Don't show again" is a separate promise from "Dismiss" — never
              again, versus not now — so the author opts into it explicitly
              rather than it riding along with dismissibility. */}
          {allowOptOut ? (
            <span className={`font-['Montserrat',sans-serif] font-medium ${compact ? 'text-[8px] tracking-normal' : 'text-[11px] tracking-wide'} uppercase whitespace-nowrap cursor-pointer`} style={{ color: NAVY }}>
              Don't show again
            </span>
          ) : <span />}
          <button
            type="button"
            className={`rounded-[6px] shrink-0 ${compact ? 'px-[8px] py-[4px] text-[10px]' : 'px-[12px] py-[6px] text-[12px]'} font-['Montserrat',sans-serif] font-medium text-white flex items-center gap-[4px] cursor-pointer`}
            style={{ backgroundColor: PRIMARY }}
          >
            <MdCheck size={compact ? 10 : 14} /> Dismiss
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

export function ScreenSkeleton({
  effectiveFormat,
  title,
  body,
  color,
  dismissible,
  allowOptOut,
  hasCta,
  ctaLabel,
}: {
  effectiveFormat: DisplayFormat;
  title: string;
  body: string;
  color: string;
  dismissible: boolean;
  allowOptOut?: boolean;
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
          {/* Sidebar skeleton — matches GEOH's real sidebar: #eaeaea bg, ~23% width, #dcdcdc/#cfcfcf active states, #0078d4 accent bar */}
          <div className="border-r flex flex-col shrink-0" style={{ width: '23%', backgroundColor: '#eaeaea', borderColor: BORDER }}>
            <div className="flex items-center gap-[6px] p-[10px]" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="w-[20px] h-[20px] rounded-[5px] shrink-0" style={{ backgroundColor: SKELETON.avatar }} />
              <SkeletonBar width="60%" height={8} color="#c7c7c7" />
            </div>
            <div className="flex flex-col">
              {Array.from({ length: 9 }).map((_, i) => {
                const expanded = i === 1;
                const active = i === 2;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-[6px] px-[10px] relative shrink-0"
                    style={{ backgroundColor: active ? '#cfcfcf' : expanded ? '#dcdcdc' : 'transparent', height: 30 }}
                  >
                    {active && <div className="absolute left-0 top-0 bottom-0" style={{ width: 3, backgroundColor: '#0078d4' }} />}
                    <div className="w-[8px] h-[8px] rounded-[2px] shrink-0" style={{ backgroundColor: '#b3b3b3' }} />
                    <SkeletonBar width={i % 3 === 0 ? '75%' : '55%'} height={6} color="#c7c7c7" />
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
          <OverlayPreview title={title} body={body} dismissible={dismissible} allowOptOut={allowOptOut} hasCta={hasCta} ctaLabel={ctaLabel} rounded={false} />
        </div>
      )}

      {effectiveFormat === 'Banner' && (
        <div className="absolute left-0 right-0 bottom-0">
          <BannerPreview body={body} color={color} dismissible={dismissible} allowOptOut={allowOptOut} hasCta={hasCta} ctaLabel={ctaLabel} rounded={false} />
        </div>
      )}
    </div>
  );
}

/**
 * The desktop mock only reads as a desktop if it keeps desktop proportions —
 * its overlay panel is a fixed 320px, which at phone width would cover the
 * whole screen and hide the app behind it. So render the mock at a real
 * desktop size and scale the result down: the miniature is then exactly what
 * a desktop viewer sees, just smaller.
 */
export const MOCK_WIDTH = 900;

/**
 * Renders a mock at real device size and scales the whole thing down to fit.
 * Every proportion — type size, padding, chrome — stays exactly as the real
 * device shows it, instead of each element being re-tuned for a small box.
 */
export function ScaledMock({ baseWidth, baseHeight, children }: { baseWidth: number; baseHeight: number; children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  // 0 until measured, so the full-size mock never flashes before it shrinks.
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Never magnify past life size — nobody sees a bigger-than-real device.
      setScale(Math.min(width / baseWidth, height / baseHeight, 1));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [baseWidth, baseHeight]);

  return (
    <div ref={frameRef} className="w-full h-full flex items-center justify-center overflow-hidden">
      <div style={{ width: baseWidth * scale, height: baseHeight * scale }}>
        <div style={{ width: baseWidth, height: baseHeight, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function PhoneDataCard() {
  const rows: Array<{ label: string; kind: 'checkbox' | 'badge' | 'icon' | 'text' | 'two-line' | 'empty'; value?: string }> = [
    { label: '20%', kind: 'checkbox' },
    { label: '22%', kind: 'text', value: '45%' },
    { label: '38%', kind: 'badge' },
    { label: '28%', kind: 'text', value: '40%' },
    { label: '18%', kind: 'icon' },
    { label: '42%', kind: 'two-line' },
    { label: '32%', kind: 'empty' },
  ];
  return (
    <div className="rounded-[8px] border overflow-hidden shrink-0" style={{ borderColor: BORDER }}>
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-[8px] px-[10px] py-[8px]"
          style={{
            backgroundColor: i % 2 === 0 ? SKELETON.rowTint : '#ffffff',
            borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : 'none',
          }}
        >
          <SkeletonBar width={row.label} height={7} />
          {row.kind === 'checkbox' && <CheckboxSkeleton />}
          {row.kind === 'badge' && <SkeletonBar width="34%" height={9} color={SKELETON.badgeRed} />}
          {row.kind === 'icon' && <div className="w-[9px] h-[9px] rounded-[2px] border shrink-0" style={{ borderColor: SKELETON.grey }} />}
          {row.kind === 'text' && <SkeletonBar width={row.value ?? '30%'} height={7} />}
          {row.kind === 'two-line' && (
            <div className="flex flex-col gap-[3px] items-end">
              <SkeletonBar width="80px" height={7} />
              <SkeletonBar width="40px" height={6} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// A real handset in CSS points, so a 13px banner in the mock covers the same
// share of the screen it would on the actual device.
export const PHONE_WIDTH = 390;
export const PHONE_HEIGHT = 844;
const PHONE_BEZEL = 10;
const PHONE_SCREEN_WIDTH = PHONE_WIDTH - PHONE_BEZEL * 2;
const PHONE_SCREEN_HEIGHT = PHONE_HEIGHT - PHONE_BEZEL * 2;
/** The width the skeleton chrome below was originally drawn against. */
const CHROME_WIDTH = 248;
const CHROME_SCALE = PHONE_SCREEN_WIDTH / CHROME_WIDTH;

export function PhoneSkeleton({
  effectiveFormat,
  title,
  body,
  color,
  dismissible,
  allowOptOut,
  hasCta,
  ctaLabel,
}: {
  effectiveFormat: DisplayFormat;
  title: string;
  body: string;
  color: string;
  dismissible: boolean;
  allowOptOut?: boolean;
  hasCta: boolean;
  ctaLabel: string;
}) {
  return (
    <div
      className="relative bg-white overflow-hidden shadow-lg"
      style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT, borderRadius: 46, border: `${PHONE_BEZEL}px solid #2b2b2b` }}
    >
      {/* The skeleton chrome is decorative and was drawn for a 248px box, so it
          is scaled up to fill a real screen rather than re-tuned element by
          element. The message itself is NOT in here — it renders below at its
          true size, which is the whole point: on a real phone a 13px banner
          occupies this much of the screen, and now the mock shows that. */}
      <div
        className="absolute top-0 left-0 flex flex-col"
        style={{
          width: CHROME_WIDTH,
          height: PHONE_SCREEN_HEIGHT / CHROME_SCALE,
          transform: `scale(${CHROME_SCALE})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Topbar: hamburger, logo, search, notifications w/ badge, avatar */}
        <div className="h-[34px] border-b flex items-center gap-[10px] px-[10px] shrink-0" style={{ borderColor: BORDER }}>
          <div className="w-[12px] h-[12px] rounded-[2px] shrink-0" style={{ backgroundColor: SKELETON.grey }} />
          <SkeletonBar width="28%" height={9} color={SKELETON.greyLight} />
          <div className="ml-auto flex items-center gap-[8px] shrink-0">
            <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: SKELETON.grey }} />
            <div className="relative w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: SKELETON.grey }}>
              <div className="absolute -top-[2px] -right-[2px] w-[6px] h-[6px] rounded-full" style={{ backgroundColor: SKELETON.badgeRed }} />
            </div>
            <div className="w-[16px] h-[16px] rounded-full" style={{ backgroundColor: SKELETON.avatar }} />
          </div>
        </div>
        {/* Breadcrumb */}
        <div className="h-[28px] border-b flex items-center gap-[8px] px-[10px] shrink-0" style={{ borderColor: BORDER }}>
          <div className="w-[8px] h-[8px]" style={{ borderLeft: `1.5px solid ${SKELETON.avatar}`, borderBottom: `1.5px solid ${SKELETON.avatar}`, transform: 'rotate(45deg)' }} />
          <SkeletonBar width="40%" height={8} color="#c7c7c7" />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-[10px] flex flex-col gap-[8px]">
          {/* Stat cards: 2-column grid, same plain skeleton boxes as desktop */}
          <div className="grid grid-cols-2 gap-[6px]">
            <StatCardSkeleton color={SKELETON.statBlue} borderColor={SKELETON.statBlueBorder} />
            <StatCardSkeleton color={SKELETON.statRed} borderColor={SKELETON.statRedBorder} />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          {/* Search */}
          <div className="h-[26px] rounded-[4px] border flex items-center px-[8px] shrink-0" style={{ borderColor: BORDER }}>
            <SkeletonBar width="40%" height={7} />
          </div>
          {/* Toolbar */}
          <div className="flex items-center gap-[8px] shrink-0">
            <SkeletonBar width="54px" height={12} color={SKELETON.greyLight} />
            <SkeletonBar width="54px" height={12} color={SKELETON.greyLight} />
          </div>
          {/* Select All + record cards, mobile's substitute for the desktop mock's table */}
          <div className="rounded-[8px] border flex items-center justify-between px-[10px] py-[8px] shrink-0" style={{ borderColor: BORDER }}>
            <SkeletonBar width="30%" height={8} color="#c7c7c7" />
            <CheckboxSkeleton />
          </div>
          <PhoneDataCard />
          <PhoneDataCard />
        </div>
      </div>

      {/* Outside the scaled chrome, so the message keeps its real type size and
          padding against a real screen width — exactly what a recipient sees. */}
      {effectiveFormat === 'Overlay' && (
        <div className="absolute inset-0 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
          <OverlayPreview
            title={title}
            body={body}
            dismissible={dismissible}
            allowOptOut={allowOptOut}
            hasCta={hasCta}
            ctaLabel={ctaLabel}
            rounded={false}
            widthClass="w-[85%]"
          />
        </div>
      )}

      {effectiveFormat === 'Banner' && (
        <div className="absolute left-0 right-0 bottom-0">
          <BannerPreview body={body} color={color} dismissible={dismissible} allowOptOut={allowOptOut} hasCta={hasCta} ctaLabel={ctaLabel} rounded={false} />
        </div>
      )}
    </div>
  );
}

type FormData = {
  title?: string;
  messageType?: string;
  startDate?: string;
  endDate?: string;
  noEndDate?: boolean;
  body?: string;
  reason?: string;
  department?: string;
  messageCategory?: string;
  customCategoryName?: string;
  author?: string;
  displayFormat?: string;
  placement?: string;
  featurePath?: string;
  messageColor?: string;
  /** Retained so older saved rows still parse; superseded by `states`. */
  searchMode?: string;
  states?: string[];
  featureFlags?: string[];
  statesOrAgencies?: string[];
  packages?: string[];
  roles?: string[];
  dismissible?: string;
  /** Whether recipients are offered a permanent "Don't show again". */
  allowOptOut?: boolean;
  hasCta?: boolean;
  ctaLabel?: string;
  ctaDestination?: string;
  stopOnCtaClick?: boolean;
  pushNotification?: boolean;
};

export function PermanentDeleteOverlay({ subject, onConfirm, onClose }: { subject: string; onConfirm: () => void; onClose: () => void }) {
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
          <p className="font-['Montserrat',sans-serif] font-medium text-[15px] leading-[21px] text-black">Delete Message</p>
          <button type="button" onClick={handleClose} className="cursor-pointer flex items-center">
            <IoIosClose size={26} color="#27496D" />
          </button>
        </div>
        <div className="flex-1 px-[16px] pt-[16px] pb-[24px]">
          <p className="font-['Montserrat',sans-serif] font-medium text-[14px] leading-[20px]" style={{ color: '#343434' }}>
            You are about to permanently delete the <span className="font-semibold">"{subject}"</span> message. This action cannot be undone and the message will not be recoverable. You can always create a new message and send it for approval, or move this message to drafts to continue working on it.
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
            <RiDeleteBinLine size={15} color="#DA4040" />
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComposeMessageOverlay({ onClose, onMessageCreated, onSaveAsDraft, initialData, submitLabel, overlayTitle, readOnly, isEditingDraft, onApprove, onReject, onDeleteRow, onEditAsDraft, discardedBucketLabel, originalAuthorName, currentUserName, rejectionReason, rejected, concurrentEdit, decisionLock, silentSync }: {
  onClose: () => void;
  onMessageCreated?: (data: FormData) => void;
  onSaveAsDraft?: (data: FormData) => void;
  initialData?: FormData;
  submitLabel?: string;
  overlayTitle?: string;
  readOnly?: boolean;
  /**
   * True when this overlay is editing a message that's already a Draft
   * (opened straight from the Drafts board) — as opposed to composing a
   * brand-new message that doesn't exist as a row yet. Combined with the
   * discarded-origin transition (editingAsDraft below) into one "draft
   * mode": no separate Save as Draft button, closing (X) saves in place,
   * and Delete is offered — same as the discarded overlay's footer.
   */
  isEditingDraft?: boolean;
  /** Approving hands back whatever the approver has edited in this same review pass, so those changes land in the published version instead of being silently discarded. */
  onApprove?: (data: FormData) => void;
  onReject?: () => void;
  onDeleteRow?: () => void;
  /**
   * A discarded (Rejected/Expired/Discontinued) message's "Edit as Draft"
   * action. Fires the backend move to Draft immediately on click — the
   * overlay doesn't wait for a save — then this same instance flips itself
   * out of read-only and into a live editor, so there's no close-and-reopen
   * round trip through the Drafts column.
   */
  onEditAsDraft?: () => void;
  /** Which discarded bucket this message currently sits in — used to retitle the header once editing starts ("Edit Message - Rejected"). */
  discardedBucketLabel?: string;
  /**
   * Who authored this message before ownership passed to whoever is editing
   * it now. Deliberately separate from initialData.author — that field gets
   * overwritten to the new editor on save, so deriving this from it would
   * show the new editor their own name back as the "original" author on a
   * second reopen.
   */
  originalAuthorName?: string;
  /** Whoever is composing — stamped as the author on a brand-new message. */
  currentUserName?: string;
  /** Approver's note from rejecting this message — surfaced as a banner above Author Details. */
  rejectionReason?: string;
  /**
   * Whether this message was rejected. Separate from the reason itself, which
   * is optional — a rejection with no reason still has to show the banner, and
   * an Expired or Discontinued message must not show it at all.
   */
  rejected?: boolean;
  /**
   * Another approver saved an edit to this same Pending message while this
   * one's open for review — detected in real time (a cross-tab `storage`
   * event), so this can show up mid-session with no action taken here.
   * theirsData is what they saved; picking "Load theirs" replaces every
   * field in this form with it, "Save mine" persists what's currently typed
   * here instead, overwriting theirs.
   */
  concurrentEdit?: { theirsData: FormData; onLoadTheirs: () => void; onSaveMine: (data: FormData) => void };
  /**
   * Another approver already approved or rejected this same message while
   * this one's open for review. One-way: once set, the form is fully locked
   * (on top of whatever readOnly/editingAsDraft already had it at) and
   * Approve/Reject disappear — the only way out is the banner's own "View"
   * action, there's no dismissing this and going back to editing.
   */
  decisionLock?: { status: 'Live' | 'Rejected'; onView: () => void };
  /**
   * Same person, another tab of the same browser session, made an edit or a
   * decision to this same Pending message. Unlike concurrentEdit/decisionLock
   * (a genuinely different approver — shows a banner, requires a choice),
   * this is silently applied: it's still just you, so there's nothing to
   * reconcile. A new object reference each time this fires.
   */
  silentSync?: { data: FormData };
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Flips true the instant "Edit as Draft" is clicked on a discarded
  // message's read-only view — the backend move already happened by then
  // (see onEditAsDraft above), this just switches this same overlay's own
  // chrome (title, lock overlay, field disabled-ness, footer) into the
  // normal editable-draft look, in place.
  const [editingAsDraft, setEditingAsDraft] = useState(false);
  // A decision lock always wins — even a reviewing approver's normally-
  // editable form goes fully read-only the instant someone else has already
  // approved or rejected the message, on top of whatever readOnly/
  // editingAsDraft already had it at.
  const effectiveReadOnly = (readOnly && !editingAsDraft) || !!decisionLock;
  // Either an existing Draft opened directly, or a discarded message
  // mid-transition into one — both get the same "draft window" chrome.
  const inDraftMode = isEditingDraft || editingAsDraft;
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [body, setBody] = useState(initialData?.body ?? '');
  const [reason, setReason] = useState(initialData?.reason ?? '');
  const [department, setDepartment] = useState(initialData?.department ?? '');
  const [messageCategory, setMessageCategory] = useState(initialData?.messageCategory ?? '');
  const [customCategoryName, setCustomCategoryName] = useState(initialData?.customCategoryName ?? '');
  // A message that started in a discarded bucket keeps its original author
  // in initialData.author while still locked/read-only. The moment it's
  // actually editable as a draft (mid-transition via "Edit as Draft", or
  // reopened straight from Drafts), ownership passes to whoever is editing
  // it now — the original author is called out separately instead, via the
  // dedicated originalAuthorName prop (not initialData.author, which gets
  // overwritten to the new editor on save).
  const showOriginContext = !effectiveReadOnly && !!discardedBucketLabel;
  const author = showOriginContext
    ? (currentUserName ?? CURRENT_USER_NAME)
    : (initialData?.author ?? currentUserName ?? CURRENT_USER_NAME);
  const [messageColor, setMessageColor] = useState(initialData?.messageColor ?? MESSAGE_COLOR_OPTIONS[1]);
  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>((initialData?.displayFormat as DisplayFormat) ?? '');
  const [placement, setPlacement] = useState<Placement>((initialData?.placement as Placement) ?? '');
  const [featurePath, setFeaturePath] = useState(initialData?.featurePath ?? '');
  const [hasCta, setHasCta] = useState(initialData?.hasCta ?? false);
  const [ctaLabel, setCtaLabel] = useState(initialData?.ctaLabel ?? '');
  const [ctaDestination, setCtaDestination] = useState(initialData?.ctaDestination ?? '');
  const [stopOnCtaClick, setStopOnCtaClick] = useState(initialData?.stopOnCtaClick ?? false);

  const [states, setStates] = useState<string[]>(initialData?.states ?? []);
  const [featureFlags, setFeatureFlags] = useState<string[]>(initialData?.featureFlags ?? []);
  const [statesOrAgencies, setStatesOrAgencies] = useState<string[]>(initialData?.statesOrAgencies ?? []);
  const [packages, setPackages] = useState<string[]>(initialData?.packages ?? []);
  const [roles, setRoles] = useState<string[]>(initialData?.roles ?? []);

  const [startDate, setStartDate] = useState(initialData?.startDate ?? '');
  const [endDate, setEndDate] = useState(initialData?.endDate ?? '');
  const [noEndDate, setNoEndDate] = useState(initialData?.noEndDate ?? false);
  const [dismissible, setDismissible] = useState<Dismissible>((initialData?.dismissible as Dismissible) ?? 'Dismissible');
  const [allowOptOut, setAllowOptOut] = useState<boolean>(initialData?.allowOptOut ?? true);
  // Overlay messages are always dismissible — there's no non-dismissible
  // overlay in the design, so the choice only makes sense for Banner. Force
  // it back to Dismissible whenever the format is (or becomes) Overlay,
  // rather than just hiding the control, so a message authored as Banner /
  // Non-Dismissible and then switched to Overlay doesn't silently save with
  // a stale Non-Dismissible value the user never chose for this format.
  useEffect(() => {
    if (displayFormat === 'Overlay' && dismissible !== 'Dismissible') {
      setDismissible('Dismissible');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayFormat]);

  // Selecting the Emergency colour preselects Non-Dismissible, since that is
  // the convention the helper text recommends. Keyed on the transition into
  // red rather than the state of being red, so an author who deliberately
  // switches back to Dismissible is not overridden on every later render.
  const prevMessageColor = useRef(messageColor);
  useEffect(() => {
    const becameEmergency = messageColor === '#DA4040' && prevMessageColor.current !== '#DA4040';
    prevMessageColor.current = messageColor;
    if (becameEmergency && displayFormat === 'Banner') setDismissible('Non-Dismissible');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageColor, displayFormat]);

  const [pushNotification, setPushNotification] = useState(initialData?.pushNotification ?? false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'phone'>('desktop');
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);

  // Phone cannot show the form and the preview side by side, so it shows one
  // at a time behind a tab strip. Someone who can only read the message opened
  // it to look at the message, not the metadata — so they land on Preview.
  // Phone and tablet are both too narrow for the form and the preview side by
  // side, so both stack them behind the tab strip.
  const isBelowDesktop = useIsBelowDesktop();
  // Reviewing or just looking means you came for the message itself, not the
  // metadata. An approver can still edit here, so readOnly alone misses them —
  // the approve/reject pair is what marks a review.
  const opensOnPreview = readOnly || (!!onApprove && !!onReject);
  const [stackedTab, setStackedTab] = useState<'details' | 'preview'>(opensOnPreview ? 'preview' : 'details');
  // While you are on Details the preview keeps updating out of sight, so the
  // tab carries a dot until you next look at it.
  const [previewSeen, setPreviewSeen] = useState(true);
  // A discarded message opens on Preview (readOnly). The moment "Edit as
  // Draft" flips this into an editor, jump to Details — that's where the
  // now-editable fields live, and staying on Preview would show an
  // unchanged read-only-looking screen right after clicking "edit".
  useEffect(() => {
    if (editingAsDraft) setStackedTab('details');
  }, [editingAsDraft]);

  // Only the fields the preview actually draws count as a change worth a dot —
  // editing the department or the audience leaves the preview identical.
  const previewSignature = [displayFormat, title, body, messageColor, dismissible, hasCta, ctaLabel].join(' ');
  const lastSeenSignature = useRef(previewSignature);
  useEffect(() => {
    if (stackedTab === 'preview') {
      lastSeenSignature.current = previewSignature;
      setPreviewSeen(true);
    } else if (previewSignature !== lastSeenSignature.current) {
      setPreviewSeen(false);
    }
  }, [previewSignature, stackedTab]);

  const isEmergency = displayFormat === 'Banner' && messageColor === '#DA4040';
  // Emergency is deliberately unavoidable, and a permanent opt-out on a message
  // that cannot be closed is meaningless — so the option is unavailable rather
  // than merely unchecked in those cases.
  const canOfferOptOut = displayFormat !== '' && !isEmergency && (displayFormat === 'Overlay' || dismissible === 'Dismissible');
  const effectiveAllowOptOut = canOfferOptOut && allowOptOut;

  const audienceCount = getAudienceRecipientCount({ agencies: statesOrAgencies, states, packages, roles, featureFlags });
  // Nothing may be sent to nobody — this gates submission and reddens the count.
  const hasNoRecipients = audienceCount === 0;
  // Only a subset of the audience has the app installed with notifications
  // allowed, so turning push on does not mean everyone selected gets one.
  const pushCount = getAudiencePushCount({ agencies: statesOrAgencies, states, packages, roles, featureFlags });
  // Push reaching nobody no longer blocks sending — the message still goes
  // out on every other channel to the full audience, so this is informational
  // only (the count next to the toggle already says "0 of N get a
  // notification"), not a reason to stop the whole message.

  // Whichever date the user picks first, an end date earlier than the start
  // date is invalid — checked as soon as both are set, regardless of which
  // one was just changed, rather than only when End Date's own onChange
  // fires.
  const hasInvalidDateRange = !noEndDate && startDate !== '' && endDate !== '' && endDate < startDate;

  const isFormValid =
    !hasNoRecipients &&
    !hasInvalidDateRange &&
    title.trim() !== '' &&
    body.trim() !== '' &&
    reason.trim() !== '' &&
    department !== '' &&
    displayFormat !== '' &&
    startDate !== '' &&
    (!hasCta || (ctaLabel.trim() !== '' && ctaDestination.trim() !== '')) &&
    placement !== '' &&
    (placement !== 'Feature Specific' || featurePath !== '');

  const showFooter = inDraftMode || !!onDeleteRow || !!onEditAsDraft || !!(onApprove && onReject) || !effectiveReadOnly;

  const messageType: MessageType = displayFormat === '' ? '' : (isEmergency ? 'Emergency' : 'Announcement');
  // Computed directly (not just left to the effect above) so a submit that
  // lands in the same render as switching to Overlay can't slip through
  // with a stale Non-Dismissible value before the effect has a chance to run.
  const savedDismissible: Dismissible = displayFormat === 'Overlay' ? 'Dismissible' : dismissible;
  const allFormData: FormData = { title, messageType, startDate, endDate, noEndDate, body, reason, department, messageCategory, customCategoryName, author, displayFormat, placement, featurePath, messageColor, statesOrAgencies, states, featureFlags, packages, roles, dismissible: savedDismissible, allowOptOut: effectiveAllowOptOut, hasCta, ctaLabel, ctaDestination, stopOnCtaClick, pushNotification };

  // An executive approver editing a Pending message in the Review overlay
  // gets the same "X saves in place" treatment as a draft — they may fix a
  // typo or two before deciding to Approve/Reject, and closing without
  // hitting either shouldn't just throw that away. Distinct from inDraftMode
  // itself so the footer still shows Approve/Reject here rather than the
  // draft-mode footer — this only affects what closing does, not the
  // buttons shown.
  const canSaveOnClose = inDraftMode || (!!onApprove && !!onReject && !effectiveReadOnly);

  // Baseline to diff against on close, so a window that's opened and closed
  // untouched doesn't save (or toast) anything. Captured once at the moment
  // this save-on-close eligibility actually starts — on mount for a Draft
  // opened straight from the board or a Pending message under review, or the
  // instant "Edit as Draft" flips editingAsDraft true for a discarded
  // message — rather than at the overlay's original mount, since that
  // transition itself reassigns the author, which is a real effect of the
  // click, not a form edit to detect.
  const draftBaselineRef = useRef<string | null>(null);
  // The raw field values behind that same baseline moment — as opposed to
  // draftBaselineRef's derived allFormData snapshot — so "Discard Changes"
  // can actually restore every input to what it was, not just detect that
  // something differs. author is deliberately left out: it isn't a form
  // field the user edits directly, so there's nothing to roll it back to.
  const rawBaselineRef = useRef<{
    title: string; body: string; reason: string; department: string; messageCategory: string; customCategoryName: string;
    messageColor: string; displayFormat: DisplayFormat; placement: Placement; featurePath: string;
    hasCta: boolean; ctaLabel: string; ctaDestination: string; stopOnCtaClick: boolean;
    states: string[]; featureFlags: string[]; statesOrAgencies: string[]; packages: string[]; roles: string[];
    startDate: string; endDate: string; noEndDate: boolean; dismissible: Dismissible; allowOptOut: boolean; pushNotification: boolean;
  } | null>(null);

  // Pulls the same raw-field shape rawBaselineRef stores out of any FormData
  // object — the baseline-capturing effect below and the silent-sync effect
  // both need it, one off the live form fields and the other off a saved
  // snapshot, so this is the one place that shape is spelled out.
  const toRawSnapshot = (data: FormData) => ({
    title: data.title ?? '', body: data.body ?? '', reason: data.reason ?? '', department: data.department ?? '',
    messageCategory: data.messageCategory ?? '', customCategoryName: data.customCategoryName ?? '',
    messageColor: data.messageColor ?? MESSAGE_COLOR_OPTIONS[1], displayFormat: (data.displayFormat as DisplayFormat) ?? '',
    placement: (data.placement as Placement) ?? '', featurePath: data.featurePath ?? '',
    hasCta: data.hasCta ?? false, ctaLabel: data.ctaLabel ?? '', ctaDestination: data.ctaDestination ?? '', stopOnCtaClick: data.stopOnCtaClick ?? false,
    states: data.states ?? [], featureFlags: data.featureFlags ?? [], statesOrAgencies: data.statesOrAgencies ?? [], packages: data.packages ?? [], roles: data.roles ?? [],
    startDate: data.startDate ?? '', endDate: data.endDate ?? '', noEndDate: data.noEndDate ?? false,
    dismissible: (data.dismissible as Dismissible) ?? 'Dismissible', allowOptOut: data.allowOptOut ?? true, pushNotification: data.pushNotification ?? false,
  });

  useEffect(() => {
    if (canSaveOnClose) {
      draftBaselineRef.current = JSON.stringify(allFormData);
      rawBaselineRef.current = {
        title, body, reason, department, messageCategory, customCategoryName,
        messageColor, displayFormat, placement, featurePath,
        hasCta, ctaLabel, ctaDestination, stopOnCtaClick,
        states, featureFlags, statesOrAgencies, packages, roles,
        startDate, endDate, noEndDate, dismissible, allowOptOut, pushNotification,
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSaveOnClose]);

  // Same-session sync: another tab of THIS browser (the approver's own,
  // detected by session id on the Dashboard side) just saved an edit or a
  // decision to this same message. Unlike concurrentEdit/decisionLock, it's
  // still just this person, so there's nothing to reconcile — silently
  // apply their newer data and move the baselines up to match, so this tab's
  // own next close/discard diffs against the now-current state rather than
  // stale data or re-saving over what the other tab just wrote.
  const lastSilentSyncRef = useRef<typeof silentSync>(undefined);
  useEffect(() => {
    if (!silentSync || silentSync === lastSilentSyncRef.current) return;
    lastSilentSyncRef.current = silentSync;
    applyFormData(silentSync.data);
    draftBaselineRef.current = JSON.stringify(silentSync.data);
    rawBaselineRef.current = toRawSnapshot(silentSync.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [silentSync]);

  // Every field this form owns, set from one plain FormData object — shared
  // by "Discard Changes" (source: this session's own pre-edit baseline) and
  // "Load theirs" (source: another approver's saved edit), since both are
  // the same operation at heart: replace what's here with a known-good
  // snapshot. Same fallbacks as each field's own useState initializer above.
  const applyFormData = (data: FormData) => {
    setTitle(data.title ?? '');
    setBody(data.body ?? '');
    setReason(data.reason ?? '');
    setDepartment(data.department ?? '');
    setMessageCategory(data.messageCategory ?? '');
    setCustomCategoryName(data.customCategoryName ?? '');
    setMessageColor(data.messageColor ?? MESSAGE_COLOR_OPTIONS[1]);
    setDisplayFormat((data.displayFormat as DisplayFormat) ?? '');
    setPlacement((data.placement as Placement) ?? '');
    setFeaturePath(data.featurePath ?? '');
    setHasCta(data.hasCta ?? false);
    setCtaLabel(data.ctaLabel ?? '');
    setCtaDestination(data.ctaDestination ?? '');
    setStopOnCtaClick(data.stopOnCtaClick ?? false);
    setStates(data.states ?? []);
    setFeatureFlags(data.featureFlags ?? []);
    setStatesOrAgencies(data.statesOrAgencies ?? []);
    setPackages(data.packages ?? []);
    setRoles(data.roles ?? []);
    setStartDate(data.startDate ?? '');
    setEndDate(data.endDate ?? '');
    setNoEndDate(data.noEndDate ?? false);
    setDismissible((data.dismissible as Dismissible) ?? 'Dismissible');
    setAllowOptOut(data.allowOptOut ?? true);
    setPushNotification(data.pushNotification ?? false);
  };

  const handleDiscardChanges = () => {
    if (!rawBaselineRef.current) return;
    applyFormData(rawBaselineRef.current);
  };

  const handleLoadTheirs = () => {
    if (!concurrentEdit) return;
    applyFormData(concurrentEdit.theirsData);
    concurrentEdit.onLoadTheirs();
  };

  const handleSubmit = () => {
    onMessageCreated?.(allFormData);
    onClose();
  };

  const handleSaveAsDraft = () => {
    onSaveAsDraft?.(allFormData);
    onClose();
  };

  // In draft mode (and reviewing-as-approver) there's no separate Save
  // button — closing (X) is itself the save, but only if something actually
  // changed since it became eligible; otherwise there's nothing to write
  // back and no "All Changes Saved" toast to show. Everywhere else, X just
  // closes: a brand-new, never-saved message has nothing to save, and the
  // locked discarded view has its own explicit action for anything that
  // mutates.
  const handleClose = () => {
    if (canSaveOnClose && draftBaselineRef.current !== null && JSON.stringify(allFormData) !== draftBaselineRef.current) {
      onSaveAsDraft?.(allFormData);
    }
    onClose();
  };

  const effectiveFormat: DisplayFormat = displayFormat;
  const effectiveDismissible = savedDismissible === 'Dismissible';
  const effectiveBannerColor = messageColor;
  const hasPreview = effectiveFormat !== '';

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <style>{`.date-input-no-native-icon::-webkit-calendar-picker-indicator { opacity: 0; position: absolute; right: 0; width: 24px; height: 100%; cursor: pointer; }`}</style>

      {showDeleteConfirm && onDeleteRow && (
        <PermanentDeleteOverlay
          subject={title || 'Untitled'}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => { setShowDeleteConfirm(false); onDeleteRow(); }}
        />
      )}

      {/* Top header bar */}
      <div className="flex items-center justify-between h-[56px] px-[24px] border-b shrink-0" style={{ borderColor: BORDER }}>
        <h2 className="font-['Montserrat',sans-serif] font-semibold text-[16px] text-black">
          {editingAsDraft && discardedBucketLabel ? `Edit Message - ${discardedBucketLabel}` : (overlayTitle ?? 'New Message')}
        </h2>
        <button type="button" onClick={handleClose} className="cursor-pointer flex items-center">
          <IoIosClose size={26} color="#27496D" />
        </button>
      </div>

      {/* Phone: the form and the preview cannot share a 375px screen, so they
          share a tab strip instead. Tablet and up show both side by side. */}
      {isBelowDesktop && (
        <div className="flex shrink-0 border-b" style={{ borderColor: BORDER }}>
          {([
            { key: 'details', label: 'Details' },
            { key: 'preview', label: 'Preview' },
          ] as const).map((t) => {
            const tabActive = stackedTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setStackedTab(t.key)}
                className="flex-1 h-[44px] flex items-center justify-center gap-[6px] cursor-pointer font-['Montserrat',sans-serif] text-[13px] transition-colors duration-150"
                style={{
                  color: tabActive ? '#2699FB' : '#585858',
                  fontWeight: tabActive ? 600 : 500,
                  // Inset shadow rather than a border, so switching tabs does
                  // not shift the strip's height by the underline's 2px.
                  boxShadow: tabActive ? 'inset 0 -2px 0 #2699FB' : 'none',
                }}
              >
                {t.label}
                {t.key === 'preview' && !previewSeen && (
                  <span className="rounded-full size-[6px] shrink-0" style={{ backgroundColor: '#FF8800' }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Body: left form + right preview */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Scrollable form, fixed 399px — left by default, right if PREVIEW_ON_LEFT */}
        <div
          style={{
            // Fixed 399px only where there is a preview beside it to divide
            // from; on phone it owns the whole screen.
            width: isBelowDesktop ? '100%' : '399px',
            minWidth: isBelowDesktop ? 0 : '399px',
            maxWidth: isBelowDesktop ? '100%' : '399px',
            overflowY: 'auto',
            ...(isBelowDesktop ? {} : { [PREVIEW_ON_LEFT ? 'borderLeft' : 'borderRight']: `1px solid ${BORDER}` }),
            position: 'relative',
            order: PREVIEW_ON_LEFT ? 2 : 1,
            display: isBelowDesktop && stackedTab !== 'details' ? 'none' : 'flex',
          }}
          className="p-[24px] max-sm:p-[16px] flex flex-col gap-[16px]"
        >
          {effectiveReadOnly && <div style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'default' }} />}

          {/* One-way: once another approver has decided this message, there is
              nothing left to do here but leave. No dismiss control on this
              banner on purpose — the only exit is its own "View" action,
              never back into editing. Takes priority over every other banner
              below, including a concurrent-edit notice that may have shown
              moments earlier — a decision supersedes an in-progress edit
              conflict entirely. */}
          {decisionLock && (
            <div className="flex flex-col gap-[10px] rounded-[4px] px-[12px] py-[10px]" style={{ backgroundColor: '#FFE9E9' }}>
              <div className="flex items-start gap-[8px]">
                <RiErrorWarningLine size={16} color="#DA4040" className="shrink-0 mt-[1px]" />
                <p className="font-['Montserrat',sans-serif] font-normal text-[13px] leading-[18px]" style={{ color: '#DA4040' }}>
                  This message has been {decisionLock.status === 'Live' ? 'approved' : 'rejected'}. You cannot perform any actions.
                </p>
              </div>
              <button
                type="button"
                onClick={decisionLock.onView}
                className="self-start rounded-[8px] px-[12px] h-[32px] shrink-0 flex items-center justify-center gap-[6px] cursor-pointer"
                style={{ backgroundColor: '#DA4040' }}
              >
                <span className="font-['Montserrat',sans-serif] font-medium text-[13px] uppercase whitespace-nowrap text-white">
                  View {decisionLock.status === 'Live' ? 'approved' : 'rejected'} message
                </span>
              </button>
            </div>
          )}

          {/* Real-time: another approver saved their own edit to this same
              Pending message while this one's still open for review. Neither
              version is presumed right — "Load theirs" and "Save mine" carry
              equal weight, it's just a choice of which edit wins. */}
          {!decisionLock && concurrentEdit && (
            <div className="flex flex-col gap-[10px] rounded-[4px] px-[12px] py-[10px]" style={{ backgroundColor: '#FFE9E9' }}>
              <div className="flex items-start gap-[8px]">
                <RiErrorWarningLine size={16} color="#DA4040" className="shrink-0 mt-[1px]" />
                <p className="font-['Montserrat',sans-serif] font-normal text-[13px] leading-[18px]" style={{ color: '#DA4040' }}>
                  Another approver just saved changes to this message while you were reviewing it.
                </p>
              </div>
              <div className="flex items-center gap-[8px]">
                <button
                  type="button"
                  onClick={handleLoadTheirs}
                  className="rounded-[8px] px-[12px] h-[32px] shrink-0 flex items-center justify-center gap-[6px] border cursor-pointer transition-colors duration-150"
                  style={{ backgroundColor: PRIMARY_BG, borderColor: PRIMARY, color: PRIMARY }}
                >
                  <span className="font-['Montserrat',sans-serif] font-medium text-[13px] uppercase whitespace-nowrap">Load theirs</span>
                </button>
                <button
                  type="button"
                  onClick={() => concurrentEdit.onSaveMine(allFormData)}
                  className="rounded-[8px] px-[12px] h-[32px] shrink-0 flex items-center justify-center gap-[6px] cursor-pointer"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <span className="font-['Montserrat',sans-serif] font-medium text-[13px] uppercase whitespace-nowrap text-white">Save mine</span>
                </button>
              </div>
            </div>
          )}

          {/* Rejection Reason and Original Author share one card instead of
              stacking as two separate ones — same border, same padding, one
              row each. The reason is optional, so when the approver left it
              blank the row says so rather than vanishing — otherwise the
              absence of a note is indistinguishable from the message never
              having been rejected.
              Red/filled while this is still the locked read-only "Rejected
              Message" view (Original Author never shows there — ownership
              hasn't moved yet) — once it's actually editable (mid-transition
              via "Edit as Draft", or reopened straight from the Drafts
              column), it drops the alert styling for a plain neutral card
              matching every other section below, since it's no longer
              flagging an unresolved rejection — just carrying context
              forward. Original Author is gone the instant this is
              resubmitted: the resulting Pending/Live row is a fresh object
              that never carries either field forward. */}
          {(() => {
            const showRejection = !!(rejected || rejectionReason);
            const showOriginalAuthor = showOriginContext && !!originalAuthorName;
            if (!showRejection && !showOriginalAuthor) return null;
            const alert = effectiveReadOnly && showRejection;
            return (
              <div
                className="flex flex-col gap-[10px] rounded-[4px] px-[12px] py-[10px]"
                style={alert ? { backgroundColor: '#FFE9E9' } : { backgroundColor: 'white', border: `1px solid ${BORDER}` }}
              >
                {showRejection && (
                  <div className="flex items-start gap-[8px]">
                    <RiErrorWarningLine size={16} color={alert ? '#DA4040' : LABEL_GREY} className="shrink-0 mt-[1px]" />
                    <p className="font-['Montserrat',sans-serif] font-normal text-[13px] leading-[18px]" style={{ color: alert ? '#DA4040' : '#000000' }}>
                      <span className="font-semibold" style={{ color: alert ? '#DA4040' : LABEL_GREY }}>Rejection Reason: </span>
                      {rejectionReason || 'No reason was provided by the approver.'}
                    </p>
                  </div>
                )}
                {showOriginalAuthor && (
                  <div className="flex items-start gap-[8px]">
                    <MdPersonOutline size={16} color={LABEL_GREY} className="shrink-0 mt-[1px]" />
                    <p className="font-['Montserrat',sans-serif] font-normal text-[13px] leading-[18px]" style={{ color: '#000000' }}>
                      <span className="font-semibold" style={{ color: LABEL_GREY }}>Original Author: </span>
                      {originalAuthorName}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Author card — no separate "Author Details" heading, since the
              "Author:" line already says what this card is. */}
          <div className="bg-white rounded-[4px] border flex flex-col gap-[16px] p-[20px]" style={{ borderColor: BORDER }}>
            <p className="font-['Montserrat',sans-serif] text-[13px] leading-[18px]">
              <span className="font-semibold" style={{ color: LABEL_GREY }}>Author: </span>
              <span className="font-normal" style={{ color: '#000000' }}>{author}</span>
            </p>
            <SelectField label="Department *" value={department} onChange={setDepartment} placeholder="Select department..." options={DEPARTMENT_OPTIONS} disabled={effectiveReadOnly} />
            <SelectField label="Message Category" value={messageCategory} onChange={setMessageCategory} placeholder="Select category..." options={CATEGORY_OPTIONS} disabled={effectiveReadOnly} />
            {messageCategory === 'Custom' && (
              <TextField label="Category Name" value={customCategoryName} onChange={setCustomCategoryName} placeholder="Type a category name" disabled={effectiveReadOnly} maxLength={255} />
            )}
          </div>

          {/* Message Details card */}
          <div className="bg-white rounded-[4px] border flex flex-col gap-[16px] p-[20px]" style={{ borderColor: BORDER }}>
            <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">Message Details</p>
            <RadioField label="Display Format *" value={displayFormat} onChange={(v) => setDisplayFormat(v as DisplayFormat)} options={['Overlay', 'Banner']} disabled={effectiveReadOnly} />
            {displayFormat === 'Banner' && (
              <ColorField
                label="Message Color"
                value={messageColor}
                onChange={setMessageColor}
                options={MESSAGE_COLOR_OPTIONS}
                optionLabels={{ '#DA4040': 'Emergency', '#27496D': 'Regular' }}
                disabled={effectiveReadOnly}
                subtext={isEmergency ? 'Red is recommended for emergencies.' : undefined}
              />
            )}
            <SelectField label="Placement *" value={placement} onChange={(v) => setPlacement(v as Placement)} placeholder="Select placement..." options={['App-wide', 'Feature Specific']} disabled={effectiveReadOnly} />
            {placement === 'Feature Specific' && (
              <SelectField label="Feature Path *" value={featurePath} onChange={setFeaturePath} placeholder="Select a feature..." options={FEATURE_PATHS} disabled={effectiveReadOnly} />
            )}
            <TextField label="Message Title *" value={title} onChange={setTitle} placeholder="Shows in overlay & list" disabled={effectiveReadOnly} maxLength={255} />
            <TextAreaField label="Message Body *" value={body} onChange={setBody} placeholder="Shows in banner & overlay" disabled={effectiveReadOnly} />
            <TextAreaField label="Message Reason *" value={reason} onChange={setReason} placeholder="Internal only, not shown to users" disabled={effectiveReadOnly} />
          </div>

          {/* Display Settings card */}
          <div className="bg-white rounded-[4px] border flex flex-col gap-[16px] p-[20px]" style={{ borderColor: BORDER }}>
            <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">Display Settings</p>
            {/* Overlay is always dismissible (forced above), so the choice is
                meaningless there — only Banner gets to pick. */}
            {displayFormat === 'Banner' && (
              <RadioField
                label="Display"
                value={dismissible}
                onChange={(v) => setDismissible(v as Dismissible)}
                options={['Dismissible', 'Non-Dismissible']}
                disabled={effectiveReadOnly}
                subtext={isEmergency ? 'Non-dismissible is recommended for emergencies (red banners).' : undefined}
              />
            )}
            <CtaBox
              checked={hasCta}
              onChange={setHasCta}
              label={ctaLabel}
              destination={ctaDestination}
              onLabelChange={setCtaLabel}
              onDestinationChange={setCtaDestination}
              stopOnClick={stopOnCtaClick}
              onStopOnClickChange={setStopOnCtaClick}
              disabled={effectiveReadOnly}
            />
            {canOfferOptOut && (
              <CheckboxCard
                title="Don't Show Again"
                description="Let recipients turn this message off permanently"
                checked={allowOptOut}
                onChange={setAllowOptOut}
                disabled={effectiveReadOnly}
              />
            )}
            <ToggleRow
              label="Also send as push notification"
              description={pushNotification
                ? `${pushCount.toLocaleString()} of ${audienceCount.toLocaleString()} ${audienceCount === 1 ? 'recipient' : 'recipients'} get a notification`
                : undefined}
              checked={pushNotification}
              onChange={setPushNotification}
              disabled={effectiveReadOnly}
            />
          </div>

          {/* Audience card */}
          <div className="bg-white rounded-[4px] border flex flex-col gap-[16px] p-[20px]" style={{ borderColor: BORDER }}>
            <div className="flex flex-col">
              <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">Audience</p>
              <p
                className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[18px]"
                style={{ color: hasNoRecipients ? '#DA4040' : '#585858' }}
              >
                {audienceCount} {audienceCount === 1 ? 'recipient' : 'recipients'} will see this message
              </p>
            </div>
            {/* Agency and State are both first-class now rather than two modes of
                one field — targeting "Texas agencies on Billing" needed both at
                once, which the old Search By radio made impossible. */}
            <MultiSelectField label="Agency" values={statesOrAgencies} onChange={setStatesOrAgencies} placeholder="Select agencies..." options={AGENCIES.map((a) => a.name)} disabled={effectiveReadOnly} variant="agency" />
            <MultiSelectField label="State" values={states} onChange={setStates} placeholder="Select states..." options={STATES} disabled={effectiveReadOnly} variant="state" />
            <MultiSelectField label="Feature Flag" values={featureFlags} onChange={setFeatureFlags} placeholder="Select feature flags..." options={FEATURE_FLAGS} disabled={effectiveReadOnly} variant="feature" />
            <MultiSelectField label="Package" values={packages} onChange={setPackages} placeholder="Select packages..." options={PACKAGES} disabled={effectiveReadOnly} variant="package" />
            <MultiSelectField label="Role" values={roles} onChange={setRoles} placeholder="Select roles..." options={ROLES} disabled={effectiveReadOnly} variant="role" />
          </div>

          {/* Date & Time card */}
          <div className="bg-white rounded-[4px] border flex flex-col gap-[16px] p-[20px]" style={{ borderColor: BORDER }}>
            <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">Date &amp; Time</p>
            <DateField label="Start Date *" value={startDate} onChange={setStartDate} disabled={effectiveReadOnly} />
            <DateField label="End Date" value={endDate} onChange={setEndDate} disabled={effectiveReadOnly || noEndDate} />
            {hasInvalidDateRange && (
              <p className="font-['Montserrat',sans-serif] font-medium text-[13px] leading-[18px] -mt-[8px]" style={{ color: '#DA4040' }}>
                End date cannot be before the start date.
              </p>
            )}
            <CheckboxRow
              label="No end date"
              checked={noEndDate}
              onChange={(v) => { setNoEndDate(v); if (v) setEndDate(''); }}
              disabled={effectiveReadOnly}
            />
          </div>
        </div>

        {/* Preview + device toggle — right by default, left if PREVIEW_ON_LEFT */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: '#f8f8f8',
            order: PREVIEW_ON_LEFT ? 1 : 2,
            display: isBelowDesktop && stackedTab !== 'preview' ? 'none' : 'flex',
          }}
          className="flex flex-col p-[24px] max-sm:p-[16px] gap-[16px]"
        >
          {/* Preview card */}
          <div className="bg-white rounded-[8px] border flex flex-col flex-1 overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="px-[16px] py-[12px] border-b flex items-center justify-between gap-[12px] shrink-0" style={{ borderColor: BORDER }}>
              <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] text-black">Message Preview</p>
              <div className="flex items-center rounded-[6px] border border-[#e5e5e5] bg-white overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setDeviceView('desktop')}
                  className="flex items-center justify-center w-[32px] h-[32px] transition-colors duration-150"
                  style={{ backgroundColor: deviceView === 'desktop' ? '#27496d' : 'white' }}
                  title="Desktop view"
                >
                  <MdDesktopWindows size={16} color={deviceView === 'desktop' ? 'white' : '#8a8a8a'} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceView('phone')}
                  className="flex items-center justify-center w-[32px] h-[32px] transition-colors duration-150"
                  style={{ backgroundColor: deviceView === 'phone' ? '#27496d' : 'white' }}
                  title="Phone view"
                >
                  <MdPhoneIphone size={16} color={deviceView === 'phone' ? 'white' : '#8a8a8a'} />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col p-[16px] gap-[12px]">
              {hasPreview ? (
                <div className="flex-1 min-h-0">
                  {deviceView === 'desktop' ? (
                    isBelowDesktop ? (
                      <ScaledMock baseWidth={MOCK_WIDTH} baseHeight={MOCK_WIDTH / 1.6}>
                        <ScreenSkeleton
                          effectiveFormat={effectiveFormat}
                          title={title}
                          body={body}
                          color={effectiveBannerColor}
                          dismissible={effectiveDismissible}
                          allowOptOut={effectiveAllowOptOut}
                          hasCta={hasCta}
                          ctaLabel={ctaLabel}
                        />
                      </ScaledMock>
                    ) : (
                      // Desktop has room to draw the mock at native size, which
                      // beats scaling a smaller one up.
                      <div className="w-full h-full flex justify-center">
                        <div style={{ aspectRatio: '16 / 10', height: '100%', maxWidth: '100%' }}>
                          <ScreenSkeleton
                            effectiveFormat={effectiveFormat}
                            title={title}
                            body={body}
                            color={effectiveBannerColor}
                            dismissible={effectiveDismissible}
                            allowOptOut={effectiveAllowOptOut}
                            hasCta={hasCta}
                            ctaLabel={ctaLabel}
                          />
                        </div>
                      </div>
                    )
                  ) : (
                    // A real handset is 844pt tall, taller than the pane at any
                    // breakpoint, so the phone mock always scales to fit.
                    <ScaledMock baseWidth={PHONE_WIDTH} baseHeight={PHONE_HEIGHT}>
                      <PhoneSkeleton
                        effectiveFormat={effectiveFormat}
                        title={title}
                        body={body}
                        color={effectiveBannerColor}
                        dismissible={effectiveDismissible}
                        allowOptOut={effectiveAllowOptOut}
                        hasCta={hasCta}
                        ctaLabel={ctaLabel}
                      />
                    </ScaledMock>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-[10px] py-[40px]">
                  <MdPreview size={40} color="#d1d3d4" />
                  <p className="font-['Montserrat',sans-serif] font-normal text-[12px] text-[#b8b8b8] text-center max-w-[220px]">
                    Preview will appear here once you select a display format.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons — full-width footer bar across the whole overlay */}
      {(() => {
        // The submit half — Send for Approval / Publish, whatever
        // submitLabel says. Shared by every footer variant that can submit.
        const submitButton = (
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={isFormValid ? handleSubmit : undefined}
              onMouseEnter={() => setIsSubmitHovered(true)}
              onMouseLeave={() => setIsSubmitHovered(false)}
              disabled={!isFormValid}
              className="rounded-[8px] px-[16px] max-sm:px-[10px] h-[32px] flex items-center justify-center gap-[8px] max-sm:gap-[6px] transition-colors duration-150"
              style={{
                backgroundColor: isFormValid ? (isSubmitHovered ? '#2C9FFF' : PRIMARY) : '#e1e3e4',
                cursor: isFormValid ? 'pointer' : 'not-allowed',
              }}
            >
              <MdSend size={17} color={isFormValid ? 'white' : '#a1a3a4'} />
              <span
                className="font-['Montserrat',sans-serif] font-medium text-[13px] max-sm:text-[12px] uppercase whitespace-nowrap"
                style={{ color: isFormValid ? 'white' : '#a1a3a4' }}
              >
                {submitLabel ?? 'Send for Approval'}
              </span>
            </button>
            {/* An empty audience takes precedence over the generic required-fields
                message: it is the more specific reason, and it is the one a
                filled-in-looking form will otherwise leave unexplained. */}
            {!isFormValid && (
              <div
                className="absolute bottom-full right-0 mb-[8px] w-max max-w-[240px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 rounded-[4px] px-[8px] py-[10px] z-50"
                style={{ backgroundColor: '#3b5c79' }}
              >
                <p className="font-['Montserrat',sans-serif] font-normal text-[12px] text-white leading-[17px]">
                  {hasNoRecipients
                    ? 'This message would reach 0 recipients. Widen the audience before sending.'
                    : hasInvalidDateRange
                      ? 'End date cannot be before the start date.'
                      : 'Please fill in all required fields to proceed'}
                </p>
              </div>
            )}
          </div>
        );

        // Always present in a Draft window / Pending review — not just once
        // something's actually been edited — same text-only treatment as
        // Delete, sitting right next to it. Reverts every field to how it
        // looked at the moment draft/review-editing began; a no-op click
        // when nothing's changed is harmless.
        const discardChangesButton = (
          <button
            type="button"
            onClick={handleDiscardChanges}
            className="flex items-center gap-[6px] shrink-0 font-['Montserrat',sans-serif] font-medium text-[13px] max-sm:text-[12px] leading-[18px] uppercase whitespace-nowrap transition-colors cursor-pointer hover:underline"
            style={{ color: '#DA4040' }}
          >
            <MdUndo size={17} color="#DA4040" />
            Discard Changes
          </button>
        );

        // Save as Draft + Submit — only for a brand-new message that has no
        // row yet, so there's no "closing saves it" to fall back on.
        const editableFooterButtons = (
          <div className="flex items-center gap-[8px] w-full justify-between">
            <button
              type="button"
              onClick={handleSaveAsDraft}
              className="rounded-[8px] px-[12px] max-sm:px-[10px] h-[32px] shrink-0 flex items-center justify-center gap-[6px] border cursor-pointer transition-colors duration-150 bg-[#e8f4ff] border-[#2699fb] text-[#2699fb] hover:bg-[#2699fb] hover:text-white"
            >
              <MdOutlineSaveAlt size={15} />
              <span className="font-['Montserrat',sans-serif] font-medium text-[13px] max-sm:text-[12px] uppercase whitespace-nowrap">
                Save as Draft
              </span>
            </button>
            {submitButton}
          </div>
        );

        // Draft mode (an existing Draft, or a discarded message mid-
        // transition into one): no separate Save as Draft — the X button
        // already saves on close — just an optional Delete and Submit.
        const draftModeFooterButtons = (
          <div className="flex items-center gap-[16px] w-full justify-between">
            <div className="flex items-center gap-[16px]">
              {onDeleteRow && (
                <button
                  type="button"
                  className="flex items-center gap-[6px] shrink-0 font-['Montserrat',sans-serif] font-medium text-[13px] max-sm:text-[12px] leading-[18px] uppercase whitespace-nowrap transition-colors cursor-pointer hover:underline"
                  style={{ color: '#DA4040' }}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <RiDeleteBinLine size={17} color="#DA4040" />
                  Delete
                </button>
              )}
              {discardChangesButton}
            </div>
            {submitButton}
          </div>
        );

        return !decisionLock && showFooter && (
          <div className="shrink-0 border-t px-[24px] max-sm:px-[16px] py-[16px] flex items-center justify-end" style={{ borderColor: BORDER, backgroundColor: 'white' }}>
            {inDraftMode ? (
              draftModeFooterButtons
            ) : onDeleteRow || onEditAsDraft ? (
              <div className={`flex items-center gap-[16px] ${onDeleteRow && onEditAsDraft ? 'w-full justify-between' : ''}`}>
                {onDeleteRow && (
                  <button
                    type="button"
                    className="flex items-center gap-[6px] shrink-0 font-['Montserrat',sans-serif] font-medium text-[13px] max-sm:text-[12px] leading-[18px] uppercase whitespace-nowrap transition-colors cursor-pointer hover:underline"
                    style={{ color: '#DA4040' }}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <RiDeleteBinLine size={17} color="#DA4040" />
                    Delete
                  </button>
                )}
                {onEditAsDraft && (
                  <button
                    type="button"
                    className="rounded-[8px] px-[12px] max-sm:px-[10px] h-[32px] shrink-0 flex items-center gap-[6px] border cursor-pointer transition-colors duration-150 bg-[#e8f4ff] border-[#2699fb] text-[#2699fb] hover:bg-[#2699fb] hover:text-white"
                    onClick={() => { onEditAsDraft(); setEditingAsDraft(true); }}
                  >
                    <MdModeEditOutline size={15} />
                    <span className="font-['Montserrat',sans-serif] font-medium text-[13px] max-sm:text-[12px] uppercase whitespace-nowrap">
                      Edit as Draft
                    </span>
                  </button>
                )}
              </div>
            ) : onApprove && onReject ? (
                /* Pushed to opposite ends of the footer: the destructive action sits
                   well away from the one people mean to hit. */
                <div className="flex items-center gap-[16px] w-full justify-between">
                  <div className="flex items-center gap-[16px]">
                    <button
                      type="button"
                      onClick={onReject}
                      className="rounded-[8px] px-[12px] max-sm:px-[10px] h-[32px] shrink-0 flex items-center gap-[6px] border cursor-pointer transition-colors duration-150 bg-[#fdeaea] border-[#DA4040] text-[#DA4040] hover:bg-[#DA4040] hover:text-white"
                    >
                      <FaRegTimesCircle size={15} />
                      <span className="font-['Montserrat',sans-serif] font-medium text-[13px] max-sm:text-[12px] uppercase whitespace-nowrap">
                        Reject
                      </span>
                    </button>
                    {discardChangesButton}
                  </div>
                  <button
                    type="button"
                    onClick={() => onApprove?.(allFormData)}
                    className="rounded-[8px] px-[16px] max-sm:px-[10px] h-[32px] shrink-0 flex items-center gap-[8px] max-sm:gap-[6px] cursor-pointer"
                    style={{ backgroundColor: '#00AA00' }}
                  >
                    <FaRegCheckCircle size={15} color="white" />
                    <span className="font-['Montserrat',sans-serif] font-medium text-[13px] max-sm:text-[12px] uppercase whitespace-nowrap" style={{ color: 'white' }}>
                      Approve
                    </span>
                  </button>
                </div>
            ) : !effectiveReadOnly ? (
              editableFooterButtons
            ) : null}
          </div>
        );
      })()}
    </div>
  );
}
