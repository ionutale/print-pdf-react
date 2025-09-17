"use client";
import React from "react";

type Props = {
  onChange: (file: File | null) => void;
};

export default function FilePicker({ onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor="file-upload" className="btn btn-sm btn-primary normal-case inline-flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M4.5 3A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 15.5 3h-11Zm9.78 7.28-2.25-2.25a.75.75 0 0 0-1.06 0l-2.72 2.72-1.44-1.44a.75.75 0 0 0-1.06 0L4 10.78V14.5c0 .276.224.5.5.5h11a.5.5 0 0 0 .5-.5v-1.11a.5.5 0 0 0-.15-.35l-1.07-1.26Z"/></svg>
        <span>Select PDF</span>
      </label>
      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept="application/pdf"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.files?.[0] ?? null)}
      />
      <span id="file-name" className="text-sm text-gray-600 dark:text-gray-400 truncate">
        No file selected
      </span>
    </div>
  );
}
