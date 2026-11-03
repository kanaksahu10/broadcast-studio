import type { IconType } from 'react-icons';
import { MdRocketLaunch, MdDashboard, MdTrendingUp, MdWorkspacePremium } from 'react-icons/md';

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
  { id: 'product-update', name: 'Product update', alt: 'A laptop showing a profile and a completed checklist', icon: MdDashboard, tint: '#EAF0F7', ink: '#27496D' },
  { id: 'premium', name: 'Premium', alt: 'A gold star on a pedestal', icon: MdWorkspacePremium, tint: '#FFF6E0', ink: '#B7791F' },
  { id: 'growth', name: 'Growth', alt: 'A plant growing from the tallest bar of a rising chart', icon: MdTrendingUp, tint: '#E7F7EC', ink: '#1E9E46' },
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

/**
 * An uploaded image is stored in the same `imageId` field as a preset id, as
 * a JPEG data URL, so everything that passes the image along keeps working.
 * The whole picture is kept (not cropped) so the author can reposition it
 * later; `imagePosition` records which part shows in the 2:1 frame. The
 * prototype has no server: messages live in localStorage (about 5 MB in
 * total), so the picture is shrunk to just cover a 960 × 480 frame.
 */
export function isUploadedImage(id: string | undefined): boolean {
  return !!id && id.startsWith('data:image/');
}

const FRAME_WIDTH = 960;
const FRAME_HEIGHT = 480;
const MAX_SIDE = 1600;
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const DEFAULT_IMAGE_POSITION = '50% 50%';

/** Shrinks the file to just cover a 960 × 480 frame (longest side ≤ 1600) and returns a JPEG data URL. */
export function prepareUploadedImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const scale = Math.min(1, Math.max(FRAME_WIDTH / w, FRAME_HEIGHT / h), MAX_SIDE / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('no canvas')); return; }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable image')); };
    img.src = url;
  });
}
