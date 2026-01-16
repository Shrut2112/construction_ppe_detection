"use client";
import React, { useRef, useState, useEffect } from 'react';
import {
  ShieldCheck, Users, HardHat, Eye, Activity,
  AlertCircle, Footprints, Shirt, Camera, Maximize2,
  Database
} from 'lucide-react';
import Link from 'next/link';
import LiveStream from '@/components/video/LiveStream';
import { fetchStats, fetchViolations, Stats, Violation } from '@/lib/api';

export default function TechDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
      <header className="flex justify-between items-center border-b border-tech-steel pb-8">
        <div className="flex items-center gap-8">
          <div className="p-4 border border-tech-neon bg-tech-neon/10">
            <ShieldCheck
              className="text-tech-neon shadow-[0_0_14px_#00FF41]"
              size={48}
            />
          </div>

          <div>
            <h1 className="text-5xl font-black tracking-tight text-white leading-none">
              SAFEGUARD <span className="text-tech-neon">AI</span>
            </h1>
            <p className="text-sm text-tech-neon/70 tracking-[0.25em] mt-1 font-bold">
              LAB_SURVEILLANCE_v4.2
            </p>
          </div>
        </div>

        <div className="flex gap-12 items-center text-base">
          <div className="flex items-center gap-3 text-tech-neon font-bold text-lg">
            <Database size={20} /> SYSTEM_ONLINE
          </div>

          <div className="h-12 w-[1px] bg-tech-steel" />

          <div className="text-right">
            <span className="block text-slate-500 uppercase text-xs font-bold">
              Backend Link
            </span>
            <span className="text-white font-bold tracking-tight uppercase text-lg">
              CONNECTED
            </span>
          </div>

          <div className="h-12 w-[1px] bg-tech-steel" />

          <Link href="/webcam" className="flex items-center gap-2 px-6 py-3 bg-tech-neon/10 border border-tech-neon text-tech-neon hover:bg-tech-neon hover:text-black transition-all font-bold tracking-widest text-sm uppercase group">
            <Camera size={20} className="group-hover:scale-110 transition-transform" />
            Switch_to_Webcam
          </Link>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-8 mt-10">
        <TechStat icon={<Users size={32} />} label="Total_Workers" value={stats?.total_workers || 0} color="text-white" />
        <TechStat icon={<HardHat size={32} />} label="Helmet_Count" value={stats?.helmet_count || 0} color="text-tech-neon" progress={100} />
        <TechStat icon={<Eye size={32} />} label="Mask_Count" value={stats?.mask_count || 0} color="text-tech-warning" progress={80} />
        <TechStat icon={<Shirt size={32} />} label="Vest_Count" value={stats?.vest_count || 0} color="text-tech-neon" progress={75} />
        <TechStat icon={<AlertCircle size={32} />} label="Violations_Today" value={stats?.violations_today || 0} color="text-tech-alert" isAlert />
        <TechStat icon={<Activity size={32} />} label="System_Status" value="ACTIVE" color="text-tech-neon" progress={100} />
      </div>

      {/* Main Content Area - Split into Vertical Decks */}
      <div className="flex flex-col gap-8">

        {/* DECK 1: MONITOR & LOGS */}
        <div className="grid grid-cols-12 gap-6 min-h-[600px] lg:h-[70vh]">
          {/* Main Video Feed - Priority Size */}
          <div className="col-span-12 xl:col-span-9 bg-black border border-tech-steel overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] relative group">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between">
              <div className="flex items-center gap-2 text-tech-neon text-xs font-bold tracking-widest pl-2">
                <Camera size={14} /> LIVE_FEED_PRIMARY
              </div>
            </div>
            <LiveStream />
          </div>

          {/* Sidebar Log - Adjusted to match video height or scroll independently */}
          <aside className="col-span-12 xl:col-span-3 bg-tech-lead border border-tech-steel p-0 flex flex-col h-full shadow-xl overflow-hidden">
            <div className="bg-tech-steel/10 p-6 border-b border-tech-steel flex items-center gap-4">
              <Activity size={28} className="text-tech-neon" />
              <h3 className="text-xl font-black uppercase tracking-widest text-white">System_Event_Log</h3>
            </div>
            <div className="space-y-0 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-tech-steel/50">
              {violations.map(v => (
                <LogEntry
                  key={v.id}
                  time={new Date(v.timestamp).toLocaleTimeString()}
                  msg={`VIOLATION: ID-${v.worker_id.slice(0, 4)} Missing ${v.violated_items}`}
                  type="alert"
                />
              ))}
              {violations.length === 0 && <div className="p-8 text-sm text-slate-600 font-mono text-center mt-10 font-bold">SYSTEM_IDLE...<br />WAITING_FOR_EVENTS</div>}
            </div>
          </aside>
        </div>

        {/* DECK 2: FORENSICS CATALOG */}
        <section className="bg-tech-lead border border-tech-steel p-8 flex flex-col gap-6 relative overflow-hidden min-h-[600px]">
          <div className="flex items-center justify-between border-b border-tech-steel pb-6 mb-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-4xl font-black uppercase tracking-tighter text-white flex items-center gap-4">
                <Camera size={40} className="text-tech-neon" />
                Neural_Evidence_Catalog
              </h3>
              <p className="text-tech-neon/60 text-sm font-bold tracking-[0.2em] pl-2">BUFFER_SIZE: {violations.length} / MAX_CAPACITY_UNLIMITED</p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-slate-400 mb-2 font-bold">View_Mode</div>
              <div className="flex gap-2">
                <span className="bg-tech-neon text-black text-sm font-bold px-4 py-2 rounded-sm shadow-[0_0_15px_#00FF41]">CATALOG_GRID</span>
              </div>
            </div>
          </div>

          {/* Catalog Grid Area - Scrollable Horizontal but with 3 stacked rows */}
          <div className="flex-1 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-tech-neon/20 scrollbar-track-black/20">
            {/* 
                Grid Configuration:
                - grid-rows-3: Forces 3 rows.
                - grid-flow-col: Fills column by column (left to right).
                - w-max: Allows the container to grow horizontally as much as needed.
             */}
            <div className="grid grid-rows-3 grid-flow-col gap-6 w-max min-w-full">
              {violations.length === 0 && (
                <div className="w-full h-full flex items-center justify-center col-span-full row-span-3 min-w-[500px] border border-dashed border-tech-steel/30 text-slate-500 italic">
                  NO EVIDENCE CAPTURED IN CURRENT SESSION
                </div>
              )}
              {violations.map(v => (
                <div key={v.id} className="w-[600px] h-[400px]">
                  {/* Fixed dimensions for consistent catalog look */}
                  <ViolationCard
                    id={v.worker_id.slice(0, 4)}
                    equipped={v.equipped_items}
                    missing={v.violated_items}
                    time={new Date(v.timestamp).toLocaleTimeString()}
                    img={v.evidence_path ? `http://localhost:8000/storage/alerts/${v.evidence_path}` : undefined}
                    // For the modal, pass full details object so we can render them big
                    onClick={() => setSelectedImage(JSON.stringify({
                      img: v.evidence_path ? `http://localhost:8000/storage/alerts/${v.evidence_path}` : null,
                      id: v.worker_id,
                      missing: v.violated_items,
                      equipped: v.equipped_items,
                      time: new Date(v.timestamp).toLocaleTimeString()
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* Modal Overlay for Evidence Preview */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          {/* Split Screen Modal */}
          <div className="relative w-full max-w-[95vw] h-[90vh] border-2 border-tech-neon shadow-[0_0_100px_rgba(0,255,65,0.3)] bg-black/90 flex flex-col xl:flex-row overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* LEFT: Image (50-60%) */}
            <div className="flex-1 xl:flex-[1.2] bg-black relative border-r border-tech-steel/50">
              {JSON.parse(selectedImage).img ? (
                <img src={JSON.parse(selectedImage).img} alt="Evidence Full" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">NO IMAGE AVAILABLE</div>
              )}
              <div className="absolute top-4 left-4 bg-tech-alert px-4 py-2 text-white font-black text-xl uppercase tracking-widest">
                EVIDENCE_RECORD__#{JSON.parse(selectedImage).id.slice(0, 8)}
              </div>
            </div>

            {/* RIGHT: Massive Details (40%) */}
            <div className="flex-1 xl:flex-[0.8] bg-tech-lead p-10 flex flex-col gap-8 overflow-y-auto">

              <div className="border-b-2 border-tech-neon pb-6">
                <h2 className="text-tech-neon text-xs font-bold tracking-[0.5em] mb-2 uppercase">Subject_Identification</h2>
                <div className="text-6xl font-black text-white tracking-tighter">
                  worker_{JSON.parse(selectedImage).id.slice(0, 4)}
                </div>
                <div className="text-2xl text-slate-400 font-mono mt-2">
                  TIME: {JSON.parse(selectedImage).time}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-tech-alert/10 border-l-8 border-tech-alert p-6">
                  <h3 className="text-tech-alert text-xl font-bold uppercase tracking-widest mb-2">Critical Violations</h3>
                  <p className="text-4xl font-black text-white leading-tight uppercase">
                    {JSON.parse(selectedImage).missing || "NONE"}
                  </p>
                </div>

                <div className="bg-tech-neon/10 border-l-8 border-tech-neon p-6">
                  <h3 className="text-tech-neon text-xl font-bold uppercase tracking-widest mb-2">Detected Equipment</h3>
                  <p className="text-3xl font-bold text-slate-200 leading-tight uppercase">
                    {JSON.parse(selectedImage).equipped || "NONE"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedImage(null)}
                className="mt-auto bg-red-600 hover:bg-red-500 text-white py-6 text-2xl font-black uppercase tracking-[0.2em] transition-all"
              >
                Close_Dossier [ESC]
              </button>

            </div>

          </div>
        </div>
      )}
    </main>
  );
}

// Sub-components
function TechStat({ icon, label, value, color, isAlert, progress = 0 }: any) {
  // Increase icon size via prop (passed below) but also adjust layout here
  return (
    <div className={`bg-tech-lead border p-6 transition-all duration-300 ${isAlert ? 'border-tech-alert/30 bg-tech-alert/5' : 'border-tech-steel hover:border-tech-neon/50'}`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-500 text-xl uppercase font-extrabold tracking-tighter">{label}</span>
        <span className={`${color} opacity-80 scale-125 origin-top-right`}>{icon}</span>
      </div>
      <div className={`text-5xl font-black ${color} tracking-tighter truncate`}>{value}</div>
      <div className="w-full h-1.5 bg-tech-steel/50 mt-4 relative overflow-hidden">
        <div
          className={`h-full absolute left-0 top-0 transition-all duration-1000 ${isAlert ? 'bg-tech-alert' : 'bg-tech-neon shadow-[0_0_8px_#00FF41]'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ViolationCard({ id, missing, equipped, time, img, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full bg-tech-lead border-2 border-tech-steel hover:border-tech-neon/50 transition-all flex flex-col p-6 group shadow-2xl ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Header Ribbon */}
      <div className="flex justify-between items-center mb-3 border-b border-tech-steel/30 pb-2">
        <span className="text-tech-neon font-black text-lg tracking-wider">ID: {id}</span>
        <span className="text-slate-400 text-sm font-mono font-bold">{time}</span>
      </div>

      {/* Image Container */}
      <div className="relative flex-1 bg-black border border-tech-steel overflow-hidden mb-4 aspect-video shadow-inner">
        {img ? (
          <img src={img} alt="Evidence" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-grayscale duration-500 opacity-80 group-hover:opacity-100" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/50 text-gray-600 gap-2">
            <Camera size={32} className="opacity-20" />
            <span className="text-xs uppercase tracking-widest font-bold">No_Evidence_Img</span>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-tech-alert/90 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm shadow-md border border-tech-alert/50">
          VIOLATION
        </div>
      </div>

      {/* Details Block */}
      <div className="space-y-4 text-lg uppercase tracking-tight font-bold">

        {/* Violation Row */}
        <div className="bg-tech-alert/10 border-l-[10px] border-tech-alert p-3">
          <div className="text-2xl text-tech-alert/70 mb-1 font-extrabold tracking-widest">Missing_PPE</div>
          <div className="text-tech-alert leading-tight break-words line-clamp-2 text-2xl" title={missing || "None"}>
            {missing || "NONE Detected"}
          </div>
        </div>

        {/* Equipment Row */}
        <div className="bg-tech-neon/5 border-l-[10px] border-tech-neon/50 p-3">
          <div className="text-2xl text-tech-neon/70 mb-1 font-extrabold tracking-widest">Detected_Gear</div>
          <div className="text-slate-200 leading-tight break-words line-clamp-2 text-2xl" title={equipped || "None"}>
            {equipped || "None"}
          </div>
        </div>

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
    <div className="flex gap-4 border-b border-tech-steel/20 p-6 text-lg hover:bg-white/5 transition-colors">
      <span className="text-tech-steel font-black shrink-0 font-mono opacity-100 text-xl">{time}</span>
      <span className={`${colors[type]} leading-tight tracking-tight font-bold text-xl`}>{msg}</span>
    </div>
  );
}