import React, { useState } from 'react';
import { 
  Settings, 
  Building, 
  Key, 
  Tv, 
  Terminal, 
  Download, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  Copy, 
  Check,
  AlertTriangle,
  Sparkles,
  GraduationCap,
  Award,
  Heart,
  HardDrive,
  Cpu,
  Code,
  FileCode,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Radio,
  Zap,
  Lock,
  ArrowRight,
  Laptop,
  CheckCheck,
  PackageCheck,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  UserCheck,
  UserPlus,
  Users,
  Send,
  Play,
  Database
} from 'lucide-react';
import type { School, Classroom, Device, Policy, ApiKey, User } from '../types.ts';

interface SettingsViewProps {
  school: School;
  classrooms?: Classroom[];
  devices?: Device[];
  policies?: Policy[];
  apiKeys?: ApiKey[];
  users?: User[];
  currentUser?: User;
  onUpdateSchool: (updated: Partial<School>) => Promise<void>;
  onResetDemoData: () => Promise<void>;
  onGenerateEnrollmentToken?: (classroomId: string) => Promise<string>;
  onOpenArtifactsModal?: () => void;
  onRefreshFleet?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  school,
  classrooms = [],
  devices = [],
  policies = [],
  apiKeys = [],
  users = [],
  currentUser,
  onUpdateSchool,
  onResetDemoData,
  onGenerateEnrollmentToken,
  onOpenArtifactsModal,
  onRefreshFleet,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'deployment' | 'api-keys' | 'staff' | 'general' | 'hardware' | 'mdm' | 'database'>('deployment');
  
  // Database State & Stats
  const [dbStats, setDbStats] = useState<any>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [dbToast, setDbToast] = useState<string | null>(null);
  const [selectedDbTable, setSelectedDbTable] = useState<'schools' | 'classrooms' | 'devices' | 'policies' | 'auditLogs' | 'apiKeys' | 'users' | 'otps'>('devices');
  const [tableData, setTableData] = useState<any[]>([]);
  
