"use client";
import React from "react";

type Props = {
  onChange: (file: File | null) => void;
};

export default function FilePicker({ onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="file-upload" className="file-input-button whitespace-nowrap">
        Select PDF
      </label>
      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept="application/pdf"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.files?.[0] ?? null)}
      />
      <span id="file-name" className="text-sm text-gray-500 truncate">
        No file selected
      </span>
    </div>
  );
}
