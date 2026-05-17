import { Metadata } from 'next';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export const metadata: Metadata = {
    title: 'Läranalys | Qmath',
    description: 'Insikter om dina studieframsteg, felanalys och beteendemönster',
};

/**
 * /analytics – Learning Analytics page.
 *
 * The hero strip inside AnalyticsDashboard owns the page heading; we just
 * supply the outer container.
 *
 * Uses mock data by default. To wire in real data: fetch from the database
 * here (server component) and pass the resolved props to AnalyticsDashboard.
 */
export default function AnalyticsPage() {
    return (
        <div className="liquid-theme relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 pb-24 text-zinc-950 dark:bg-[#08091f] dark:text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(147,51,234,0.14),transparent_30%),radial-gradient(circle_at_52%_90%,rgba(16,185,129,0.13),transparent_34%),linear-gradient(135deg,#f8fbff_0%,#edf4ff_48%,#f7f3ff_100%)] dark:bg-[radial-gradient(circle_at_12%_14%,rgba(59,130,246,0.45),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(147,51,234,0.38),transparent_30%),radial-gradient(circle_at_52%_90%,rgba(16,185,129,0.24),transparent_34%),linear-gradient(135deg,#050816_0%,#11164e_48%,#24104f_100%)]" />
            <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.55),transparent_24%,rgba(255,255,255,0.24)_52%,transparent_76%)] dark:bg-[linear-gradient(115deg,rgba(255,255,255,0.10),transparent_24%,rgba(255,255,255,0.04)_52%,transparent_76%)]" />
            <div className="relative z-10 mx-auto max-w-6xl">
                <AnalyticsDashboard />
            </div>
        </div>
    );
}
