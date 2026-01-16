"use client";
import React, { useRef, useState, useEffect } from 'react';
import {
  ShieldCheck, Users, HardHat, Eye, Activity,
  AlertCircle, Footprints, Shirt, Camera, Maximize2,
  Database
} from 'lucide-react';
import LiveStream from '@/components/video/LiveStream';
import { fetchStats, fetchViolations, Stats, Violation } from '@/lib/api';

export default function TechDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  // Data Polling
  useEffect(() => {
    const loadData = async () => {
      try {
        const s = await fetchStats();
        const v = await fetchViolations();
        setStats(s);
        setViolations(v);
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 1000); // 1 second poll
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen p-6 max-w-[1600px] mx-auto space-y-6 font-mono bg-tech-obsidian text-slate-300">

      {/* Precision Header */}
      <header className="flex justify-between items-center border-b border-tech-steel pb-6">
        <div className="flex items-center gap-4">
          <div className="p-2 border border-tech-neon bg-tech-neon/5">
            <ShieldCheck className="text-tech-neon shadow-[0_0_10px_#00FF41]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white">
              SAFEGUARD <span className="text-tech-neon">AI</span>
            </h1>
            <p className="text-[10px] text-tech-neon/60 tracking-[0.2em]">LAB_SURVEILLANCE_v4.2</p>
          </div>
        </div>

        <div className="flex gap-8 text-[11px] items-center">
          <div className="flex items-center gap-2 text-tech-neon text-[10px] font-bold">
            <Database size={12} /> SYSTEM_ONLINE
          </div>
          <div className="h-8 w-[1px] bg-tech-steel" />
          <div className="text-right">
            <span className="block text-slate-500 uppercase text-[9px]">Backend Link</span>
            <span className="text-white font-bold tracking-tighter uppercase">CONNECTED</span>
          </div>
        </div>
      </header>

      {/* 6-Column High-Tech KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <TechStat icon={<Users size={18} />} label="Total_Workers" value={stats?.total_workers || 0} color="text-white" />
        <TechStat icon={<HardHat size={18} />} label="Helmet_Count" value={stats?.helmet_count || 0} color="text-tech-neon" progress={100} />
        <TechStat icon={<Eye size={18} />} label="Mask_Count" value={stats?.mask_count || 0} color="text-tech-warning" progress={80} />
        <TechStat icon={<Shirt size={18} />} label="Vest_Count" value={stats?.vest_count || 0} color="text-tech-neon" progress={75} />
        <TechStat icon={<AlertCircle size={18} />} label="Violations_Today" value={stats?.violations_today || 0} color="text-tech-alert" isAlert />
        <TechStat icon={<Activity size={18} />} label="System_Status" value="ACTIVE" color="text-tech-neon" progress={100} />
      </div>

      {/* Main Analysis Row */}
      <div className="grid grid-cols-12 gap-6 h-[600px]">
        <div className="col-span-12 xl:col-span-9 space-y-6 flex flex-col">

          {/* LIVE STREAM COMPONENT */}
          <div className="relative flex-1 bg-black border border-tech-steel overflow-hidden group shadow-xl">
            <LiveStream />
          </div>

          <section className="h-48 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-tech-steel pb-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-tech-neon flex items-center gap-2">
                <Camera size={14} /> Neural_Evidence_Capture_Buffer
              </h3>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide h-full items-center">
              {violations.length === 0 && <span className="text-xs text-slate-600 pl-4">NO_EVIDENCE_BUFFERED</span>}
              {violations.map(v => (
                <ViolationCard
                  key={v.id}
                  id={v.worker_id.slice(0, 4)}
                  missing={v.violated_items}
                  time={new Date(v.timestamp).toLocaleTimeString()}
                  // Backend now returns just the filename for evidence_path
                  img={v.evidence_path ? `http://localhost:8000/storage/alerts/${v.evidence_path}` : undefined}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="col-span-12 xl:col-span-3 bg-tech-lead border border-tech-steel p-4 flex flex-col h-full shadow-xl">
          <div className="flex items-center gap-2 border-b border-tech-steel pb-3 mb-4">
            <Activity size={16} className="text-tech-neon" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white">System_Event_Log</h3>
          </div>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {violations.map(v => (
              <LogEntry
                key={v.id}
                time={new Date(v.timestamp).toLocaleTimeString()}
                msg={`VIOLATION: ID-${v.worker_id.slice(0, 4)} Missing ${v.violated_items}`}
                type="alert"
              />
            ))}
            {violations.length === 0 && <span className="text-xs text-slate-600">SYSTEM_IDLE... WAITING_FOR_EVENTS</span>}
          </div>
        </aside>
      </div>
    </main>
  );
}

// Sub-components
function TechStat({ icon, label, value, color, isAlert, progress = 0 }: any) {
  return (
    <div className={`bg-tech-lead border p-4 transition-all duration-300 ${isAlert ? 'border-tech-alert/30 bg-tech-alert/5' : 'border-tech-steel hover:border-tech-neon/50'}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-500 text-[9px] uppercase font-bold tracking-tighter">{label}</span>
        <span className={`${color} opacity-80`}>{icon}</span>
      </div>
      <div className={`text-2xl font-black ${color} tracking-tighter truncate`}>{value}</div>
      <div className="w-full h-1 bg-tech-steel/50 mt-3 relative overflow-hidden">
        <div
          className={`h-full absolute left-0 top-0 transition-all duration-1000 ${isAlert ? 'bg-tech-alert' : 'bg-tech-neon shadow-[0_0_8px_#00FF41]'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ViolationCard({ id, missing, time, img }: any) {
  return (
    <div className="min-w-[200px] h-full bg-tech-lead border border-tech-steel p-2 group hover:border-tech-alert/50 transition-all flex flex-col">
      <div className="relative flex-1 mb-2 overflow-hidden border border-tech-steel bg-black">
        {img ? (
          <img src={img} alt="Evidence" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-60 group-hover:opacity-100" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-xs text-gray-500">NO_IMG</div>
        )}
        <div className="absolute top-2 left-2 bg-tech-alert text-white px-1.5 py-0.5 text-[8px] font-black uppercase">
          SNAP_{id}
        </div>
      </div>
      <div className="space-y-1 text-[9px] font-bold uppercase tracking-tight">
        <div className="flex justify-between"><span className="text-slate-500">ID:</span><span className="text-white">{id}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Viol:</span><span className="text-tech-alert whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">{missing}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Time:</span><span className="text-slate-400">{time}</span></div>
      </div>
    </div>
  );
}

function LogEntry({ time, msg, type }: any) {
  const colors: any = {
    info: 'text-slate-400',
    alert: 'text-tech-alert font-bold',
    success: 'text-tech-neon'
  };
  return (
    <div className="flex gap-3 border-b border-tech-steel/30 pb-2 text-[10px]">
      <span className="text-tech-steel font-black shrink-0">{time}</span>
      <span className={`${colors[type]} leading-tight tracking-tight`}>{msg}</span>
    </div>
  );
}