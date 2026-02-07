/**
 * Hexagonal Grid System
 * Utilities for creating and managing hexagonal grid layouts
 * Used for the Knowledge Map visualization
 */

// ============================================================================
// TYPES
// ============================================================================

export interface HexCoord {
    q: number; // Column (axial coordinate)
    r: number; // Row (axial coordinate)
}

export interface HexPixel {
    x: number;
    y: number;
}

export interface HexNode {
    id: string;
    title: string;
    shortTitle: string;
    coord: HexCoord;
    masteryLevel: 0 | 1 | 2 | 3 | 4 | 5;
    isLocked: boolean;
    isCompleted: boolean;
    prerequisites: string[];
    dependents: string[];
    stats: {
        totalAttempts: number;
        correctAttempts: number;
        accuracy: number;
        avgTimeSeconds: number;
        lastPracticed: Date | null;
        nextReview: Date | null;
    };
    category?: string;
    difficulty?: number;
    estimatedMinutes?: number;
}

export interface HexGridConfig {
    hexSize: number; // Radius of hexagon
    orientation: 'pointy' | 'flat'; // Pointy-top or flat-top hexagons
    origin: HexPixel; // Center of grid origin
    spacing: number; // Gap between hexagons
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_HEX_CONFIG: HexGridConfig = {
    hexSize: 45,
    orientation: 'pointy',
    origin: { x: 0, y: 0 },
    spacing: 4,
};

// Mastery level colors
export const MASTERY_COLORS = {
    0: { fill: '#f4f4f5', stroke: '#d4d4d8', text: '#71717a', label: 'Not Started' },
    1: { fill: '#fef3c7', stroke: '#fbbf24', text: '#92400e', label: 'Familiar' },
    2: { fill: '#fed7aa', stroke: '#f97316', text: '#9a3412', label: 'Practicing' },
    3: { fill: '#bbf7d0', stroke: '#22c55e', text: '#166534', label: 'Competent' },
    4: { fill: '#a5f3fc', stroke: '#06b6d4', text: '#0e7490', label: 'Skilled' },
    5: { fill: '#c4b5fd', stroke: '#8b5cf6', text: '#5b21b6', label: 'Master' },
} as const;

// Lock styling
export const LOCKED_STYLE = {
    fill: '#e4e4e7',
    stroke: '#a1a1aa',
    text: '#71717a',
    opacity: 0.6,
};

// ============================================================================
// COORDINATE CONVERSION
// ============================================================================

/**
 * Convert axial coordinates to pixel coordinates (center of hexagon)
 */
export function hexToPixel(coord: HexCoord, config: HexGridConfig): HexPixel {
    const { hexSize, orientation, origin, spacing } = config;
    const size = hexSize + spacing / 2;

    let x: number, y: number;

    if (orientation === 'pointy') {
        // Pointy-top hexagons
        x = size * (Math.sqrt(3) * coord.q + Math.sqrt(3) / 2 * coord.r);
        y = size * (3 / 2 * coord.r);
    } else {
        // Flat-top hexagons
        x = size * (3 / 2 * coord.q);
        y = size * (Math.sqrt(3) / 2 * coord.q + Math.sqrt(3) * coord.r);
    }

    return {
        x: x + origin.x,
        y: y + origin.y,
    };
}

/**
 * Convert pixel coordinates to axial coordinates
 */
export function pixelToHex(pixel: HexPixel, config: HexGridConfig): HexCoord {
    const { hexSize, orientation, origin, spacing } = config;
    const size = hexSize + spacing / 2;

    const px = pixel.x - origin.x;
    const py = pixel.y - origin.y;

    let q: number, r: number;

    if (orientation === 'pointy') {
        q = (Math.sqrt(3) / 3 * px - 1 / 3 * py) / size;
        r = (2 / 3 * py) / size;
    } else {
        q = (2 / 3 * px) / size;
        r = (-1 / 3 * px + Math.sqrt(3) / 3 * py) / size;
    }

    return hexRound({ q, r });
}

/**
 * Round fractional hex coordinates to nearest hex
 */
export function hexRound(coord: HexCoord): HexCoord {
    let q = Math.round(coord.q);
    let r = Math.round(coord.r);
    const s = Math.round(-coord.q - coord.r);

    const qDiff = Math.abs(q - coord.q);
    const rDiff = Math.abs(r - coord.r);
    const sDiff = Math.abs(s - (-coord.q - coord.r));

    if (qDiff > rDiff && qDiff > sDiff) {
        q = -r - s;
    } else if (rDiff > sDiff) {
        r = -q - s;
    }

    return { q, r };
}

// ============================================================================
// HEXAGON GEOMETRY
// ============================================================================

/**
 * Get the 6 corner points of a hexagon
 */
export function getHexCorners(center: HexPixel, size: number, orientation: 'pointy' | 'flat'): HexPixel[] {
    const corners: HexPixel[] = [];
    const startAngle = orientation === 'pointy' ? 30 : 0;

    for (let i = 0; i < 6; i++) {
        const angleDeg = 60 * i + startAngle;
        const angleRad = (Math.PI / 180) * angleDeg;
        corners.push({
            x: center.x + size * Math.cos(angleRad),
            y: center.y + size * Math.sin(angleRad),
        });
    }

    return corners;
}

/**
 * Generate SVG path for a hexagon
 */
export function getHexPath(center: HexPixel, size: number, orientation: 'pointy' | 'flat'): string {
    const corners = getHexCorners(center, size, orientation);
    const path = corners.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    return `${path} Z`;
}

/**
 * Get hexagon dimensions
 */
export function getHexDimensions(size: number, orientation: 'pointy' | 'flat'): { width: number; height: number } {
    if (orientation === 'pointy') {
        return {
            width: Math.sqrt(3) * size,
            height: 2 * size,
        };
    } else {
        return {
            width: 2 * size,
            height: Math.sqrt(3) * size,
        };
    }
}

// ============================================================================
// GRID LAYOUT ALGORITHMS
// ============================================================================

/**
 * Generate a spiral layout for hexagons starting from center
 */
export function generateSpiralLayout(count: number): HexCoord[] {
    const coords: HexCoord[] = [{ q: 0, r: 0 }];

    if (count <= 1) return coords;

    // Direction vectors for neighboring hexes (pointy-top)
    const directions = [
        { q: 1, r: 0 },
        { q: 0, r: 1 },
        { q: -1, r: 1 },
        { q: -1, r: 0 },
        { q: 0, r: -1 },
        { q: 1, r: -1 },
    ];

    let ring = 1;
    while (coords.length < count) {
        // Start at the left of current ring
        let current = { q: -ring, r: ring };

        for (let side = 0; side < 6 && coords.length < count; side++) {
            for (let step = 0; step < ring && coords.length < count; step++) {
                coords.push({ ...current });
                current = {
                    q: current.q + directions[side].q,
                    r: current.r + directions[side].r,
                };
            }
        }
        ring++;
    }

    return coords;
}

/**
 * Generate a rectangular grid layout
 */
export function generateRectangularLayout(cols: number, rows: number): HexCoord[] {
    const coords: HexCoord[] = [];

    for (let r = 0; r < rows; r++) {
        const offset = Math.floor(r / 2);
        for (let q = -offset; q < cols - offset; q++) {
            coords.push({ q, r });
        }
    }

    return coords;
}

/**
 * Generate layout based on topic dependencies (DAG layout)
 */
export function generateDependencyLayout(
    nodes: Array<{ id: string; prerequisites: string[] }>,
    maxPerRow: number = 5
): Map<string, HexCoord> {
    const layout = new Map<string, HexCoord>();
    const levels = new Map<string, number>();
    const processed = new Set<string>();

    // Calculate depth level for each node
    function getLevel(nodeId: string): number {
        if (levels.has(nodeId)) return levels.get(nodeId)!;

        const node = nodes.find(n => n.id === nodeId);
        if (!node || node.prerequisites.length === 0) {
            levels.set(nodeId, 0);
            return 0;
        }

        const maxPrereqLevel = Math.max(
            ...node.prerequisites.map(prereq => getLevel(prereq))
        );
        const level = maxPrereqLevel + 1;
        levels.set(nodeId, level);
        return level;
    }

    // Calculate levels for all nodes
    nodes.forEach(node => getLevel(node.id));

    // Group nodes by level
    const nodesByLevel = new Map<number, string[]>();
    nodes.forEach(node => {
        const level = levels.get(node.id) || 0;
        if (!nodesByLevel.has(level)) {
            nodesByLevel.set(level, []);
        }
        nodesByLevel.get(level)!.push(node.id);
    });

    // Assign coordinates
    const sortedLevels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);

