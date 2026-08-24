import React, { useState, useEffect, useCallback } from 'react';
import type { 
  School, 
  Classroom, 
  Device, 
  Policy, 
  AuditLog, 
  User, 
  ApiKey,
  NavTab 
} from './types.ts';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { TeacherPortalView } from './components/TeacherPortalView.tsx';
import { ClassroomsView } from './components/ClassroomsView.tsx';
import { DevicesView } from './components/DevicesView.tsx';
import { PoliciesView } from './components/PoliciesView.tsx';
import { AuditLogsView } from './components/AuditLogsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { SetupGuideView } from './components/SetupGuideView.tsx';
import { LoginView } from './components/LoginView.tsx';
import { DeviceDetailModal } from './components/DeviceDetailModal.tsx';
import { SmartVisionSimulatorModal } from './components/SmartVisionSimulatorModal.tsx';
import { AgentArtifactsModal } from './components/AgentArtifactsModal.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [school, setSchool] = useState<School | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('crlk_auth_token');
  });
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('crlk_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      id: 'usr_admin',
      name: 'Rajesh Sharma',
      email: 'admin.tech@jnvburhanpur.edu.in',
      role: 'school_admin',
      schoolId: 'sch_navodaya_001',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    };
  });

  // Modal states
  const [selectedDeviceForDetail, setSelectedDeviceForDetail] = useState<Device | null>(null);
  const [selectedDeviceForSim, setSelectedDeviceForSim] = useState<Device | null>(null);
  const [showArtifactsModal, setShowArtifactsModal] = useState(false);
  const [notificationToast, setNotificationToast] = useState<{ title: string; message: string; type: 'info' | 'warning' | 'critical' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial state and API keys from server
  const fetchFleetData = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/state', { headers });
      if (res.ok) {
        const data = await res.json();
        setSchool(data.school);
        setClassrooms(data.classrooms);
        setDevices(data.devices);
        setPolicies(data.policies);
        setAuditLogs(data.auditLogs);
      }

      // Fetch API Keys
      const keysRes = await fetch('/api/keys', { headers });
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData);
      }

      // Fetch School Users
      const usersRes = await fetch('/api/users', { headers });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (err) {
      console.error('Error fetching fleet state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchFleetData();
  }, [fetchFleetData]);

  // Connect SSE for real-time fleet events
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          if (event.type === 'CLASSROOM_MODE_STARTED') {
            setNotificationToast({
              title: 'Classroom Mode Engaged',
              message: `${event.classroomName} is now locked to ${event.policyName}.`,
              type: 'info',
            });
            fetchFleetData();
          } else if (event.type === 'CLASSROOM_MODE_ENDED') {
            setNotificationToast({
              title: 'Classroom Mode Released',
              message: `${event.classroomName} has returned to standard standby.`,
              type: 'info',
            });
            fetchFleetData();
          } else if (event.type === 'SECURITY_VIOLATION') {
            setNotificationToast({
              title: 'Security Violation Intercepted',
              message: event.details,
              type: 'warning',
            });
            fetchFleetData();
          } else if (event.type === 'EMERGENCY_UNLOCK') {
            setNotificationToast({
              title: 'Emergency Unlock Triggered',
              message: `${event.deviceName} was unlocked via administrative emergency PIN.`,
              type: 'critical',
            });
            fetchFleetData();
          } else if (event.type === 'FLEET_SYNC_ALL' || event.type === 'DEVICE_ENROLLED' || event.type === 'DEVICE_UPDATED') {
            fetchFleetData();
          }
        } catch {
          // ignore parsing error
        }
      };
    } catch {
      // ignore
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [fetchFleetData]);

  // Auto-dismiss toast
  useEffect(() => {
    if (notificationToast) {
      const timer = setTimeout(() => setNotificationToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationToast]);

  // Handlers for Authentication
  const handleLoginSuccess = (user: User, token: string, schoolData?: School) => {
    setAuthToken(token);
    setCurrentUser(user);
    if (schoolData) setSchool(schoolData);
    setNotificationToast({
      title: 'Welcome Back, ' + user.name.split(' ')[0],
      message: `Signed in as ${user.role.replace('_', ' ')} (${user.email})`,
      type: 'info',
    });
    fetchFleetData();
  };

  const handleSignOut = () => {
    localStorage.removeItem('crlk_auth_token');
    localStorage.removeItem('crlk_auth_user');
    setAuthToken(null);
    setNotificationToast({
      title: 'Signed Out',
      message: 'You have been signed out of ClassroomLock.',
      type: 'info',
    });
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('crlk_auth_user', JSON.stringify(user));
    setNotificationToast({
      title: 'User Context Switched',
      message: `Now viewing as ${user.name} (${user.role.replace('_', ' ')})`,
      type: 'info',
    });
  };

  // Handlers for Teacher / Classroom Actions
  const handleStartClassroomSession = async (
    classroomId: string,
    policyId: string,
    durationMinutes: number,
    temporaryUrls?: string[]
  ) => {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyId,
          durationMinutes,
          teacherId: currentUser.id,
          teacherName: currentUser.name,
          temporaryUrls,
        }),
      });
      if (res.ok) {
        await fetchFleetData();
        setNotificationToast({
          title: 'Classroom Session Started',
          message: `Interactive screens locked to lesson policy.`,
          type: 'info',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndClassroomSession = async (classroomId: string) => {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/end-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
        }),
      });
      if (res.ok) {
        await fetchFleetData();
        setNotificationToast({
          title: 'Classroom Session Ended',
          message: `Screens returned to standby.`,
          type: 'info',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Device Specific Actions
  const handleStartDeviceMode = async (deviceId: string, policyId?: string) => {
    try {
      const targetPolicyId = policyId || policies[0]?.id;
      const res = await fetch(`/api/devices/${deviceId}/start-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId: targetPolicyId }),
      });
      if (res.ok) {
        await fetchFleetData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndDeviceMode = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/end-mode`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchFleetData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncDevice = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/sync`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchFleetData();
        setNotificationToast({
          title: 'Policy Synchronized',
          message: `Fresh AppLocker & Chrome policy deployed to device.`,
          type: 'info',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncAllDevices = async () => {
    try {
      const res = await fetch('/api/devices/live-ping-all', {
        method: 'POST',
      });
      if (res.ok) {
        await fetchFleetData();
        setNotificationToast({
          title: 'Fleet Synchronization Complete',
          message: `All connected classroom displays received live ping and updated policy.`,
          type: 'info',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmergencyUnlock = async (deviceId: string, code: string, reason: string) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/emergency-unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          reason,
          unlockedBy: currentUser.name,
        }),
      });
      if (res.ok) {
        await fetchFleetData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePolicy = async (updatedPolicy: Partial<Policy>) => {
    try {
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPolicy),
      });
      if (res.ok) {
        await fetchFleetData();
        setNotificationToast({
          title: 'Policy Saved & Deployed',
          message: `Rule definition "${updatedPolicy.name}" updated.`,
          type: 'info',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateEnrollmentToken = async (classroomId: string): Promise<string> => {
    const res = await fetch('/api/enrollment-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classroomId, schoolId: school?.id }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.token;
    }
    return 'NAVODAYA-ENROLL-' + Math.floor(100000 + Math.random() * 900000);
  };

  const handleUpdateSchool = async (updated: Partial<School>) => {
    try {
      const res = await fetch('/api/school', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        await fetchFleetData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDemoData = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        await fetchFleetData();
        setNotificationToast({
          title: 'Demo State Reset',
          message: 'Fleet restored to standard sample state.',
          type: 'info',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerTestIncident = async () => {
    const targetDev = devices[0];
    if (!targetDev) return;
    try {
      await fetch('/api/simulate-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: targetDev.id,
          type: 'policy_violation_app',
          details: `Blocked execution: Discord.exe (Parent: explorer.exe, Hash: 8f9b4c...) on ${targetDev.name}`,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // If user is not authenticated, show Login View
  if (!authToken) {
    return <LoginView onLoginSuccess={handleLoginSuccess} schoolInfo={school} />;
  }

  if (isLoading || !school) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 animate-spin flex items-center justify-center mb-3">
          <div className="h-4 w-4 bg-emerald-400 rounded-sm" />
        </div>
        <div className="text-sm font-bold text-white tracking-wide">Connecting to School Fleet...</div>
      </div>
    );
  }

  const activeSmartVisionSimDevice = selectedDeviceForSim || devices.find(d => d.hardwareType === 'smartvision_ops') || devices[0];
  const simClassroom = classrooms.find(c => c.id === activeSmartVisionSimDevice?.classroomId) || classrooms[0];
  const simPolicy = policies.find(p => p.id === activeSmartVisionSimDevice?.currentPolicyId) || policies[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Toast Notification Banner */}
      {notificationToast && (
        <div className="fixed bottom-5 right-5 z-80 max-w-md animate-in slide-in-from-bottom-5">
          <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 ${
            notificationToast.type === 'critical'
              ? 'bg-rose-950/95 border-rose-500 text-rose-200'
              : notificationToast.type === 'warning'
              ? 'bg-amber-950/95 border-amber-500 text-amber-200'
              : 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
          }`}>
            <div className="flex-1">
              <div className="font-bold text-xs">{notificationToast.title}</div>
              <div className="text-[11px] mt-0.5 opacity-90">{notificationToast.message}</div>
            </div>
            <button
              onClick={() => setNotificationToast(null)}
              className="text-xs opacity-70 hover:opacity-100 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main App Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        availableUsers={users.length > 0 ? users : undefined}
        onSwitchUser={handleSwitchUser}
        onSignOut={handleSignOut}
        school={school}
        devices={devices}
        onOpenArtifactsModal={() => setShowArtifactsModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'teacher' && (
          <TeacherPortalView
            currentUser={currentUser}
            classrooms={classrooms}
            policies={policies}
            devices={devices}
            onStartClassSession={handleStartClassroomSession}
            onEndClassSession={handleEndClassroomSession}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            school={school}
            classrooms={classrooms}
            devices={devices}
            policies={policies}
            auditLogs={auditLogs}
            onNavigateTo={setActiveTab}
            onStartClassSession={handleStartClassroomSession}
            onEndClassSession={handleEndClassroomSession}
            onOpenSimulator={(device) => setSelectedDeviceForSim(device)}
          />
        )}

        {activeTab === 'classrooms' && (
          <ClassroomsView
            classrooms={classrooms}
            devices={devices}
            policies={policies}
            school={school}
            currentUser={currentUser}
            onStartClassSession={handleStartClassroomSession}
            onEndClassSession={handleEndClassroomSession}
            onOpenSimulator={(device) => setSelectedDeviceForSim(device)}
          />
        )}

        {activeTab === 'devices' && (
          <DevicesView
            devices={devices}
            classrooms={classrooms}
            policies={policies}
            school={school}
            onSelectDevice={(device) => setSelectedDeviceForDetail(device)}
            onStartDeviceMode={handleStartDeviceMode}
            onEndDeviceMode={handleEndDeviceMode}
            onSyncDevice={handleSyncDevice}
            onSyncAllDevices={handleSyncAllDevices}
            onGenerateEnrollmentToken={handleGenerateEnrollmentToken}
            onOpenArtifactsModal={() => setShowArtifactsModal(true)}
          />
        )}

        {activeTab === 'policies' && (
          <PoliciesView
            policies={policies}
            school={school}
            onSavePolicy={handleSavePolicy}
          />
        )}

        {activeTab === 'audit-logs' && (
          <AuditLogsView
            auditLogs={auditLogs}
            school={school}
            classrooms={classrooms}
            devices={devices}
            onTriggerTestIncident={handleTriggerTestIncident}
          />
        )}

        {activeTab === 'setup-guide' && (
          <SetupGuideView
            school={school}
            onOpenArtifactsModal={() => setShowArtifactsModal(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            school={school}
            classrooms={classrooms}
            devices={devices}
            policies={policies}
            apiKeys={apiKeys}
            users={users}
            currentUser={currentUser}
            onUpdateSchool={handleUpdateSchool}
            onResetDemoData={handleResetDemoData}
            onGenerateEnrollmentToken={handleGenerateEnrollmentToken}
            onOpenArtifactsModal={() => setShowArtifactsModal(true)}
            onRefreshFleet={fetchFleetData}
          />
        )}
      </main>

      {/* Global Application Footer with Creator Tribute */}
      <footer className="border-t border-slate-850 bg-slate-900/90 text-slate-400 text-xs py-4 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">ClassroomLock</span>
            <span className="text-slate-600">|</span>
            <span>School Device Management SaaS for Windows 11 & SmartVision OPS</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center text-xs">
            <span className="text-slate-400">Made by</span>
            <span className="font-bold text-emerald-400">Navodayan</span>
            <span className="text-slate-400">for</span>
            <span className="font-semibold text-white">Navodayan</span>
            <span className="text-slate-500">•</span>
            <span className="font-bold text-amber-300">Aditya Kumar Mohanani</span>
            <span className="text-emerald-400/90 font-medium">9th JNV Burhanpur</span>
          </div>
        </div>
      </footer>

      {/* Device Detailed Inspection Modal */}
      {selectedDeviceForDetail && (
        <DeviceDetailModal
          device={selectedDeviceForDetail}
          policies={policies}
          school={school}
          auditLogs={auditLogs}
          onClose={() => setSelectedDeviceForDetail(null)}
          onStartMode={handleStartDeviceMode}
          onEndMode={handleEndDeviceMode}
          onSync={handleSyncDevice}
          onEmergencyUnlock={handleEmergencyUnlock}
          onSimulateAppBlock={async (deviceId, appName) => {
            await fetch('/api/simulate-incident', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                deviceId,
                type: 'policy_violation_app',
                details: `AppLocker blocked unauthorized launch: ${appName} on ${selectedDeviceForDetail.name}`,
              }),
            });
            fetchFleetData();
          }}
          onSimulateDomainBlock={async (deviceId, domain) => {
            await fetch('/api/simulate-incident', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                deviceId,
                type: 'policy_violation_web',
                details: `Google Chrome blocked access to prohibited domain: ${domain} on ${selectedDeviceForDetail.name}`,
              }),
            });
            fetchFleetData();
          }}
        />
      )}

      {/* SmartVision 4K Interactive Board Simulator Modal */}
      {selectedDeviceForSim && (
        <SmartVisionSimulatorModal
          device={selectedDeviceForSim}
          classroom={simClassroom}
          policy={simPolicy}
          onClose={() => setSelectedDeviceForSim(null)}
          onRecordViolation={async (type, detail) => {
            await fetch('/api/simulate-incident', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                deviceId: selectedDeviceForSim.id,
                type,
                details: detail,
              }),
            });
            fetchFleetData();
          }}
          onEmergencyUnlockSuccess={async () => {
            await handleEndDeviceMode(selectedDeviceForSim.id);
            setNotificationToast({
              title: 'Emergency Unlock Successful',
              message: 'Local PIN verified. Board returned to normal standby.',
              type: 'info',
            });
          }}
        />
      )}

      {/* Agent C# / WiX / Architecture Artifacts Modal */}
      {showArtifactsModal && (
        <AgentArtifactsModal 
          onClose={() => setShowArtifactsModal(false)}
          devices={devices}
          classrooms={classrooms}
          policies={policies}
          school={school}
          onSyncAllDevices={handleSyncAllDevices}
        />
      )}
    </div>
  );
}
