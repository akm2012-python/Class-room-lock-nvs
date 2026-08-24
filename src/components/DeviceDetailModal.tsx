import React, { useState } from 'react';
import { 
  Monitor, 
  Tv, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Key, 
  Copy, 
  Check, 
  AlertTriangle, 
  Activity, 
  Eye, 
  EyeOff, 
  Globe, 
  PenTool, 
  Terminal, 
  Layers,
  Sparkles,
  Play
} from 'lucide-react';
import type { Device, Policy, AuditLog, School } from '../types.ts';

interface DeviceDetailModalProps {
  device: Device;
  policies: Policy[];
  school: School;
  auditLogs: AuditLog[];
  onClose: () => void;
  onStartMode: (deviceId: string, policyId?: string) => Promise<void>;
  onEndMode: (deviceId: string) => Promise<void>;
  onSync: (deviceId: string) => Promise<void>;
  onEmergencyUnlock: (deviceId: string, code: string, reason: string) => Promise<void>;
  onSimulateAppBlock: (deviceId: string, appName: string) => void;
  onSimulateDomainBlock: (deviceId: string, domain: string) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  policies,
  school,
  auditLogs,
  onClose,
  onStartMode,
  onEndMode,
  onSync,
  onEmergencyUnlock,
  onSimulateAppBlock,
  onSimulateDomainBlock,
}) => {
  const [showPin, setShowPin] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const [unlockReason, setUnlockReason] = useState('Routine IT Inspection');
  const [enteredPin, setEnteredPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'simulation' | 'hardware' | 'logs'>('overview');

  const isLocked = device.classroomModeActive;
  const currentPolicy = policies.find(p => p.id === device.currentPolicyId) || policies[0];
  const deviceLogs = auditLogs.filter(l => l.deviceId === device.id);

  const handlePerformEmergencyUnlock = async () => {
    setIsProcessing(true);
    try {
      await onEmergencyUnlock(device.id, enteredPin || device.emergencyUnlockCode, unlockReason);
      setShowUnlockPrompt(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              {device.hardwareType === 'smartvision_ops' ? (
                <Tv className="h-5 w-5 text-purple-400" />
              ) : (
                <Monitor className="h-5 w-5 text-blue-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{device.name}</h2>
                {isLocked ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span>LOCKED TO POLICY</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                    <Unlock className="h-3 w-3" />
                    <span>STANDBY</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {device.classroomName} • {device.hostname} ({device.ipAddress})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-800 flex items-center gap-2 bg-slate-950/40 text-xs">
          {[
            { id: 'overview', label: 'Overview & Status' },
            { id: 'hardware', label: 'SmartVision & OPS Details' },
            { id: 'simulation', label: 'Live Test-Bench' },
            { id: 'logs', label: `Device Logs (${deviceLogs.length})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-3 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Telemetry Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-850 border border-slate-750">
                  <span className="text-slate-400 block text-[11px]">Heartbeat Status</span>
                  <span className="text-emerald-400 font-bold text-sm flex items-center gap-1.5 mt-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>15s Continuous</span>
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-850 border border-slate-750">
                  <span className="text-slate-400 block text-[11px]">CPU Utilization</span>
                  <span className="text-white font-bold text-sm mt-1 block">
                    {device.metrics?.cpuPercent || 12}%
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-850 border border-slate-750">
                  <span className="text-slate-400 block text-[11px]">RAM Memory</span>
                  <span className="text-white font-bold text-sm mt-1 block">
                    {device.metrics?.memoryPercent || 38}% (16 GB)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-850 border border-slate-750">
                  <span className="text-slate-400 block text-[11px]">Enforcement State</span>
                  <span className="text-emerald-400 font-bold text-sm mt-1 block capitalize">
                    {device.enforcementStatus}
                  </span>
                </div>
              </div>

              {/* Active Foreground Window */}
              <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] block">Current Active Foreground Window</span>
                  <span className="text-white font-bold text-xs">{device.metrics?.activeWindow || 'Windows Desktop'}</span>
                </div>
                <span className="text-[10px] text-slate-400">Sampled 5s ago</span>
              </div>

              {/* Assigned Policy Details */}
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Active Policy: {currentPolicy?.name}</span>
                  </span>
                  <span className="text-emerald-400 font-semibold">v{currentPolicy?.version}</span>
                </div>
                <p className="text-slate-300 text-[11px]">{currentPolicy?.description}</p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-750 text-[11px]">
                  <div>
                    <span className="text-slate-400">Allowed Applications:</span>
                    <span className="text-slate-200 font-medium ml-1">
                      {currentPolicy?.applications.allowlist.map(a => a.name).join(', ') || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Chrome Mode:</span>
                    <span className="text-emerald-300 font-medium ml-1 capitalize">
                      {currentPolicy?.websites.mode} ({currentPolicy?.websites.allowedDomains.length} domains)
                    </span>
                  </div>
                </div>
              </div>

              {/* Emergency Local PIN Card (Crucial Requirement: Admin Never Locked Out) */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-rose-400" />
                    <span className="font-bold text-rose-200">Local Administrator Emergency Unlock PIN</span>
                  </div>
                  <button
                    onClick={() => setShowPin(!showPin)}
                    className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span>{showPin ? 'Hide' : 'Reveal'}</span>
                  </button>
                </div>
                <p className="text-slate-400 text-[11px]">
                  If the school network is down, the administrator can tap <strong className="text-slate-200">Ctrl + Alt + Shift + U</strong> on this screen and enter this emergency PIN to bypass all lockouts immediately.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <div className="font-mono text-base font-black text-rose-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-750 tracking-widest">
                    {showPin ? device.emergencyUnlockCode : '••••••'}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(device.emergencyUnlockCode);
                      setCopiedPin(true);
                      setTimeout(() => setCopiedPin(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPin ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
                  </button>

                  <button
                    onClick={() => setShowUnlockPrompt(true)}
                    className="ml-auto px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 font-semibold border border-rose-500/40 cursor-pointer"
                  >
                    Cloud Emergency Unlock
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMARTVISION & OPS HARDWARE */}
          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-850 border border-purple-500/30 space-y-3">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <Tv className="h-5 w-5" />
                  <span>SmartVision Interactive Board & OPS Architecture</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {device.opsEnvironment.manufacturerNotes}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-750 text-xs">
                  <div>
                    <span className="text-slate-400 block">Host Environment:</span>
                    <span className="font-semibold text-white">{device.opsEnvironment.androidVersion || 'Android 13 Interactive OS'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Internal OPS Input:</span>
                    <span className="font-semibold text-emerald-400">{device.opsEnvironment.opsSlotInput}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Android Bezel Lock:</span>
                    <span className="font-semibold text-emerald-400">RS232/UART Protocol Active</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Touch Controller:</span>
                    <span className="font-semibold text-white">40-point IR Touch via Internal USB Bridge</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 space-y-2">
                <h4 className="font-bold text-white">How OS Switching is Protected on this Smartboard:</h4>
                <ol className="list-decimal list-inside text-slate-300 space-y-1 leading-relaxed text-[11px]">
                  <li>When Classroom Mode begins, ClassroomLock sends an internal UART signal to the SmartVision motherboard to disable the physical front-panel input button and side bezel swipe gesture.</li>
                  <li>Windows 11 remains locked via AppLocker + Chrome Enterprise Managed Policies.</li>
                  <li>Upon teacher release or administrator PIN entry, the UART bridge unlocks the bezel menu.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE TEST-BENCH & SIMULATION */}
          {activeTab === 'simulation' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span>Interactive Live Policy Simulator</span>
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Simulate what happens on this screen if a student attempts unauthorized actions while Classroom Mode is active.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={() => onSimulateAppBlock(device.id, 'steam.exe')}
                    className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left cursor-pointer"
                  >
                    <span className="font-bold text-rose-300 block">Launch Steam</span>
                    <span className="text-[10px] text-slate-400">Simulate AppLocker Block</span>
                  </button>

                  <button
                    onClick={() => onSimulateAppBlock(device.id, 'Discord.exe')}
                    className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left cursor-pointer"
                  >
                    <span className="font-bold text-rose-300 block">Launch Discord</span>
                    <span className="text-[10px] text-slate-400">Simulate Process Deny</span>
                  </button>

                  <button
                    onClick={() => onSimulateDomainBlock(device.id, 'instagram.com')}
                    className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left cursor-pointer"
                  >
                    <span className="font-bold text-rose-300 block">Visit Instagram</span>
                    <span className="text-[10px] text-slate-400">Chrome URLBlocklist</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-2">
              {deviceLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                  No recent audit events recorded for this device.
                </div>
              ) : (
                deviceLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-lg bg-slate-850 border border-slate-750 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{log.eventType.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSync(device.id)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Force Sync</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isLocked ? (
              <button
                onClick={() => onEndMode(device.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Unlock className="h-4 w-4" />
                <span>Release Classroom Mode</span>
              </button>
            ) : (
              <button
                onClick={() => onStartMode(device.id)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Lock className="h-4 w-4 fill-slate-950" />
                <span>Lock To Policy</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cloud Emergency Unlock Confirmation Prompt */}
      {showUnlockPrompt && (
        <div className="fixed inset-0 bg-slate-950/90 z-60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
              <span>Administrative Emergency Override</span>
            </h3>
            <p className="text-xs text-slate-300">
              This action immediately releases all AppLocker and Chrome restrictions on <strong className="text-white">{device.name}</strong> and records a Critical Audit Event.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Reason for Emergency Release</label>
                <input
                  type="text"
                  value={unlockReason}
                  onChange={e => setUnlockReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Enter Device PIN or Master Code</label>
                <input
                  type="password"
                  placeholder="Enter PIN..."
                  value={enteredPin}
                  onChange={e => setEnteredPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowUnlockPrompt(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePerformEmergencyUnlock}
                disabled={isProcessing}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                {isProcessing ? 'Overriding...' : 'CONFIRM OVERRIDE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
