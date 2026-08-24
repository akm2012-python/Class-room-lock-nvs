import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  PenTool, 
  Globe, 
  Tv, 
  Terminal, 
  Code, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Edit3, 
  Trash2,
  Lock,
  Sparkles
} from 'lucide-react';
import type { Policy, School } from '../types.ts';
import { PolicyBuilderModal } from './PolicyBuilderModal.tsx';

interface PoliciesViewProps {
  policies: Policy[];
  school: School;
  onSavePolicy: (policy: Partial<Policy>) => Promise<void>;
  onDeletePolicy?: (policyId: string) => Promise<void>;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  policies,
  school,
  onSavePolicy,
  onDeletePolicy,
}) => {
  const [selectedPolicyForEdit, setSelectedPolicyForEdit] = useState<Policy | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exportModalPolicy, setExportModalPolicy] = useState<Policy | null>(null);
  const [exportFormat, setExportFormat] = useState<'chrome' | 'applocker' | 'registry' | 'powershell'>('chrome');
  const [copiedExport, setCopiedExport] = useState(false);

  // Helper to generate export strings on the client for instant inspection
  const getExportText = (policy: Policy, format: string) => {
    if (format === 'chrome') {
      const allowlist = policy.websites.mode === 'allowlist'
        ? policy.websites.allowedDomains.map(d => `*://${d.domain}/*`)
        : ['*'];
      if (policy.youtube.mode === 'approved_only') {
        allowlist.push('*://www.youtube.com/embed/*');
        policy.youtube.approvedChannels.forEach(c => allowlist.push(`*://www.youtube.com/channel/${c.channelId}*`));
        policy.youtube.approvedVideos.forEach(v => allowlist.push(`*://www.youtube.com/watch?v=${v.videoId}*`));
      }
      return JSON.stringify({
        URLBlocklist: policy.websites.mode === 'allowlist' ? ['*'] : policy.websites.blockedDomains.map(d => `*://${d.domain}/*`),
        URLAllowlist: allowlist,
        ForceYouTubeRestrict: policy.youtube.moderateLevel === 'strict' ? 2 : 0,
        HomepageLocation: policy.windowsLockdown.chromeHomeUrl || 'https://khanacademy.org',
        DownloadRestrictions: policy.windowsLockdown.blockArbitraryDownloads ? 3 : 0,
        DeveloperToolsAvailability: 2,
        IncognitoModeAvailability: 1,
      }, null, 2);
    }
    if (format === 'applocker') {
      return `<!-- Windows 11 AppLocker XML Enforcement Rule -->
<AppLockerPolicy Version="1">
  <RuleCollection Type="Exe" EnforcementMode="Enabled">
    ${policy.applications.allowlist.filter(a => a.type === 'exe_path').map(a => `
    <FilePathRule Id="${a.id}" Name="Allow: ${a.name}" UserOrGroupSid="S-1-1-0" Action="Allow">
      <FilePathCondition Path="${a.target}" />
    </FilePathRule>`).join('')}
    ${policy.applications.blocklist.map(b => `
    <FilePathRule Id="${b.id}" Name="Deny: ${b.name}" UserOrGroupSid="S-1-1-0" Action="Deny">
      <FilePathCondition Path="*\\${b.target}" />
    </FilePathRule>`).join('')}
  </RuleCollection>
</AppLockerPolicy>`;
    }
    if (format === 'registry') {
      return `Windows Registry Editor Version 5.00
; Policy: ${policy.name}

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System]
"DisableTaskMgr"=${policy.windowsLockdown.disableTaskManager ? 'dword:00000001' : 'dword:00000000'}

[HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows\\System]
"DisableCMD"=${policy.windowsLockdown.disableCommandPrompt ? 'dword:00000002' : 'dword:00000000'}
"DisableRegistryTools"=${policy.windowsLockdown.disableRegistryTools ? 'dword:00000001' : 'dword:00000000'}
`;
    }
    return `# PowerShell Enforcer Script for Policy ${policy.name}
Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" -Name "DisableTaskMgr" -Value ${policy.windowsLockdown.disableTaskManager ? 1 : 0}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <span>Policy Studio & Rule Builder</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Design fine-grained educational policies with application allowlists, strict Chrome website filters, and granular YouTube channel rules.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedPolicyForEdit(null);
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Policy</span>
        </button>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {policies.map(policy => (
          <div
            key={policy.id}
            className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between shadow-xl space-y-5"
          >
            <div className="space-y-4">
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{policy.name}</h2>
                    {policy.isDefault && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">Version v{policy.version}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {policy.description}
              </p>

              {/* Policy Highlights Summary */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                {/* Applications */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <PenTool className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Applications:</span>
                  </span>
                  <span className="font-semibold text-slate-200">
                    {policy.applications.allowlist.length} Allowed • {policy.applications.blocklist.length} Blocked
                  </span>
                </div>

                {/* Websites */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Website Filter:</span>
                  </span>
                  <span className="font-semibold text-emerald-300 uppercase text-[11px]">
                    {policy.websites.mode} ({policy.websites.allowedDomains.length} domains)
                  </span>
                </div>

                {/* YouTube */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Tv className="h-3.5 w-3.5 text-emerald-400" />
                    <span>YouTube Mode:</span>
                  </span>
                  <span className="font-semibold text-slate-200 capitalize">
                    {policy.youtube.mode.replace('_', ' ')}
                  </span>
                </div>

                {/* Windows Lockdown */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Windows Guard:</span>
                  </span>
                  <span className="font-semibold text-slate-200">
                    TaskMgr & Cmd Disabled
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setExportModalPolicy(policy)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Code className="h-3.5 w-3.5 text-emerald-400" />
                <span>Inspect Config</span>
              </button>

              <button
                onClick={() => {
                  setSelectedPolicyForEdit(policy);
                  setShowCreateModal(true);
                }}
                className="px-4 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Policy</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Policy Builder / Edit Modal */}
      {showCreateModal && (
        <PolicyBuilderModal
          policy={selectedPolicyForEdit}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedPolicyForEdit(null);
          }}
          onSave={async (p) => {
            await onSavePolicy(p);
            setShowCreateModal(false);
            setSelectedPolicyForEdit(null);
          }}
        />
      )}

      {/* Export / Inspector Modal for Chrome Policies, AppLocker, Registry */}
      {exportModalPolicy && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code className="h-5 w-5 text-emerald-400" />
                  <span>Enforcement Payload: {exportModalPolicy.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generated Windows 11 Enterprise management configurations deployed by ClassroomLock.Service.
                </p>
              </div>
              <button
                onClick={() => setExportModalPolicy(null)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Format Selector Tabs */}
            <div className="flex items-center gap-2 text-xs">
              {[
                { id: 'chrome', label: 'Chrome Enterprise policy.json' },
                { id: 'applocker', label: 'Windows AppLocker XML' },
                { id: 'registry', label: 'Windows Registry .REG' },
                { id: 'powershell', label: 'PowerShell Enforcer' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setExportFormat(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
                    exportFormat === tab.id
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Viewer Box */}
            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-72 leading-relaxed">
                {getExportText(exportModalPolicy, exportFormat)}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getExportText(exportModalPolicy, exportFormat));
                  setCopiedExport(true);
                  setTimeout(() => setCopiedExport(false), 2000);
                }}
                className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer border border-slate-700 shadow-md"
              >
                {copiedExport ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedExport ? 'Copied' : 'Copy Payload'}</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setExportModalPolicy(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
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
