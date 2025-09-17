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
  snap?: boolean;
  setSnap?: (v: boolean) => void;
  onExport?: () => void;
  onImport?: (json: string) => void;
};

export default function Toolbar({ tool, setTool, onImagePick, onClearPage, color, setColor, lineWidth, setLineWidth, textSize, setTextSize, snap, setSnap, onExport, onImport }: Props) {
  const btn = (t: Tool, label: string) => (
    <button
      type="button"
      onClick={() => setTool(t)}
      className={
        "px-3 py-1 rounded-md border " +
        (tool === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50")
      }
      aria-pressed={tool === t}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {btn("select", "Select")}
      {btn("text", "Text")}
      {btn("rect", "Rectangle")}
      {btn("ellipse", "Ellipse")}
      <label className="px-3 py-1 rounded-md border bg-white text-gray-800 border-gray-300 hover:bg-gray-50 cursor-pointer">
        Image
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
        className="px-3 py-1 rounded-md border bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
      >
        Clear Page
      </button>
      <div className="ml-4 flex items-center gap-2">
        <label className="text-xs text-gray-600">Color</label>
        <input type="color" value={color} onChange={(e) => setColor?.(e.target.value)} />
        <label className="text-xs text-gray-600">Stroke</label>
        <input type="number" min={1} max={12} value={lineWidth} onChange={(e) => setLineWidth?.(parseInt(e.target.value))} className="w-16" />
        <label className="text-xs text-gray-600">Text</label>
        <input type="number" min={10} max={48} value={textSize} onChange={(e) => setTextSize?.(parseInt(e.target.value))} className="w-16" />
        <label className="text-xs text-gray-600">Snap</label>
        <input type="checkbox" checked={!!snap} onChange={(e) => setSnap?.(e.target.checked)} />
      </div>
      <div className="ml-4 flex items-center gap-2">
        <button type="button" className="px-3 py-1 rounded-md border bg-white text-gray-800 border-gray-300 hover:bg-gray-50" onClick={onExport}>Export</button>
        <label className="px-3 py-1 rounded-md border bg-white text-gray-800 border-gray-300 hover:bg-gray-50 cursor-pointer">
          Import
          <input type="file" accept="application/json" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const text = await f.text();
            onImport?.(text);
          }} />
        </label>
      </div>
    </div>
  );
}
