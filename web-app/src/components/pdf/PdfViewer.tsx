"use client";
import Script from "next/script";
import React, { useCallback, useRef, useState } from "react";
import FilePicker from "./FilePicker";
import Controls from "./Controls";
import Placeholder from "./Placeholder";
import Loader from "./Loader";
import PdfCanvas from "./PdfCanvas";
import PrintContainer from "./PrintContainer";
import ThumbnailsSidebar from "./ThumbnailsSidebar";

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export default function PdfViewer() {
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageRendering, setPageRendering] = useState(false);
  const [pageNumPending, setPageNumPending] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const printContainerRef = useRef<HTMLDivElement | null>(null);

  const scale = 1.5;

  const updatePageLabel = () => `Page ${pdfDoc ? pageNum : 0} / ${pdfDoc?.numPages ?? 0}`;

  const renderPage = useCallback(
    (num: number) => {
      if (!pdfDoc || !canvasRef.current) return;
      setPageRendering(true);
      pdfDoc.getPage(num).then((page: any) => {
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTask.promise.then(() => {
          setPageRendering(false);
          if (pageNumPending !== null) {
            const next = pageNumPending;
            setPageNumPending(null);
            renderPage(next);
          }
        });
      });
    },
    [pdfDoc, pageNumPending]
  );

  const queueRenderPage = (num: number) => {
    if (pageRendering) {
      setPageNumPending(num);
    } else {
      renderPage(num);
    }
  };

  const onPrevPage = () => {
    if (pageNum <= 1) return;
    const n = pageNum - 1;
    setPageNum(n);
    queueRenderPage(n);
  };

  const onNextPage = () => {
    if (!pdfDoc) return;
    if (pageNum >= pdfDoc.numPages) return;
    const n = pageNum + 1;
    setPageNum(n);
    queueRenderPage(n);
  };

  const onPrint = async () => {
    if (!pdfDoc || !printContainerRef.current) return;
    const btnDisabled = true;
    void btnDisabled; // kept for parity, state handled via derived props
    const container = printContainerRef.current;
    container.innerHTML = "";
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
      container.appendChild(c);
    }
    requestAnimationFrame(() => window.print());
    const cleanup = () => {
      container.innerHTML = "";
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
  };

  const onFile = (file: File | null) => {
    const fileNameSpan = document.getElementById("file-name");
    if (!file) {
      if (fileNameSpan) fileNameSpan.textContent = "No file selected";
      return;
    }
    if (file.type !== "application/pdf") {
      if (fileNameSpan) fileNameSpan.textContent = "Please select a PDF file.";
      return;
    }
    if (fileNameSpan) fileNameSpan.textContent = file.name;
    const reader = new FileReader();
    setIsLoading(true);
    reader.onload = function () {
      const pdfData = new Uint8Array(this.result as ArrayBuffer);
      const loadingTask = window.pdfjsLib.getDocument(pdfData);
      loadingTask.promise
        .then((pdf: any) => {
          setPdfDoc(pdf);
          setPageNum(1);
          setIsLoading(false);
          queueRenderPage(1);
        })
        .catch(() => {
          setIsLoading(false);
          setPdfDoc(null);
          const nameSpan = document.getElementById("file-name");
          if (nameSpan) nameSpan.textContent = "Could not load PDF.";
        });
    };
    reader.readAsArrayBuffer(file);
  };

  const pageLabel = updatePageLabel();
  const controlsVisible = !!pdfDoc && !isLoading;

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
      <div className="w-full max-w-5xl screen">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <FilePicker onChange={onFile} />
            <Controls
              visible={controlsVisible}
              pageLabel={pageLabel}
              disablePrev={!pdfDoc || pageNum <= 1}
              disableNext={!pdfDoc || (pdfDoc && pageNum >= pdfDoc.numPages)}
              disablePrint={!pdfDoc}
              onPrev={onPrevPage}
              onNext={onNextPage}
              onPrint={onPrint}
            />
          </div>
        </div>
        <div className="flex gap-4">
          <ThumbnailsSidebar
            pdfDoc={pdfDoc}
            currentPage={pageNum}
            onSelectPage={(n) => {
              if (!pdfDoc) return;
              setPageNum(n);
              queueRenderPage(n);
            }}
          />
          <div id="pdf-viewer" className="bg-white p-4 rounded-lg shadow-md flex justify-center items-center h-[calc(100vh-150px)] grow">
            {!pdfDoc && !isLoading && <Placeholder />}
            <PdfCanvas ref={canvasRef} hidden={!pdfDoc || isLoading} />
            <Loader hidden={!isLoading} />
          </div>
        </div>
      </div>
      <PrintContainer ref={printContainerRef} />
    </>
  );
}
