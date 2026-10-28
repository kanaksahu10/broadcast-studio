# Preset overlay images

One image per preset, named by its id:

    launch  product-update  mobile  growth  teamwork  premium  vacation  celebration

The current set is 1200 × 600 WebP (about 40–120 KB each), kept in this folder.
To replace one, drop a new file with the same name here (`.svg`, `.png`,
`.jpg`, `.jpeg` or `.webp`); no code change is needed. A preset without a file
falls back to a coloured placeholder.

Keep one illustration style across all eight, no text inside the image, and
files under about 200 KB. Update the preset's alt text in
`src/imports/BroadcastStudio/presetImages.tsx` if the picture changes.
