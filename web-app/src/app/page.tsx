"use client";
import PdfViewer from "@/components/pdf/PdfViewer";

export default function Home() {
  return (
    <div className="bg-gray-100 flex flex-col items-center justify-center min-h-screen p-4">
      <PdfViewer />
    </div>
  );
}
