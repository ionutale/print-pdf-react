"use client";
import React from "react";

type Props = {
  history: { action: string; data: any }[];
  historyIndex: number;
};

export default function HistorySidebar({ history, historyIndex }: Props) {
  return (
    <aside className="w-48 shrink-0 h-[calc(100vh-200px)] overflow-auto bg-white rounded-lg shadow-md p-2">
      <div className="text-xs text-gray-500 px-1 pb-1">History</div>
      <div className="flex flex-col gap-1">
        {history.map((entry, idx) => (
          <div
            key={idx}
            className={`text-xs p-2 rounded ${
              idx === historyIndex ? 'bg-indigo-100' : idx > historyIndex ? 'bg-gray-50' : 'bg-white'
            }`}
          >
            <div className="font-medium">{entry.action}</div>
            <div className="text-gray-600">
              {entry.action === 'delete' && `Deleted page ${entry.data.page}`}
              {entry.action === 'reorder' && `Reordered pages`}
              {entry.action === 'restore' && `Restored ${entry.data.pages.length} pages`}
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <div className="text-xs text-gray-400 p-2">No operations yet</div>
        )}
      </div>
    </aside>
  );
}