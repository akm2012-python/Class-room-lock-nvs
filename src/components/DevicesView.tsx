import React, { useState } from 'react';
import { 
  Monitor, 
  Tv, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Key, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  Terminal, 
  Laptop, 
  Layers,
  ArrowUpDown,
  Download,
  Zap,
} from 'lucide-react';
import type { Device, Classroom, Policy, School } from '../types.ts';

interface DevicesViewProps {
  devices: Device[];
  classrooms: Classroom[];
  policies: Policy[];
  school: School;
  onSelectDevice: (device: Device) => void;
  onStartDeviceMode: (deviceId: string, policyId?: string) => Promise<void>;
  onEndDeviceMode: (deviceId: string) => Promise<void>;
  onSyncDevice: (deviceId: string) => Promise<void>;
  onSyncAllDevices?: () => Promise<void>;
  onGenerateEnrollmentToken: (classroomId: string) => Promise<string>;
  onOpenArtifactsModal?: () => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  classrooms,
  policies,
  school,
  onSelectDevice,
  onStartDeviceMode,
  onEndDeviceMode,
  onSyncDevice,
  onSyncAllDevices,
  onGenerateEnrollmentToken,
  onOpenArtifactsModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHardware, setFilterHardware] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClassroom, setFilterClassroom] = useState<string>('all');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollClassId, setEnrollClassId] = useState(classrooms[0]?.id || '');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  const filteredDevices = devices.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.deviceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ipAddress.includes(searchTerm);
    
    const matchesHardware = filterHardware === 'all' || d.hardwareType === filterHardware;
    const matchesClass = filterClassroom === 'all' || d.classroomId === filterClassroom;
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'online' && d.status === 'online') ||
      (filterStatus === 'offline' && d.status === 'offline') ||
      (filterStatus === 'locked' && d.classroomModeActive);

    return matchesSearch && matchesHardware && matchesClass && matchesStatus;
  });

  const handleCreateToken = async () => {
    setIsGeneratingToken(true);
    try {
      const token = await onGenerateEnrollmentToken(enrollClassId);
      setGeneratedToken(token);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const msiCommand = generatedToken 
    ? `msiexec /i "ClassroomLock-Agent-v2.4.msi" ENROLL_TOKEN="${generatedToken}" API_URL="https://api.classroomlock.io" /qn /l*v "C:\\ClassroomLockInstall.log"`
    : '';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Monitor className="h-6 w-6 text-emerald-400" />
            <span>Classroom Device Fleet</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time management for Windows 11 SmartVision interactive panels and classroom desktop workstations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenArtifactsModal && (
            <button
              onClick={onOpenArtifactsModal}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-emerald-500/50 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Download Windows Agent (.exe) installer"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Download .EXE Agent</span>
            </button>
          )}

          {onSyncAllDevices && (
            <button
              onClick={onSyncAllDevices}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-emerald-500/50 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Send live sync broadcast to all connected screens"
            >
              <Zap className="h-4 w-4 text-emerald-400" />
              <span>Sync All Displays</span>
            </button>
          )}

          <button
            onClick={() => {
              setGeneratedToken(null);
              setShowEnrollModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Enroll New Device</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, hostname, IP..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Hardware Type Filter */}
        <div>
          <select
            value={filterHardware}
            onChange={e => setFilterHardware(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none"
          >
            <option value="all">All Hardware Types</option>
            <option value="smartvision_ops">SmartVision OPS Interactive Boards</option>
            <option value="windows11_pc">Windows 11 Desktop PCs</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="locked">Classroom Mode Active (Locked)</option>
            <option value="online">Online / Heartbeat Active</option>
            <option value="offline">Offline (Grace Period Active)</option>
          </select>
        </div>

        {/* Classroom Filter */}
        <div>
          <select
            value={filterClassroom}
            onChange={e => setFilterClassroom(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none"
          >
            <option value="all">All Classrooms</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.roomNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Devices Table Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-850/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Device & Hardware</th>
                <th className="py-3.5 px-4">Classroom</th>
                <th className="py-3.5 px-4">OS & Agent</th>
                <th className="py-3.5 px-4">Current Policy</th>
                <th className="py-3.5 px-4">Lock Status</th>
                <th className="py-3.5 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No devices match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredDevices.map(dev => {
                  const isOnline = dev.status === 'online';
                  const isLocked = dev.classroomModeActive;

                  return (
                    <tr key={dev.id} className="hover:bg-slate-850/40 transition-colors">
                      {/* Name & Hardware */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {dev.hardwareType === 'smartvision_ops' ? (
                              <Tv className="h-5 w-5 text-purple-400" />
                            ) : (
                              <Laptop className="h-5 w-5 text-blue-400" />
                            )}
                          </div>
                          <div>
                            <button
                              onClick={() => onSelectDevice(dev)}
                              className="font-bold text-slate-100 hover:text-emerald-400 text-left transition-colors cursor-pointer"
                            >
                              {dev.name}
                            </button>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {dev.hostname} • {dev.ipAddress}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                              <span className={`text-[10px] font-semibold ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {isOnline ? 'Heartbeat Ack (15s)' : 'Offline / Cached'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Classroom */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-200">{dev.classroomName}</div>
                        <div className="text-[10px] text-slate-400">{dev.deviceCode}</div>
                      </td>

                      {/* OS & Agent Version */}
                      <td className="py-4 px-4">
                        <div className="text-slate-200 font-medium">{dev.osVersion}</div>
                        <div className="text-[10px] text-emerald-400/90 font-mono">{dev.agentVersion}</div>
                      </td>

                      {/* Current Policy */}
                      <td className="py-4 px-4">
                        <div className="text-slate-200 font-medium max-w-[180px] truncate" title={dev.currentPolicyName}>
                          {dev.currentPolicyName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Sync: {new Date(dev.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Lock Status */}
                      <td className="py-4 px-4">
                        {isLocked ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]">
                              <Lock className="h-3 w-3" />
                              <span>LOCKED</span>
                            </span>
                            <div className="text-[10px] text-emerald-400">Enforced via AppLocker</div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px]">
                              <Unlock className="h-3 w-3" />
                              <span>STANDBY</span>
                            </span>
                            <div className="text-[10px] text-slate-500">Normal Profile</div>
                          </div>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isLocked ? (
                            <button
                              onClick={() => onEndDeviceMode(dev.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer"
                              title="End Classroom Mode"
                            >
                              Release
                            </button>
                          ) : (
                            <button
                              onClick={() => onStartDeviceMode(dev.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer"
                              title="Engage Classroom Mode"
                            >
                              Lock
                            </button>
                          )}

                          <button
                            onClick={() => onSyncDevice(dev.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 cursor-pointer"
                            title="Force Instant Policy Sync"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => onSelectDevice(dev)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrollment Token & MSI Generator Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-emerald-400" />
                  <span>Enroll New Classroom Screen (MSI Installer)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deploy the ClassroomLock native C# Windows Agent to a SmartVision OPS board or PC.
                </p>
              </div>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Classroom Assignment</label>
                <select
                  value={enrollClassId}
                  onChange={e => setEnrollClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-medium focus:outline-none"
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.roomNumber}) — {c.building}
                    </option>
                  ))}
                </select>
              </div>

              {!generatedToken ? (
                <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 text-center space-y-3">
                  <p className="text-slate-300 text-xs">
                    Click below to generate a cryptographically signed 7-day enrollment token for this classroom.
                  </p>
                  <button
                    onClick={handleCreateToken}
                    disabled={isGeneratingToken}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    {isGeneratingToken ? 'Generating Token...' : 'Generate Enrollment Token'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase">Single-Use Enrollment Token</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedToken);
                          setCopiedToken(true);
                          setTimeout(() => setCopiedToken(false), 2000);
                        }}
                        className="text-emerald-300 hover:text-white flex items-center gap-1 font-semibold"
                      >
                        {copiedToken ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-sm font-bold text-white tracking-wider">{generatedToken}</div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Silent MSI Command Line (Intune / Group Policy / USB)
                    </label>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 break-all relative">
                      {msiCommand}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msiCommand);
                          setCopiedCmd(true);
                          setTimeout(() => setCopiedCmd(false), 2000);
                        }}
                        className="mt-2 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCmd ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedCmd ? 'Command Copied' : 'Copy Full MSI Command'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowEnrollModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
