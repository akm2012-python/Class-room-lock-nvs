import React, { useState } from 'react';
import { 
  ShieldCheck, 
  PenTool, 
  Globe, 
  Tv, 
  Lock, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Layers, 
  Sparkles,
  Info
} from 'lucide-react';
import type { Policy, AppRuleItem, WebDomainItem, YouTubeChannelItem, YouTubeVideoItem } from '../types.ts';

interface PolicyBuilderModalProps {
  policy: Policy | null;
  onClose: () => void;
  onSave: (policy: Partial<Policy>) => Promise<void>;
}

export const PolicyBuilderModal: React.FC<PolicyBuilderModalProps> = ({
  policy,
  onClose,
  onSave,
}) => {
  const [activeSection, setActiveSection] = useState<'basics' | 'apps' | 'websites' | 'youtube' | 'windows' | 'safety'>('basics');
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState(policy?.name || 'New Custom Classroom Policy');
  const [description, setDescription] = useState(
    policy?.description || 'Custom allowlist and lockdown configuration for interactive SmartVision boards.'
  );
  const [isDefault, setIsDefault] = useState(policy?.isDefault || false);

  // Applications
  const [allowedApps, setAllowedApps] = useState<AppRuleItem[]>(
    policy?.applications.allowlist || [
      { id: 'app_1', name: 'Microsoft Whiteboard', type: 'uwp_package', target: 'Microsoft.Whiteboard_8wekyb3d8bbwe', requiredForClass: true },
      { id: 'app_2', name: 'Google Chrome Browser', type: 'exe_path', target: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', requiredForClass: true },
    ]
  );
  const [customAppName, setCustomAppName] = useState('');
  const [customAppTarget, setCustomAppTarget] = useState('');
  const [customAppType, setCustomAppType] = useState<'exe_path' | 'uwp_package'>('exe_path');

  // Websites
  const [websiteMode, setWebsiteMode] = useState<'allowlist' | 'blocklist' | 'unrestricted'>(
    policy?.websites.mode || 'allowlist'
  );
  const [allowedDomains, setAllowedDomains] = useState<WebDomainItem[]>(
    policy?.websites.allowedDomains || [
      { domain: 'ncert.nic.in', description: 'NCERT Official Portal', wildcards: true },
      { domain: 'khanacademy.org', description: 'Khan Academy Lessons', wildcards: true },
      { domain: 'wikipedia.org', description: 'Wikipedia Encyclopedia', wildcards: true },
    ]
  );
  const [newDomain, setNewDomain] = useState('');
  const [newDomainDesc, setNewDomainDesc] = useState('');

  // YouTube
  const [youtubeMode, setYoutubeMode] = useState<'completely_blocked' | 'approved_only' | 'unrestricted'>(
    policy?.youtube.mode || 'approved_only'
  );
  const [youtubeModerate, setYoutubeModerate] = useState<'strict' | 'moderate' | 'none'>(
    policy?.youtube.moderateLevel || 'strict'
  );
  const [approvedChannels, setApprovedChannels] = useState<YouTubeChannelItem[]>(
    policy?.youtube.approvedChannels || [
      { id: 'ch_1', channelId: 'UCsooa4yRKGN_zEE8iknghZA', title: 'TED-Ed Lessons', handle: '@TEDEd' },
      { id: 'ch_2', channelId: 'UC6107grRI4m0o2-emgoDnAA', title: 'SmarterEveryDay', handle: '@smartereveryday' },
    ]
  );
  const [newChannelTitle, setNewChannelTitle] = useState('');
  const [newChannelId, setNewChannelId] = useState('');
  const [newChannelHandle, setNewChannelHandle] = useState('');

  const [approvedVideos, setApprovedVideos] = useState<YouTubeVideoItem[]>(
    policy?.youtube.approvedVideos || [
      { id: 'vd_1', videoId: 'heWDp_Hsw7c', title: 'Physics Lab Experiment Demonstration' },
    ]
  );
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoId, setNewVideoId] = useState('');

  // Windows Lockdown Toggles
  const [disableSettings, setDisableSettings] = useState(policy?.windowsLockdown.disableSettingsApp ?? true);
  const [disableTaskMgr, setDisableTaskMgr] = useState(policy?.windowsLockdown.disableTaskManager ?? true);
  const [disableCmd, setDisableCmd] = useState(policy?.windowsLockdown.disableCommandPrompt ?? true);
  const [disableRegistry, setDisableRegistry] = useState(policy?.windowsLockdown.disableRegistryTools ?? true);
  const [blockDownloads, setBlockDownloads] = useState(policy?.windowsLockdown.blockArbitraryDownloads ?? true);
  const [blockRemovableStorage, setBlockRemovableStorage] = useState(policy?.windowsLockdown.blockRemovableStorage ?? true);
  const [hideDesktop, setHideDesktop] = useState(policy?.windowsLockdown.hideDesktopIcons ?? true);
  const [autoLaunchChrome, setAutoLaunchChrome] = useState(policy?.windowsLockdown.autoLaunchChrome ?? true);
  const [chromeHomeUrl, setChromeHomeUrl] = useState(policy?.windowsLockdown.chromeHomeUrl || 'https://khanacademy.org');

  // Safety
  const [offlineGraceHours, setOfflineGraceHours] = useState(policy?.safety.offlineGraceHours || 72);
  const [fallbackOnFailure, setFallbackOnFailure] = useState(policy?.safety.fallbackToSafeDefaultOnFailure ?? true);

  // Common Presets
  const standardEducationalApps: Array<{ name: string; type: 'exe_path' | 'uwp_package'; target: string }> = [
    { name: 'Microsoft Whiteboard', type: 'uwp_package', target: 'Microsoft.Whiteboard_8wekyb3d8bbwe' },
    { name: 'Google Chrome', type: 'exe_path', target: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
    { name: 'Windows Calculator', type: 'uwp_package', target: 'Microsoft.WindowsCalculator_8wekyb3d8bbwe' },
    { name: 'GeoGebra Math', type: 'exe_path', target: 'C:\\Program Files\\GeoGebra\\GeoGebra.exe' },
    { name: 'Scratch 3 Desktop', type: 'exe_path', target: 'C:\\Program Files\\Scratch 3\\Scratch 3.exe' },
    { name: 'VS Code Editor', type: 'exe_path', target: 'C:\\Program Files\\Microsoft VS Code\\Code.exe' },
  ];

  const handleToggleStandardApp = (appPreset: typeof standardEducationalApps[0]) => {
    const existing = allowedApps.find(a => a.name === appPreset.name);
    if (existing) {
      setAllowedApps(allowedApps.filter(a => a.name !== appPreset.name));
    } else {
      setAllowedApps([...allowedApps, {
        id: 'app_' + Date.now() + Math.floor(Math.random() * 100),
        name: appPreset.name,
        type: appPreset.type,
        target: appPreset.target,
        requiredForClass: false,
      }]);
    }
  };

  const handleAddCustomApp = () => {
    if (!customAppName.trim() || !customAppTarget.trim()) return;
    setAllowedApps([...allowedApps, {
      id: 'app_custom_' + Date.now(),
      name: customAppName.trim(),
      type: customAppType,
      target: customAppTarget.trim(),
      requiredForClass: false,
    }]);
    setCustomAppName('');
    setCustomAppTarget('');
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    const cleanDomain = newDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    setAllowedDomains([...allowedDomains, {
      domain: cleanDomain,
      description: newDomainDesc.trim() || 'Educational resource',
      wildcards: true,
    }]);
    setNewDomain('');
    setNewDomainDesc('');
  };

  const handleAddChannel = () => {
    if (!newChannelTitle.trim() || !newChannelId.trim()) return;
    setApprovedChannels([...approvedChannels, {
      id: 'yt_ch_' + Date.now(),
      channelId: newChannelId.trim(),
      title: newChannelTitle.trim(),
      handle: newChannelHandle.trim() || '@channel',
    }]);
    setNewChannelTitle('');
    setNewChannelId('');
    setNewChannelHandle('');
  };

  const handleAddVideo = () => {
    if (!newVideoTitle.trim() || !newVideoId.trim()) return;
    let vId = newVideoId.trim();
    if (vId.includes('v=')) {
      vId = vId.split('v=')[1].split('&')[0];
    }
    setApprovedVideos([...approvedVideos, {
      id: 'yt_vd_' + Date.now(),
      videoId: vId,
      title: newVideoTitle.trim(),
    }]);
    setNewVideoTitle('');
    setNewVideoId('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Partial<Policy> = {
        id: policy?.id,
        name,
        description,
        isDefault,
        applications: {
          defaultAction: 'block_all_except_allowed',
          allowlist: allowedApps,
          blocklist: policy?.applications.blocklist || [
            { id: 'blk_1', name: 'Steam Client', target: 'steam.exe' },
            { id: 'blk_2', name: 'Discord', target: 'Discord.exe' },
          ],
        },
        websites: {
          mode: websiteMode,
          allowedDomains,
          blockedDomains: policy?.websites.blockedDomains || [],
        },
        youtube: {
          mode: youtubeMode,
          moderateLevel: youtubeModerate,
          approvedChannels,
          approvedVideos,
        },
        windowsLockdown: {
          disableSettingsApp: disableSettings,
          disableTaskManager: disableTaskMgr,
          disableCommandPrompt: disableCmd,
          disableRegistryTools: disableRegistry,
          blockArbitraryDownloads: blockDownloads,
          blockRemovableStorage: blockRemovableStorage,
          hideDesktopIcons: hideDesktop,
          forceWhiteboardKiosk: true,
          autoLaunchChrome,
          chromeHomeUrl,
        },
        safety: {
          offlineGraceHours,
          fallbackToSafeDefaultOnFailure: fallbackOnFailure,
          allowLocalAdminEmergencyPin: true,
        },
      };
      await onSave(payload);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {policy ? `Edit Policy: ${policy.name}` : 'Create Classroom Educational Policy'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure supported AppLocker, Chrome Enterprise, and Windows 11 restrictions.
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

        {/* Section Navigation Tabs */}
        <div className="px-5 border-b border-slate-800 flex items-center gap-1.5 bg-slate-950/50 text-xs overflow-x-auto scrollbar-none">
          {[
            { id: 'basics', label: '1. Basics', icon: Layers },
            { id: 'apps', label: '2. Applications', icon: PenTool, count: allowedApps.length },
            { id: 'websites', label: '3. Safe Websites', icon: Globe, count: allowedDomains.length },
            { id: 'youtube', label: '4. YouTube Control', icon: Tv },
            { id: 'windows', label: '5. Windows Lockdown', icon: Lock },
            { id: 'safety', label: '6. Fail-Safe & Grace', icon: AlertCircle },
          ].map(sec => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                className={`py-3 px-3.5 font-semibold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  activeSection === sec.id
                    ? 'border-emerald-500 text-emerald-400 bg-slate-850/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{sec.label}</span>
                {sec.count !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    {sec.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* SECTION 1: BASICS */}
          {activeSection === 'basics' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Policy Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Standard Whiteboard & STEM"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description & Objective</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explain the intended grade or subject use case..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultPolicyCheck"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="isDefaultPolicyCheck" className="text-slate-300 font-medium cursor-pointer">
                  Set as default policy for new classrooms
                </label>
              </div>
            </div>
          )}

          {/* SECTION 2: APPLICATIONS */}
          {activeSection === 'apps' && (
            <div className="space-y-5">
              {/* Presets Checklist */}
              <div>
                <label className="block font-bold text-slate-200 mb-2">
                  Select Permitted Educational Applications
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {standardEducationalApps.map(preset => {
                    const isChecked = allowedApps.some(a => a.name === preset.name);
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleToggleStandardApp(preset)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500 text-white'
                            : 'bg-slate-850 border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">{preset.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                            {preset.target}
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded-md flex items-center justify-center border ${isChecked ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'}`}>
                          {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Executable / App */}
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
                <span className="font-bold text-slate-200 block">Add Custom Application to Allowlist</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Application Name (e.g. GeoGebra)"
                    value={customAppName}
                    onChange={e => setCustomAppName(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Path or Package ID (e.g. C:\App\app.exe)"
                    value={customAppTarget}
                    onChange={e => setCustomAppTarget(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomApp}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors cursor-pointer"
                  >
                    Add to Policy
                  </button>
                </div>
              </div>

              {/* Active Allowed Apps List */}
              <div>
                <span className="font-bold text-slate-300 block mb-2">Current Allowed Application List ({allowedApps.length}):</span>
                <div className="space-y-1.5">
                  {allowedApps.map((app, idx) => (
                    <div key={app.id || idx} className="p-2.5 rounded-lg bg-slate-850 border border-slate-750 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-200">{app.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2 font-mono">({app.type}: {app.target})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAllowedApps(allowedApps.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: SAFE WEBSITES */}
          {activeSection === 'websites' && (
            <div className="space-y-5">
              {/* Mode Selection */}
              <div>
                <label className="block font-bold text-slate-200 mb-2">Website Enforcement Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'allowlist', title: 'Allowlist Mode (Recommended)', desc: 'Only explicitly approved educational domains accessible. Everything else blocked.' },
                    { id: 'blocklist', title: 'Blocklist Mode', desc: 'Allows web browsing except explicitly blocked domains (social media, games).' },
                    { id: 'unrestricted', title: 'Unrestricted', desc: 'No web restrictions applied to Chrome.' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setWebsiteMode(m.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        websiteMode === m.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-white'
                          : 'bg-slate-850 border-slate-750 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">{m.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Domain */}
              {websiteMode === 'allowlist' && (
                <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
                  <span className="font-bold text-slate-200 block">Add Educational Website Domain</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Domain (e.g. khanacademy.org)"
                      value={newDomain}
                      onChange={e => setNewDomain(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Description (e.g. Math practice portal)"
                      value={newDomainDesc}
                      onChange={e => setNewDomainDesc(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddDomain}
                      className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors cursor-pointer"
                    >
                      Add Domain
                    </button>
                  </div>
                </div>
              )}

              {/* Allowed Domains List */}
              <div>
                <span className="font-bold text-slate-300 block mb-2">Approved Domain Allowlist ({allowedDomains.length}):</span>
                <div className="space-y-1.5">
                  {allowedDomains.map((dom, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-850 border border-slate-750 flex items-center justify-between">
                      <div>
                        <span className="font-bold font-mono text-emerald-300">{dom.domain}</span>
                        <span className="text-[11px] text-slate-400 ml-2">— {dom.description}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAllowedDomains(allowedDomains.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: YOUTUBE CONTROL */}
          {activeSection === 'youtube' && (
            <div className="space-y-5">
              {/* Technical disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-850 border border-emerald-500/30 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  YouTube restrictions are enforced using supported <strong>Google Chrome Enterprise Managed Policies</strong> (<code>ForceYouTubeRestrict</code>, <code>URLAllowlist</code>).
                </p>
              </div>

              {/* YouTube Mode */}
              <div>
                <label className="block font-bold text-slate-200 mb-2">YouTube Filtering Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'approved_only', title: 'Approved Channels/Videos Only', desc: 'Allows only teacher-approved educational channels and specific videos. Everything else blocked.' },
                    { id: 'completely_blocked', title: 'Completely Disabled', desc: 'Blocks all YouTube access completely on classroom screens.' },
                    { id: 'unrestricted', title: 'Unrestricted', desc: 'Standard YouTube browsing with optional safety level.' },
                  ].map(ym => (
                    <button
                      key={ym.id}
                      type="button"
                      onClick={() => setYoutubeMode(ym.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        youtubeMode === ym.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-white'
                          : 'bg-slate-850 border-slate-750 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">{ym.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{ym.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {youtubeMode === 'approved_only' && (
                <>
                  {/* Channels Allowlist */}
                  <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
                    <span className="font-bold text-slate-200 block">Add Approved YouTube Educational Channel</span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder="Channel Title (e.g. TED-Ed)"
                        value={newChannelTitle}
                        onChange={e => setNewChannelTitle(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Channel ID (e.g. UCsooa4y...)"
                        value={newChannelId}
                        onChange={e => setNewChannelId(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none font-mono text-[11px]"
                      />
                      <input
                        type="text"
                        placeholder="Handle (e.g. @TEDEd)"
                        value={newChannelHandle}
                        onChange={e => setNewChannelHandle(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddChannel}
                        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors cursor-pointer"
                      >
                        Add Channel
                      </button>
                    </div>

                    <div className="space-y-1 pt-2">
                      {approvedChannels.map((ch, i) => (
                        <div key={ch.id || i} className="p-2 rounded bg-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-white">{ch.title}</span>
                            <span className="text-[10px] text-emerald-400 ml-2">{ch.handle}</span>
                            <span className="text-[10px] text-slate-500 ml-2 font-mono">({ch.channelId})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setApprovedChannels(approvedChannels.filter((_, idx) => idx !== i))}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Individual Videos Allowlist */}
                  <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
                    <span className="font-bold text-slate-200 block">Add Specific Approved YouTube Video</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Video Title (e.g. Photosynthesis Lab)"
                        value={newVideoTitle}
                        onChange={e => setNewVideoTitle(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Video ID or URL (e.g. heWDp_Hsw7c)"
                        value={newVideoId}
                        onChange={e => setNewVideoId(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={handleAddVideo}
                        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors cursor-pointer"
                      >
                        Add Video
                      </button>
                    </div>

                    <div className="space-y-1 pt-2">
                      {approvedVideos.map((vd, i) => (
                        <div key={vd.id || i} className="p-2 rounded bg-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-white">{vd.title}</span>
                            <span className="text-[10px] text-emerald-400 ml-2 font-mono">youtube.com/watch?v={vd.videoId}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setApprovedVideos(approvedVideos.filter((_, idx) => idx !== i))}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* SECTION 5: WINDOWS 11 LOCKDOWN */}
          {activeSection === 'windows' && (
            <div className="space-y-4">
              <label className="block font-bold text-slate-200 mb-1">
                Windows 11 Group Policy & Registry Lockdown Profile
              </label>
              <p className="text-[11px] text-slate-400 mb-3">
                Applied natively through supported Windows Group Policy Registry entries under <code>HKLM:\SOFTWARE\Policies</code>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Disable Windows Settings & Control Panel', checked: disableSettings, onChange: setDisableSettings, desc: 'Prevents students changing Wi-Fi, displays, or system accounts.' },
                  { label: 'Disable Task Manager', checked: disableTaskMgr, onChange: setDisableTaskMgr, desc: 'Suppresses Ctrl+Shift+Esc and task kill access.' },
                  { label: 'Disable Command Prompt & PowerShell', checked: disableCmd, onChange: setDisableCmd, desc: 'Prevents command-line circumvention.' },
                  { label: 'Disable Registry Editing Tools (regedit)', checked: disableRegistry, onChange: setDisableRegistry, desc: 'Blocks manual registry tampering.' },
                  { label: 'Block Arbitrary Browser Downloads', checked: blockDownloads, onChange: setBlockDownloads, desc: 'Prevents downloading unvetted .exe or installer files.' },
                  { label: 'Block Removable USB / Storage Devices', checked: blockRemovableStorage, onChange: setBlockRemovableStorage, desc: 'Restricts plug-and-play USB thumb drives.' },
                  { label: 'Hide Desktop Icons During Class', checked: hideDesktop, onChange: setHideDesktop, desc: 'Creates a clean distraction-free blackboard canvas.' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => item.onChange(!item.checked)}
                    className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 flex items-start gap-3 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-100">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chrome Startup URL */}
              <div className="pt-3">
                <label className="block font-semibold text-slate-300 mb-1">
                  Chrome Auto-Launch Homepage URL
                </label>
                <input
                  type="text"
                  value={chromeHomeUrl}
                  onChange={e => setChromeHomeUrl(e.target.value)}
                  placeholder="https://khanacademy.org"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* SECTION 6: SAFETY & FAIL-SAFE */}
          {activeSection === 'safety' && (
            <div className="space-y-4 max-w-2xl">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Administrative Failure Protection Architecture</span>
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  ClassroomLock is strictly engineered with safe rollback. An invalid policy or cloud outage will <strong>NEVER</strong> brick or permanently lock a school interactive screen.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Offline Grace Period (Hours)
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  If the school campus Wi-Fi drops, the local Windows Agent operates on its cryptographically signed local cache for this duration.
                </p>
                <select
                  value={offlineGraceHours}
                  onChange={e => setOfflineGraceHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-750 text-slate-100 focus:outline-none"
                >
                  <option value={24}>24 Hours</option>
                  <option value={48}>48 Hours</option>
                  <option value={72}>72 Hours (Recommended for weekends)</option>
                  <option value={168}>7 Days</option>
                </select>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="fallbackCheck"
                  checked={fallbackOnFailure}
                  onChange={e => setFallbackOnFailure(e.target.checked)}
                  className="mt-1 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="fallbackCheck" className="text-slate-300 font-medium cursor-pointer">
                  <strong>Automatic Safe Mode Fallback</strong>: If a policy payload is corrupted or rejected by Windows AppLocker, immediately revert to the last verified safe policy and alert administrators.
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            {isSaving ? 'Deploying Policy Changes...' : 'SAVE & DEPLOY POLICY'}
          </button>
        </div>
      </div>
    </div>
  );
};
