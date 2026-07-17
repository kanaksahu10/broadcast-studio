import { useEffect, useRef, useState } from 'react';
import { IoIosClose } from 'react-icons/io';
import { RiArrowDropDownFill } from 'react-icons/ri';
import { BiCalendarEvent } from 'react-icons/bi';
import { MdCheck } from 'react-icons/md';
import { HiSpeakerphone } from 'react-icons/hi';

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

/* -- Design tokens copied from the GEOH "Overlay - New Message" Figma frame -- */
const BORDER = '#cfcfcf';
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
      style={{ borderColor: BORDER, height: height ?? 70 }}
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
  return (
    <FieldShell label={label}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        className="font-['Montserrat',sans-serif] font-normal text-[13px] text-black placeholder:text-[#b8b8b8] outline-none bg-transparent w-full resize-none"
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
  return (
    <FieldShell label={label}>
      <div className="flex items-center justify-between w-full relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-transparent outline-none font-['Montserrat',sans-serif] font-normal text-[13px] w-full pr-[24px] cursor-pointer"
          style={{ color: value ? '#000000' : PLACEHOLDER }}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt} style={{ color: '#000000' }}>
              {opt}
            </option>
          ))}
        </select>
        <RiArrowDropDownFill className="absolute right-0 pointer-events-none" size={20} color={LABEL_GREY} />
      </div>
    </FieldShell>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <FieldShell label={label}>
      <div className="flex items-center justify-between w-full relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="date-input-no-native-icon font-['Montserrat',sans-serif] font-normal text-[13px] text-black outline-none bg-transparent w-full pr-[24px]"
        />
        <BiCalendarEvent className="absolute right-0 pointer-events-none" size={18} color={LABEL_GREY} />
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
            <RiArrowDropDownFill className="shrink-0" size={20} color={LABEL_GREY} />
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
        <div className="grid grid-cols-2 gap-[12px] w-full">
          <TextField label="Label" value={label} onChange={onLabelChange} placeholder="e.g. Learn More" />
          <TextField label="Destination URL" value={destination} onChange={onDestinationChange} placeholder="https://..." />
        </div>
      )}
    </div>
  );
}

export default function ComposeMessageOverlay({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [reason, setReason] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('');
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

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dismissible, setDismissible] = useState<Dismissible>('Dismissible');
  const [pushNotification, setPushNotification] = useState(false);

  const isAnnouncement = messageType === 'Announcement';
  const isEmergency = messageType === 'Emergency';

  let matching = searchMode === 'State'
    ? (statesOrAgencies.length > 0 ? AGENCIES.filter((a) => statesOrAgencies.includes(a.state)) : [])
    : (statesOrAgencies.length > 0 ? AGENCIES.filter((a) => statesOrAgencies.includes(a.name)) : []);
  if (packages.length > 0) matching = matching.filter((a) => packages.includes(a.package));
  if (roles.length > 0) matching = matching.filter((a) => roles.includes(a.role));
  const audienceCount = matching.length;

  const handleSearchModeChange = (v: string) => {
    setSearchMode(v as SearchMode);
    setStatesOrAgencies([]);
  };

  const handleSubmit = () => {
    console.log('Create Message', {
      title, body, reason, messageType, displayFormat, placement, featurePath,
      hasCta, ctaLabel, ctaDestination, searchMode, statesOrAgencies, packages, roles,
      startDate, endDate, dismissible, pushNotification,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <style>{`.date-input-no-native-icon::-webkit-calendar-picker-indicator { opacity: 0; position: absolute; right: 0; width: 24px; height: 100%; cursor: pointer; }`}</style>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[820px] max-w-full h-full bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between h-[56px] px-[16px] border-b shrink-0" style={{ borderColor: BORDER }}>
          <h2 className="font-['Montserrat',sans-serif] font-medium text-[16px] text-black">New Message</h2>
          <button type="button" onClick={onClose} className="cursor-pointer flex items-center">
            <IoIosClose size={26} color="#000000" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex gap-[32px] items-start p-[16px]">
          <div className="flex-1 min-w-0 flex flex-col gap-[24px] pl-[16px]">
            <div className="flex flex-col gap-[16px] w-full">
              <SectionHeader>Message Basics</SectionHeader>
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

            <div className="flex flex-col gap-[16px] w-full">
              <SectionHeader>Date &amp; Time</SectionHeader>
              <DateField label="Start Date *" value={startDate} onChange={setStartDate} />
              <DateField label="End Date" value={endDate} onChange={setEndDate} />
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-[24px] pr-[16px]">
            <div className="flex flex-col gap-[16px] w-full">
              <SectionHeader>Search Mode</SectionHeader>
              <RadioField label="Search By *" value={searchMode} onChange={handleSearchModeChange} options={['Agency', 'State']} />
              <MultiSelectField
                label="States / Agency *"
                values={statesOrAgencies}
                onChange={setStatesOrAgencies}
                placeholder={searchMode === 'State' ? 'Select states...' : 'Select agencies...'}
                options={searchMode === 'Agency' ? AGENCIES.map((a) => a.name) : STATES}
                caption={`${audienceCount} ${audienceCount === 1 ? 'agency' : 'agencies'} will see this message`}
              />
              <MultiSelectField label="Package" values={packages} onChange={setPackages} placeholder="Select packages..." options={PACKAGES} />
              <MultiSelectField label="Role" values={roles} onChange={setRoles} placeholder="Select roles..." options={ROLES} />
            </div>

            <div className="flex flex-col gap-[16px] w-full">
              <SectionHeader>Display Settings</SectionHeader>
              {isAnnouncement && displayFormat === 'Banner' && (
                <RadioField label="Display" value={dismissible} onChange={(v) => setDismissible(v as Dismissible)} options={['Dismissible', 'Non-Dismissible']} />
              )}
              {isAnnouncement && (
                <CtaBox
                  checked={hasCta}
                  onChange={setHasCta}
                  label={ctaLabel}
                  destination={ctaDestination}
                  onLabelChange={setCtaLabel}
                  onDestinationChange={setCtaDestination}
                />
              )}
              {isEmergency && <ToggleRow label="Also send as push notification" checked={pushNotification} onChange={setPushNotification} />}
            </div>
          </div>
        </div>

        <div className="bg-[#f8f8f8] border-t h-[60px] px-[16px] py-[13px] flex items-center justify-between shrink-0" style={{ borderColor: BORDER }}>
          <button
            type="button"
            onClick={onClose}
            className="font-['Montserrat',sans-serif] font-medium text-[14px] capitalize cursor-pointer"
            style={{ color: NAVY }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-[8px] px-[16px] py-[8px] flex items-center gap-[8px] cursor-pointer"
            style={{ backgroundColor: PRIMARY }}
          >
            <HiSpeakerphone size={17} color="white" />
            <span className="font-['Montserrat',sans-serif] font-semibold text-[14px] text-white uppercase">Create Message</span>
          </button>
        </div>
      </div>
    </div>
  );
}
