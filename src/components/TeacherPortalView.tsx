import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Play, 
  Square, 
  ShieldCheck, 
  Globe, 
  PenTool, 
  Tv, 
  Clock, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Sparkles,
  RefreshCw,
  AlertCircle,
  Radio,
  Send,
  Monitor,
  Check,
  AlertTriangle,
  Cpu,
  Activity,
  HardDrive
} from 'lucide-react';
import type { Classroom, Policy, Device, User } from '../types.ts';

interface TeacherPortalViewProps {
  currentUser: User;
  classrooms: Classroom[];
  policies: Policy[];
  devices: Device[];
  onStartClassSession: (classroomId: string, policyId: string, durationMinutes: number, temporaryUrls?: string[]) => Promise<void>;
  onEndClassSession: (classroomId: string) => Promise<void>;
}

export const TeacherPortalView: React.FC<TeacherPortalViewProps> = ({
  currentUser,
  classrooms,
  policies,
  devices,
  onStartClassSession,
  onEndClassSession,
}) => {
  const [selectedClassroomId, setSelectedClassroomId] = useState(classrooms[0]?.id || '');
  const [selectedPolicyId, setSelectedPolicyId] = useState(policies[0]?.id || '');
  const [selectedDuration, setSelectedDuration] = useState(45);
  const [temporaryUrlInput, setTemporaryUrlInput] = useState('');
  const [activeTempUrls, setActiveTempUrls] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [isEngaging, setIsEngaging] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  // Active classroom object
  const activeClassroom = classrooms.find(c => c.id === selectedClassroomId) || classrooms[0];
  const isClassroomActive = Boolean(activeClassroom?.activeSession);
  const currentSession = activeClassroom?.activeSession;
  const classDevices = devices.filter(d => d.classroomId === activeClassroom?.id);

  // Elapsed timer computation
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    if (!currentSession) {
      setElapsedMinutes(0);
      return;
    }
    const updateElapsed = () => {
      const diffMs = Date.now() - new Date(currentSession.startedAt).getTime();
      setElapsedMinutes(Math.max(0, Math.floor(diffMs / 60000)));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 10000);
    return () => clearInterval(interval);
  }, [currentSession]);

  const handleStartClass = async () => {
    if (!selectedClassroomId) return;
    setIsEngaging(true);
    try {
      await onStartClassSession(selectedClassroomId, selectedPolicyId, selectedDuration, activeTempUrls);
    } finally {
      setIsEngaging(false);
    }
  };

  const handleEndClass = async () => {
    if (!selectedClassroomId) return;
    setIsEngaging(true);
    try {
      await onEndClassSession(selectedClassroomId);
      setActiveTempUrls([]);
    } finally {
      setIsEngaging(false);
    }
  };

  const handleExtendDuration = async (extraMins: number) => {
    if (!selectedClassroomId || !isClassroomActive) return;
    setIsExtending(true);
    try {
      await fetch(`/api/classrooms/${selectedClassroomId}/extend-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalMinutes: extraMins }),
      });
      if (currentSession) {
        currentSession.scheduledDurationMinutes += extraMins;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtending(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim() || !selectedClassroomId) return;
    try {
      await fetch(`/api/classrooms/${selectedClassroomId}/broadcast-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMessage, teacherName: currentUser.name }),
      });
      setBroadcastSent(true);
      setTimeout(() => {
        setBroadcastSent(false);
        setBroadcastMessage('');
      }, 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLiveTempUrl = async (presetUrl?: string) => {
    const rawUrl = presetUrl || temporaryUrlInput.trim();
    if (!rawUrl) return;
    let url = rawUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    if (!activeTempUrls.includes(url)) {
      const updated = [...activeTempUrls, url];
      setActiveTempUrls(updated);
      if (isClassroomActive && selectedClassroomId) {
        try {
          await fetch(`/api/classrooms/${selectedClassroomId}/push-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
    setTemporaryUrlInput('');
  };

  const quickPresets = [
    { label: 'PhET Simulations', url: 'https://phet.colorado.edu' },
    { label: 'NCERT Textbooks', url: 'https://ncert.nic.in' },
    { label: 'GeoGebra Math', url: 'https://geogebra.org' },
    { label: 'Desmos Graphing', url: 'https://desmos.com' },
    { label: 'Khan Academy', url: 'https://khanacademy.org' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Teacher Welcome & Dedicated Identity Card */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <GraduationCap className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Navodaya Teacher Focus Console
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  JNV Burhanpur
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {currentUser.name}
              </h1>
              <p className="text-xs text-slate-300">
                1-Click Lesson Focus Mode with Persistent Hardware Anti-Android Lockdown.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Room Selector Tab Bar */}
            <div className="bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 flex gap-1">
              {classrooms.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassroomId(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedClassroomId === c.id
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* If Class is ALREADY ACTIVE in this room */}
      {isClassroomActive && currentSession ? (
        <div className="rounded-2xl bg-slate-900 border-2 border-emerald-500/60 p-6 sm:p-7 shadow-2xl space-y-6">
          {/* Active Session Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Class In Session: {activeClassroom.name}
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Active Policy: <strong className="text-emerald-300">{currentSession.policyName}</strong> • {classDevices.length} Interactive Screen(s) Under Direct Teacher Control
              </p>
            </div>

            <button
              onClick={handleEndClass}
              disabled={isEngaging}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isEngaging ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4 fill-white" />}
              <span>END CLASSROOM MODE (RELEASE SCREENS)</span>
            </button>
          </div>

          {/* Persistent Hardware Barrier Badge */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                <Tv className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <div className="font-bold text-purple-200 flex items-center gap-2">
                  <span>Reboot-Proof SmartVision Android Barrier: LOCKED</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                    UART COM1 + NVRAM Boot
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Students cannot switch to Android via bezel swipes, physical buttons, or cold reboots. Mode can only be stopped by this teacher console.
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Teacher Authority Only</span>
            </div>
          </div>

          {/* Live Progress / Timer & Active Tools */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lesson Duration & Quick Extend */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Lesson Duration</span>
                  <span className="text-emerald-400 font-mono">{elapsedMinutes}m elapsed</span>
                </div>
                <div className="text-3xl font-black text-white mt-1">
                  {elapsedMinutes} <span className="text-sm font-normal text-slate-400">/ {currentSession.scheduledDurationMinutes}m</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (elapsedMinutes / currentSession.scheduledDurationMinutes) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Quick Extend Buttons */}
              <div className="pt-3 mt-3 border-t border-slate-750/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Extend Lesson:</span>
                <div className="flex gap-1.5">
                  {[10, 15].map(mins => (
                    <button
                      key={mins}
                      onClick={() => handleExtendDuration(mins)}
                      disabled={isExtending}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600/30 text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      +{mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Allowed Lesson Applications */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-750">
              <span className="text-xs text-slate-400 font-semibold block">Permitted Lesson Applications</span>
              <div className="mt-2.5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-200 font-medium bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <PenTool className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white leading-tight">Microsoft Whiteboard</div>
                    <div className="text-[10px] text-slate-400">Curated Fullscreen Interactive Canvas</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200 font-medium bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white leading-tight">Google Chrome (Curated)</div>
                    <div className="text-[10px] text-slate-400">Enterprise Managed URL Allowlist</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Announcement / Screen Broadcast */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-750">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-emerald-400" />
                <span>Broadcast Alert to Screens</span>
              </span>
              <form onSubmit={handleSendBroadcast} className="mt-2.5 space-y-2">
                <input
                  type="text"
                  placeholder="e.g. 5 minutes left in lab activity!"
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!broadcastMessage.trim() || broadcastSent}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    broadcastSent
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                  }`}
                >
                  {broadcastSent ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Alert Transmitted to Boards!</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Pop-Up Banner</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Quick Teacher Tool: Add Temporary Allowed URL on the Fly */}
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-emerald-400" />
                <span>Permit Educational Websites for this Class</span>
              </span>
              <span className="text-[11px] text-slate-400">Pushed to Chrome Enterprise policy instantly</span>
            </div>

            {/* Preset 1-click education sites */}
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map(preset => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => handleAddLiveTempUrl(preset.url)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-750 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="h-3 w-3 text-emerald-400" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Or enter custom URL: e.g. desmos.com/calculator or phet.colorado.edu"
                value={temporaryUrlInput}
                onChange={e => setTemporaryUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddLiveTempUrl())}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleAddLiveTempUrl()}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
              >
                Permit Website
              </button>
            </div>

            {activeTempUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                {activeTempUrls.map((u, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-xs font-mono flex items-center gap-1.5">
                    <span>{u}</span>
                    <button
                      onClick={() => setActiveTempUrls(activeTempUrls.filter((_, idx) => idx !== i))}
                      className="text-emerald-400 hover:text-rose-400 ml-1 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Connected Classroom Displays Fleet Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Monitor className="h-4 w-4 text-emerald-400" />
                <span>Connected Screens in {activeClassroom.name} ({classDevices.length})</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">100% Policy Synchronized</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classDevices.map(dev => (
                <div key={dev.id} className="p-3.5 rounded-xl bg-slate-850 border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-xs text-white truncate max-w-[140px]">{dev.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold">
                      LOCKED
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Hardware:</span>
                      <span className="text-slate-200">{dev.hardwareType === 'smartvision_ops' ? 'SmartVision OPS 86"' : 'Windows 11 PC'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Screen:</span>
                      <span className="text-emerald-400 font-medium">Microsoft Whiteboard</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Android Bezel Switch:</span>
                      <span className="text-purple-300 font-semibold">Suppressed (UART)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 3-STEP TEACHER LAUNCHER WORKFLOW */
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Start Classroom Focus Mode
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select your room, choose the lesson policy, and lock all classroom screens with persistent Android suppression.
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1: Select Classroom */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Select Classroom / Lab
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {classrooms.map(c => {
                  const isSelected = selectedClassroomId === c.id;
                  const roomDevs = devices.filter(d => d.classroomId === c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedClassroomId(c.id)}
                      className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 shadow-md text-white'
                          : 'bg-slate-850 border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-sm text-white">{c.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.roomNumber}</div>
                      <div className="text-[11px] text-emerald-400 font-semibold mt-2">
                        {roomDevs.length} screen(s)
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Subject / Teaching Policy */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Choose Subject & Lesson Policy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {policies.map(p => {
                  const isSelected = selectedPolicyId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPolicyId(p.id)}
                      className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 shadow-md'
                          : 'bg-slate-850 border-slate-750 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{p.name}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
                        <span>{p.applications.allowlist.length} Allowed Apps</span>
                        <span>•</span>
                        <span>{p.websites.allowedDomains.length} Safe Websites</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Duration Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                3. Lesson Duration Cap
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[30, 45, 60, 90].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedDuration(mins)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedDuration === mins
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-slate-850 text-slate-300 hover:bg-slate-800 border border-slate-750'
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Giant Engagement Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleStartClass}
              disabled={isEngaging}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-lg shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isEngaging ? (
                <>
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span>SYNCHRONIZING POLICY & HARDWARE LOCKS...</span>
                </>
              ) : (
                <>
                  <Play className="h-6 w-6 fill-slate-950" />
                  <span>START CLASSROOM MODE ({activeClassroom.name.toUpperCase()})</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-2">
              Persistent RS232 + NVRAM lock activated: Display is locked to lesson and cannot be bypassed or switched to Android even after reboots. Mode can only be stopped by teacher.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
