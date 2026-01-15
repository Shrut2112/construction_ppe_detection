"use client";
import React, { useRef, useState } from 'react';
import { 
  ShieldCheck, Users, HardHat, Eye, Activity, 
  AlertCircle, Footprints, Shirt, Camera, Maximize2,
  Upload, Play, Database, RefreshCcw
} from 'lucide-react';

export default function TechDashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<'IDLE' | 'UPLOADING' | 'ANALYZING'>('IDLE');
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus('UPLOADING');
    // Mock upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadStatus('ANALYZING');
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // In a real scenario, use FormData and fetch() to your FastAPI endpoint here.
  };

  return (
    <main className="min-h-screen p-6 max-w-[1600px] mx-auto space-y-6 font-mono bg-tech-obsidian text-slate-300">
      
      {/* Precision Header with Source Control */}
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

        {/* Source Control UI */}
        <div className="flex items-center gap-4 bg-tech-lead border border-tech-steel p-2">
          <div className="flex flex-col gap-1 pr-4 border-r border-tech-steel">
            <span className="text-[8px] text-slate-500 uppercase tracking-widest">Input_Source</span>
            <div className="flex items-center gap-2 text-tech-neon text-[10px] font-bold">
              <Database size={12} /> LOCAL_FILE_STORAGE
            </div>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="video/*" 
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadStatus !== 'IDLE'}
            className={`flex items-center gap-2 px-4 py-2 border transition-all text-[10px] font-bold
              ${uploadStatus === 'IDLE' 
                ? 'border-tech-neon text-tech-neon hover:bg-tech-neon hover:text-black' 
                : 'border-tech-steel text-slate-500 cursor-not-allowed'}`}
          >
            {uploadStatus === 'IDLE' ? (
              <><Upload size={14} /> UPLOAD_FOR_ANALYSIS</>
            ) : (
              <><RefreshCcw size={14} className="animate-spin" /> {uploadStatus}...</>
            )}
          </button>
        </div>
        
        <div className="flex gap-8 text-[11px] items-center">
          <div className="text-right">
            <span className="block text-slate-500 uppercase text-[9px]">System Status</span>
            <span className="text-tech-neon flex items-center gap-2 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-tech-neon animate-pulse" /> OPERATIONAL
            </span>
          </div>
          <div className="h-8 w-[1px] bg-tech-steel" />
          <div className="text-right">
            <span className="block text-slate-500 uppercase text-[9px]">Inference Engine</span>
            <span className="text-white font-bold tracking-tighter uppercase">YOLO_V11_X</span>
          </div>
        </div>
      </header>

      {/* Progress Bar (Visible during Upload/Analysis) */}
      {uploadStatus !== 'IDLE' && (
        <div className="w-full bg-tech-lead border border-tech-steel p-1 flex items-center gap-4">
          <span className="text-[9px] font-bold text-tech-neon pl-2">BUFFERING_INFERENCE_DATA</span>
          <div className="flex-1 h-2 bg-tech-obsidian border border-tech-steel overflow-hidden">
            <div 
              className="h-full bg-tech-neon shadow-[0_0_10px_#00FF41] transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[9px] font-bold text-white pr-2">{progress}%</span>
        </div>
      )}

      {/* 6-Column High-Tech KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <TechStat icon={<Users size={18}/>} label="Staff_Active" value="12" color="text-white" />
        <TechStat icon={<HardHat size={18}/>} label="Helmet_Check" value="11/12" color="text-tech-neon" progress={91} />
        <TechStat icon={<Eye size={18}/>} label="Eyewear_Check" value="10/12" color="text-tech-warning" progress={83} />
        <TechStat icon={<Footprints size={18}/>} label="Footwear_Check" value="12/12" color="text-tech-neon" progress={100} />
        <TechStat icon={<Shirt size={18}/>} label="Vest_Check" value="09/12" color="text-tech-alert" progress={75} isAlert />
        <TechStat icon={<AlertCircle size={18}/>} label="Active_Alerts" value="03" color="text-tech-alert" isAlert />
      </div>

      {/* Main Analysis Row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-9 space-y-6">
          <div className="relative aspect-video bg-black border border-tech-steel overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 opacity-60 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070')] bg-cover grayscale" />
            
            <div className="absolute inset-0 pointer-events-none p-4">
              <div className="flex justify-between text-[10px] text-tech-neon/60 font-bold bg-black/40 p-2 border-b border-tech-neon/20">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-ping" /> REC // CAM_01_ZONE_A
                </span>
                <span>2026-01-15 16:38:40</span>
              </div>
              
              <div className="absolute border-2 border-tech-neon w-48 h-80 top-24 left-48 shadow-[0_0_20px_rgba(0,255,65,0.4)]">
                 <div className="absolute -top-7 left-0 bg-tech-neon text-black px-2 py-0.5 text-[10px] font-black uppercase">
                    P_ID: 802 // COMPLIANT
                 </div>
                 <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white" />
                 <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white" />
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-tech-steel pb-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-tech-neon flex items-center gap-2">
                <Camera size={14} /> Neural_Evidence_Capture_Buffer
              </h3>
              <span className="text-[9px] text-slate-500 hover:text-tech-neon cursor-pointer transition-colors tracking-widest">ARCHIVE_ACCESS.sys</span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              <ViolationCard id="112" missing="HELMET" time="15:03:55" img="https://images.unsplash.com/photo-1590644365607-1c5a519a9a37?q=80&w=400" />
              <ViolationCard id="405" missing="VEST" time="14:42:10" img="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=400" />
              <ViolationCard id="092" missing="GOGGLES" time="14:30:12" img="https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=400" />
              <ViolationCard id="802" missing="VEST" time="14:15:00" img="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400" />
            </div>
          </section>
        </div>

        <aside className="col-span-12 xl:col-span-3 bg-tech-lead border border-tech-steel p-4 flex flex-col h-full shadow-xl">
          <div className="flex items-center gap-2 border-b border-tech-steel pb-3 mb-4">
            <Activity size={16} className="text-tech-neon" />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white">System_Event_Log</h3>
          </div>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <LogEntry time="16:04:01" msg="P_ID: 802 Enter Zone A" type="info" />
            <LogEntry time="16:03:55" msg="VIOLATION: P_ID: 112 Missing Helmet" type="alert" />
            <LogEntry time="16:02:12" msg="Neural Model Re-Inference Complete" type="info" />
            <LogEntry time="16:00:00" msg="Lab Shift_04 Audit Sequence Started" type="success" />
            <LogEntry time="15:58:45" msg="Optical Stream Handshake OK" type="success" />
          </div>
          <button className="mt-6 w-full py-2 bg-tech-neon/10 border border-tech-neon/30 text-tech-neon text-[10px] font-bold hover:bg-tech-neon hover:text-black transition-all">
            GENERATE_SHIFT_REPORT.pdf
          </button>
        </aside>
      </div>
    </main>
  );
}

// Sub-components (TechStat, ViolationCard, LogEntry) remain the same...
function TechStat({ icon, label, value, color, isAlert, progress = 0 }: any) {
  return (
    <div className={`bg-tech-lead border p-4 transition-all duration-300 ${isAlert ? 'border-tech-alert/30 bg-tech-alert/5' : 'border-tech-steel hover:border-tech-neon/50'}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-500 text-[9px] uppercase font-bold tracking-tighter">{label}</span>
        <span className={`${color} opacity-80`}>{icon}</span>
      </div>
      <div className={`text-3xl font-black ${color} tracking-tighter`}>{value}</div>
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
    <div className="min-w-[260px] bg-tech-lead border border-tech-steel p-3 group hover:border-tech-alert/50 transition-all">
      <div className="relative aspect-video mb-3 overflow-hidden border border-tech-steel bg-black">
        <img src={img} alt="Evidence" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-40 group-hover:opacity-100" />
        <div className="absolute top-2 left-2 bg-tech-alert text-white px-1.5 py-0.5 text-[8px] font-black uppercase">
          EV_SNAP_{id}
        </div>
        <div className="absolute bottom-2 right-2 p-1 bg-black/60 border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity">
           <Maximize2 size={10} />
        </div>
      </div>
      <div className="space-y-1 text-[10px] font-bold uppercase tracking-tight">
        <div className="flex justify-between"><span className="text-slate-500 text-[8px]">ID:</span><span className="text-white">P_{id}</span></div>
        <div className="flex justify-between"><span className="text-slate-500 text-[8px]">Violation:</span><span className="text-tech-alert">MISSING_{missing}</span></div>
        <div className="flex justify-between"><span className="text-slate-500 text-[8px]">Timestamp:</span><span className="text-slate-400">{time}</span></div>
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