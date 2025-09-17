"use client";
import React from "react";

export type Tool = "select" | "text" | "rect" | "ellipse" | "image";

type Props = {
  tool: Tool;
  setTool: (t: Tool) => void;
  onImagePick: (file: File | null) => void;
  onClearPage: () => void;
  color?: string;
  setColor?: (c: string) => void;
  lineWidth?: number;
  setLineWidth?: (w: number) => void;
  textSize?: number;
  setTextSize?: (s: number) => void;
  fontFamily?: string;
  setFontFamily?: (f: string) => void;
  snap?: boolean;
  setSnap?: (v: boolean) => void;
  onExport?: () => void;
  onImport?: (json: string) => void;
};

export default function Toolbar({ tool, setTool, onImagePick, onClearPage, color, setColor, lineWidth, setLineWidth, textSize, setTextSize, fontFamily, setFontFamily, snap, setSnap, onExport, onImport }: Props) {
  const [theme, setTheme] = React.useState<'system' | 'light' | 'dark'>(() => (typeof window !== 'undefined' ? (localStorage.getItem('theme') as any) || 'system' : 'system'));

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const apply = (mode: 'system' | 'light' | 'dark') => {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
      root.classList.toggle('dark', isDark);
    };
    apply(theme);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => theme === 'system' && apply('system');
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [theme]);
  const Icon = ({ name }: { name: string }) => {
    switch (name) {
      case "select":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M6.672 2.977a.75.75 0 0 1 .943-.943l9.25 2.474a.75.75 0 0 1 .149 1.37l-3.77 2.173 3.22 5.578a.75.75 0 0 1-1.03 1.03l-5.58-3.219-2.172 3.77a.75.75 0 0 1-1.369-.15l-2.474-9.25Z" />
          </svg>
        );
      case "text":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M3.5 4.75A.75.75 0 0 1 4.25 4h11.5a.75.75 0 0 1 0 1.5h-4.5v10a.75.75 0 0 1-1.5 0v-10h-5.5A.75.75 0 0 1 3.5 4.75Z" />
          </svg>
        );
      case "rect":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5v9A1.5 1.5 0 0 1 14.5 16h-9A1.5 1.5 0 0 1 4 14.5v-9Z" />
          </svg>
        );
      case "ellipse":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10 3.5c-4.142 0-7.5 2.91-7.5 6.5s3.358 6.5 7.5 6.5 7.5-2.91 7.5-6.5S14.142 3.5 10 3.5Z" />
          </svg>
        );
      case "image":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M4.5 5A1.5 1.5 0 0 0 3 6.5v7A1.5 1.5 0 0 0 4.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 15.5 5h-11Zm10.28 6.78-2.25-2.25a.75.75 0 0 0-1.06 0l-2.72 2.72-1.44-1.44a.75.75 0 0 0-1.06 0l-1.72 1.72c-.05.05-.08.1-.11.16V13.5c0 .276.224.5.5.5h11a.5.5 0 0 0 .49-.39.5.5 0 0 0-.18-.32Z" />
            <path d="M7.25 8A1.25 1.25 0 1 0 7.25 5.5 1.25 1.25 0 0 0 7.25 8Z" />
          </svg>
        );
      case "trash":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M7.5 3A1.5 1.5 0 0 0 6 4.5V5H3.5a.75.75 0 0 0 0 1.5h.59l.76 8.35A2 2 0 0 0 6.84 17h6.32a2 2 0 0 0 1.99-2.15l.76-8.35h.59a.75.75 0 0 0 0-1.5H14v-.5A1.5 1.5 0 0 0 12.5 3h-5Zm1.5 3.5a.75.75 0 0 1 1.5 0v7a.75.75 0 0 1-1.5 0v-7Zm4 0a.75.75 0 0 0-1.5 0v7a.75.75 0 0 0 1.5 0v-7Z" clipRule="evenodd" />
          </svg>
        );
      case "export":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M3 11.5A2.5 2.5 0 0 1 5.5 9h2a.75.75 0 0 1 0 1.5h-2a1 1 0 0 0-1 1v3A1.5 1.5 0 0 0 6 16h8a1.5 1.5 0 0 0 1.5-1.5v-3a1 1 0 0 0-1-1h-2a.75.75 0 0 1 0-1.5h2A2.5 2.5 0 0 1 17 11.5v3A3 3 0 0 1 14 17H6a3 3 0 0 1-3-3v-2.5Z" />
            <path d="M10.75 3.5a.75.75 0 0 0-1.5 0v6.19L7.53 7.97a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V3.5Z" />
          </svg>
        );
      case "import":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M14 3a3 3 0 0 1 3 3v2.5a.75.75 0 0 1-1.5 0V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v2.5a.75.75 0 0 1-1.5 0V6a3 3 0 0 1 3-3h8Z" />
            <path d="M10.75 7a.75.75 0 0 0-1.5 0v6.19L7.53 11.47a.75.75 0 1 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V7Z" />
          </svg>
        );
      case "grid":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M3.5 6A2.5 2.5 0 0 1 6 3.5h8A2.5 2.5 0 0 1 16.5 6v8A2.5 2.5 0 0 1 14 16.5H6A2.5 2.5 0 0 1 3.5 14V6Zm3 0a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V6.5a.5.5 0 0 0-.5-.5h-7Z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const btn = (t: Tool, label: string) => (
    <button
      type="button"
      onClick={() => setTool(t)}
      className={
        "px-3 py-1 rounded-md border " +
        (tool === t
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700")
      }
      aria-pressed={tool === t}
    >
      <span className="inline-flex items-center gap-1"><Icon name={t} /> <span>{label}</span></span>
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 text-[13px] sm:text-sm">
      {btn("select", "Select")}
      {btn("text", "Text")}
      {btn("rect", "Rectangle")}
      {btn("ellipse", "Ellipse")}
      <label className="px-3 py-1 rounded-md border bg-white text-gray-800 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700 cursor-pointer inline-flex items-center gap-1">
        <Icon name="image" /> <span>Image</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onImagePick(e.target.files?.[0] ?? null)}
        />
      </label>
      <button
        type="button"
        onClick={onClearPage}
        className="px-3 py-1 rounded-md border bg-white text-gray-800 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700 inline-flex items-center gap-1"
      >
        <Icon name="trash" /> <span>Clear Page</span>
      </button>
      <div className="ml-4 flex items-center gap-2">
        <label className="text-xs text-gray-600 dark:text-gray-300 inline-flex items-center gap-1" title="Stroke/Text Color">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M10.75 3.5a.75.75 0 0 0-1.5 0v3.69l-1.47-1.47a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.47 1.47V3.5Z" /><path d="M4.5 12.5A2 2 0 0 1 6.5 10h7a2 2 0 0 1 2 2.5l-.5 2a2 2 0 0 1-1.94 1.5H6.94A2 2 0 0 1 5 14.5l-.5-2Z" /></svg>
          <span>Color</span>
        </label>
        <input type="color" value={color} onChange={(e) => setColor?.(e.target.value)} />
  <label className="text-xs text-gray-600 dark:text-gray-300 inline-flex items-center gap-1" title="Stroke Width">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M3.5 10a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 0 1.5H4.25A.75.75 0 0 1 3.5 10Z" /></svg>
          <span>Stroke</span>
        </label>
  <input type="number" min={1} max={12} value={lineWidth} onChange={(e) => setLineWidth?.(parseInt(e.target.value))} className="w-16 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded px-1" />
  <label className="text-xs text-gray-600 dark:text-gray-300 inline-flex items-center gap-1" title="Text Size">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M3.5 5.25A.75.75 0 0 1 4.25 4.5h11.5a.75.75 0 0 1 0 1.5h-5v9.25a.75.75 0 0 1-1.5 0V6h-5.5a.75.75 0 0 1-.75-.75Z" /></svg>
          <span>Text</span>
        </label>
  <input type="number" min={10} max={48} value={textSize} onChange={(e) => setTextSize?.(parseInt(e.target.value))} className="w-16 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded px-1" />
  <label className="text-xs text-gray-600 dark:text-gray-300 inline-flex items-center gap-1" title="Font Family">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M3.5 4.75A.75.75 0 0 1 4.25 4h11.5a.75.75 0 0 1 0 1.5h-4.5v10a.75.75 0 0 1-1.5 0v-10h-5.5A.75.75 0 0 1 3.5 4.75Z" /></svg>
          <span>Font</span>
        </label>
  <select value={fontFamily} onChange={(e) => setFontFamily?.(e.target.value)} className="text-xs border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100">
          <option value="Inter">Inter (Default)</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Dancing Script">Dancing Script (Cursive)</option>
          <option value="Great Vibes">Great Vibes (Cursive)</option>
          <option value="Allura">Allura (Cursive)</option>
          <option value="Satisfy">Satisfy (Cursive)</option>
          <option value="Caveat">Caveat (Handwriting)</option>
          <option value="Kalam">Kalam (Handwriting)</option>
          <option value="Permanent Marker">Permanent Marker (Marker)</option>
        </select>
  <label className="text-xs text-gray-600 dark:text-gray-300 inline-flex items-center gap-1" title="Snap to Grid">
          <Icon name="grid" /> <span>Snap</span>
        </label>
        <input type="checkbox" checked={!!snap} onChange={(e) => setSnap?.(e.target.checked)} />
      </div>
      <div className="ml-4 flex items-center gap-2">
        <button type="button" className="px-3 py-1 rounded-md border bg-white text-gray-800 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700 inline-flex items-center gap-1" onClick={onExport}>
          <Icon name="export" /> <span>Export</span>
        </button>
        <label className="px-3 py-1 rounded-md border bg-white text-gray-800 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700 cursor-pointer inline-flex items-center gap-1">
          <Icon name="import" /> <span>Import</span>
          <input type="file" accept="application/json" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const text = await f.text();
            onImport?.(text);
          }} />
        </label>
        <div className="ml-2 text-xs text-gray-600 dark:text-gray-300 inline-flex items-center gap-1">
          <span>Theme</span>
          <select
            value={theme}
            onChange={(e) => {
              const val = e.target.value as 'system' | 'light' | 'dark';
              setTheme(val);
              if (typeof window !== 'undefined') localStorage.setItem('theme', val);
            }}
            className="text-xs border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </div>
    </div>
  );
}
