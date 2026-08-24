import React, { useState, useRef, useEffect } from 'react';
import { 
  Tv, 
  PenTool, 
  Eraser, 
  Globe, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  Key, 
  ExternalLink, 
  Gamepad2, 
  XSquare, 
  ChevronRight, 
  Check, 
  CornerDownRight,
  Maximize2
} from 'lucide-react';
import type { Device, Policy, Classroom } from '../types.ts';

interface SmartVisionSimulatorModalProps {
  device: Device;
  policy: Policy;
  classroom: Classroom;
  onClose: () => void;
  onRecordViolation: (type: string, detail: string) => void;
  onEmergencyUnlockSuccess: () => void;
}

export const SmartVisionSimulatorModal: React.FC<SmartVisionSimulatorModalProps> = ({
  device,
  policy,
  classroom,
  onClose,
  onRecordViolation,
  onEmergencyUnlockSuccess,
}) => {
  const [activeBoardApp, setActiveBoardApp] = useState<'whiteboard' | 'browser' | 'desktop'>('whiteboard');
  const [browserUrl, setBrowserUrl] = useState('https://khanacademy.org');
  const [browserInput, setBrowserInput] = useState('https://khanacademy.org');
  const [blockedAttemptMessage, setBlockedAttemptMessage] = useState<string | null>(null);
  const [showAndroidSwipeBanner, setShowAndroidSwipeBanner] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinAttempt, setPinAttempt] = useState('');
  const [pinError, setPinError] = useState(false);
  const [penColor, setPenColor] = useState('#10b981');
  const [penSize, setPenSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showBypassTester, setShowBypassTester] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);
  const [rebootStep, setRebootStep] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a'; // Chalkboard dark theme
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Initial default diagram on whiteboard
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(160, 140, 70, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('ClassroomLock Interactive Canvas', 50, 40);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Draw math formulas, physics diagrams, or notes freely.', 50, 65);
  }, []);

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
  };

  const handleClearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSimulateBlockedApp = (appName: string, exeName: string) => {
    setBlockedAttemptMessage(`AppLocker Enforcement Policy: "${exeName}" is blocked by system administrator.`);
    onRecordViolation('policy_violation_app', `Blocked unauthorized execution attempt: ${exeName} on ${device.name}`);
    setTimeout(() => setBlockedAttemptMessage(null), 5000);
  };

  const handleSimulateAttack = (attackName: string, command: string, resultDetails: string) => {
    setBlockedAttemptMessage(`${attackName} intercepted: ${resultDetails}`);
    onRecordViolation('attack_intercepted', `Student evasion vector thwarted: [${attackName}] Attempted: ${command} -> ${resultDetails}`);
    setTimeout(() => setBlockedAttemptMessage(null), 6000);
  };

  const handleSimulateReboot = () => {
    setIsRebooting(true);
    setRebootStep(1);
    onRecordViolation('hardware_reboot_attempt', `Student triggered hard power cycle / reboot on ${device.name} in attempt to switch OS.`);
    
    setTimeout(() => setRebootStep(2), 1200);
    setTimeout(() => setRebootStep(3), 2400);
    setTimeout(() => setRebootStep(4), 3600);
    setTimeout(() => {
      setIsRebooting(false);
      setRebootStep(0);
      setBlockedAttemptMessage('Reboot Completed: UEFI NVRAM & RS232 Watchdog forced Windows 11 ClassroomLock Kiosk. Android OS remained inaccessible.');
      setTimeout(() => setBlockedAttemptMessage(null), 7000);
    }, 4800);
  };

  const handleNavigateBrowser = (e: React.FormEvent) => {
    e.preventDefault();
    let url = browserInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Check if domain is allowed in policy
    try {
      const hostname = new URL(url).hostname;
      const isAllowed = policy.websites.mode !== 'allowlist' || policy.websites.allowedDomains.some(d => {
        return hostname === d.domain || hostname.endsWith('.' + d.domain);
      });

      if (isAllowed) {
        setBrowserUrl(url);
        setBlockedAttemptMessage(null);
      } else {
        setBlockedAttemptMessage(`Google Chrome Managed Policy: Access to "${hostname}" is blocked during Classroom Mode.`);
        onRecordViolation('policy_violation_web', `Blocked browsing to prohibited domain: ${hostname} on ${device.name}`);
        setTimeout(() => setBlockedAttemptMessage(null), 5000);
      }
    } catch {
      setBlockedAttemptMessage('Invalid URL entered.');
    }
  };

  const handleTriggerAndroidSwipe = () => {
    setShowAndroidSwipeBanner(true);
    setTimeout(() => setShowAndroidSwipeBanner(false), 4000);
  };

  const handleVerifyPin = () => {
    if (pinAttempt === device.emergencyUnlockCode || pinAttempt === '998811') {
      setShowPinDialog(false);
      setPinError(false);
      onEmergencyUnlockSuccess();
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* TV / SmartVision Top Bezel Frame */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex items-center gap-2">
              <Tv className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                SmartVision 86" 4K Interactive Board Simulator (Windows 11 OPS)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
              POLICY: {policy.name} (LOCKED)
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white font-bold text-sm px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 cursor-pointer"
            >
              Exit Simulator ✕
            </button>
          </div>
        </div>

        {/* Board Display Canvas & OS Frame */}
        <div className="relative bg-slate-950 flex-1 flex flex-col min-h-[480px]">
          {/* Hardware Android Bezel Side Swipe Attempt Button (For testing) */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-30">
            <button
              onClick={handleTriggerAndroidSwipe}
              title="Simulate student swiping in from the left bezel to switch to Android OS"
              className="px-2 py-4 rounded-r-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-[10px] font-bold writing-mode-vertical flex flex-col items-center gap-1 shadow-lg cursor-pointer"
            >
              <span>SWIPE</span>
              <span>ANDROID</span>
            </button>
          </div>

          {/* Android Swipe Suppression Overlay Alert */}
          {showAndroidSwipeBanner && (
            <div className="absolute top-4 left-1/2 -translate-y-0 -translate-x-1/2 z-40 bg-purple-950/95 border-2 border-purple-500/80 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
              <Tv className="h-6 w-6 text-purple-400" />
              <div className="text-left">
                <div className="text-xs font-bold text-purple-200">SmartVision Hardware RS232 Lock Active</div>
                <div className="text-[11px] text-purple-300">
                  Android input switching and side gestures are suppressed during Classroom Mode.
                </div>
              </div>
            </div>
          )}

          {/* Persistent Hardware Cold Reboot Simulation Screen */}
          {isRebooting && (
            <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
              <div className="max-w-md w-full space-y-4 font-mono text-left bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold border-b border-slate-800 pb-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
                  <span>SMARTVISION OPS HARDWARE REBOOT SEQUENCE</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="text-slate-400 flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">1. [POST]</span>
                    <span>Microcontroller Cold Boot Initialized...</span>
                  </div>
                  {rebootStep >= 2 && (
                    <div className="text-slate-300 flex items-center gap-2 animate-in fade-in">
                      <span className="text-purple-400 font-bold">2. [RS232]</span>
                      <span>Sent 0xAA 0xBB 0x01 0x01 (Disable Android Bezel & Input menu before Android OS boots)</span>
                    </div>
                  )}
                  {rebootStep >= 3 && (
                    <div className="text-slate-300 flex items-center gap-2 animate-in fade-in">
                      <span className="text-cyan-400 font-bold">3. [UEFI]</span>
                      <span>EFI Boot Priority Locked to Windows 11 Enterprise OPS Slot</span>
                    </div>
                  )}
                  {rebootStep >= 4 && (
                    <div className="text-emerald-300 flex items-center gap-2 font-bold animate-in fade-in">
                      <span className="text-emerald-400 font-bold">4. [SYSTEM]</span>
                      <span>ClassroomLock.Service.exe Running. Kiosk Re-Engaged in 2.1s!</span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                  Result: Student cannot escape to Android OS even with power-cycle.
                </div>
              </div>
            </div>
          )}

          {/* Blocked App / Website Toast Notification */}
          {blockedAttemptMessage && (
            <div className="absolute top-4 right-4 z-40 bg-rose-950/95 border-2 border-rose-500/80 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 max-w-md">
              <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold text-rose-200">Access Prohibited</div>
                <div className="text-[11px] text-rose-300 leading-snug">{blockedAttemptMessage}</div>
              </div>
            </div>
          )}

          {/* Active Screen View */}
          <div className="flex-1 flex flex-col p-3">
            {/* VIEW 1: WHITEBOARD */}
            {activeBoardApp === 'whiteboard' && (
              <div className="flex-1 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative shadow-inner">
                {/* Whiteboard Toolbar */}
                <div className="bg-slate-850 px-4 py-2 border-b border-slate-750 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold text-white">Microsoft Whiteboard (Curated Mode)</span>
                  </div>

                  {/* Pen colors */}
                  <div className="flex items-center gap-2">
                    {['#10b981', '#38bdf8', '#fbbf24', '#f43f5e', '#ffffff'].map(c => (
                      <button
                        key={c}
                        onClick={() => setPenColor(c)}
                        className={`h-5 w-5 rounded-full border transition-transform cursor-pointer ${penColor === c ? 'scale-125 border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <div className="h-4 w-px bg-slate-700 mx-1" />
                    <button
                      onClick={handleClearWhiteboard}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eraser className="h-3 w-3" />
                      <span>Clear Canvas</span>
                    </button>
                  </div>
                </div>

                {/* Drawing Surface */}
                <div className="flex-1 flex items-center justify-center p-2 bg-slate-950">
                  <canvas
                    ref={canvasRef}
                    width={920}
                    height={400}
                    onMouseDown={handleStartDraw}
                    onMouseMove={handleDraw}
                    onMouseUp={handleStopDraw}
                    onMouseLeave={handleStopDraw}
                    className="w-full h-full rounded-xl cursor-crosshair touch-none bg-slate-900 shadow-lg"
                  />
                </div>
              </div>
            )}

            {/* VIEW 2: RESTRICTED CHROME BROWSER */}
            {activeBoardApp === 'browser' && (
              <div className="flex-1 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                {/* Browser Address Bar */}
                <form onSubmit={handleNavigateBrowser} className="bg-slate-850 px-4 py-2 border-b border-slate-750 flex items-center gap-2 text-xs">
                  <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={browserInput}
                      onChange={e => setBrowserInput(e.target.value)}
                      placeholder="Enter website URL (e.g. khanacademy.org or ncert.nic.in)..."
                      className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                    Chrome Enterprise URLBlocklist Active
                  </span>
                </form>

                {/* Simulated Web Page Content */}
                <div className="flex-1 p-6 bg-slate-950 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Globe className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {browserUrl.includes('khanacademy') ? 'Khan Academy Interactive Mathematics & Science' : browserUrl}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Managed by ClassroomLock Chrome Policy. Extensions, incognito mode, and developer tools are disabled.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    <button
                      onClick={() => {
                        setBrowserInput('https://khanacademy.org');
                        setBrowserUrl('https://khanacademy.org');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 text-xs font-semibold"
                    >
                      Open Khan Academy
                    </button>
                    <button
                      onClick={() => {
                        setBrowserInput('https://ncert.nic.in');
                        setBrowserUrl('https://ncert.nic.in');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 text-xs font-semibold"
                    >
                      Open NCERT Portal
                    </button>
                    <button
                      onClick={() => {
                        setBrowserInput('https://roblox.com');
                        // Attempt prohibited
                        setBlockedAttemptMessage('Google Chrome Managed Policy: Access to "roblox.com" is blocked.');
                        onRecordViolation('policy_violation_web', `Blocked browsing to prohibited domain: roblox.com on ${device.name}`);
                        setTimeout(() => setBlockedAttemptMessage(null), 5000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                    >
                      Test Attempt: Roblox (Blocked)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>            {/* Windows 11 Taskbar (Locked Kiosk Style) */}
          <div className="bg-slate-950/95 border-t border-slate-800 px-4 py-2 flex items-center justify-between z-20 flex-wrap gap-2">
            {/* Taskbar App Icons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveBoardApp('whiteboard')}
                className={`p-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  activeBoardApp === 'whiteboard'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <PenTool className="h-4 w-4" />
                <span>Whiteboard</span>
              </button>

              <button
                onClick={() => setActiveBoardApp('browser')}
                className={`p-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  activeBoardApp === 'browser'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Globe className="h-4 w-4" />
                <span>Chrome (Curated)</span>
              </button>

              {/* Student Bypass Attack Simulation Trigger */}
              <div className="h-4 w-px bg-slate-850 mx-1 hidden sm:block" />
              <button
                onClick={() => setShowBypassTester(!showBypassTester)}
                className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  showBypassTester 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750'
                }`}
                title="Test all student evasion & bypass attacks"
              >
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span>Bypass Attack Testing Lab</span>
              </button>
            </div>

            {/* Emergency PIN Button & System Clock */}
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setShowPinDialog(true)}
                className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Emergency PIN Unlock</span>
              </button>

              <div className="text-right text-slate-400 text-[11px] font-mono leading-tight hidden sm:block">
                <div>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-[10px] text-emerald-400">JNV Burhanpur Edition</div>
              </div>
            </div>
          </div>

          {/* Interactive Student Bypass & Evasion Attack Testing Drawer */}
          {showBypassTester && (
            <div className="bg-slate-900 border-t border-amber-500/30 p-4 animate-in slide-in-from-bottom-2 z-30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Student Bypass Evasion Attack Testing Suite (Why It Cannot Be Bypassed)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">Click any student trick to test kernel-level denial</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                <button
                  onClick={() => {
                    handleSimulateAttack(
                      'Task Manager Process Kill',
                      'taskkill /f /im ClassroomLock.Service.exe',
                      'ACCESS DENIED: Service is protected by Windows LocalSystem DACL & anti-tamper watchdog.'
                    );
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-left border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-rose-300">1. Task Manager Kill</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Attempt taskkill or End Task in TaskMgr</div>
                </button>

                <button
                  onClick={() => {
                    handleSimulateAttack(
                      'Alt+Tab / Win Key Escape',
                      'WinKey / Alt+Tab / Ctrl+Esc',
                      'BLOCKED: LowLevelKeyboardHook (WH_KEYBOARD_LL) suppresses Windows navigation shortcuts in Kiosk mode.'
                    );
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-amber-950/40 text-left border border-slate-800 hover:border-amber-500/30 transition-all cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-300">2. Alt+Tab / Win Key</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Escape fullscreen kiosk to desktop</div>
                </button>

                <button
                  onClick={() => {
                    handleSimulateAttack(
                      'USB Game Launch (Renamed EXE)',
                      'D:\\games\\minecraft.exe (Renamed to calc.exe)',
                      'BLOCKED: AppLocker Authenticode Hash & Publisher rule detects binary mismatch. Execution denied.'
                    );
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-left border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-rose-300">3. USB Executable Launch</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Run Minecraft renamed as calc.exe</div>
                </button>

                <button
                  onClick={() => {
                    handleSimulateAttack(
                      'Command Prompt / PowerShell Hack',
                      'powershell.exe -ExecutionPolicy Bypass',
                      'BLOCKED: Registry policy DisableCMD=2 & SoftwareRestrictionPolicies block console launch.'
                    );
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-left border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-rose-300">4. CMD / PowerShell</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Run script to unregister policies</div>
                </button>

                <button
                  onClick={() => {
                    handleTriggerAndroidSwipe();
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-purple-950/40 text-left border border-slate-800 hover:border-purple-500/30 transition-all cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-purple-300">5. Android Bezel Swipe</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Swipe from side bezel to switch OS</div>
                </button>

                <button
                  onClick={() => {
                    handleSimulateAttack(
                      'Incognito & Proxy VPN Bypass',
                      'chrome://extensions + VPN Tunnel',
                      'BLOCKED: Chrome Enterprise Policy sets IncognitoModeAvailability=1 and URLBlocklist=["*"].'
                    );
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-emerald-950/40 text-left border border-slate-800 hover:border-emerald-500/30 transition-all cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-emerald-300">6. VPN / Incognito Proxy</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Install VPN extension or incognito tab</div>
                </button>

                <button
                  onClick={() => {
                    handleSimulateAttack(
                      'Safe Mode / Offline Boot',
                      'Reboot without Wi-Fi / Ethernet',
                      'FAIL-SAFE: 72-hour cryptographic local policy cache enforces lockdown with zero connectivity.'
                    );
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-teal-950/40 text-left border border-slate-800 hover:border-teal-500/30 transition-all cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-teal-300">7. Offline / Safe Mode</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Disconnect Ethernet to bypass cloud</div>
                </button>

                <button
                  onClick={() => {
                    handleSimulateAttack(
                      'Registry Editor Bypass (regedit)',
                      'regedit.exe (Modify HKLM)',
                      'BLOCKED: Windows policy DisableRegistryTools=1 prevents opening Registry Editor.'
                    );
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-left border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer group"
                >
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-rose-300">8. Registry Hack (Regedit)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Delete AppLocker registry keys</div>
                </button>

                <button
                  onClick={handleSimulateReboot}
                  className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-left border border-purple-500/40 hover:border-purple-400 transition-all cursor-pointer group sm:col-span-2 md:col-span-4"
                >
                  <div className="text-[11px] font-bold text-purple-200 group-hover:text-purple-100 flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 text-purple-400 animate-spin" />
                    <span>9. HARDWARE COLD REBOOT / POWER CYCLE ATTEMPT (TEST ANDROID ESCAPE)</span>
                  </div>
                  <div className="text-[10px] text-purple-300/80 mt-0.5">
                    Tests UEFI NVRAM bootloader & microcontroller UART keepalive: verifies that display immediately returns to Windows 11 Kiosk with Android disabled.
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Local Emergency PIN Dialog on Screen */}
        {showPinDialog && (
          <div className="fixed inset-0 bg-slate-950/90 z-70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-rose-500/50 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-base">
                <Key className="h-5 w-5" />
                <span>Local Emergency PIN Override</span>
              </div>
              <p className="text-xs text-slate-300">
                Enter the device emergency PIN (or master override PIN) to immediately release this SmartVision board:
              </p>

              <div>
                <input
                  type="password"
                  placeholder="Enter 6-digit PIN..."
                  value={pinAttempt}
                  onChange={e => {
                    setPinAttempt(e.target.value);
                    setPinError(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-rose-500"
                />
                {pinError && (
                  <p className="text-rose-400 text-xs mt-1 text-center font-semibold">
                    Incorrect PIN. Authorized teachers & IT staff only.
                  </p>
                )}
                <div className="text-[11px] text-slate-500 text-center mt-1">
                  (Demo PIN: <span className="font-mono text-emerald-400">{device.emergencyUnlockCode}</span>)
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowPinDialog(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyPin}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Unlock Board
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
