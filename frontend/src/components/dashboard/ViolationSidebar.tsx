"use client"
import { useViolationStore } from '@/store/useViolationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock } from 'lucide-react';

export default function ViolationSidebar() {
  const { violations } = useViolationStore();

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
                <span className="text-xs font-bold text-industrial-danger">{v.type}</span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock size={10} /> {v.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">ID: {v.personId}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}