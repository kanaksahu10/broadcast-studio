import svgPaths from "./svg-jma1wy0ilh";
import imgScreenshot20240618At20235Pm1 from "./dcdc59835f187ae19236b83cdd1533e8913f460f.png";
import { FiTarget } from 'react-icons/fi';
import { BsThreeDotsVertical, BsPlus } from 'react-icons/bs';
import { RiTeamLine, RiFileListLine } from 'react-icons/ri';
import { BiBuildings } from 'react-icons/bi';
import { GrAnnounce } from 'react-icons/gr';
import { MdInsights, MdArrowBack } from 'react-icons/md';
import { TbZoomCode } from 'react-icons/tb';
import { AiOutlineForm } from 'react-icons/ai';
import { PiPlugs } from 'react-icons/pi';
import { LuReceipt } from 'react-icons/lu';
import TopbarSearch from '../TopbarSearch/TopbarSearch';
import NotificationPanel from '../NotificationPanel-1/NotificationPanel-29-20200';
import { useState, useRef, useEffect } from 'react';
import kebabSvgPaths from '../Menus/svg-duzgfqtilr';
import BroadcastStudioDashboard from './BroadcastStudioDashboard';
import { useRole, getUserIdentity, type UserIdentity } from './userIdentity';

interface GoalTemplate {
  id: string;
  goalName: string;
  category: string;
  description: string;
  strategies: number;
  visitTypes: string;
  usedBy: string;
}

interface SavedGoal {
  id: string;
  goalName: string;
  description: string;
}

interface BroadcastStudioProps {
  goalTemplates?: GoalTemplate[];
}

