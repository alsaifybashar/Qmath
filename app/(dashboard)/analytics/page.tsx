import { Metadata } from 'next';
import AnalyticsProgressReport from '@/components/analytics/AnalyticsProgressReport';
import { getAnalyticsProgress } from '@/app/actions/analytics-progress';

export const metadata: Metadata = {
    title: 'Progressrapport | Qmath',
    description: 'En enkel rapport över dina studieframsteg och nästa bästa steg',
};

/**
 * /analytics – student progress report. Real per-topic progress from the
 * study grading spine; the component's demo dataset is only the empty-state
 * fallback for students with no practice history yet.
 */
export default async function AnalyticsPage() {
    const studentProgress = await getAnalyticsProgress();
    return <AnalyticsProgressReport studentProgress={studentProgress ?? undefined} />;
}
