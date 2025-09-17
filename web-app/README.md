## Print PDF React — Next.js App

An interactive PDF viewer with print support, built with Next.js App Router, Tailwind CSS v4, and pdf.js (via CDN). You can select a local PDF, navigate pages, and print full-size pages with proper page breaks.

## Quick Start

Using pnpm on macOS (zsh):

```bash
cd web-app
pnpm install
pnpm dev
```

Open http://localhost:3000 and select a PDF file.

## Features

- Upload local PDFs securely (processed in-browser)
- Page navigation with Prev/Next controls and page indicator
- Print all pages with per-page canvas rendering for crisp output
- Tailwind CSS styling; Inter font via next/font

## Architecture

- `src/app/page.tsx`: Minimal client page hosting the viewer container
- `src/components/pdf/PdfViewer.tsx`: Orchestrates pdf.js loading, file handling, rendering, printing
- `src/components/pdf/FilePicker.tsx`: Local file selector + filename display
- `src/components/pdf/Controls.tsx`: Navigation (Prev/Next), page label, and Print
- `src/components/pdf/PdfCanvas.tsx`: Canvas that renders the current page
- `src/components/pdf/Placeholder.tsx`: Empty state before PDF loads
- `src/components/pdf/Loader.tsx`: Spinner shown while loading/rendering
- `src/components/pdf/PrintContainer.tsx`: Hidden container for print-only canvases

Global styles (`src/app/globals.css`) include print rules to ensure each page prints on its own sheet and colors are preserved.

## Implementation Notes

- pdf.js is loaded via CDN using `next/script`. The worker is also pointed to the CDN version for Web Worker execution.
- For print, each page is rendered to its own canvas at a higher scale and placed in a hidden print container. CSS `@media print` ensures page breaks and zero margins.
- The viewer uses React state to manage visibility: placeholder vs. loader vs. canvas & controls.

## Alternatives

- Install pdf.js locally: add `pdfjs-dist` and import from node_modules for offline operation.
- Use dynamic import and cache PDFs for repeated viewing.

## Scripts

```bash
pnpm dev    # start dev server (Turbopack)
pnpm build  # production build
pnpm start  # start production server
```

## License

This project integrates pdf.js via CDN; refer to Mozilla pdf.js licensing for details. Your application code remains under your repository’s chosen license.
