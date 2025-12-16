'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Trash2, Download, Eye, Grid, List, Settings, BarChart3,
  RefreshCw, ExternalLink, FileText, Award, FolderOpen, X, Globe,
  CheckCircle, Clock, XCircle, Palette, Type, Link2, Upload, Database,
  Moon, Sun, Copy, Check, Zap, Activity, TrendingUp, ChevronDown, ChevronUp
} from 'lucide-react';

interface Profile {
  id: string;
  url: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
  data?: any;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function EmployerProfilePro() {
  // Core State
  const [view, setView] = useState<'dashboard' | 'generate' | 'profile' | 'settings'>('dashboard');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  // Form State
  const [url, setUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ step: '', percent: 0 });
  const [webhookUrl, setWebhookUrl] = useState('https://hook.eu2.make.com/8xsf9sha1e3c3bdznz5sii2e9j10wpi5');

  // UI State
  const [darkMode, setDarkMode] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Load data
  useEffect(() => {
    const stored = localStorage.getItem('employer_profiles_pro_v2');
    if (stored) setProfiles(JSON.parse(stored));
    const theme = localStorage.getItem('theme');
    if (theme) setDarkMode(theme === 'dark');
  }, []);

  // Save data
  const saveProfiles = useCallback((data: Profile[]) => {
    localStorage.setItem('employer_profiles_pro_v2', JSON.stringify(data));
    setProfiles(data);
  }, []);