function KebabMenu({
  isOpen,
  onClose,
  onEdit,
  onDelete
}: {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={`absolute bg-white drop-shadow-[0px_4px_2px_rgba(0,0,0,0.08)] flex flex-col items-start rounded-[4px] z-[100] left-full top-0 ml-1 transition-all ${
        isOpen ? 'duration-150 ease-out opacity-100 translate-x-0' : 'duration-150 ease-in opacity-0 -translate-x-1'
      }`}
      style={{ minWidth: '120px' }}
      data-name="Menus"
    >
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-[-1px] pointer-events-none rounded-[5px]" />
      <button
        onClick={() => {
          onEdit();
          onClose();
        }}
        className="bg-white relative rounded-[4px] shrink-0 w-full hover:bg-gray-50 cursor-pointer"
        data-name="Dropdowns Items"
      >
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex gap-[8px] items-center pb-[8px] pt-[12px] px-[16px] relative size-full">
            <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
              <div className="relative shrink-0 size-[16px]" data-name="react-icons/md/MdOutlineModeEditOutline">
                <div className="absolute inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Vector">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.0016 12.0016">
                    <path d={kebabSvgPaths.p2689a480} fill="var(--fill-0, #27496D)" id="Vector" />
                  </svg>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[2px] items-start justify-center relative shrink-0">
                <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#1d3557] text-[14px] whitespace-nowrap">
                  <p className="leading-[17px]">Edit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="bg-white relative rounded-[4px] shrink-0 w-full hover:bg-gray-50 cursor-pointer"
        data-name="Dropdowns Items"
      >
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex gap-[8px] items-center pb-[12px] pt-[8px] px-[16px] relative size-full">
            <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
              <div className="relative shrink-0 size-[16px]" data-name="react-icons/md/MdDeleteOutline">
                <div className="absolute inset-[12.5%_20.83%]" data-name="Vector">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 12">
                    <path d={kebabSvgPaths.p37a0a400} fill="var(--fill-0, #27496D)" id="Vector" />
                  </svg>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[2px] items-start justify-center relative shrink-0">
                <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#1d3557] text-[14px] whitespace-nowrap">
                  <p className="leading-[17px]">Delete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

function TopBar({ onHamburgerClick, sidebarCollapsed, identity }: { onHamburgerClick: () => void; sidebarCollapsed: boolean; identity: UserIdentity }) {
  // Split into three independently-stacked pieces instead of one flex row —
  // a single shared z-index can't let part of a row sink below the scrim
  // while another part stays above it, since z-index only resolves within
  // the nearest stacking context (here, whatever container each piece is
  // absolutely positioned against, not their old shared parent).
  return (
    <>
      {/* Logo + Hamburger — same width as the sidebar, same z-40 tier, no
          bottom border — grouped with the sidebar as one seamless panel
          rather than a separate topbar segment sitting above it. */}
      <div
        data-name="Top Bar"
        className={`absolute top-0 left-0 h-[59px] bg-white z-40 flex items-center px-[16px] shrink-0 transition-[width] duration-200 ${sidebarCollapsed ? 'w-[69px] justify-center' : 'w-[329px] justify-between'}`}
      >
        {!sidebarCollapsed && <Logo />}
        <button onClick={onHamburgerClick} className="p-0 bg-transparent border-0 cursor-pointer flex items-center justify-center">
          <svg fill="none" viewBox="0 0 14.2642 10.5" className="w-[14px] h-[11px]">
            <path d={svgPaths.p15f65700} fill="#334D6E" />
          </svg>
        </button>
      </div>
      {/* Search — normal topbar tier (z-10), so on tablet/mobile it sinks
          behind the sidebar's blurred scrim along with the rest of the
          page, instead of floating above it. */}
      <div
        className={`absolute top-0 right-[60px] h-[59px] bg-white border-b border-[#dfdfdf] z-10 flex items-center px-[16px] transition-[left] duration-200 max-lg:!left-[69px] ${sidebarCollapsed ? 'lg:left-[69px]' : 'lg:left-[329px]'}`}
      >
        <TopbarSearch />
      </div>
      {/* User avatar — stays reachable above the scrim, like the sidebar's
          own logo/hamburger corner. */}
      <div className="absolute top-0 right-0 flex items-center justify-center w-[60px] h-[59px] bg-white border-l border-[#e5e5e5] border-b border-b-[#dfdfdf] z-40 shrink-0">
        <div className="relative rounded-full size-[32px] flex items-center justify-center" style={{ backgroundColor: identity.avatarColor }}>
          <span className="font-['Montserrat',sans-serif] font-medium text-[12px] text-white">{identity.initials}</span>
          <div className="absolute bg-white drop-shadow-[0px_2px_2px_rgba(0,0,0,0.08)] rounded-full size-[14px] -bottom-[3px] -right-[3px] flex items-center justify-center">
            <svg viewBox="0 0 6 3" className="w-[6px] h-[3px]">
              <path d="M0 0L3 3L6 0H0Z" fill="black" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}

function Logo() {
  return (
    <div className="h-[19.077px] relative shrink-0 w-[50.009px]" data-name="Logo">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 50.0086 19.0766">
        <g id="Logo">
          <path d={svgPaths.p527a80} fill="var(--fill-0, #464749)" id="Path 3" />
          <path d={svgPaths.p2a345f0} fill="var(--fill-0, #464749)" id="Path 4" />
          <path d={svgPaths.p1c6c8200} fill="var(--fill-0, #464749)" id="Path 5" />
          <path d={svgPaths.p32c1f600} fill="var(--fill-0, #464749)" id="Path 6" />
          <path d={svgPaths.p3a342300} fill="var(--fill-0, #8FBD28)" id="Path 7" />
          <path clipRule="evenodd" d={svgPaths.p29ab2d00} fill="var(--fill-0, #AEB0B3)" fillRule="evenodd" id="Path 8" />
          <path d={svgPaths.p13707400} fill="var(--fill-0, #464749)" id="Path 9" />
        </g>
      </svg>
    </div>
  );
}

function Header() {
  return (
    <div className="bg-white relative shrink-0 w-full" data-name="Header">
      <div aria-hidden="true" className="absolute border-[#dfdfdf] border-b border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[214px] items-center px-[16px] relative size-full">
          <Logo />
          <div className="h-[59px] relative shrink-0 w-[48px]" data-name="Hamburger_Button">
            <div className="overflow-clip relative rounded-[inherit] size-full">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48 59">
                <path d="M48 0H0V59H48V0Z" fill="var(--fill-0, white)" id="Background" />
              </svg>
              <div className="absolute inset-[40.68%_34.43%_41.52%_35.85%]" data-name="Hamburger Icon">
                <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.2642 10.5">
                  <path d={svgPaths.p15f65700} fill="var(--fill-0, #334D6E)" id="Hamburger Icon" />
                </svg>
              </div>
            </div>
            <div aria-hidden="true" className="absolute border-[#dfdfdf] border-b border-solid inset-0 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MinWidth() {
  return <div className="relative size-[40px]" data-name="min-width" />;
}

function Frame1({ identity }: { identity: UserIdentity }) {
  return (
    <div className="content-stretch flex flex-col font-['Montserrat',sans-serif] font-normal items-start leading-[0] not-italic relative shrink-0 w-[132px]">
      <div className="flex flex-col justify-center relative shrink-0 text-[#334c6d] text-[12px] w-full">
        <p className="leading-[17px]">GEOH Demonstration</p>
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[16px] text-black w-full">
        <p className="leading-[22px] whitespace-nowrap">{identity.name}</p>
      </div>
    </div>
  );
}

function Frame2({ identity }: { identity: UserIdentity }) {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <div className="content-stretch flex flex-col items-center justify-center relative rounded-[8px] shrink-0 size-[48px]" data-name="Avatar" style={{ backgroundColor: identity.avatarColor }}>
        <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] left-1/2 not-italic text-[19px] text-center text-white top-[calc(50%+0.5px)] whitespace-nowrap">
          <p className="leading-[25px]">{identity.initials}</p>
        </div>
        <div className="flex items-center justify-center relative shrink-0 size-[40px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "0" } as React.CSSProperties}>
          <div className="-rotate-90 flex-none">
            <MinWidth />
          </div>
        </div>
      </div>
      <Frame1 identity={identity} />
    </div>
  );
}

function Frame3({ identity }: { identity: UserIdentity }) {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Frame2 identity={identity} />
      <div className="relative shrink-0 size-[21px]" data-name="react-icons/io/IoMdArrowDropdown">
        <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.5 5.25">
            <path d="M0 0L5.25 5.25L10.5 0H0Z" fill="var(--fill-0, black)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex gap-[12px] items-start leading-[0] not-italic relative shrink-0 text-[12px] w-[191px] whitespace-nowrap">
      <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center relative shrink-0 text-[#334c6d]">
        <p className="leading-[17px]">Group:</p>
      </div>
      <div className="flex flex-col font-['Montserrat',sans-serif] font-normal justify-center relative shrink-0 text-black">
        <p className="leading-[17px]">GEOH</p>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <Frame6 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Frame5 />
      <div className="relative shrink-0 size-[21px]" data-name="react-icons/io/IoMdArrowDropdown">
        <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.5 5.25">
            <path d="M0 0L5.25 5.25L10.5 0H0Z" fill="var(--fill-0, black)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/bs/BsPersonBadge">
        <div className="absolute inset-[12.5%_31.25%_31.25%_31.25%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.625 12.9375">
            <path d={svgPaths.p1a128100} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
        <div className="absolute inset-[0_12.5%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.25 23">
            <path d={svgPaths.p11766b00} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] text-left whitespace-nowrap">Super Administrator</p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[17.25px]" data-name="react-icons/ri/RiDashboardFill">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.25 17.25">
          <g id="Group">
            <path d={svgPaths.p359abb00} fill="var(--fill-0, #27496D)" id="Vector" />
          </g>
        </svg>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] text-left whitespace-nowrap">Dashboard</p>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/md/MdListAlt">
        <div className="absolute inset-[12.5%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.25 17.25">
            <path d={svgPaths.p1b183a00} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] text-left whitespace-nowrap">Operations</p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/io/IoMdCalendar">
        <div className="absolute inset-[12.5%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.2505 17.25">
            <path d={svgPaths.p20c49f0} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] text-left whitespace-nowrap">Scheduling</p>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/md/MdOutlinePayments">
        <div className="absolute inset-[16.67%_4.17%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.0833 15.3333">
            <path d={svgPaths.p17477b00} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] text-left whitespace-nowrap">Payroll</p>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <LuReceipt className="shrink-0 text-[#334c6d]" size={23} />
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#334c6d] text-[14px] text-left whitespace-nowrap">Billing</p>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/ri/RiUserLocationLine">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23 23">
          <g id="Group">
            <g id="Vector" />
            <path d={svgPaths.p9a91480} fill="var(--fill-0, #27496D)" id="Vector_2" />
          </g>
        </svg>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] text-left whitespace-nowrap">Clients</p>
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/ri/RiUserHeartLine">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23 23">
          <g id="Group">
            <g id="Vector" />
            <path d={svgPaths.p1792ed00} fill="var(--fill-0, #27496D)" id="Vector_2" />
          </g>
        </svg>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] text-left whitespace-nowrap">Employees</p>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/bi/BiDollar">
        <div className="absolute bottom-[8.33%] left-1/4 right-1/4 top-[8.33%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.5 19.1667">
            <path d={svgPaths.p3d005d00} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#334c6d] text-[14px] text-left whitespace-nowrap">Smart Billing</p>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/md/MdAddchart">
        <div className="absolute inset-[8.33%_8.33%_12.5%_12.5%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.2083 18.2083">
            <path d={svgPaths.p16da6b30} fill="var(--fill-0, #334C6D)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] text-left whitespace-nowrap">Reporting</p>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="overflow-clip relative shrink-0 size-[23px]" data-name="react-icons/MdOutlineFax">
        <div className="absolute inset-[16.67%_8.33%_12.5%_8.33%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.1667 16.2917">
            <path d={svgPaths.pf6917b0} fill="var(--fill-0, #334C6D)" id="Vector" />
          </svg>
        </div>
        <div className="absolute bottom-[41.67%] left-[58.33%] right-[33.33%] top-1/2" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.91667 1.91667">
            <path d={svgPaths.p6dccf00} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
        <div className="absolute bottom-[41.67%] left-[70.83%] right-[20.83%] top-1/2" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.91667 1.91667">
            <path d={svgPaths.p6dccf00} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
        <div className="absolute inset-[62.5%_33.33%_29.17%_58.33%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.91667 1.91667">
            <path d={svgPaths.p6dccf00} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
        <div className="absolute inset-[62.5%_20.83%_29.17%_70.83%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.91667 1.91667">
            <path d={svgPaths.p6dccf00} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
        <div className="absolute bottom-[29.17%] left-[37.5%] right-[45.83%] top-1/2" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.83333 4.79167">
            <path d="M0 0H3.83333V4.79167H0V0Z" fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] text-left whitespace-nowrap">Fax</p>
    </div>
  );
}

