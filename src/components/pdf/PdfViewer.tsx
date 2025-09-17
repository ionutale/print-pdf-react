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
import Toolbar, { type Tool } from "./Toolbar";
import HistorySidebar from "./HistorySidebar";
import AnnotationOverlay, { type Annotation } from "./AnnotationOverlay";

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
  const [tool, setTool] = useState<Tool>("select");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [thumbScale, setThumbScale] = useState<number>(20);
  const [visiblePages, setVisiblePages] = useState<number[] | null>(null);
  const [hiddenPages, setHiddenPages] = useState<number[]>([]);
  const [history, setHistory] = useState<{ action: string; data: any }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [strokeColor, setStrokeColor] = useState<string>("#ef4444");
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [textSize, setTextSize] = useState<number>(14);
  const [snap, setSnap] = useState<boolean>(false);
  const pdfBytesRef = useRef<Uint8Array | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const printContainerRef = useRef<HTMLDivElement | null>(null);

  const scale = 1.5;

  const updatePageLabel = () => {
    const total = visiblePages ? visiblePages.length : (pdfDoc?.numPages ?? 0);
    if (!pdfDoc || total === 0) return "Page 0 / 0";
    const idx = visiblePages ? visiblePages.indexOf(pageNum) : pageNum - 1;
    const pos = idx >= 0 ? idx + 1 : 0;
    return `Page ${pos} / ${total}`;
  };

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
    if (!pdfDoc) return;
    const pages = visiblePages ?? Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);
    const idx = pages.indexOf(pageNum);
    if (idx <= 0) return;
    const n = pages[idx - 1];
    setPageNum(n);
    queueRenderPage(n);
  };

  const onNextPage = () => {
    if (!pdfDoc) return;
    const pages = visiblePages ?? Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);
    const idx = pages.indexOf(pageNum);
    if (idx === -1 || idx >= pages.length - 1) return;
    const n = pages[idx + 1];
    setPageNum(n);
    queueRenderPage(n);
  };

  const onPrint = async () => {
    if (!pdfDoc || !printContainerRef.current) return;
    const btnDisabled = true;
    void btnDisabled; // kept for parity, state handled via derived props
    const container = printContainerRef.current;
    container.innerHTML = "";
    const pages = visiblePages ?? Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);
    for (const num of pages) {
      // eslint-disable-next-line no-await-in-loop
      const page = await pdfDoc.getPage(num);
      const printScale = 2;
      const viewport = page.getViewport({ scale: printScale });
      const c = document.createElement("canvas");
      c.className = "print-page";
      c.width = viewport.width;
      c.height = viewport.height;
      const cctx = c.getContext("2d")!;
      // eslint-disable-next-line no-await-in-loop
      await page.render({ canvasContext: cctx, viewport }).promise;
      // draw annotations for this page
      const ratio = printScale / 1.5; // screen scale is 1.5
      annotations.filter((a) => a.page === num).forEach((a) => {
        if (a.type === "text") {
          cctx.fillStyle = a.color;
          const size = ("size" in a && a.size ? a.size : textSize) as number;
          cctx.font = `${size * ratio}px Inter, system-ui, -apple-system, sans-serif`;
          cctx.fillText(a.text, a.x * ratio, a.y * ratio);
        } else if (a.type === "image") {
          const img = new Image();
          img.src = a.src;
          img.onload = () => {
            cctx.drawImage(img, a.x * ratio, a.y * ratio, a.w * ratio, a.h * ratio);
          };
        } else {
          cctx.strokeStyle = a.color;
          const stroke = ("stroke" in a && a.stroke ? a.stroke : lineWidth) as number;
          cctx.lineWidth = stroke * ratio;
          if (a.type === "rect") {
            cctx.strokeRect(a.x * ratio, a.y * ratio, a.w * ratio, a.h * ratio);
          } else if (a.type === "ellipse") {
            const cx = a.x * ratio + (a.w * ratio) / 2;
            const cy = a.y * ratio + (a.h * ratio) / 2;
            cctx.beginPath();
            cctx.ellipse(cx, cy, (a.w * ratio) / 2, (a.h * ratio) / 2, 0, 0, Math.PI * 2);
            cctx.stroke();
          }
        }
      });
      container.appendChild(c);
    }
    requestAnimationFrame(() => window.print());
    const cleanup = () => {
      container.innerHTML = "";
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
  };

  const addImageAnnotation = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const id = crypto.randomUUID();
        setAnnotations((prev) =>
          prev.concat({ id, type: "image", x: 20, y: 20, w: Math.min(200, img.width), h: Math.min(200, img.height), src: img.src as any, page: pageNum })
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const clearCurrentPageAnnotations = () => {
    setAnnotations((prev) => prev.filter((a) => a.page !== pageNum));
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
      const arrayBuffer = this.result as ArrayBuffer;
      const pdfData = new Uint8Array(arrayBuffer);
      pdfBytesRef.current = pdfData;
      // compute file fingerprint
      crypto.subtle.digest("SHA-256", arrayBuffer).then((hashBuf) => {
        const hashArr = Array.from(new Uint8Array(hashBuf));
        const hash = hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
        setFileKey(hash);
        localStorage.setItem("pdf:last", hash);
      });
      const loadingTask = window.pdfjsLib.getDocument(pdfData);
      loadingTask.promise
        .then((pdf: any) => {
          setPdfDoc(pdf);
          // try restore
          let restored = false;
          try {
            const key = (window as any).pendingPdfHash || fileKey;
            const raw = key ? localStorage.getItem(`pdf:${key}`) : null;
            if (raw) {
              const saved = JSON.parse(raw) as { page?: number; annotations?: Annotation[]; pages?: number[] };
              if (saved.page) setPageNum(saved.page);
              if (saved.annotations) setAnnotations(saved.annotations);
              if (saved.pages && saved.pages.length) setVisiblePages(saved.pages);
              restored = true;
            }
          } catch {
            /* noop */
          }
          if (!restored) setPageNum(1);
          if (!restored) setVisiblePages(Array.from({ length: pdf.numPages }, (_, i) => i + 1));
          setHiddenPages([]);
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

  const onOpenNative = () => {
    const bytes = pdfBytesRef.current;
    if (!bytes) return;
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([buf as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };
  // keyboard: delete / backspace to remove selected, copy/paste, z-order
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        setAnnotations((prev) => prev.filter((a) => a.id !== selectedId));
        setSelectedId(null);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
        const a = annotations.find((x) => x.id === selectedId);
        if (a) localStorage.setItem("pdf:clip", JSON.stringify(a));
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "v") {
        const raw = localStorage.getItem("pdf:clip");
        if (raw) {
          try {
            const a = JSON.parse(raw) as Annotation;
            const id = crypto.randomUUID();
            const dupe = { ...a, id, x: a.x + 10, y: a.y + 10, page: pageNum } as Annotation;
            setAnnotations((prev) => prev.concat(dupe));
            setSelectedId(id);
          } catch {}
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "]") {
        // bring to front
        setAnnotations((prev) => {
          const idx = prev.findIndex((x) => x.id === selectedId);
          if (idx < 0) return prev;
          const arr = prev.slice();
          const [it] = arr.splice(idx, 1);
          arr.push(it);
          return arr;
        });
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "[") {
        // send to back
        setAnnotations((prev) => {
          const idx = prev.findIndex((x) => x.id === selectedId);
          if (idx < 0) return prev;
          const arr = prev.slice();
          const [it] = arr.splice(idx, 1);
          arr.unshift(it);
          return arr;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, annotations, pageNum]);

  // Apply toolbar style changes to currently selected annotation
  React.useEffect(() => {
    if (!selectedId) return;
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id !== selectedId) return a;
        if (a.type === "text") return { ...a, color: strokeColor, size: textSize } as any;
        if (a.type === "rect" || a.type === "ellipse") return { ...a, color: strokeColor, stroke: lineWidth } as any;
        return a;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokeColor, lineWidth, textSize, selectedId]);

  const onExport = () => {
    const pages = visiblePages ?? undefined;
    const data = JSON.stringify({ annotations, page: pageNum, pages }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `annotations-${fileKey?.slice(0, 8) ?? "session"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const onImport = (json: string) => {
    try {
      const data = JSON.parse(json) as { annotations?: Annotation[]; page?: number; pages?: number[] };
      if (data.annotations) setAnnotations(data.annotations);
      if (typeof data.page === "number") setPageNum(data.page);
      if (data.pages && data.pages.length) setVisiblePages(data.pages);
    } catch {}
  };

  // persist annotations and page when they change
  React.useEffect(() => {
    if (!fileKey) return;
    const payload = JSON.stringify({ page: pageNum, annotations, pages: visiblePages ?? undefined });
    try {
      localStorage.setItem(`pdf:${fileKey}`, payload);
    } catch {
      // ignore quota errors
    }
  }, [annotations, pageNum, fileKey, visiblePages]);

  // Safeguard: if current page becomes hidden (or not in visible list), move to nearest visible
  React.useEffect(() => {
    if (!pdfDoc || !visiblePages || visiblePages.length === 0) return;
    if (!visiblePages.includes(pageNum)) {
      // find nearest visible by absolute difference
      const nearest = visiblePages.reduce((best, p) => {
        if (best === null) return p;
        return Math.abs(p - pageNum) < Math.abs(best - pageNum) ? p : best;
      }, null as number | null)!;
      setPageNum(nearest);
      queueRenderPage(nearest);
    }
  }, [visiblePages, pageNum, pdfDoc]);

  const deletePage = (n: number) => {
    if (!visiblePages) return;
    if (visiblePages.length <= 1) return; // don't delete last page
    const idx = visiblePages.indexOf(n);
    if (idx === -1) return;
    const nextPages = visiblePages.filter((p) => p !== n);
    setVisiblePages(nextPages);
    setHiddenPages((prev) => Array.from(new Set([...prev, n])).sort((a, b) => a - b));
    setAnnotations((prev) => prev.filter((a) => a.page !== n));
    pushHistory('delete', { page: n, annotations: annotations.filter(a => a.page === n) });
    // adjust current page only if we removed the current one
    if (pageNum === n) {
      const candidate = nextPages[Math.max(0, idx - 1)] ?? nextPages[0];
      setPageNum(candidate);
      queueRenderPage(candidate);
    }
  };

  const restorePagesAtEnd = (pages: number[]) => {
    if (!pdfDoc) return;
    if (!visiblePages) return;
    const toRestore = pages.filter((p) => !visiblePages.includes(p));
    if (toRestore.length === 0) return;
    setVisiblePages([...visiblePages, ...toRestore]);
    setHiddenPages((prev) => prev.filter((p) => !toRestore.includes(p)));
    pushHistory('restore', { pages: toRestore });
  };

  const pushHistory = (action: string, data: any) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ action, data });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex < 0) return;
    const entry = history[historyIndex];
    if (entry.action === 'delete') {
      const { page, annotations } = entry.data;
      setVisiblePages(prev => prev ? [...prev, page] : [page]);
      setHiddenPages(prev => prev.filter(p => p !== page));
      setAnnotations(prev => [...prev, ...annotations]);
    } else if (entry.action === 'reorder') {
      setVisiblePages(entry.data.prevVisible);
    } else if (entry.action === 'restore') {
      const { pages } = entry.data;
      setVisiblePages(prev => prev ? prev.filter(p => !pages.includes(p)) : []);
      setHiddenPages(prev => [...prev, ...pages]);
    }
    setHistoryIndex(historyIndex - 1);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];
    if (entry.action === 'delete') {
      const { page } = entry.data;
      setVisiblePages(prev => prev ? prev.filter(p => p !== page) : []);
      setHiddenPages(prev => [...prev, page]);
      setAnnotations(prev => prev.filter(a => a.page !== page));
    } else if (entry.action === 'reorder') {
      setVisiblePages(entry.data.newVisible);
    } else if (entry.action === 'restore') {
      const { pages } = entry.data;
      setVisiblePages(prev => prev ? [...prev, ...pages] : pages);
      setHiddenPages(prev => prev.filter(p => !pages.includes(p)));
    }
    setHistoryIndex(historyIndex + 1);
  };

  const restorePagesAtPosition = (pages: number[], position: number) => {
    if (!pdfDoc) return;
    if (!visiblePages) return;
    const toRestore = pages.filter((p) => !visiblePages.includes(p));
    if (toRestore.length === 0) return;
    const nextVisible = [...visiblePages];
    nextVisible.splice(position, 0, ...toRestore);
    setVisiblePages(nextVisible);
    setHiddenPages((prev) => prev.filter((p) => !toRestore.includes(p)));
    pushHistory('restore', { pages: toRestore });
  };

  const reorderPages = (nextOrder: number[]) => {
    // Accept only permutation of current visiblePages
    if (!visiblePages) return;
    const setA = new Set(visiblePages);
    const setB = new Set(nextOrder);
    if (setA.size !== setB.size) return;
    for (const v of setA) if (!setB.has(v)) return;
    pushHistory('reorder', { prevVisible: visiblePages.slice(), newVisible: nextOrder.slice() });
    setVisiblePages(nextOrder.slice());
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
            <div className="text-sm text-gray-500">{pdfDoc ? (typeof pdfDoc.numPages === "number" ? `${pdfDoc.numPages} pages loaded` : "PDF loaded") : "No PDF loaded"}</div>
            <Controls
              visible={controlsVisible}
              pageLabel={pageLabel}
              disablePrev={!pdfDoc || (() => { const pages = visiblePages ?? Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1); const idx = pages.indexOf(pageNum); return idx <= 0; })()}
              disableNext={!pdfDoc || (() => { const pages = visiblePages ?? Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1); const idx = pages.indexOf(pageNum); return idx === -1 || idx >= pages.length - 1; })()}
              disablePrint={!pdfDoc}
              onPrev={onPrevPage}
              onNext={onNextPage}
              onPrint={onPrint}
              onOpen={onOpenNative}
              disableOpen={!pdfDoc}
              onUndo={undo}
              onRedo={redo}
              disableUndo={historyIndex < 0}
              disableRedo={historyIndex >= history.length - 1}
            />
          </div>
          <div className="mt-3">
            <Toolbar
              tool={tool}
              setTool={setTool}
              onImagePick={addImageAnnotation}
              onClearPage={clearCurrentPageAnnotations}
              color={strokeColor}
              setColor={setStrokeColor}
              lineWidth={lineWidth}
              setLineWidth={setLineWidth}
              textSize={textSize}
              setTextSize={setTextSize}
              snap={snap}
              setSnap={setSnap}
              onExport={onExport}
              onImport={onImport}
            />
          </div>
        </div>
          <div className="flex gap-4">
          <div className="flex flex-col gap-2">
            <div className="bg-white rounded-lg shadow p-2 text-xs text-gray-600">
              Thumb scale
              <input
                type="range"
                min={10}
                max={40}
                value={thumbScale}
                onChange={(e) => setThumbScale(parseInt(e.target.value))}
                className="w-36 ml-2 align-middle"
              />
            </div>
            <ThumbnailsSidebar
              pdfDoc={pdfDoc}
              currentPage={pageNum}
              onSelectPage={(n: number) => {
                if (!pdfDoc) return;
                setPageNum(n);
                queueRenderPage(n);
              }}
              thumbScale={thumbScale}
              pages={visiblePages ?? undefined}
              onDeletePage={deletePage}
              hiddenPages={hiddenPages}
              onRestorePagesAtEnd={restorePagesAtEnd}
              onRestorePagesAtPosition={restorePagesAtPosition}
              onReorderPages={reorderPages}
            />
          </div>
            <div
              id="pdf-viewer"
              className="relative bg-white p-4 rounded-lg shadow-md flex justify-center items-center h-[calc(100vh-150px)] grow"
              onDragOver={(e) => {
                if (pdfDoc) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={(e) => {
                if (pdfDoc) return;
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type === "application/pdf") onFile(file);
              }}
            >
              {!pdfDoc && !isLoading && (
                <div className="text-center text-gray-500">
                  <Placeholder />
                  <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 justify-center">
                    <FilePicker onChange={onFile} />
                    <div className="text-xs text-gray-400">or drag & drop a PDF here</div>
                  </div>
                </div>
              )}
              <PdfCanvas ref={canvasRef} hidden={!pdfDoc || isLoading} />
              <Loader hidden={!isLoading} />
              {pdfDoc && !isLoading && (
                <AnnotationOverlay
                  tool={tool}
                  page={pageNum}
                  annotations={annotations}
                  setAnnotations={setAnnotations}
                  canvasRef={canvasRef}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  snapEnabled={snap}
                  snapSize={8}
                  defaultColor={strokeColor}
                  defaultStroke={lineWidth}
                  defaultTextSize={textSize}
                />
              )}
            </div>
            <HistorySidebar history={history} historyIndex={historyIndex} />
        </div>
      </div>
      <PrintContainer ref={printContainerRef} />
    </>
  );
}
