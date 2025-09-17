"use client";
import React, { useEffect, useMemo, useRef } from "react";

type Props = {
  pdfDoc: any | null;
  currentPage: number;
  onSelectPage: (pageNum: number) => void;
  thumbScale?: number; // percentage, default 20
};

export default function ThumbnailsSidebar({ pdfDoc, currentPage, onSelectPage, thumbScale = 20 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const pages = useMemo(() => {
    if (!pdfDoc) return [] as number[];
    return Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1);
  }, [pdfDoc]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pdfDoc) return;
    // StrictMode-safe: reset container at the start to avoid duplicates
    container.innerHTML = "";
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
      const label = document.createElement("div");
      label.textContent = String(num);
      label.className = "text-xs text-gray-600";
      wrapper.appendChild(label);
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
      const placeholder = document.createElement("div");
      placeholder.className = "bg-gray-100 rounded border border-gray-200";
      placeholder.style.width = "120px";
      placeholder.style.height = "160px";
      wrapper.appendChild(placeholder);
      const label = document.createElement("div");
      label.textContent = String(n);
      label.className = "text-xs text-gray-600 mt-1";
      wrapper.appendChild(label);
      io.observe(wrapper);
    });
    return () => {
      io.disconnect();
      if (container) container.innerHTML = "";
    };
  }, [pdfDoc, pages, onSelectPage, thumbScale]);

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
    <aside className="w-40 shrink-0 h-[calc(100vh-150px)] overflow-auto bg-white rounded-lg shadow-md p-2">
      <div ref={containerRef} className="grid gap-2">
        {/* thumbnails injected here */}
      </div>
    </aside>
  );
}
