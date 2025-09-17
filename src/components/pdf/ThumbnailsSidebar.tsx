"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  pdfDoc: any | null;
  currentPage: number;
  onSelectPage: (pageNum: number) => void;
  thumbScale?: number; // percentage, default 20
  pages?: number[]; // optional explicit list of pages to show
  onDeletePage?: (pageNum: number) => void;
  hiddenPages?: number[];
  onRestorePagesAtEnd?: (pages: number[]) => void;
  onRestorePagesAtPosition?: (pages: number[], position: number) => void;
  onReorderPages?: (nextOrder: number[]) => void;
};

export default function ThumbnailsSidebar({ pdfDoc, currentPage, onSelectPage, thumbScale = 20, pages: overridePages, onDeletePage, hiddenPages = [], onRestorePagesAtEnd, onRestorePagesAtPosition, onReorderPages }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedHidden, setSelectedHidden] = useState<Set<number>>(new Set());
  const [restorePosition, setRestorePosition] = useState<number>(0);

  const pages = useMemo(() => {
    if (overridePages) return overridePages;
    if (!pdfDoc) return [] as number[];
    return Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);
  }, [pdfDoc, overridePages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pdfDoc) return;
    // StrictMode-safe: reset container at the start to avoid duplicates
    container.innerHTML = "";
    let dragFrom: number | null = null;
    const renderThumb = async (num: number) => {
      const wrapper = container.querySelector<HTMLDivElement>(`div[data-page="${num}"]`);
      if (!wrapper) return;
      if (wrapper.querySelector('canvas')) return; // already rendered into this wrapper
      const page = await pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale: (thumbScale || 20) / 100 });
      const c = document.createElement("canvas");
      c.dataset.page = String(num);
      c.width = viewport.width;
      c.height = viewport.height;
      const ctx = c.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      c.className = "rounded border border-gray-200 shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-400";
      c.onclick = () => onSelectPage(num);
      // replace placeholder content in-place
      wrapper.className = "p-2 flex flex-col items-center gap-1";
      wrapper.innerHTML = "";
      wrapper.appendChild(c);
      const row = document.createElement('div');
      row.className = 'w-full flex items-center justify-between mt-1';
      const label = document.createElement("div");
      label.textContent = String(num);
      label.className = "text-xs text-gray-600";
      row.appendChild(label);
      if (onDeletePage) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.title = 'Delete page';
        btn.className = 'text-xs text-red-600 hover:text-red-700 px-1 py-0.5 rounded';
        btn.innerText = 'Delete';
        btn.onclick = (e) => {
          e.stopPropagation();
          if (!onDeletePage) return;
          const ok = window.confirm(`Delete page ${num}? You can restore it later.`);
          if (ok) onDeletePage(num);
        };
        row.appendChild(btn);
      }
      wrapper.appendChild(row);
    };
    // lazy render using IntersectionObserver
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLDivElement;
            const page = Number(el.dataset.page);
            void renderThumb(page);
            io.unobserve(el);
          }
        });
      },
      { root: container, rootMargin: "200px" }
    );
    // create placeholder wrappers for lazy loading
    pages.forEach((n) => {
      let wrapper = container.querySelector<HTMLDivElement>(`div[data-page="${n}"]`);
      if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.dataset.page = String(n);
        container.appendChild(wrapper);
      }
      wrapper.className = "p-2 flex flex-col items-center gap-1 animate-pulse";
      wrapper.innerHTML = "";
      wrapper.draggable = true;
      wrapper.addEventListener('dragstart', (e) => {
        dragFrom = n;
        e.dataTransfer?.setData('text/plain', String(n));
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
      });
      wrapper.addEventListener('dragover', (e) => {
        if (!onReorderPages) return;
        e.preventDefault();
        if (!wrapper) return;
        wrapper.classList.add('ring-2', 'ring-indigo-400');
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      });
      wrapper.addEventListener('dragleave', () => {
        if (!wrapper) return;
        wrapper.classList.remove('ring-2', 'ring-indigo-400');
      });
      wrapper.addEventListener('drop', (e) => {
        if (!onReorderPages) return;
        e.preventDefault();
        if (!wrapper) return;
        wrapper.classList.remove('ring-2', 'ring-indigo-400');
        const from = dragFrom;
        const to = n;
        dragFrom = null;
        if (from == null || to == null || from === to) return;
        const fromIdx = pages.indexOf(from);
        const toIdx = pages.indexOf(to);
        if (fromIdx === -1 || toIdx === -1) return;
        const next = pages.slice();
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        onReorderPages(next);
      });
      const placeholder = document.createElement("div");
      placeholder.className = "bg-gray-100 rounded border border-gray-200";
      placeholder.style.width = "120px";
      placeholder.style.height = "160px";
      wrapper.appendChild(placeholder);
      const row = document.createElement('div');
      row.className = 'w-full flex items-center justify-between mt-1';
      const label = document.createElement("div");
      label.textContent = String(n);
      label.className = "text-xs text-gray-600";
      row.appendChild(label);
      if (onDeletePage) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.title = 'Delete page';
        btn.className = 'text-xs text-red-600 hover:text-red-700 px-1 py-0.5 rounded';
        btn.innerText = 'Delete';
        btn.onclick = (e) => {
          e.stopPropagation();
          if (!onDeletePage) return;
          const ok = window.confirm(`Delete page ${n}? You can restore it later.`);
          if (ok) onDeletePage(n);
        };
        row.appendChild(btn);
      }
      wrapper.appendChild(row);
      io.observe(wrapper);
    });
    return () => {
      io.disconnect();
      if (container) container.innerHTML = "";
    };
  }, [pdfDoc, pages, onSelectPage, thumbScale, onDeletePage, onReorderPages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll<HTMLDivElement>('div[data-page]').forEach((wrapper) => {
      const pageNum = Number(wrapper.dataset.page);
      if (pageNum === currentPage) wrapper.classList.add('bg-indigo-50');
      else wrapper.classList.remove('bg-indigo-50');
    });
  }, [currentPage]);

  return (
    <aside className="w-48 shrink-0 h-[calc(100vh-150px)] overflow-auto bg-white rounded-lg shadow-md p-2">
      <div className="text-xs text-gray-500 px-1 pb-1">Pages</div>
      <div ref={containerRef} className="grid gap-2">
        {/* thumbnails injected here */}
      </div>
      {hiddenPages.length > 0 && (
        <div className="mt-3 border-t pt-2">
          <div className="text-xs text-gray-500 px-1 pb-1">Trash</div>
          <div className="flex gap-1 mb-1">
            <button
              type="button"
              className="text-xs bg-gray-200 px-2 py-1 rounded"
              onClick={() => setSelectedHidden(new Set(hiddenPages))}
            >
              Select All
            </button>
            <button
              type="button"
              className="text-xs bg-gray-200 px-2 py-1 rounded"
              onClick={() => setSelectedHidden(new Set())}
            >
              Clear
            </button>
          </div>
          <div className="flex flex-col gap-1 max-h-40 overflow-auto pr-1">
            {hiddenPages.map((p) => (
              <label key={p} className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedHidden.has(p)}
                  onChange={(e) => {
                    setSelectedHidden((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(p);
                      else next.delete(p);
                      return next;
                    });
                  }}
                />
                <span>Page {p}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex gap-1">
            <select
              className="text-xs border rounded px-1 py-1 flex-1"
              value={restorePosition}
              onChange={(e) => setRestorePosition(Number(e.target.value))}
            >
              {pages.map((_, idx) => (
                <option key={idx} value={idx}>
                  Position {idx + 1}
                </option>
              ))}
              <option value={pages.length}>End</option>
            </select>
            <button
              type="button"
              className="rounded bg-indigo-600 text-white text-xs py-1 px-2 disabled:opacity-50"
              disabled={!onRestorePagesAtPosition || selectedHidden.size === 0}
              onClick={() => {
                if (!onRestorePagesAtPosition) return;
                const pages = Array.from(selectedHidden.values()).sort((a, b) => a - b);
                onRestorePagesAtPosition(pages, restorePosition);
                setSelectedHidden(new Set());
              }}
            >
              Restore Here
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
