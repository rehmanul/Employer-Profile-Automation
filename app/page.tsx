'use client';

import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Clock, RefreshCw, Download, ExternalLink, TrendingUp, Zap, Database, Globe, Award, BarChart3, Activity, Sparkles, FileText } from 'lucide-react';

interface Job {
  id: string;
  websiteUrl: string;
  status: 'processing' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  progress: number;
  data?: any;
}

interface Stats {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  avgTime: number;
}

export default function EmployerProfileDashboard() {
  const [webhookUrl, setWebhookUrl] = useState('https://hook.eu2.make.com/wox5dmw6fbgunazmmya2hahi369rolbb');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, failed: 0, processing: 0, avgTime: 0 });
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);

  // Load jobs from localStorage on mount
  useEffect(() => {
    const savedJobs = localStorage.getItem('employer_jobs');
    if (savedJobs) {
      try {
        setJobs(JSON.parse(savedJobs));
      } catch (e) {
        console.error('Failed to load jobs from localStorage:', e);
      }
    }
  }, []);

  // Save jobs to localStorage whenever they change
  useEffect(() => {
    if (jobs.length > 0) {
      localStorage.setItem('employer_jobs', JSON.stringify(jobs));
    }
  }, [jobs]);

  useEffect(() => {
    updateStats();
  }, [jobs]);

  const updateStats = () => {
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
  };

  const validateUrl = (url: string) => {
  try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const submitJob = async () => {
    if (!websiteUrl) {
      alert('Please provide a website URL');
      return;
    }

    if (!validateUrl(websiteUrl)) {
      alert('Please enter a valid website URL');
      return;
    }

    setIsProcessing(true);
    const jobId = `JOB_${Date.now()}`;

    const newJob: Job = {
      id: jobId,
      websiteUrl,
      status: 'processing',
      startTime: new Date().toISOString(),
      progress: 0
    };

    setJobs(prev => [newJob, ...prev]);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setJobs(prev => prev.map(job =>
        job.id === jobId && job.status === 'processing'
          ? { ...job, progress: Math.min(job.progress + Math.random() * 15, 95) }
          : job
      ));
    }, 1000);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          website_url: websiteUrl,
          website_host: new URL(websiteUrl).hostname,
          run_folder_hint: `AUTO_EMP_${new URL(websiteUrl).hostname}_${new Date().toISOString()}`,
          assets: {
            capture_images: true,
            capture_logo: true,
            max_images: 5
          },
          outputs: {
            create_google_doc: true,
            include_benefits: true,
            include_matched_benefits: true
          },
          timestamp: new Date().toISOString()
        })
      });

      clearInterval(progressInterval);

      if (response.ok) {
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            updateJobStatus(jobId, 'completed', result);
          } else {
            // Handle non-JSON response (Make.com might return text)
            const text = await response.text();
            console.log('Non-JSON response:', text);
            updateJobStatus(jobId, 'completed', {
              success: true,
              job_id: jobId,
              status: 'completed',
              results: {
                company_name: 'Processing Complete',
                website: websiteUrl
              }
            });
          }
        } catch (parseError: any) {
          console.error('Error parsing response:', parseError);
          updateJobStatus(jobId, 'completed', {
            success: true,
            job_id: jobId,
            status: 'completed',
            results: {
              company_name: 'Processing Complete',
              website: websiteUrl
            }
          });
        }
      } else {
        const errorText = await response.text();
        console.error('Response not OK:', response.status, errorText);
        updateJobStatus(jobId, 'failed', { error: `HTTP ${response.status}: ${errorText.substring(0, 100)}` });
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Fetch error:', error);
      updateJobStatus(jobId, 'failed', { error: error.message });
    } finally {
      setIsProcessing(false);
      setWebsiteUrl('');
    }
  };

  const updateJobStatus = (jobId: string, status: 'completed' | 'failed', data: any = {}) => {
    setJobs(prev => prev.map(job =>
      job.id === jobId
        ? { ...job, status, endTime: new Date().toISOString(), data, progress: 100 }
        : job
    ));
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed':
        return 'from-emerald-50 to-teal-50 border-emerald-200';
      case 'failed':
        return 'from-rose-50 to-pink-50 border-rose-200';
      case 'processing':
        return 'from-blue-50 to-indigo-50 border-blue-200';
      default:
        return 'from-gray-50 to-slate-50 border-gray-200';
    }
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'In progress...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(duration / 1000);
    return `${seconds}s`;
  };

  const getSuccessRate = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all job history?')) {
      setJobs([]);
      localStorage.removeItem('employer_jobs');
    }
  };

  const getJobLabel = (job: Job) => {
    const host = (() => {
      try {
        return new URL(job.websiteUrl).hostname;
      } catch {
        return job.websiteUrl;
      }
    })();
    const companyName = job.data?.results?.company_name || job.data?.company_profile?.name;
    return companyName || host;
  };

  const getDocUrl = (job: Job) => {
    return job.data?.storage?.doc_url || job.data?.results?.doc_url || job.data?.doc_url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 mb-6 border border-white/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Employer Profile Automation
                </h1>
                <p className="text-slate-300 mt-1 text-sm md:text-base">AI-Powered Data Collection & Profile Generation</p>
              </div>
            </div>
            <button
              onClick={() => setShowWebhookConfig(!showWebhookConfig)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all duration-300 text-sm"
            >
              {showWebhookConfig ? '✕ Close Config' : '⚙️ Configure'}
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">{stats.total}</span>
            </div>
            <p className="text-blue-200 text-sm font-medium">Total Jobs</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-400/30 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
              <span className="text-2xl font-bold text-white">{stats.completed}</span>
            </div>
            <p className="text-emerald-200 text-sm font-medium">Completed</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">{stats.processing}</span>
            </div>
            <p className="text-purple-200 text-sm font-medium">Processing</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-400/30 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-amber-400" />
              <span className="text-2xl font-bold text-white">{stats.avgTime.toFixed(1)}s</span>
            </div>
            <p className="text-amber-200 text-sm font-medium">Avg Time</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-6 border border-pink-400/30 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-pink-400" />
              <span className="text-2xl font-bold text-white">{getSuccessRate()}%</span>
            </div>
            <p className="text-pink-200 text-sm font-medium">Success Rate</p>
          </div>
        </div>

        {/* Webhook Configuration */}
        {showWebhookConfig && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 mb-6 border border-white/20 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Webhook Configuration</h2>
            </div>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-white placeholder-slate-400 transition-all duration-300"
              placeholder="Make.com webhook URL"
            />
            <p className="mt-2 text-xs text-slate-400">Paste your Make.com webhook URL here for automated processing</p>
          </div>
        )}

        {/* Job Submission Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 mb-6 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Create New Profile</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Company Website URL *
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-400 transition-all duration-300"
                placeholder="https://example.com"
                disabled={isProcessing}
              />
            </div>
          </div>

          <button
            onClick={submitJob}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Processing Magic...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Start Profile Creation
              </>
            )}
          </button>
        </div>

        {/* Jobs List */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Recent Jobs</h2>
            </div>
            {jobs.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-sm font-medium">
                  {jobs.length} total
                </span>
                <button
                  onClick={clearHistory}
                  className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 rounded-full text-rose-300 text-sm font-medium transition-all duration-300"
                  title="Clear all job history"
                >
                  Clear History
                </button>
              </div>
            )}
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-blue-400" />
              </div>
              <p className="text-xl font-medium text-white mb-2">No jobs yet</p>
              <p className="text-slate-400">Submit a website URL above to start processing</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`bg-gradient-to-r ${getStatusColor(job.status)} backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl`}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(job.status)}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-lg truncate">
                            {getJobLabel(job)}
                          </h3>
                          <a
                            href={job.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-slate-600 hover:text-blue-600 flex items-center gap-1 mt-1 truncate transition-colors"
                          >
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{job.websiteUrl}</span>
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-white/50 rounded-lg p-2">
                          <span className="text-slate-600 block text-xs">Job ID</span>
                          <span className="font-mono text-slate-900 font-medium text-xs truncate block">{job.id.slice(-8)}</span>
                        </div>
                        <div className="bg-white/50 rounded-lg p-2">
                          <span className="text-slate-600 block text-xs">Duration</span>
                          <span className="font-medium text-slate-900">{formatDuration(job.startTime, job.endTime)}</span>
                        </div>
                        <div className="bg-white/50 rounded-lg p-2">
                          <span className="text-slate-600 block text-xs">Status</span>
                          <span className="font-medium text-slate-900 capitalize">{job.status}</span>
                        </div>
                        <div className="bg-white/50 rounded-lg p-2">
                          <span className="text-slate-600 block text-xs">Started</span>
                          <span className="text-slate-900">{new Date(job.startTime).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {job.status === 'processing' && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-700 font-medium">Processing...</span>
                            <span className="text-blue-600 font-bold">{Math.round(job.progress)}%</span>
                          </div>
                          <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-lg"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {job.status === 'completed' && job.data && job.data.storage && (
                        <div className="mt-4 pt-4 border-t border-slate-300">
                          <div className="flex flex-wrap gap-3">
                            {job.data.storage.drive_folder_url && (
                              <a
                                href={job.data.storage.drive_folder_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105"
                              >
                                <Download className="w-4 h-4" />
                                View Results in Drive
                              </a>
                            )}
                            {getDocUrl(job) && (
                              <a
                                href={getDocUrl(job)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 hover:bg-white text-emerald-700 border border-emerald-200 rounded-xl transition-all duration-300 text-sm font-semibold shadow-md"
                              >
                                <FileText className="w-4 h-4" />
                                Open Google Doc
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {job.status === 'failed' && job.data?.error && (
                        <div className="mt-4 pt-4 border-t border-rose-300">
                          <div className="flex items-start gap-2 p-3 bg-rose-100 rounded-lg">
                            <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-rose-800 font-medium">
                              Error: {job.data.error}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            © 2025 Employer Profile Automation System
          </p>
        </div>
      </div>
    </div>
  );
}
