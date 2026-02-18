'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Plus, Trash2, Download, Eye, Grid, List, Settings, BarChart3,
  RefreshCw, ExternalLink, FileText, Award, FolderOpen, X, Globe,
  CheckCircle, Clock, XCircle, Palette, Type, Link2, Upload, Database,
  Moon, Sun, Copy, Check, Zap, Activity, TrendingUp, ChevronDown, ChevronUp,
  Filter, Table, ArrowUpDown, ArrowUp, ArrowDown, Calendar, Building2,
  ChevronLeft, ChevronRight, Maximize2, Pencil
} from 'lucide-react';
import OnboardingModal from './components/OnboardingModal';
import ProfileEditor from './components/ProfileEditor';

type ImageItem = { formats?: Array<{ src: string; format: string }>; src?: string } | string;

interface Profile {
  id: string;
  url: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
  data?: {
    success?: boolean;
    domain?: string;
    name?: string;
    description?: string;
    employerText?: string;
    matchedBenefits?: string;
    folderUrl?: string;
    docUrl?: string;
    qualityScore?: number;
    logos?: Array<{ type: string; formats: Array<{ src: string; format: string }> }>;
    images?: ImageItem[];
    colors?: Array<{ hex: string; type: string; brightness: number }>;
    fonts?: Array<{ name: string; type: string }>;
    links?: Array<{ url: string; name: string }>;
  };
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function EmployerProfilePro() {
  // State
  const [view, setView] = useState<'dashboard' | 'table' | 'generate' | 'profile' | 'settings'>('dashboard');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list' | 'table'>('grid');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortField, setSortField] = useState<'createdAt' | 'name' | 'domain' | 'status'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Form
  const [url, setUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ step: '', percent: 0 });
  const [webhookUrl, setWebhookUrl] = useState('https://hook.eu2.make.com/8xsf9sha1e3c3bdznz5sii2e9j10wpi5');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [googleCx, setGoogleCx] = useState('');

