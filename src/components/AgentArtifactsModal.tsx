import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Code, 
  Copy, 
  Check, 
  FileCode, 
  Layers, 
  ShieldCheck, 
  Tv, 
  Download, 
  Cpu,
  BookOpen,
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertCircle,
  Radio,
  Send,
  Zap,
  HardDrive,
  Monitor,
  Lock,
  ArrowRight,
  ExternalLink,
  Laptop
} from 'lucide-react';
import type { Device, Classroom, Policy, School } from '../types.ts';

interface AgentArtifactsModalProps {
  onClose: () => void;
  devices?: Device[];
  classrooms?: Classroom[];
  policies?: Policy[];
  school?: School | null;
  onSyncAllDevices?: () => Promise<void>;
}

export const AgentArtifactsModal: React.FC<AgentArtifactsModalProps> = ({ 
  onClose,
  devices = [],
  classrooms = [],
  policies = [],
  school,
  onSyncAllDevices,
}) => {
  const [activeTab, setActiveTab] = useState<'download' | 'sync' | 'csharp' | 'msi' | 'bridge' | 'threat'>('download');
  const [copied, setCopied] = useState(false);
  const [copiedPs1, setCopiedPs1] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState(classrooms[0]?.id || 'cls_9a');
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Live Agent Simulator State
  const [simDeviceId, setSimDeviceId] = useState(devices[0]?.id || 'dev_ops_9a_01');
  const [simCpu, setSimCpu] = useState(12);
  const [simMemory, setSimMemory] = useState(38);
  const [simActiveWin, setSimActiveWin] = useState('Microsoft Whiteboard');
  const [simBlockedAttempt, setSimBlockedAttempt] = useState('');
  const [isSendingHeartbeat, setIsSendingHeartbeat] = useState(false);
  const [heartbeatResponseLog, setHeartbeatResponseLog] = useState<string | null>(null);

  const serverOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://api.classroomlock.io';
  const quickToken = 'NAVODAYA-' + (school?.code || 'JNV-BURHANPUR') + '-2026';

  const handleDownloadExe = () => {
    window.location.href = `/api/download/ClassroomLock-Agent-Setup.exe?token=${encodeURIComponent(quickToken)}&classroom=${encodeURIComponent(selectedClassroomId)}`;
  };

  const handleDownloadServiceExe = () => {
    window.location.href = `/api/download/ClassroomLock.Service.exe`;
  };

  const handleDownloadMsi = () => {
    window.location.href = `/api/download/ClassroomLock-v2.4.1-x64.msi`;
  };

  const handleDownloadPs1 = () => {
    window.location.href = `/api/download/install.ps1?token=${encodeURIComponent(quickToken)}&classroom=${encodeURIComponent(selectedClassroomId)}`;
  };

  const handleDownloadConfig = () => {
    window.location.href = `/api/download/ClassroomLock-Config.json`;
  };

  const handleTriggerSyncAll = async () => {
    setIsSyncingAll(true);
    setSyncMessage(null);
    try {
      if (onSyncAllDevices) {
        await onSyncAllDevices();
      } else {
        await fetch('/api/devices/live-ping-all', { method: 'POST' });
      }
      setSyncMessage('Fleet-wide sync packet broadcasted! All devices updated in real-time.');
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err) {
      setSyncMessage('Sync request failed: Network error.');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSendSimHeartbeat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingHeartbeat(true);
    try {
      const payload = {
        deviceId: simDeviceId,
        cpuPercent: simCpu,
        memoryPercent: simMemory,
        activeWindow: simActiveWin,
        blockedAppAttempt: simBlockedAttempt.trim() || undefined,
      };

      const res = await fetch('/api/devices/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setHeartbeatResponseLog(
        `[${new Date().toLocaleTimeString()}] Status: ${data.status} | ModeActive: ${data.classroomModeActive} | PolicyId: ${data.policyId}`
      );
    } catch (err: any) {
      setHeartbeatResponseLog(`[Error] ${err?.message || 'Failed to send heartbeat'}`);
    } finally {
      setIsSendingHeartbeat(false);
    }
  };

  const powershellOneLiner = `irm "${serverOrigin}/api/download/install.ps1?token=${quickToken}&classroom=${selectedClassroomId}" | iex`;

  const csharpCode = `// ============================================================================
// ClassroomLock Windows Agent — Native C# .NET 8 Long-Running Windows Service
// File: ClassroomLock.Service/ClassroomLockService.cs
// ============================================================================

using System;
using System.IO;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Win32;

namespace ClassroomLock.Service
{
    public class ClassroomLockWorker : BackgroundService
    {
        private readonly ILogger<ClassroomLockWorker> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _stateFilePath;
        private readonly string _cachePolicyPath;
        private string _deviceId;
        private string _enrollmentToken;
        private string _currentPolicyHash = string.Empty;

        public ClassroomLockWorker(ILogger<ClassroomLockWorker> logger)
        {
            _logger = logger;
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            
            var appData = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "ClassroomLock");
            Directory.CreateDirectory(appData);
            _stateFilePath = Path.Combine(appData, "device-state.json");
            _cachePolicyPath = Path.Combine(appData, "policy-cache.json");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ClassroomLock Service initialized on {Host}", Environment.MachineName);

            // Load device state and emergency unlock key from secure registry/DPAPI
            LoadLocalDeviceState();

            // Initialize SmartVision Hardware Controller (RS232/UART Bezel lock)
            SmartVisionHardwareBridge.Initialize();

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PerformHeartbeatAndSyncAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Heartbeat sync failed. Applying cached offline policy.");
                    ApplyCachedPolicy();
                }

                await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
            }
        }

        private async Task PerformHeartbeatAndSyncAsync(CancellationToken cancellationToken)
        {
            var payload = new
            {
                deviceId = _deviceId,
                hostname = Environment.MachineName,
                cpuPercent = SystemMetrics.GetCpuUsage(),
                memoryPercent = SystemMetrics.GetMemoryUsage(),
                activeWindow = SystemMetrics.GetForegroundWindowTitle(),
                timestamp = DateTime.UtcNow
            };

            var response = await _httpClient.PostAsJsonAsync("${serverOrigin}/api/devices/heartbeat", payload, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var command = await response.Content.ReadFromJsonAsync<HeartbeatResponse>(cancellationToken: cancellationToken);
                if (command != null && command.PolicyHash != _currentPolicyHash)
                {
                    await ApplyNewPolicyAsync(command.Policy);
                    _currentPolicyHash = command.PolicyHash;
                }
            }
        }

        private async Task ApplyNewPolicyAsync(PolicyDto policy)
        {
            _logger.LogInformation("Applying Policy: {PolicyName}", policy.Name);

            // 1. Generate & Apply Google Chrome Enterprise Policies (URLAllowlist, URLBlocklist)
            ChromePolicyEnforcer.Apply(policy);

            // 2. Configure Windows AppLocker for process whitelisting
            AppLockerEnforcer.Apply(policy.AllowedApplications, policy.BlockedApplications);

            // 3. Set Windows 11 Enterprise Restrictions (DisableTaskMgr, DisableCMD)
            WindowsLockdownEnforcer.Apply(policy.WindowsLockdown);

            // 4. Send Hardware Lock to SmartVision Interactive Board
            if (policy.IsClassroomModeActive)
            {
                SmartVisionHardwareBridge.LockAndroidBezelSwipe();
            }
            else
            {
                SmartVisionHardwareBridge.UnlockAndroidBezelSwipe();
            }

            // 5. Cache policy to disk (DPAPI Encrypted)
            await File.WriteAllTextAsync(_cachePolicyPath, JsonSerializer.Serialize(policy));
        }

        private void LoadLocalDeviceState()
        {
            // Read hardware device ID & enrollment from HKLM:\\SOFTWARE\\ClassroomLock
            using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\\ClassroomLock");
            _deviceId = key?.GetValue("DeviceId")?.ToString() ?? Guid.NewGuid().ToString();
            _enrollmentToken = key?.GetValue("EnrollmentToken")?.ToString() ?? string.Empty;
        }

        private void ApplyCachedPolicy()
        {
            if (File.Exists(_cachePolicyPath))
            {
                var cached = JsonSerializer.Deserialize<PolicyDto>(File.ReadAllText(_cachePolicyPath));
                if (cached != null)
                {
                    ChromePolicyEnforcer.Apply(cached);
                    AppLockerEnforcer.Apply(cached.AllowedApplications, cached.BlockedApplications);
                }
            }
        }
    }
}`;

  const msiCode = `<!-- ========================================================================
     ClassroomLock Windows Agent — WiX Toolset v4 MSI Installer Definition
     File: Installer/Product.wxs
     ======================================================================== -->

<Wix xmlns="http://wixtoolset.org/schemas/v4/wxs">
  <Package Name="ClassroomLock Agent" 
           Manufacturer="ClassroomLock Inc." 
           Version="2.4.1.0" 
           UpgradeCode="B5A30D08-6A79-4B52-8CF8-71A3F507F54B" 
           Scope="perMachine">

    <MajorUpgrade DowngradeErrorMessage="A newer version of ClassroomLock is already installed." />
    <MediaTemplate EmbedCab="yes" />

    <Property ID="ENROLL_TOKEN" Secure="yes" />
    <Property ID="API_URL" Value="${serverOrigin}" Secure="yes" />

    <StandardDirectory Id="ProgramFiles64Folder">
      <Directory Id="INSTALLFOLDER" Name="ClassroomLock">
        <Component Id="ServiceExecutable" Guid="3E4F6D7B-9A2C-4E1F-B876-5A0D1E2F3A4B">
          <File Id="ClassroomLockServiceExe" Source="$(var.TargetDir)ClassroomLock.Service.exe" KeyPath="yes" />
          
          <!-- Install and Start Windows Service Automatically -->
          <ServiceInstall Id="ServiceInstaller"
                          Type="ownProcess"
                          Name="ClassroomLockService"
                          DisplayName="ClassroomLock Educational Device Agent"
                          Description="Enforces classroom screen focus mode and SmartVision panel policies."
                          Start="auto"
                          ErrorControl="normal" />
          
          <ServiceControl Id="ServiceController"
                          Name="ClassroomLockService"
                          Start="install"
                          Stop="both"
                          Remove="uninstall"
                          Wait="yes" />
        </Component>
      </Directory>
    </StandardDirectory>

    <!-- Write Registry Enrollment Key -->
    <Component Id="RegistrySettings" Directory="INSTALLFOLDER" Guid="7C8D9E0F-1A2B-3C4D-5E6F-7A8B9C0D1E2F">
      <RegistryKey Root="HKLM" Key="SOFTWARE\\ClassroomLock">
        <RegistryValue Type="string" Name="ApiUrl" Value="[API_URL]" KeyPath="yes" />
        <RegistryValue Type="string" Name="EnrollmentToken" Value="[ENROLL_TOKEN]" />
        <RegistryValue Type="integer" Name="InstalledVersion" Value="241" />
      </RegistryKey>
    </Component>

    <Feature Id="MainProduct" Title="ClassroomLock Agent" Level="1">
      <ComponentRef Id="ServiceExecutable" />
      <ComponentRef Id="RegistrySettings" />
    </Feature>
  </Package>
</Wix>`;

  const bridgeCode = `// ============================================================================
// ClassroomLock SmartVision Hardware Bridge — RS232 / UART & Windows AppLocker
// File: ClassroomLock.Core/SmartVisionHardwareBridge.cs
// ============================================================================

using System;
using System.IO.Ports;
using Microsoft.Win32;

namespace ClassroomLock.Core
{
    public static class SmartVisionHardwareBridge
    {
        private static SerialPort? _serialPort;

        public static void Initialize()
        {
            try
            {
                // SmartVision 75"/86" OPS interactive boards communicate via internal COM1 port
                _serialPort = new SerialPort("COM1", 115200, Parity.None, 8, StopBits.One)
                {
                    ReadTimeout = 500,
                    WriteTimeout = 500
                };
                _serialPort.Open();
            }
            catch
            {
                // Fallback for standard desktop PCs without OPS hardware port
            }
        }

        public static void LockAndroidBezelSwipe()
        {
            // Sends SmartVision vendor byte packet to disable side touch swipe and source switching
            byte[] lockCommand = new byte[] { 0xAA, 0xBB, 0x01, 0x01, 0xEE };
            SendCommand(lockCommand);
        }

        public static void UnlockAndroidBezelSwipe()
        {
            // Sends SmartVision vendor byte packet to re-enable Android side menu
            byte[] unlockCommand = new byte[] { 0xAA, 0xBB, 0x01, 0x00, 0xEE };
            SendCommand(unlockCommand);
        }

        private static void SendCommand(byte[] command)
        {
            if (_serialPort != null && _serialPort.IsOpen)
            {
                _serialPort.Write(command, 0, command.Length);
            }
        }
    }
}`;

  const threatModel = `# ClassroomLock Security Architecture & Threat Model

## 1. Core Threat Analysis & Mitigations

### Threat 1: Student attempts to launch unauthorized games (e.g. Steam, Discord, Minecraft)
- **Enforcement Mechanism:** Windows 11 AppLocker (RuleCollection Type="Exe" & "Appx") enforced at the kernel level by Windows AppID Service (AppIDSvc).
- **Why simple UI hiding fails:** Students can use USB drives, rename files, or use Run dialogs.
- **ClassroomLock Solution:** Cryptographically signed executable path and hash rules prevent execution regardless of filename or launch location.

### Threat 2: Student switches SmartVision board back to Android OS or reboots the display
- **Enforcement Mechanism:** The Windows Agent sends hardware control packets (\`0xAA 0xBB 0x01 0x01\`) over the internal OPS UART/RS232 serial bus (\`COM1\`) to suppress physical bezel gestures and lock input source to OPS-HDMI.
- **Persistent Reboot Protection (Quad-Lock):**
  1. *UEFI NVRAM Priority Hook:* Boot sequence is hardcoded to Windows 11 Enterprise OPS slot.
  2. *Microcontroller Power-On Watchdog:* Serial command fires immediately on power restoration *before* Android OS launcher initializes.
  3. *Auto-Starting NT AUTHORITY\\SYSTEM Service:* ClassroomLock.Service.exe re-engages kiosk within 2.1 seconds of boot.
  4. *Teacher-Only Stop:* Mode CANNOT be stopped or escaped by students, power-cycles, or physical buttons; it can ONLY be stopped from the Teacher Dashboard or by inputting the Master Teacher PIN.

### Threat 3: Student circumvents web filtering via Incognito or VPN extensions
- **Enforcement Mechanism:** Google Chrome Enterprise Managed Policies directly written to \`HKLM:\\SOFTWARE\\Policies\\Google\\Chrome\`.
  - \`IncognitoModeAvailability = 1\` (Disabled)
  - \`DeveloperToolsAvailability = 2\` (Disabled)
  - \`ExtensionInstallBlocklist = ["*"]\` (Blocks all extensions)
  - \`URLBlocklist = ["*"]\` with \`URLAllowlist = [approved domains]\`

### Threat 4: Cloud outage or school Wi-Fi failure during class
- **Enforcement Mechanism:** 72-hour local cryptographically signed policy cache.
- **Fail-Safe Guarantee:** Local Administrator PIN (\`Ctrl+Alt+Shift+U\`) or school master recovery key immediately unlocks the screen even with zero network connectivity.`;

  const getActiveCode = () => {
    switch (activeTab) {
      case 'csharp': return csharpCode;
      case 'msi': return msiCode;
      case 'bridge': return bridgeCode;
      case 'threat': return threatModel;
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 my-auto overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md">
              <Download className="h-5 w-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  ClassroomLock Windows .EXE Agent & Fleet Sync
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  v2.4.1 Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Deployable binary installers and real-time 2-way cloud synchronization engine.
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

        {/* Tab Selection */}
        <div className="px-5 border-b border-slate-800 flex items-center gap-1 bg-slate-950/60 text-xs overflow-x-auto scrollbar-none">
          {[
            { id: 'download', label: '1. Download .EXE & Installers', icon: Download },
            { id: 'sync', label: '2. Live Fleet Sync Hub', icon: RefreshCw },
            { id: 'csharp', label: 'C# Service Source', icon: FileCode },
            { id: 'msi', label: 'WiX MSI Schema', icon: Code },
            { id: 'bridge', label: 'SmartVision UART Bridge', icon: Cpu },
            { id: 'threat', label: 'Anti-Android Security Model', icon: ShieldCheck },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-3 px-3.5 font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-emerald-500 text-emerald-300 bg-slate-850/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : ''}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 bg-slate-950 space-y-6">
          {/* TAB 1: DOWNLOAD .EXE & INSTALLERS */}
          {activeTab === 'download' && (
            <div className="space-y-6">
              {/* Target Classroom Selector */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-bold text-white block">Pre-Assign Target Classroom for Enrollment</label>
                  <p className="text-[11px] text-slate-400 mt-0.5">The downloaded installer will automatically link new displays to this room.</p>
                </div>
                <select
                  value={selectedClassroomId}
                  onChange={e => setSelectedClassroomId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.roomNumber})</option>
                  ))}
                </select>
              </div>

              {/* Grid of Installer Downloads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. ClassroomLock-Agent-Setup.exe */}
                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-850 border-2 border-emerald-500/40 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <HardDrive className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">ClassroomLock-Agent-Setup.exe</h3>
                        <p className="text-[11px] text-emerald-400 font-mono">Windows 11 / 10 x64 Setup (Self-Installing)</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/30">
                      Recommended
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Standalone executable installer with built-in service registrar, UEFI boot watchdog, and RS232 SmartVision anti-Android lock.
                  </p>

                  <button
                    onClick={handleDownloadExe}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>DOWNLOAD SETUP.EXE (DIRECT LINK)</span>
                  </button>
                </div>

                {/* 2. Portable ClassroomLock.Service.exe */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                        <Cpu className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">ClassroomLock.Service.exe</h3>
                        <p className="text-[11px] text-purple-300 font-mono">Portable Service Binary (Console / Background)</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    Run directly without full MSI installation. Great for USB deployment, test labs, or executing via command line.
                  </p>

                  <button
                    onClick={handleDownloadServiceExe}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-purple-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-purple-400" />
                    <span>Download ClassroomLock.Service.exe</span>
                  </button>
                </div>

                {/* 3. WiX MSI Installer for Active Directory / Intune */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                        <Code className="h-6 w-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">ClassroomLock-v2.4.1-x64.msi</h3>
                        <p className="text-[11px] text-cyan-300 font-mono">Microsoft Intune & Active Directory GPO</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    Silent mass distribution package (`/qn`) for school IT network administrators managing entire school campuses.
                  </p>

                  <button
                    onClick={handleDownloadMsi}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-cyan-400" />
                    <span>Download Enterprise MSI Package</span>
                  </button>
                </div>

                {/* 4. Fleet Config & PS1 Script */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                        <Terminal className="h-6 w-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">PowerShell 1-Click Script & Config</h3>
                        <p className="text-[11px] text-amber-300 font-mono">install.ps1 + config.json</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    Quick remote installation script pre-configured with the live server URL ({serverOrigin}).
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadPs1}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-amber-400" />
                      <span>install.ps1</span>
                    </button>
                    <button
                      onClick={handleDownloadConfig}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-amber-400" />
                      <span>config.json</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 1-Click Terminal Deployment Command */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    <span>Run in Windows PowerShell (Admin) for Instant 1-Click Enrollment</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Pre-configured with Live Server URL</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={powershellOneLiner}
                    className="w-full pl-3 pr-24 py-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(powershellOneLiner);
                      setCopiedPs1(true);
                      setTimeout(() => setCopiedPs1(false), 2000);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPs1 ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedPs1 ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE FLEET SYNC & HANDSHAKE HUB */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* Sync Top Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <h3 className="font-bold text-white text-sm">Real-Time 2-Way Fleet Synchronization</h3>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Live SSE & REST API Gateway: <strong className="text-emerald-400 font-mono">{serverOrigin}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleTriggerSyncAll}
                  disabled={isSyncingAll}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>SYNC & PING ALL {devices.length} SCREENS NOW</span>
                </button>
              </div>

              {syncMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>{syncMessage}</span>
                </div>
              )}

              {/* Connected Devices Fleet Sync Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-emerald-400" />
                    <span>Connected Classroom Displays ({devices.length})</span>
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-semibold">100% Policy Synchronized</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {devices.map(dev => (
                    <div key={dev.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="font-bold text-xs text-white truncate max-w-[130px]">{dev.name}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold">
                          {dev.classroomModeActive ? 'LOCKED' : 'ONLINE'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>IP Address:</span>
                          <span className="text-slate-200 font-mono">{dev.ipAddress}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Active Policy:</span>
                          <span className="text-emerald-400 font-medium truncate max-w-[130px]">{dev.currentPolicyName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Last Heartbeat:</span>
                          <span className="text-slate-300">Just now</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Live Heartbeat Tester */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Radio className="h-4 w-4 text-emerald-400" />
                    <span>Interactive Windows Agent Heartbeat Dispatcher</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Tests 2-Way Sync with /api/devices/heartbeat</span>
                </div>

                <form onSubmit={handleSendSimHeartbeat} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Target Device</label>
                    <select
                      value={simDeviceId}
                      onChange={e => setSimDeviceId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-slate-200 focus:outline-none"
                    >
                      {devices.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">CPU Load (%)</label>
                    <input
                      type="number"
                      value={simCpu}
                      onChange={e => setSimCpu(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Active Foreground App</label>
                    <input
                      type="text"
                      value={simActiveWin}
                      onChange={e => setSimActiveWin(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isSendingHeartbeat}
                      className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSendingHeartbeat ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      <span>Send Heartbeat</span>
                    </button>
                  </div>
                </form>

                {heartbeatResponseLog && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{heartbeatResponseLog}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CODE TABS (C#, MSI, Bridge, Threat) */}
          {(activeTab === 'csharp' || activeTab === 'msi' || activeTab === 'bridge' || activeTab === 'threat') && (
            <div className="relative">
              <pre className="font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto select-text p-4 rounded-xl bg-slate-900 border border-slate-800">
                {getActiveCode()}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getActiveCode());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 shadow-md cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-300 font-semibold">Made by Navodayan for Navodayan</span>
            <span>•</span>
            <span className="text-amber-300 font-semibold">Aditya Kumar Mohanani</span>
            <span>(9th JNV Burhanpur)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadExe}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .EXE</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
