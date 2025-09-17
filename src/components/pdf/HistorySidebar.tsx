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
              className="btn btn-xs btn-ghost"
              onClick={onUndo}
              disabled={!!disableUndo}
              title="Undo"
            >
              <span className="inline-flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M7.78 4.72a.75.75 0 010 1.06L5.56 8l2.22 2.22a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06l3-3a.75.75 0 011.06 0z" clipRule="evenodd"/><path fillRule="evenodd" d="M3.75 8a.75.75 0 01.75-.75h6.5a3.75 3.75 0 110 7.5H6.5a.75.75 0 010-1.5h4.5a2.25 2.25 0 100-4.5H4.5A.75.75 0 013.75 8z" clipRule="evenodd"/></svg>
                Undo
              </span>
            </button>
          )}
          {onRedo && (
            <button
              className="btn btn-xs btn-ghost"
              onClick={onRedo}
              disabled={!!disableRedo}
              title="Redo"
            >
              <span className="inline-flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M12.22 4.72a.75.75 0 010 1.06L10 8l2.22 2.22a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06l3-3a.75.75 0 011.06 0z" clipRule="evenodd"/><path fillRule="evenodd" d="M16.25 8a.75.75 0 00-.75-.75h-6.5a3.75 3.75 0 000 7.5h4.25a.75.75 0 000-1.5H8.5a2.25 2.25 0 010-4.5h7A.75.75 0 0016.25 8z" clipRule="evenodd"/></svg>
                Redo
              </span>
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