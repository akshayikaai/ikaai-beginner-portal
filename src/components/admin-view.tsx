'use client';

import React, { useState } from 'react';
import {
  Users,
  Download,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  UserX,
  FileSpreadsheet,
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isAnonymised: boolean;
  anonymisedAt: string | null;
  enrollments: {
    programmeId: string;
    programmeTitle: string;
    status: string;
    certificateIssued: boolean;
  }[];
}

interface AdminViewProps {
  initialUsers: UserItem[];
}

export function AdminView({ initialUsers }: AdminViewProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<'analytics' | 'users'>('analytics');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForAnonymise, setSelectedUserForAnonymise] = useState<UserItem | null>(null);
  const [anonymising, setAnonymising] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalLearners = users.filter((u) => u.role === 'LEARNER').length;
  const anonymisedCount = users.filter((u) => u.isAnonymised).length;
  const certifiedCount = users.filter((u) =>
    u.enrollments.some((e) => e.certificateIssued)
  ).length;

  const handleExportCsv = () => {
    window.location.href = '/api/admin/reports/export';
  };

  const handleAnonymise = async () => {
    if (!selectedUserForAnonymise) return;
    setAnonymising(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/admin/users/anonymise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserForAnonymise.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to anonymise user');
      }

      setFeedbackMsg({
        text: `User ${selectedUserForAnonymise.id} successfully anonymised under DPDP Act 2023.`,
        type: 'success',
      });

      // Update state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUserForAnonymise.id
            ? {
                ...u,
                name: 'Former Learner',
                email: `anonymised-${u.id}@anonymised.invalid`,
                isAnonymised: true,
                anonymisedAt: new Date().toISOString(),
              }
            : u
        )
      );

      setSelectedUserForAnonymise(null);
    } catch (err: any) {
      setFeedbackMsg({
        text: err.message || 'Error executing anonymisation',
        type: 'error',
      });
    } finally {
      setAnonymising(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-500">
              Operations & Administration
            </span>
            <span className="text-xs text-ink-muted">DPDP Act 2023 Compliance & Reporting</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading text-ink tracking-tight">
            Admin Workspace & Cohort Analytics
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Institutional governance, aggregate learner progress, cohort export, and user exit redaction.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-element bg-brand-500 hover:bg-brand-600 text-brand-on text-sm font-semibold transition-colors min-h-[44px]"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Export Cohort CSV</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-element border text-sm flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-surface-brand border-brand-300 dark:border-brand-800 text-brand-900 dark:text-brand-100'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}
        >
          <CheckCircle className="h-4 w-4 flex-none" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-line">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === 'analytics'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Cohort Overview & Analytics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === 'users'
              ? 'border-brand-500 text-brand-500'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Learner Directory & DPDP Exit Management
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-element bg-bg-card border border-line">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                Total Enrolled Learners
              </span>
              <p className="text-3xl font-bold font-heading text-ink">{totalLearners}</p>
              <p className="text-xs text-ink-muted mt-1">Across all 4 active programmes</p>
            </div>

            <div className="p-5 rounded-element bg-bg-card border border-line">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                Certificates Issued
              </span>
              <p className="text-3xl font-bold font-heading text-brand-500">{certifiedCount}</p>
              <p className="text-xs text-ink-muted mt-1">100% completion & passed exams</p>
            </div>

            <div className="p-5 rounded-element bg-bg-card border border-line">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                DPDP Anonymised Users
              </span>
              <p className="text-3xl font-bold font-heading text-amber-600">{anonymisedCount}</p>
              <p className="text-xs text-ink-muted mt-1">Exit redaction protocol applied</p>
            </div>

            <div className="p-5 rounded-element bg-bg-card border border-line">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                Institutional Audit Status
              </span>
              <p className="text-3xl font-bold font-heading text-emerald-600">Active</p>
              <p className="text-xs text-ink-muted mt-1">ISO 9001:2015 compliant logs</p>
            </div>
          </div>

          {/* Export Action Card */}
          <div className="p-6 rounded-element bg-bg-card border border-line space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold font-heading text-ink">
                  Institutional Cohort Progress Data Export
                </h2>
                <p className="text-xs text-ink-muted">
                  Downloads full CSV spreadsheet including learner completion percentages, quiz scores, written exam marks, and certificate verification identifiers.
                </p>
              </div>
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-element bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 text-xs font-semibold transition-colors min-h-[44px]"
              >
                <Download className="h-4 w-4" />
                <span>Download Report (.CSV)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Users & Anonymisation Tab */
        <div className="space-y-6">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-ink-muted" />
              <input
                type="text"
                placeholder="Search learners by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-element bg-bg-card border border-line focus:outline-none focus:border-brand-500"
              />
            </div>
            <span className="text-xs text-ink-muted">
              Showing {filteredUsers.length} of {users.length} registered accounts
            </span>
          </div>

          {/* Users Table */}
          <div className="rounded-element border border-line overflow-hidden bg-bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-main border-b border-line text-ink-muted uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Learner / Staff</th>
                    <th className="p-3.5">Role & Department</th>
                    <th className="p-3.5">Enrolled Programmes</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-bg-main/40 transition-colors">
                      <td className="p-3.5">
                        <p className="font-bold text-ink">{u.name}</p>
                        <p className="text-[11px] font-mono text-ink-muted">{u.email}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-500 mb-1">
                          {u.role}
                        </span>
                        <p className="text-ink-muted">{u.department}</p>
                      </td>
                      <td className="p-3.5">
                        {u.enrollments.length > 0 ? (
                          <div className="space-y-1">
                            {u.enrollments.map((enr) => (
                              <div key={enr.programmeId} className="flex items-center gap-1.5">
                                <span className="font-medium text-ink">{enr.programmeTitle}</span>
                                {enr.certificateIssued && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    Certified
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-ink-muted italic">No active enrollments</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {u.isAnonymised ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <ShieldAlert className="h-3 w-3" />
                            <span>Anonymised (DPDP)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Active Account</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {u.role === 'LEARNER' && !u.isAnonymised && (
                          <button
                            onClick={() => setSelectedUserForAnonymise(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors min-h-[36px]"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            <span>Anonymise Exit</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DPDP Anonymisation Confirmation Modal */}
      {selectedUserForAnonymise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-bg-card rounded-element border border-line p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center flex-none">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-ink">
                  Execute DPDP Act 2023 User Exit Anonymisation
                </h3>
                <p className="text-xs text-ink-muted">Irreversible privacy redaction protocol</p>
              </div>
            </div>

            <div className="p-4 rounded-element bg-bg-main border border-line text-xs space-y-2 text-ink-muted">
              <p>
                You are initiating account exit redaction for{' '}
                <strong className="text-ink">{selectedUserForAnonymise.name}</strong> (
                <code>{selectedUserForAnonymise.email}</code>).
              </p>
              <p className="font-semibold text-ink">The following changes are executed permanently:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Name is overwritten with <em>&ldquo;Former Learner&rdquo;</em></li>
                <li>Email is transformed to <code>anonymised-{selectedUserForAnonymise.id}@anonymised.invalid</code></li>
                <li>Password hashes and avatar records are cleared</li>
                <li>All active sessions are terminated immediately via <code>tokenVersion</code> increment</li>
                <li>IP address records in <code>ConsentLog</code> are deleted</li>
                <li>Direct chat messages are scrubbed</li>
                <li>Certificate recipient snapshots persist to maintain credential authenticity on <code>/verify</code></li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForAnonymise(null)}
                className="px-4 py-2 rounded-element bg-bg-main hover:bg-line text-ink text-xs font-semibold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAnonymise}
                disabled={anonymising}
                className="px-4 py-2 rounded-element bg-red-600 hover:bg-red-700 text-white text-xs font-semibold min-h-[44px] disabled:opacity-50"
              >
                {anonymising ? 'Executing Anonymisation...' : 'Confirm Irreversible Anonymisation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
