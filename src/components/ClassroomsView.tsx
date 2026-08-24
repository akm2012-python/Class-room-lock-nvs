import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Play, 
  Square, 
  Monitor, 
  ShieldCheck, 
  Globe, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Clock, 
  Link as LinkIcon, 
  User, 
  Trash2, 
  AlertCircle 
} from 'lucide-react';
import type { Classroom, Device, Policy } from '../types.ts';

interface ClassroomsViewProps {
  classrooms: Classroom[];
  devices: Device[];
  policies: Policy[];
  onStartClassSession: (classroomId: string, policyId: string, durationMinutes: number, temporaryUrls?: string[]) => Promise<void>;
  onEndClassSession: (classroomId: string) => Promise<void>;
  onCreateClassroom: (classroom: Partial<Classroom>) => Promise<void>;
  onSelectDevice: (device: Device) => void;
}

export const ClassroomsView: React.FC<ClassroomsViewProps> = ({
  classrooms,
  devices,
  policies,
  onStartClassSession,
  onEndClassSession,
  onCreateClassroom,
  onSelectDevice,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState<Classroom | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState(policies[0]?.id || '');
  const [duration, setDuration] = useState(45);
  const [temporaryUrlInput, setTemporaryUrlInput] = useState('');
  const [tempUrlsList, setTempUrlsList] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New classroom form state
  const [newClassName, setNewClassName] = useState('');
  const [newGrade, setNewGrade] = useState('Grade 9');
  const [newSection, setNewSection] = useState('Section C');
  const [newBuilding, setNewBuilding] = useState('Aryabhata Wing');
  const [newRoomNumber, setNewRoomNumber] = useState('Room 206');
  const [newDefaultPolicyId, setNewDefaultPolicyId] = useState(policies[0]?.id || '');

  const handleAddTempUrl = () => {
    if (!temporaryUrlInput.trim()) return;
    let url = temporaryUrlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setTempUrlsList([...tempUrlsList, url]);
    setTemporaryUrlInput('');
  };

  const handleRemoveTempUrl = (index: number) => {
    setTempUrlsList(tempUrlsList.filter((_, i) => i !== index));
  };

  const handleLaunchSession = async () => {
    if (!showLaunchModal) return;
    setIsSubmitting(true);
    try {
      await onStartClassSession(showLaunchModal.id, selectedPolicyId, duration, tempUrlsList);
      setShowLaunchModal(null);
      setTempUrlsList([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateClassroom({
        name: newClassName,
        grade: newGrade,
        section: newSection,
        building: newBuilding,
        roomNumber: newRoomNumber,
        defaultPolicyId: newDefaultPolicyId,
      });
      setShowCreateModal(false);
      setNewClassName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-emerald-400" />
            <span>Classroom Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Organize interactive SmartVision boards and student PCs by room, assign policies, and trigger synchronous classroom focus mode.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Classroom</span>
        </button>
      </div>

      {/* Classrooms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {classrooms.map(classroom => {
          const classDevices = devices.filter(d => d.classroomId === classroom.id);
          const onlineCount = classDevices.filter(d => d.status === 'online').length;
          const lockedCount = classDevices.filter(d => d.classroomModeActive).length;
          const isSessionActive = Boolean(classroom.activeSession);
          const session = classroom.activeSession;
          const defaultPolicy = policies.find(p => p.id === classroom.defaultPolicyId) || policies[0];

          return (
            <div
              key={classroom.id}
              className={`rounded-2xl border transition-all ${
                isSessionActive
                  ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900 border-slate-800'
              } p-6 space-y-5`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold text-white">{classroom.name}</h2>
                    {isSessionActive ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        <span>CLASS IN SESSION</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold flex items-center gap-1">
                        <Unlock className="h-3 w-3" />
                        <span>Standby</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {classroom.building} • {classroom.roomNumber} ({classroom.grade} {classroom.section})
                  </p>
                </div>

                {isSessionActive ? (
                  <button
                    onClick={() => onEndClassSession(classroom.id)}
                    className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Square className="h-3.5 w-3.5 fill-rose-300" />
                    <span>End Session</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedPolicyId(classroom.defaultPolicyId || policies[0]?.id);
                      setShowLaunchModal(classroom);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-slate-950" />
                    <span>Start Classroom Mode</span>
                  </button>
                )}
              </div>

              {/* Active Session Details if Running */}
              {isSessionActive && session && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-emerald-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Policy: {session.policyName}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Started {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                  <p className="text-slate-300">
                    Lead Teacher: <span className="font-semibold text-white">{session.teacherName}</span>
                  </p>
                  {session.temporaryAllowedUrls.length > 0 && (
                    <div className="pt-2 border-t border-emerald-500/20">
                      <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                        Temporary Teacher Allowed Websites:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {session.temporaryAllowedUrls.map((url, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-500/30 text-[11px] font-mono">
                            {url}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Classroom Stats Grid */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-850 border border-slate-750 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Screens</span>
                  <span className="font-bold text-white text-sm">{classDevices.length}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Online Status</span>
                  <span className={`font-bold text-sm ${onlineCount === classDevices.length ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {onlineCount} / {classDevices.length} Connected
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Default Policy</span>
                  <span className="font-semibold text-slate-300 truncate block">{defaultPolicy?.name || 'Standard STEM'}</span>
                </div>
              </div>

              {/* Devices in this Classroom */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">Installed Classroom Screens:</span>
                  <span className="text-[11px] text-slate-400">{classDevices.length} registered</span>
                </div>

                {classDevices.length === 0 ? (
                  <div className="p-3 text-center rounded-xl bg-slate-850/50 border border-dashed border-slate-750 text-xs text-slate-400">
                    No devices assigned to this classroom yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classDevices.map(dev => (
                      <div
                        key={dev.id}
                        onClick={() => onSelectDevice(dev)}
                        className="p-2.5 rounded-lg bg-slate-850 hover:bg-slate-750 border border-slate-750 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`h-2 w-2 rounded-full ${dev.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <div>
                            <div className="font-semibold text-xs text-slate-200">{dev.name}</div>
                            <div className="text-[10px] text-slate-400">{dev.hardwareType === 'smartvision_ops' ? 'SmartVision OPS 75"' : 'Win11 PC'} • {dev.hostname}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {dev.classroomModeActive ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                              LOCKED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                              STANDBY
                            </span>
                          )}
                          <span className="text-slate-400 hover:text-white text-xs">Inspect →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Classroom Mode Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Play className="h-5 w-5 text-emerald-400 fill-emerald-400" />
                  <span>Start Classroom Mode: {showLaunchModal.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Applies policy lockdown to all {devices.filter(d => d.classroomId === showLaunchModal.id).length} screens in this room.
                </p>
              </div>
              <button
                onClick={() => setShowLaunchModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form controls */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Subject / Educational Policy</label>
                <select
                  value={selectedPolicyId}
                  onChange={e => setSelectedPolicyId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                >
                  {policies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Session Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 45, 60, 90].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDuration(mins)}
                      className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                        duration === mins
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Temporary Allowed URLs for this specific lesson */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Add Temporary Allowed URLs for this Lesson (Optional)
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Allow students/teachers to open a specific educational website or simulation link without permanently modifying the core school policy.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. phet.colorado.edu/sims/states-of-matter"
                    value={temporaryUrlInput}
                    onChange={e => setTemporaryUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTempUrl())}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTempUrl}
                    className="px-3 py-2 rounded-lg bg-slate-750 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {tempUrlsList.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {tempUrlsList.map((url, i) => (
                      <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-850 border border-slate-750 text-slate-300">
                        <span className="font-mono text-[11px] truncate">{url}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTempUrl(i)}
                          className="text-rose-400 hover:text-rose-300 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowLaunchModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchSession}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                {isSubmitting ? 'Engaging Devices...' : 'LOCK CLASSROOM NOW'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" />
                <span>Create New Classroom</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Classroom Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10-B"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Grade Level</label>
                  <input
                    type="text"
                    placeholder="e.g. 10th Grade"
                    value={newGrade}
                    onChange={e => setNewGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Section</label>
                  <input
                    type="text"
                    placeholder="e.g. Section B"
                    value={newSection}
                    onChange={e => setNewSection(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Building Wing</label>
                  <input
                    type="text"
                    placeholder="e.g. Aryabhata Wing"
                    value={newBuilding}
                    onChange={e => setNewBuilding(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Room Number</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 302"
                    value={newRoomNumber}
                    onChange={e => setNewRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Default Teaching Policy</label>
                <select
                  value={newDefaultPolicyId}
                  onChange={e => setNewDefaultPolicyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                >
                  {policies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Create Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
