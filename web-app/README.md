## Print PDF React — Next.js App

An interactive PDF viewer and annotator with print support, built with Next.js App Router, Tailwind CSS v4, and pdf.js (via CDN). Load a local PDF, navigate pages, add annotations (text/shapes/images), and print full-size pages with your annotations.

## Quick Start

Using pnpm on macOS (zsh):

```bash
cd web-app
pnpm install
pnpm dev
```

Open http://localhost:3000 and select a PDF file, or drag & drop one into the main viewer area.

## Features

- Upload local PDFs securely (processed in-browser)
- Sidebar thumbnails (lazy-rendered) with a scale slider
- Page navigation with Prev/Next controls and page indicator
- Annotations: text, rectangles, ellipses, and images
- Selection, move, resize (8 handles) with Shift to preserve proportions
- Toolbar style controls: color, stroke width, text size; snap-to-grid toggle
- Keyboard: Delete to remove, Cmd/Ctrl+C and Cmd/Ctrl+V to copy/paste, Cmd/Ctrl+] / Cmd/Ctrl+[ to change z-order
- Export/Import annotations as JSON
- Persistence per PDF using a SHA-256 fingerprint (restores last page and annotations)
- Print pages with annotations rendered on top for crisp output
- Tailwind CSS styling; Inter font via next/font

## Architecture

- `src/app/page.tsx`: Minimal client page hosting the viewer
- `src/components/pdf/PdfViewer.tsx`: Orchestrates pdf.js, file handling, rendering, thumbnails, printing, persistence, keyboard actions
- `src/components/pdf/ThumbnailsSidebar.tsx`: Lazy-renders per-page previews; `thumbScale` controls thumbnail size
- `src/components/pdf/Toolbar.tsx`: Tools (select/text/rect/ellipse/image), color/stroke/text size, snap toggle, clear page, export/import
- `src/components/pdf/AnnotationOverlay.tsx`: Draws/edits annotations with selection, move, resize, snapping, and live styling
- `src/components/pdf/FilePicker.tsx`: Local file selector (also accessible in the empty state)
- `src/components/pdf/Controls.tsx`: Navigation (Prev/Next), page label, and Print
- `src/components/pdf/PdfCanvas.tsx`: Canvas that renders the current page
- `src/components/pdf/Placeholder.tsx`: Empty state before PDF loads; supports drag & drop
- `src/components/pdf/Loader.tsx`: Spinner shown while loading/rendering
- `src/components/pdf/PrintContainer.tsx`: Hidden container for print-only canvases

Global styles (`src/app/globals.css`) include print rules to ensure each page prints on its own sheet and colors are preserved.

## Implementation Notes

- pdf.js is loaded via CDN using `next/script`. The worker is pointed to the CDN version via `GlobalWorkerOptions.workerSrc`.
- Printing draws each page to a canvas at higher scale and then renders annotations on top (text with color/size; shapes with color/stroke). The canvases are placed in a hidden container. CSS `@media print` ensures page breaks and zero margins.
- Annotations are stored per PDF using a SHA-256 fingerprint of the file contents in `localStorage`, along with the last viewed page. The app restores these when the same PDF is reloaded.
- Thumbnails are lazy-rendered as they scroll into view, and their size is adjustable via the slider.
- Drag & drop is supported on the empty-state viewer.

## Alternatives

- Install pdf.js locally: add `pdfjs-dist` and import from node_modules for offline operation.
- Use dynamic import and cache PDFs for repeated viewing.

## Scripts

```bash
pnpm dev    # start dev server (Turbopack)
pnpm build  # production build
pnpm start  # start production server
```

## Usage Tips

- Select a tool in the toolbar, then click/drag on the page to add annotations. Use Select to move/resize.
- Change Color/Stroke/Text size to update the selected annotation or set defaults for new ones.
- Toggle Snap for grid-aligned positioning and resizing.
- Export your annotations to JSON, and later Import them back for the same PDF.

## Opening the Native Viewer (Optional)

If you need a native-tab view of the loaded PDF (similar to using `window.open` on a Blob URL), you can add a small button wired to the current PDF data source and call `window.open(URL.createObjectURL(new Blob([...], { type: 'application/pdf' })))`. Our viewer focuses on in-canvas rendering and printing; integrate this optionally if your flow needs it.

## Deploy to GitHub Pages

This app supports static export and deployment to GitHub Pages.

- Static export: `pnpm build && pnpm export` generates `web-app/out/`.
- GitHub Actions: A workflow is provided at `.github/workflows/deploy.yml` that builds and publishes to Pages on pushes to `main`.
- Base path: The workflow sets `NEXT_PUBLIC_BASE_PATH='/${repo-name}'` and `GITHUB_PAGES=true` so assets resolve correctly under project pages. If you use a custom Pages path, update that env.

Local preview of the static build:

```bash
pnpm build
pnpm export
npx serve out  # or any static server
```

## License

This project integrates pdf.js via CDN; refer to Mozilla pdf.js licensing for details. Your application code remains under your repository’s chosen license.
