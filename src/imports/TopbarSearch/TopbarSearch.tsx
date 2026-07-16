import svgPaths from "./svg-st5k5ztwb1";

export default function TopbarSearch() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative size-full" data-name="topbar search">
      <div className="relative shrink-0 size-[21px]" data-name="react-icons/md/MdSearch">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="Vector" />
        </svg>
        <div className="absolute inset-[12.5%_14.62%_14.62%_12.5%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.3038 15.3038">
            <path d={svgPaths.p15ba3700} fill="var(--fill-0, black)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#8b8b8b] text-[13px] whitespace-nowrap">
        <p className="leading-[18px]">Search Everything (Ctrl + F / Cmd + F)...</p>
      </div>
    </div>
  );
}