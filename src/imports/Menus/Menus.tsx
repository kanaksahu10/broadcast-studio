import svgPaths from "./svg-duzgfqtilr";

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start justify-center relative shrink-0">
      <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#334d6e] text-[12px] whitespace-nowrap">
        <p className="leading-[17px]">Edit</p>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[16px]" data-name="react-icons/md/MdOutlineModeEditOutline">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="Vector" />
        </svg>
        <div className="absolute inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.0016 12.0016">
            <path d={svgPaths.p2689a480} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
      </div>
      <Frame2 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start justify-center relative shrink-0">
      <div className="flex flex-col font-['Montserrat',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#27496d] text-[12px] whitespace-nowrap">
        <p className="leading-[17px]">Delete</p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <div className="relative shrink-0 size-[16px]" data-name="react-icons/md/MdDeleteOutline">
        <div className="absolute inset-[12.5%_20.83%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 12">
            <path d={svgPaths.p37a0a400} fill="var(--fill-0, #27496D)" id="Vector" />
          </svg>
        </div>
      </div>
      <Frame3 />
    </div>
  );
}

export default function Menus() {
  return (
    <div className="bg-white content-stretch drop-shadow-[0px_4px_2px_rgba(0,0,0,0.08)] flex flex-col items-start relative rounded-[4px] size-full" data-name="Menus">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-[-1px] pointer-events-none rounded-[5px]" />
      <div className="bg-white relative rounded-[4px] shrink-0 w-full" data-name="Dropdowns Items">
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex gap-[8px] items-center pb-[8px] pt-[12px] px-[16px] relative size-full">
            <Frame />
          </div>
        </div>
      </div>
      <div className="bg-white relative rounded-[4px] shrink-0 w-full" data-name="Dropdowns Items">
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex gap-[8px] items-center pb-[12px] pt-[8px] px-[16px] relative size-full">
            <Frame1 />
          </div>
        </div>
      </div>
    </div>
  );
}