import React, { useState } from 'react';
import { 
  Monitor, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Activity, 
  Layers, 
  Play, 
  Square, 
  ArrowRight, 
  CheckCircle2, 
  Tv, 
  Sparkles, 
  Key, 
  ExternalLink,
  RefreshCw,
  Plus,
  Code
} from 'lucide-react';
import type { Device, Classroom, Policy, AuditLog, School, User, NavTab } from '../types.ts';

interface DashboardViewProps {
  devices: Device[];
  classrooms: Classroom[];
  policies: Policy[];
  auditLogs: AuditLog[];
  school: School;
  currentUser?: User;
  onNavigateTo?: (tab: NavTab) => void;
  onNavigate?: (tab: string) => void;
  onStartClassSession: (classroomId: string, policyId: string, durationMinutes: number) => Promise<void>;
  onEndClassSession: (classroomId: string) => Promise<void>;
  onSelectDevice?: (device: Device) => void;
  onOpenSimulator?: (device: Device) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  devices,
  classrooms,
  policies,
  auditLogs,
  school,
  currentUser,
  onNavigateTo,
  onNavigate,
  onStartClassSession,
  onEndClassSession,
  onSelectDevice,
  onOpenSimulator,
}) => {
  const handleNav = (tab: any) => {
    if (onNavigateTo) onNavigateTo(tab);
    else if (onNavigate) onNavigate(tab);
  };
  const [selectedClassroomId, setSelectedClassroomId] = useState(classrooms[0]?.id || '');
  const [selectedPolicyId, setSelectedPolicyId] = useState(policies[0]?.id || '');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [isLaunching, setIsLaunching] = useState(false);

  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const offlineDevices = devices.filter(d => d.status === 'offline').length;
  const activeClassroomModes = devices.filter(d => d.classroomModeActive).length;
  const policyErrors = devices.filter(d => d.enforcementStatus === 'failed').length;
  const smartVisionCount = devices.filter(d => d.hardwareType === 'smartvision_ops').length;

  const activeSessions = classrooms.filter(c => c.activeSession);

  const handleLaunchQuickClass = async () => {
    if (!selectedClassroomId) return;
    setIsLaunching(true);
    try {
      await onStartClassSession(selectedClassroomId, selectedPolicyId, durationMinutes);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Overview */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Active Fleet Command
              </span>
              <span className="text-xs text-slate-400">
                {school.name} ({school.code})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ClassroomLock Operations Center
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Centralized policy enforcement and telemetry for Windows 11 classroom PCs and SmartVision OPS interactive boards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('teacher-portal')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              <span>Launch Teacher Mode</span>
            </button>
            <button
              onClick={() => onNavigate('policies')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Policy Builder</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Devices */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Fleet</span>
            <Monitor className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">{totalDevices}</div>
          <div className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">{smartVisionCount}</span> SmartVision OPS Boards
          </div>
        </div>

        {/* Online Devices */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Online Sync</span>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{onlineDevices}</div>
          <div className="mt-1 text-xs text-slate-400">
            {offlineDevices > 0 ? (
              <span className="text-amber-400">{offlineDevices} Offline (Grace active)</span>
            ) : (
              <span className="text-emerald-400">100% Heartbeat Ack</span>
            )}
          </div>
        </div>

        {/* Classroom Mode Active */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Active Locks</span>
            <Lock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">{activeClassroomModes}</div>
          <div className="mt-1 text-xs text-emerald-400 font-medium">
            {activeSessions.length} Active Classroom Sessions
          </div>
        </div>

        {/* Policy Errors */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Policy Errors</span>
            <AlertTriangle className={`h-4 w-4 ${policyErrors > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className={`mt-2 text-2xl font-black ${policyErrors > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {policyErrors}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {policyErrors === 0 ? 'Zero enforcement faults' : 'Check AppLocker log'}
          </div>
        </div>

        {/* License Seats */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Licenses</span>
            <span className="text-[10px] font-bold text-teal-400 uppercase bg-teal-500/10 px-1.5 py-0.5 rounded">
              {school.subscriptionPlan}
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            {school.usedLicenses} <span className="text-sm font-normal text-slate-500">/ {school.totalLicenses}</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {school.totalLicenses - school.usedLicenses} Seats available
          </div>
        </div>
      </div>

      {/* Main Dual Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Classroom Sessions & Quick Launcher */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Classroom Launcher Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Play className="h-4 w-4 text-emerald-400 fill-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Quick Classroom Lock Trigger</h2>
                  <p className="text-xs text-slate-400">Instantly broadcast AppLocker and Chrome restriction policies to all screens in a room.</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Safe Admin Rollback Guaranteed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Pick Classroom */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Classroom</label>
                <select
                  value={selectedClassroomId}
                  onChange={e => setSelectedClassroomId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.roomNumber}) — {c.deviceCount || 0} screens
                    </option>
                  ))}
                </select>
              </div>

              {/* Pick Policy */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Policy</label>
                <select
                  value={selectedPolicyId}
                  onChange={e => setSelectedPolicyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {policies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration & Launch Button */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Session Duration</label>
                <div className="flex gap-2">
                  <select
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    className="w-24 px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                  </select>
                  <button
                    onClick={handleLaunchQuickClass}
                    disabled={isLaunching}
                    className="flex-1 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    {isLaunching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-slate-950" />}
                    <span>ENGAGE</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Live Sessions */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                <span>Active Classroom Sessions</span>
              </h2>
              <button
                onClick={() => onNavigate('classrooms')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <span>View All Classrooms</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {activeSessions.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl">
                <Unlock className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No Active Classroom Sessions</p>
                <p className="text-xs text-slate-400 mt-0.5">All devices are currently in standard standby mode.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.map(c => {
                  const session = c.activeSession!;
                  const elapsedMins = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / (60 * 1000));
                  const classDevices = devices.filter(d => d.classroomId === c.id);

                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl bg-slate-850 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{c.name}</span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            LOCKED TO LESSON
                          </span>
                          <span className="text-xs text-slate-400">({c.roomNumber})</span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium">
                          Policy: <span className="text-emerald-300">{session.policyName}</span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Teacher: {session.teacherName} • Running for {elapsedMins} mins ({session.scheduledDurationMinutes}m cap) • {classDevices.length} screens locked
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEndClassSession(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Square className="h-3.5 w-3.5 fill-rose-300" />
                          <span>End Class Mode</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Connected Fleet Device Snapshot */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Monitor className="h-4 w-4 text-slate-300" />
                <span>Classroom Device Fleet</span>
              </h2>
              <button
                onClick={() => onNavigate('devices')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Devices</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Device Name & Host</th>
                    <th className="pb-3">Hardware Type</th>
                    <th className="pb-3">Classroom</th>
                    <th className="pb-3">Enforcement</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {devices.slice(0, 5).map(dev => (
                    <tr key={dev.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3">
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${dev.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <span>{dev.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{dev.hostname} • {dev.ipAddress}</div>
                      </td>
                      <td className="py-3">
                        {dev.hardwareType === 'smartvision_ops' ? (
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                            SmartVision OPS
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                            Win11 Desktop PC
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-300 font-medium">
                        {dev.classroomName}
                      </td>
                      <td className="py-3">
                        {dev.classroomModeActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                            <Lock className="h-3 w-3" />
                            <span>Enforced</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Unlock className="h-3 w-3" />
                            <span>Standby</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onSelectDevice(dev)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: SmartVision OPS Hub Spotlight + Live Audit/Tamper Alerts */}
        <div className="space-y-6">
          {/* SmartVision Hardware Highlight */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Tv className="h-5 w-5 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">SmartVision Board & OPS Slot Guide</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your SmartVision interactive board boots first into Android 13, then switches to Windows 11 via OPS 80-pin Intel module.
            </p>
            <div className="mt-3 p-3 rounded-xl bg-slate-850 border border-slate-750 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold">Android Edge Swipe Lock:</span>
                <span className="text-emerald-400 font-bold">Supported (RS232/UART)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold">OPS Auto-Input Binding:</span>
                <span className="text-emerald-400 font-bold">OPS-HDMI-1 Fixed</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold">Firmware Hacking Required?</span>
                <span className="text-rose-400 font-bold">NO (Clean Protocol)</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('smartvision')}
              className="mt-4 w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore SmartVision & OPS Architecture</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Live Security & Tamper Feed */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span>Live Security & Audit Feed</span>
              </h3>
              <button
                onClick={() => onNavigate('activity')}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                All Logs
              </button>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 5).map(log => {
                const isTamper = log.eventType === 'UNAUTHORIZED_APP_BLOCKED' || log.eventType === 'SMARTVISION_OPS_SWITCH_ATTEMPT';
                const isEmergency = log.eventType === 'EMERGENCY_OVERRIDE_USED';

                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      isEmergency
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                        : isTamper
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        : 'bg-slate-850 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{log.eventType.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-tight">{log.details}</p>
                    <div className="text-[10px] text-slate-400 font-medium">Actor: {log.actorName}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Windows Agent C# / MSI Package Generator Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-md">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-2">
              <Code className="h-4 w-4 text-emerald-400" />
              <span>Windows Agent & MSI Deployer</span>
            </h3>
            <p className="text-xs text-slate-300">
              Enterprise .NET C# Agent compiled to a native Windows Service with silent MSI command line enrollment for Intune / Group Policy.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleNav('devices')}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Enrollment & Device Fleet
              </button>
              <button
                onClick={() => handleNav('policies')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Policy Studio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
