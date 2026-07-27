import { useEffect, useRef, useState } from 'react';
import { IoIosClose } from 'react-icons/io';
import { IoMdArrowDropdown } from 'react-icons/io';
import { BiCalendarEvent } from 'react-icons/bi';
import { MdCheck, MdClose, MdPreview, MdSend, MdDesktopWindows, MdPhoneIphone, MdBusiness, MdManageAccounts, MdApps } from 'react-icons/md';
import { BsPersonBadgeFill } from 'react-icons/bs';
import { FiExternalLink } from 'react-icons/fi';
import { FaRegCheckCircle } from 'react-icons/fa';
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

const FEATURE_PATHS = ['Dashboard', 'Scheduling', 'Billing', 'Clients', 'Employees', 'Broadcast Studio'];
const FREQUENCY_OPTIONS = ['Once', 'Every Login', 'Daily', 'Weekly'];
const MESSAGE_COLOR_OPTIONS = ['#DA4040', '#27496D'];

/* -- Design tokens copied from the GEOH "Overlay - New Message" Figma frame -- */
const BORDER = '#e5e5e5';
const LABEL_GREY = '#646464';
const NAVY = '#334c6d';
const PRIMARY = '#2699fb';
const PLACEHOLDER = '#b8b8b8';

function SectionHeader({ children }: { children: string }) {
  return <p className="font-['Montserrat',sans-serif] font-medium text-[14px] leading-[20px] text-black w-full">{children}</p>;
}

function FieldShell({ label, height, disabled, open, children }: { label: string; height?: number; disabled?: boolean; open?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`border px-[12px] py-[8px] flex flex-col gap-[8px] justify-center w-full ${open ? 'rounded-t-[4px]' : 'rounded-[4px]'}`}
      style={{ borderColor: BORDER, borderWidth: '1px', borderBottomWidth: open ? 0 : 1, minHeight: height ?? 70, backgroundColor: disabled ? '#f2f2f2' : 'white' }}
    >
      <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px]" style={{ color: disabled ? '#585858' : LABEL_GREY }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, disabled }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; disabled?: boolean }) {
  return (
    <FieldShell label={label} disabled={disabled}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-['Montserrat',sans-serif] font-normal text-[13px] placeholder:text-[#b8b8b8] outline-none bg-transparent w-full"
        style={{ color: '#000000' }}
      />
    </FieldShell>
  );
}

function TextAreaField({ label, value, onChange, placeholder, disabled }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; disabled?: boolean }) {
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

function DateField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const displayValue = value
    ? (() => { const [yyyy, mm, dd] = value.split('-'); return `${mm} / ${dd} / ${yyyy}`; })()
    : null;

  return (
    <FieldShell label={label} disabled={disabled}>
      <div className="flex items-center justify-between w-full relative">
        <div className="relative flex-1 pr-[24px]">
          <span
            className="font-['Montserrat',sans-serif] font-normal text-[13px] pointer-events-none select-none"
            style={{ color: value ? '#000000' : '#B8B8B8' }}
          >
            {displayValue ?? '00 / 00 / 0000'}
          </span>
          {!disabled && (
            <input
              ref={inputRef}
              type="date"
              value={value}
              min={today}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          )}
        </div>
        {!disabled && (
          <BiCalendarEvent
            className="absolute right-0 cursor-pointer"
            size={18}
            color="#27496D"
            onClick={() => (inputRef.current as any)?.showPicker?.()}
          />
        )}
      </div>
    </FieldShell>
  );
}

type MultiSelectVariant = 'agency' | 'state' | 'package' | 'role' | 'default';

