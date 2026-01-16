"use client"
import { useRef, useState } from 'react';
import { ShieldCheck, Upload, Play } from 'lucide-react';
import { uploadVideo } from '@/lib/api';

export default function LiveStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setUploading(true);
    try {
      await uploadVideo(e.target.files[0]);
      // small delay to let backend init
      setTimeout(() => setIsStreaming(true), 1000);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border-2 border-industrial-700 bg-black group h-full">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-industrial-900/80 px-3 py-1.5 rounded-full border border-industrial-success/50">
        <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-industrial-success animate-pulse' : 'bg-gray-500'}`} />
        <span className="text-xs font-mono text-industrial-success uppercase tracking-widest">
          {isStreaming ? "Live Feed" : "Offline"}
        </span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <label className="cursor-pointer bg-industrial-800 hover:bg-industrial-700 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors border border-industrial-600">
          <Upload size={14} />
          {uploading ? "Uploading..." : "Upload Video"}
          <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>

      {isStreaming ? (
        <img
          src="http://localhost:8000/video_feed"
          alt="Live Stream"
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full aspect-video text-industrial-400">
          <Play size={48} className="mb-2 opacity-50" />
          <p className="text-sm">Upload a video to start processing</p>
        </div>
      )}

      {/* Visual Overlay Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none" />
    </div>
  );
}