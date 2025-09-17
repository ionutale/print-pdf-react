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
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [textSize, setTextSize] = useState<number>(14);
  const [fontFamily, setFontFamily] = useState<string>("Inter");
  const [snap, setSnap] = useState<boolean>(false);
  const pdfBytesRef = useRef<Uint8Array | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const printContainerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1.5);
  const [fitMode, setFitMode] = useState<'page' | 'width' | '100%'>(() => {
    if (typeof window === 'undefined') return 'page';
    return (localStorage.getItem('fitMode') as any) || 'page';
  });
  const [leftOpen, setLeftOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const v = localStorage.getItem('ui:leftOpen');
    return v == null ? true : v === '1';
  });
  const [rightOpen, setRightOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const v = localStorage.getItem('ui:rightOpen');
    return v == null ? true : v === '1';
  });
  const [fileName, setFileName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('save:fileName') || '';
  });

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
    [pdfDoc, pageNumPending, scale]
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

  // Fit page to available viewer area (no scroll; canvas scales to fit)
  React.useEffect(() => {
    const el = viewerRef.current;
    if (!el || !pdfDoc) return;
    let destroyed = false;
    const fit = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const v1 = page.getViewport({ scale: 1 });
        const padX = 16 * 2; // p-4 on container
        const padY = 16 * 2; // p-4 on container
        const availW = Math.max(0, el.clientWidth - padX);
        const availH = Math.max(0, el.clientHeight - padY);
        let s = 1;
        if (fitMode === 'page') s = Math.min(availW / v1.width, availH / v1.height);
        else if (fitMode === 'width') s = availW / v1.width;
        else if (fitMode === '100%') s = 1;
        s = Math.max(0.25, Math.min(6, s));
        if (!destroyed) setScale((prev) => (Math.abs(prev - s) > 0.01 ? s : prev));
      } catch {
        // ignore
      }
    };
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    void fit();
    return () => {
      destroyed = true;
      ro.disconnect();
    };
  }, [pdfDoc, pageNum, fitMode]);

  // Re-render current page when scale changes
  React.useEffect(() => {
    if (!pdfDoc) return;
    queueRenderPage(pageNum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('fitMode', fitMode);
  }, [fitMode]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('save:fileName', fileName);
  }, [fileName]);

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
          const font = ("fontFamily" in a && a.fontFamily ? a.fontFamily : fontFamily) as string;
          cctx.font = `${size * ratio}px ${font}, Inter, system-ui, -apple-system, sans-serif`;
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

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('ui:leftOpen', leftOpen ? '1' : '0');
  }, [leftOpen]);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('ui:rightOpen', rightOpen ? '1' : '0');
  }, [rightOpen]);

  const onSavePdf = async () => {
    if (!pdfDoc) return;
    const pages = visiblePages ?? Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);

    const renderPageToCanvas = async (num: number) => {
      const page = await pdfDoc.getPage(num);
      const saveScale = 2;
      const viewport = page.getViewport({ scale: saveScale });
      const c = document.createElement("canvas");
      c.width = viewport.width;
      c.height = viewport.height;
      const cctx = c.getContext("2d")!;
      await page.render({ canvasContext: cctx, viewport }).promise;
      const ratio = saveScale / 1.5; // screen scale is 1.5
      const anns = annotations.filter((a) => a.page === num);
      // draw annotations synchronously, awaiting images
      for (const a of anns) {
        if (a.type === "text") {
          cctx.fillStyle = a.color;
          const size = ("size" in a && a.size ? a.size : textSize) as number;
          const font = ("fontFamily" in a && a.fontFamily ? a.fontFamily : fontFamily) as string;
          cctx.font = `${size * ratio}px ${font}, Inter, system-ui, -apple-system, sans-serif`;
          cctx.fillText(a.text, a.x * ratio, a.y * ratio);
        } else if (a.type === "image") {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              cctx.drawImage(img, a.x * ratio, a.y * ratio, a.w * ratio, a.h * ratio);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = a.src;
          });
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
      }
      return { canvas: c, width: c.width, height: c.height };
    };

    const dataURLToUint8 = (dataURL: string) => {
      const base64 = dataURL.split(",")[1] ?? "";
      const binStr = atob(base64);
      const len = binStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
      return bytes;
    };

    const images: { data: Uint8Array; width: number; height: number }[] = [];
    for (const num of pages) {
      // eslint-disable-next-line no-await-in-loop
      const { canvas: c, width, height } = await renderPageToCanvas(num);
      const jpeg = c.toDataURL("image/jpeg", 0.92);
      images.push({ data: dataURLToUint8(jpeg), width, height });
    }

    const buildPdfFromJpegs = (imgs: { data: Uint8Array; width: number; height: number }[]) => {
      const enc = new TextEncoder();
      const chunks: (Uint8Array | string)[] = [];
      const offsets: number[] = [];

      const push = (part: Uint8Array | string) => {
        const last = chunks.length ? (typeof chunks[chunks.length - 1] === "string" ? enc.encode(chunks[chunks.length - 1] as string).length : (chunks[chunks.length - 1] as Uint8Array).byteLength) : 0;
        void last; // silence lint
        chunks.push(part);
      };
      const sizeSoFar = () => {
        let n = 0;
        for (const c of chunks) n += typeof c === "string" ? enc.encode(c).length : c.byteLength;
        return n;
      };

      const objects: { num: number; write: () => void }[] = [];
      let objNum = 1;
      const catalogNum = objNum++;
      const pagesNum = objNum++;
      const pageNums: number[] = [];
      const imgNums: number[] = [];
      const contentNums: number[] = [];

      // Prepare per-page objects numbers
      for (let i = 0; i < imgs.length; i++) {
        imgNums.push(objNum++);
        contentNums.push(objNum++);
        pageNums.push(objNum++);
      }

      const writeObjHeader = (num: number) => {
        offsets[num] = sizeSoFar();
        push(`${num} 0 obj\n`);
      };
      const writeObjFooter = () => {
        push(`\nendobj\n`);
      };

      // Header
      push("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");

      // Image objects
      imgs.forEach((img, idx) => {
        const num = imgNums[idx];
        writeObjHeader(num);
        push(`<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.data.byteLength} >>\nstream\n`);
        push(img.data);
        push(`\nendstream`);
        writeObjFooter();
      });

      // Content streams and pages
      imgs.forEach((img, idx) => {
        const cnum = contentNums[idx];
        const pnum = pageNums[idx];
        const inum = imgNums[idx];
        const content = `q\n${img.width} 0 0 ${img.height} 0 0 cm\n/Im0 Do\nQ\n`;
        writeObjHeader(cnum);
        push(`<< /Length ${content.length} >>\nstream\n`);
        push(content);
        push(`endstream`);
        writeObjFooter();

        writeObjHeader(pnum);
        push(`<< /Type /Page /Parent ${pagesNum} 0 R /MediaBox [0 0 ${img.width} ${img.height}] /Resources << /XObject << /Im0 ${inum} 0 R >> >> /Contents ${cnum} 0 R >>`);
        writeObjFooter();
      });

      // Pages object
      writeObjHeader(pagesNum);
      push(`<< /Type /Pages /Count ${imgs.length} /Kids [ ${pageNums.map((n) => `${n} 0 R`).join(" ")} ] >>`);
      writeObjFooter();

      // Catalog object
      writeObjHeader(catalogNum);
      push(`<< /Type /Catalog /Pages ${pagesNum} 0 R >>`);
      writeObjFooter();

      // xref
      const xrefStart = sizeSoFar();
      const totalObjs = objNum - 1;
      push(`xref\n0 ${totalObjs + 1}\n`);
      push(`0000000000 65535 f \n`);
      for (let i = 1; i <= totalObjs; i++) {
        const off = offsets[i] ?? 0;
        const offStr = off.toString().padStart(10, "0");
        push(`${offStr} 00000 n \n`);
      }
      // trailer
      push(`trailer\n<< /Size ${totalObjs + 1} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

      // Concat to single Uint8Array
      let len = 0;
      for (const c of chunks) len += typeof c === "string" ? enc.encode(c).length : c.byteLength;
      const out = new Uint8Array(len);
      let pos = 0;
      for (const c of chunks) {
        if (typeof c === "string") {
          const b = enc.encode(c);
          out.set(b, pos);
          pos += b.length;
        } else {
          out.set(c, pos);
          pos += c.byteLength;
        }
      }
      return out;
    };

    const pdfBytes = buildPdfFromJpegs(images);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const customName = (typeof window !== 'undefined' ? localStorage.getItem('save:fileName') : null) || '';
    const safeName = customName.trim() || `edited-${fileKey?.slice(0, 8) ?? "document"}`;
    a.download = `${safeName}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
        if (a.type === "text") return { ...a, color: strokeColor, size: textSize, fontFamily: fontFamily } as any;
        if (a.type === "rect" || a.type === "ellipse") return { ...a, color: strokeColor, stroke: lineWidth } as any;
        return a;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokeColor, lineWidth, textSize, fontFamily, selectedId]);

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
      <div className="w-full h-full flex flex-col">
  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-3 sm:p-4 mb-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">{pdfDoc ? (typeof pdfDoc.numPages === "number" ? `${pdfDoc.numPages} pages loaded` : "PDF loaded") : "No PDF loaded"}</div>
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
              fontFamily={fontFamily}
              setFontFamily={setFontFamily}
              snap={snap}
              setSnap={setSnap}
              onExport={onExport}
              onImport={onImport}
            />
          </div>
        </div>
          <div className="flex gap-4 flex-1 min-h-0">
          <div className={`flex flex-col gap-2 ${leftOpen ? 'w-[180px] min-w-[180px]' : 'w-0 min-w-0'} transition-[width] duration-300 shrink-0 overflow-hidden`}>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-2 text-xs text-gray-600 dark:text-gray-300 shrink-0">
              <div className="flex items-center justify-between">
                <span>Thumb scale</span>
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  onClick={() => setLeftOpen((v) => !v)}
                  title={leftOpen ? 'Hide thumbnails' : 'Show thumbnails'}
                >
                  <span className="inline-flex items-center gap-1">
                    {leftOpen ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M4 5.75A.75.75 0 0 1 4.75 5h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 5.75Zm0 4.25c0-.414.336-.75.75-.75h10.5a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1-.75-.75Zm.75 3.5a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H4.75Z"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M7 4a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Z"/></svg>
                    )}
                    {leftOpen ? 'Hide' : 'Show'}
                  </span>
                </button>
              </div>
              <input
                type="range"
                min={10}
                max={40}
                value={thumbScale}
                onChange={(e) => setThumbScale(parseInt(e.target.value))}
                className="w-36 ml-2 align-middle"
              />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-2 overflow-auto flex-1 min-h-0">
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
          </div>
            <div
              id="pdf-viewer"
              ref={viewerRef}
              className="relative bg-white dark:bg-gray-950 p-4 rounded-lg shadow-md flex justify-center items-center grow min-h-0 h-full overflow-hidden"
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
                  defaultFontFamily={fontFamily}
                />
              )}
            </div>
            <div className={`${rightOpen ? 'w-[220px] min-w-[220px]' : 'w-0 min-w-0'} transition-[width] duration-300 shrink-0 bg-white dark:bg-gray-900 rounded-lg shadow p-2 overflow-auto`}
            >
              <div className="flex items-center justify-end pb-1">
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  onClick={() => setRightOpen((v) => !v)}
                  title={rightOpen ? 'Hide history' : 'Show history'}
                >
                  <span className="inline-flex items-center gap-1">
                    {rightOpen ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M4 5.75A.75.75 0 0 1 4.75 5h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 5.75Zm0 4.25c0-.414.336-.75.75-.75h10.5a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1-.75-.75Zm.75 3.5a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H4.75Z"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path d="M7 4a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Z"/></svg>
                    )}
                    {rightOpen ? 'Hide' : 'Show'}
                  </span>
                </button>
              </div>
              <HistorySidebar
                history={history}
                historyIndex={historyIndex}
                onUndo={undo}
                onRedo={redo}
                disableUndo={historyIndex < 0}
                disableRedo={historyIndex >= history.length - 1}
              />
            </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-3 sm:p-4 mt-3 shrink-0">
          <Controls
            visible={controlsVisible}
            pageLabel={pageLabel}
            disablePrev={!pdfDoc || (() => { const pages = visiblePages ?? Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1); const idx = pages.indexOf(pageNum); return idx <= 0; })()}
            disableNext={!pdfDoc || (() => { const pages = visiblePages ?? Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1); const idx = pages.indexOf(pageNum); return idx === -1 || idx >= pages.length - 1; })()}
            disablePrint={!pdfDoc}
            disableSave={!pdfDoc}
            fitMode={fitMode}
            onChangeFitMode={setFitMode}
            fileName={fileName}
            onChangeFileName={setFileName}
            onPrev={onPrevPage}
            onNext={onNextPage}
            onPrint={onPrint}
            onOpen={onOpenNative}
            onSave={onSavePdf}
            disableOpen={!pdfDoc}
            onUndo={undo}
            onRedo={redo}
            disableUndo={historyIndex < 0}
            disableRedo={historyIndex >= history.length - 1}
          />
        </div>
      </div>
      <PrintContainer ref={printContainerRef} />
    </>
  );
}
