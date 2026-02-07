'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import {
    type CityProgress,
    type BuildingState,
    type WeatherType,
    type TimeOfDay,
    ACHIEVEMENTS,
    getAchievementById,
    getRarityColor,
} from '@/lib/dashboard/city-system';

// ============================================================================
// TYPES
// ============================================================================

export interface CityState {
    userId: string;
    courseId: string;
    cityLevel: number;
    totalXp: number;
    buildings: Record<string, number>;
    weather: 'sunny' | 'cloudy' | 'rainy';
    lastUpdated: Date;
}

interface VirtualCityProps {
    cityState: CityState;
    courseName: string;
    cityProgress?: CityProgress;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VirtualCity({ cityState, courseName, cityProgress }: VirtualCityProps) {
    const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<BuildingState | null>(null);
    const [showAchievement, setShowAchievement] = useState<string | null>(null);

    // Time-based rendering
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const hour = currentTime.getHours();
    const timeOfDay = useMemo((): TimeOfDay => {
        if (hour >= 5 && hour < 7) return 'dawn';
        if (hour >= 7 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 20) return 'evening';
        return 'night';
    }, [hour]);

    const isNight = timeOfDay === 'night';
    const isDawn = timeOfDay === 'dawn';
    const isEvening = timeOfDay === 'evening';

    // Weather from city progress or fallback
    const weather: WeatherType = cityProgress?.weather?.current || cityState.weather || 'sunny';

    // Sky gradient based on time and weather
    const getSkyGradient = () => {
        if (isNight) {
            return 'linear-gradient(to bottom, #0f172a 0%, #1e293b 40%, #334155 100%)';
        }
        if (isDawn) {
            return 'linear-gradient(to bottom, #1e3a5f 0%, #f97316 30%, #fcd34d 100%)';
        }
        if (isEvening) {
            return 'linear-gradient(to bottom, #1e3a5f 0%, #f97316 40%, #fcd34d 100%)';
        }

        switch (weather) {
            case 'sunny':
                return 'linear-gradient(to bottom, #2563eb 0%, #60a5fa 50%, #93c5fd 100%)';
            case 'partly_cloudy':
                return 'linear-gradient(to bottom, #3b82f6 0%, #94a3b8 100%)';
            case 'cloudy':
                return 'linear-gradient(to bottom, #64748b 0%, #94a3b8 100%)';
            case 'rainy':
                return 'linear-gradient(to bottom, #475569 0%, #64748b 100%)';
            case 'stormy':
                return 'linear-gradient(to bottom, #1e293b 0%, #475569 100%)';
            default:
                return 'linear-gradient(to bottom, #60a5fa 0%, #93c5fd 100%)';
        }
    };

    // Buildings data
    const buildings = cityProgress?.buildings || [];
    const inhabitants = cityProgress?.inhabitants || 3;

    // XP Progress calculation
    const xpProgress = cityProgress?.xpProgress || ((cityState.totalXp % 300) / 3);
    const xpToNext = cityProgress?.xpToNextLevel || (300 - (cityState.totalXp % 300));

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-lg">
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="text-2xl">🏙️</span>
                            {cityProgress?.levelName || 'Your City'}: {courseName}
                        </h2>
                        <p className="text-sm text-zinc-500 mt-1">
                            {cityProgress?.weather?.description || 'Build your knowledge city!'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <WeatherIndicator weather={weather} />
                        <div className="text-sm text-zinc-500">
                            Level {cityProgress?.level || cityState.cityLevel}
                        </div>
                        <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-sm font-bold text-white shadow-lg">
                            ⚡ {cityState.totalXp} XP
                        </div>
                    </div>
                </div>

                {/* XP Progress Bar */}
                <div className="relative h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress}%` }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                    {/* Shimmer effect */}
                    <motion.div
                        className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '500%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                </div>
                <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-zinc-400">
                        {Math.max(0, xpToNext)} XP to next level
                    </div>
                    <div className="text-xs text-zinc-400">
                        {inhabitants} 👤 inhabitants
                    </div>
                </div>
            </div>

            {/* City Canvas */}
            <div
                className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-inner border border-zinc-200 dark:border-zinc-700"
                style={{ background: getSkyGradient() }}
            >
                <svg
                    viewBox="0 0 600 340"
                    className="w-full h-full"
                    style={{ filter: isNight ? 'brightness(0.85)' : 'brightness(1)' }}
                >
                    <defs>
                        {/* Gradients */}
                        <linearGradient id="grassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={isNight ? '#1a4731' : '#22c55e'} />
                            <stop offset="100%" stopColor={isNight ? '#14532d' : '#16a34a'} />
                        </linearGradient>
                        <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#374151" />
                            <stop offset="100%" stopColor="#1f2937" />
                        </linearGradient>
                        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#fef3c7" />
                            <stop offset="100%" stopColor="#fbbf24" />
                        </radialGradient>
                        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#fef9c3" />
                            <stop offset="100%" stopColor="#fef3c7" stopOpacity="0.5" />
                        </radialGradient>
                        {/* Window glow for night */}
                        <filter id="windowGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Background layers */}
                    {/* Distant mountains */}
                    <path
                        d="M0 280 L60 220 L120 250 L180 200 L240 240 L300 180 L360 230 L420 190 L480 235 L540 210 L600 250 L600 340 L0 340 Z"
                        fill={isNight ? '#1e293b' : '#94a3b8'}
                        opacity="0.3"
                    />

                    {/* Ground */}
                    <rect x="0" y="280" width="600" height="60" fill="url(#grassGradient)" />

                    {/* Roads */}
                    <rect x="0" y="300" width="600" height="12" fill="url(#roadGradient)" />
                    <line x1="0" y1="306" x2="600" y2="306" stroke="#fbbf24" strokeWidth="1" strokeDasharray="20,10" opacity="0.6" />

                    {/* Weather Effects */}
                    <WeatherEffects weather={weather} isNight={isNight} />

                    {/* Stars (night only) */}
                    {isNight && <Stars />}

                    {/* Sun/Moon */}
                    <CelestialBody timeOfDay={timeOfDay} hour={hour} />

                    {/* Clouds */}
                    <Clouds weather={weather} isNight={isNight} />

                    {/* Buildings */}
                    {buildings.map((building) => (
                        <g
                            key={building.definition.id}
                            onMouseEnter={() => setHoveredBuilding(building.definition.id)}
                            onMouseLeave={() => setHoveredBuilding(null)}
                            onClick={() => setSelectedBuilding(building)}
                            style={{ cursor: 'pointer' }}
                        >
                            <BuildingSVG
                                building={building}
                                isHovered={hoveredBuilding === building.definition.id}
                                isNight={isNight}
                            />
                        </g>
                    ))}

                    {/* Fallback buildings if no city progress */}
                    {buildings.length === 0 && (
                        <>
                            <FallbackBuilding x={100} y={280} type="library" level={cityState.buildings.library || 0} isNight={isNight} />
                            <FallbackBuilding x={200} y={280} type="townhall" level={cityState.cityLevel} isNight={isNight} />
                            <FallbackBuilding x={350} y={280} type="observatory" level={cityState.buildings.observatory || 0} isNight={isNight} />
                            <FallbackBuilding x={450} y={280} type="garden" level={cityState.buildings.garden || 0} isNight={isNight} />
                        </>
                    )}

                    {/* Inhabitants */}
                    {[...Array(Math.min(inhabitants, 8))].map((_, i) => (
                        <Inhabitant
                            key={i}
                            startX={40 + i * 70}
                            y={295}
                            isNight={isNight}
                            delay={i * 0.5}
                            variant={i % 4}
                        />
                    ))}

                    {/* Decorative elements */}
                    <Trees isNight={isNight} />
                    <Streetlamps isNight={isNight} />
                </svg>

                {/* Hover Tooltip */}
                <AnimatePresence>
                    {hoveredBuilding && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 px-4 py-3 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 pointer-events-none z-10"
                        >
                            {buildings.find((b) => b.definition.id === hoveredBuilding) && (
                                <BuildingTooltip building={buildings.find((b) => b.definition.id === hoveredBuilding)!} />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Time indicator */}
                <div className="absolute top-3 right-3 px-3 py-1 bg-black/30 backdrop-blur-sm rounded-full text-xs text-white">
                    {timeOfDay === 'night' ? '🌙' : timeOfDay === 'dawn' || timeOfDay === 'evening' ? '🌅' : '☀️'}
                    {' '}{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {/* Building Details Modal */}
            <AnimatePresence>
                {selectedBuilding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedBuilding(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <BuildingDetails
                                building={selectedBuilding}
                                onClose={() => setSelectedBuilding(null)}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Achievement Toast */}
            <AnimatePresence>
                {showAchievement && (
                    <AchievementToast
                        achievementId={showAchievement}
                        onClose={() => setShowAchievement(null)}
                    />
                )}
            </AnimatePresence>

            {/* Building Legend */}
            <div className="mt-4 flex flex-wrap gap-2">
                {buildings.slice(0, 5).map((b) => (
                    <button
                        key={b.definition.id}
                        onClick={() => setSelectedBuilding(b)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${b.unlocked
                            ? 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 opacity-60'
                            }`}
                    >
                        <span className="mr-1">{b.definition.emoji}</span>
                        {b.definition.name}
                        {b.unlocked && (
                            <span className="ml-1 text-purple-500">Lv.{b.level}</span>
                        )}
                    </button>
                ))}
                {buildings.length > 5 && (
                    <span className="px-3 py-1.5 text-sm text-zinc-400">
                        +{buildings.length - 5} more
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function WeatherIndicator({ weather }: { weather: WeatherType }) {
    const getIcon = () => {
        switch (weather) {
            case 'sunny': return '☀️';
            case 'partly_cloudy': return '⛅';
            case 'cloudy': return '☁️';
            case 'rainy': return '🌧️';
            case 'stormy': return '⛈️';
            case 'snowy': return '❄️';
            default: return '☀️';
        }
    };

    return (
        <motion.div
            className="text-2xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
        >
            {getIcon()}
        </motion.div>
    );
}

function Stars() {
    const [stars, setStars] = useState<Array<{ cx: number; cy: number; r: number; delay: number; duration: number }>>([]);

    useEffect(() => {
        setStars([...Array(30)].map(() => ({
            cx: Math.random() * 600,
            cy: Math.random() * 150,
            r: Math.random() * 1.5 + 0.5,
            delay: Math.random() * 2,
            duration: 2 + Math.random() * 2,
        })));
    }, []);

    return (
        <g>
            {stars.map((star, i) => (
                <motion.circle
                    key={i}
                    cx={star.cx}
                    cy={star.cy}
                    r={star.r}
                    fill="#fef9c3"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                        duration: star.duration,
                        repeat: Infinity,
                        delay: star.delay,
                    }}
                />
            ))}
        </g>
    );
}

function CelestialBody({ timeOfDay, hour }: { timeOfDay: TimeOfDay; hour: number }) {
    // Calculate position based on hour
    const progress = timeOfDay === 'night'
        ? (hour >= 20 ? (hour - 20) / 10 : (hour + 4) / 10)
        : (hour - 6) / 12;

    const x = 100 + progress * 400;
    const y = 60 + Math.sin(progress * Math.PI) * -30;

    if (timeOfDay === 'night') {
        return (
            <g>
                <circle cx={x} cy={y} r="18" fill="url(#moonGlow)" />
                <circle cx={x - 4} cy={y - 2} r="14" fill="#fef9c3" />
                {/* Moon craters */}
                <circle cx={x - 6} cy={y - 4} r="2" fill="#fef3c7" opacity="0.5" />
                <circle cx={x - 2} cy={y + 2} r="1.5" fill="#fef3c7" opacity="0.5" />
            </g>
        );
    }

    return (
        <g>
            {/* Sun glow */}
            <motion.circle
                cx={x}
                cy={y}
                r="35"
                fill="#fbbf24"
                opacity="0.2"
                animate={{ r: [35, 40, 35] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
            <circle cx={x} cy={y} r="22" fill="url(#sunGlow)" />
            {/* Sun rays */}
            {[...Array(8)].map((_, i) => (
                <motion.line
                    key={i}
                    x1={x + Math.cos((i * Math.PI) / 4) * 28}
                    y1={y + Math.sin((i * Math.PI) / 4) * 28}
                    x2={x + Math.cos((i * Math.PI) / 4) * 38}
                    y2={y + Math.sin((i * Math.PI) / 4) * 38}
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeLinecap="round"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
            ))}
        </g>
    );
}

function Clouds({ weather, isNight }: { weather: WeatherType; isNight: boolean }) {
    const cloudCount = weather === 'sunny' ? 2 : weather === 'cloudy' || weather === 'rainy' ? 6 : 3;
    const cloudColor = isNight ? '#475569' : '#f1f5f9';

    return (
        <g>
            {[...Array(cloudCount)].map((_, i) => (
                <motion.g
                    key={i}
                    initial={{ x: -100 }}
                    animate={{ x: 700 }}
                    transition={{
                        duration: 60 + i * 10,
                        repeat: Infinity,
                        delay: i * 8,
                        ease: 'linear',
                    }}
                >
                    <ellipse
                        cx={i * 80}
                        cy={40 + i * 15}
                        rx={40 + i * 5}
                        ry={15 + i * 2}
                        fill={cloudColor}
                        opacity={weather === 'rainy' || weather === 'stormy' ? 0.9 : 0.7}
                    />
                    <ellipse
                        cx={i * 80 + 20}
                        cy={35 + i * 15}
                        rx={25}
                        ry={12}
                        fill={cloudColor}
                        opacity={weather === 'rainy' || weather === 'stormy' ? 0.9 : 0.7}
                    />
                </motion.g>
            ))}
        </g>
    );
}

function WeatherEffects({ weather, isNight }: { weather: WeatherType; isNight: boolean }) {
    const [drops, setDrops] = useState<Array<{ x1: number; x2: number; delay: number }>>([]);

    useEffect(() => {
        if (weather === 'rainy' || weather === 'stormy') {
            setDrops([...Array(40)].map(() => ({
                x1: Math.random() * 600,
                x2: Math.random() * 600 - 20,
                delay: Math.random() * 2,
            })));
        } else {
            setDrops([]);
        }
    }, [weather]);

    if (weather === 'rainy' || weather === 'stormy') {
        return (
            <g>
                {drops.map((drop, i) => (
                    <motion.line
                        key={i}
                        x1={drop.x1}
                        y1={-10}
                        x2={drop.x2}
                        y2={30}
                        stroke="#60a5fa"
                        strokeWidth="1"
                        opacity="0.4"
                        initial={{ y: -40 }}
                        animate={{ y: 400 }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: drop.delay,
                        }}
                    />
                ))}
            </g>
        );
    }
    return null;
}

function Trees({ isNight }: { isNight: boolean }) {
    const treeColor = isNight ? '#166534' : '#22c55e';
    const trunkColor = isNight ? '#78350f' : '#92400e';

    return (
        <g>
            {[50, 550].map((x, i) => (
                <g key={i}>
                    <rect x={x} y={250} width="8" height="30" fill={trunkColor} />
                    <polygon
                        points={`${x - 15},280 ${x + 4},220 ${x + 23},280`}
                        fill={treeColor}
                    />
                    <polygon
                        points={`${x - 12},260 ${x + 4},210 ${x + 20},260`}
                        fill={treeColor}
                    />
                </g>
            ))}
        </g>
    );
}

function Streetlamps({ isNight }: { isNight: boolean }) {
    return (
        <g>
            {[150, 350, 500].map((x, i) => (
                <g key={i}>
                    <rect x={x} y={270} width="3" height="25" fill="#374151" />
                    <rect x={x - 4} y={268} width="11" height="5" fill="#4b5563" rx="1" />
                    {isNight && (
                        <motion.ellipse
                            cx={x + 1.5}
                            cy={295}
                            rx="15"
                            ry="8"
                            fill="#fef3c7"
                            opacity="0.3"
                            animate={{ opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    )}
                    <circle
                        cx={x + 1.5}
                        cy={270}
                        r="3"
                        fill={isNight ? '#fef3c7' : '#9ca3af'}
                    />
                </g>
            ))}
        </g>
    );
}

function BuildingSVG({
    building,
    isHovered,
    isNight,
}: {
    building: BuildingState;
    isHovered: boolean;
    isNight: boolean;
}) {
    const { definition, unlocked, level } = building;
    const { x, y } = definition.position;
    const scale = isHovered ? 1.05 : 1;

    if (!unlocked) {
        return <LockedBuilding x={x} y={y} definition={definition} progress={building.progress} />;
    }

    // Render different buildings based on type
    switch (definition.id) {
        case 'town_hall':
            return <TownHallSVG x={x} y={y} level={level} scale={scale} isNight={isNight} />;
        case 'library':
            return <LibrarySVG x={x} y={y} level={level} scale={scale} isNight={isNight} />;
        case 'observatory':
            return <ObservatorySVG x={x} y={y} level={level} scale={scale} isNight={isNight} />;
        case 'garden':
            return <GardenSVG x={x} y={y} level={level} scale={scale} isNight={isNight} />;
        case 'workshop':
            return <WorkshopSVG x={x} y={y} level={level} scale={scale} isNight={isNight} />;
        case 'academy':
            return <AcademySVG x={x} y={y} level={level} scale={scale} isNight={isNight} />;
        case 'lighthouse':
            return <LighthouseSVG x={x} y={y} level={level} scale={scale} isNight={isNight} />;
        case 'monument':
            return <MonumentSVG x={x} y={y} level={level} scale={scale} isNight={isNight} />;
        default:
            return <GenericBuildingSVG x={x} y={y} level={level} scale={scale} isNight={isNight} />;
    }
}

// Individual building SVGs
function TownHallSVG({ x, y, level, scale, isNight }: { x: number; y: number; level: number; scale: number; isNight: boolean }) {
    const height = 60 + level * 15;
    const windowGlow = isNight ? 1 : 0.3;

    return (
        <motion.g animate={{ scale }} style={{ transformOrigin: `${x + 40}px ${y}px` }}>
            {/* Main building */}
            <rect x={x} y={y - height} width="80" height={height} fill="#dc2626" rx="2" />
            {/* Roof */}
            <polygon points={`${x - 5},${y - height} ${x + 40},${y - height - 25} ${x + 85},${y - height}`} fill="#991b1b" />
            {/* Clock tower */}
            {level >= 3 && (
                <>
                    <rect x={x + 30} y={y - height - 40} width="20" height="40" fill="#b91c1c" />
                    <circle cx={x + 40} cy={y - height - 25} r="8" fill="#fef3c7" />
                </>
            )}
            {/* Windows */}
            {[...Array(Math.min(level * 2, 6))].map((_, i) => (
                <rect
                    key={i}
                    x={x + 10 + (i % 3) * 22}
                    y={y - height + 15 + Math.floor(i / 3) * 25}
                    width="12"
                    height="15"
                    fill="#fef9c3"
                    opacity={windowGlow}
                    filter={isNight ? 'url(#windowGlow)' : undefined}
                />
            ))}
            {/* Door */}
            <rect x={x + 30} y={y - 25} width="20" height="25" fill="#7f1d1d" rx="2" />
            {/* Flag */}
            {level >= 4 && (
                <motion.g animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}>
                    <line x1={x + 40} y1={y - height - 65} x2={x + 40} y2={y - height - 25} stroke="#78350f" strokeWidth="2" />
                    <polygon points={`${x + 40},${y - height - 65} ${x + 60},${y - height - 55} ${x + 40},${y - height - 45}`} fill="#3b82f6" />
                </motion.g>
            )}
        </motion.g>
    );
}

function LibrarySVG({ x, y, level, scale, isNight }: { x: number; y: number; level: number; scale: number; isNight: boolean }) {
    const height = 50 + level * 12;

    return (
        <motion.g animate={{ scale }} style={{ transformOrigin: `${x + 35}px ${y}px` }}>
            <rect x={x} y={y - height} width="70" height={height} fill="#1e40af" rx="2" />
            {/* Columns */}
            {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={x + 8 + i * 15} y={y - height + 10} width="6" height={height - 15} fill="#3b82f6" />
            ))}
            {/* Roof with triangle */}
            <polygon points={`${x - 3},${y - height} ${x + 35},${y - height - 20} ${x + 73},${y - height}`} fill="#1e3a8a" />
            {/* Windows (lit at night) */}
            {[...Array(Math.min(level, 4))].map((_, i) => (
                <rect
                    key={i}
                    x={x + 10 + i * 15}
                    y={y - height + 25}
                    width="8"
                    height="12"
                    fill="#fef9c3"
                    opacity={isNight ? 1 : 0.4}
                    filter={isNight ? 'url(#windowGlow)' : undefined}
                />
            ))}
            {/* Book decoration on top */}
            {level >= 3 && (
                <text x={x + 35} y={y - height - 5} fontSize="12" textAnchor="middle">📚</text>
            )}
        </motion.g>
    );
}

function ObservatorySVG({ x, y, level, scale, isNight }: { x: number; y: number; level: number; scale: number; isNight: boolean }) {
    const height = 70 + level * 10;

    return (
        <motion.g animate={{ scale }} style={{ transformOrigin: `${x + 30}px ${y}px` }}>
            {/* Tower */}
            <rect x={x + 10} y={y - height} width="40" height={height} fill="#6366f1" rx="2" />
            {/* Dome */}
            <ellipse cx={x + 30} cy={y - height} rx="30" ry="18" fill="#4f46e5" />
            {/* Telescope */}
            <motion.g
                animate={{ rotate: [-15, 15, -15] }}
                transition={{ duration: 8, repeat: Infinity }}
                style={{ transformOrigin: `${x + 30}px ${y - height}px` }}
            >
                <rect x={x + 28} y={y - height - 25} width="8" height="30" fill="#1e1b4b" transform={`rotate(-30 ${x + 32} ${y - height})`} />
                <circle cx={x + 20} cy={y - height - 20} r="6" fill="#312e81" />
            </motion.g>
            {/* Windows */}
            {[...Array(Math.min(level, 3))].map((_, i) => (
                <circle
                    key={i}
                    cx={x + 30}
                    cy={y - 30 - i * 25}
                    r="8"
                    fill="#fef9c3"
                    opacity={isNight ? 1 : 0.3}
                    filter={isNight ? 'url(#windowGlow)' : undefined}
                />
            ))}
            {/* Stars around (night only) */}
            {isNight && level >= 3 && (
                <>
                    <motion.text
                        x={x + 60}
                        y={y - height - 10}
                        fontSize="10"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        ⭐
                    </motion.text>
                    <motion.text
                        x={x}
                        y={y - height + 5}
                        fontSize="8"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    >
                        ✨
                    </motion.text>
                </>
            )}
        </motion.g>
    );
}

function GardenSVG({ x, y, level, scale, isNight }: { x: number; y: number; level: number; scale: number; isNight: boolean }) {
    const flowerColors = ['#ef4444', '#f59e0b', '#ec4899', '#a855f7', '#3b82f6'];
    const flowerCount = Math.min(level * 3, 12);

    return (
        <motion.g animate={{ scale }} style={{ transformOrigin: `${x + 40}px ${y}px` }}>
            {/* Garden bed */}
            <rect x={x} y={y - 15} width="80" height="15" fill="#166534" rx="3" />
            {/* Fence */}
            {[...Array(5)].map((_, i) => (
                <rect key={i} x={x + i * 20} y={y - 25} width="3" height="12" fill="#92400e" />
            ))}
            <rect x={x} y={y - 18} width="80" height="3" fill="#a3623e" />
            {/* Flowers */}
            {[...Array(flowerCount)].map((_, i) => (
                <motion.g
                    key={i}
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                >
                    {/* Stem */}
                    <line
                        x1={x + 8 + (i % 6) * 12}
                        y1={y - 15}
                        x2={x + 8 + (i % 6) * 12}
                        y2={y - 25 - (i % 3) * 5}
                        stroke="#22c55e"
                        strokeWidth="2"
                    />
                    {/* Flower */}
                    <circle
                        cx={x + 8 + (i % 6) * 12}
                        cy={y - 28 - (i % 3) * 5}
                        r="4"
                        fill={flowerColors[i % 5]}
                        opacity={isNight ? 0.7 : 1}
                    />
                </motion.g>
            ))}
            {/* Butterfly (level 4+) */}
            {level >= 4 && (
                <motion.text
                    x={x + 40}
                    y={y - 40}
                    fontSize="12"
                    animate={{ x: [x + 20, x + 60, x + 20], y: [y - 40, y - 50, y - 40] }}
                    transition={{ duration: 5, repeat: Infinity }}
                >
                    🦋
                </motion.text>
            )}
        </motion.g>
    );
}

function WorkshopSVG({ x, y, level, scale, isNight }: { x: number; y: number; level: number; scale: number; isNight: boolean }) {
    const height = 45 + level * 8;

    return (
        <motion.g animate={{ scale }} style={{ transformOrigin: `${x + 30}px ${y}px` }}>
            <rect x={x} y={y - height} width="60" height={height} fill="#78350f" rx="2" />
            {/* Roof */}
            <polygon points={`${x - 3},${y - height} ${x + 30},${y - height - 15} ${x + 63},${y - height}`} fill="#92400e" />
            {/* Chimney with smoke */}
            <rect x={x + 45} y={y - height - 20} width="10" height="20" fill="#451a03" />
            {level >= 2 && (
                <motion.g
                    animate={{ y: [0, -20], opacity: [0.8, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <ellipse cx={x + 50} cy={y - height - 25} rx="8" ry="5" fill="#9ca3af" opacity="0.5" />
                </motion.g>
            )}
            {/* Tools display */}
            <text x={x + 30} y={y - height + 25} fontSize="14" textAnchor="middle">🔧</text>
            {/* Windows */}
            <rect x={x + 10} y={y - height + 35} width="15" height="12" fill="#fef9c3" opacity={isNight ? 1 : 0.3} />
            {/* Door */}
            <rect x={x + 22} y={y - 30} width="16" height="30" fill="#451a03" rx="2" />
        </motion.g>
    );
}

function AcademySVG({ x, y, level, scale, isNight }: { x: number; y: number; level: number; scale: number; isNight: boolean }) {
    const height = 70 + level * 12;

    return (
        <motion.g animate={{ scale }} style={{ transformOrigin: `${x + 35}px ${y}px` }}>
            {/* Main building */}
            <rect x={x} y={y - height} width="70" height={height} fill="#7c3aed" rx="2" />
            {/* Grand columns */}
            {[0, 1, 2].map((i) => (
                <rect key={i} x={x + 10 + i * 20} y={y - height + 15} width="8" height={height - 20} fill="#a78bfa" />
            ))}
            {/* Dome */}
            <ellipse cx={x + 35} cy={y - height} rx="40" ry="20" fill="#6d28d9" />
            {/* Graduation cap on top */}
            {level >= 3 && (
                <text x={x + 35} y={y - height - 10} fontSize="16" textAnchor="middle">🎓</text>
            )}
            {/* Windows */}
            {[...Array(Math.min(level * 2, 6))].map((_, i) => (
                <rect
                    key={i}
                    x={x + 12 + (i % 3) * 20}
                    y={y - height + 30 + Math.floor(i / 3) * 25}
                    width="10"
                    height="15"
                    fill="#fef9c3"
                    opacity={isNight ? 1 : 0.3}
                    filter={isNight ? 'url(#windowGlow)' : undefined}
                />
            ))}
            {/* Grand entrance */}
            <rect x={x + 25} y={y - 35} width="20" height="35" fill="#5b21b6" rx="10 10 0 0" />
        </motion.g>
    );
}

function LighthouseSVG({ x, y, level, scale, isNight }: { x: number; y: number; level: number; scale: number; isNight: boolean }) {
    const height = 80 + level * 10;

    return (
        <motion.g animate={{ scale }} style={{ transformOrigin: `${x + 20}px ${y}px` }}>
            {/* Tower - striped */}
            {[...Array(8)].map((_, i) => (
                <rect
                    key={i}
                    x={x + 5 + i * 0.5}
                    y={y - height + i * (height / 8)}
                    width={30 - i}
                    height={height / 8}
                    fill={i % 2 === 0 ? '#dc2626' : '#f8fafc'}
                />
            ))}
            {/* Top platform */}
            <rect x={x} y={y - height - 5} width="40" height="8" fill="#1f2937" />
            {/* Light housing */}
            <rect x={x + 10} y={y - height - 20} width="20" height="15" fill="#374151" />
            {/* Light beam */}
            {isNight && (
                <motion.g
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: `${x + 20}px ${y - height - 12}px` }}
                >
                    <polygon
                        points={`${x + 20},${y - height - 12} ${x + 100},${y - height - 30} ${x + 100},${y - height + 5}`}
                        fill="#fef3c7"
                        opacity="0.3"
                    />
                </motion.g>
            )}
            {/* Light */}
            <motion.circle
                cx={x + 20}
                cy={y - height - 12}
                r="6"
                fill={isNight ? '#fef3c7' : '#fbbf24'}
                animate={isNight ? { opacity: [0.8, 1, 0.8] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
            />
        </motion.g>
    );
}

function MonumentSVG({ x, y, level, scale, isNight }: { x: number; y: number; level: number; scale: number; isNight: boolean }) {
    const height = 50 + level * 10;

    return (
        <motion.g animate={{ scale }} style={{ transformOrigin: `${x + 20}px ${y}px` }}>
            {/* Base */}
            <rect x={x - 5} y={y - 10} width="50" height="10" fill="#6b7280" />
            {/* Pillar */}
            <rect x={x + 5} y={y - height} width="30" height={height - 10} fill="#9ca3af" />
            {/* Top decoration */}
            <polygon points={`${x + 5},${y - height} ${x + 20},${y - height - 15} ${x + 35},${y - height}`} fill="#d1d5db" />
            {/* Achievement stars */}
            {[...Array(Math.min(level, 5))].map((_, i) => (
                <motion.text
                    key={i}
                    x={x + 15 + (i % 2) * 10}
                    y={y - 25 - Math.floor(i / 2) * 15}
                    fontSize="10"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                >
                    ⭐
                </motion.text>
            ))}
        </motion.g>
    );
}

function GenericBuildingSVG({ x, y, level, scale, isNight }: { x: number; y: number; level: number; scale: number; isNight: boolean }) {
    const height = 40 + level * 10;

    return (
        <motion.g animate={{ scale }} style={{ transformOrigin: `${x + 25}px ${y}px` }}>
            <rect x={x} y={y - height} width="50" height={height} fill="#64748b" rx="2" />
            <rect x={x + 15} y={y - 20} width="20" height="20" fill="#475569" />
        </motion.g>
    );
}

function FallbackBuilding({ x, y, type, level, isNight }: { x: number; y: number; type: string; level: number; isNight: boolean }) {
    const height = 40 + (level || 1) * 10;
    const colors: Record<string, string> = {
        library: '#1e40af',
        townhall: '#dc2626',
        observatory: '#6366f1',
        garden: '#22c55e',
    };

    return (
        <g>
            <rect x={x} y={y - height} width="50" height={height} fill={colors[type] || '#64748b'} rx="2" />
            {level > 0 && (
                <rect
                    x={x + 15}
                    y={y - height + 15}
                    width="20"
                    height="15"
                    fill="#fef9c3"
                    opacity={isNight ? 1 : 0.3}
                />
            )}
        </g>
    );
}

function LockedBuilding({ x, y, definition, progress }: { x: number; y: number; definition: any; progress: number }) {
    return (
        <g opacity="0.4">
            <rect x={x} y={y - 50} width={definition.size?.width || 60} height={50} fill="#94a3b8" rx="4" strokeDasharray="4" />
            <text x={x + (definition.size?.width || 60) / 2} y={y - 20} fontSize="20" textAnchor="middle">🔒</text>
            {/* Progress bar */}
            <rect x={x + 5} y={y - 8} width={(definition.size?.width || 60) - 10} height="4" fill="#cbd5e1" rx="2" />
            <rect x={x + 5} y={y - 8} width={((definition.size?.width || 60) - 10) * (progress / 100)} height="4" fill="#3b82f6" rx="2" />
        </g>
    );
}

function Inhabitant({
    startX,
    y,
    isNight,
    delay,
    variant,
}: {
    startX: number;
    y: number;
    isNight: boolean;
    delay: number;
    variant: number;
}) {
    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899'];
    const color = isNight ? '#64748b' : colors[variant];

    return (
        <motion.g
            initial={{ x: 0 }}
            animate={{ x: [0, 40, 0, -40, 0] }}
            transition={{
                duration: 12,
                repeat: Infinity,
                delay,
                ease: 'easeInOut',
            }}
        >
            {/* Head */}
            <circle cx={startX} cy={y - 8} r="4" fill={color} />
            {/* Body */}
            <line x1={startX} y1={y - 4} x2={startX} y2={y + 4} stroke={color} strokeWidth="2" />
            {/* Legs */}
            <motion.g
                animate={{ rotate: [-10, 10, -10] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{ transformOrigin: `${startX}px ${y + 4}px` }}
            >
                <line x1={startX} y1={y + 4} x2={startX - 3} y2={y + 10} stroke={color} strokeWidth="2" />
                <line x1={startX} y1={y + 4} x2={startX + 3} y2={y + 10} stroke={color} strokeWidth="2" />
            </motion.g>
        </motion.g>
    );
}

function BuildingTooltip({ building }: { building: BuildingState }) {
    return (
        <div className="text-center min-w-[150px]">
            <div className="text-2xl mb-1">{building.definition.emoji}</div>
            <div className="font-bold">{building.definition.name}</div>
            {building.unlocked ? (
                <>
                    <div className="text-xs text-purple-500 font-medium">Level {building.level}/{building.definition.maxLevel}</div>
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-1 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                            style={{ width: `${building.progress}%` }}
                        />
                    </div>
                </>
            ) : (
                <>
                    <div className="text-xs text-zinc-500 mt-1">🔒 Locked</div>
                    <div className="text-xs text-zinc-400">{building.definition.unlockRequirement.description}</div>
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-zinc-400" style={{ width: `${building.progress}%` }} />
                    </div>
                </>
            )}
        </div>
    );
}

function BuildingDetails({ building, onClose }: { building: BuildingState; onClose: () => void }) {
    const { definition, unlocked, level, progress, progressValue } = building;

    return (
        <div>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="text-4xl">{definition.emoji}</div>
                    <div>
                        <h3 className="text-xl font-bold">{definition.name}</h3>
                        <p className="text-sm text-zinc-500">{definition.category}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    ✕
                </button>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{definition.description}</p>

            {unlocked ? (
                <>
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-zinc-500">Level Progress</span>
                            <span className="font-bold text-purple-500">
                                Level {level}/{definition.maxLevel}
                            </span>
                        </div>
                        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">
                            Progress: {progressValue} / {definition.levelRequirements[level] || 'Max'}
                        </div>
                    </div>

                    {definition.bonuses && Object.keys(definition.bonuses).length > 0 && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                                🎁 Building Bonuses
                            </div>
                            <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                                {definition.bonuses.xpMultiplier && (
                                    <li>+{((definition.bonuses.xpMultiplier - 1) * 100).toFixed(0)}% XP from this area</li>
                                )}
                                {definition.bonuses.streakProtection && (
                                    <li>🛡️ Streak protection available</li>
                                )}
                                {definition.bonuses.unlockHints && (
                                    <li>💡 Unlock additional hints</li>
                                )}
                            </ul>
                        </div>
                    )}
                </>
            ) : (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
                        🔒 How to Unlock
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                        {definition.unlockRequirement.description}
                    </p>
                    <div className="h-2 bg-orange-100 dark:bg-orange-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-orange-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1 }}
                        />
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        {progress.toFixed(0)}% complete
                    </div>
                </div>
            )}
        </div>
    );
}

function AchievementToast({ achievementId, onClose }: { achievementId: string; onClose: () => void }) {
    const achievement = getAchievementById(achievementId);

    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!achievement) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 right-4 z-50"
        >
            <div
                className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-2xl border-2 flex items-center gap-3"
                style={{ borderColor: getRarityColor(achievement.rarity) }}
            >
                <div className="text-3xl">{achievement.emoji}</div>
                <div>
                    <div className="text-xs uppercase tracking-wider" style={{ color: getRarityColor(achievement.rarity) }}>
                        {achievement.rarity} Achievement
                    </div>
                    <div className="font-bold">{achievement.name}</div>
                    <div className="text-xs text-zinc-500">{achievement.description}</div>
                    <div className="text-xs text-purple-500 font-medium mt-1">+{achievement.xpReward} XP</div>
                </div>
            </div>
        </motion.div>
    );
}
