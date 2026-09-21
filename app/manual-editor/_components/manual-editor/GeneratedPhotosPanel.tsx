"use client";
import { Image as ImageIcon } from "lucide-react";
import { useManualEditor } from "./EditorProvider";

export default function GeneratedPhotosPanel() {
  const { generatedPhotos, loadHistoryImage } = useManualEditor();
  return (
    <section className="bg-[#1F242D] border border-gray-700/60 rounded-3xl p-5 flex flex-col gap-4 shadow-lg w-full">
      <div className="flex items-center justify-between border-b border-gray-700/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-amber-500 rounded-full" />
          <h4 className="text-white text-xs font-bold tracking-wider uppercase">
            Generated Photos
          </h4>
        </div>
        <span className="text-[10px] text-gray-400">Recent Output History</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {generatedPhotos.length
          ? generatedPhotos.map((photo, idx) => (
              <button
                type="button"
                key={`${photo.slice(0, 18)}-${idx}`}
                onClick={() => void loadHistoryImage(photo)}
                className="aspect-[3/4] bg-[#282E3B] border border-gray-700 rounded-xl overflow-hidden relative shadow-sm"
              >
                <img
                  src={photo}
                  alt="Saved result"
                  className="w-full h-full object-cover"
                />
              </button>
            ))
          : Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-[3/4] bg-[#282E3B]/50 border border-dashed border-gray-700/80 rounded-xl flex flex-col items-center justify-center text-gray-500 text-[10px] gap-1"
              >
                <ImageIcon size={16} />
                <span>Empty slot</span>
              </div>
            ))}
      </div>
    </section>
  );
}
