/**
 * LineArt — thin-stroke geometric illustrations.
 *
 * Shared visual language: 1px ink strokes in currentColor, dotted construction
 * lines at reduced opacity, open vs. filled dots for states. Drop one inside a
 * .feature-tile-art container; it inherits the surrounding text color, so the
 * same art works on parchment, white, and dark surfaces.
 */

import type { SVGProps } from 'react';

interface LineArtProps extends SVGProps<SVGSVGElement> {
    size?: number;
}

const STROKE = 1.1;
const DOT_DASH = '0.5 3.5';

function Frame({ size = 140, children, ...rest }: LineArtProps & { children: React.ReactNode }) {
    return (
        <svg
            width={size}
            height={size * (120 / 140)}
            viewBox="0 0 140 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
            {...rest}
        >
            {children}
        </svg>
    );
}

/** Two cones meeting at the origin of dotted axes — observation / analysis. */
export function ConesArt(props: LineArtProps) {
    return (
        <Frame {...props}>
            {/* dotted axes */}
            <g stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={DOT_DASH} opacity={0.6}>
                <line x1="70" y1="8" x2="70" y2="104" />
                <line x1="10" y1="72" x2="130" y2="72" />
                <line x1="70" y1="72" x2="44" y2="106" />
            </g>
            <g stroke="currentColor" strokeWidth={STROKE}>
                {/* small left cone */}
                <ellipse cx="38" cy="46" rx="11" ry="19" />
                <path d="M70 72 L38 28 M70 72 L38 64" />
                {/* large right cone */}
                <ellipse cx="107" cy="49" rx="19" ry="33" />
                <path d="M70 72 L107 17 M70 72 L107 81" />
            </g>
        </Frame>
    );
}

/** Wireframe cube with dotted space diagonals — structure / accountability. */
export function CubeArt(props: LineArtProps) {
    // front face (30,38)-(92,100); back face offset by (24,-22)
    return (
        <Frame {...props}>
            <g stroke="currentColor" strokeWidth={STROKE}>
                {/* front + back faces */}
                <rect x="30" y="38" width="62" height="62" />
                <rect x="54" y="16" width="62" height="62" />
                {/* connecting edges */}
                <path d="M30 38 L54 16 M92 38 L116 16 M92 100 L116 78 M30 100 L54 78" />
                {/* internal grid — visible faces divided in half */}
                <path d="M61 38 L61 100 M30 69 L92 69" />
                <path d="M42 27 L104 27 M104 27 L104 89" />
                <path d="M61 38 L85 16 M92 69 L116 47" />
            </g>
            {/* dotted space diagonals */}
            <g stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={DOT_DASH} opacity={0.6}>
                <line x1="30" y1="38" x2="116" y2="78" />
                <line x1="92" y1="38" x2="54" y2="78" />
                <line x1="30" y1="100" x2="116" y2="16" />
            </g>
        </Frame>
    );
}

/** Nested circles sharing a tangent point, outermost dotted — provenance / layers. */
export function MoonsArt(props: LineArtProps) {
    const radii = [14, 20, 26, 32, 38];
    return (
        <Frame {...props}>
            <g stroke="currentColor" strokeWidth={STROKE}>
                {radii.map((r) => (
                    <circle key={r} cx={26 + r} cy="60" r={r} />
                ))}
            </g>
            <circle
                cx={26 + 44}
                cy="60"
                r={44}
                stroke="currentColor"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={DOT_DASH}
                opacity={0.6}
            />
        </Frame>
    );
}

/** Rising curve: dotted "good" baseline vs. solid "great" curve — improvement. */
export function CurveArt({ goodLabel = 'Good', greatLabel = 'Great', ...props }: LineArtProps & { goodLabel?: string; greatLabel?: string }) {
    return (
        <Frame {...props}>
            {/* dotted baseline trajectory */}
            <path
                d="M14 102 C 48 100, 66 84, 82 68 S 116 42, 128 40"
                stroke="currentColor"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={DOT_DASH}
                opacity={0.6}
            />
            {/* solid steeper curve */}
            <path
                d="M14 102 C 44 98, 58 76, 72 56 S 104 24, 126 20"
                stroke="currentColor"
                strokeWidth={STROKE * 1.15}
            />
            {/* good: open dot on the dotted path */}
            <circle cx="66" cy="80" r="3.2" fill="var(--surface, #fff)" stroke="currentColor" strokeWidth={STROKE} />
            <text x="66" y="68" textAnchor="middle" fontSize="8" fill="currentColor" opacity={0.5} fontFamily="var(--font-sans)">
                {goodLabel}
            </text>
            {/* great: filled dot on the solid path */}
            <circle cx="94" cy="35" r="3.4" fill="currentColor" />
            <text x="94" y="22" textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="var(--font-sans)">
                {greatLabel}
            </text>
        </Frame>
    );
}

/** Concentric ripples on a dotted axis — reach / momentum. */
export function RipplesArt(props: LineArtProps) {
    const radii = [16, 26, 36, 46];
    return (
        <Frame {...props}>
            <line
                x1="14"
                y1="60"
                x2="126"
                y2="60"
                stroke="currentColor"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={DOT_DASH}
                opacity={0.6}
            />
            <g stroke="currentColor" strokeWidth={STROKE}>
                {radii.map((r, i) => (
                    <circle key={r} cx="70" cy="60" r={r} opacity={1 - i * 0.16} />
                ))}
            </g>
            <circle cx="24" cy="60" r="2.6" fill="currentColor" />
            <circle cx="116" cy="60" r="2.6" fill="var(--surface, #fff)" stroke="currentColor" strokeWidth={STROKE} />
        </Frame>
    );
}

/** Hub with solid spine and dotted rays to open nodes — efficiency / routing. */
export function NodesArt(props: LineArtProps) {
    return (
        <Frame {...props}>
            <line x1="34" y1="60" x2="122" y2="60" stroke="currentColor" strokeWidth={STROKE} />
            <g stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={DOT_DASH} opacity={0.6}>
                <line x1="78" y1="60" x2="26" y2="18" />
                <line x1="78" y1="60" x2="26" y2="102" />
            </g>
            <circle cx="78" cy="60" r="3.4" fill="currentColor" />
            <g fill="var(--surface, #fff)" stroke="currentColor" strokeWidth={STROKE}>
                <circle cx="34" cy="60" r="2.8" />
                <circle cx="122" cy="60" r="2.8" />
                <circle cx="26" cy="18" r="2.8" />
                <circle cx="26" cy="102" r="2.8" />
            </g>
        </Frame>
    );
}
