'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, AlertTriangle, Calendar, ChevronRight, AlarmClockOff, BookOpen, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { snoozeReview } from '@/app/actions/notification-engine';

interface ReviewNotification {
    id: string;
    topicId: string;
    topicName: string;
    courseCode: string;
    masteryLevel: number;
    urgency: 'overdue' | 'due_today' | 'upcoming';
    daysSinceReview: number;
    nextReviewDate: Date;
    suggestedAction: string;
    priority: number;
}

const urgencyConfig = {
    overdue: {
        label: 'Försenad',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        darkBg: 'rgba(239,68,68,0.15)',
        icon: AlertTriangle,
    },
    due_today: {
        label: 'Idag',
        color: '#dfa81b',
        bgColor: '#FEF3C7',
        darkBg: 'rgba(223, 168, 27,0.15)',
        icon: Clock,
    },
    upcoming: {
        label: 'Kommande',
        color: '#3585a3',
        bgColor: '#DBEAFE',
        darkBg: 'rgba(53, 133, 163,0.15)',
        icon: Calendar,
    },
};

function MasteryDots({ level }: { level: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                        background: i <= level ? '#4361EE' : '#E5E7EB',
                    }}
                />
            ))}
        </div>
    );
}

// ============ NOTIFICATION CARD ============

function NotificationCard({
    notification,
    onSnooze,
    onDismiss,
}: {
    notification: ReviewNotification;
    onSnooze: (id: string) => void;
    onDismiss: (id: string) => void;
}) {
    const config = urgencyConfig[notification.urgency];
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
        >
            {/* Urgency icon */}
            <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: config.bgColor }}
            >
                <Icon className="w-4.5 h-4.5" style={{ color: config.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ color: config.color, background: `${config.color}15` }}
                    >
                        {config.label}
                    </span>
                    <MasteryDots level={notification.masteryLevel} />
                </div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    {notification.topicName}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                    {notification.daysSinceReview > 0
                        ? `Senast repeterad för ${notification.daysSinceReview} dag${notification.daysSinceReview !== 1 ? 'ar' : ''} sedan`
                        : 'Nytt ämne'}
                    {' • '}{notification.suggestedAction}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    onClick={() => onSnooze(notification.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition"
                    title="Skjut upp 1 dag"
                >
                    <AlarmClockOff className="w-4 h-4" />
                </button>
                <Link
                    href={`/practice?topic=${notification.topicId}`}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition"
                    title="Starta repetition"
                >
                    <BookOpen className="w-4 h-4" />
                </Link>
            </div>
        </motion.div>
    );
}

// ============ DASHBOARD WIDGET ============

export function ReviewWidget({
    notifications,
    overdue,
    dueToday,
}: {
    notifications: ReviewNotification[];
    overdue: number;
    dueToday: number;
}) {
    if (notifications.length === 0) return null;

    const totalUrgent = overdue + dueToday;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5"
            style={{
                background: 'white',
                border: '1px solid #EFF1F8',
                boxShadow: '0 2px 12px rgba(26,29,46,0.06)',
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Bell className="w-5 h-5 text-zinc-500" />
                        {totalUrgent > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {totalUrgent}
                            </span>
                        )}
                    </div>
                    <h3 className="text-base font-semibold" style={{ color: '#1A1D2E' }}>
                        Dags att repetera
                    </h3>
                </div>
                <Link
                    href="/notifications"
                    className="text-xs font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                    Visa alla <ChevronRight className="w-3 h-3" />
                </Link>
            </div>

            {/* Summary badges */}
            <div className="flex gap-2 mb-4">
                {overdue > 0 && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600">
                        {overdue} försenade
                    </span>
                )}
                {dueToday > 0 && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600">
                        {dueToday} idag
                    </span>
                )}
            </div>

            {/* Preview cards */}
            <div className="space-y-2">
                {notifications.slice(0, 3).map(n => {
                    const config = urgencyConfig[n.urgency];
                    return (
                        <Link
                            key={n.id}
                            href={`/practice?topic=${n.topicId}`}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition group"
                        >
                            <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: config.color }}
                            />
                            <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate flex-1">
                                {n.topicName}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-blue-500 transition" />
                        </Link>
                    );
                })}
            </div>
        </motion.div>
    );
}

// ============ FULL PAGE ============

export function NotificationsPage({ summary }: { summary: { overdue: number; dueToday: number; upcoming: number; total: number; notifications: ReviewNotification[] } }) {
    const [notifications, setNotifications] = useState(summary.notifications);
    const [isPending, startTransition] = useTransition();

    const handleSnooze = (id: string) => {
        startTransition(async () => {
            await snoozeReview(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        });
    };

    const handleDismiss = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const overdueItems = notifications.filter(n => n.urgency === 'overdue');
    const todayItems = notifications.filter(n => n.urgency === 'due_today');
    const upcomingItems = notifications.filter(n => n.urgency === 'upcoming');

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                            Repetitions-schema
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            {summary.total} ämne{summary.total !== 1 ? 'n' : ''} behöver din uppmärksamhet
                        </p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                        ← Tillbaka till översikten
                    </Link>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                        { label: 'Försenade', count: summary.overdue, color: '#EF4444', bg: '#FEE2E2' },
                        { label: 'Idag', count: summary.dueToday, color: '#dfa81b', bg: '#FEF3C7' },
                        { label: 'Kommande', count: summary.upcoming, color: '#3585a3', bg: '#DBEAFE' },
                    ].map(s => (
                        <div
                            key={s.label}
                            className="rounded-xl p-4 text-center"
                            style={{ background: s.bg }}
                        >
                            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
                            <p className="text-xs font-medium mt-1" style={{ color: s.color }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Notification groups */}
                <AnimatePresence mode="popLayout">
                    {overdueItems.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Försenade repetitioner
                            </h2>
                            <div className="space-y-2">
                                {overdueItems.map(n => (
                                    <NotificationCard key={n.id} notification={n} onSnooze={handleSnooze} onDismiss={handleDismiss} />
                                ))}
                            </div>
                        </div>
                    )}

                    {todayItems.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Att göra idag
                            </h2>
                            <div className="space-y-2">
                                {todayItems.map(n => (
                                    <NotificationCard key={n.id} notification={n} onSnooze={handleSnooze} onDismiss={handleDismiss} />
                                ))}
                            </div>
                        </div>
                    )}

                    {upcomingItems.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Kommande
                            </h2>
                            <div className="space-y-2">
                                {upcomingItems.map(n => (
                                    <NotificationCard key={n.id} notification={n} onSnooze={handleSnooze} onDismiss={handleDismiss} />
                                ))}
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {notifications.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                            Du är ikapp!
                        </h2>
                        <p className="text-sm text-zinc-500">
                            Inga repetitioner just nu. Fortsätt studera för att bygga ditt schema.
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