  // General Profile State
  const [name, setName] = useState(school.name);
  const [code, setCode] = useState(school.code);
  const [timezone, setTimezone] = useState(school.timezone);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Deployment Sub-view State
  const [selectedClassroom, setSelectedClassroom] = useState(classrooms[0]?.id || 'cls_9a');
  const [enrollmentToken, setEnrollmentToken] = useState('NAVODAYA-' + (school.code || 'JNV-BURHANPUR') + '-2026');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedMsiCmd, setCopiedMsiCmd] = useState(false);
  const [copiedPs1Cmd, setCopiedPs1Cmd] = useState(false);
  const [copiedVerifyCmd, setCopiedVerifyCmd] = useState(false);
  const [copiedIntune, setCopiedIntune] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Handshake Test Simulator
  const [isTestingHandshake, setIsTestingHandshake] = useState(false);
  const [handshakeResult, setHandshakeResult] = useState<string | null>(null);

  // API Keys Subtab State
  const [localApiKeys, setLocalApiKeys] = useState<ApiKey[]>(apiKeys);
  const [showGenerateKeyModal, setShowGenerateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRole, setNewKeyRole] = useState<'admin' | 'device_agent' | 'readonly'>('admin');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['devices:control', 'policies:read_write', 'emergency:unlock', 'agent:telemetry']);
  const [newlyGeneratedSecret, setNewlyGeneratedSecret] = useState<string | null>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);

  // API Key Tester state
  const [testKeyInput, setTestKeyInput] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testKeyResult, setTestKeyResult] = useState<any | null>(null);

  // Staff & Accounts Subtab State
  const [localUsers, setLocalUsers] = useState<User[]>(users);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<'school_admin' | 'teacher'>('teacher');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Change Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passChangeSuccess, setPassChangeSuccess] = useState<string | null>(null);
  const [passChangeError, setPassChangeError] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Sync external props with local state when updated
  React.useEffect(() => {
    if (apiKeys && apiKeys.length > 0) {
      setLocalApiKeys(apiKeys);
    }
  }, [apiKeys]);

  React.useEffect(() => {
    if (users && users.length > 0) {
      setLocalUsers(users);
    }
  }, [users]);

  const serverOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://api.classroomlock.io';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateSchool({
        name,
        code,
        timezone,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset sample classrooms, devices, and policies back to default state?')) return;
    setIsResetting(true);
    try {
      await onResetDemoData();
    } finally {
      setIsResetting(false);
    }
  };

  const handleGenerateNewToken = async () => {
    setIsGeneratingToken(true);
    try {
      if (onGenerateEnrollmentToken) {
        const token = await onGenerateEnrollmentToken(selectedClassroom);
        setEnrollmentToken(token);
      } else {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        setEnrollmentToken(`NAVODAYA-${school.code || 'JNV'}-${randomNum}`);
      }
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleDownloadMsi = () => {
    const downloadUrl = `/api/download/ClassroomLock.msi?token=${encodeURIComponent(enrollmentToken)}&classroom=${encodeURIComponent(selectedClassroom)}`;
    window.location.href = downloadUrl;
    setDownloadSuccessToast('Downloading pre-configured ClassroomLock.msi with embedded token!');
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  const handleDownloadExe = () => {
    const downloadUrl = `/api/download/ClassroomLock-Agent-Setup.exe?token=${encodeURIComponent(enrollmentToken)}&classroom=${encodeURIComponent(selectedClassroom)}`;
    window.location.href = downloadUrl;
  };

  const handleTestAgentHandshake = async () => {
    setIsTestingHandshake(true);
    setHandshakeResult(null);
    try {
      const payload = {
        token: enrollmentToken,
        classroomId: selectedClassroom,
        hostname: 'SMARTVISION-OPS-TEST',
        ipAddress: '192.168.1.199',
        hardwareType: 'smartvision_ops',
        osVersion: 'Windows 11 Enterprise 23H2 (Build 22631)',
      };
      const res = await fetch('/api/devices/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setHandshakeResult(`Handshake Succeeded! Device ID: ${data.deviceId} linked with Emergency PIN: ${data.emergencyUnlockCode}`);
        onRefreshFleet?.();
      } else {
        setHandshakeResult(`Handshake error: ${data.error || 'Server rejected token'}`);
      }
    } catch (err: any) {
      setHandshakeResult(`Handshake test notice: ${err?.message || 'Connection offline'}`);
    } finally {
      setIsTestingHandshake(false);
    }
  };

  // API Key handlers
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingKey(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName || 'School Admin REST Key',
          role: newKeyRole,
          scopes: newKeyScopes,
        }),
      });
      const createdKey = await res.json();
      if (res.ok) {
        setLocalApiKeys([createdKey, ...localApiKeys]);
        setNewlyGeneratedSecret(createdKey.keySecret);
        setNewKeyName('');
        onRefreshFleet?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Connected agents or scripts using this key will immediately lose access.')) return;
    try {
      const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLocalApiKeys(localApiKeys.filter(k => k.id !== id));
        onRefreshFleet?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingKey(true);
    setTestKeyResult(null);
    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: testKeyInput }),
      });
      const data = await res.json();
      setTestKeyResult(data);
    } catch (err: any) {
      setTestKeyResult({ valid: false, error: err.message });
    } finally {
      setIsTestingKey(false);
    }
  };

  // Staff Account handlers
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingStaff(true);
    setStaffError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          role: staffRole,
          phone: staffPhone,
          password: staffPassword || 'Navodaya@Staff2026',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLocalUsers([...localUsers, data]);
        setShowAddStaffModal(false);
        setStaffName('');
        setStaffEmail('');
        setStaffPhone('');
        setStaffPassword('');
        onRefreshFleet?.();
      } else {
        setStaffError(data.error || 'Failed to add staff member.');
      }
    } catch (err: any) {
      setStaffError(err.message || 'Server error.');
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleDeleteStaff = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this staff member account?')) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setLocalUsers(localUsers.filter(u => u.id !== userId));
        onRefreshFleet?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPassChangeError('New passwords do not match.');
      return;
    }
    setIsChangingPass(true);
    setPassChangeError(null);
    setPassChangeSuccess(null);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          currentPassword: currentPass,
          newPassword: newPass,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPassChangeSuccess('Your password has been changed successfully.');
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setPassChangeError(data.error || 'Failed to change password.');
      }
    } catch (err: any) {
      setPassChangeError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const msiSilentInstallCmd = `msiexec.exe /i "ClassroomLock.msi" ENROLL_TOKEN="${enrollmentToken}" ENROLL_SERVER="${serverOrigin}" CLASSROOM_ID="${selectedClassroom}" /qn /norestart /L*V "C:\\ClassroomLock_Install.log"`;
  const ps1DeployCmd = `irm "${serverOrigin}/api/download/install.ps1?token=${enrollmentToken}&classroom=${selectedClassroom}" | iex`;
  const verifyServiceCmd = `Get-Service -Name ClassroomLockAgent | Select-Object Status, StartType, DisplayName`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-emerald-400" />
            <span>School & Fleet Control Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage school identity, generate pre-configured MSI installers, control API keys, and manage school staff accounts.
          </p>
        </div>

        {onOpenArtifactsModal && (
          <button
            type="button"
            onClick={onOpenArtifactsModal}
            className="px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Code className="h-4 w-4 text-emerald-400" />
            <span>View C# Agent Source & Architecture</span>
          </button>
        )}
      </div>

      {/* Navodaya & Creator Dedication Card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <GraduationCap className="h-32 w-32 text-emerald-400" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Award className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">ClassroomLock Platform Dedication</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Class 9th JNV Burhanpur
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  v2.4.1 Enterprise
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                Made by <span className="text-emerald-400">Navodayan</span> for <span className="text-teal-300">Navodayan</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Authored by <strong className="text-white">Aditya Kumar Mohanani</strong>, 9th Grade student at <strong className="text-emerald-300">Jawahar Navodaya Vidyalaya (JNV) Burhanpur</strong>. Built to provide distraction-free interactive smart panel and Windows 11 lab fleet management for modern digital classrooms.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex sm:flex-col items-center gap-2 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] font-semibold uppercase text-slate-400">Navodaya Edition</div>
            <div className="text-xs font-bold text-emerald-400">v2.4.1 Active</div>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto scrollbar-none text-xs">
        {[
          { id: 'deployment', label: 'Agent Deployment (.MSI / .exe)', icon: Download, badge: 'Recommended' },
          { id: 'api-keys', label: 'API Keys & REST Controls', icon: Key, badge: 'Direct API' },
          { id: 'staff', label: 'Staff & Accounts', icon: Users },
          { id: 'database', label: 'Database & Clean State', icon: HardDrive, badge: 'Persistence' },
          { id: 'general', label: 'Institution Profile', icon: Building },
          { id: 'hardware', label: 'SmartVision UART Hardware', icon: Tv },
          { id: 'mdm', label: 'Intune & Active Directory GPO', icon: Terminal },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`py-2.5 px-3.5 rounded-lg font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  isActive ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 1: WINDOWS AGENT DEPLOYMENT (.MSI) & INSTALLATION INSTRUCTIONS */}
      {activeSubTab === 'deployment' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {downloadSuccessToast && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg animate-in slide-in-from-top-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{downloadSuccessToast}</span>
            </div>
          )}

          {/* Section 1: Pre-Configured Installer Download Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Pre-Configured ClassroomLock Installer Generator</h2>
                  <p className="text-xs text-slate-400">
                    Generates production Windows binaries dynamically embedded with your school endpoint and token.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                  v2.4.1 MSI Package
                </span>
              </div>
            </div>

            {/* Target Classroom & Token Configurator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Classroom Assignment
                </label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade} • {c.building} Room {c.roomNumber})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  When the MSI installs on the panel, it auto-registers under this classroom.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Embedded Enrollment Token
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateNewToken}
                    disabled={isGeneratingToken}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isGeneratingToken ? 'animate-spin' : ''}`} />
                    <span>Generate Fresh</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={enrollmentToken}
                    className="w-full px-3.5 py-2.5 pr-20 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(enrollmentToken);
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 2000);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedToken ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cryptographic single-school authorization key injected into MSI properties table.
                </p>
              </div>
            </div>

            {/* Download Buttons Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadMsi}
                id="btn-download-preconfigured-msi"
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4 text-slate-950" />
                <span>Download ClassroomLock.msi</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadExe}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <HardDrive className="h-4 w-4 text-emerald-400" />
                <span>Download .exe Standalone Setup</span>
              </button>

              <button
                type="button"
                onClick={handleTestAgentHandshake}
                disabled={isTestingHandshake}
                className="px-4 py-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ml-auto disabled:opacity-50"
              >
                <Zap className={`h-4 w-4 ${isTestingHandshake ? 'animate-spin' : 'text-purple-400'}`} />
                <span>{isTestingHandshake ? 'Simulating Handshake...' : 'Simulate Live Agent Handshake'}</span>
              </button>
            </div>

            {handshakeResult && (
              <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
                <span>{handshakeResult}</span>
              </div>
            )}
          </div>

          {/* Section 2: Step-by-Step Installation Instructions */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Terminal className="h-5 w-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-white">Windows Agent Installation & Verification Guide</h2>
                <p className="text-xs text-slate-400">
                  Follow these steps to deploy on SmartVision IFPDs or student lab desktops.
                </p>
              </div>
            </div>

            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">1</span>
                  <span className="text-xs font-bold text-white">Silent Command-Line MSI Installation (Admin PowerShell/CMD)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(msiSilentInstallCmd);
                    setCopiedMsiCmd(true);
                    setTimeout(() => setCopiedMsiCmd(false), 2000);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {copiedMsiCmd ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedMsiCmd ? 'Copied' : 'Copy Command'}</span>
                </button>
              </div>
              <code className="text-xs font-mono text-emerald-300 block p-3 rounded-lg bg-slate-900/90 border border-slate-800 select-all overflow-x-auto whitespace-pre">
                {msiSilentInstallCmd}
              </code>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">2</span>
                  <span className="text-xs font-bold text-white">1-Click PowerShell Cloud Provisioner</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(ps1DeployCmd);
                    setCopiedPs1Cmd(true);
                    setTimeout(() => setCopiedPs1Cmd(false), 2000);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {copiedPs1Cmd ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedPs1Cmd ? 'Copied' : 'Copy Script'}</span>
                </button>
              </div>
              <code className="text-xs font-mono text-teal-300 block p-3 rounded-lg bg-slate-900/90 border border-slate-800 select-all overflow-x-auto whitespace-pre">
                {ps1DeployCmd}
              </code>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">3</span>
                  <span className="text-xs font-bold text-white">Verify Background Service Health in Windows Services</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(verifyServiceCmd);
                    setCopiedVerifyCmd(true);
                    setTimeout(() => setCopiedVerifyCmd(false), 2000);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {copiedVerifyCmd ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedVerifyCmd ? 'Copied' : 'Copy Command'}</span>
                </button>
              </div>
              <code className="text-xs font-mono text-purple-300 block p-3 rounded-lg bg-slate-900/90 border border-slate-800 select-all overflow-x-auto whitespace-pre">
                {verifyServiceCmd}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: API KEYS & REST CONTROLS */}
      {activeSubTab === 'api-keys' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">School Fleet REST API & Authentication Keys</h2>
                  <p className="text-xs text-slate-400">
                    Control classroom locks, execute emergency overrides, and ingest telemetry directly via HTTP REST API.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowGenerateKeyModal(true); setNewlyGeneratedSecret(null); }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Generate New API Key</span>
              </button>
            </div>

            {/* Newly Created Secret Banner */}
            {newlyGeneratedSecret && (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span>New API Key Generated Successfully</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 font-semibold">
                    Copy now (Displayed only once)
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={newlyGeneratedSecret}
                    className="w-full px-3.5 py-2.5 pr-20 rounded-lg bg-slate-950 border border-emerald-500/40 text-xs font-mono text-emerald-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newlyGeneratedSecret);
                      setCopiedApiKey(true);
                      setTimeout(() => setCopiedApiKey(false), 2000);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedApiKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedApiKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-emerald-400/80">
                  Store this secret securely. Use header <code className="font-mono text-white">X-API-Key: {newlyGeneratedSecret}</code> or <code className="font-mono text-white">Authorization: Bearer {newlyGeneratedSecret}</code> in your HTTP requests.
                </p>
              </div>
            )}

            {/* Active Keys Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="pb-3 px-3">Key Name</th>
                    <th className="pb-3 px-3">Prefix</th>
                    <th className="pb-3 px-3">Role</th>
                    <th className="pb-3 px-3">Allowed Scopes</th>
                    <th className="pb-3 px-3">Last Used</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {localApiKeys.map(key => (
                    <tr key={key.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-200">{key.name}</div>
                        <div className="text-[10px] text-slate-500">Created: {new Date(key.createdAt).toLocaleDateString()} by {key.createdByName || 'Admin'}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-emerald-400">
                        {key.keyPrefix}...
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          key.role === 'admin' ? 'bg-purple-950 text-purple-300 border border-purple-500/30' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {key.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                        {key.lastUsedAt ? (
                          <div>
                            <div>{new Date(key.lastUsedAt).toLocaleTimeString()}</div>
                            <div className="text-[10px] text-slate-500">IP: {key.lastUsedIp || 'Local'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Never used</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRevokeApiKey(key.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Revoke Key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Live Key Tester */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Zap className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Live API Key Tester</h3>
                <p className="text-xs text-slate-400">Validate any API key or token against the school authentication server.</p>
              </div>
            </div>

            <form onSubmit={handleTestApiKey} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={testKeyInput}
                onChange={(e) => setTestKeyInput(e.target.value)}
                placeholder="Paste API Key prefix (e.g. crlk_live_adm9821)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-850 border border-slate-700 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                type="submit"
                disabled={isTestingKey || !testKeyInput}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isTestingKey ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                <span>Verify Key</span>
              </button>
            </form>

            {testKeyResult && (
              <div className={`p-3 rounded-xl border text-xs font-mono ${
                testKeyResult.valid ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border-red-500/40 text-red-300'
              }`}>
                <pre className="overflow-x-auto whitespace-pre">{JSON.stringify(testKeyResult, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Interactive REST API Documentation & cURL snippets */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Code className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">REST API v1 Interactive Endpoint Library</h3>
                <p className="text-xs text-slate-400">Headless control commands for scripts, automated bells, or remote admins.</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Endpoint 1: Lock Panel */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 text-[10px] font-bold">POST</span>
                    <span className="text-xs font-bold text-white font-mono">/api/v1/devices/:id/lock</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Lock specific interactive screen to policy</span>
                </div>
                <code className="text-[11px] font-mono text-emerald-300 block bg-slate-900 p-2 rounded border border-slate-800 select-all overflow-x-auto">
                  curl -X POST "{serverOrigin}/api/v1/devices/{devices[0]?.id || 'dev_01'}/lock" -H "X-API-Key: {localApiKeys[0]?.keyPrefix || 'crlk_live_...'}" -H "Content-Type: application/json"
                </code>
              </div>

              {/* Endpoint 2: Unlock Panel */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">POST</span>
                    <span className="text-xs font-bold text-white font-mono">/api/v1/devices/:id/unlock</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Release classroom lock profile</span>
                </div>
                <code className="text-[11px] font-mono text-emerald-300 block bg-slate-900 p-2 rounded border border-slate-800 select-all overflow-x-auto">
                  curl -X POST "{serverOrigin}/api/v1/devices/{devices[0]?.id || 'dev_01'}/unlock" -H "X-API-Key: {localApiKeys[0]?.keyPrefix || 'crlk_live_...'}"
                </code>
              </div>

              {/* Endpoint 3: Fleet Sync */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-bold">POST</span>
                    <span className="text-xs font-bold text-white font-mono">/api/v1/fleet/broadcast-sync</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Trigger live fleet-wide sync ping</span>
                </div>
                <code className="text-[11px] font-mono text-emerald-300 block bg-slate-900 p-2 rounded border border-slate-800 select-all overflow-x-auto">
                  curl -X POST "{serverOrigin}/api/v1/fleet/broadcast-sync" -H "X-API-Key: {localApiKeys[0]?.keyPrefix || 'crlk_live_...'}"
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: STAFF & ACCOUNTS MANAGEMENT */}
      {activeSubTab === 'staff' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Staff Accounts List */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">School Staff & Teacher Accounts</h2>
                  <p className="text-xs text-slate-400">Manage registered faculty and IT administrators for this campus.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Staff Member</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {localUsers.map(u => (
                <div key={u.id} className="p-4 rounded-xl bg-slate-850/80 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80'}
                      alt={u.name}
                      className="h-10 w-10 rounded-full object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200 text-xs truncate">{u.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold capitalize ${
                          u.role === 'super_admin' ? 'bg-purple-950 text-purple-300 border border-purple-500/30' :
                          u.role === 'school_admin' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                          'bg-blue-950 text-blue-300 border border-blue-500/30'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                        {u.id === currentUser?.id && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {localUsers.length > 1 && u.role !== 'super_admin' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(u.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Remove User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Change Account Password Form */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Lock className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Change Account Password</h3>
                <p className="text-xs text-slate-400">Update credentials for currently active user ({currentUser?.name}).</p>
              </div>
            </div>

            {passChangeSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{passChangeSuccess}</span>
              </div>
            )}
            {passChangeError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passChangeError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <button
                type="submit"
                disabled={isChangingPass}
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isChangingPass ? 'Updating...' : 'Save New Password'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: GENERAL INSTITUTION PROFILE */}
      {activeSubTab === 'general' && (
        <form onSubmit={handleSave} className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Campus & Master Emergency Configuration</h2>
            </div>
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Check className="h-4 w-4" /> Saved successfully
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Institution Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Campus Code</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Timezone</label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Emergency School Master Override PIN</label>
              <input
                type="text"
                readOnly
                value={school.emergencyMasterCode}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono select-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting}
              className="px-4 py-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Fleet State</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Save className="h-4 w-4 text-slate-950" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-VIEW 5: SMARTVISION UART HARDWARE */}
      {activeSubTab === 'hardware' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Tv className="h-5 w-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">SmartVision Interactive Board Controller (UART / RS232)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Internal UART Baud Rate</label>
              <input
                type="text"
                disabled
                value="115200 Baud (COM1 / /dev/ttyS0)"
                className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-800 text-purple-300 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Bezel Swipe Suppression Command</label>
              <input
                type="text"
                disabled
                value="0xAA 0xBB 0x01 0x01 (Lock Bezel Menu)"
                className="w-full px-3 py-2 rounded-lg bg-slate-850 border border-slate-800 text-purple-300 font-mono cursor-not-allowed"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            When classroom focus mode starts on a SmartVision OPS panel, the Windows Agent emits this native hardware signal to suppress the Android side-swipe menu, preventing students from switching inputs away from the lesson.
          </p>
        </div>
      )}

      {/* SUB-VIEW 6: MICROSOFT INTUNE & ACTIVE DIRECTORY GPO */}
      {activeSubTab === 'mdm' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Microsoft Intune & Active Directory Mass Deployment</h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Intune Win32 App Silent Install Parameter:</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`ClassroomLock.msi /qn ENROLL_SERVER="${serverOrigin}" ENROLL_TOKEN="${enrollmentToken}"`);
                  setCopiedIntune(true);
                  setTimeout(() => setCopiedIntune(false), 2000);
                }}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copiedIntune ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedIntune ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="text-[11px] font-mono text-emerald-300 block break-all">
              ClassroomLock.msi /qn ENROLL_SERVER="{serverOrigin}" ENROLL_TOKEN="{enrollmentToken}"
            </code>
          </div>
        </div>
      )}

      {/* SUB-VIEW 7: DATABASE, CLEAN PRODUCTION & PERSISTENCE HUB */}
      {activeSubTab === 'database' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {dbToast && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg animate-in slide-in-from-top-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{dbToast}</span>
            </div>
          )}

          {/* Clean State & Seeding Controls */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <HardDrive className="h-5 w-5 text-emerald-400" />
                <div>
                  <h2 className="text-base font-bold text-white">Database State & Commissioning Operations</h2>
                  <p className="text-xs text-slate-400">
                    Switch between demo presentation mode and a pristine, unpopulated database for school deployment.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Clean Production State */}
              <div className="p-4 rounded-xl bg-slate-950 border border-red-500/30 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                  <Trash2 className="h-4 w-4" />
                  <span>Clean Production State (Empty Fleet)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Purges all simulated classroom devices, sample logs, and demo rooms. Retains the core administrator account ready for genuine Windows Agent MSI enrollments.
                </p>
                <button
                  type="button"
                  disabled={isLoadingDb}
                  onClick={async () => {
                    if (!confirm('Switch to clean production state? This will clear all sample devices and prepare a blank slate for school commission.')) return;
                    setIsLoadingDb(true);
                    try {
                      const res = await fetch('/api/database/clean-production', { method: 'POST' });
                      const data = await res.json();
                      if (res.ok) {
                        setDbToast('Database reset to clean production mode. Fleet is ready for live enrollments.');
                        onRefreshFleet?.();
                        setTimeout(() => setDbToast(null), 4000);
                      }
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsLoadingDb(false);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isLoadingDb ? 'Resetting...' : 'Switch to Clean Production State'}</span>
                </button>
              </div>

              {/* Option B: Restore Navodaya JNV Sample Data */}
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <RefreshCw className="h-4 w-4" />
                  <span>Restore Navodaya JNV Fleet Dataset</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Loads the authentic demonstration dataset: JNV Burhanpur SmartVision OPS panels, Class 9A/10B labs, sample policies, and staff profiles.
                </p>
                <button
                  type="button"
                  disabled={isLoadingDb}
                  onClick={async () => {
                    setIsLoadingDb(true);
                    try {
                      const res = await fetch('/api/database/seed-navodaya', { method: 'POST' });
                      const data = await res.json();
                      if (res.ok) {
                        setDbToast('Restored full Navodaya Vidyalaya demonstration dataset.');
                        onRefreshFleet?.();
                        setTimeout(() => setDbToast(null), 4000);
                      }
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsLoadingDb(false);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{isLoadingDb ? 'Seeding...' : 'Load Navodaya JNV Fleet'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Database Backup & Export/Import */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Database className="h-5 w-5 text-teal-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Database Backup, Export & Restore</h3>
                <p className="text-xs text-slate-400">ClassroomLock stores all state in persistent storage (`classroomlock_db.json`).</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href="/api/database/export"
                download="classroomlock_db_backup.json"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4 text-emerald-400" />
                <span>Export Database (.JSON Backup)</span>
              </a>

              <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer">
                <FileCode className="h-4 w-4 text-blue-400" />
                <span>Import / Restore Backup File</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const text = await file.text();
                      const parsed = JSON.parse(text);
                      const res = await fetch('/api/database/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(parsed),
                      });
                      if (res.ok) {
                        setDbToast('Database backup successfully imported!');
                        onRefreshFleet?.();
                        setTimeout(() => setDbToast(null), 4000);
                      }
                    } catch (err: any) {
                      alert('Failed to parse or import JSON backup: ' + err.message);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Generate API Key Modal */}
      {showGenerateKeyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Generate School REST API Key</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateKeyModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => { handleCreateApiKey(e); setShowGenerateKeyModal(false); }} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Key Description / Name</label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Lab 1 Automation & Bell Controller"
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Permission Role</label>
                <select
                  value={newKeyRole}
                  onChange={(e) => setNewKeyRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none"
                >
                  <option value="admin">Admin (Full Control)</option>
                  <option value="device_agent">Device Agent (Heartbeat & Enforcement)</option>
                  <option value="readonly">Read-Only Telemetry</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Scopes</label>
                <div className="space-y-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {[
                    { id: 'devices:control', label: 'Lock / Unlock Screens & Classrooms' },
                    { id: 'policies:read_write', label: 'Create & Edit Policies' },
                    { id: 'emergency:unlock', label: 'Emergency Override Release' },
                    { id: 'agent:telemetry', label: 'Transmit Agent Heartbeats & Violations' },
                  ].map(sc => (
                    <label key={sc.id} className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={newKeyScopes.includes(sc.id)}
                        onChange={(e) => {
                          if (e.target.checked) setNewKeyScopes([...newKeyScopes, sc.id]);
                          else setNewKeyScopes(newKeyScopes.filter(s => s !== sc.id));
                        }}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>{sc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateKeyModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingKey}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  {isGeneratingKey ? 'Generating...' : 'Create API Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Member Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Add School Faculty / Admin</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {staffError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{staffError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra (Math Dept)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">School Email</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="ramesh.chandra@jnvburhanpur.edu.in"
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Role</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-700 text-slate-100 focus:outline-none"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="school_admin">School Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Default: Navodaya@Staff2026"
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingStaff}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  {isAddingStaff ? 'Adding...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
