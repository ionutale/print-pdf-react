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
    const renderThumb = async (num: number) => {
      const existing = container.querySelector<HTMLCanvasElement>(`canvas[data-page="${num}"]`);
      if (existing) return; // already rendered
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
      const wrapper = document.createElement("div");
      wrapper.className = "p-2 flex flex-col items-center gap-1";
      wrapper.appendChild(c);
      const label = document.createElement("div");
      label.textContent = String(num);
      label.className = "text-xs text-gray-600";
      wrapper.appendChild(label);
      container.appendChild(wrapper);
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
      const existingWrapper = container.querySelector(`div[data-page="${n}"]`);
      if (existingWrapper) return;
      const wrapper = document.createElement("div");
      wrapper.dataset.page = String(n);
      wrapper.className = "p-2 flex flex-col items-center gap-1 animate-pulse";
      const placeholder = document.createElement("div");
      placeholder.className = "bg-gray-100 rounded border border-gray-200";
      placeholder.style.width = "120px";
      placeholder.style.height = "160px";
      wrapper.appendChild(placeholder);
      const label = document.createElement("div");
      label.textContent = String(n);
      label.className = "text-xs text-gray-600 mt-1";
      wrapper.appendChild(label);
      container.appendChild(wrapper);
      io.observe(wrapper);
    });
    return () => {
      if (container) container.innerHTML = "";
    };
  }, [pdfDoc, pages, onSelectPage, thumbScale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll<HTMLDivElement>("div.p-2").forEach((wrapper, idx) => {
      const pageNum = idx + 1;
      if (pageNum === currentPage) wrapper.classList.add("bg-indigo-50");
      else wrapper.classList.remove("bg-indigo-50");
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