  // UI
  const [darkMode, setDarkMode] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);

  // Autocomplete
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const matched = profiles.filter(p =>
      p.data?.name?.toLowerCase().includes(lower) ||
      p.data?.domain?.toLowerCase().includes(lower) ||
      p.url.toLowerCase().includes(lower)
    ).slice(0, 5);
    setSuggestions(matched);
  }, [searchTerm, profiles]);

  const selectSuggestion = (profile: Profile) => {
    setSearchTerm(profile.data?.name || profile.data?.domain || '');
    setSuggestions([]);
    setSelectedProfile(profile);
    setView('profile');
  };

  // Load data
  useEffect(() => {
    const stored = localStorage.getItem('employer_profiles_v3');
    if (stored) setProfiles(JSON.parse(stored));
    const theme = localStorage.getItem('theme');
    if (theme) setDarkMode(theme === 'dark');
    const storedWebhook = localStorage.getItem('webhook_url');
    if (storedWebhook) setWebhookUrl(storedWebhook);
    const storedGoogleApiKey = localStorage.getItem('google_api_key');
    if (storedGoogleApiKey) setGoogleApiKey(storedGoogleApiKey);
    const storedGoogleCx = localStorage.getItem('google_cx');
    if (storedGoogleCx) setGoogleCx(storedGoogleCx);
  }, []);

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem('webhook_url', webhookUrl);
  }, [webhookUrl]);

  useEffect(() => {
    localStorage.setItem('google_api_key', googleApiKey);
  }, [googleApiKey]);

  useEffect(() => {
    localStorage.setItem('google_cx', googleCx);
  }, [googleCx]);

  // Toast
  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // Save with functional update support to avoid stale closures
  const updateProfilesState = useCallback((updater: (prev: Profile[]) => Profile[]) => {
    setProfiles(prev => {
      const newState = updater(prev);
      try {
        localStorage.setItem('employer_profiles_v3', JSON.stringify(newState));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
        showToast('error', 'Storage full - failed to save data');
      }
      return newState;
    });
  }, [showToast]);

  // Legacy save wrapper for compatibility
  const saveProfiles = useCallback((data: Profile[]) => {
    updateProfilesState(() => data);
  }, [updateProfilesState]);

  const handleProfileUpdate = useCallback((updatedProfile: Profile) => {
    updateProfilesState(prev => {
        const idx = prev.findIndex(p => p.id === updatedProfile.id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = updatedProfile;
        return next;
    });
    setSelectedProfile(updatedProfile);
    showToast('success', 'Profile updated');
  }, [updateProfilesState, showToast]);

  // Theme
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Copy
  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    showToast('success', 'Copied!');
  }, [showToast]);

  const scrapeImages = useCallback(async (targetUrl: string) => {
    try {
      const response = await fetch('/api/scrape-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      if (!response.ok) return { images: [], logos: [], text: "", links: [] };
      const payload = await response.json();
      return {
        images: Array.isArray(payload.images) ? payload.images.filter(Boolean) : [],
        logos: Array.isArray(payload.logos) ? payload.logos : [],
        text: payload.text || "",
        links: Array.isArray(payload.links) ? payload.links : []
      };
    } catch {
      return { images: [], logos: [], text: "", links: [] };
    }
  }, []);

  const googleImageSearch = useCallback(async (query: string, apiKey: string, cx: string) => {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${apiKey}&searchType=image&num=10&imgSize=large`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      return data.items?.map((item: any) => item.link) || [];
    } catch (e) {
      console.error("Google Image Search failed", e);
      return [];
    }
  }, []);

  const formatFromUrl = useCallback((imageUrl: string) => {
    const match = imageUrl.match(/\.(jpg|jpeg|png|webp|gif|avif)(?:$|[?#])/i);
    return match ? match[1].toLowerCase() : 'image';
  }, []);

  const buildImagePayload = useCallback((urls: string[]) => {
    return urls.map(url => ({
      formats: [{ src: url, format: formatFromUrl(url) }]
    }));
  }, [formatFromUrl]);

  const normalizeImages = useCallback((input: unknown, fallback: string[] = []) => {
    const collected: ImageItem[] = [];
    const addValue = (value: unknown) => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach(addValue);
        return;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return;
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          try {
            const parsed = JSON.parse(trimmed);
            addValue(parsed);
            return;
          } catch {
            collected.push(trimmed);
            return;
          }
        }
        collected.push(trimmed);
        return;
      }
      if (typeof value === 'object') {
        const candidate = value as { formats?: Array<{ src: string; format: string }>; src?: string };
        if (candidate.formats || candidate.src) {
          collected.push(candidate as ImageItem);
        }
      }
    };

    addValue(input);
    fallback.forEach(addValue);

    const seen = new Set<string>();
    const unique: ImageItem[] = [];
    collected.forEach(item => {
      const src = typeof item === 'string' ? item : item.formats?.[0]?.src || item.src || '';
      if (!src || seen.has(src)) return;
      seen.add(src);
      unique.push(item);
    });

    return unique;
  }, []);

  // Generate
  const generateProfile = async () => {
    const normalizedUrl = url.trim();
    if (!normalizedUrl) return;

    const newProfile: Profile = {
      id: Date.now().toString(),
      url: normalizedUrl,
      status: 'processing',
      createdAt: new Date().toISOString()
    };

    updateProfilesState(prev => [newProfile, ...prev]);
    setGenerating(true);
    showToast('info', 'Starting generation...');

    const steps = [
      { step: 'Connecting...', percent: 10 },
      { step: 'Extracting domain...', percent: 20 },
      { step: 'Scraping content...', percent: 35 },
      { step: 'Analyzing text...', percent: 50 },
      { step: 'Fetching brand data...', percent: 65 },
      { step: 'Processing logos...', percent: 78 },
      { step: 'Extracting colors...', percent: 88 },
      { step: 'Creating document...', percent: 95 },
      { step: 'Finalizing...', percent: 100 }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) { setProgress(steps[stepIdx]); stepIdx++; }
    }, 1200);

    // Scrape Site
    const { images: initialScrapedImages, logos: initialScrapedLogos, text: scrapedText, links: scrapedLinks } = await scrapeImages(normalizedUrl);
    let allImages = [...initialScrapedImages];

    // Fallback: Google Image Search if few images found and API keys are present
    if (allImages.length < 5 && googleApiKey && googleCx) {
        try {
            const domain = new URL(normalizedUrl).hostname;
            const companyName = domain.replace('www.', '').split('.')[0];
            const query = `site:${domain} team OR office OR employees OR working`;
            const googleImages = await googleImageSearch(query, googleApiKey, googleCx);
            allImages = [...allImages, ...googleImages];
            showToast('info', `Fetched ${googleImages.length} images from Google`);
        } catch (e) {
            console.error('Google Fallback failed', e);
        }
    }

    const payload: Record<string, unknown> = {
      website: normalizedUrl,
      timestamp: new Date().toISOString(),
      description: scrapedText, // Pass scraped text for better benefit matching
      links: scrapedLinks // Pass scraped social links
    };
    if (allImages.length > 0) payload.images = buildImagePayload(allImages);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Clear interval immediately when response returns
      clearInterval(interval);
      setProgress({ step: 'Processing response...', percent: 100 });

      let data = {};
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch {
        // Handle non-JSON response (e.g., "Accepted")
        console.warn('Response is not JSON:', responseText);
        data = { success: true, raw: responseText };
      }

      if (!response.ok) {
        throw new Error(response.statusText || 'Webhook failed');
      }

      const normalizedData = {
        ...(typeof data === 'object' && data ? data : {}),
        images: normalizeImages((data as { images?: unknown }).images, allImages),
        logos: (data as any).logos?.length ? (data as any).logos :
               (initialScrapedLogos.length > 0 ? initialScrapedLogos.map((url: string) => ({ type: 'fetched', formats: [{ src: url, format: formatFromUrl(url) }] })) : [])
      };

      updateProfilesState(prev => {
        const idx = prev.findIndex(p => p.id === newProfile.id);
        if (idx === -1) return prev; // Profile was deleted
        const next = [...prev];
        next[idx] = { ...newProfile, status: 'completed', data: normalizedData, completedAt: new Date().toISOString() };
        return next;
      });

      setUrl('');
      setView('table');
      showToast('success', 'Profile generated!');
    } catch (err: any) {
      clearInterval(interval);
      console.error('Generation error:', err);
      updateProfilesState(prev => {
        const idx = prev.findIndex(p => p.id === newProfile.id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...newProfile, status: 'failed', error: err.message || 'Unknown error' };
        return next;
      });
      showToast('error', `Failed: ${err.message}`);
    } finally {
      setGenerating(false);
      setProgress({ step: '', percent: 0 });
    }
  };

  // Delete
  const deleteProfile = (id: string) => {
    updateProfilesState(prev => prev.filter(p => p.id !== id));
    if (selectedProfile?.id === id) { setSelectedProfile(null); setView('table'); }
    showToast('success', 'Deleted');
  };

  // Bulk delete
  const bulkDelete = () => {
    if (selectedRows.size === 0) return;
    if (!confirm(`Delete ${selectedRows.size} profiles?`)) return;
    updateProfilesState(prev => prev.filter(p => !selectedRows.has(p.id)));
    setSelectedRows(new Set());
    showToast('success', `Deleted ${selectedRows.size} profiles`);
  };

  // Export
  const exportProfiles = (profilesToExport: Profile[], format: 'json' | 'csv' = 'json') => {
    let content: string;
    let type: string;
    let ext: string;

    if (format === 'csv') {
      const headers = ['ID', 'URL', 'Domain', 'Name', 'Status', 'Created', 'Colors', 'Logos', 'Fonts', 'Links', 'Score'];
      const rows = profilesToExport.map(p => [
        p.id,
        p.url,
        p.data?.domain || '',
        p.data?.name || '',
        p.status,
        new Date(p.createdAt).toLocaleString(),
        p.data?.colors?.map(c => c.hex).join('; ') || '',
        p.data?.logos?.length || 0,
        p.data?.fonts?.map(f => f.name).join('; ') || '',
        p.data?.links?.map(l => l.url).join('; ') || '',
        p.data?.qualityScore || ''
      ]);
      content = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      type = 'text/csv';
      ext = 'csv';
    } else {
      content = JSON.stringify(profilesToExport, null, 2);
      type = 'application/json';
      ext = 'json';
    }

    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `profiles-${Date.now()}.${ext}`;
    a.click();
    showToast('success', `Exported ${profilesToExport.length} profiles`);
  };

  // Import
  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) {
          updateProfilesState(prev => [...data, ...prev]);
          showToast('success', `Imported ${data.length} profiles`);
        }
      } catch { showToast('error', 'Invalid file'); }
    };
    reader.readAsText(file);
  };

  // Filter & Sort
  const filteredProfiles = useMemo(() => {
    let result = [...profiles];

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus);
    }

    // Date filter
    if (filterDateFrom) {
      result = result.filter(p => new Date(p.createdAt) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      result = result.filter(p => new Date(p.createdAt) <= new Date(filterDateTo + 'T23:59:59'));
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.url.toLowerCase().includes(term) ||
        p.data?.name?.toLowerCase().includes(term) ||
        p.data?.domain?.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'name': aVal = a.data?.name || a.url; bVal = b.data?.name || b.url; break;
        case 'domain': aVal = a.data?.domain || ''; bVal = b.data?.domain || ''; break;
        case 'status': aVal = a.status; bVal = b.status; break;
        default: aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime();
      }
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [profiles, filterStatus, filterDateFrom, filterDateTo, searchTerm, sortField, sortDirection]);

  // Stats
  const stats = useMemo(() => ({
    total: profiles.length,
    completed: profiles.filter(p => p.status === 'completed').length,
    processing: profiles.filter(p => p.status === 'processing').length,
    failed: profiles.filter(p => p.status === 'failed').length,
    withLogos: profiles.filter(p => p.data?.logos?.length).length,
    withColors: profiles.filter(p => p.data?.colors?.length).length
  }), [profiles]);

  // Toggle sort
  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Toggle row selection
  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle all rows
  const toggleAllRows = () => {
    if (selectedRows.size === filteredProfiles.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredProfiles.map(p => p.id)));
    }
  };

  // Helpers
  const getImageSrc = useCallback((image: ImageItem) => {
    if (!image) return '';
    if (typeof image === 'string') return image;
    return image.formats?.[0]?.src || image.src || '';
  }, []);
  const getInitials = (url: string) => { try { return new URL(url).hostname.substring(0, 2).toUpperCase(); } catch { return '??'; } };
  const getPlatformEmoji = (url: string) => {
    if (url.includes('linkedin')) return '💼';
    if (url.includes('twitter') || url.includes('x.com')) return '𝕏';
    if (url.includes('facebook')) return '📘';
    if (url.includes('instagram')) return '📷';
    if (url.includes('youtube')) return '📺';
    return '🔗';
  };

  const imageUrls = useMemo(() => {
    if (!selectedProfile?.data?.images) return [];
    return selectedProfile.data.images.map(getImageSrc).filter(Boolean);
  }, [selectedProfile, getImageSrc]);
  const heroImage = imageUrls[0] || '';

  const openGallery = useCallback((index: number) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  }, []);

  const closeGallery = useCallback(() => {
    setGalleryOpen(false);
  }, []);

  const showNext = useCallback(() => {
    setGalleryIndex(current => (imageUrls.length ? (current + 1) % imageUrls.length : 0));
  }, [imageUrls.length]);

  const showPrev = useCallback(() => {
    setGalleryIndex(current => (imageUrls.length ? (current - 1 + imageUrls.length) % imageUrls.length : 0));
  }, [imageUrls.length]);

  useEffect(() => {
    setGalleryIndex(0);
    setGalleryOpen(false);
  }, [selectedProfile?.id]);

  useEffect(() => {
    if (!galleryOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeGallery();
      if (event.key === 'ArrowRight') showNext();
      if (event.key === 'ArrowLeft') showPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [galleryOpen, closeGallery, showNext, showPrev]);

  useEffect(() => {
    if (galleryIndex >= imageUrls.length) {
      setGalleryIndex(0);
    }
  }, [galleryIndex, imageUrls.length]);

  // Theme classes
  const t = {
    bg: darkMode ? 'bg-[#0a0f1a]' : 'bg-gray-50',
    card: darkMode ? 'bg-[#111827]/90 border-white/10' : 'bg-white border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    muted: darkMode ? 'text-gray-400' : 'text-gray-500',
    input: darkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900',
    hover: darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100',
    tableRow: darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50',
    tableBorder: darkMode ? 'border-white/10' : 'border-gray-200'
  };

  return (
    <div className={`min-h-screen ${t.bg} transition-colors`}>
      <OnboardingModal />
      {/* Background */}
      {darkMode && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        </div>
      )}

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-4 py-3 rounded-xl shadow-lg backdrop-blur flex items-center gap-2 animate-slide-in ${toast.type === 'success' ? 'bg-emerald-500/90' : toast.type === 'error' ? 'bg-red-500/90' : 'bg-blue-500/90'
            } text-white`}>
            {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
            {toast.type === 'error' && <XCircle className="w-4 h-4" />}
            {toast.type === 'info' && <Activity className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className={`${t.card} border-b backdrop-blur-xl sticky top-0 z-50`}>
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${t.text}`}>Employer Profile Pro</h1>
              <p className={`text-xs ${t.muted}`}>{stats.total} profiles • {stats.completed} completed</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${t.hover}`}>
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
            <button onClick={() => { setView('table'); setDisplayMode('table'); }} className={`p-2 rounded-lg ${view === 'table' ? 'bg-violet-600/20 text-violet-400' : t.muted} ${t.hover}`}>
              <Table className="w-5 h-5" />
            </button>
            <button onClick={() => { setView('dashboard'); setDisplayMode('grid'); }} className={`p-2 rounded-lg ${view === 'dashboard' ? 'bg-violet-600/20 text-violet-400' : t.muted} ${t.hover}`}>
              <Grid className="w-5 h-5" />
            </button>
            <button onClick={() => setView('settings')} title="Settings" className={`p-2 rounded-lg ${view === 'settings' ? 'bg-violet-600/20 text-violet-400' : t.muted} ${t.hover}`}>
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={() => setView('generate')} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-violet-600/25 hover:shadow-xl transition-all">
              <Plus className="w-4 h-4" />Create New Profile
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-6 relative z-10">
        {/* Table View */}
        {(view === 'table' || view === 'dashboard') && displayMode === 'table' && (
          <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total', value: stats.total, icon: Database, color: 'violet' },
                { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'emerald' },
                { label: 'Processing', value: stats.processing, icon: RefreshCw, color: 'blue' },
                { label: 'Failed', value: stats.failed, icon: XCircle, color: 'red' },
                { label: 'With Logos', value: stats.withLogos, icon: Award, color: 'purple' },
                { label: 'With Colors', value: stats.withColors, icon: Palette, color: 'pink' }
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={`${t.card} border rounded-xl p-4 backdrop-blur`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${t.muted}`}>{label}</span>
                    <Icon className={`w-4 h-4 text-${color}-400`} />
                  </div>
                  <p className={`text-2xl font-bold ${t.text}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className={`${t.card} border rounded-xl p-3 backdrop-blur`}>
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className={`absolute left-3 top-2.5 w-4 h-4 ${t.muted}`} />
                  <input
                    type="text"
                    placeholder="Search by URL, name, domain..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 ${t.input} rounded-lg text-sm border focus:ring-2 focus:ring-violet-500/50`}
                  />
                  {suggestions.length > 0 && (
                    <div className={`absolute top-full left-0 right-0 mt-1 ${t.card} border rounded-lg shadow-xl z-50 overflow-hidden`}>
                      {suggestions.map(s => (
                        <button key={s.id} onClick={() => selectSuggestion(s)} className={`w-full text-left px-4 py-2 text-sm ${t.hover} flex items-center gap-3`}>
                           {s.data?.logos?.[0]?.formats?.[0]?.src ? (
                             <img src={s.data.logos[0].formats[0].src} alt="" className="w-5 h-5 rounded object-contain bg-white/10" />
                           ) : (
                             <div className="w-5 h-5 bg-violet-600 rounded flex items-center justify-center text-[10px] text-white font-bold">
                               {getInitials(s.url)}
                             </div>
                           )}
                           <span className={t.text}>{s.data?.name || s.data?.domain || s.url}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter Toggle */}
                <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-2 ${t.input} border rounded-lg text-sm flex items-center gap-2 ${showFilters ? 'ring-2 ring-violet-500/50' : ''}`}>
                  <Filter className="w-4 h-4" />
                  Filters
                  {(filterStatus !== 'all' || filterDateFrom || filterDateTo) && (
                    <span className="w-2 h-2 bg-violet-500 rounded-full" />
                  )}
                </button>

                {/* Quick Status Filter */}
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`px-3 py-2 ${t.input} border rounded-lg text-sm`}>
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                  {selectedRows.size > 0 && (
                    <>
                      <span className={`text-sm ${t.muted}`}>{selectedRows.size} selected</span>
                      <button onClick={bulkDelete} className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => exportProfiles(profiles.filter(p => selectedRows.has(p.id)), 'csv')} className="px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20">
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => exportProfiles(filteredProfiles, 'csv')} className={`px-3 py-2 ${t.hover} ${t.muted} rounded-lg text-sm flex items-center gap-1`}>
                    <Download className="w-4 h-4" />Export CSV
                  </button>
                  <button onClick={() => { const s = localStorage.getItem('employer_profiles_v3'); if (s) setProfiles(JSON.parse(s)); showToast('info', 'Refreshed'); }} className={`px-3 py-2 ${t.muted} ${t.hover} rounded-lg text-sm flex items-center gap-1`} title="Refresh Data">
                    <RefreshCw className="w-4 h-4" />Refresh
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className={`mt-3 pt-3 border-t ${t.tableBorder} flex flex-wrap gap-3`}>
                  <div>
                    <label className={`block text-xs ${t.muted} mb-1`}>From Date</label>
                    <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className={`px-3 py-1.5 ${t.input} border rounded-lg text-sm`} />
                  </div>
                  <div>
                    <label className={`block text-xs ${t.muted} mb-1`}>To Date</label>
                    <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className={`px-3 py-1.5 ${t.input} border rounded-lg text-sm`} />
                  </div>
                  <button onClick={() => { setFilterStatus('all'); setFilterDateFrom(''); setFilterDateTo(''); setSearchTerm(''); }} className={`self-end px-3 py-1.5 ${t.hover} ${t.muted} rounded-lg text-sm`}>
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            {/* Data Table */}
            <div className={`${t.card} border rounded-xl backdrop-blur overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${t.tableBorder}`}>
                      <th className="px-4 py-3 text-left">
                        <input type="checkbox" checked={selectedRows.size === filteredProfiles.length && filteredProfiles.length > 0} onChange={toggleAllRows} className="rounded" />
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button onClick={() => toggleSort('name')} className={`flex items-center gap-1 text-xs font-semibold uppercase ${t.muted} hover:text-violet-400`}>
                          Company
                          {sortField === 'name' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button onClick={() => toggleSort('domain')} className={`flex items-center gap-1 text-xs font-semibold uppercase ${t.muted} hover:text-violet-400`}>
                          Domain
                          {sortField === 'domain' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button onClick={() => toggleSort('status')} className={`flex items-center gap-1 text-xs font-semibold uppercase ${t.muted} hover:text-violet-400`}>
                          Status
                          {sortField === 'status' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </button>
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${t.muted}`}>Colors</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${t.muted}`}>Assets</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${t.muted}`}>Score</th>
                      <th className="px-4 py-3 text-left">
                        <button onClick={() => toggleSort('createdAt')} className={`flex items-center gap-1 text-xs font-semibold uppercase ${t.muted} hover:text-violet-400`}>
                          Created
                          {sortField === 'createdAt' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                        </button>
                      </th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold uppercase ${t.muted}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-16 text-center">
                          <FolderOpen className={`w-12 h-12 ${t.muted} mx-auto mb-3 opacity-50`} />
                          <p className={`font-medium ${t.text}`}>No profiles found</p>
                          <p className={`text-sm ${t.muted}`}>Generate your first profile or adjust filters</p>
                        </td>
                      </tr>
                    ) : filteredProfiles.map(p => (
                      <tr key={p.id} className={`border-b ${t.tableBorder} ${t.tableRow} ${selectedRows.has(p.id) ? (darkMode ? 'bg-violet-600/10' : 'bg-violet-50') : ''}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selectedRows.has(p.id)} onChange={() => toggleRow(p.id)} className="rounded" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.data?.logos?.[0]?.formats?.[0]?.src ? (
                              <img src={p.data.logos[0].formats[0].src} alt="" className="w-8 h-8 rounded-lg object-contain bg-white/10" />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                {getInitials(p.url)}
                              </div>
                            )}
                            <div>
                              <p className={`font-medium ${t.text} truncate max-w-[200px]`}>{p.data?.name || p.url}</p>
                              <p className={`text-xs ${t.muted} truncate max-w-[200px]`}>{p.url}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${t.text}`}>{p.data?.domain || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${p.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            p.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                            {p.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                            {p.status === 'failed' && <XCircle className="w-3 h-3" />}
                            {p.status === 'processing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {p.data?.colors?.slice(0, 5).map((c, i) => (
                              <div key={i} className="w-5 h-5 rounded border border-white/20" style={{ backgroundColor: c.hex }} title={c.hex} />
                            ))}
                            {!p.data?.colors?.length && <span className={t.muted}>-</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {p.data?.logos?.length ? <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">{p.data.logos.length} logos</span> : null}
                            {p.data?.fonts?.length ? <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">{p.data.fonts.length} fonts</span> : null}
                            {p.data?.links?.length ? <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{p.data.links.length} links</span> : null}
                            {!p.data?.logos?.length && !p.data?.fonts?.length && !p.data?.links?.length && <span className={t.muted}>-</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.data?.qualityScore ? (
                            <span className={`text-sm font-medium ${p.data.qualityScore > 70 ? 'text-emerald-400' : p.data.qualityScore > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {p.data.qualityScore}
                            </span>
                          ) : <span className={t.muted}>-</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${t.muted}`}>{new Date(p.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setSelectedProfile(p); setView('profile'); }} className="p-1.5 text-violet-400 hover:bg-violet-500/20 rounded-lg" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            {p.data?.folderUrl && (
                              <a href={p.data.folderUrl} target="_blank" className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg" title="Drive">
                                <FolderOpen className="w-4 h-4" />
                              </a>
                            )}
                            {p.data?.docUrl && (
                              <a href={p.data.docUrl} target="_blank" className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg" title="Doc">
                                <FileText className="w-4 h-4" />
                              </a>
                            )}
                            <button onClick={() => deleteProfile(p.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className={`px-4 py-3 border-t ${t.tableBorder} flex items-center justify-between`}>
                <span className={`text-sm ${t.muted}`}>Showing {filteredProfiles.length} of {profiles.length} profiles</span>
                <div className="flex gap-2">
                  <button onClick={() => exportProfiles(filteredProfiles, 'json')} className={`px-3 py-1.5 ${t.hover} ${t.muted} rounded-lg text-sm`}>Export JSON</button>
                  <button onClick={() => exportProfiles(filteredProfiles, 'csv')} className={`px-3 py-1.5 ${t.hover} ${t.muted} rounded-lg text-sm`}>Export CSV</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grid View */}
        {(view === 'table' || view === 'dashboard') && displayMode === 'grid' && (
          <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total', value: stats.total, icon: Database, color: 'violet' },
                { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'emerald' },
                { label: 'Processing', value: stats.processing, icon: RefreshCw, color: 'blue' },
                { label: 'Failed', value: stats.failed, icon: XCircle, color: 'red' }
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={`${t.card} border rounded-xl p-4 backdrop-blur`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${t.muted}`}>{label}</span>
                    <Icon className={`w-4 h-4 text-${color}-400`} />
                  </div>
                  <p className={`text-2xl font-bold ${t.text}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Grid Toolbar */}
            <div className={`${t.card} border rounded-xl p-3 backdrop-blur`}>
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className={`absolute left-3 top-2.5 w-4 h-4 ${t.muted}`} />
                  <input
                    type="text"
                    placeholder="Search by URL, name, domain..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 ${t.input} rounded-lg text-sm border focus:ring-2 focus:ring-violet-500/50`}
                  />
                  {suggestions.length > 0 && (
                    <div className={`absolute top-full left-0 right-0 mt-1 ${t.card} border rounded-lg shadow-xl z-50 overflow-hidden`}>
                      {suggestions.map(s => (
                        <button key={s.id} onClick={() => selectSuggestion(s)} className={`w-full text-left px-4 py-2 text-sm ${t.hover} flex items-center gap-3`}>
                           {s.data?.logos?.[0]?.formats?.[0]?.src ? (
                             <img src={s.data.logos[0].formats[0].src} alt="" className="w-5 h-5 rounded object-contain bg-white/10" />
                           ) : (
                             <div className="w-5 h-5 bg-violet-600 rounded flex items-center justify-center text-[10px] text-white font-bold">
                               {getInitials(s.url)}
                             </div>
                           )}
                           <span className={t.text}>{s.data?.name || s.data?.domain || s.url}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Status Filter */}
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`px-3 py-2 ${t.input} border rounded-lg text-sm`}>
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={() => exportProfiles(filteredProfiles, 'csv')} className={`px-3 py-2 ${t.hover} ${t.muted} rounded-lg text-sm flex items-center gap-1`}>
                    <Download className="w-4 h-4" />Export CSV
                  </button>
                  <button onClick={() => { const s = localStorage.getItem('employer_profiles_v3'); if (s) setProfiles(JSON.parse(s)); showToast('info', 'Refreshed'); }} className={`px-3 py-2 ${t.muted} ${t.hover} rounded-lg text-sm flex items-center gap-1`} title="Refresh Data">
                    <RefreshCw className="w-4 h-4" />Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProfiles.map(profile => (
                <div key={profile.id}
                  className={`${t.card} border rounded-xl backdrop-blur overflow-hidden hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 cursor-pointer group`}
                  onClick={() => { setSelectedProfile(profile); setView('profile'); }}
                >
                  {/* Card Header with Logo */}
                  <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                        {profile.data?.logos?.[0]?.formats?.[0]?.src ? (
                          <img src={profile.data.logos[0].formats[0].src} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building2 className="w-6 h-6 text-violet-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold ${t.text} truncate`}>{profile.data?.name || 'Loading...'}</h3>
                        <p className={`text-sm ${t.muted} truncate`}>{profile.data?.domain || profile.url}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${profile.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        profile.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                        {profile.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                        {profile.status === 'processing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                        {profile.status === 'failed' && <XCircle className="w-3 h-3" />}
                        {profile.status}
                      </span>
                      {profile.data?.qualityScore && (
                        <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-1 rounded-full">
                          {Math.round((profile.data.qualityScore ?? 0) * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Color Palette */}
                    {(profile.data?.colors?.length ?? 0) > 0 && (
                      <div className="flex gap-1">
                        {profile.data?.colors?.slice(0, 5).map((c, i) => (
                          <div key={i} className="w-6 h-6 rounded-md shadow-sm" style={{ backgroundColor: c.hex }} title={c.hex} />
                        ))}
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className={`flex items-center gap-3 text-xs ${t.muted}`}>
                      <span className="flex items-center gap-1"><Award className="w-3 h-3" />{profile.data?.logos?.length ?? 0} logos</span>
                      <span className="flex items-center gap-1"><Type className="w-3 h-3" />{profile.data?.fonts?.length ?? 0} fonts</span>
                      <span className="flex items-center gap-1"><Link2 className="w-3 h-3" />{profile.data?.links?.length ?? 0} links</span>
                    </div>

                    {/* Date */}
                    <div className={`text-xs ${t.muted} flex items-center gap-1`}>
                      <Calendar className="w-3 h-3" />
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className={`px-4 py-3 border-t ${t.tableBorder} flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {profile.data?.folderUrl && (
                      <a href={profile.data.folderUrl} target="_blank" onClick={e => e.stopPropagation()} className="flex-1 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/20 text-center">
                        Drive
                      </a>
                    )}
                    <button onClick={e => { e.stopPropagation(); deleteProfile(profile.id); }} className="flex-1 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredProfiles.length === 0 && (
              <div className={`${t.card} border rounded-xl p-12 text-center`}>
                <Database className={`w-12 h-12 mx-auto mb-4 ${t.muted}`} />
                <h3 className={`font-semibold ${t.text} mb-2`}>No profiles found</h3>
                <p className={`${t.muted} text-sm`}>Create your first profile by clicking the &quot;+ New&quot; button</p>
              </div>
            )}
          </div>
        )}

        {/* Generate View */}
        {view === 'generate' && (
          <div className="max-w-xl mx-auto">
            <div className={`${t.card} border rounded-2xl backdrop-blur overflow-hidden shadow-2xl`}>
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-6">
                <h2 className="text-xl font-bold text-white">Generate New Profile</h2>
                <p className="text-violet-200 text-sm">Enter company URL to fetch brand data</p>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className={`block text-sm font-medium ${t.text} mb-2`}>Company Website URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !generating && generateProfile()}
                    placeholder="https://stripe.com"
                    disabled={generating}
                    className={`w-full px-4 py-3 ${t.input} border-2 rounded-xl focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50`}
                  />
                </div>

                <button onClick={generateProfile} disabled={generating || !url.trim()} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25">
                  {generating ? <><RefreshCw className="w-5 h-5 animate-spin" />Generating...</> : <><Zap className="w-5 h-5" />Generate Profile</>}
                </button>

                {generating && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className={t.text}>{progress.step}</span>
                      <span className={t.muted}>{progress.percent}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress.percent}%` }} />
                    </div>
                  </div>
                )}

                <button onClick={() => setView('table')} className={`w-full py-2.5 rounded-xl ${t.hover} ${t.text}`}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Profile View */}
        {view === 'profile' && selectedProfile && (
          <div className="w-full">
            <div className={`${t.card} border rounded-2xl backdrop-blur overflow-hidden shadow-2xl`}>
              {/* Header */}
              <div className="relative overflow-hidden">
                {heroImage ? (
                  <div className="absolute inset-0">
                    <img src={heroImage} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-violet-900/70" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_55%)]" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-700 via-indigo-600 to-slate-900" />
                )}
                <div className="relative px-6 py-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {selectedProfile.data?.logos?.[0]?.formats?.[0]?.src ? (
                      <img src={selectedProfile.data.logos[0].formats[0].src} alt="" className="w-14 h-14 rounded-xl bg-white/20 object-contain p-2 shadow-lg shadow-black/20" />
                    ) : (
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {getInitials(selectedProfile.url)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedProfile.data?.name || selectedProfile.url}</h2>
                      <p className="text-violet-200 text-sm">{selectedProfile.data?.domain || selectedProfile.url}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-white/70">
                        <span className="px-2 py-1 rounded-full bg-white/10">{imageUrls.length} images</span>
                        <span className="px-2 py-1 rounded-full bg-white/10">{selectedProfile.data?.logos?.length ?? 0} logos</span>
                        {selectedProfile.data?.qualityScore && (
                          <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-200">
                            {Math.round((selectedProfile.data.qualityScore ?? 0) * 100)}% score
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setView('table'); setSelectedProfile(null); }} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 ${selectedProfile.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    selectedProfile.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                    {selectedProfile.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                    {selectedProfile.status}
                  </span>
                  <div className="flex-1" />
                  {selectedProfile.data?.folderUrl && <a href={selectedProfile.data.folderUrl} target="_blank" className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 flex items-center gap-1"><FolderOpen className="w-4 h-4" />Drive</a>}
                  {selectedProfile.data?.docUrl && <a href={selectedProfile.data.docUrl} target="_blank" className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 flex items-center gap-1"><FileText className="w-4 h-4" />Doc</a>}
                  <button onClick={() => setEditorOpen(true)} className="px-3 py-1.5 bg-violet-500/10 text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-500/20 flex items-center gap-1"><Pencil className="w-4 h-4" />Edit</button>
                  <button onClick={() => exportProfiles([selectedProfile], 'json')} className="px-3 py-1.5 bg-violet-500/10 text-violet-400 rounded-lg text-sm font-medium hover:bg-violet-500/20 flex items-center gap-1"><Download className="w-4 h-4" />JSON</button>
                  <button onClick={() => deleteProfile(selectedProfile.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 flex items-center gap-1"><Trash2 className="w-4 h-4" />Delete</button>
                </div>

                {selectedProfile.status === 'completed' && selectedProfile.data && (
                  <div className="space-y-4">
                    {/* Description */}
                    {selectedProfile.data.description && (
                      <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <h3 className={`font-semibold ${t.text} mb-2 flex items-center gap-2`}>
                          <FileText className="w-4 h-4 text-violet-400" />Description
                          {selectedProfile.data.qualityScore && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{Math.round((selectedProfile.data.qualityScore ?? 0) * 100)}%</span>}
                        </h3>
                        <p className={`${t.muted} text-sm`}>{selectedProfile.data.description}</p>
                      </div>
                    )}

                    {/* AI-Generated Employer Text */}
                    {selectedProfile.data.employerText && (
                      <div className="bg-gradient-to-br from-violet-500/20 via-purple-500/15 to-pink-500/20 rounded-xl p-4 border border-violet-500/30">
                        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-violet-400" />
                          <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">KI-Arbeitgeberbeschreibung</span>
                        </h3>
                        <p className="text-white/90 text-sm leading-relaxed">{selectedProfile.data.employerText}</p>
                      </div>
                    )}

                    {/* Matched Benefits */}
                    {selectedProfile.data.matchedBenefits && selectedProfile.data.matchedBenefits.trim() !== '' && (
                      <div className={`${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'} rounded-xl p-4 border border-emerald-500/20`}>
                        <h3 className={`font-semibold ${t.text} mb-3 flex items-center gap-2`}>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />Erkannte Benefits
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.data.matchedBenefits.split(',').filter(b => b.trim()).map((benefit, i) => (
                            <span key={i} className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-sm font-medium">
                              ✓ {benefit.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Images */}
                    {imageUrls.length > 0 && (
                      <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-2xl p-4 md:p-5 border ${t.tableBorder}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <h3 className={`font-semibold ${t.text} flex items-center gap-2`}>
                            <Globe className="w-4 h-4 text-cyan-400" />Image Gallery ({imageUrls.length})
                          </h3>
                          <button onClick={() => openGallery(0)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-white/80 hover:text-white hover:bg-white/20 flex items-center gap-2">
                            <Maximize2 className="w-4 h-4" />View all
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-6 auto-rows-[110px] md:auto-rows-[140px] lg:auto-rows-[160px] gap-3">
                          {imageUrls.map((src, i) => {
                            const layoutClass = i === 0
                              ? 'md:col-span-4 md:row-span-2'
                              : i === 1
                                ? 'md:col-span-2 md:row-span-2'
                                : 'md:col-span-2 md:row-span-1';
                            return (
                              <button
                                key={src}
                                onClick={() => openGallery(i)}
                                className={`relative rounded-xl overflow-hidden group border ${t.tableBorder} ${darkMode ? 'bg-white/10' : 'bg-white'} ${layoutClass}`}
                              >
                                <img src={src} alt={`Image ${i + 1}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70" />
                                <div className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/40 px-2 py-1 rounded-md">
                                  #{i + 1}
                                </div>
                                <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                  <Maximize2 className="w-4 h-4" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Logos */}
                    {(selectedProfile.data.logos?.length ?? 0) > 0 && (
                      <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <h3 className={`font-semibold ${t.text} mb-3 flex items-center gap-2`}><Award className="w-4 h-4 text-violet-400" />Logos ({selectedProfile.data.logos?.length ?? 0})</h3>
                        <div className="flex flex-wrap gap-3">
                          {selectedProfile.data.logos?.map((logo, i) => (
                            <div key={i} className={`${darkMode ? 'bg-white/10' : 'bg-white'} rounded-lg p-3 text-center min-w-[100px] border ${t.tableBorder}`}>
                              {logo.formats?.[0]?.src && <img src={logo.formats[0].src} alt="" className="max-w-[80px] max-h-[50px] object-contain mx-auto mb-2" />}
                              <span className={`text-xs ${t.muted} capitalize`}>{logo.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Colors */}
                    {(selectedProfile.data.colors?.length ?? 0) > 0 && (
                      <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <h3 className={`font-semibold ${t.text} mb-3 flex items-center gap-2`}><Palette className="w-4 h-4 text-pink-400" />Colors ({selectedProfile.data.colors?.length ?? 0})</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.data.colors?.map((c, i) => (
                            <button key={i} onClick={() => copyToClipboard(c.hex, `color-${i}`)} className={`flex items-center gap-2 ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-gray-100'} px-3 py-2 rounded-lg border ${t.tableBorder} transition-colors group`}>
                              <div className="w-6 h-6 rounded-md shadow" style={{ backgroundColor: c.hex }} />
                              <span className={`font-mono text-sm ${t.text}`}>{c.hex}</span>
                              {copied === `color-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fonts */}
                    {(selectedProfile.data.fonts?.length ?? 0) > 0 && (
                      <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <h3 className={`font-semibold ${t.text} mb-3 flex items-center gap-2`}><Type className="w-4 h-4 text-orange-400" />Fonts ({selectedProfile.data.fonts?.length ?? 0})</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.data.fonts?.map((f, i) => (
                            <span key={i} className={`${darkMode ? 'bg-white/10' : 'bg-white'} px-4 py-2 rounded-lg text-sm ${t.text} border ${t.tableBorder}`}>{f.name}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    {(selectedProfile.data.links?.length ?? 0) > 0 && (
                      <div className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4`}>
                        <h3 className={`font-semibold ${t.text} mb-3 flex items-center gap-2`}><Link2 className="w-4 h-4 text-blue-400" />Social Links ({selectedProfile.data.links?.length ?? 0})</h3>
                        <div className="space-y-2">
                          {selectedProfile.data.links?.map((link, i) => (
                            <a key={i} href={link.url} target="_blank" className={`flex items-center gap-3 ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-blue-50'} px-4 py-3 rounded-lg border ${t.tableBorder} transition-colors`}>
                              <span className="text-lg">{getPlatformEmoji(link.url)}</span>
                              <span className={`text-sm ${t.muted} truncate flex-1`}>{link.url}</span>
                              <ExternalLink className={`w-4 h-4 ${t.muted}`} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw JSON */}
                    <details className={`${darkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-xl overflow-hidden`}>
                      <summary className={`px-4 py-3 cursor-pointer font-medium ${t.text} hover:bg-white/5`}>View Raw JSON</summary>
                      <pre className={`p-4 text-xs ${t.muted} overflow-x-auto max-h-64 ${darkMode ? 'bg-black/30' : 'bg-gray-100'}`}>
                        {JSON.stringify(selectedProfile.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}

                {selectedProfile.status === 'failed' && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div><h3 className="font-semibold text-red-400">Error</h3><p className="text-red-300 text-sm">{selectedProfile.error}</p></div>
                    </div>
                  </div>
                )}

                <p className={`text-xs ${t.muted}`}>Created: {new Date(selectedProfile.createdAt).toLocaleString()}</p>
              </div>
            </div>
            {editorOpen && (
              <ProfileEditor
                isOpen={editorOpen}
                profile={selectedProfile}
                onSave={handleProfileUpdate}
                onClose={() => setEditorOpen(false)}
                darkMode={darkMode}
              />
            )}
          </div>
        )}

        {/* Global Gallery Modal */}
        {galleryOpen && imageUrls.length > 0 && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeGallery}>
            <div className="relative w-full max-w-5xl" onClick={e => e.stopPropagation()}>
              <img src={imageUrls[galleryIndex]} alt="" className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl shadow-black/60" />
              <button onClick={closeGallery} className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              {imageUrls.length > 1 && (
                <>
                  <button onClick={showPrev} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white/80 hover:text-white">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={showNext} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white/80 hover:text-white">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
              <div className="mt-3 text-center text-sm text-white/70">
                {galleryIndex + 1} / {imageUrls.length}
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {view === 'settings' && (
          <div className="max-w-xl mx-auto">
            <div className={`${t.card} border rounded-2xl backdrop-blur overflow-hidden shadow-2xl`}>
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-6">
                <h2 className="text-xl font-bold text-white">Settings</h2>
                <p className="text-violet-200 text-sm">Configure automation</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className={`block text-sm font-medium ${t.text} mb-2`}>Webhook URL</label>
                  <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className={`w-full px-4 py-3 ${t.input} border-2 rounded-xl focus:ring-2 focus:ring-violet-500/50`} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={`block text-sm font-medium ${t.text} mb-2`}>Google API Key</label>
                        <input type="password" value={googleApiKey} onChange={e => setGoogleApiKey(e.target.value)} placeholder="AIza..." className={`w-full px-4 py-3 ${t.input} border-2 rounded-xl focus:ring-2 focus:ring-violet-500/50`} />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium ${t.text} mb-2`}>Google Search Engine ID (CX)</label>
                        <input type="text" value={googleCx} onChange={e => setGoogleCx(e.target.value)} placeholder="012345..." className={`w-full px-4 py-3 ${t.input} border-2 rounded-xl focus:ring-2 focus:ring-violet-500/50`} />
                    </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${t.text} mb-2`}>Theme</label>
                  <button onClick={() => setDarkMode(!darkMode)} className={`w-full px-4 py-3 ${darkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-xl flex items-center justify-between ${t.text}`}>
                    <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                    {darkMode ? <Moon className="w-5 h-5 text-violet-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className={`font-semibold ${t.text}`}>Data Management</h3>
                  <label className="block w-full px-4 py-3 bg-blue-500/10 text-blue-400 rounded-xl cursor-pointer hover:bg-blue-500/20 font-medium">
                    <Upload className="w-4 h-4 inline mr-2" />Import Backup
                    <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                  </label>
                  <button onClick={() => exportProfiles(profiles, 'json')} className="w-full px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-xl font-medium text-left hover:bg-emerald-500/20">
                    <Download className="w-4 h-4 inline mr-2" />Export All ({profiles.length})
                  </button>
                  <button onClick={() => { if (confirm('Clear ALL data?')) { localStorage.removeItem('employer_profiles_v3'); setProfiles([]); showToast('success', 'Cleared'); } }} className="w-full px-4 py-3 bg-red-500/10 text-red-400 rounded-xl font-medium text-left hover:bg-red-500/20">
                    <Trash2 className="w-4 h-4 inline mr-2" />Clear All Data
                  </button>
                </div>

                <button onClick={() => setView('table')} className={`w-full py-3 rounded-xl ${t.hover} ${t.text} font-medium`}>Back</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes slide-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
