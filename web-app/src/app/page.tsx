"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfReady, setPdfReady] = useState(false);

  useEffect(() => {
    if (!pdfReady || !window.pdfjsLib) return;

    const fileUpload = document.getElementById("file-upload") as HTMLInputElement | null;
    const fileNameSpan = document.getElementById("file-name");
    const pdfControls = document.getElementById("pdf-controls");
    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");
    const printPdfBtn = document.getElementById("print-pdf");
    const pageIndicator = document.getElementById("page-indicator");
    const placeholder = document.getElementById("placeholder");
    const loader = document.getElementById("loader");
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let pdfDoc: any = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending: number | null = null;
    const scale = 1.5;

    const updateNavButtons = () => {
      (prevPageBtn as HTMLButtonElement).disabled = pageNum <= 1;
      (nextPageBtn as HTMLButtonElement).disabled = !!pdfDoc && pageNum >= pdfDoc.numPages;
    };

    const renderPage = (num: number) => {
      pageRendering = true;
      pdfDoc.getPage(num).then((page: any) => {
        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderContext = { canvasContext: ctx, viewport };
        const renderTask = page.render(renderContext);
        renderTask.promise.then(() => {
          pageRendering = false;
          if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
          }
        });
      });
      if (pageIndicator) pageIndicator.textContent = `Page ${num} / ${pdfDoc.numPages}`;
      updateNavButtons();
    };

    const queueRenderPage = (num: number) => {
      if (pageRendering) {
        pageNumPending = num;
      } else {
        renderPage(num);
      }
    };

    const onPrevPage = () => {
      if (pageNum <= 1) return;
      pageNum--;
      queueRenderPage(pageNum);
    };

    const onNextPage = () => {
      if (pageNum >= pdfDoc.numPages) return;
      pageNum++;
      queueRenderPage(pageNum);
    };

    const onPrintPdf = async () => {
      if (!pdfDoc) return;
      (printPdfBtn as HTMLButtonElement).disabled = true;
      const printContainer = document.getElementById("print-container")!;
      printContainer.innerHTML = "";
      for (let num = 1; num <= pdfDoc.numPages; num++) {
        // eslint-disable-next-line no-await-in-loop
        const page = await pdfDoc.getPage(num);
        const viewport = page.getViewport({ scale: 2 });
        const c = document.createElement("canvas");
        c.className = "print-page";
        c.width = viewport.width;
        c.height = viewport.height;
        const cctx = c.getContext("2d")!;
        // eslint-disable-next-line no-await-in-loop
        await page.render({ canvasContext: cctx, viewport }).promise;
        printContainer.appendChild(c);
      }
      requestAnimationFrame(() => window.print());
      const cleanup = () => {
        printContainer.innerHTML = "";
        (printPdfBtn as HTMLButtonElement).disabled = false;
        window.removeEventListener("afterprint", cleanup);
      };
      window.addEventListener("afterprint", cleanup);
    };

    const fileChange = (e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files && input.files[0];
      if (file && file.type === "application/pdf") {
        if (fileNameSpan) fileNameSpan.textContent = file.name;
        const reader = new FileReader();
        reader.onload = function () {
          const pdfData = new Uint8Array(this.result as ArrayBuffer);
          placeholder?.classList.add("hidden");
          canvas.classList.add("hidden");
          loader?.classList.remove("hidden");
          pdfControls?.classList.add("hidden");
          pdfControls?.classList.remove("flex");
          const loadingTask = window.pdfjsLib.getDocument(pdfData);
          loadingTask.promise
            .then((pdf: any) => {
              pdfDoc = pdf;
              pageNum = 1;
              loader?.classList.add("hidden");
              canvas.classList.remove("hidden");
              pdfControls?.classList.remove("hidden");
              pdfControls?.classList.add("flex");
              renderPage(pageNum);
            })
            .catch(() => {
              loader?.classList.add("hidden");
              placeholder?.classList.remove("hidden");
              if (fileNameSpan) fileNameSpan.textContent = "Could not load PDF.";
            });
        };
        reader.readAsArrayBuffer(file);
      } else {
        if (fileNameSpan) fileNameSpan.textContent = "Please select a PDF file.";
      }
    };

    prevPageBtn?.addEventListener("click", onPrevPage);
    nextPageBtn?.addEventListener("click", onNextPage);
    printPdfBtn?.addEventListener("click", onPrintPdf);
    fileUpload?.addEventListener("change", fileChange);

    return () => {
      prevPageBtn?.removeEventListener("click", onPrevPage);
      nextPageBtn?.removeEventListener("click", onNextPage);
      printPdfBtn?.removeEventListener("click", onPrintPdf);
      fileUpload?.removeEventListener("change", fileChange);
    };
  }, [pdfReady]);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
            setPdfReady(true);
          }
        }}
      />
      <div className="bg-gray-100 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl screen">
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="file-upload" className="file-input-button whitespace-nowrap">
                  Select PDF
                </label>
                <input id="file-upload" type="file" className="hidden" accept="application/pdf" />
                <span id="file-name" className="text-sm text-gray-500 truncate">
                  No file selected
                </span>
              </div>
              <div id="pdf-controls" className="hidden items-center gap-4">
                <button
                  id="prev-page"
                  className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &larr; Prev
                </button>
                <span id="page-indicator" className="text-sm font-medium text-gray-700">
                  Page 0 / 0
                </span>
                <button
                  id="next-page"
                  className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next &rarr;
                </button>
                <button
                  id="print-pdf"
                  className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
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
            </div>
          </div>
          <div id="pdf-viewer" className="bg-white p-4 rounded-lg shadow-md flex justify-center items-center h-[calc(100vh-150px)]">
            <div id="placeholder" className="text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">PDF Preview</h3>
              <p className="mt-1 text-sm text-gray-500">Select a PDF file to get started.</p>
            </div>
            <canvas id="pdf-render" ref={canvasRef} className="hidden border border-gray-200 shadow"></canvas>
            <div id="loader" className="hidden animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
          </div>
        </div>
        <div id="print-container"></div>
      </div>
    </>
  );
}
