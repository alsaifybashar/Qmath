'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
    Key,
    Plus,
    Trash2,
    Copy,
    CheckCircle,
    AlertCircle,
    Loader2,
    X,
    Eye,
    EyeOff,
} from 'lucide-react';

interface APIKey {
    id: string;
    name: string;
    keyPrefix: string;
    permissions: string[];
    isActive: boolean;
    createdAt: string | null;
    expiresAt: string | null;
    lastUsedAt: string | null;
}

interface Toast {
    id: number;
    type: 'success' | 'error';
    message: string;
}

const PERMISSION_OPTIONS = [
    { value: 'read:questions', label: 'Read Questions' },
    { value: 'read:users', label: 'Read Users' },
    { value: 'write:questions', label: 'Write Questions' },
    { value: 'ai:invoke', label: 'Invoke AI' },
    { value: 'admin:full', label: 'Full Admin Access' },
];

export default function APIKeysPage() {
    const [keys, setKeys] = useState<APIKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showRevealModal, setShowRevealModal] = useState<string | null>(null); // stores the full key after generation
    const [revoking, setRevoking] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [copied, setCopied] = useState(false);
    const toastCounter = useRef(0);

    // Form state
    const [form, setForm] = useState({
        name: '',
        permissions: [] as string[],
        expiresInDays: '',
    });

    const showToast = (type: 'success' | 'error', message: string) => {
        const id = ++toastCounter.current;
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    };

    const fetchKeys = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/api-keys');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setKeys(data.keys ?? []);
        } catch {
            showToast('error', 'Failed to load API keys.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchKeys(); }, [fetchKeys]);

    const handleGenerate = async () => {
        if (!form.name.trim()) {
            showToast('error', 'A key name is required.');
            return;
        }
        setGenerating(true);
        try {
            const res = await fetch('/api/admin/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name.trim(),
                    permissions: form.permissions,
                    expiresInDays: form.expiresInDays ? parseInt(form.expiresInDays, 10) : null,
                }),
            });
            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error ?? 'Failed to generate key');
            }
            const { key } = await res.json();
            setShowModal(false);
            setForm({ name: '', permissions: [], expiresInDays: '' });
            setShowRevealModal(key);
            fetchKeys();
        } catch (err: unknown) {
            showToast('error', err instanceof Error ? err.message : 'Failed to generate key.');
        } finally {
            setGenerating(false);
        }
    };

    const handleRevoke = async (keyId: string, keyName: string) => {
        if (!confirm(`Revoke API key "${keyName}"? This cannot be undone — any systems using this key will lose access immediately.`)) return;
        setRevoking(keyId);
        try {
            const res = await fetch(`/api/admin/api-keys/${keyId}`, { method: 'DELETE' });
            if (!res.ok) {
                const { error } = await res.json();
                throw new Error(error ?? 'Failed to revoke key');
            }
            showToast('success', `Key "${keyName}" revoked.`);
            fetchKeys();
        } catch (err: unknown) {
            showToast('error', err instanceof Error ? err.message : 'Failed to revoke key.');
        } finally {
            setRevoking(null);
        }
    };

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast('error', 'Failed to copy to clipboard.');
        }
    };

    const togglePermission = (perm: string) => {
        setForm((f) => ({
            ...f,
            permissions: f.permissions.includes(perm)
                ? f.permissions.filter((p) => p !== perm)
                : [...f.permissions, perm],
        }));
    };

    return (
        <AdminLayout>
            {/* Toasts */}
            <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm pointer-events-auto ${
                            t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                        }`}
                    >
                        {t.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {t.message}
                    </div>
                ))}
            </div>

            {/* One-time key reveal modal */}
            {showRevealModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                                <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">API Key Generated</h2>
                        </div>
                        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                                Copy this key now — it will not be shown again.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-6 font-mono text-sm text-zinc-900 dark:text-zinc-100 break-all">
                            <span className="flex-1">{showRevealModal}</span>
                            <button
                                onClick={() => handleCopy(showRevealModal)}
                                className="flex-shrink-0 p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                            </button>
                        </div>
                        <button
                            onClick={() => setShowRevealModal(null)}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                        >
                            I've copied the key — close
                        </button>
                    </div>
                </div>
            )}

            {/* Generate key modal */}
            {showModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Generate API Key</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="w-4 h-4 text-zinc-500" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    Key Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Production LLM Integration"
                                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Permissions
                                </label>
                                <div className="space-y-2">
                                    {PERMISSION_OPTIONS.map(({ value, label }) => (
                                        <label key={value} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.permissions.includes(value)}
                                                onChange={() => togglePermission(value)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-600"
                                            />
                                            <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
                                            <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">{value}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    Expires in (days)
                                </label>
                                <input
                                    type="number"
                                    value={form.expiresInDays}
                                    onChange={(e) => setForm((f) => ({ ...f, expiresInDays: e.target.value }))}
                                    placeholder="Leave empty for no expiry"
                                    min="1"
                                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                {generating ? 'Generating…' : 'Generate Key'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-8">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">API Keys</h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Manage access keys for external integrations. Full keys are shown once at generation.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Generate Key
                    </button>
                </div>

                {/* Keys table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-zinc-500 dark:text-zinc-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Loading keys...
                        </div>
                    ) : keys.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Key className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">No active API keys. Generate one to get started.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                                    <tr>
                                        {['Name', 'Key Prefix', 'Permissions', 'Created', 'Expires', 'Actions'].map((h) => (
                                            <th key={h} className="text-left px-6 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {keys.map((k) => {
                                        const busy = revoking === k.id;
                                        const isExpired = k.expiresAt ? new Date(k.expiresAt) < new Date() : false;
                                        return (
                                            <tr key={k.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-zinc-900 dark:text-white text-sm">{k.name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-800 dark:text-zinc-200">
                                                        {k.keyPrefix}…
                                                    </code>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {(k.permissions ?? []).length === 0 ? (
                                                            <span className="text-xs text-zinc-400 dark:text-zinc-500">none</span>
                                                        ) : (
                                                            (k.permissions ?? []).map((p) => (
                                                                <span key={p} className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded font-mono">
                                                                    {p}
                                                                </span>
                                                            ))
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                                                    {k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {k.expiresAt ? (
                                                        <span className={`text-sm ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                                            {isExpired ? 'Expired ' : ''}{new Date(k.expiresAt).toLocaleDateString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-zinc-400 dark:text-zinc-500">Never</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {busy ? (
                                                        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                                                    ) : (
                                                        <button
                                                            onClick={() => handleRevoke(k.id, k.name)}
                                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Revoke key"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Security note */}
                <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                        <strong>Security:</strong> API keys are stored as SHA-256 hashes. Only the key prefix is displayed here.
                        The full key is shown exactly once at generation — if lost, revoke and regenerate.
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
