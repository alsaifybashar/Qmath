'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HexNode,
    HexGridConfig,
    HexPixel,
    hexToPixel,
    getHexPath,
    generateDependencyLayout,
    generateArrowPath,
    calculateGridBounds,
    MASTERY_COLORS,
    LOCKED_STYLE,
    DEFAULT_HEX_CONFIG,
} from '@/lib/dashboard/hex-grid';

// ============================================================================
// TYPES
// ============================================================================

export interface TopicNode {
    id: string;
    title: string;
    shortTitle?: string;
    masteryLevel: 0 | 1 | 2 | 3 | 4 | 5;
    isLocked: boolean;
    prerequisites: string[];
    totalAttempts: number;
    correctAttempts: number;
    lastPracticed: Date | null;
    nextReview: Date | null;
    category?: string;
    difficulty?: number;
    estimatedMinutes?: number;
}

interface KnowledgeMapProps {
    topics: TopicNode[];
    onTopicClick?: (topicId: string) => void;
    onPractice?: (topicId: string) => void;
    className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function KnowledgeMap({
    topics,
    onTopicClick,
    onPractice,
    className = '',
}: KnowledgeMapProps) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 500 });
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Default practice handler
    const handlePractice = (topicId: string) => {
        if (onPractice) {
            onPractice(topicId);
        } else {
            router.push(`/practice/${topicId}`);
        }
    };

    // Grid configuration
    const config: HexGridConfig = useMemo(() => ({
        ...DEFAULT_HEX_CONFIG,
        hexSize: 50,
        spacing: 8,
        origin: { x: 400, y: 100 },
    }), []);

    // Convert topics to hex nodes with layout
    const { nodes, connections, bounds } = useMemo(() => {
        if (topics.length === 0) {
            return { nodes: [], connections: [], bounds: { minX: 0, maxX: 800, minY: 0, maxY: 500, width: 800, height: 500 } };
        }

        // Generate dependency-based layout
        const layout = generateDependencyLayout(
            topics.map(t => ({ id: t.id, prerequisites: t.prerequisites })),
            6
        );

        // Create hex nodes
        const hexNodes: HexNode[] = topics.map(topic => {
            const coord = layout.get(topic.id) || { q: 0, r: 0 };
            const accuracy = topic.totalAttempts > 0
                ? (topic.correctAttempts / topic.totalAttempts) * 100
                : 0;

            return {
                id: topic.id,
                title: topic.title,
                shortTitle: topic.shortTitle || topic.title.substring(0, 12),
                coord,
                masteryLevel: topic.masteryLevel,
                isLocked: topic.isLocked,
                isCompleted: topic.masteryLevel >= 5,
                prerequisites: topic.prerequisites,
                dependents: topics.filter(t => t.prerequisites.includes(topic.id)).map(t => t.id),
                stats: {
                    totalAttempts: topic.totalAttempts,
                    correctAttempts: topic.correctAttempts,
                    accuracy,
                    avgTimeSeconds: 45,
                    lastPracticed: topic.lastPracticed,
                    nextReview: topic.nextReview,
                },
                category: topic.category,
                difficulty: topic.difficulty,
                estimatedMinutes: topic.estimatedMinutes,
            };
        });

        // Generate connections (dependency arrows)
        const conns: Array<{ from: string; to: string; fromPixel: HexPixel; toPixel: HexPixel }> = [];

        hexNodes.forEach(node => {
            node.prerequisites.forEach(prereqId => {
                const prereqNode = hexNodes.find(n => n.id === prereqId);
                if (prereqNode) {
                    const fromPixel = hexToPixel(prereqNode.coord, config);
                    const toPixel = hexToPixel(node.coord, config);
                    conns.push({
                        from: prereqId,
                        to: node.id,
                        fromPixel,
                        toPixel,
                    });
                }
            });
        });

        // Calculate bounds
        const coords = hexNodes.map(n => n.coord);
        const gridBounds = calculateGridBounds(coords, config);

        return { nodes: hexNodes, connections: conns, bounds: gridBounds };
    }, [topics, config]);

    // Update viewBox based on bounds with padding
    useEffect(() => {
        if (bounds.width > 0 && bounds.height > 0) {
            const padding = 100;
            setViewBox({
                x: bounds.minX - padding,
                y: bounds.minY - padding,
                width: bounds.width + padding * 2,
                height: bounds.height + padding * 2,
            });
        }
    }, [bounds]);

    // Handle zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.max(0.5, Math.min(2, z * delta)));
    }, []);

    // Handle pan
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 0 && !selectedNode) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    }, [pan, selectedNode]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Handle node selection
    const handleNodeClick = useCallback((nodeId: string) => {
        setSelectedNode(prev => prev === nodeId ? null : nodeId);
        onTopicClick?.(nodeId);
    }, [onTopicClick]);

    // Get selected node data
    const selectedNodeData = useMemo(() => {
        return nodes.find(n => n.id === selectedNode);
    }, [nodes, selectedNode]);

    // Summary stats
    const summaryStats = useMemo(() => {
        const total = nodes.length;
        const mastered = nodes.filter(n => n.masteryLevel >= 5).length;
        const inProgress = nodes.filter(n => n.masteryLevel > 0 && n.masteryLevel < 5).length;
        const locked = nodes.filter(n => n.isLocked).length;
        const avgMastery = total > 0
            ? nodes.reduce((sum, n) => sum + n.masteryLevel, 0) / total
            : 0;

        return { total, mastered, inProgress, locked, avgMastery };
    }, [nodes]);

    return (
        <div className={`relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        <h2 className="text-lg font-bold">Knowledge Map</h2>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                            <span className="text-zinc-500">{summaryStats.mastered} Mastered</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-zinc-500">{summaryStats.inProgress} In Progress</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-zinc-400" />
                            <span className="text-zinc-500">{summaryStats.locked} Locked</span>
                        </div>
                    </div>
                </div>

                {/* Mastery legend */}
                <div className="flex items-center gap-2 mt-3">
                    {Object.entries(MASTERY_COLORS).map(([level, colors]) => (
                        <div
                            key={level}
                            className="flex items-center gap-1 text-xs"
                            title={colors.label}
                        >
                            <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: colors.fill, border: `2px solid ${colors.stroke}` }}
                            />
                            <span className="text-zinc-500 hidden lg:inline">{colors.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Map Container */}
            <div
                ref={containerRef}
                className="relative h-[400px] overflow-hidden cursor-grab active:cursor-grabbing"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {topics.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🗺️</div>
                            <h3 className="text-lg font-bold mb-2">Your Knowledge Map</h3>
                            <p className="text-sm text-zinc-500 max-w-sm">
                                Start practicing topics to build your knowledge map.
                                Each hexagon represents a topic and shows your mastery level.
                            </p>
                        </div>
                    </div>
                ) : (
                    <svg
                        width="100%"
                        height="100%"
                        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                        style={{
                            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                        }}
                    >
                        <defs>
                            {/* Glow filter for hovered nodes */}
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>

                            {/* Shadow filter */}
                            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
                            </filter>

                            {/* Gradient for connections */}
                            <linearGradient id="connectionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.6" />
                            </linearGradient>
                        </defs>

                        {/* Connection lines (dependencies) */}
                        <g className="connections">
                            {connections.map(conn => {
                                const { path, arrowHead } = generateArrowPath(
                                    conn.fromPixel,
                                    conn.toPixel,
                                    config.hexSize,
                                    6
                                );
                                const isHighlighted =
                                    hoveredNode === conn.from ||
                                    hoveredNode === conn.to ||
                                    selectedNode === conn.from ||
                                    selectedNode === conn.to;

                                return (
                                    <g key={`${conn.from}-${conn.to}`}>
                                        <path
                                            d={path}
                                            fill="none"
                                            stroke={isHighlighted ? '#8b5cf6' : '#d4d4d8'}
                                            strokeWidth={isHighlighted ? 2.5 : 1.5}
                                            strokeDasharray={isHighlighted ? 'none' : '4,2'}
                                            opacity={isHighlighted ? 1 : 0.5}
                                            className="transition-all duration-200"
                                        />
                                        <path
                                            d={arrowHead}
                                            fill={isHighlighted ? '#8b5cf6' : '#a1a1aa'}
                                            opacity={isHighlighted ? 1 : 0.5}
                                            className="transition-all duration-200"
                                        />
                                    </g>
                                );
                            })}
                        </g>

                        {/* Hexagon nodes */}
                        <g className="nodes">
                            {nodes.map(node => (
                                <HexagonNode
                                    key={node.id}
                                    node={node}
                                    config={config}
                                    isHovered={hoveredNode === node.id}
                                    isSelected={selectedNode === node.id}
                                    onHover={setHoveredNode}
                                    onClick={handleNodeClick}
                                />
                            ))}
                        </g>
                    </svg>
                )}

                {/* Zoom controls */}
                <div className="absolute bottom-4 left-4 flex flex-col gap-1">
                    <button
                        onClick={() => setZoom(z => Math.min(2, z * 1.2))}
                        className="w-8 h-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <span className="text-lg">+</span>
                    </button>
                    <button
                        onClick={() => setZoom(z => Math.max(0.5, z * 0.8))}
                        className="w-8 h-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <span className="text-lg">−</span>
                    </button>
                    <button
                        onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                        className="w-8 h-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-xs"
                    >
                        ⟲
                    </button>
                </div>
            </div>

            {/* Tooltip */}
            <AnimatePresence>
                {hoveredNode && !selectedNode && (
                    <HexTooltip
                        node={nodes.find(n => n.id === hoveredNode)!}
                        containerRef={containerRef}
                    />
                )}
            </AnimatePresence>

            {/* Detail Panel */}
            <AnimatePresence>
                {selectedNodeData && (
                    <DetailPanel
                        node={selectedNodeData}
                        allNodes={nodes}
                        onClose={() => setSelectedNode(null)}
                        onPractice={handlePractice}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// HEXAGON NODE COMPONENT
// ============================================================================

interface HexagonNodeProps {
    node: HexNode;
    config: HexGridConfig;
    isHovered: boolean;
    isSelected: boolean;
    onHover: (id: string | null) => void;
    onClick: (id: string) => void;
}

function HexagonNode({
    node,
    config,
    isHovered,
    isSelected,
    onHover,
    onClick,
}: HexagonNodeProps) {
    const center = hexToPixel(node.coord, config);
    const path = getHexPath(center, config.hexSize, config.orientation);

    const colors = node.isLocked ? LOCKED_STYLE : MASTERY_COLORS[node.masteryLevel];
    const scale = isHovered || isSelected ? 1.08 : 1;

    return (
        <g
            className="cursor-pointer transition-transform"
            style={{
                transform: `scale(${scale})`,
                transformOrigin: `${center.x}px ${center.y}px`,
            }}
            onMouseEnter={() => onHover(node.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onClick(node.id)}
        >
            {/* Hexagon shape */}
            <path
                d={path}
                fill={colors.fill}
                stroke={isSelected ? '#8b5cf6' : isHovered ? colors.stroke : colors.stroke}
                strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 2}
                filter={isHovered || isSelected ? 'url(#glow)' : 'url(#shadow)'}
                style={{
                    opacity: node.isLocked ? LOCKED_STYLE.opacity : 1,
                    transition: 'all 0.2s ease',
                }}
            />

            {/* Inner progress ring for in-progress topics */}
            {node.masteryLevel > 0 && node.masteryLevel < 5 && !node.isLocked && (
                <circle
                    cx={center.x}
                    cy={center.y}
                    r={config.hexSize * 0.65}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={3}
                    strokeDasharray={`${(node.masteryLevel / 5) * Math.PI * config.hexSize * 1.3} ${Math.PI * config.hexSize * 1.3}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center.x} ${center.y})`}
                    opacity={0.4}
                />
            )}

            {/* Lock icon for locked nodes */}
            {node.isLocked && (
                <g transform={`translate(${center.x}, ${center.y})`}>
                    <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={24}
                        fill={LOCKED_STYLE.text}
                    >
                        🔒
                    </text>
                </g>
            )}

            {/* Mastery star for completed topics */}
            {node.masteryLevel >= 5 && !node.isLocked && (
                <g transform={`translate(${center.x + config.hexSize * 0.5}, ${center.y - config.hexSize * 0.5})`}>
                    <circle cx={0} cy={0} r={12} fill="#fbbf24" stroke="#f59e0b" strokeWidth={1.5} />
                    <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={12}
                        fill="#fff"
                    >
                        ⭐
                    </text>
                </g>
            )}

            {/* Topic title */}
            {!node.isLocked && (
                <text
                    x={center.x}
                    y={center.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill={colors.text}
                    style={{ pointerEvents: 'none' }}
                >
                    {node.shortTitle.length > 10
                        ? node.shortTitle.substring(0, 10) + '...'
                        : node.shortTitle
                    }
                </text>
            )}

            {/* Mastery level indicator */}
            {!node.isLocked && node.masteryLevel > 0 && (
                <text
                    x={center.x}
                    y={center.y + 18}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={9}
                    fill={colors.text}
                    opacity={0.7}
                    style={{ pointerEvents: 'none' }}
                >
                    Lv.{node.masteryLevel}
                </text>
            )}
        </g>
    );
}

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

interface HexTooltipProps {
    node: HexNode;
    containerRef: React.RefObject<HTMLDivElement>;
}

function HexTooltip({ node }: HexTooltipProps) {
    const colors = node.isLocked ? LOCKED_STYLE : MASTERY_COLORS[node.masteryLevel];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 right-4 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-4 min-w-[200px] z-10"
        >
            <div className="flex items-start gap-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: colors.fill, border: `2px solid ${colors.stroke}` }}
                >
                    {node.isLocked ? '🔒' : node.masteryLevel >= 5 ? '⭐' : '📚'}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm">{node.title}</h4>
                    <p className="text-xs text-zinc-500">
                        {node.isLocked ? 'Complete prerequisites to unlock' : MASTERY_COLORS[node.masteryLevel].label}
                    </p>
                </div>
            </div>

            {!node.isLocked && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <span className="text-zinc-500">Accuracy</span>
                        <div className="font-bold">{node.stats.accuracy.toFixed(0)}%</div>
                    </div>
                    <div>
                        <span className="text-zinc-500">Attempts</span>
                        <div className="font-bold">{node.stats.totalAttempts}</div>
                    </div>
                </div>
            )}

            {node.prerequisites.length > 0 && node.isLocked && (
                <div className="mt-3 text-xs text-zinc-500">
                    <span className="font-medium">Prerequisites:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                        {node.prerequisites.map(prereq => (
                            <span key={prereq} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded">
                                {prereq}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// DETAIL PANEL COMPONENT
// ============================================================================

interface DetailPanelProps {
    node: HexNode;
    allNodes: HexNode[];
    onClose: () => void;
    onPractice?: (topicId: string) => void;
}

function DetailPanel({ node, allNodes, onClose, onPractice }: DetailPanelProps) {
    const colors = node.isLocked ? LOCKED_STYLE : MASTERY_COLORS[node.masteryLevel];
    const prerequisiteNodes = allNodes.filter(n => node.prerequisites.includes(n.id));
    const dependentNodes = allNodes.filter(n => node.dependents.includes(n.id));

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 bottom-4 w-80 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-20"
        >
            {/* Header */}
            <div
                className="p-4"
                style={{ backgroundColor: colors.fill }}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                            style={{ backgroundColor: 'white', border: `2px solid ${colors.stroke}` }}
                        >
                            {node.isLocked ? '🔒' : node.masteryLevel >= 5 ? '⭐' : '📖'}
                        </div>
                        <div>
                            <h3 className="font-bold" style={{ color: colors.text }}>{node.title}</h3>
                            <p className="text-sm opacity-70" style={{ color: colors.text }}>
                                {node.isLocked ? 'Locked' : MASTERY_COLORS[node.masteryLevel].label}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-xl opacity-50 hover:opacity-100"
                        style={{ color: colors.text }}
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100%-180px)]">
                {/* Stats grid */}
                {!node.isLocked && (
                    <div className="grid grid-cols-2 gap-3">
                        <StatBox label="Mastery" value={`Level ${node.masteryLevel}`} icon="📊" />
                        <StatBox label="Accuracy" value={`${node.stats.accuracy.toFixed(0)}%`} icon="🎯" />
                        <StatBox label="Attempts" value={node.stats.totalAttempts.toString()} icon="📝" />
                        <StatBox
                            label="Last Practiced"
                            value={node.stats.lastPracticed
                                ? formatRelativeTime(node.stats.lastPracticed)
                                : 'Never'}
                            icon="⏰"
                        />
                    </div>
                )}

                {/* Mastery progress */}
                {!node.isLocked && node.masteryLevel < 5 && (
                    <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-medium">Mastery Progress</span>
                            <span className="text-zinc-500">{node.masteryLevel}/5</span>
                        </div>
                        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(node.masteryLevel / 5) * 100}%` }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: colors.stroke }}
                            />
                        </div>
                    </div>
                )}

                {/* Prerequisites */}
                {prerequisiteNodes.length > 0 && (
                    <div>
                        <h4 className="font-medium text-sm mb-2">Prerequisites</h4>
                        <div className="space-y-2">
                            {prerequisiteNodes.map(prereq => (
                                <div
                                    key={prereq.id}
                                    className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-700 rounded-lg text-sm"
                                >
                                    <div
                                        className="w-6 h-6 rounded flex items-center justify-center text-xs"
                                        style={{
                                            backgroundColor: MASTERY_COLORS[prereq.masteryLevel].fill,
                                            border: `1px solid ${MASTERY_COLORS[prereq.masteryLevel].stroke}`,
                                        }}
                                    >
                                        {prereq.masteryLevel >= 3 ? '✓' : prereq.masteryLevel}
                                    </div>
                                    <span className="flex-1 truncate">{prereq.title}</span>
                                    {prereq.masteryLevel >= 3 && (
                                        <span className="text-green-600 text-xs">✓</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Unlocks */}
                {dependentNodes.length > 0 && (
                    <div>
                        <h4 className="font-medium text-sm mb-2">Unlocks</h4>
                        <div className="flex flex-wrap gap-1">
                            {dependentNodes.map(dep => (
                                <span
                                    key={dep.id}
                                    className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 rounded text-xs"
                                >
                                    {dep.shortTitle}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Locked message */}
                {node.isLocked && (
                    <div className="text-center py-4">
                        <div className="text-4xl mb-2">🔒</div>
                        <h4 className="font-bold mb-1">Topic Locked</h4>
                        <p className="text-sm text-zinc-500">
                            Complete the prerequisites above to unlock this topic.
                        </p>
                    </div>
                )}
            </div>

            {/* Action button */}
            {!node.isLocked && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white dark:from-zinc-800 to-transparent">
                    <button
                        onClick={() => onPractice?.(node.id)}
                        className="w-full py-3 rounded-xl font-bold text-white transition-colors"
                        style={{ backgroundColor: colors.stroke }}
                    >
                        {node.masteryLevel === 0 ? 'Start Learning' : 'Practice Now'}
                    </button>
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div className="bg-zinc-100 dark:bg-zinc-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                <span>{icon}</span>
                <span>{label}</span>
            </div>
            <div className="font-bold text-sm">{value}</div>
        </div>
    );
}

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}
