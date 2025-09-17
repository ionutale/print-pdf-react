"use client";
import React from "react";

export type Tool = "select" | "text" | "rect" | "ellipse" | "image";

type Props = {
  tool: Tool;
  setTool: (t: Tool) => void;
  onImagePick: (file: File | null) => void;
  onClearPage: () => void;
};

export default function Toolbar({ tool, setTool, onImagePick, onClearPage }: Props) {
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
    </div>
  );
}
