"use client";
import React, { useRef, useState } from 'react';
import { Upload, Play, AlertCircle } from 'lucide-react';

export default function LiveStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/upload_video', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center text-slate-500">
      {isStreaming ? (
        <img
          src="http://localhost:8000/video_feed"
          alt="Live Feed"
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 border border-dashed border-slate-700 rounded-lg flex flex-col items-center gap-2 hover:border-tech-neon/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}>
            <Upload size={32} className="text-slate-400" />
            <span className="text-xs uppercase tracking-widest font-bold">Upload Source Feed</span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="video/*"
            onChange={handleUpload}
          />
        </div>
      )}

      {/* Overlay Status */}
      <div className="absolute top-4 right-4 flex gap-2">
        {isStreaming && (
          <span className="flex items-center gap-1 bg-red-600/20 border border-red-500 text-red-500 px-2 py-1 text-[9px] font-black uppercase tracking-widest animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1" />
            LIVE_REQ
          </span>
        )}
      </div>
    </div>
  );
}
