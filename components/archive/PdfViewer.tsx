'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
    ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertTriangle,
} from 'lucide-react';

// Use the bundled worker from pdfjs-dist (avoids CDN flakiness)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
    /** The URL of the PDF to render (proxied through your API is fine) */
    url: string;
    /** Accent color class for spinner / page badge */
    accent?: 'blue' | 'emerald';
}

const SCALE_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5];
const DEFAULT_SCALE_IDX = 2; // 1.0

export default function PdfViewer({ url, accent = 'blue' }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [scaleIdx, setScaleIdx] = useState(DEFAULT_SCALE_IDX);
    const [containerWidth, setContainerWidth] = useState(800);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const scale = SCALE_STEPS[scaleIdx];
    const accentColor = accent === 'emerald' ? '#10B981' : '#3B82F6';

    // Track container width for responsive page rendering
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            setContainerWidth(entry.contentRect.width - 48); // subtract padding
        });
        ro.observe(el);
        setContainerWidth(el.clientWidth - 48);
        return () => ro.disconnect();
    }, []);

    // Intersection observer to track current visible page
    useEffect(() => {
        if (!numPages) return;
        observerRef.current?.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
                if (visible.length > 0) {
                    const idx = pageRefs.current.indexOf(visible[0].target as HTMLDivElement);
                    if (idx !== -1) setCurrentPage(idx + 1);
                }
            },
            {
                root: containerRef.current,
                threshold: [0.1, 0.5, 1],
            }
        );

        pageRefs.current.forEach((el) => {
            if (el) observerRef.current!.observe(el);
        });
        return () => observerRef.current?.disconnect();
    }, [numPages]);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        pageRefs.current = new Array(numPages).fill(null);
        setLoading(false);
        setError(false);
    }, []);

    const onDocumentLoadError = useCallback(() => {
        setLoading(false);
        setError(true);
    }, []);

    const scrollToPage = (page: number) => {
        pageRefs.current[page - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const zoomIn = () => setScaleIdx((i) => Math.min(i + 1, SCALE_STEPS.length - 1));
    const zoomOut = () => setScaleIdx((i) => Math.max(i - 1, 0));

    // Responsive width: use container width at scale 1, capped so it's never tiny
    const pageWidth = Math.max(300, Math.min(containerWidth, 900)) * scale;

    return (
        <div className="flex flex-col h-full bg-zinc-950 relative group/pdf">
            {/* ── Floating Toolbar ── */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-4 py-1.5 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl select-none opacity-40 focus-within:opacity-100 hover:opacity-100 transition-all duration-300">
                {/* Page navigation */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-medium text-zinc-300 tabular-nums px-2">
                        {numPages ? `${currentPage} / ${numPages}` : '—'}
                    </span>
                    <button
                        onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
                        disabled={!numPages || currentPage >= numPages}
                        className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                <div className="w-px h-5 bg-zinc-700" />

                {/* Zoom */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={zoomOut}
                        disabled={scaleIdx === 0}
                        className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ZoomOut size={15} />
                    </button>
                    <span className="text-xs font-medium text-zinc-400 w-10 text-center tabular-nums">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        disabled={scaleIdx === SCALE_STEPS.length - 1}
                        className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ZoomIn size={15} />
                    </button>
                </div>
            </div>

            {/* ── PDF Content ── */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto overflow-x-auto"
                style={{ scrollbarGutter: 'stable' }}
            >
                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Loader2
                            size={32}
                            className="animate-spin"
                            style={{ color: accentColor }}
                        />
                        <span className="text-sm text-zinc-500">Laddar dokument…</span>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                        <AlertTriangle size={32} className="text-red-400" />
                        <p className="text-sm text-zinc-400">
                            Kunde inte ladda PDF:en. Prova att öppna den i en ny flik.
                        </p>
                    </div>
                )}

                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={null}
                    className="flex flex-col items-center gap-4 py-6 px-6"
                >
                    {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                        <div
                            key={pageNum}
                            ref={(el) => { pageRefs.current[pageNum - 1] = el; }}
                            className="relative shadow-2xl rounded-sm overflow-hidden"
                            style={{ lineHeight: 0 }}
                        >
                            <Page
                                pageNumber={pageNum}
                                width={pageWidth}
                                renderAnnotationLayer={true}
                                renderTextLayer={true}
                                className="block"
                            />
                            {/* Page number badge */}
                            <div className="absolute bottom-2 right-3 text-[10px] font-mono text-white/40 select-none pointer-events-none">
                                {pageNum}
                            </div>
                        </div>
                    ))}
                </Document>
            </div>
        </div>
    );
}
