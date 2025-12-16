// Professional Employer Profile Automation Dashboard v3.0
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, CheckCircle, XCircle, Clock, RefreshCw, Download, ExternalLink,
  TrendingUp, Zap, Database, Globe, Award, BarChart3, Activity, Sparkles,
  FileText, Settings, Moon, Sun, Copy, Check, Filter, Trash2, ChevronDown,
  ChevronUp, Building2, Link2, AlertCircle, X, Plus, Upload
} from 'lucide-react';

// Types
interface Job {
  id: string;
  websiteUrl: string;
  status: 'processing' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  progress: number;
  data?: any;
  expanded?: boolean;
}

interface Stats {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  avgTime: number;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// Toast Component
const ToastNotification = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'from-emerald-500/20 to-emerald-600/20 border-emerald-400/40',
    error: 'from-rose-500/20 to-rose-600/20 border-rose-400/40',
    info: 'from-blue-500/20 to-blue-600/20 border-blue-400/40',
  }[toast.type];

  const iconColor = {
    success: 'text-emerald-400',
    error: 'text-rose-400',
    info: 'text-blue-400',
  }[toast.type];

  return (
    <div className={`toast glass-card bg-gradient-to-r ${bgColor} rounded-xl p-4 flex items-center gap-3 shadow-2xl`}>
      {toast.type === 'success' && <CheckCircle className={`w-5 h-5 ${iconColor}`} />}
      {toast.type === 'error' && <XCircle className={`w-5 h-5 ${iconColor}`} />}
      {toast.type === 'info' && <AlertCircle className={`w-5 h-5 ${iconColor}`} />}
      <span className="text-white text-sm font-medium flex-1">{toast.message}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function EmployerProfileDashboard() {
  // State
  const [webhookUrl, setWebhookUrl] = useState('https://hook.eu2.make.com/vdm78qerql1t3sdhi5h9f8vfu9nfawk1');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [batchUrls, setBatchUrls] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, failed: 0, processing: 0, avgTime: 0 });
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load jobs from localStorage
  useEffect(() => {
    const savedJobs = localStorage.getItem('employer_jobs_v3');
    if (savedJobs) {
      try {
        setJobs(JSON.parse(savedJobs));
      } catch (e) {
        console.error('Failed to load jobs:', e);
      }
    }
  }, []);

  // Save jobs
  useEffect(() => {
    if (jobs.length > 0) {
      localStorage.setItem('employer_jobs_v3', JSON.stringify(jobs));
    }
  }, [jobs]);

  // Update stats
  useEffect(() => {
    const total = jobs.length;
    const completed = jobs.filter(j => j.status === 'completed').length;
    const failed = jobs.filter(j => j.status === 'failed').length;
    const processing = jobs.filter(j => j.status === 'processing').length;
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.endTime);
    const avgTime = completedJobs.length > 0
      ? completedJobs.reduce((acc, job) => {
        const duration = new Date(job.endTime!).getTime() - new Date(job.startTime).getTime();
        return acc + duration / 1000;
      }, 0) / completedJobs.length
      : 0;
    setStats({ total, completed, failed, processing, avgTime });
  }, [jobs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isProcessing) submitJob();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [websiteUrl, batchUrls, isProcessing]);

  // Toast helper
  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Validate URL
  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url.trim());
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  // Submit job(s)
  const submitJob = async () => {
    const urls = batchMode
      ? batchUrls.split('\n').map(u => u.trim()).filter(u => u.length > 0)
      : [websiteUrl.trim()];

    if (urls.length === 0) {
      showToast('error', 'Please provide at least one website URL');
      return;
    }

    const invalidUrls = urls.filter(u => !validateUrl(u));
    if (invalidUrls.length > 0) {
      showToast('error', `Invalid URL(s): ${invalidUrls.slice(0, 2).join(', ')}${invalidUrls.length > 2 ? '...' : ''}`);
      return;
    }

    setIsProcessing(true);
    showToast('info', `Processing ${urls.length} URL(s)...`);

    for (const url of urls) {
      const jobId = `JOB_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newJob: Job = {
        id: jobId,
        websiteUrl: url,
        status: 'processing',
        startTime: new Date().toISOString(),
        progress: 0,
        expanded: false
      };

      setJobs(prev => [newJob, ...prev]);

      // Progress simulation
      const progressInterval = setInterval(() => {
        setJobs(prev => prev.map(job =>
          job.id === jobId && job.status === 'processing'
            ? { ...job, progress: Math.min(job.progress + Math.random() * 12, 92) }
            : job
        ));
      }, 800);

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'professional_dashboard_v3',
            website: url,
            website_url: url,
            ts: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            job_id: jobId,
            website_host: new URL(url).hostname,
            run_folder_hint: `PROFILE_${new URL(url).hostname}_${Date.now()}`,
            assets: { capture_images: true, capture_logo: true, max_images: 5 },
            outputs: { create_google_doc: true, include_benefits: true, include_matched_benefits: true }
          })
        });

        clearInterval(progressInterval);

        if (response.ok) {
          let result = {};
          try {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              result = await response.json();
            } else {
              await response.text();
              result = { success: true, status: 'completed' };
            }
          } catch {
            result = { success: true, status: 'completed' };
          }
          updateJobStatus(jobId, 'completed', result);
          showToast('success', `✓ ${new URL(url).hostname} processed`);
        } else {
          const errorText = await response.text();
          updateJobStatus(jobId, 'failed', { error: `HTTP ${response.status}` });
          showToast('error', `✗ ${new URL(url).hostname} failed`);
        }
      } catch (error: any) {
        clearInterval(progressInterval);
        updateJobStatus(jobId, 'failed', { error: error.message });
        showToast('error', `✗ ${new URL(url).hostname}: ${error.message}`);
      }

      // Small delay between batch requests
      if (urls.length > 1) await new Promise(r => setTimeout(r, 500));
    }

    setIsProcessing(false);
    setWebsiteUrl('');
    setBatchUrls('');
  };

  const updateJobStatus = (jobId: string, status: 'completed' | 'failed', data: any = {}) => {
    setJobs(prev => prev.map(job =>
      job.id === jobId
        ? { ...job, status, endTime: new Date().toISOString(), data, progress: 100 }
        : job
    ));
  };

  // Export to CSV
  const exportToCsv = () => {
    const headers = ['Job ID', 'Website URL', 'Status', 'Start Time', 'End Time', 'Duration (s)'];
    const rows = jobs.map(job => {
      const duration = job.endTime
        ? ((new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / 1000).toFixed(1)
        : 'N/A';
      return [job.id, job.websiteUrl, job.status, job.startTime, job.endTime || '', duration];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employer_profiles_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Export completed');
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('success', 'Copied to clipboard');
  };

  // Toggle job expansion
  const toggleJobExpand = (jobId: string) => {
    setJobs(prev => prev.map(job =>
      job.id === jobId ? { ...job, expanded: !job.expanded } : job
    ));
  };

  // Clear history
  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all job history?')) {
      setJobs([]);
      localStorage.removeItem('employer_jobs_v3');
      showToast('info', 'History cleared');
    }
  };

  // Filtered jobs
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesSearch = searchQuery === '' ||
      job.websiteUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Helper functions
  const getSuccessRate = () => stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'Processing...';
    const seconds = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
    return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const getHostname = (url: string) => {
    try { return new URL(url).hostname; } catch { return url; }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#0a0e27] p-4 md:p-6 lg:p-8 transition-colors duration-500`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <ToastNotification key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <header className="glass-card rounded-2xl p-6 md:p-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse-glow">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0a0e27] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white font-['Outfit']">
                  Employer Profile Automation
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Professional AI-Powered Profile Generation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWebhookConfig(!showWebhookConfig)}
                className="p-2.5 glass-card rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                title="Webhook Configuration"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {[
            { icon: Database, label: 'Total Jobs', value: stats.total, color: 'blue' },
            { icon: CheckCircle, label: 'Completed', value: stats.completed, color: 'emerald' },
            { icon: Activity, label: 'Processing', value: stats.processing, color: 'purple' },
            { icon: Zap, label: 'Avg Time', value: `${stats.avgTime.toFixed(1)}s`, color: 'amber' },
            { icon: Award, label: 'Success', value: `${getSuccessRate()}%`, color: 'pink' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`glass-card glass-card-hover rounded-xl p-4 md:p-5 border-${color}-500/20`}>
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-6 h-6 text-${color}-400`} />
                <span className="text-xl md:text-2xl font-bold text-white">{value}</span>
              </div>
              <p className={`text-${color}-300/80 text-xs md:text-sm font-medium`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Webhook Config Panel */}
        {showWebhookConfig && (
          <div className="glass-card rounded-2xl p-6 animate-fade-in border-blue-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Webhook Configuration</h2>
            </div>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono text-sm text-white placeholder-slate-500 transition-all input-premium"
              placeholder="Make.com webhook URL"
            />
            <p className="mt-2 text-xs text-slate-500">Configure your Make.com webhook endpoint for automated processing</p>
          </div>
        )}

        {/* Job Submission Form */}
        <div className="glass-card rounded-2xl p-6 md:p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Create New Profile</h2>
            </div>
            <button
              onClick={() => setBatchMode(!batchMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${batchMode
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                }`}
            >
              <Upload className="w-4 h-4" />
              {batchMode ? 'Batch Mode ON' : 'Single URL'}
            </button>
          </div>

          {batchMode ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                Enter URLs (one per line)
              </label>
              <textarea
                ref={textareaRef}
                value={batchUrls}
                onChange={(e) => setBatchUrls(e.target.value)}
                className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-slate-500 transition-all resize-none input-premium"
                placeholder="https://company1.com
https://company2.com
https://company3.com"
                disabled={isProcessing}
              />
              <p className="text-xs text-slate-500">
                {batchUrls.split('\n').filter(u => u.trim()).length} URL(s) entered
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                Company Website URL
              </label>
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  ref={inputRef}
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-slate-500 transition-all input-premium"
                  placeholder="https://example.com"
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}

          <button
            onClick={submitJob}
            disabled={isProcessing}
            className="btn-premium w-full mt-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-6 py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Profile{batchMode && batchUrls.split('\n').filter(u => u.trim()).length > 1 ? 's' : ''}
                <span className="text-white/60 text-sm ml-1">(Ctrl+Enter)</span>
              </>
            )}
          </button>
        </div>

        {/* Jobs List */}
        <div className="glass-card rounded-2xl p-6 md:p-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Recent Jobs</h2>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">
                {filteredJobs.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500/50"
                />
              </div>

              {/* Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white appearance-none cursor-pointer hover:bg-white/10 transition-colors"
              >
                <option value="all" className="bg-[#0f1535]">All Status</option>
                <option value="completed" className="bg-[#0f1535]">Completed</option>
                <option value="processing" className="bg-[#0f1535]">Processing</option>
                <option value="failed" className="bg-[#0f1535]">Failed</option>
              </select>

              {/* Export */}
              {jobs.length > 0 && (
                <>
                  <button
                    onClick={exportToCsv}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm font-medium transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={clearHistory}
                    className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-rose-300 text-sm font-medium transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Jobs Grid */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-slate-500" />
              </div>
              <p className="text-lg font-medium text-white mb-1">No jobs found</p>
              <p className="text-slate-500 text-sm">
                {searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Submit a website URL to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className={`glass-card rounded-xl overflow-hidden transition-all duration-300 ${job.status === 'completed' ? 'border-emerald-500/20' :
                    job.status === 'failed' ? 'border-rose-500/20' : 'border-blue-500/20'
                    }`}
                >
                  {/* Job Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleJobExpand(job.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`status-badge ${job.status === 'completed' ? 'status-completed' :
                          job.status === 'failed' ? 'status-failed' : 'status-processing'
                          }`}>
                          {job.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {job.status === 'failed' && <XCircle className="w-3 h-3" />}
                          {job.status === 'processing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                          {job.status}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">
                            {getHostname(job.websiteUrl)}
                          </h3>
                          <p className="text-xs text-slate-500 truncate">{job.websiteUrl}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400 hidden md:block">
                          {formatDuration(job.startTime, job.endTime)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(job.websiteUrl, job.id); }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Copy URL"
                        >
                          {copiedId === job.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                        </button>
                        <a
                          href={job.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Open website"
                        >
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </a>
                        {job.expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Progress bar for processing */}
                    {job.status === 'processing' && (
                      <div className="mt-3">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${job.progress}%` }} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 text-right">{Math.round(job.progress)}%</p>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {job.expanded && (
                    <div className="border-t border-white/5 p-4 bg-white/[0.02] animate-fade-in">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-white/5 rounded-lg p-3">
                          <span className="text-slate-500 text-xs block mb-1">Job ID</span>
                          <span className="font-mono text-white text-xs">{job.id.slice(-12)}</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <span className="text-slate-500 text-xs block mb-1">Started</span>
                          <span className="text-white text-xs">{new Date(job.startTime).toLocaleString('fr-FR')}</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <span className="text-slate-500 text-xs block mb-1">Duration</span>
                          <span className="text-white text-xs">{formatDuration(job.startTime, job.endTime)}</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <span className="text-slate-500 text-xs block mb-1">Status</span>
                          <span className="text-white text-xs capitalize">{job.status}</span>
                        </div>
                      </div>

                      {job.status === 'completed' && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {job.data?.storage?.drive_folder_url && (
                            <a
                              href={job.data.storage.drive_folder_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-premium inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              View in Drive
                            </a>
                          )}
                          {(job.data?.storage?.doc_url || job.data?.results?.doc_url || job.data?.doc_url) && (
                            <a
                              href={job.data?.storage?.doc_url || job.data?.results?.doc_url || job.data?.doc_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              Open Document
                            </a>
                          )}
                        </div>
                      )}

                      {job.status === 'failed' && job.data?.error && (
                        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                            <p className="text-rose-300 text-sm">{job.data.error}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-6">
          <p className="text-slate-500 text-sm">
            © 2025 Employer Profile Automation • Professional Grade
          </p>
        </footer>
      </div>
    </div>
  );
}
