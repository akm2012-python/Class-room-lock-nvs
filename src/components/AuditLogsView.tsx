import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  Key, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import type { AuditLog, School, Classroom, Device } from '../types.ts';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
  school: School;
  classrooms: Classroom[];
  devices: Device[];
  onTriggerTestIncident?: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  auditLogs,
  school,
  classrooms,
  devices,
  onTriggerTestIncident,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.deviceName && log.deviceName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.classroomName && log.classroomName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesType = eventTypeFilter === 'all' || log.eventType === eventTypeFilter;

    return matchesSearch && matchesSeverity && matchesType;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Severity', 'Event Type', 'User', 'Classroom', 'Device', 'Details'];
    const rows = filteredLogs.map(l => [
      `"${new Date(l.timestamp).toISOString()}"`,
      `"${l.severity}"`,
      `"${l.eventType}"`,
      `"${l.userName}"`,
      `"${l.classroomName || 'N/A'}"`,
      `"${l.deviceName || 'N/A'}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ClassroomLock-Audit-Logs-${school.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
            <ShieldAlert className="h-3 w-3" />
            <span>CRITICAL</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
            <AlertTriangle className="h-3 w-3" />
            <span>VIOLATION</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
            <CheckCircle2 className="h-3 w-3" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-emerald-400" />
            <span>Security & Compliance Audit Logs</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Tamper-evident audit trail of classroom sessions, policy updates, blocked execution attempts, and PIN overrides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onTriggerTestIncident && (
            <button
              onClick={onTriggerTestIncident}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Simulate Incident</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search details, user, device..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Severity Filter */}
        <div>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical (Overrides & Alarms)</option>
            <option value="warning">Violations & Denials</option>
            <option value="info">Informational & Session Logs</option>
          </select>
        </div>

        {/* Event Type Filter */}
        <div>
          <select
            value={eventTypeFilter}
            onChange={e => setEventTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none"
          >
            <option value="all">All Event Types</option>
            <option value="policy_violation_app">App Blocked (AppLocker)</option>
            <option value="policy_violation_web">Website Blocked (Chrome Policy)</option>
            <option value="session_started">Classroom Session Started</option>
            <option value="session_ended">Classroom Session Ended</option>
            <option value="emergency_unlock_used">Emergency PIN Override</option>
            <option value="device_enrolled">Device Enrolled</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-850/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Target Device & Room</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getSeverityBadge(log.severity)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-200">
                      {log.eventType.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-200 font-semibold">{log.deviceName || 'Entire School'}</div>
                      <div className="text-[10px] text-slate-400">{log.classroomName || 'Central'}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-medium">
                      {log.userName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-md leading-relaxed text-[11px]">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