  // Theme toggle
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Toast system
  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    showToast('success', 'Copied to clipboard');
  }, [showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); setView('generate'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); exportAll(); }
      if (e.key === 'Escape') { setView('dashboard'); setSelectedProfile(null); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [profiles]);

  // Generate profile
  const generateProfile = async () => {
    if (!url.trim()) return;

    const newProfile: Profile = {
      id: Date.now().toString(),
      url: url.trim(),
      status: 'processing',
      createdAt: new Date().toISOString()
    };

    const updated = [newProfile, ...profiles];
    saveProfiles(updated);
    setGenerating(true);
    showToast('info', 'Starting profile generation...');

    const steps = [
      { step: 'Connecting...', percent: 10 },
      { step: 'Extracting domain...', percent: 25 },
      { step: 'Creating folder...', percent: 40 },
      { step: 'Fetching brand data...', percent: 55 },
      { step: 'Processing logos...', percent: 70 },
      { step: 'Extracting colors...', percent: 80 },
      { step: 'Creating document...', percent: 90 },
      { step: 'Finalizing...', percent: 100 }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) { setProgress(steps[stepIdx]); stepIdx++; }
    }, 1200);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: url, timestamp: new Date().toISOString() })
      });

      clearInterval(interval);
      let data = {};
      try { data = await response.json(); } catch { data = { success: true }; }

      const idx = updated.findIndex(p => p.id === newProfile.id);
      updated[idx] = { ...newProfile, status: 'completed', data, completedAt: new Date().toISOString() };
      saveProfiles(updated);
      setUrl('');
      setView('dashboard');
      showToast('success', 'Profile generated successfully!');
    } catch (err: any) {
      clearInterval(interval);
      const idx = updated.findIndex(p => p.id === newProfile.id);
      updated[idx] = { ...newProfile, status: 'failed', error: err.message };
      saveProfiles(updated);
      showToast('error', `Failed: ${err.message}`);
    } finally {
      setGenerating(false);
      setProgress({ step: '', percent: 0 });
    }
  };

  // Delete profile
  const deleteProfile = (id: string) => {
    if (!confirm('Delete this profile?')) return;
    saveProfiles(profiles.filter(p => p.id !== id));
    if (selectedProfile?.id === id) { setSelectedProfile(null); setView('dashboard'); }
    showToast('success', 'Profile deleted');
  };

  // Export functions
  const exportProfile = (profile: Profile, format: 'json' | 'txt' = 'json') => {
    const content = format === 'json' ? JSON.stringify(profile, null, 2) : `URL: ${profile.url}\nStatus: ${profile.status}\n\n${JSON.stringify(profile.data, null, 2)}`;
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `profile-${profile.data?.domain || profile.id}.${format}`; a.click();
    showToast('success', 'Exported successfully');
  };

  const exportAll = () => {
    if (profiles.length === 0) return showToast('error', 'No profiles to export');
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `all-profiles-${Date.now()}.json`; a.click();
    showToast('success', `Exported ${profiles.length} profiles`);
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) { saveProfiles([...data, ...profiles]); showToast('success', `Imported ${data.length} profiles`); }
      } catch { showToast('error', 'Invalid backup file'); }
    };
    reader.readAsText(file);
  };

  // Filter & sort
  const filteredProfiles = profiles
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => !searchTerm || p.url.toLowerCase().includes(searchTerm.toLowerCase()) || p.data?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return a.url.localeCompare(b.url) * (sortBy === 'name-desc' ? -1 : 1);
    });

  // Stats
  const stats = {
    total: profiles.length,
    completed: profiles.filter(p => p.status === 'completed').length,
    processing: profiles.filter(p => p.status === 'processing').length,
    failed: profiles.filter(p => p.status === 'failed').length
  };

  // Helpers
  const getInitials = (url: string) => { try { return new URL(url).hostname.substring(0, 2).toUpperCase(); } catch { return '??'; } };
  const getPlatformEmoji = (url: string) => {
    if (url.includes('linkedin')) return '💼';
    if (url.includes('twitter') || url.includes('x.com')) return '𝕏';
    if (url.includes('facebook')) return '📘';
    if (url.includes('instagram')) return '📷';
    if (url.includes('youtube')) return '📺';
    if (url.includes('github')) return '💻';
    return '🔗';
  };

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Theme classes
  const theme = {
    bg: darkMode ? 'bg-[#0a0f1a]' : 'bg-gray-50',
    card: darkMode ? 'bg-[#111827]/80 border-white/10' : 'bg-white border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
    input: darkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900',
    hover: darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      {/* Animated Background */}
      {darkMode && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-2 animate-slide-in ${toast.type === 'success' ? 'bg-emerald-500/90 text-white' :
              toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-blue-500/90 text-white'
            }`}>
            {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
            {toast.type === 'error' && <XCircle className="w-4 h-4" />}
            {toast.type === 'info' && <Activity className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className={`${theme.card} border-b backdrop-blur-xl sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${theme.text}`}>Employer Profile Pro</h1>
              <p className={`text-xs ${theme.textMuted}`}>{stats.total} profiles • {stats.completed} completed</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${theme.hover} transition-colors`}>
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
            <button onClick={() => setView('dashboard')} className={`p-2 rounded-lg ${view === 'dashboard' ? 'bg-violet-600/20 text-violet-400' : theme.textMuted} ${theme.hover}`}>
              <BarChart3 className="w-5 h-5" />
            </button>
            <button onClick={() => setView('settings')} className={`p-2 rounded-lg ${view === 'settings' ? 'bg-violet-600/20 text-violet-400' : theme.textMuted} ${theme.hover}`}>
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={() => setView('generate')} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-violet-600/25 hover:shadow-xl transition-all">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Profile</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Dashboard */}
        {view === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Profiles', value: stats.total, icon: Database, gradient: 'from-violet-600 to-indigo-600' },
                { label: 'Completed', value: stats.completed, icon: CheckCircle, gradient: 'from-emerald-600 to-teal-600' },
                { label: 'Processing', value: stats.processing, icon: RefreshCw, gradient: 'from-blue-600 to-cyan-600' },
                { label: 'Failed', value: stats.failed, icon: XCircle, gradient: 'from-red-600 to-rose-600' }
              ].map(({ label, value, icon: Icon, gradient }) => (
                <div key={label} className={`${theme.card} border rounded-xl p-5 backdrop-blur-sm`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-medium ${theme.textMuted}`}>{label}</span>
                    <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${theme.text}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className={`${theme.card} border rounded-xl p-3 backdrop-blur-sm flex flex-wrap items-center gap-3`}>
              <div className="relative flex-1 min-w-[200px]">
                <Search className={`absolute left-3 top-2.5 w-4 h-4 ${theme.textMuted}`} />
                <input
                  type="text"
                  placeholder="Search profiles..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 ${theme.input} rounded-lg text-sm border focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all`}
                />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`px-3 py-2 ${theme.input} border rounded-lg text-sm`}>
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={`px-3 py-2 ${theme.input} border rounded-lg text-sm`}>
                <option value="date-desc">Newest</option>
                <option value="date-asc">Oldest</option>
                <option value="name-asc">A-Z</option>
                <option value="name-desc">Z-A</option>
              </select>
              <div className="flex gap-1">
                <button onClick={() => setDisplayMode('grid')} className={`p-2 rounded-lg transition-colors ${displayMode === 'grid' ? 'bg-violet-600/20 text-violet-400' : theme.textMuted}`}>
                  <Grid className="w-4 h-4" />
                </button>
                <button onClick={() => setDisplayMode('list')} className={`p-2 rounded-lg transition-colors ${displayMode === 'list' ? 'bg-violet-600/20 text-violet-400' : theme.textMuted}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button onClick={() => { const s = localStorage.getItem('employer_profiles_pro_v2'); if (s) setProfiles(JSON.parse(s)); showToast('info', 'Refreshed'); }} className={`p-2 ${theme.textMuted} ${theme.hover} rounded-lg`}>
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Profiles */}
            {filteredProfiles.length === 0 ? (
              <div className={`${theme.card} border rounded-2xl p-16 text-center backdrop-blur-sm`}>
                <div className="w-20 h-20 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className={`w-10 h-10 ${theme.textMuted}`} />
                </div>
                <h3 className={`text-xl font-bold ${theme.text} mb-2`}>No Profiles Found</h3>
                <p className={`${theme.textMuted} mb-6`}>Generate your first employer profile to get started</p>
                <button onClick={() => setView('generate')} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-violet-600/25 hover:shadow-xl transition-all">
                  <Plus className="w-5 h-5 inline mr-2" />Generate Profile
                </button>
              </div>
            ) : (
              <div className={displayMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                {filteredProfiles.map(p => (
                  <div key={p.id} className={`${theme.card} border rounded-xl backdrop-blur-sm hover:shadow-xl hover:shadow-violet-600/5 transition-all duration-300 overflow-hidden group`}>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        {p.data?.logos?.[0]?.formats?.[0]?.src ? (
                          <img src={p.data.logos[0].formats[0].src} alt="" className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                            {getInitials(p.url)}
                          </div>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${p.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            p.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                          {p.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {p.status === 'failed' && <XCircle className="w-3 h-3" />}
                          {p.status === 'processing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                          {p.status}
                        </span>
                      </div>

                      <h3 className={`font-semibold ${theme.text} truncate mb-1`}>{p.data?.name || p.url}</h3>
                      <p className={`text-sm ${theme.textMuted} truncate mb-1`}>{p.data?.domain || new URL(p.url).hostname}</p>
                      <p className={`text-xs ${theme.textMuted}`}>{new Date(p.createdAt).toLocaleString()}</p>

                      {p.status === 'completed' && p.data && (
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          {p.data.colors?.slice(0, 5).map((c: any, i: number) => (
                            <div key={i} className="w-5 h-5 rounded-md border border-white/20 shadow-sm" style={{ backgroundColor: c.hex }} title={c.hex} />
                          ))}
                          {p.data.logos?.length > 0 && <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">{p.data.logos.length} logos</span>}
                          {p.data.links?.length > 0 && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{p.data.links.length} links</span>}
                        </div>
                      )}
                    </div>

                    <div className={`px-5 py-3 border-t ${darkMode ? 'border-white/5' : 'border-gray-100'} flex gap-2`}>
                      <button onClick={() => { setSelectedProfile(p); setView('profile'); }} className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center gap-1">
                        <Eye className="w-3.5 h-3.5" />View
                      </button>
                      <button onClick={() => exportProfile(p)} className={`p-2 ${theme.textMuted} ${theme.hover} rounded-lg`}><Download className="w-4 h-4" /></button>
                      <button onClick={() => deleteProfile(p.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bulk Actions */}
            {profiles.length > 0 && (
              <div className={`${theme.card} border rounded-xl p-4 backdrop-blur-sm flex items-center justify-between flex-wrap gap-3`}>
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-5 h-5 ${theme.textMuted}`} />
                  <span className={`font-medium ${theme.text}`}>Bulk Actions</span>
                </div>
                <div className="flex gap-2">
                  {stats.failed > 0 && (
                    <button onClick={() => { if (confirm('Delete all failed?')) { saveProfiles(profiles.filter(p => p.status !== 'failed')); showToast('success', 'Deleted failed profiles'); } }} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">
                      Delete Failed ({stats.failed})
                    </button>
                  )}
                  <button onClick={exportAll} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors">
                    Export All
                  </button>
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts Hint */}
            <div className={`text-center ${theme.textMuted} text-xs`}>
              <kbd className="px-2 py-1 bg-white/5 rounded text-xs">Ctrl+N</kbd> New • <kbd className="px-2 py-1 bg-white/5 rounded text-xs">Ctrl+E</kbd> Export • <kbd className="px-2 py-1 bg-white/5 rounded text-xs">Esc</kbd> Back
            </div>
          </div>
        )}

        {/* Generate */}
        {view === 'generate' && (
          <div className="max-w-xl mx-auto animate-fade-in">
            <div className={`${theme.card} border rounded-2xl backdrop-blur-sm overflow-hidden shadow-2xl`}>
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-6">
                <h2 className="text-xl font-bold text-white mb-1">Generate New Profile</h2>
                <p className="text-violet-200 text-sm">Enter a company URL to fetch brand data</p>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-2`}>Company Website URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !generating && generateProfile()}
                    placeholder="https://stripe.com"
                    disabled={generating}
                    className={`w-full px-4 py-3 ${theme.input} border-2 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all disabled:opacity-50`}
                  />
                </div>

                <button onClick={generateProfile} disabled={generating || !url.trim()} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 hover:shadow-xl transition-all">
                  {generating ? <><RefreshCw className="w-5 h-5 animate-spin" />Generating...</> : <><Zap className="w-5 h-5" />Generate Profile</>}
                </button>

                {generating && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className={theme.text}>{progress.step}</span>
                      <span className={theme.textMuted}>{progress.percent}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress.percent}%` }} />
                    </div>
                  </div>
                )}

                <button onClick={() => setView('dashboard')} className={`w-full py-2.5 rounded-xl ${theme.hover} ${theme.text} transition-colors`}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Profile View */}
        {view === 'profile' && selectedProfile && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className={`${theme.card} border rounded-2xl backdrop-blur-sm overflow-hidden shadow-2xl`}>
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedProfile.data?.logos?.[0]?.formats?.[0]?.src ? (
                    <img src={selectedProfile.data.logos[0].formats[0].src} alt="" className="w-14 h-14 rounded-xl bg-white/20 object-contain p-2" />
                  ) : (
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {getInitials(selectedProfile.url)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedProfile.data?.name || selectedProfile.url}</h2>
                    <p className="text-violet-200 text-sm">{selectedProfile.data?.domain || new URL(selectedProfile.url).hostname}</p>
                  </div>
                </div>
                <button onClick={() => { setView('dashboard'); setSelectedProfile(null); }} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 ${selectedProfile.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      selectedProfile.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                    {selectedProfile.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                    {selectedProfile.status === 'failed' && <XCircle className="w-4 h-4" />}
                    {selectedProfile.status === 'processing' && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {selectedProfile.status}
                  </span>
                  <div className="flex-1" />
                  {selectedProfile.data?.folderUrl && (
                    <a href={selectedProfile.data.folderUrl} target="_blank" className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors flex items-center gap-1">
                      <FolderOpen className="w-4 h-4" />Drive
                    </a>
                  )}
                  {selectedProfile.data?.docUrl && (
                    <a href={selectedProfile.data.docUrl} target="_blank" className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                      <FileText className="w-4 h-4" />Doc
                    </a>
                  )}
                  <button onClick={() => exportProfile(selectedProfile, 'json')} className="px-3 py-1.5 bg-violet-500/10 text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-500/20 transition-colors flex items-center gap-1">
                    <Download className="w-4 h-4" />JSON
                  </button>
                  <button onClick={() => deleteProfile(selectedProfile.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center gap-1">
                    <Trash2 className="w-4 h-4" />Delete
                  </button>
                </div>

                {selectedProfile.status === 'completed' && selectedProfile.data && (
                  <div className="space-y-4">
                    {/* Description */}
                    {selectedProfile.data.description && (
                      <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <h3 className={`font-semibold ${theme.text} mb-2 flex items-center gap-2`}>
                          <FileText className="w-4 h-4 text-violet-400" />Description
                          {selectedProfile.data.qualityScore && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Score: {selectedProfile.data.qualityScore}</span>}
                        </h3>
                        <p className={`${theme.textMuted} text-sm`}>{selectedProfile.data.description}</p>
                      </div>
                    )}

                    {/* Logos */}
                    {selectedProfile.data.logos?.length > 0 && (
                      <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <button onClick={() => toggleSection('logos')} className={`w-full flex items-center justify-between font-semibold ${theme.text} mb-3`}>
                          <span className="flex items-center gap-2"><Award className="w-4 h-4 text-violet-400" />Logos ({selectedProfile.data.logos.length})</span>
                          {expandedSections.logos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {(expandedSections.logos ?? true) && (
                          <div className="flex flex-wrap gap-3">
                            {selectedProfile.data.logos.map((logo: any, i: number) => (
                              <div key={i} className={`${darkMode ? 'bg-white/10' : 'bg-white'} rounded-lg p-3 text-center min-w-[100px] border ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                                {logo.formats?.[0]?.src && <img src={logo.formats[0].src} alt="" className="max-w-[80px] max-h-[50px] object-contain mx-auto mb-2" />}
                                <span className={`text-xs ${theme.textMuted} capitalize`}>{logo.type}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Colors */}
                    {selectedProfile.data.colors?.length > 0 && (
                      <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <h3 className={`font-semibold ${theme.text} mb-3 flex items-center gap-2`}>
                          <Palette className="w-4 h-4 text-pink-400" />Colors ({selectedProfile.data.colors.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.data.colors.map((c: any, i: number) => (
                            <button key={i} onClick={() => copyToClipboard(c.hex, `color-${i}`)} className={`flex items-center gap-2 ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-gray-100'} px-3 py-2 rounded-lg border ${darkMode ? 'border-white/10' : 'border-gray-200'} transition-colors group`}>
                              <div className="w-6 h-6 rounded-md shadow-sm" style={{ backgroundColor: c.hex }} />
                              <span className={`font-mono text-sm ${theme.text}`}>{c.hex}</span>
                              {copied === `color-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fonts */}
                    {selectedProfile.data.fonts?.length > 0 && (
                      <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <h3 className={`font-semibold ${theme.text} mb-3 flex items-center gap-2`}>
                          <Type className="w-4 h-4 text-orange-400" />Fonts ({selectedProfile.data.fonts.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.data.fonts.map((f: any, i: number) => (
                            <span key={i} className={`${darkMode ? 'bg-white/10' : 'bg-white'} px-4 py-2 rounded-lg text-sm ${theme.text} border ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                              {f.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    {selectedProfile.data.links?.length > 0 && (
                      <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <h3 className={`font-semibold ${theme.text} mb-3 flex items-center gap-2`}>
                          <Link2 className="w-4 h-4 text-blue-400" />Social Links ({selectedProfile.data.links.length})
                        </h3>
                        <div className="space-y-2">
                          {selectedProfile.data.links.map((link: any, i: number) => (
                            <a key={i} href={link.url} target="_blank" className={`flex items-center gap-3 ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-blue-50'} px-4 py-3 rounded-lg border ${darkMode ? 'border-white/10' : 'border-gray-200'} transition-colors`}>
                              <span className="text-lg">{getPlatformEmoji(link.url)}</span>
                              <span className={`text-sm ${theme.textMuted} truncate flex-1`}>{link.url}</span>
                              <ExternalLink className={`w-4 h-4 ${theme.textMuted}`} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw JSON */}
                    <details className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl overflow-hidden`}>
                      <summary className={`px-4 py-3 cursor-pointer font-medium ${theme.text} hover:bg-white/5`}>View Raw JSON</summary>
                      <pre className={`p-4 text-xs ${theme.textMuted} overflow-x-auto max-h-64 ${darkMode ? 'bg-black/30' : 'bg-gray-100'}`}>
                        {JSON.stringify(selectedProfile.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}

                {selectedProfile.status === 'failed' && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-400">Error</h3>
                        <p className="text-red-300 text-sm">{selectedProfile.error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <p className={`text-xs ${theme.textMuted}`}>Created: {new Date(selectedProfile.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {view === 'settings' && (
          <div className="max-w-xl mx-auto animate-fade-in">
            <div className={`${theme.card} border rounded-2xl backdrop-blur-sm overflow-hidden shadow-2xl`}>
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-6">
                <h2 className="text-xl font-bold text-white mb-1">Settings</h2>
                <p className="text-violet-200 text-sm">Configure your automation</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-2`}>Webhook URL</label>
                  <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className={`w-full px-4 py-3 ${theme.input} border-2 rounded-xl focus:ring-2 focus:ring-violet-500/50`} />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-2`}>Theme</label>
                  <button onClick={() => setDarkMode(!darkMode)} className={`w-full px-4 py-3 ${darkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-xl flex items-center justify-between ${theme.text}`}>
                    <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                    {darkMode ? <Moon className="w-5 h-5 text-violet-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className={`font-semibold ${theme.text}`}>Data Management</h3>
                  <label className={`block w-full px-4 py-3 bg-blue-500/10 text-blue-400 rounded-xl cursor-pointer hover:bg-blue-500/20 transition-colors font-medium`}>
                    <Upload className="w-4 h-4 inline mr-2" />Import Backup
                    <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                  </label>
                  <button onClick={exportAll} className="w-full px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl font-medium text-left hover:bg-emerald-500/20 transition-colors">
                    <Download className="w-4 h-4 inline mr-2" />Export Backup ({profiles.length} profiles)
                  </button>
                  <button onClick={() => { if (confirm('Clear ALL data?')) { localStorage.removeItem('employer_profiles_pro_v2'); setProfiles([]); showToast('success', 'All data cleared'); } }} className="w-full px-4 py-3 bg-red-500/10 text-red-400 rounded-xl font-medium text-left hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-4 h-4 inline mr-2" />Clear All Data
                  </button>
                </div>

                <button onClick={() => setView('dashboard')} className={`w-full py-3 rounded-xl ${theme.hover} ${theme.text} font-medium transition-colors`}>Back to Dashboard</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
