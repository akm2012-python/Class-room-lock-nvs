import React, { useState } from 'react';
import { 
  Shield, 
  Monitor, 
  Layers, 
  FileText, 
  Settings, 
  Activity, 
  GraduationCap, 
  Tv, 
  Code, 
  CreditCard, 
  Key, 
  Lock, 
  Unlock, 
  User as UserIcon,
  Sparkles,
  Heart,
  Download,
  LogOut,
} from 'lucide-react';
import type { User, School, Device } from '../types.ts';

interface HeaderProps {
  currentUser: User;
  setCurrentUser?: (user: User) => void;
  school: School;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  availableUsers?: User[];
  onSwitchUser?: (user: User) => void;
  onSignOut?: () => void;
  devices: Device[];
  isSseConnected?: boolean;
  onOpenEmergencyModal?: () => void;
  onQuickToggleClassroomMode?: () => void;
  activeModeCount?: number;
  onOpenArtifactsModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  setCurrentUser,
  school,
  activeTab,
  setActiveTab,
  availableUsers,
  onSwitchUser,
  onSignOut,
  devices,
  isSseConnected = true,
  onOpenEmergencyModal,
  onQuickToggleClassroomMode,
  activeModeCount = 0,
  onOpenArtifactsModal,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const defaultUsers: User[] = [
    {
      id: 'usr_aditya_01',
      name: 'Aditya Kumar Mohanani',
      email: 'aditya.mohanani@navodaya.edu.in',
      role: 'super_admin',
      schoolId: school.id,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_sarah',
      name: 'Sarah Jenkins',
      email: 's.jenkins@jnvburhanpur.edu.in',
      role: 'teacher',
      schoolId: school.id,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr_admin',
      name: 'Rajesh Sharma',
      email: 'admin.tech@jnvburhanpur.edu.in',
      role: 'school_admin',
      schoolId: school.id,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
  ];

  const userList = availableUsers || defaultUsers;

  const handleUserSelect = (u: User) => {
    if (onSwitchUser) onSwitchUser(u);
    else if (setCurrentUser) setCurrentUser(u);
    setShowRoleDropdown(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Monitor },
    { id: 'teacher', label: 'Teacher Mode', icon: GraduationCap, badge: currentUser.role === 'teacher' ? 'Primary' : undefined },
    { id: 'classrooms', label: 'Classrooms', icon: Layers },
    { id: 'devices', label: 'Devices', icon: Monitor, count: devices.length },
    { id: 'policies', label: 'Policies', icon: Shield },
    { id: 'audit-logs', label: 'Audit Logs', icon: Activity },
    { id: 'setup-guide', label: 'Setup Guide & MSI', icon: FileText, badge: 'Setup' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const lockedDevicesCount = devices.filter(d => d.modeStatus === 'classroom_mode_active').length;
  const currentLockCount = activeModeCount || lockedDevicesCount;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      {/* Top Tribute / Recognition Ribbon */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-b border-emerald-500/20 py-1 px-4 sm:px-6 lg:px-8 text-center text-[11px] font-medium flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-400">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          <span className="font-semibold text-slate-200">Jawahar Navodaya Vidyalaya Digital Campus</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-300">
          <span className="text-slate-400">Made by</span>
          <span className="font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Navodayan</span>
          <span className="text-slate-400">for</span>
          <span className="font-semibold text-white">Navodayan</span>
          <span className="text-slate-500">•</span>
          <span className="font-bold text-amber-300">Aditya Kumar Mohanani</span>
          <span className="text-slate-300 font-medium">(9th JNV Burhanpur)</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-slate-400 text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>OPS SmartVision Ready</span>
        </div>
      </div>

      {/* Top Banner: Brand + School + Emergency Master Key */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  ClassroomLock
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Navodaya Edition
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal hidden sm:block">
                “Turn every classroom screen into a focused learning environment.”
              </p>
            </div>
          </div>

          {/* Center: Live Status & Active Locked Indicator */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="text-slate-400">Campus:</span>
              <span className="font-semibold text-slate-200">{school.name}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className={`h-2 w-2 rounded-full ${isSseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300">{isSseConnected ? 'Live Cloud Sync' : 'Reconnecting...'}</span>
            </div>

            {currentLockCount > 0 ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300">
                <Lock className="h-3.5 w-3.5" />
                <span className="font-semibold">{currentLockCount} Active Classroom Locks</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-xs text-slate-400">
                <Unlock className="h-3.5 w-3.5" />
                <span>Standby Profile</span>
              </div>
            )}
          </div>

          {/* Right Actions: Native Agent Architecture Artifacts & User Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenArtifactsModal && (
              <button
                onClick={onOpenArtifactsModal}
                id="header-agent-download-exe-btn"
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                title="Download Windows Agent (.exe) & Live Fleet Sync Hub"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Windows Agent (.exe)</span>
              </button>
            )}

            {onOpenArtifactsModal && (
              <button
                onClick={onOpenArtifactsModal}
                id="header-agent-artifacts-btn"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="View C# Agent Code, WiX MSI & Hardware Architecture"
              >
                <Code className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden md:inline">Agent Architecture</span>
              </button>
            )}

            {/* Role Switcher Menu */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs transition-colors cursor-pointer"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80'}
                  alt={currentUser.name}
                  className="h-6 w-6 rounded-full object-cover border border-slate-600"
                />
                <div className="text-left hidden md:block">
                  <div className="font-semibold text-slate-200 text-xs leading-tight">{currentUser.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-emerald-400 font-medium capitalize">{currentUser.role.replace('_', ' ')}</div>
                </div>
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-850 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-750">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Switch Demo Role</p>
                    <p className="text-xs text-slate-300 mt-0.5">Test permissions & dashboard view</p>
                  </div>
                  <div className="py-1 space-y-1">
                    {userList.map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleUserSelect(u)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                          u.id === currentUser.id ? 'bg-emerald-600/20 text-emerald-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-200">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-100 font-medium truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-400 capitalize truncate">{u.role.replace('_', ' ')}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 mt-1 border-t border-slate-750 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('settings');
                        setShowRoleDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Key className="h-3.5 w-3.5 text-emerald-400" />
                      <span>API Keys & School Settings</span>
                    </button>

                    {onSignOut && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowRoleDropdown(false);
                          onSignOut();
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/40 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
                      >
                        <LogOut className="h-3.5 w-3.5 text-red-400" />
                        <span>Sign Out of School Portal</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-950/80 border-t border-slate-850 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-1.5 min-w-max">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                    {item.count}
                  </span>
                )}
                {item.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
