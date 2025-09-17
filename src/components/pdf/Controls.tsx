"use client";
import React from "react";

type Props = {
  visible: boolean;
  pageLabel: string;
  disablePrev: boolean;
  disableNext: boolean;
  disablePrint: boolean;
  disableOpen?: boolean;
  disableSave?: boolean;
  fitMode?: 'page' | 'width' | '100%';
  onChangeFitMode?: (m: 'page' | 'width' | '100%') => void;
  onPrev: () => void;
  onNext: () => void;
  onPrint: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  disableUndo?: boolean;
  disableRedo?: boolean;
};

export default function Controls({
  visible,
  pageLabel,
  disablePrev,
  disableNext,
  disablePrint,
  disableOpen,
  disableSave,
  fitMode,
  onChangeFitMode,
  onPrev,
  onNext,
  onPrint,
  onOpen,
  onSave,
  onUndo,
  onRedo,
  disableUndo,
  disableRedo,
}: Props) {
  return (
    <div id="pdf-controls" className={(visible ? "flex" : "hidden") + " items-center gap-4"}>
      {onUndo && (
        <button
          className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onUndo}
          disabled={!!disableUndo}
        >
          Undo
        </button>
      )}
      {onRedo && (
        <button
          className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onRedo}
          disabled={!!disableRedo}
        >
          Redo
        </button>
      )}
      <button
        id="prev-page"
        className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onPrev}
        disabled={disablePrev}
      >
        &larr; Prev
      </button>
      <span id="page-indicator" className="text-sm font-medium text-gray-700">
        {pageLabel}
      </span>
      {onChangeFitMode && (
        <div className="inline-flex items-center gap-2 text-xs text-gray-600">
          <span>Fit</span>
          <select
            value={fitMode}
            onChange={(e) => onChangeFitMode?.(e.target.value as any)}
            className="text-xs border rounded px-2 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100"
          >
            <option value="page">Page</option>
            <option value="width">Width</option>
            <option value="100%">100%</option>
          </select>
        </div>
      )}
      <button
        id="next-page"
        className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onNext}
        disabled={disableNext}
      >
        Next &rarr;
      </button>
      <button
        id="print-pdf"
        className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
        onClick={onPrint}
        disabled={disablePrint}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm-6 8h6v4H7v-4z"
            clipRule="evenodd"
          />
        </svg>
        Print
      </button>
      {onSave && (
        <button
          id="save-pdf"
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onSave}
          disabled={!!disableSave}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7.414a2 2 0 00-.586-1.414l-3.414-3.414A2 2 0 0012.586 2H4zm2 3a1 1 0 011-1h6a1 1 0 011 1v3H6V6zm0 5h8v4H6v-4z" />
          </svg>
          Save
        </button>
      )}
      <button
        id="open-native"
        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onOpen}
        disabled={!!disableOpen}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
        </svg>
        Open
      </button>
    </div>
  );
}