function Frame18({ isExpanded = false }: { isExpanded?: boolean }) {
  return (
    <div className={`content-stretch flex items-center relative shrink-0 ${isExpanded ? 'gap-[9px]' : 'gap-[8px]'}`}>
      {isExpanded && (
        <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
      )}
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/md/MdBusiness">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="Vector" />
        </svg>
        <div className="absolute inset-[12.5%_8.33%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.1667 17.25">
            <path d={svgPaths.p3e8e5900} fill="var(--fill-0, #334C6D)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className={`font-['Montserrat',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] text-left whitespace-nowrap ${
        isExpanded ? 'font-bold' : 'font-normal'
      }`}>Agency Management</p>
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/bi/BiPurchaseTagAlt">
        <div className="absolute inset-[8.33%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.1669 19.1677">
            <path d={svgPaths.p1e234770} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
        <div className="absolute inset-[27.94%_58.33%_58.33%_27.94%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.15675 3.15675">
            <path d={svgPaths.pa5d480} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Visit Types</p>
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
      <Frame20 />
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/ri/RiServiceLine">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23 23">
          <g id="Group">
            <g id="Vector" />
            <path d={svgPaths.p1d674b80} fill="var(--fill-0, #27496D)" id="Vector_2" />
          </g>
        </svg>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Tasks</p>
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
      <Frame22 />
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
      <FiTarget className="relative shrink-0 size-[23px]" color="#27496D" />
      <p className="font-['Montserrat',sans-serif] font-bold leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Goal Templates</p>
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <div className="bg-[#0078d4] h-[45px] relative shrink-0 w-[4px]" />
      <Frame24 />
    </div>
  );
}

function Frame26() {
  return (
    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/ri/RiUserStarLine">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23 23">
          <g id="Group">
            <g id="Vector" />
            <path d={svgPaths.p1583bc80} fill="var(--fill-0, #334C6D)" id="Vector_2" />
          </g>
        </svg>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Case Managers</p>
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
      <Frame26 />
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/ri/RiUser2Line">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23 23">
          <g id="Group">
            <g id="Vector" />
            <path d={svgPaths.p14406300} fill="var(--fill-0, #334C6D)" id="Vector_2" />
          </g>
        </svg>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Physicians</p>
    </div>
  );
}

function Frame27() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
      <Frame28 />
    </div>
  );
}

function Frame30() {
  return (
    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/ri/RiBuilding4Line">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23 23">
          <g id="Group">
            <g id="Vector" />
            <path d={svgPaths.pce38080} fill="var(--fill-0, #334C6D)" id="Vector_2" />
          </g>
        </svg>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Case Management Offices</p>
    </div>
  );
}

function Frame29() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
      <Frame30 />
    </div>
  );
}

function Frame32() {
  return (
    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/ri/RiFileChartLine">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23 23">
          <g id="Group">
            <g id="Vector" />
            <path d={svgPaths.p3dd70e00} fill="var(--fill-0, #334C6D)" id="Vector_2" />
          </g>
        </svg>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Reporting</p>
    </div>
  );
}

function Frame31() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
      <Frame32 />
    </div>
  );
}

function Frame34() {
  return (
    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/md/MdOutlineFolderOpen">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="Vector" />
        </svg>
        <div className="absolute inset-[16.67%_8.33%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.1667 15.3333">
            <path d={svgPaths.p36a206f0} fill="var(--fill-0, #334C6D)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Documents</p>
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
      <Frame34 />
    </div>
  );
}

function Frame36() {
  return (
    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/ai/AiOutlineIdcard">
        <div className="absolute inset-[15.63%_6.25%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20.125 15.8125">
            <path d={svgPaths.pfd3e0f0} fill="var(--fill-0, #334C6D)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">{`Role List `}</p>
    </div>
  );
}

function Frame35() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
      <Frame36 />
    </div>
  );
}

function Frame38() {
  return (
    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/bs/BsPlug">
        <div className="absolute bottom-0 left-[12.5%] right-1/4 top-0" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.375 23">
            <path d={svgPaths.p28925780} fill="var(--fill-0, #334C6D)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Service Connections</p>
    </div>
  );
}

function Frame37() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
      <Frame38 />
    </div>
  );
}

function Frame40() {
  return (
    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/ri/RiSettings5Line">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.1719 19.1719">
          <g id="Group">
            <path d={svgPaths.p1792bd80} fill="var(--fill-0, #334C6D)" id="Vector" />
          </g>
        </svg>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Agency Settings</p>
    </div>
  );
}

function Frame39() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
      <Frame40 />
    </div>
  );
}

function Frame41() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/ri/RiAccountCircleLine">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.1667 19.1667">
          <g id="Group">
            <path d={svgPaths.p81bb000} fill="var(--fill-0, #27496D)" id="Vector" />
          </g>
        </svg>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] text-left whitespace-nowrap">My Account</p>
    </div>
  );
}

function Frame42() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[23px]" data-name="react-icons/ri/RiLifebuoyLine">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23 23">
          <g id="Group">
            <g id="Vector" />
            <path d={svgPaths.p23930080} fill="var(--fill-0, #27496D)" id="Vector_2" />
          </g>
        </svg>
      </div>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Help Center</p>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-white content-stretch flex gap-[8px] items-center px-[13px] py-[10px] relative rounded-[4px] shrink-0 w-[302px]" data-name="Input">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="relative shrink-0 size-[12px]" data-name="Icon">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <g id="Group">
            <g id="Vector" />
            <path d={svgPaths.pf0e2700} fill="var(--fill-0, #C3C3C3)" id="Vector_2" />
          </g>
        </svg>
      </div>
      <div className="flex flex-col font-['Montserrat',sans-serif] font-normal font-normal justify-center leading-[0] relative shrink-0 text-[#b8b8b8] text-[14px] whitespace-nowrap">
        <p className="leading-[normal]">Search for goals by keyword....</p>
      </div>
    </div>
  );
}

function Container1({ selectedCount, onReassign }: { selectedCount: number; onReassign: () => void }) {
  const isReassignEnabled = selectedCount > 0;
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Container">
      <Input />
      <div className="content-stretch flex gap-[4px] items-center relative rounded-[8px] shrink-0" data-name="Badge Button">
        <div className="relative shrink-0 size-[17px]" data-name="react-icons/ri/RiDeleteBinLine">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.1667 14.1667">
            <g id="Group">
              <path d={svgPaths.p344c9c0} fill="var(--fill-0, #A1A3A4)" id="Vector" />
            </g>
          </svg>
        </div>
      </div>
      <button
        type="button"
        onClick={isReassignEnabled ? onReassign : undefined}
        disabled={!isReassignEnabled}
        className={`content-stretch flex gap-[4px] items-center relative rounded-[8px] shrink-0 bg-transparent border-0 p-0 ${
          isReassignEnabled ? 'cursor-pointer' : 'cursor-default'
        }`}
        data-name="Reassign Button"
      >
        <div className="relative shrink-0 size-[17px]" data-name="react-icons/ri/RiArrowLeftRightFill">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
            <g id="Group">
              <g id="Vector" />
              <path
                d={svgPaths.p1dba0a80}
                fill={isReassignEnabled ? 'var(--fill-0, #27496D)' : 'var(--fill-0, #A1A3A4)'}
                id="Vector_2"
              />
            </g>
          </svg>
        </div>
        <div className={`flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-right whitespace-nowrap ${
          isReassignEnabled ? 'text-[#27496d]' : 'text-[#a1a3a4]'
        }`}>
          <p className="leading-[18px]">REASSIGN</p>
        </div>
      </button>
      <div className="content-stretch flex gap-[4px] items-center relative rounded-[8px] shrink-0" data-name="Badge Button">
        <div className="overflow-clip relative shrink-0 size-[17px]" data-name="layout-grid">
          <div className="absolute inset-[16.67%]" data-name="Vector">
            <div className="absolute inset-[-6.62%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.8333 12.8333">
                <g id="Vector">
                  <path d={svgPaths.p1180dff1} stroke="var(--stroke-0, #27496D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  <path d={svgPaths.p2cc31700} stroke="var(--stroke-0, #27496D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  <path d={svgPaths.p21a5f740} stroke="var(--stroke-0, #27496D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  <path d={svgPaths.p2e57140} stroke="var(--stroke-0, #27496D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </g>
              </svg>
            </div>
          </div>
        </div>
        <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#27496d] text-[13px] text-right whitespace-nowrap">
          <p className="leading-[18px]">MANAGE CATEGORIES</p>
        </div>
      </div>
      <div className="bg-[#2699fb] content-stretch flex gap-[4px] h-[33px] items-center px-[12px] py-[8px] relative rounded-[8px] shrink-0" data-name="Badge Button">
        <div className="relative shrink-0 size-[17px]" data-name="react-icons/md/MdAdd">
          <div className="absolute inset-[20.83%]" data-name="Vector">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.91667 9.91667">
              <path d={svgPaths.pedfcc80} fill="var(--fill-0, white)" id="Vector" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-right text-white whitespace-nowrap">
          <p className="leading-[13px]">ADD GOAL TEMPLATE</p>
        </div>
      </div>
    </div>
  );
}

function Content() {
  return (
    <div className="flex-[1_0_0] h-full min-w-px relative" data-name="Content">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
          <button className="block cursor-pointer relative shrink-0 size-[24px]" data-name="Checkbox">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
              <g id="Group">
                <g id="Vector" />
                <path d={svgPaths.p18456500} fill="var(--fill-0, #8A8A8A)" id="Vector_2" />
              </g>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function Content1() {
  return (
    <div className="h-[48px] relative shrink-0 w-full border-r border-[#e5e5e5]" data-name="Content">
      <div className="flex flex-row items-center overflow-visible rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
          <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#27496d] text-[12px] whitespace-nowrap">
            <p className="leading-[17px]">Goal Name</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Content2() {
  return (
    <div className="h-[48px] relative shrink-0 w-full" data-name="Content">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
          <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#27496d] text-[12px] whitespace-nowrap">
            <p className="leading-[17px]">Category</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Content3() {
  return (
    <div className="h-[48px] relative shrink-0 w-full" data-name="Content">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
          <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#27496d] text-[12px] whitespace-nowrap">
            <p className="leading-[17px]">Description</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Content4() {
  return (
    <div className="h-[48px] relative shrink-0 w-full" data-name="Content">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
          <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#27496d] text-[12px] whitespace-nowrap">
            <p className="leading-[17px]">Strategies</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Content5() {
  return (
    <div className="h-[48px] relative shrink-0 w-full" data-name="Content">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
          <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#27496d] text-[12px] whitespace-nowrap">
            <p className="leading-[17px]">Visit Types</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Content6() {
  return (
    <div className="h-[48px] relative shrink-0 w-full" data-name="Content">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
          <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#27496d] text-[12px] whitespace-nowrap">
            <p className="leading-[17px]">Used By</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataRow({
  template,
  index,
  isMenuOpen,
  onMenuToggle,
  isChecked,
  onToggle,
}: {
  template: GoalTemplate;
  index: number;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  isChecked: boolean;
  onToggle: () => void;
}) {
  const bgColor = index % 2 === 0 ? '#F7FBFF' : '#FFFFFF';

  return (
    <div className="h-[48px] relative shrink-0 w-full" style={{ backgroundColor: bgColor }} data-name=".Row">
      <div className="content-stretch flex items-start overflow-visible relative rounded-[inherit] size-full">
        <div className="bg-transparent content-stretch flex h-full items-center relative shrink-0 w-[40px]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <div className="flex-[1_0_0] h-full min-w-px relative" data-name="Content">
            <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
              <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
                <button
                  type="button"
                  onClick={onToggle}
                  className="block cursor-pointer relative shrink-0 size-[24px]"
                  data-name="Checkbox"
                  aria-label={isChecked ? 'Deselect row' : 'Select row'}
                >
                  {isChecked ? (
                    <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="3" fill="#2699fb" />
                      <path d="M8 12.5l2.5 2.5L16 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                      <g id="Group">
                        <g id="Vector" />
                        <path d={svgPaths.p18456500} fill="var(--fill-0, #8A8A8A)" id="Vector_2" />
                      </g>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-transparent content-stretch flex flex-col h-full items-start justify-center relative shrink-0 w-[137px] min-w-[137px] border-r border-[#e5e5e5]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <div className="h-[48px] relative shrink-0 w-full" data-name="Content">
            <div className="flex flex-row items-center justify-between overflow-visible rounded-[inherit] size-full">
              <div className="content-stretch flex items-center px-[12px] py-[10px] relative">
                <div className="flex flex-col font-['Montserrat',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[12px] whitespace-nowrap">
                  <p className="leading-[17px]">{template.goalName}</p>
                </div>
              </div>
              <div className="relative flex items-center pr-[12px]">
                <button
                  onClick={onMenuToggle}
                  className="relative flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded p-1 z-10"
                >
                  <BsThreeDotsVertical className="size-[16px]" color="#27496D" />
                </button>
                <KebabMenu
                  isOpen={isMenuOpen}
                  onClose={onMenuToggle}
                  onEdit={() => console.log('Edit', template.id)}
                  onDelete={() => console.log('Delete', template.id)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-transparent content-stretch flex flex-col h-full items-start justify-center relative shrink-0 w-[177px]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <div className="h-[48px] relative shrink-0 w-full" data-name="Content">
            <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
              <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
                <div className="flex flex-col font-['Montserrat',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[12px] whitespace-nowrap">
                  <p className="leading-[17px]">{template.category}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-transparent content-stretch flex flex-col h-full items-start justify-center relative shrink-0 w-[163px]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <div className="h-[48px] relative shrink-0 w-full" data-name="Content">
            <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
              <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
                <div className="flex flex-col font-['Montserrat',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[12px] whitespace-nowrap overflow-hidden text-ellipsis">
                  <p className="leading-[17px] truncate">{template.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-transparent content-stretch flex flex-col h-full items-start justify-center relative shrink-0 w-[178px]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <div className="h-[48px] relative shrink-0 w-full" data-name="Content">
            <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
              <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
                <div className="flex flex-col font-['Montserrat',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[12px] whitespace-nowrap">
                  <p className="leading-[17px]">{template.strategies > 0 ? `${template.strategies} ${template.strategies === 1 ? 'Strategy' : 'Strategies'}` : ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-transparent content-stretch flex flex-col h-full items-start justify-center relative shrink-0 w-[148px]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <div className="h-[48px] relative shrink-0 w-full" data-name="Content">
            <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
              <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
                <div className="flex flex-col font-['Montserrat',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[12px] whitespace-nowrap">
                  <p className="leading-[17px]">{template.visitTypes}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-transparent content-stretch flex flex-col h-full items-start justify-center relative shrink-0 w-[178px]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <div className="h-[48px] relative shrink-0 w-full" data-name="Content">
            <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
              <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
                <div className="flex flex-col font-['Montserrat',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[12px] whitespace-nowrap">
                  <p className="leading-[17px]">{template.usedBy}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Row({
  isAllSelected,
  isSomeSelected,
  onToggleAll,
}: {
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onToggleAll: () => void;
}) {
  return (
    <div className="bg-[rgba(255,255,255,0)] h-[48px] relative shrink-0 w-full" data-name=".Row">
      <div className="content-stretch flex items-start overflow-visible relative rounded-[inherit] size-full">
        <div className="bg-white content-stretch flex h-full items-center relative shrink-0 w-[40px]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <div className="flex-[1_0_0] h-full min-w-px relative" data-name="Content">
            <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
              <div className="content-stretch flex items-center px-[12px] py-[10px] relative size-full">
                <button
                  type="button"
                  onClick={onToggleAll}
                  className="block cursor-pointer relative shrink-0 size-[24px]"
                  data-name="Checkbox"
                  aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
                >
                  {isAllSelected ? (
                    <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="3" fill="#2699fb" />
                      <path d="M8 12.5l2.5 2.5L16 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isSomeSelected ? (
                    <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="3" fill="#2699fb" />
                      <line x1="8" y1="12" x2="16" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                      <g id="Group">
                        <g id="Vector" />
                        <path d={svgPaths.p18456500} fill="var(--fill-0, #8A8A8A)" id="Vector_2" />
                      </g>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white content-stretch flex flex-col h-full items-start justify-center relative shrink-0 w-[137px]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <Content1 />
        </div>
        <div className="bg-white content-stretch flex flex-col h-full items-start justify-center relative shrink-0 w-[177px]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <Content2 />
        </div>
        <div className="bg-white content-stretch flex flex-col h-full items-start justify-center relative shrink-0 w-[163px]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <Content3 />
        </div>
        <div className="bg-white content-stretch flex flex-col h-full items-start justify-center relative shrink-0 w-[178px]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <Content4 />
        </div>
        <div className="bg-white content-stretch flex flex-col h-full items-start justify-center relative shrink-0 w-[148px]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <Content5 />
        </div>
        <div className="bg-white content-stretch flex flex-col h-full items-start justify-center relative shrink-0 w-[178px]" data-name="Cell Variants">
          <div aria-hidden="true" className="absolute border-0 border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
          <Content6 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Table({
  goalTemplates,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: {
  goalTemplates: GoalTemplate[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleMenuToggle = (templateId: string) => {
    setOpenMenuId(openMenuId === templateId ? null : templateId);
  };

  const isAllSelected = goalTemplates.length > 0 && selectedIds.size === goalTemplates.length;
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  return (
    <div className="bg-white h-[246px] relative rounded-[8px] shrink-0 w-full" data-name="Table">
      <div className="content-stretch flex flex-col items-start overflow-x-auto overflow-y-visible relative rounded-[inherit] size-full">
        <Row
          isAllSelected={isAllSelected}
          isSomeSelected={isSomeSelected}
          onToggleAll={onToggleAll}
        />
        {goalTemplates.map((template, index) => (
          <DataRow
            key={template.id}
            template={template}
            index={index}
            isMenuOpen={openMenuId === template.id}
            onMenuToggle={() => handleMenuToggle(template.id)}
            isChecked={selectedIds.has(template.id)}
            onToggle={() => onToggleRow(template.id)}
          />
        ))}
      </div>
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Frame() {
  return (
    <div className="relative shrink-0 size-[40px]" data-name="Frame">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
        <g clipPath="url(#clip0_1_5477)" id="Frame">
          <path d={svgPaths.p1fedf200} fill="var(--fill-0, #B8B8B8)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_1_5477">
            <rect fill="white" height="40" width="40" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame43() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 text-[#b8b8b8] text-center whitespace-nowrap">
      <p className="font-['Montserrat',sans-serif] font-medium font-medium leading-[21px] relative shrink-0 text-[15px]">No goal templates yet</p>
      <p className="font-['Montserrat',sans-serif] font-normal leading-[18px] not-italic relative shrink-0 text-[13px]">Create reusable goal templates here so coordinators can add them to any client in a couple of clicks.</p>
    </div>
  );
}

function EmptyStateContainer() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] items-center justify-center left-[144px] p-[10px] top-[74px]" data-name="Empty State Container">
      <Frame />
      <Frame43 />
    </div>
  );
}

function GoalTemplateTable({
  goalTemplates,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: {
  goalTemplates: GoalTemplate[];
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
}) {
  return (
    <div className="content-stretch flex flex-col h-[246px] items-start overflow-x-auto overflow-y-visible relative shrink-0 w-full" data-name="Goal Template Table">
      <Table
        goalTemplates={goalTemplates}
        selectedIds={selectedIds}
        onToggleRow={onToggleRow}
        onToggleAll={onToggleAll}
      />
      {goalTemplates.length === 0 && <EmptyStateContainer />}
    </div>
  );
}

function Container({ goalTemplates }: { goalTemplates: GoalTemplate[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // If the underlying template list changes (e.g. one is deleted), drop ids that no longer exist.
  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(goalTemplates.map((t) => t.id));
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (valid.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [goalTemplates]);

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === goalTemplates.length) return new Set();
      return new Set(goalTemplates.map((t) => t.id));
    });
  };

  const handleReassign = () => {
    if (selectedIds.size === 0) return;
    window.dispatchEvent(
      new CustomEvent('openReassignCategory', {
        detail: { templateIds: Array.from(selectedIds) },
      })
    );
  };

  return (
    <div className="relative content-stretch flex flex-col gap-[12px] items-start w-full" data-name="Container">
      <Container1 selectedCount={selectedIds.size} onReassign={handleReassign} />
      <GoalTemplateTable
        goalTemplates={goalTemplates}
        selectedIds={selectedIds}
        onToggleRow={handleToggleRow}
        onToggleAll={handleToggleAll}
      />
    </div>
  );
}

export default function BroadcastStudio({ goalTemplates = [] }: BroadcastStudioProps) {
  const [expandedSection, setExpandedSection] = useState<'clients' | 'agency' | 'superAdmin' | null>('superAdmin');
  // Below desktop (1024px), the sidebar starts collapsed to the icon rail —
  // opening it via the hamburger overlays a flyout with a blurred scrim
  // instead of pushing the toolbar/content over, per the tablet breakpoint.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  // Owned here so the chrome and the dashboard share one source of truth for who is viewing.
  const [role, setRole] = useRole();
  const identity = getUserIdentity(role);

  // Re-apply the breakpoint default whenever the viewport crosses the 1024px
  // line — not just on first load. Without this, resizing the window (or
  // switching a device preset) live never updates sidebarCollapsed, since
  // the useState initializer above only runs once at mount.
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)');
    const handleChange = (e: MediaQueryListEvent) => setSidebarCollapsed(e.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  // Collapsed rail shows only the first word of each nav label (e.g. "Super
  // Administrator" -> "Super"); expanded restores the full label.
  useEffect(() => {
    const menu = document.querySelector('[data-name="Sidebar Menu"]');
    if (!menu) return;
    menu.querySelectorAll('p').forEach((p) => {
      const el = p as HTMLElement;
      if (el.closest('[data-name="Collapsed Org"]')) return; // org name truncates by ellipsis, not first-word
      if (!el.dataset.fullLabel) el.dataset.fullLabel = el.textContent ?? '';
      const full = el.dataset.fullLabel;
      el.textContent = sidebarCollapsed ? full.split(' ')[0] : full;
    });
  }, [sidebarCollapsed, expandedSection]);

  const handleClientsClick = () => {
    setExpandedSection('clients');
  };

  const handleAgencyClick = () => {
    setExpandedSection('agency');
  };

  const handleSuperAdminClick = () => {
    setExpandedSection('superAdmin');
  };

  const handleGoalTemplatesClick = () => {
    setExpandedSection('agency');
  };

  return (
    <div className="bg-[#f8f8f8] relative size-full" data-name="Agency Management - Goal Templates">
      <TopBar onHamburgerClick={() => setSidebarCollapsed(s => !s)} sidebarCollapsed={sidebarCollapsed} identity={identity} />
      <div className="absolute right-0 top-[59px] bottom-0 w-[60px] border-l border-[#e5e5e5] z-50">
        <NotificationPanel identity={identity} />
      </div>
      <div className={`absolute bg-[#eaeaea] bottom-0 left-0 top-[59px] overflow-hidden transition-[width] duration-200 z-40 ${sidebarCollapsed ? 'sidebar-collapsed w-[69px]' : 'w-[329px] max-lg:shadow-[0_0_24px_rgba(0,0,0,0.25)]'}`} data-name="Sidebar Menu">
        <div className="content-stretch flex flex-col items-start overflow-y-auto relative rounded-[inherit] size-full">
          {!sidebarCollapsed && (
            <>
              <div className="bg-[#eaeaea] relative shrink-0 w-full" data-name="Organization Switcher">
                <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
                <div className="content-stretch flex flex-col gap-[10px] items-start p-[16px] relative size-full">
                  <div className="absolute bg-[#efefef] inset-0" data-name="Background">
                    <div aria-hidden="true" className="absolute border-[#dfdfdf] border-b border-solid inset-0 pointer-events-none" />
                  </div>
                  <Frame3 identity={identity} />
                </div>
              </div>
              <div className="bg-[#eaeaea] content-stretch flex flex-col gap-[10px] h-[45px] items-start justify-center p-[16px] relative shrink-0 w-full" data-name="Organization Switcher">
                <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none" />
                <div className="absolute bg-[#efefef] inset-0" data-name="Background">
                  <div aria-hidden="true" className="absolute border-[#dfdfdf] border-b border-solid inset-0 pointer-events-none" />
                </div>
                <Frame4 />
              </div>
            </>
          )}
          {sidebarCollapsed && (
            <>
              <div
                data-name="Collapsed Org"
                className="w-full flex items-center justify-center shrink-0"
                style={{ height: 45, backgroundColor: '#efefef', borderBottom: '1px solid #dfdfdf' }}
              >
                <div className="rounded-[8px] flex items-center justify-center shrink-0" style={{ width: 30, height: 30, backgroundColor: identity.avatarColor }}>
                  <span className="font-['Montserrat',sans-serif] font-medium text-white" style={{ fontSize: 12, lineHeight: '15px' }}>{identity.initials}</span>
                </div>
              </div>
              <div
                data-name="Collapsed Org"
                className="w-full flex items-center justify-center shrink-0 px-[6px]"
                style={{ height: 45, backgroundColor: '#efefef', borderBottom: '1px solid #dfdfdf' }}
              >
                <p className="font-['Montserrat',sans-serif] font-normal text-center" style={{ color: '#334c6d' }}>GEOH Demonstration</p>
              </div>
            </>
          )}
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Super Administrator">
            <button
              onClick={handleSuperAdminClick}
              className={`cursor-pointer relative shrink-0 w-full ${
                expandedSection === 'superAdmin'
                  ? 'bg-[#dcdcdc] h-[45px] hover:bg-[#dcdcdc]'
                  : 'bg-[#eaeaea]'
              }`}
              data-name="Sidebar States"
            >
              <div className="flex flex-row items-center size-full">
                <div className={`content-stretch flex gap-[213px] items-center relative size-full ${
                  expandedSection === 'superAdmin' ? 'pr-[14px]' : 'px-[14px] py-[10px]'
                }`}>
                  <div className={`content-stretch flex items-center relative shrink-0 ${
                    expandedSection === 'superAdmin' ? 'gap-[9px]' : 'gap-[8px]'
                  }`}>
                    {expandedSection === 'superAdmin' && (
                      <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
                    )}
                    <Frame7 />
                  </div>
                </div>
              </div>
            </button>
            {expandedSection === 'superAdmin' && (
              <>
                {/* Agency Employees */}
                <div className="bg-[#dcdcdc] content-stretch flex h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
                  <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                    <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
                    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
                      <RiTeamLine className="shrink-0 text-[#27496d]" size={23} />
                      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Agency Employees</p>
                    </div>
                  </div>
                </div>
                {/* Agencies */}
                <div className="bg-[#dcdcdc] content-stretch flex gap-[213px] h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
                  <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                    <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
                    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
                      <BiBuildings className="shrink-0 text-[#27496d]" size={23} />
                      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Agencies</p>
                    </div>
                  </div>
                </div>
                {/* Broadcast Studio — active */}
                <div className="bg-[#cfcfcf] content-stretch flex gap-[12px] h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
                  <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                    <div className="bg-[#0078d4] h-[45px] relative shrink-0 w-[4px]" />
                    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
                      <GrAnnounce className="shrink-0 text-[#27496d]" size={23} />
                      <p className="font-['Montserrat',sans-serif] font-bold leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Broadcast Studio</p>
                    </div>
                  </div>
                </div>
                {/* Invoices */}
                <div className="bg-[#dcdcdc] content-stretch flex gap-[213px] h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
                  <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                    <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
                    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
                      <RiFileListLine className="shrink-0 text-[#27496d]" size={23} />
                      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Invoices</p>
                    </div>
                  </div>
                </div>
                {/* Insights */}
                <div className="bg-[#dcdcdc] content-stretch flex gap-[213px] h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
                  <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                    <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
                    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
                      <MdInsights className="shrink-0 text-[#27496d]" size={23} />
                      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Insights</p>
                    </div>
                  </div>
                </div>
                {/* Code List */}
                <div className="bg-[#dcdcdc] content-stretch flex gap-[213px] h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
                  <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                    <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
                    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
                      <TbZoomCode className="shrink-0 text-[#27496d]" size={23} />
                      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Code List</p>
                    </div>
                  </div>
                </div>
                {/* Forms List */}
                <div className="bg-[#dcdcdc] content-stretch flex gap-[213px] h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
                  <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                    <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
                    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
                      <AiOutlineForm className="shrink-0 text-[#27496d]" size={23} />
                      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Forms List</p>
                    </div>
                  </div>
                </div>
                {/* QuickBooks Setup */}
                <div className="bg-[#dcdcdc] content-stretch flex gap-[213px] h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
                  <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                    <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
                    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
                      <PiPlugs className="shrink-0 text-[#27496d]" size={23} />
                      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">QuickBooks Setup</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full" data-name="Dashboard">
            <div className="bg-[#eaeaea] relative shrink-0 w-full" data-name="Sidebar States">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex gap-[213px] items-center px-[14px] py-[10px] relative size-full">
                  <Frame8 />
                </div>
              </div>
            </div>
          </button>
          <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full" data-name="Operations">
            <div className="bg-[#eaeaea] relative shrink-0 w-full" data-name="Sidebar States">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex gap-[213px] items-center px-[14px] py-[10px] relative size-full">
                  <Frame9 />
                </div>
              </div>
            </div>
          </button>
          <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full" data-name="Scheduling">
            <div className="bg-[#eaeaea] relative shrink-0 w-full" data-name="Sidebar States">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex gap-[213px] items-center px-[14px] py-[10px] relative size-full">
                  <Frame10 />
                </div>
              </div>
            </div>
          </button>
          <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full" data-name="Payroll">
            <div className="bg-[#eaeaea] relative shrink-0 w-full" data-name="Sidebar States">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex gap-[213px] items-center px-[14px] py-[10px] relative size-full">
                  <Frame11 />
                </div>
              </div>
            </div>
          </button>
          <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0" data-name="Billing">
            <div className="bg-[#eaeaea] content-stretch flex gap-[213px] items-center px-[14px] py-[10px] relative shrink-0 w-full" data-name="Sidebar States">
              <Frame12 />
            </div>
          </button>
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Clients">
            <button
              onClick={handleClientsClick}
              className={`cursor-pointer relative shrink-0 w-full ${
                expandedSection === 'clients'
                  ? 'bg-[#dcdcdc] h-[45px] hover:bg-[#dcdcdc]'
                  : 'bg-[#eaeaea]'
              }`}
              data-name="Sidebar States"
            >
              <div className="flex flex-row items-center size-full">
                <div className={`content-stretch flex gap-[213px] items-center relative size-full ${
                  expandedSection === 'clients' ? 'pr-[14px]' : 'px-[14px] py-[10px]'
                }`}>
                  <div className={`content-stretch flex items-center relative shrink-0 ${
                    expandedSection === 'clients' ? 'gap-[9px]' : 'gap-[8px]'
                  }`}>
                    {expandedSection === 'clients' && (
                      <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
                    )}
                    <div className="relative shrink-0 size-[23px]" data-name="react-icons/ri/RiUserLocationLine">
                      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23 23">
                        <g id="Group">
                          <g id="Vector" />
                          <path d={svgPaths.p9a91480} fill="var(--fill-0, #27496D)" id="Vector_2" />
                        </g>
                      </svg>
                    </div>
                    <p className={`font-['Montserrat',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] text-left whitespace-nowrap ${
                      expandedSection === 'clients' ? 'font-bold' : 'font-normal'
                    }`}>Clients</p>
                  </div>
                </div>
              </div>
            </button>
            {expandedSection === 'clients' && (
              <>
                <div className="bg-[#cfcfcf] content-stretch flex h-[45px] items-center justify-between pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
                  <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                    <div className="bg-[#0078d4] h-[45px] relative shrink-0 w-[4px]" />
                    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
                      <div className="relative shrink-0 size-[23px]" data-name="react-icons/ri/RiUserSearchLine">
                        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23 23">
                          <g id="Group">
                            <g id="Vector" />
                            <path d={svgPaths.p29d5ce00} fill="var(--fill-0, #27496D)" id="Vector_2" />
                          </g>
                        </svg>
                      </div>
                      <p className="font-['Montserrat',sans-serif] font-bold leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">View Clients</p>
                    </div>
                  </div>
                  <BsPlus className="relative shrink-0 size-[16px]" color="#4A4A4A" />
                </div>
                <div className="bg-[#dcdcdc] content-stretch flex h-[45px] items-center justify-between pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
                  <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                    <div className="bg-[#a3a3a3] h-[45px] relative shrink-0 w-[4px]" />
                    <div className="content-stretch flex gap-[9px] items-center relative shrink-0">
                      <div className="relative shrink-0 size-[23px]" data-name="react-icons/ri/RiShieldKeyholeLine">
                        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23 23">
                          <g id="Group">
                            <g id="Vector" />
                            <path d={svgPaths.p88f980} fill="var(--fill-0, #334C6D)" id="Vector_2" />
                          </g>
                        </svg>
                      </div>
                      <p className="font-['Montserrat',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#27496d] text-[14px] whitespace-nowrap">Authorizations</p>
                    </div>
                  </div>
                  <BsPlus className="relative shrink-0 size-[16px]" color="#4A4A4A" />
                </div>
              </>
            )}
          </div>
          <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full" data-name="Employees">
            <div className="bg-[#eaeaea] relative shrink-0 w-full" data-name="Sidebar States">
              <div className="flex flex-row items-center justify-center size-full">
                <div className="content-stretch flex items-center justify-between px-[14px] py-[10px] relative size-full">
                  <Frame14 />
                  <div className="relative shrink-0 size-[16px]" data-name="react-icons/bs/BsPlus">
                    <div className="absolute inset-1/4" data-name="Vector">
                      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
                        <path d={svgPaths.p17686b00} fill="var(--fill-0, #4A4A4A)" id="Vector" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>
          <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full" data-name="Smart Billing">
            <div className="bg-[#eaeaea] relative shrink-0 w-full" data-name="Sidebar States">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex gap-[213px] items-center px-[14px] py-[10px] relative size-full">
                  <Frame15 />
                </div>
              </div>
            </div>
          </button>
          <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full" data-name="Reporting">
            <div className="bg-[#eaeaea] relative shrink-0 w-full" data-name="Sidebar States">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex gap-[213px] items-center px-[14px] py-[10px] relative size-full">
                  <Frame16 />
                </div>
              </div>
            </div>
          </button>
          <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full" data-name="Fax">
            <div className="bg-[#eaeaea] relative shrink-0 w-full" data-name="Sidebar States">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex gap-[213px] items-center px-[14px] py-[10px] relative size-full">
                  <Frame17 />
                </div>
              </div>
            </div>
          </button>
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Agency Management">
            <button
              onClick={handleAgencyClick}
              className={`cursor-pointer relative shrink-0 w-full ${
                expandedSection === 'agency'
                  ? 'bg-[#dcdcdc] h-[45px] hover:bg-[#dcdcdc]'
                  : 'bg-[#eaeaea]'
              }`}
              data-name="Sidebar States"
            >
              <div className="flex flex-row items-center size-full">
                <div className={`content-stretch flex gap-[213px] items-center relative size-full ${
                  expandedSection === 'agency' ? 'pr-[14px]' : 'px-[14px] py-[10px]'
                }`}>
                  <Frame18 isExpanded={expandedSection === 'agency'} />
                </div>
              </div>
            </button>
            {expandedSection === 'agency' && (
              <>
            <div className="bg-[#dcdcdc] content-stretch flex h-[45px] items-center justify-between pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
              <Frame19 />
              <div className="relative shrink-0 size-[16px]" data-name="react-icons/bi/BiPlus">
                <div className="absolute inset-[20.83%]" data-name="Vector">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 9.33333">
                    <path d={svgPaths.p119b3300} fill="var(--fill-0, #585858)" id="Vector" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-[#dcdcdc] content-stretch flex gap-[213px] h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
              <Frame21 />
            </div>
            <button
              onClick={handleGoalTemplatesClick}
              className="bg-[#cfcfcf] content-stretch cursor-pointer flex gap-[213px] h-[45px] items-center pr-[14px] relative shrink-0 w-full"
              data-name="Sidebar States"
            >
              <Frame23 />
            </button>
            <div className="bg-[#dcdcdc] content-stretch flex h-[45px] items-center justify-between pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
              <Frame25 />
              <div className="relative shrink-0 size-[16px]" data-name="react-icons/bi/BiPlus">
                <div className="absolute inset-[20.83%]" data-name="Vector">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 9.33333">
                    <path d={svgPaths.p119b3300} fill="var(--fill-0, #585858)" id="Vector" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-[#dcdcdc] content-stretch flex h-[45px] items-center justify-between pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
              <Frame27 />
              <div className="relative shrink-0 size-[16px]" data-name="react-icons/bi/BiPlus">
                <div className="absolute inset-[20.83%]" data-name="Vector">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 9.33333">
                    <path d={svgPaths.p119b3300} fill="var(--fill-0, #585858)" id="Vector" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-[#dcdcdc] content-stretch flex h-[45px] items-center justify-between pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
              <Frame29 />
              <div className="relative shrink-0 size-[16px]" data-name="react-icons/bi/BiPlus">
                <div className="absolute inset-[20.83%]" data-name="Vector">
                  <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 9.33333">
                    <path d={svgPaths.p119b3300} fill="var(--fill-0, #585858)" id="Vector" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-[#dcdcdc] content-stretch flex gap-[213px] h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
              <Frame31 />
            </div>
            <div className="bg-[#dcdcdc] content-stretch flex gap-[213px] h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
              <Frame33 />
            </div>
            <div className="bg-[#dcdcdc] content-stretch flex gap-[213px] h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
              <Frame35 />
            </div>
            <div className="bg-[#dcdcdc] content-stretch flex gap-[213px] h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
              <Frame37 />
            </div>
            <div className="bg-[#dcdcdc] content-stretch flex gap-[213px] h-[45px] items-center pr-[14px] relative shrink-0 w-full" data-name="Sidebar States">
              <Frame39 />
            </div>
              </>
            )}
          </div>
          <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0 w-full" data-name="My Account">
            <div className="bg-[#eaeaea] relative shrink-0 w-full" data-name="Sidebar States">
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex gap-[213px] items-center px-[14px] py-[10px] relative size-full">
                  <Frame41 />
                </div>
              </div>
            </div>
          </button>
          <div className="bg-[#eaeaea] relative shrink-0 w-full" data-name="Sidebar States">
            <div className="flex flex-row items-center size-full">
              <div className="content-stretch flex gap-[213px] items-center px-[14px] py-[10px] relative size-full">
                <Frame42 />
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border-[#e5e5e5] border-r border-solid inset-0 pointer-events-none" />
      </div>
      {/* Below desktop, an expanded sidebar floats over the content instead of
          pushing it — this scrim dims/blurs what's behind it, matching the
          overlay pattern used elsewhere (e.g. DeleteConfirmOverlay), and
          tapping it closes the sidebar back to the rail. Runs the full
          height (top-0), so the search strip sinks behind it too — only the
          sidebar's own logo/hamburger corner and the avatar sit above it. */}
      {!sidebarCollapsed && (
        <div
          className="hidden max-lg:block absolute left-0 right-0 top-0 bottom-0 z-30"
          style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      {/* Main content area: fixed breadcrumb toolbar + its own independent scroll region,
          so content taller than the viewport scrolls instead of being clipped. */}
      <div className={`absolute bg-[#f8f8f8] flex gap-[14px] h-[48px] items-center right-[60px] p-[16px] top-[59px] z-10 transition-[left] duration-200 max-lg:!left-[69px] ${sidebarCollapsed ? 'lg:left-[69px]' : 'lg:left-[329px]'}`} data-name="Toolbar">
        <MdArrowBack size={21} color="#27496D" />
        <span className="font-['Montserrat',sans-serif] font-medium text-[15px] text-black leading-[15px]">
          {expandedSection === 'agency' ? 'View Goals' : 'Broadcast Studio'}
        </span>
      </div>
      <div className={`absolute right-[60px] top-[107px] bottom-0 overflow-y-auto transition-[left] duration-200 max-lg:!left-[69px] ${sidebarCollapsed ? 'lg:left-[69px]' : 'lg:left-[329px]'}`}>
        <div className="p-[16px]">
          {expandedSection === 'agency' ? (
            <Container goalTemplates={goalTemplates} />
          ) : (
            <BroadcastStudioDashboard role={role} onRoleChange={setRole} />
          )}
        </div>
      </div>
    </div>
  );
}