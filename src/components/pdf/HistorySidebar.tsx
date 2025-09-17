"use client";
import React from "react";

type Props = {
  history: { action: string; data: any }[];
  historyIndex: number;
  onUndo?: () => void;
  onRedo?: () => void;
  disableUndo?: boolean;
  disableRedo?: boolean;
};

export default function HistorySidebar({ history, historyIndex, onUndo, onRedo, disableUndo, disableRedo }: Props) {
  return (
    <aside className="w-48 shrink-0 h-[calc(100%-200px)] overflow-auto bg-white dark:bg-gray-900 rounded-lg shadow-md p-2">
      <div className="text-xs text-gray-500 dark:text-gray-300 px-1 pb-2 flex items-center justify-between">
        <span>History</span>
        <div className="flex items-center gap-1">
          {onUndo && (
            <button
              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded disabled:opacity-50"
              onClick={onUndo}
              disabled={!!disableUndo}
              title="Undo"
            >
              Undo
            </button>
          )}
          {onRedo && (
            <button
              className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded disabled:opacity-50"
              onClick={onRedo}
              disabled={!!disableRedo}
              title="Redo"
            >
              Redo
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {history.map((entry, idx) => (
          <div
            key={idx}
            className={`text-xs p-2 rounded ${
              idx === historyIndex ? 'bg-indigo-100' : idx > historyIndex ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
            } text-gray-800 dark:text-gray-100`}
          >
            <div className="font-medium">{entry.action}</div>
            <div className="text-gray-600 dark:text-gray-300">
              {entry.action === 'delete' && `Deleted page ${entry.data.page}`}
              {entry.action === 'reorder' && `Reordered pages`}
              {entry.action === 'restore' && `Restored ${entry.data.pages.length} pages`}
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <div className="text-xs text-gray-400 dark:text-gray-500 p-2">No operations yet</div>
        )}
      </div>
    </aside>
  );
}