'use client';
import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Download, Eye, Grid, List, Settings, BarChart3, RefreshCw, ExternalLink, FileText, Award, FolderOpen, X, Calendar, Globe, CheckCircle, Clock, XCircle, Palette, Type, Link2, Upload, Database, ChevronDown } from 'lucide-react';

interface Profile {
  id: string;
  url: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
  data?: any;
}

export default function EmployerProfileManager() {
  const [view, setView] = useState<'dashboard' | 'generate' | 'profile-view' | 'settings'>('dashboard');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  const [url, setUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ step: '', percent: 0 });
  const [webhookUrl, setWebhookUrl] = useState('https://hook.eu2.make.com/8xsf9sha1e3c3bdznz5sii2e9j10wpi5');

  // Load profiles
  useEffect(() => {
    const stored = localStorage.getItem('employer_profiles_pro');
    if (stored) setProfiles(JSON.parse(stored));
  }, []);

  // Save profiles
  const saveProfiles = (data: Profile[]) => {
    localStorage.setItem('employer_profiles_pro', JSON.stringify(data));
    setProfiles(data);
  };

  // Generate profile
  const generateProfile = async () => {
    if (!url) return;

    const newProfile: Profile = {
      id: Date.now().toString(),
      url: url.trim(),
      status: 'processing',
      createdAt: new Date().toISOString()
    };

    const updated = [newProfile, ...profiles];
    saveProfiles(updated);
    setGenerating(true);

    const steps = [
      { step: 'Connecting to webhook...', percent: 10 },
      { step: 'Extracting domain...', percent: 20 },
      { step: 'Creating Drive folder...', percent: 35 },
      { step: 'Fetching brand data...', percent: 50 },
      { step: 'Processing logos...', percent: 65 },
      { step: 'Extracting colors & fonts...', percent: 75 },
      { step: 'Creating Google Doc...', percent: 85 },
      { step: 'Finalizing...', percent: 100 }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setProgress(steps[stepIdx]);
        stepIdx++;
      }
    }, 1500);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: url, timestamp: new Date().toISOString() })
      });

      clearInterval(interval);

      let data = {};
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch { data = { success: true }; }

      const idx = updated.findIndex(p => p.id === newProfile.id);
      updated[idx] = { ...newProfile, status: 'completed', data, completedAt: new Date().toISOString() };
      saveProfiles(updated);
      setUrl('');
      setView('dashboard');
    } catch (err: any) {
      clearInterval(interval);
      const idx = updated.findIndex(p => p.id === newProfile.id);
      updated[idx] = { ...newProfile, status: 'failed', error: err.message };
      saveProfiles(updated);
    } finally {
      setGenerating(false);
      setProgress({ step: '', percent: 0 });
    }
  };

  // Delete profile
  const deleteProfile = (id: string) => {
    if (confirm('Delete this profile?')) {
      saveProfiles(profiles.filter(p => p.id !== id));
      if (selectedProfile?.id === id) { setSelectedProfile(null); setView('dashboard'); }
    }
  };

  // Export profile
  const exportProfile = (profile: Profile, format: 'json' | 'txt' = 'json') => {
    const content = format === 'json'
      ? JSON.stringify(profile, null, 2)
      : `URL: ${profile.url}\nStatus: ${profile.status}\nCreated: ${profile.createdAt}\n\n${JSON.stringify(profile.data, null, 2)}`;
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `profile-${profile.data?.domain || profile.id}.${format}`;
    a.click();
  };

  // Bulk delete
  const bulkDelete = (status: string) => {
    if (confirm(`Delete all ${status} profiles?`)) {
      saveProfiles(profiles.filter(p => p.status !== status));
    }
  };

  // Export all
  const exportAll = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `all-profiles-${Date.now()}.json`;
    a.click();
  };

  // Import backup
  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) {
          saveProfiles([...data, ...profiles]);
          alert(`Imported ${data.length} profiles`);
        }
      } catch { alert('Invalid backup file'); }
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
      if (sortBy === 'name-asc') return a.url.localeCompare(b.url);
      return b.url.localeCompare(a.url);
    });

  // Stats
  const stats = {
    total: profiles.length,
    completed: profiles.filter(p => p.status === 'completed').length,
    processing: profiles.filter(p => p.status === 'processing').length,
    failed: profiles.filter(p => p.status === 'failed').length
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg: Record<string, { icon: any; cls: string }> = {
      completed: { icon: CheckCircle, cls: 'bg-green-100 text-green-700' },
      processing: { icon: Clock, cls: 'bg-blue-100 text-blue-700' },
      failed: { icon: XCircle, cls: 'bg-red-100 text-red-700' }
    };
    const { icon: Icon, cls } = cfg[status] || cfg.failed;
    return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cls}`}><Icon className="w-3 h-3" />{status}</span>;
  };

  const getPlatformIcon = (url: string) => {
    if (url.includes('linkedin')) return '💼';
    if (url.includes('twitter') || url.includes('x.com')) return '🐦';
    if (url.includes('facebook')) return '📘';
    if (url.includes('instagram')) return '📷';
    if (url.includes('youtube')) return '📺';
    return '🔗';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Employer Profile Pro</h1>
              <p className="text-xs text-gray-500">{stats.total} profiles • {stats.completed} completed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('dashboard')} className={`p-2 rounded-lg ${view === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}><BarChart3 className="w-5 h-5" /></button>
            <button onClick={() => setView('settings')} className={`p-2 rounded-lg ${view === 'settings' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}><Settings className="w-5 h-5" /></button>
            <button onClick={() => setView('generate')} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" />New Profile
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: stats.total, icon: Database, color: 'indigo' },
                { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'green' },
                { label: 'Processing', value: stats.processing, icon: Clock, color: 'blue' },
                { label: 'Failed', value: stats.failed, icon: XCircle, color: 'red' }
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-500 text-sm">{label}</span>
                    <Icon className={`w-5 h-5 text-${color}-500`} />
                  </div>
                  <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-xl p-3 border shadow-sm flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search profiles..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">A-Z</option>
                <option value="name-desc">Z-A</option>
              </select>
              <div className="flex gap-1">
                <button onClick={() => setDisplayMode('grid')} className={`p-2 rounded-lg ${displayMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400'}`}><Grid className="w-4 h-4" /></button>
                <button onClick={() => setDisplayMode('list')} className={`p-2 rounded-lg ${displayMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400'}`}><List className="w-4 h-4" /></button>
              </div>
              <button onClick={() => { const s = localStorage.getItem('employer_profiles_pro'); if (s) setProfiles(JSON.parse(s)); }} className="p-2 text-gray-400 hover:text-gray-600"><RefreshCw className="w-4 h-4" /></button>
            </div>

            {/* Profiles */}
            {filteredProfiles.length === 0 ? (
              <div className="bg-white rounded-xl p-12 border text-center">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Profiles</h3>
                <p className="text-gray-500 mb-4">Generate your first employer profile</p>
                <button onClick={() => setView('generate')} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium">
                  <Plus className="w-4 h-4 inline mr-1" />Generate
                </button>
              </div>
            ) : (
              <div className={displayMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
                {filteredProfiles.map(p => (
                  <div key={p.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-4">
                    <div className="flex items-start justify-between mb-2">
                      {p.data?.logos?.[0]?.formats?.[0]?.src ? (
                        <img src={p.data.logos[0].formats[0].src} alt="" className="w-10 h-10 rounded-lg object-contain bg-gray-50" />
                      ) : <Globe className="w-10 h-10 text-indigo-600" />}
                      <StatusBadge status={p.status} />
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{p.data?.name || p.url}</h3>
                    <p className="text-sm text-gray-500 truncate mb-1">{p.data?.domain || p.url}</p>
                    <p className="text-xs text-gray-400 mb-3">{new Date(p.createdAt).toLocaleString()}</p>

                    {p.status === 'completed' && p.data && (
                      <div className="flex gap-1 mb-3 flex-wrap">
                        {p.data.colors?.slice(0, 4).map((c: any, i: number) => (
                          <div key={i} className="w-4 h-4 rounded border" style={{ backgroundColor: c.hex }} />
                        ))}
                        {p.data.logos?.length > 0 && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{p.data.logos.length} logos</span>}
                        {p.data.links?.length > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p.data.links.length} links</span>}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedProfile(p); setView('profile-view'); }} className="flex-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-100 flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3" />View
                      </button>
                      <button onClick={() => exportProfile(p)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><Download className="w-4 h-4" /></button>
                      <button onClick={() => deleteProfile(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bulk Actions */}
            {profiles.length > 0 && (
              <div className="bg-white rounded-xl p-3 border shadow-sm flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Bulk Actions</span>
                <div className="flex gap-2">
                  {stats.failed > 0 && <button onClick={() => bulkDelete('failed')} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium">Delete Failed ({stats.failed})</button>}
                  <button onClick={exportAll} className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm font-medium">Export All</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate */}
        {view === 'generate' && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                <h2 className="text-xl font-bold text-white">Generate Profile</h2>
                <p className="text-indigo-100 text-sm">Enter company URL to fetch brand data</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company URL</label>
                  <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://stripe.com" disabled={generating} className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100" />
                </div>
                <button onClick={generateProfile} disabled={generating || !url} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {generating ? <><RefreshCw className="w-5 h-5 animate-spin" />Generating...</> : <><Plus className="w-5 h-5" />Generate</>}
                </button>
                {generating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-600">{progress.step}</span><span className="text-gray-400">{progress.percent}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all" style={{ width: `${progress.percent}%` }} /></div>
                  </div>
                )}
                <button onClick={() => setView('dashboard')} className="w-full bg-gray-100 text-gray-600 py-2 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Profile View */}
        {view === 'profile-view' && selectedProfile && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  {selectedProfile.data?.logos?.[0]?.formats?.[0]?.src ? (
                    <img src={selectedProfile.data.logos[0].formats[0].src} alt="" className="w-12 h-12 rounded-xl bg-white/20 object-contain p-1" />
                  ) : <Globe className="w-12 h-12" />}
                  <div>
                    <h2 className="text-xl font-bold">{selectedProfile.data?.name || selectedProfile.url}</h2>
                    <p className="text-indigo-100 text-sm">{selectedProfile.data?.domain || selectedProfile.url}</p>
                  </div>
                </div>
                <button onClick={() => { setView('dashboard'); setSelectedProfile(null); }} className="text-white/80 hover:text-white p-2"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <StatusBadge status={selectedProfile.status} />
                  <div className="flex gap-2">
                    {selectedProfile.data?.folderUrl && <a href={selectedProfile.data.folderUrl} target="_blank" className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium flex items-center gap-1"><FolderOpen className="w-4 h-4" />Drive</a>}
                    {selectedProfile.data?.docUrl && <a href={selectedProfile.data.docUrl} target="_blank" className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm font-medium flex items-center gap-1"><FileText className="w-4 h-4" />Doc</a>}
                    <button onClick={() => exportProfile(selectedProfile, 'json')} className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium flex items-center gap-1"><Download className="w-4 h-4" />JSON</button>
                    <button onClick={() => exportProfile(selectedProfile, 'txt')} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium flex items-center gap-1"><Download className="w-4 h-4" />TXT</button>
                    <button onClick={() => deleteProfile(selectedProfile.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center gap-1"><Trash2 className="w-4 h-4" />Delete</button>
                  </div>
                </div>

                {selectedProfile.status === 'completed' && selectedProfile.data && (
                  <div className="space-y-4">
                    {selectedProfile.data.description && (
                      <div className="bg-gray-50 rounded-xl p-4 border">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />Description</h3>
                        <p className="text-gray-700 text-sm">{selectedProfile.data.description}</p>
                        {selectedProfile.data.qualityScore && <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Score: {selectedProfile.data.qualityScore}</span>}
                      </div>
                    )}

                    {selectedProfile.data.logos?.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 border">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-purple-600" />Logos ({selectedProfile.data.logos.length})</h3>
                        <div className="flex flex-wrap gap-3">
                          {selectedProfile.data.logos.map((logo: any, i: number) => (
                            <div key={i} className="bg-white rounded-lg p-3 border text-center min-w-[100px]">
                              {logo.formats?.[0]?.src && <img src={logo.formats[0].src} alt="" className="max-w-[80px] max-h-[50px] object-contain mx-auto mb-1" />}
                              <span className="text-xs text-gray-500 capitalize">{logo.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedProfile.data.colors?.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 border">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Palette className="w-4 h-4 text-pink-600" />Colors ({selectedProfile.data.colors.length})</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.data.colors.map((c: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border">
                              <div className="w-6 h-6 rounded border" style={{ backgroundColor: c.hex }} />
                              <span className="font-mono text-sm">{c.hex}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedProfile.data.fonts?.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 border">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Type className="w-4 h-4 text-orange-600" />Fonts ({selectedProfile.data.fonts.length})</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.data.fonts.map((f: any, i: number) => (
                            <span key={i} className="bg-white px-3 py-1.5 rounded-lg border text-sm">{f.name}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedProfile.data.links?.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 border">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Link2 className="w-4 h-4 text-blue-600" />Social Links ({selectedProfile.data.links.length})</h3>
                        <div className="space-y-2">
                          {selectedProfile.data.links.map((link: any, i: number) => (
                            <a key={i} href={link.url} target="_blank" className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border hover:bg-blue-50 transition-colors text-sm">
                              <span>{getPlatformIcon(link.url)}</span>
                              <span className="truncate flex-1 text-gray-600">{link.url}</span>
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <details className="bg-gray-50 rounded-xl border">
                      <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700">Raw JSON</summary>
                      <pre className="p-4 text-xs text-gray-600 overflow-x-auto max-h-48 bg-gray-100">{JSON.stringify(selectedProfile.data, null, 2)}</pre>
                    </details>
                  </div>
                )}

                {selectedProfile.status === 'failed' && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div><h3 className="font-semibold text-red-800">Error</h3><p className="text-red-700 text-sm">{selectedProfile.error}</p></div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400">Created: {new Date(selectedProfile.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {view === 'settings' && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                <h2 className="text-xl font-bold text-white">Settings</h2>
                <p className="text-indigo-100 text-sm">Configure your automation</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                  <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Data Management</h3>

                  <label className="block w-full px-4 py-3 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 text-sm font-medium">
                    <Upload className="w-4 h-4 inline mr-2" />Import Backup
                    <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                  </label>

                  <button onClick={exportAll} className="w-full px-4 py-3 bg-green-50 text-green-600 rounded-lg text-sm font-medium text-left hover:bg-green-100">
                    <Download className="w-4 h-4 inline mr-2" />Export Backup ({profiles.length} profiles)
                  </button>

                  <button onClick={() => { if (confirm('Clear ALL data?')) { localStorage.removeItem('employer_profiles_pro'); setProfiles([]); } }} className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium text-left hover:bg-red-100">
                    <Trash2 className="w-4 h-4 inline mr-2" />Clear All Data
                  </button>
                </div>

                <button onClick={() => setView('dashboard')} className="w-full bg-gray-100 text-gray-600 py-2 rounded-lg">Back</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
