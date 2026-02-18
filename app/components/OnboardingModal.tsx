'use client';

import React, { useEffect, useState } from 'react';
import { X, Zap, Search, Layout, Rocket } from 'lucide-react';

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('onboarding_seen');
    if (!seen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('onboarding_seen', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#111827] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-up border border-gray-200 dark:border-white/10">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-lg">
                    <Zap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Welcome to Employer Profile Pro</h2>
                <p className="text-violet-100 text-lg">Your automated tool for extracting brand assets and generating employer profiles.</p>
            </div>
            <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-8">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center mx-auto">
                        <Rocket className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Generate</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enter any company URL to instantly extract logos, colors, fonts, and images.</p>
                </div>
                <div className="text-center space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
                        <Layout className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Review</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Preview the generated profile, check brand assets, and edit details if needed.</p>
                </div>
                <div className="text-center space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Manage</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Organize profiles, filter by status, and export data to JSON or CSV.</p>
                </div>
            </div>

            <button
                onClick={handleClose}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-violet-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
                Get Started
            </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