function OptionIcon({ variant, name }: { variant: MultiSelectVariant; name: string }) {
  const base = 'size-[20px] rounded-full flex items-center justify-center shrink-0';
  if (variant === 'agency') return <span className={base} style={{ backgroundColor: '#2699FB' }}><MdBusiness size={11} color="white" /></span>;
  if (variant === 'role') return <span className={base} style={{ backgroundColor: '#2ECC71' }}><BsPersonBadgeFill size={11} color="white" /></span>;
  if (variant === 'package') return <span className={base} style={{ backgroundColor: '#2699FB' }}><MdApps size={11} color="white" /></span>;
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

function RadioField({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <FieldShell label={label} disabled={disabled}>
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

function ColorField({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <FieldShell label={label} disabled={disabled}>
      <div className="flex gap-[12px] items-center w-full">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="flex items-center justify-center rounded-full cursor-pointer shrink-0"
            style={{
              width: 26,
              height: 26,
              backgroundColor: opt,
              boxShadow: value === opt ? `0 0 0 2px #ffffff, 0 0 0 4px ${opt}` : 'none',
            }}
            aria-label={opt}
          >
            {value === opt && <MdCheck size={14} color="white" />}
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

function ToggleRow({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="border rounded-[4px] px-[12px] py-[16px] flex items-center justify-between w-full" style={{ borderColor: BORDER, backgroundColor: disabled ? '#f2f2f2' : '#fcfcfc' }}>
      <p className="font-['Montserrat',sans-serif] font-semibold text-[13px] leading-[18px]" style={{ color: NAVY }}>
        {label}
      </p>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function CtaBox({ checked, onChange, label, destination, onLabelChange, onDestinationChange, disabled }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  destination: string;
  onLabelChange: (v: string) => void;
  onDestinationChange: (v: string) => void;
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
          <TextAreaField label="Label *" value={label} onChange={onLabelChange} placeholder="Link text shown in banner & overlay" disabled={disabled} />
          <TextField label="Destination URL *" value={destination} onChange={onDestinationChange} placeholder="https://..." disabled={disabled} />
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
  widthClass = 'w-[320px]',
  compact = false,
}: {
  title: string;
  body: string;
  dismissible: boolean;
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
      {dismissible && (
        <div className={`flex items-center justify-between gap-[8px] ${compact ? 'px-[12px] py-[8px]' : 'px-[16px] py-[10px]'} border-t shrink-0`} style={{ borderColor: BORDER, backgroundColor: '#fafafa' }}>
          <span className={`font-['Montserrat',sans-serif] font-medium ${compact ? 'text-[8px] tracking-normal' : 'text-[11px] tracking-wide'} uppercase whitespace-nowrap cursor-pointer`} style={{ color: NAVY }}>
            Don't show again
          </span>
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

export function PhoneSkeleton({
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
    <div className="w-full h-full flex items-center justify-center">
      <div
        className="relative bg-white rounded-[28px] overflow-hidden flex flex-col shadow-lg shrink-0"
        style={{ width: 260, height: '100%', maxHeight: 520, border: '6px solid #2b2b2b', borderColor: '#2b2b2b' }}
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
          {/* Select All + record cards, mobile's substitute for the datagrid */}
          <div className="rounded-[8px] border flex items-center justify-between px-[10px] py-[8px] shrink-0" style={{ borderColor: BORDER }}>
            <SkeletonBar width="30%" height={8} color="#c7c7c7" />
            <CheckboxSkeleton />
          </div>
          <PhoneDataCard />
          <PhoneDataCard />
        </div>

        {effectiveFormat === 'Overlay' && (
          <div className="absolute inset-0 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
            <OverlayPreview
              title={title}
              body={body}
              dismissible={dismissible}
              hasCta={hasCta}
              ctaLabel={ctaLabel}
              rounded={false}
              widthClass="w-[80%]"
              compact
            />
          </div>
        )}

        {effectiveFormat === 'Banner' && (
          <div className="absolute left-0 right-0 bottom-0">
            <BannerPreview body={body} color={color} dismissible={dismissible} hasCta={hasCta} ctaLabel={ctaLabel} rounded={false} />
          </div>
        )}
      </div>
    </div>
  );
}

type FormData = {
  title?: string;
  messageType?: string;
  startDate?: string;
  endDate?: string;
  body?: string;
  reason?: string;
  displayFormat?: string;
  placement?: string;
  featurePath?: string;
  messageColor?: string;
  frequency?: string;
  searchMode?: string;
  statesOrAgencies?: string[];
  packages?: string[];
  roles?: string[];
  dismissible?: string;
  hasCta?: boolean;
  ctaLabel?: string;
  ctaDestination?: string;
  pushNotification?: boolean;
};

export default function ComposeMessageOverlay({ onClose, onMessageCreated, onSaveAsDraft, initialData, submitLabel, overlayTitle, readOnly, onApprove, onReject }: {
  onClose: () => void;
  onMessageCreated?: (data: FormData) => void;
  onSaveAsDraft?: (data: FormData) => void;
  initialData?: FormData;
  submitLabel?: string;
  overlayTitle?: string;
  readOnly?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [body, setBody] = useState(initialData?.body ?? '');
  const [reason, setReason] = useState(initialData?.reason ?? '');
  const [messageType, setMessageType] = useState<MessageType>((initialData?.messageType as MessageType) ?? '');
  const [messageColor, setMessageColor] = useState(initialData?.messageColor ?? MESSAGE_COLOR_OPTIONS[1]);
  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>((initialData?.displayFormat as DisplayFormat) ?? '');
  const [placement, setPlacement] = useState<Placement>((initialData?.placement as Placement) ?? '');
  const [featurePath, setFeaturePath] = useState(initialData?.featurePath ?? '');
  const [hasCta, setHasCta] = useState(initialData?.hasCta ?? false);
  const [ctaLabel, setCtaLabel] = useState(initialData?.ctaLabel ?? '');
  const [ctaDestination, setCtaDestination] = useState(initialData?.ctaDestination ?? '');

  const [searchMode, setSearchMode] = useState<SearchMode>((initialData?.searchMode as SearchMode) ?? 'Agency');
  const [statesOrAgencies, setStatesOrAgencies] = useState<string[]>(initialData?.statesOrAgencies ?? []);
  const [packages, setPackages] = useState<string[]>(initialData?.packages ?? []);
  const [roles, setRoles] = useState<string[]>(initialData?.roles ?? []);

  const [startDate, setStartDate] = useState(initialData?.startDate ?? '');
  const [endDate, setEndDate] = useState(initialData?.endDate ?? '');
  const [frequency, setFrequency] = useState(initialData?.frequency ?? '');
  const [dismissible, setDismissible] = useState<Dismissible>((initialData?.dismissible as Dismissible) ?? 'Dismissible');
  const [pushNotification, setPushNotification] = useState(initialData?.pushNotification ?? false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'phone'>('desktop');

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
    (!hasCta || (ctaLabel.trim() !== '' && ctaDestination.trim() !== '')) &&
    (messageType !== 'Announcement' || (
      displayFormat !== '' &&
      placement !== '' &&
      (placement !== 'Feature Specific' || featurePath !== '')
    ));

  const handleSearchModeChange = (v: string) => {
    setSearchMode(v as SearchMode);
    setStatesOrAgencies([]);
  };

  const allFormData: FormData = { title, messageType, startDate, endDate, body, reason, displayFormat, placement, featurePath, messageColor, frequency, searchMode, statesOrAgencies, packages, roles, dismissible, hasCta, ctaLabel, ctaDestination, pushNotification };

  const handleSubmit = () => {
    onMessageCreated?.(allFormData);
    onClose();
  };

  const handleSaveAsDraft = () => {
    onSaveAsDraft?.(allFormData);
    onClose();
  };

  const effectiveFormat: DisplayFormat = isEmergency ? 'Banner' : isAnnouncement ? displayFormat : '';
  const effectiveDismissible = isEmergency ? false : dismissible === 'Dismissible';
  const effectiveBannerColor = isEmergency ? '#DA4040' : messageColor;
  const hasPreview = effectiveFormat !== '';

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <style>{`.date-input-no-native-icon::-webkit-calendar-picker-indicator { opacity: 0; position: absolute; right: 0; width: 24px; height: 100%; cursor: pointer; }`}</style>

      {/* Top header bar */}
      <div className="flex items-center justify-between h-[56px] px-[24px] border-b shrink-0" style={{ borderColor: BORDER }}>
        <h2 className="font-['Montserrat',sans-serif] font-semibold text-[16px] text-black">{overlayTitle ?? 'New Message'}</h2>
        <button type="button" onClick={onClose} className="cursor-pointer flex items-center">
          <IoIosClose size={26} color="#27496D" />
        </button>
      </div>

      {/* Body: left form + right preview */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT — scrollable form, fixed 399px */}
        <div style={{ width: '399px', minWidth: '399px', maxWidth: '399px', overflowY: 'auto', borderRight: `1px solid ${BORDER}`, position: 'relative' }} className="p-[24px] flex flex-col gap-[16px]">
          {readOnly && <div style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'default' }} />}

          {/* Message Details card */}
          <div className="bg-white rounded-[8px] border flex flex-col gap-[16px] p-[20px]" style={{ borderColor: BORDER }}>
            <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">Message Details</p>
            <SelectField label="Message Type *" value={messageType} onChange={(v) => setMessageType(v as MessageType)} placeholder="Select message type..." options={['Announcement', 'Emergency']} disabled={readOnly} />
            {isEmergency && (
              <p className="font-['Montserrat',sans-serif] font-normal text-[12px] mt-[-12px]" style={{ color: '#B8B8B8' }}>
                Emergency messages are always sent as a non-dismissible, app-wide red banner.
              </p>
            )}
            {isAnnouncement && (
              <>
                <SelectField label="Display Format *" value={displayFormat} onChange={(v) => setDisplayFormat(v as DisplayFormat)} placeholder="Select display format..." options={['Overlay', 'Banner']} disabled={readOnly} />
                {displayFormat === 'Banner' && (
                  <ColorField label="Message Color" value={messageColor} onChange={setMessageColor} options={MESSAGE_COLOR_OPTIONS} disabled={readOnly} />
                )}
                <SelectField label="Placement *" value={placement} onChange={(v) => setPlacement(v as Placement)} placeholder="Select placement..." options={['App-wide', 'Feature Specific']} disabled={readOnly} />
                {placement === 'Feature Specific' && (
                  <SelectField label="Feature Path *" value={featurePath} onChange={setFeaturePath} placeholder="Select a feature..." options={FEATURE_PATHS} disabled={readOnly} />
                )}
              </>
            )}
            <TextField label="Message Title *" value={title} onChange={setTitle} placeholder="Shows in overlay & list" disabled={readOnly} />
            <TextAreaField label="Message Body *" value={body} onChange={setBody} placeholder="Shows in banner & overlay" disabled={readOnly} />
            <TextField label="Message Reason *" value={reason} onChange={setReason} placeholder="Internal only, not shown to users" disabled={readOnly} />
          </div>

          {/* Date & Time card */}
          <div className="bg-white rounded-[8px] border flex flex-col gap-[16px] p-[20px]" style={{ borderColor: BORDER }}>
            <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">Date &amp; Time</p>
            <DateField label="Start Date *" value={startDate} onChange={setStartDate} disabled={readOnly} />
            <DateField label="End Date" value={endDate} onChange={setEndDate} disabled={readOnly} />
            <SelectField label="Frequency *" value={frequency} onChange={setFrequency} placeholder="Select frequency..." options={FREQUENCY_OPTIONS} disabled={readOnly} />
          </div>

          {/* Audience card */}
          <div className="bg-white rounded-[8px] border flex flex-col gap-[16px] p-[20px]" style={{ borderColor: BORDER }}>
            <div className="flex flex-wrap items-center justify-between gap-x-[8px] gap-y-[2px]">
              <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">Audience</p>
              <span className="font-['Montserrat',sans-serif] font-medium text-[12px] shrink-0" style={{ color: NAVY }}>
                {audienceCount} {audienceCount === 1 ? 'recipient' : 'recipients'} will see this message
              </span>
            </div>
            <RadioField label="Search By *" value={searchMode} onChange={handleSearchModeChange} options={['Agency', 'State']} disabled={readOnly} />
            <MultiSelectField
              label={searchMode === 'Agency' ? 'Agency *' : 'State *'}
              values={statesOrAgencies}
              onChange={setStatesOrAgencies}
              placeholder={searchMode === 'State' ? 'Select states...' : 'Select agencies...'}
              options={searchMode === 'Agency' ? AGENCIES.map((a) => a.name) : STATES}
              disabled={readOnly}
              variant={searchMode === 'Agency' ? 'agency' : 'state'}
            />
            <MultiSelectField label="Package" values={packages} onChange={setPackages} placeholder="Select packages..." options={PACKAGES} disabled={readOnly} variant="package" />
            <MultiSelectField label="Role" values={roles} onChange={setRoles} placeholder="Select roles..." options={ROLES} disabled={readOnly} variant="role" />
          </div>

          {/* Display Settings card */}
          <div className="bg-white rounded-[8px] border flex flex-col gap-[16px] p-[20px]" style={{ borderColor: BORDER }}>
            <p className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-black">Display Settings</p>
            {!isEmergency && (
              <RadioField label="Display" value={dismissible} onChange={(v) => setDismissible(v as Dismissible)} options={['Dismissible', 'Non-Dismissible']} disabled={readOnly} />
            )}
            <CtaBox
              checked={hasCta}
              onChange={setHasCta}
              label={ctaLabel}
              destination={ctaDestination}
              onLabelChange={setCtaLabel}
              onDestinationChange={setCtaDestination}
              disabled={readOnly}
            />
            {isEmergency && <ToggleRow label="Also send as push notification" checked={pushNotification} onChange={setPushNotification} disabled={readOnly} />}
          </div>
        </div>

        {/* RIGHT — preview + actions */}
        <div style={{ flex: 1, minWidth: 0, backgroundColor: '#f8f8f8' }} className="flex flex-col p-[24px] gap-[16px]">
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
                    <div className="w-full h-full flex justify-center rounded-[6px]" style={{ backgroundColor: '#f0f0f0' }}>
                      <div style={{ aspectRatio: '16 / 10', height: '100%', maxWidth: '100%' }}>
                        <ScreenSkeleton
                          effectiveFormat={effectiveFormat}
                          title={title}
                          body={body}
                          color={effectiveBannerColor}
                          dismissible={effectiveDismissible}
                          hasCta={hasCta}
                          ctaLabel={ctaLabel}
                        />
                      </div>
                    </div>
                  ) : (
                    <PhoneSkeleton
                      effectiveFormat={effectiveFormat}
                      title={title}
                      body={body}
                      color={effectiveBannerColor}
                      dismissible={effectiveDismissible}
                      hasCta={hasCta}
                      ctaLabel={ctaLabel}
                    />
                  )}
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
            {onApprove && onReject ? (
                <div className="flex items-center gap-[8px]">
                  <button
                    type="button"
                    onClick={onReject}
                    className="rounded-[8px] px-[12px] h-[32px] flex items-center gap-[4px] border cursor-pointer"
                    style={{ backgroundColor: '#fdeaea', borderColor: '#DA4040', borderWidth: '1px' }}
                  >
                    <span className="font-['Montserrat',sans-serif] font-medium text-[13px] uppercase" style={{ color: '#DA4040' }}>
                      Reject
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={onApprove}
                    className="rounded-[8px] px-[16px] h-[32px] flex items-center gap-[8px] cursor-pointer"
                    style={{ backgroundColor: '#00AA00' }}
                  >
                    <FaRegCheckCircle size={15} color="white" />
                    <span className="font-['Montserrat',sans-serif] font-medium text-[13px] uppercase" style={{ color: 'white' }}>
                      Approve
                    </span>
                  </button>
                </div>
            ) : !readOnly ? (
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
                <div className="relative group">
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
                      {submitLabel ?? 'Send for Approval'}
                    </span>
                  </button>
                  {!isFormValid && (
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[8px] w-max max-w-[220px] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 rounded-[4px] px-[8px] py-[10px] z-50"
                      style={{ backgroundColor: '#3b5c79' }}
                    >
                      <p className="font-['Montserrat',sans-serif] font-medium text-[12px] text-white leading-[17px]">
                        Please fill in all required fields to proceed
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
