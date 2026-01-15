"use client"
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export default function LiveStream() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock AI Overlay Drawing
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      // Logic to draw bounding boxes from WebSocket data would go here
      ctx.strokeStyle = '#10b981'; 
      ctx.lineWidth = 3;
      ctx.strokeRect(100, 50, 150, 300); // Mock Person Box
    }
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden border-2 border-industrial-700 bg-black group">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-industrial-900/80 px-3 py-1.5 rounded-full border border-industrial-success/50">
        <div className="w-2 h-2 rounded-full bg-industrial-success animate-pulse" />
        <span className="text-xs font-mono text-industrial-success uppercase tracking-widest">Live: Zone-01</span>
      </div>

      <video ref={videoRef} className="w-full aspect-video object-cover opacity-80" autoPlay muted />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
      
      {/* Visual Overlay Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none" />
    </div>
  );
}