'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Lightbulb, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardInsight {
    type: 'warning' | 'success' | 'tip' | 'milestone';
    title: string;
    message: string;
    actionLabel?: string;
    actionHref?: string;
    priority: number;
}

interface StudyPattern {
    mostProductiveDay: string;
    mostProductiveHour: number;
    averageSessionMinutes: number;
    consistencyScore: number;
    activeDays: number;
}

const insightConfig = {
    warning: {
        icon: AlertTriangle,
        gradient: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
        iconColor: '#D97706',
        borderColor: '#F59E0B33',
    },
    success: {
        icon: CheckCircle,
        gradient: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
        iconColor: '#059669',
        borderColor: '#10B98133',
    },
    tip: {
        icon: Lightbulb,
        gradient: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
        iconColor: '#2563EB',
        borderColor: '#3B82F633',
    },
    milestone: {
        icon: Trophy,
        gradient: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)',
        iconColor: '#7C3AED',
        borderColor: '#8B5CF633',
    },
};

export function InsightCards({ insights }: { insights: DashboardInsight[] }) {
    if (insights.length === 0) return null;

    return (
        <div className="space-y-3">
            {insights.slice(0, 3).map((insight, idx) => {
                const config = insightConfig[insight.type];
                const Icon = config.icon;

                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.3 }}
                        className="flex items-start gap-3 p-4 rounded-xl"
                        style={{
                            background: config.gradient,
                            border: `1px solid ${config.borderColor}`,
                        }}
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${config.iconColor}20` }}
                        >
                            <Icon className="w-4 h-4" style={{ color: config.iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: '#1A1D2E' }}>
                                {insight.title}
                            </p>
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#4B5563' }}>
                                {insight.message}
                            </p>
                            {insight.actionLabel && insight.actionHref && (
                                <Link
                                    href={insight.actionHref}
                                    className="inline-flex items-center gap-1 text-xs font-semibold mt-2 hover:opacity-80 transition-opacity"
                                    style={{ color: config.iconColor }}
                                >
                                    {insight.actionLabel}
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

export function StudyPatternCard({ pattern }: { pattern: StudyPattern | null }) {
    if (!pattern) return null;

    const formatHour = (h: number) => {
        if (h === 0) return '12 AM';
        if (h < 12) return `${h} AM`;
        if (h === 12) return '12 PM';
        return `${h - 12} PM`;
    };

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
            <h3 className="text-base font-semibold mb-4" style={{ color: '#1A1D2E' }}>
                Your Study Patterns
            </h3>

            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-3" style={{ background: '#F8FAFC' }}>
                    <p className="text-xs" style={{ color: '#A0A5C0' }}>Best Day</p>
                    <p className="text-sm font-bold mt-1" style={{ color: '#1A1D2E' }}>
                        {pattern.mostProductiveDay}
                    </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#F8FAFC' }}>
                    <p className="text-xs" style={{ color: '#A0A5C0' }}>Peak Hour</p>
                    <p className="text-sm font-bold mt-1" style={{ color: '#1A1D2E' }}>
                        {formatHour(pattern.mostProductiveHour)}
                    </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#F8FAFC' }}>
                    <p className="text-xs" style={{ color: '#A0A5C0' }}>Avg Session</p>
                    <p className="text-sm font-bold mt-1" style={{ color: '#1A1D2E' }}>
                        {pattern.averageSessionMinutes} min
                    </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#F8FAFC' }}>
                    <p className="text-xs" style={{ color: '#A0A5C0' }}>Consistency</p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm font-bold" style={{ color: '#1A1D2E' }}>
                            {pattern.consistencyScore}%
                        </p>
                        <span className="text-[10px]" style={{ color: '#A0A5C0' }}>
                            ({pattern.activeDays}/30 days)
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
