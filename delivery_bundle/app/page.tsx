import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Download, Eye, Filter, Grid, List, Settings, BarChart3, RefreshCw, ExternalLink, FileText, Award, FolderOpen, X, Calendar, Globe, CheckCircle, Clock, XCircle, Image, Palette, Type, Link2 } from 'lucide-react';

export default function EmployerProfileManager() {
  const [view, setView] = useState('dashboard');
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [displayMode, setDisplayMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  const [url, setUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ step: '', percent: 0 });
  const [webhookUrl, setWebhookUrl] = useState('https://hook.eu2.make.com/8xsf9sha1e3c3bdznz5sii2e9j10wpi5');

  useEffect(() => {
    const stored = localStorage.getItem('employer_profiles_v2');
    if (stored) {
      setProfiles(JSON.parse(stored));
    }
  }, []);

  const saveProfiles = (data) => {
    localStorage.setItem('employer_profiles_v2', JSON.stringify(data));
    setProfiles(data);
  };

  const generateProfile = async () => {
    if (!url) return;

    const newProfile = {
      id: Date.now().toString(),
      url: url,
      status: 'processing',
      createdAt: new Date().toISOString(),
      progress: 0
    };

    const updated = [newProfile, ...profiles];
    saveProfiles(updated);
    setGenerating(true);

    const steps = [
      { step: 'Connecting to webhook...', percent: 10 },
      { step: 'Extracting domain...', percent: 25 },
      { step: 'Fetching brand data...', percent: 50 },
      { step: 'Processing logos...', percent: 70 },
      { step: 'Creating Google Doc...', percent: 85 },
      { step: 'Finalizing...', percent: 100 }
    ];

    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < steps.length) {
        setGenerationProgress(steps[currentStep]);
        currentStep++;
      }
    }, 2000);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: url,
          timestamp: new Date().toISOString()
        })
      });

      clearInterval(progressInterval);
      setGenerationProgress({ step: 'Processing response...', percent: 95 });

      let data = {};
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try { data = JSON.parse(text); } catch { data = { success: true }; }
      }

      const completedProfile = {
        ...newProfile,
        status: 'completed',
        data: data,
        completedAt: new Date().toISOString()
      };

      const idx = updated.findIndex(p => p.id === newProfile.id);
      updated[idx] = completedProfile;
      saveProfiles(updated);

      setUrl('');
      setView('dashboard');
    } catch (err) {
      clearInterval(progressInterval);
      const idx = updated.findIndex(p => p.id === newProfile.id);
      updated[idx] = { ...updated[idx], status: 'failed', error: err.message };
      saveProfiles(updated);
    } finally {
      setGenerating(false);
      setGenerationProgress({ step: '', percent: 0 });
    }
  };

  const deleteProfile = (id) => {
    if (window.confirm('Delete this profile?')) {
      const updated = profiles.filter(p => p.id !== id);
      saveProfiles(updated);
      if (selectedProfile?.id === id) {
        setSelectedProfile(null);
        setView('dashboard');
      }
    }
  };

  const exportProfile = (profile) => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile-${profile.data?.domain || profile.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bulkDelete = (status) => {
    if (window.confirm(`Delete all ${status} profiles?`)) {
      const updated = profiles.filter(p => p.status !== status);
      saveProfiles(updated);
    }
  };

  const getFilteredProfiles = () => {
    let filtered = [...profiles];
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.data?.name && p.data.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name-asc': return a.url.localeCompare(b.url);
        case 'name-desc': return b.url.localeCompare(a.url);
        default: return 0;
      }
    });
    return filtered;
  };

  const filteredProfiles = getFilteredProfiles();

  const stats = {
    total: profiles.length,
    completed: profiles.filter(p => p.status === 'completed').length,
    processing: profiles.filter(p => p.status === 'processing').length,
    failed: profiles.filter(p => p.status === 'failed').length
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { icon: any; className: string; label: string }> = {
      completed: { icon: CheckCircle, className: 'bg-green-100 text-green-700', label: 'Completed' },
      processing: { icon: Clock, className: 'bg-blue-100 text-blue-700', label: 'Processing' },
      failed: { icon: XCircle, className: 'bg-red-100 text-red-700', label: 'Failed' }
    };
    const { icon: Icon, className, label } = config[status] || config.failed;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${className}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  const getPlatformIcon = (url: string) => {
    if (url.includes('linkedin')) return '💼';
    if (url.includes('twitter') || url.includes('x.com')) return '🐦';
    if (url.includes('facebook')) return '📘';
    if (url.includes('instagram')) return '📷';
    if (url.includes('youtube')) return '📺';
    if (url.includes('github')) return '💻';
    return '🔗';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Employer Profile Manager</h1>
                <p className="text-sm text-gray-500">{stats.total} profiles • {stats.completed} completed</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('settings')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${view === 'settings' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('generate')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total', value: stats.total, icon: FolderOpen, color: 'gray' },
                { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'green' },
                { label: 'Processing', value: stats.processing, icon: Clock, color: 'blue' },
                { label: 'Failed', value: stats.failed, icon: XCircle, color: 'red' }
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm font-medium">{label}</span>
                    <Icon className={`w-5 h-5 text-${color}-500`} />
                  </div>
                  <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search profiles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="date-desc">Newest</option>
                    <option value="date-asc">Oldest</option>
                    <option value="name-asc">A-Z</option>
                    <option value="name-desc">Z-A</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDisplayMode('grid')} className={`p-2 rounded-lg ${displayMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}>
                    <Grid className="w-5 h-5" />
                  </button>
                  <button onClick={() => setDisplayMode('list')} className={`p-2 rounded-lg ${displayMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}>
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Profiles */}
            {filteredProfiles.length === 0 ? (
              <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Profiles Found</h3>
                <p className="text-gray-600 mb-6">Generate your first employer profile</p>
                <button onClick={() => setView('generate')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold">
                  <Plus className="w-5 h-5 inline mr-2" />Generate Profile
                </button>
              </div>
            ) : (
              <div className={displayMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-3'}>
                {filteredProfiles.map(profile => (
                  <div key={profile.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all p-5">
                    <div className="flex items-start justify-between mb-3">
                      {profile.data?.logos?.[0]?.formats?.[0]?.src ? (
                        <img src={profile.data.logos[0].formats[0].src} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-gray-100" />
                      ) : (
                        <Globe className="w-10 h-10 text-blue-600" />
                      )}
                      <StatusBadge status={profile.status} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1 truncate">{profile.data?.name || profile.url}</h3>
                    <p className="text-sm text-gray-500 mb-1 truncate">{profile.data?.domain || profile.url}</p>
                    <p className="text-xs text-gray-400 mb-4">{new Date(profile.createdAt).toLocaleDateString()}</p>

                    {/* Quick data preview */}
                    {profile.status === 'completed' && profile.data && (
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {profile.data.colors?.length > 0 && (
                          <div className="flex items-center gap-1">
                            {profile.data.colors.slice(0, 4).map((c: any, i: number) => (
                              <div key={i} className="w-4 h-4 rounded" style={{ backgroundColor: c.hex }} />
                            ))}
                          </div>
                        )}
                        {profile.data.logos?.length > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            {profile.data.logos.length} logos
                          </span>
                        )}
                        {profile.data.links?.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {profile.data.links.length} links
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button onClick={() => { setSelectedProfile(profile); setView('profile-view'); }} className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-1">
                        <Eye className="w-4 h-4" />View
                      </button>
                      <button onClick={() => exportProfile(profile)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteProfile(profile.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bulk Actions */}
            {profiles.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Bulk Actions</h4>
                <div className="flex gap-2">
                  {stats.failed > 0 && (
                    <button onClick={() => bulkDelete('failed')} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                      Delete Failed ({stats.failed})
                    </button>
                  )}
                  <button onClick={() => {
                    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `all-profiles-${Date.now()}.json`;
                    a.click();
                  }} className="px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium">
                    Export All
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate View */}
        {view === 'generate' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white mb-2">Generate New Profile</h2>
                <p className="text-blue-100">Enter a company website to fetch brand data</p>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Website URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://stripe.com"
                    disabled={generating}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <button
                  onClick={generateProfile}
                  disabled={generating || !url}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {generating ? <><RefreshCw className="w-5 h-5 animate-spin" />Generating...</> : <><Plus className="w-5 h-5" />Generate Profile</>}
                </button>

                {generating && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{generationProgress.step}</span>
                      <span className="text-gray-500">{generationProgress.percent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all" style={{ width: `${generationProgress.percent}%` }} />
                    </div>
                  </div>
                )}

                <button onClick={() => setView('dashboard')} className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile View */}
        {view === 'profile-view' && selectedProfile && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-4 text-white">
                  {selectedProfile.data?.logos?.[0]?.formats?.[0]?.src ? (
                    <img src={selectedProfile.data.logos[0].formats[0].src} alt="Logo" className="w-12 h-12 rounded-xl bg-white/20 object-contain p-1" />
                  ) : (
                    <Globe className="w-12 h-12" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{selectedProfile.data?.name || selectedProfile.url}</h2>
                    <p className="text-blue-100">{selectedProfile.data?.domain || selectedProfile.url}</p>
                  </div>
                </div>
                <button onClick={() => { setView('dashboard'); setSelectedProfile(null); }} className="text-white hover:bg-white/20 p-2 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <StatusBadge status={selectedProfile.status} />
                  <div className="flex gap-2">
                    {selectedProfile.data?.folderUrl && (
                      <a href={selectedProfile.data.folderUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />Drive
                      </a>
                    )}
                    {selectedProfile.data?.docUrl && (
                      <a href={selectedProfile.data.docUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium flex items-center gap-1">
                        <FileText className="w-4 h-4" />Doc
                      </a>
                    )}
                    <button onClick={() => exportProfile(selectedProfile)} className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium flex items-center gap-1">
                      <Download className="w-4 h-4" />Export
                    </button>
                    <button onClick={() => { deleteProfile(selectedProfile.id); }} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center gap-1">
                      <Trash2 className="w-4 h-4" />Delete
                    </button>
                  </div>
                </div>

                {selectedProfile.status === 'completed' && selectedProfile.data && (
                  <>
                    {/* Description */}
                    {selectedProfile.data.description && (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />Description
                        </h3>
                        <p className="text-gray-700">{selectedProfile.data.description}</p>
                        {selectedProfile.data.qualityScore && (
                          <div className="mt-3 inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            Quality Score: {selectedProfile.data.qualityScore}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Logos */}
                    {selectedProfile.data.logos?.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Image className="w-5 h-5 text-purple-600" />Logos ({selectedProfile.data.logos.length})
                        </h3>
                        <div className="flex flex-wrap gap-4">
                          {selectedProfile.data.logos.map((logo: any, i: number) => (
                            <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 text-center min-w-[120px]">
                              {logo.formats?.[0]?.src && (
                                <img src={logo.formats[0].src} alt={logo.type} className="max-w-[100px] max-h-[60px] object-contain mx-auto mb-2" />
                              )}
                              <span className="text-xs text-gray-500 capitalize">{logo.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Colors */}
                    {selectedProfile.data.colors?.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Palette className="w-5 h-5 text-pink-600" />Brand Colors ({selectedProfile.data.colors.length})
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {selectedProfile.data.colors.map((color: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                              <div className="w-8 h-8 rounded-md border border-gray-300" style={{ backgroundColor: color.hex }} />
                              <span className="font-mono text-sm text-gray-700">{color.hex}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fonts */}
                    {selectedProfile.data.fonts?.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Type className="w-5 h-5 text-orange-600" />Typography ({selectedProfile.data.fonts.length})
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {selectedProfile.data.fonts.map((font: any, i: number) => (
                            <div key={i} className="bg-white px-4 py-2 rounded-lg border border-gray-200">
                              <span className="font-medium text-gray-900">{font.name}</span>
                              {font.type && <span className="text-xs text-gray-500 ml-2 capitalize">{font.type}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Social Links */}
                    {selectedProfile.data.links?.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Link2 className="w-5 h-5 text-blue-600" />Social Links ({selectedProfile.data.links.length})
                        </h3>
                        <div className="space-y-2">
                          {selectedProfile.data.links.map((link: any, i: number) => (
                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors">
                              <span className="text-xl">{getPlatformIcon(link.url)}</span>
                              <span className="text-gray-700 text-sm truncate flex-1">{link.url}</span>
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw JSON */}
                    <details className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                      <summary className="px-6 py-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100">
                        View Raw JSON Data
                      </summary>
                      <pre className="p-6 text-xs text-gray-600 overflow-x-auto max-h-64 bg-gray-100">
                        {JSON.stringify(selectedProfile.data, null, 2)}
                      </pre>
                    </details>
                  </>
                )}

                {selectedProfile.status === 'failed' && selectedProfile.error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-red-800 mb-1">Error</h3>
                        <p className="text-red-700">{selectedProfile.error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings View */}
        {view === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
                <p className="text-blue-100">Configure your automation</p>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Webhook URL</label>
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Data Management</h3>
                  <button
                    onClick={() => {
                      if (window.confirm('Clear all profile data?')) {
                        localStorage.removeItem('employer_profiles_v2');
                        setProfiles([]);
                      }
                    }}
                    className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium text-left"
                  >
                    Clear All Data
                  </button>
                </div>

                <button onClick={() => setView('dashboard')} className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
