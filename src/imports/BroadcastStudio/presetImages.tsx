import type { IconType } from 'react-icons';
import { MdRocketLaunch, MdDashboard, MdPhoneIphone, MdTrendingUp, MdGroups, MdWorkspacePremium, MdBeachAccess, MdCelebration } from 'react-icons/md';

/**
 * The image library authors pick from for a New Release or Upsell overlay.
 * A message stores only the preset's id, never the image, so a saved message
 * stays a few bytes and swapping the artwork later updates every message that
 * uses it.
 */
export interface PresetImage {
  id: string;
  name: string;
  /** Read by screen readers in place of the image. */
  alt: string;
  icon: IconType;
  /** Placeholder background and icon colour, until real artwork exists. */
  tint: string;
  ink: string;
}

export const PRESET_IMAGES: PresetImage[] = [
  { id: 'launch', name: 'Launch', alt: 'A rocket lifting off from a desk by a sunny window', icon: MdRocketLaunch, tint: '#E8F4FF', ink: '#2699FB' },
  { id: 'vacation', name: 'Break', alt: 'A nurse taking a coffee break at her desk', icon: MdBeachAccess, tint: '#E5F6FD', ink: '#0B83B8' },
  { id: 'product-update', name: 'Product update', alt: 'A laptop showing a profile and a completed checklist', icon: MdDashboard, tint: '#EAF0F7', ink: '#27496D' },
  { id: 'mobile', name: 'Mobile', alt: 'A hand holding a phone with a notification bell', icon: MdPhoneIphone, tint: '#EEF0FB', ink: '#5B5FC7' },
  { id: 'premium', name: 'Premium', alt: 'A gold star on a pedestal', icon: MdWorkspacePremium, tint: '#FFF6E0', ink: '#B7791F' },
  { id: 'growth', name: 'Growth', alt: 'A plant growing from the tallest bar of a rising chart', icon: MdTrendingUp, tint: '#E7F7EC', ink: '#1E9E46' },
  { id: 'teamwork', name: 'Teamwork', alt: 'Three healthcare staff looking at a tablet together', icon: MdGroups, tint: '#E6F6F6', ink: '#178A8A' },
  { id: 'celebration', name: 'Celebration', alt: 'A party popper bursting confetti over a desk calendar', icon: MdCelebration, tint: '#FDECF3', ink: '#C2386F' },
];

// Real artwork in src/assets/presets/ takes over from a placeholder by file
// name (launch.svg → the "launch" preset). Vite resolves this at build time,
// so a missing file just leaves the placeholder in place.
const artworkFiles = import.meta.glob('../../assets/presets/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const ARTWORK_URL: Record<string, string> = {};
for (const [path, url] of Object.entries(artworkFiles)) {
  const id = path.split('/').pop()!.replace(/\.[^.]+$/, '');
  ARTWORK_URL[id] = url;
}

export function getPresetImage(id: string | undefined): PresetImage | null {
  return PRESET_IMAGES.find((p) => p.id === id) ?? null;
}

/**
 * Fills its container: the artwork if it exists, otherwise a labelled
 * placeholder. `decorative` hides it from screen readers where the
 * surrounding control already names it (the picker tiles).
 */
export function PresetArt({ preset, iconSize = 40, showName = true, decorative = false }: { preset: PresetImage; iconSize?: number; showName?: boolean; decorative?: boolean }) {
  const url = ARTWORK_URL[preset.id];
  if (url) return <img src={url} alt={decorative ? '' : preset.alt} className="w-full h-full object-cover block" />;
  const Icon = preset.icon;
  return (
    <div
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : preset.alt}
      aria-hidden={decorative || undefined}
      className="w-full h-full flex flex-col items-center justify-center gap-[4px]"
      style={{ background: `linear-gradient(135deg, ${preset.tint} 0%, #ffffff 100%)`, color: preset.ink }}
    >
      <Icon size={iconSize} />
      {showName && (
        <span className="font-['Montserrat',sans-serif] font-semibold text-[11px] leading-[14px] text-center px-[4px]">{preset.name}</span>
      )}
    </div>
  );
}
