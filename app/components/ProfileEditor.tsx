'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Profile } from '../types';

interface ProfileEditorProps {
    isOpen: boolean;
    profile: Profile | null;
    onSave: (updatedProfile: Profile) => void;
    onClose: () => void;
    darkMode: boolean;
}

export default function ProfileEditor({ isOpen, profile, onSave, onClose, darkMode }: ProfileEditorProps) {
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        description: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.data?.name || '',
                domain: profile.data?.domain || '',
                description: profile.data?.description || ''
            });
        }
    }, [profile]);

    if (!isOpen || !profile) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updated: Profile = {
            ...profile,
            data: {
                ...profile.data,
                name: formData.name,
                domain: formData.domain,
                description: formData.description
            }
        };
        onSave(updated);
        onClose();
    };

    const t = {
        card: darkMode ? 'bg-[#1e293b] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900',
        input: darkMode ? 'bg-black/20 border-white/10 text-white focus:border-violet-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-violet-500',
        label: darkMode ? 'text-gray-300' : 'text-gray-700',
        muted: darkMode ? 'text-gray-400' : 'text-gray-500'
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up border ${t.card}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-violet-600/10 to-indigo-600/10">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        Edit Profile
                    </h3>
                    <button onClick={onClose} className={`p-2 rounded-lg hover:bg-black/10 transition-colors ${t.muted}`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${t.label}`}>Company Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-violet-500/20 outline-none transition-all ${t.input}`}
                            placeholder="e.g. Stripe"
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${t.label}`}>Domain</label>
                        <input
                            type="text"
                            value={formData.domain}
                            onChange={e => setFormData({ ...formData, domain: e.target.value })}
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-violet-500/20 outline-none transition-all ${t.input}`}
                            placeholder="e.g. stripe.com"
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${t.label}`}>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-violet-500/20 outline-none transition-all resize-none ${t.input}`}
                            placeholder="Company description..."
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 px-4 py-2.5 rounded-xl font-medium border ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
                        >
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
            <style jsx>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
                .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    );
}
