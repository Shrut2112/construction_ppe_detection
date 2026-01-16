"use client"
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock } from 'lucide-react';
import { fetchViolations, Violation } from '@/lib/api';

export default function ViolationSidebar() {
  const [violations, setViolations] = useState<Violation[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchViolations();
        setViolations(data);
      } catch (e) {
        console.error(e);
      }
    };

    // Initial load
    load();

    // Poll every 5 seconds
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-industrial-800 border-l border-industrial-700 p-4">
      <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-tighter">Real-time Alerts</h3>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {violations.map((v) => (
            <motion.div
              key={v.id}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-industrial-900 border-l-4 border-industrial-danger rounded-r-lg"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-industrial-danger">
                  {v.violated_items}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock size={10} /> {new Date(v.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">ID: {v.worker_name || v.worker_id}</p>
              {v.evidence_path && (
                <div className="mt-2 rounded overflow-hidden h-16 w-full relative">
                  {/* Note: Evidence path usually is local file path, we need to serve it or it won't show in browser unless we have an endpoint for static files.
                          For now, we just skip showing image or need a static mount in FastAPI.
                          Let's assume FastAPI serves 'storage' at /storage if configured.
                          I haven't configured StaticFiles in FastAPI yet.
                       */}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}