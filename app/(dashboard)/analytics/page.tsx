import { Metadata } from 'next';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export const metadata: Metadata = {
    title: 'Läranalys | Qmath',
    description: 'Insikter om dina studieframsteg, felanalys och beteendemönster',
};

/**
 * /analytics – Learning Analytics demo page.
 *
 * Uses mock data by default.  To wire in real data: fetch from the database
 * here (server component) and pass the resolved props to AnalyticsDashboard.
 */
export default function AnalyticsPage() {
    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Läranalys
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Djupdyk i dina studieframsteg, felanalys och beteendemönster
                </p>
            </div>

            <AnalyticsDashboard />
        </div>
    );
}
