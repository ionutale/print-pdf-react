"use client";
import React from "react";

type Props = {
  visible: boolean;
  pageLabel: string;
  disablePrev: boolean;
  disableNext: boolean;
  disablePrint: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPrint: () => void;
};

export default function Controls({
  visible,
  pageLabel,
  disablePrev,
  disableNext,
  disablePrint,
  onPrev,
  onNext,
  onPrint,
}: Props) {
  return (
    <div id="pdf-controls" className={(visible ? "flex" : "hidden") + " items-center gap-4"}>
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
    </div>
  );
}