    sortedLevels.forEach(level => {
        const nodesAtLevel = nodesByLevel.get(level) || [];
        const offsetQ = -Math.floor(nodesAtLevel.length / 2);

        nodesAtLevel.forEach((nodeId, index) => {
            const q = offsetQ + index;
            const r = level;
            layout.set(nodeId, { q, r });
        });
    });

    return layout;
}

// ============================================================================
// NEIGHBOR & CONNECTION UTILITIES
// ============================================================================

/**
 * Get all 6 neighbors of a hex coordinate
 */
export function getHexNeighbors(coord: HexCoord): HexCoord[] {
    const directions = [
        { q: 1, r: 0 },
        { q: 1, r: -1 },
        { q: 0, r: -1 },
        { q: -1, r: 0 },
        { q: -1, r: 1 },
        { q: 0, r: 1 },
    ];

    return directions.map(d => ({
        q: coord.q + d.q,
        r: coord.r + d.r,
    }));
}

/**
 * Calculate distance between two hex coordinates
 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

/**
 * Generate a curved path between two hexagon centers (for dependency lines)
 */
export function generateConnectionPath(
    from: HexPixel,
    to: HexPixel,
    curvature: number = 0.3
): string {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    // Calculate perpendicular offset for curve
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) return '';

    // Perpendicular vector
    const perpX = -dy / len * len * curvature;
    const perpY = dx / len * len * curvature;

    const ctrlX = midX + perpX;
    const ctrlY = midY + perpY;

    return `M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`;
}

