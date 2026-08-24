export type UserRole = 'super_admin' | 'school_admin' | 'teacher';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId: string;
  schoolName?: string;
  avatar?: string;
  phone?: string;
  lastLoginAt?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  keySecret?: string; // only returned once upon creation
  schoolId: string;
  role: 'admin' | 'device_agent' | 'readonly';
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  lastUsedIp?: string;
  expiresAt?: string;
  status: 'active' | 'revoked';
  createdByName?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  school: School;
  expiresAt: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  subscriptionPlan: 'pilot' | 'standard' | 'enterprise';
  totalLicenses: number;
  usedLicenses: number;
  timezone: string;
  emergencyMasterCode: string;
  createdAt: string;
}

export interface Classroom {
  id: string;
  schoolId: string;
  name: string;
  grade: string;
  section: string;
  building: string;
  roomNumber: string;
  defaultPolicyId: string;
  assignedTeacherIds: string[];
  deviceCount?: number;
  activeSession?: ClassSession;
}

export interface ClassSession {
  id: string;
  classroomId: string;
  teacherId: string;
  teacherName: string;
  policyId: string;
  policyName: string;
  startedAt: string;
  scheduledDurationMinutes: number;
  temporaryAllowedUrls: string[];
  temporaryAllowedApps: string[];
  status: 'active' | 'ended';
}

export type HardwareType = 'smartvision_ops' | 'windows11_pc' | 'interactive_touchpanel' | 'laptop_cart';

export type EnforcementStatus = 'applied' | 'pending' | 'failed' | 'fallback_active';

export interface Device {
  id: string;
  schoolId: string;
  classroomId: string;
  classroomName: string;
  name: string;
  deviceCode: string;
  hostname: string;
  hardwareType: HardwareType;
  osVersion: string;
  agentVersion: string;
  ipAddress: string;
  macAddress: string;
  status: 'online' | 'offline' | 'error';
  classroomModeActive: boolean;
  currentPolicyId: string;
  currentPolicyName: string;
  lastSyncAt: string;
  lastHeartbeatAt: string;
  enforcementStatus: EnforcementStatus;
  enforcementError?: string;
  isEnrolled: boolean;
  emergencyUnlockCode: string;
  offlineGracePeriodHours: number;
  opsEnvironment: {
    hasAndroidHost: boolean;
    androidVersion?: string;
    opsSlotInput: string;
    androidSwitchLockSupported: boolean;
    manufacturerNotes: string;
  };
  metrics?: {
    cpuPercent: number;
    memoryPercent: number;
    activeWindow: string;
    blockedAttemptsLastHour: number;
  };
}

export interface AppRuleItem {
  id: string;
  name: string;
  type: 'uwp_package' | 'exe_path' | 'hash';
  target: string;
  icon?: string;
  requiredForClass?: boolean;
}

export interface WebDomainItem {
  domain: string;
  description: string;
  wildcards: boolean;
}

export interface YouTubeChannelItem {
  id: string;
  channelId: string;
  title: string;
  handle: string;
}

export interface YouTubeVideoItem {
  id: string;
  videoId: string;
  title: string;
  duration?: string;
}

export interface Policy {
  id: string;
  schoolId: string;
  name: string;
  description: string;
  isDefault: boolean;
  isGlobalTemplate?: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  applications: {
    allowlist: AppRuleItem[];
    blocklist: Array<{ id: string; name: string; target: string; reason?: string }>;
    defaultAction: 'block_all_except_allowed' | 'allow_all_except_blocked';
  };
  websites: {
    mode: 'allowlist' | 'blocklist' | 'unrestricted';
    allowedDomains: WebDomainItem[];
    blockedDomains: Array<{ domain: string; category?: string }>;
  };
  youtube: {
    mode: 'completely_blocked' | 'approved_only' | 'unrestricted';
    moderateLevel: 'strict' | 'moderate' | 'none';
    approvedChannels: YouTubeChannelItem[];
    approvedVideos: YouTubeVideoItem[];
  };
  windowsLockdown: {
    disableSettingsApp: boolean;
    disableTaskManager: boolean;
    disableCommandPrompt: boolean;
    disableRegistryTools: boolean;
    blockArbitraryDownloads: boolean;
    blockRemovableStorage: boolean;
    hideDesktopIcons: boolean;
    forceWhiteboardKiosk: boolean;
    autoLaunchChrome: boolean;
    chromeHomeUrl: string;
  };
  safety: {
    offlineGraceHours: number;
    fallbackToSafeDefaultOnFailure: boolean;
    allowLocalAdminEmergencyPin: boolean;
  };
}

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AuditEventType =
  | 'CLASSROOM_MODE_START'
  | 'CLASSROOM_MODE_END'
  | 'POLICY_UPDATE'
  | 'DEVICE_ENROLLED'
  | 'DEVICE_OFFLINE'
  | 'DEVICE_ONLINE'
  | 'ENFORCEMENT_SUCCESS'
  | 'ENFORCEMENT_FAILED'
  | 'EMERGENCY_OVERRIDE_USED'
  | 'UNAUTHORIZED_APP_BLOCKED'
  | 'UNAUTHORIZED_SITE_BLOCKED'
  | 'SMARTVISION_OPS_SWITCH_ATTEMPT';

export type NavTab = 'dashboard' | 'teacher' | 'classrooms' | 'devices' | 'policies' | 'audit-logs' | 'settings' | 'setup-guide';

export interface OtpRecord {
  id: string;
  recipient: string;
  code: string;
  expiresAt: string;
  used: boolean;
  purpose: 'login' | 'emergency_pin' | 'admin_verification';
  createdAt: string;
}

export interface DatabaseStateStats {
  userCount: number;
  classroomCount: number;
  deviceCount: number;
  policyCount: number;
  auditLogCount: number;
  apiKeyCount: number;
  lastPersistedAt: string;
  databaseDriver: string;
  isProductionClean: boolean;
}

export interface AuditLog {
  id: string;
  schoolId: string;
  timestamp: string;
  actorType?: 'teacher' | 'admin' | 'system' | 'agent';
  actorName?: string;
  userId?: string;
  userName?: string;
  eventType: string;
  classroomId?: string;
  classroomName?: string;
  deviceId?: string;
  deviceName?: string;
  details: string;
  severity: string;
}

export interface EnrollmentToken {
  token: string;
  schoolId: string;
  classroomId: string;
  classroomName: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface Subscription {
  schoolId: string;
  plan: 'pilot' | 'standard' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due';
  seats: number;
  usedSeats: number;
  billingCycle: 'monthly' | 'annual';
  pricePerDeviceMonthly: number;
  renewsAt: string;
}

export interface AgentGeneratedConfig {
  policyJson: string;
  appLockerXml: string;
  chromeMasterPreferences: string;
  registryScript: string;
  powershellEnforceScript: string;
}
