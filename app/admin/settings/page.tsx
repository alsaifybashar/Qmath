'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import {
    Settings as SettingsIcon,
    Database,
    Mail,
    Globe,
    Shield,
    Bell,
    Save,
    Trash2,
    Download
} from 'lucide-react';

export default function AdminSettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        siteName: 'Qmath',
        siteUrl: 'http://localhost:3000',
        supportEmail: 'support@qmath.se',
        allowRegistration: true,
        requireEmailVerification: false,
        enableNotifications: true,
        maxFileSize: 10,
        allowedFileTypes: '.pdf',
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/admin/settings');
        } else if (session?.user?.role !== 'admin') {
            router.push('/');
        }
    }, [session, status, router]);

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        alert('Settings saved successfully!');
    };

    const handleExportDatabase = () => {
        alert('Database export feature coming soon!');
    };

    const handleClearCache = () => {
        if (confirm('Are you sure you want to clear the cache?')) {
            alert('Cache cleared successfully!');
        }
    };

    if (status === 'loading') {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    if (!session || session.user.role !== 'admin') {
        return null;
    }

    return (
        <AdminLayout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                        Settings
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Configure system settings and preferences
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Settings */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* General Settings */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Globe className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                                    General Settings
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Site Name
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.siteName}
                                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Site URL
                                    </label>
                                    <input
                                        type="url"
                                        value={settings.siteUrl}
                                        onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Support Email
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.supportEmail}
                                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* User Settings */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Shield className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                                    User Settings
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Allow New Registrations
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={settings.allowRegistration}
                                        onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
                                    />
                                </label>

                                <label className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Require Email Verification
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={settings.requireEmailVerification}
                                        onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
                                    />
                                </label>

                                <label className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Enable Notifications
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={settings.enableNotifications}
                                        onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* File Upload Settings */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Database className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                                    File Upload Settings
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Max File Size (MB)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.maxFileSize}
                                        onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Allowed File Types
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.allowedFileTypes}
                                        onChange={(e) => setSettings({ ...settings, allowedFileTypes: e.target.value })}
                                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-zinc-900 dark:text-white"
                                        placeholder=".pdf, .doc, .docx"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        {/* Database Actions */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                            <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
                                Database Actions
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={handleExportDatabase}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-900 dark:text-white transition-colors"
                                >
                                    <Download className="w-5 h-5" />
                                    <span>Export Database</span>
                                </button>
                            </div>
                        </div>

                        {/* System Info */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                            <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
                                System Information
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-600 dark:text-zinc-400">Version</span>
                                    <span className="font-medium text-zinc-900 dark:text-white">1.0.0</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-600 dark:text-zinc-400">Database</span>
                                    <span className="font-medium text-zinc-900 dark:text-white">SQLite</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-600 dark:text-zinc-400">Node.js</span>
                                    <span className="font-medium text-zinc-900 dark:text-white">v20.x</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-600 dark:text-zinc-400">Next.js</span>
                                    <span className="font-medium text-zinc-900 dark:text-white">16.1.6</span>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-6">
                            <h3 className="font-semibold text-red-900 dark:text-red-400 mb-4">
                                Danger Zone
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={handleClearCache}
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 rounded-lg text-red-900 dark:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    <span>Clear Cache</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