/**
 * Generate a straight arrow path between hexagons
 */
export function generateArrowPath(
    from: HexPixel,
    to: HexPixel,
    hexSize: number,
    arrowSize: number = 8
): { path: string; arrowHead: string } {
    // Calculate direction
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) return { path: '', arrowHead: '' };

    // Normalize direction
    const nx = dx / len;
    const ny = dy / len;

    // Adjust start and end points to be on hex edge
    const startX = from.x + nx * hexSize;
    const startY = from.y + ny * hexSize;
    const endX = to.x - nx * (hexSize + arrowSize);
    const endY = to.y - ny * (hexSize + arrowSize);

    // Arrow head points
    const arrowTipX = to.x - nx * hexSize;
    const arrowTipY = to.y - ny * hexSize;

    // Perpendicular for arrow wings
    const perpX = -ny * arrowSize * 0.6;
    const perpY = nx * arrowSize * 0.6;

    const arrowHead = `
        M ${arrowTipX} ${arrowTipY}
        L ${endX + perpX} ${endY + perpY}
        L ${endX - perpX} ${endY - perpY}
        Z
    `;

    return {
        path: `M ${startX} ${startY} L ${endX} ${endY}`,
        arrowHead,
    };
}

// ============================================================================
// GRID BOUNDS & VIEWPORT
// ============================================================================

/**
 * Calculate the bounding box of a set of hex coordinates
 */
export function calculateGridBounds(
    coords: HexCoord[],
    config: HexGridConfig
): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number } {
    if (coords.length === 0) {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
    }

    const pixels = coords.map(c => hexToPixel(c, config));
    const { width: hexWidth, height: hexHeight } = getHexDimensions(config.hexSize, config.orientation);

    const minX = Math.min(...pixels.map(p => p.x)) - hexWidth / 2;
    const maxX = Math.max(...pixels.map(p => p.x)) + hexWidth / 2;
    const minY = Math.min(...pixels.map(p => p.y)) - hexHeight / 2;
    const maxY = Math.max(...pixels.map(p => p.y)) + hexHeight / 2;

    return {
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
    };
}
