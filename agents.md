# Print PDF React — Reproducible App Guide (Agents)

This document explains how to recreate, run, and verify this exact application state — including features added in this session (multi-font text annotations, black as default color, interactive gizmos with resize for text/shapes/images, and print-time font support).

Date: 2025-09-17
Branch: `main`
Framework: Next.js 15 (App Router)

## 1) Prerequisites
- Node.js 18+ (tested with Node 20/23)
- pnpm or npm (examples use pnpm)
- macOS/zsh commands below (adapt for your OS as needed)

Verify versions:
```bash
node -v
pnpm -v  # or npm -v
```

## 2) Clone and Install
```bash
git clone https://github.com/ionutale/print-pdf-react.git
cd print-pdf-react
pnpm install
```

If you are working from a zip/snapshot, just extract and `cd` into the folder, then install dependencies.

## 3) Project Structure (key files)
- `package.json` — Next.js 15.5.3, React 19.1, scripts
- `next.config.ts` — static export support, GitHub Pages-aware basePath
- `postcss.config.mjs` — Tailwind v4 via `@tailwindcss/postcss`
- `src/app/layout.tsx` — Loads Inter and cursive fonts (Dancing Script, Great Vibes, Allura, Satisfy, Caveat, Kalam, Permanent Marker) via `next/font` and exposes variables
- `src/app/page.tsx` — Mounts the PDF viewer
- `src/app/globals.css` — Global styles + print rules
- `src/components/pdf/*` — Viewer, toolbar, thumbnails, overlay, etc.

## 4) Run the App (Dev)
```bash
pnpm dev
```
Open http://localhost:3000

- Drag & drop a PDF into the main canvas or pick one via the file button
- Use the toolbar to add/select annotations

## 5) Build (Prod)
```bash
pnpm build
pnpm start   # optional; the project is also exportable
```

Static export (optional):
```bash
pnpm build
npx serve out
```

## 6) Core Features in This Exact State
- Annotations: text, rectangles, ellipses, images
- Default color is black (#000000)
- Text fonts: selectable via toolbar, including cursive/handwriting families listed above
- Interactive gizmos on selection:
  - Blue bounding box with 8 resize handles for shapes and images
  - Text containers also have 8 resize handles; drag to resize width/height
  - Hold Shift while resizing to preserve proportions
  - Click-and-drag gizmo background to move selected item
- Snap-to-grid toggle
- Thumbnails sidebar with drag-to-reorder, delete page, and restore deleted pages
- Export/Import annotations to JSON (persisted per PDF via SHA-256 fingerprint)
- Printing: pages rendered at higher scale with annotations on top; text uses selected font where available

## 7) Implementation Notes
- pdf.js is loaded via CDN in `PdfViewer.tsx` using `next/script`; worker src is set to the matching CDN version.
- Annotation overlay handles selection/move/resize with mouse; resizing supports edges (n/s/e/w) and corners (nw/ne/sw/se).
- Text annotation type includes optional `w` and `h` so the text box can be resized using gizmo corners.
- Fonts are loaded with `next/font/google` in `layout.tsx` and applied via CSS variables; toolbar sets the active font family for text annotations.
- Print code (`onPrint`) draws PDF pages to an offscreen canvas, then replays annotations, using selected font family for text when present.

## 8) Exact Dependencies
From `package.json`:
```json
{
  "dependencies": {
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "next": "15.5.3"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4"
  }
}
```

## 9) Environment Variables (optional)
- `GITHUB_PAGES=true` and `NEXT_PUBLIC_BASE_PATH=/print-pdf-react` when exporting/deploying to GitHub Pages project site.

## 10) Reproduce UI Behaviors Checklist
- Add a text annotation → defaults to black, Inter font, size 14 → select it → drag gizmo to move; drag handles to resize box; change font in toolbar and observe live update
- Add rectangle/ellipse → select → resize via handles, Shift for proportional resize
- Add an image → select → resize via handles; move by dragging gizmo background
- Toggle Snap to grid; observe snapping while moving/resizing
- Export annotations to JSON; refresh and Import to restore
- Print; verify fonts and colors on output

## 11) Troubleshooting
- If fonts appear incorrect when printing: ensure the selected font exists on the system or falls back to loaded Google Fonts. The app includes cursive fonts via `next/font`, which should work both in dev and build.
- If pdf.js fails to load: check network access to the CDN (`cdnjs.cloudflare.com`) and that `GlobalWorkerOptions.workerSrc` matches the cdn version in `PdfViewer.tsx`.
- If static export paths 404 on GitHub Pages: ensure `GITHUB_PAGES=true` and `NEXT_PUBLIC_BASE_PATH` are set during build, and that Pages is serving from the repo path.

## 12) Files Changed in This Session (high-level)
- `src/components/pdf/Toolbar.tsx`: added font selector; wiring for color/stroke/size stays
- `src/components/pdf/AnnotationOverlay.tsx`: default color black; interactive gizmo for text/shapes/images; text box resizing with `w`/`h`
- `src/components/pdf/PdfViewer.tsx`: font state; print rendering uses selected font; default stroke color set to black
- `src/app/layout.tsx`: Google cursive fonts via `next/font`
- `src/app/globals.css`: font CSS variables; print styles

With this guide, another engineer can clone, install, run, and verify the app behaves exactly as described above.
