import { JSXTemplateDef } from './types';
import { makeJSFunction, factorial, BOARD_BASE_OPTS, C } from '../mathUtils';

export const analysisTemplates: JSXTemplateDef[] = [
    // ── 20. Differential equations — slope field ──────────────────────────────
    {
        id: 'differential-equations',
        name: 'Differential Equations — Slope Field',
        category: 'Analysis',
        tags: ['ODE', 'slope field', 'differential equations', 'dy/dx', 'vector field', 'integral curve', 'oscillator', 'autocatalytic'],
        description: 'Slope field for dy/dx = f(x, y) with a draggable initial-condition solution curve.',
        defaultConfig: { expression: 'y - x', x0: -2, y0: 0 },
        init(JXG, boardId, cfg) {
            const { expression = 'y - x', x0 = -2, y0 = 0 } = cfg;
            let rhs: (x: number, y: number) => number;
            try {
                const js = expression.replace(/\^/g, '**');
                rhs = new Function('x', 'y', `
                    "use strict";
                    const {sin,cos,exp,log,sqrt,abs,pow,PI,E} = Math;
                    try { return +(${js}); } catch(e) { return 0; }
                `) as (x: number, y: number) => number;
            } catch { rhs = (x, y) => y - x; }
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-4.5, 4.5, 4.5, -4.5], axis: true, ...BOARD_BASE_OPTS,
            });
            // Draw slope field
            const step = 0.8;
            const len  = 0.3;
            for (let xi = -4; xi <= 4; xi += step) {
                for (let yi = -4; yi <= 4; yi += step) {
                    const slope = rhs(xi, yi);
                    if (!isFinite(slope)) continue;
                    const ang = Math.atan(slope);
                    const dx = len * Math.cos(ang);
                    const dy = len * Math.sin(ang);
                    board.create('segment', [[xi - dx, yi - dy], [xi + dx, yi + dy]], {
                        strokeColor: '#94a3b8', strokeWidth: 1,
                        straightFirst: false, straightLast: false,
                    });
                }
            }
            // Draggable initial condition
            const ic = board.create('point', [x0, y0], {
                name: '(x₀,y₀)', size: 5, fillColor: C.amber, strokeColor: C.amber,
            });
            // Euler integration from IC
            const eulerCurve = board.create('curve', [[], []], {
                strokeColor: C.secondary, strokeWidth: 2.5,
            });
            const updateCurve = () => {
                const xs: number[] = [], ys: number[] = [];
                let xc = ic.X(), yc = ic.Y();
                const h = 0.05;
                const steps = 160;
                for (let i = 0; i < steps; i++) {
                    xs.push(xc); ys.push(yc);
                    yc += h * rhs(xc, yc);
                    xc += h;
                    if (Math.abs(yc) > 10) break;
                }
                // Also integrate backwards
                xc = ic.X(); yc = ic.Y();
                const rxs: number[] = [], rys: number[] = [];
                for (let i = 0; i < steps; i++) {
                    rxs.unshift(xc); rys.unshift(yc);
                    yc -= h * rhs(xc, yc);
                    xc -= h;
                    if (Math.abs(yc) > 10) break;
                }
                eulerCurve.dataX = [...rxs, ...xs];
                eulerCurve.dataY = [...rys, ...ys];
                board.update();
            };
            ic.on('drag', updateCurve);
            updateCurve();
            board.create('text', [-4.3, 4.2, `dy/dx = ${expression}`], { fontSize: 12, strokeColor: C.primary });
            return board;
        },
    },

    // ── 21. Logistic growth process ───────────────────────────────────────────
    {
        id: 'logistic-process',
        name: 'Logistic Growth Model',
        category: 'Analysis',
        tags: ['logistic', 'population growth', 'carrying capacity', 'sigmoid', 'S-curve', 'epidemiology'],
        description: 'Logistic growth P(t) with sliders for growth rate r, carrying capacity K, and initial P₀.',
        defaultConfig: { r: 0.5, K: 100, P0: 10, tMax: 20 },
        init(JXG, boardId, cfg) {
            const { r = 0.5, K = 100, P0 = 10, tMax = 20 } = cfg;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-1, K * 1.2, tMax + 1, -K * 0.1], axis: true, ...BOARD_BASE_OPTS,
            });
            const sR  = board.create('slider', [[0, K * 1.15], [tMax * 0.5, K * 1.15], [0.01, r, 2]],  { name: 'r', snapWidth: 0.01 });
            const sK  = board.create('slider', [[0, K * 1.05], [tMax * 0.5, K * 1.05], [10, K, K * 2]], { name: 'K', snapWidth: 1 });
            const sP0 = board.create('slider', [[tMax * 0.55, K * 1.15], [tMax, K * 1.15], [1, P0, K]], { name: 'P₀', snapWidth: 1 });
            // Analytic solution: P(t) = K / (1 + ((K-P₀)/P₀) e^{-rt})
            board.create('functiongraph', [(t: number) => {
                const rv = sR.Value(), Kv = sK.Value(), P0v = sP0.Value();
                return Kv / (1 + ((Kv - P0v) / P0v) * Math.exp(-rv * t));
            }, 0, tMax], { strokeColor: C.primary, strokeWidth: 2.5 });
            // Carrying capacity line
            board.create('functiongraph', [() => sK.Value(), 0, tMax], {
                strokeColor: C.secondary, strokeWidth: 1.5, dash: 2,
            });
            board.create('text', [tMax * 0.6, K * 0.02, 'K (carrying capacity)'], { fontSize: 11, strokeColor: C.secondary });
            return board;
        },
    },

    // ── 22. Projectile motion ─────────────────────────────────────────────────
    {
        id: 'projectile-motion',
        name: 'Projectile Motion',
        category: 'Physics',
        tags: ['projectile', 'parabola', 'trajectory', 'physics', 'angle', 'velocity', 'ballistics'],
        description: 'Projectile trajectory with sliders for initial speed v₀ and launch angle θ.',
        defaultConfig: { v0: 20, angleDeg: 45 },
        init(JXG, boardId, cfg) {
            const { v0 = 20, angleDeg = 45 } = cfg;
            const g = 9.81;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-5, 30, 50, -5], axis: true, ...BOARD_BASE_OPTS,
            });
            const sV  = board.create('slider', [[0, 28], [25, 28], [5, v0, 40]],        { name: 'v₀ (m/s)', snapWidth: 0.5 });
            const sTh = board.create('slider', [[0, 25], [25, 25], [5, angleDeg, 85]], { name: 'θ (°)', snapWidth: 1 });
            board.create('functiongraph', [(x: number) => {
                const v = sV.Value();
                const th = sTh.Value() * Math.PI / 180;
                const vx = v * Math.cos(th), vy = v * Math.sin(th);
                const t = x / vx;
                const y = vy * t - 0.5 * g * t * t;
                return y >= 0 ? y : NaN;
            }, 0, 200], { strokeColor: C.primary, strokeWidth: 2.5 });
            board.create('text', [1, 22, () => {
                const v = sV.Value(), th = sTh.Value() * Math.PI / 180;
                const vx = v * Math.cos(th), vy = v * Math.sin(th);
                const tFlight = 2 * vy / g;
                const range = vx * tFlight;
                const hMax = vy * vy / (2 * g);
                return `Range: ${range.toFixed(1)} m   H_max: ${hMax.toFixed(1)} m`;
            }], { fontSize: 12, strokeColor: C.secondary });
            return board;
        },
    },

    // ── 23. Complex number arithmetic ─────────────────────────────────────────
    {
        id: 'complex-arithmetic',
        name: 'Complex Numbers — Argand Plane',
        category: 'Analysis',
        tags: ['complex', 'imaginary', 'Argand plane', 'complex numbers', 'addition', 'multiplication', 'modulus', 'argument', 'roots of polynomial'],
        description: 'Drag z₁ and z₂ on the Argand plane; see their sum and product visualised.',
        defaultConfig: { re1: 2, im1: 1, re2: -1, im2: 2 },
        init(JXG, boardId, cfg) {
            const { re1 = 2, im1 = 1, re2 = -1, im2 = 2 } = cfg;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-6, 6, 6, -6], axis: true, ...BOARD_BASE_OPTS,
            });
            board.defaultAxes.x.setAttribute({ name: 'Re' });
            board.defaultAxes.y.setAttribute({ name: 'Im' });
            const z1 = board.create('point', [re1, im1], { name: 'z₁', size: 5, strokeColor: C.primary, fillColor: C.primary });
            const z2 = board.create('point', [re2, im2], { name: 'z₂', size: 5, strokeColor: C.secondary, fillColor: C.secondary });
            // Sum z1 + z2 (parallelogram law)
            const zSum = board.create('point', [() => z1.X() + z2.X(), () => z1.Y() + z2.Y()], {
                name: 'z₁+z₂', size: 5, strokeColor: C.tertiary, fillColor: C.tertiary,
            });
            board.create('polygon', [[0, 0], z1, zSum, z2], {
                fillColor: C.primary, fillOpacity: 0.12, strokeColor: C.primary, strokeWidth: 1, dash: 1,
            });
            // Arrows from origin
            board.create('arrow', [[0, 0], z1], { strokeColor: C.primary, strokeWidth: 2 });
            board.create('arrow', [[0, 0], z2], { strokeColor: C.secondary, strokeWidth: 2 });
            board.create('arrow', [[0, 0], zSum], { strokeColor: C.tertiary, strokeWidth: 2.5 });
            board.create('text', [-5.5, 5.5, () => {
                const r1 = Math.hypot(z1.X(), z1.Y());
                const r2 = Math.hypot(z2.X(), z2.Y());
                return `|z₁|=${r1.toFixed(2)}  |z₂|=${r2.toFixed(2)}  |z₁+z₂|=${Math.hypot(z1.X()+z2.X(), z1.Y()+z2.Y()).toFixed(2)}`;
            }], { fontSize: 10, strokeColor: '#94a3b8' });
            return board;
        },
    },

    // ── 24. Lagrange interpolation ────────────────────────────────────────────
    {
        id: 'lagrange-interpolation',
        name: 'Lagrange Interpolation',
        category: 'Analysis',
        tags: ['interpolation', 'Lagrange', 'polynomial', 'data fitting', 'nodes', 'curve fitting'],
        description: 'Drag n points; the Lagrange interpolating polynomial passes through all of them.',
        defaultConfig: { points: [[-3, 1], [-1, 2], [1, -1], [3, 2]] },
        init(JXG, boardId, cfg) {
            const rawPoints: number[][] = cfg.points ?? [[-3, 1], [-1, 2], [1, -1], [3, 2]];
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-5, 5, 5, -5], axis: true, ...BOARD_BASE_OPTS,
            });
            const pts = rawPoints.map(([px, py]) =>
                board.create('point', [px, py], { size: 5, fillColor: C.amber, strokeColor: C.amber, name: '' })
            );
            // Lagrange basis
            const lagrange = (t: number) => {
                const n = pts.length;
                let result = 0;
                for (let i = 0; i < n; i++) {
                    let basis = pts[i].Y();
                    for (let j = 0; j < n; j++) {
                        if (j !== i) basis *= (t - pts[j].X()) / (pts[i].X() - pts[j].X());
                    }
                    result += basis;
                }
                return result;
            };
            board.create('functiongraph', [(x: number) => {
                const val = lagrange(x);
                return isFinite(val) && Math.abs(val) < 20 ? val : NaN;
            }], { strokeColor: C.primary, strokeWidth: 2.5 });
            board.create('text', [-4.5, 4.5, 'Drag points to update the polynomial'],
                { fontSize: 11, strokeColor: '#94a3b8' });
            return board;
        },
    },

    // ── 25. Binomial distribution ─────────────────────────────────────────────
    {
        id: 'binomial-distribution',
        name: 'Binomial Distribution B(n, p)',
        category: 'Statistics',
        tags: ['binomial', 'probability', 'distribution', 'discrete', 'B(n,p)', 'bar chart', 'statistics'],
        description: 'Bar chart of B(n, p) PMF with sliders for n (trials) and p (success probability).',
        defaultConfig: { n: 10, p: 0.5 },
        init(JXG, boardId, cfg) {
            const { n: nInit = 10, p: pInit = 0.5 } = cfg;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-1, 0.45, nInit + 3, -0.05], axis: true, ...BOARD_BASE_OPTS,
            });
            const sN = board.create('slider', [[0, 0.42], [nInit, 0.42], [2, nInit, 20]],  { name: 'n', snapWidth: 1 });
            const sP = board.create('slider', [[0, 0.38], [nInit, 0.38], [0.01, pInit, 0.99]], { name: 'p', snapWidth: 0.01 });
            // Cached bar polygons (we'll rely on dynamic updates via functiongraph trick)
            const nMax = 20;
            const bars: any[] = [];
            for (let k = 0; k <= nMax; k++) {
                const bar = board.create('polygon', [
                    [k - 0.4, 0], [k + 0.4, 0],
                    [k + 0.4, () => {
                        const nv = Math.round(sN.Value()), pv = sP.Value();
                        if (k > nv) return 0;
                        const C_nk = factorial(nv) / (factorial(k) * factorial(nv - k));
                        return C_nk * Math.pow(pv, k) * Math.pow(1 - pv, nv - k);
                    }],
                    [k - 0.4, () => {
                        const nv = Math.round(sN.Value()), pv = sP.Value();
                        if (k > nv) return 0;
                        const C_nk = factorial(nv) / (factorial(k) * factorial(nv - k));
                        return C_nk * Math.pow(pv, k) * Math.pow(1 - pv, nv - k);
                    }],
                ], { fillColor: C.primary, fillOpacity: 0.7, strokeColor: C.primary, strokeWidth: 0.5 });
                bars.push(bar);
            }
            return board;
        },
    },

    // ── 26. Bézier curves ─────────────────────────────────────────────────────
    {
        id: 'bezier-curves',
        name: 'Bézier Curves',
        category: 'Geometry',
        tags: ['Bezier', 'spline', 'control points', 'cubic', 'approximation', 'parametric curve', 'arc approximation'],
        description: 'Interactive cubic Bézier curve: drag the four control points P₀–P₃.',
        defaultConfig: { p0: [-3, -1], p1: [-1, 3], p2: [1, 3], p3: [3, -1] },
        init(JXG, boardId, cfg) {
            const [p0, p1, p2, p3] = [
                cfg.p0 ?? [-3, -1], cfg.p1 ?? [-1, 3],
                cfg.p2 ?? [1, 3],  cfg.p3 ?? [3, -1],
            ];
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-5, 5, 5, -5], axis: true, ...BOARD_BASE_OPTS,
            });
            const P0 = board.create('point', p0, { name: 'P₀', size: 5, strokeColor: C.amber, fillColor: C.amber });
            const P1 = board.create('point', p1, { name: 'P₁', size: 5, strokeColor: C.secondary, fillColor: C.secondary });
            const P2 = board.create('point', p2, { name: 'P₂', size: 5, strokeColor: C.secondary, fillColor: C.secondary });
            const P3 = board.create('point', p3, { name: 'P₃', size: 5, strokeColor: C.amber, fillColor: C.amber });
            // Control polygon
            board.create('segment', [P0, P1], { strokeColor: '#64748b', strokeWidth: 1, dash: 1 });
            board.create('segment', [P1, P2], { strokeColor: '#64748b', strokeWidth: 1, dash: 1 });
            board.create('segment', [P2, P3], { strokeColor: '#64748b', strokeWidth: 1, dash: 1 });
            // Cubic Bézier
            board.create('curve', [
                (t: number) => {
                    const u = 1 - t;
                    return u**3 * P0.X() + 3 * u**2 * t * P1.X() + 3 * u * t**2 * P2.X() + t**3 * P3.X();
                },
                (t: number) => {
                    const u = 1 - t;
                    return u**3 * P0.Y() + 3 * u**2 * t * P1.Y() + 3 * u * t**2 * P2.Y() + t**3 * P3.Y();
                },
                0, 1,
            ], { strokeColor: C.primary, strokeWidth: 3 });
            return board;
        },
    },

    // ── 27. Polar grid ────────────────────────────────────────────────────────
    {
        id: 'polar-grid',
        name: 'Polar Grid and Curves',
        category: 'Geometry',
        tags: ['polar', 'polar coordinates', 'polar curve', 'Archimedean spiral', 'radius', 'angle', 'r(θ)'],
        description: 'Polar grid with an interactive r(θ) curve (default: Archimedean spiral r = θ/2π).',
        defaultConfig: { expression: 't / (2 * PI)', tMax: 8 * Math.PI },
        init(JXG, boardId, cfg) {
            const { expression = 't / (2 * PI)', tMax = 8 * Math.PI } = cfg;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-5, 5, 5, -5], axis: true, ...BOARD_BASE_OPTS,
            });
            // Polar grid circles
            for (const r of [1, 2, 3, 4]) {
                board.create('circle', [[0, 0], r], {
                    strokeColor: '#334155', strokeWidth: 0.8, fillColor: 'none',
                });
            }
            // Radial lines every 30°
            for (let deg = 0; deg < 360; deg += 30) {
                const rad = deg * Math.PI / 180;
                board.create('segment', [[0, 0], [5 * Math.cos(rad), 5 * Math.sin(rad)]], {
                    strokeColor: '#334155', strokeWidth: 0.8,
                });
            }
            // Polar curve r(θ)
            let rFn: (t: number) => number;
            try {
                const js = expression.replace(/\^/g, '**');
                rFn = new Function('t', `
                    "use strict";
                    const {sin,cos,tan,exp,log,sqrt,abs,PI,E,pow} = Math;
                    try { return +(${js}); } catch(e) { return 0; }
                `) as (t: number) => number;
            } catch { rFn = (t) => t / (2 * Math.PI); }
            board.create('curve', [
                (t: number) => rFn(t) * Math.cos(t),
                (t: number) => rFn(t) * Math.sin(t),
                0, tMax,
            ], { strokeColor: C.primary, strokeWidth: 2.5 });
            board.create('text', [-4.5, 4.5, `r(θ) = ${expression}`], { fontSize: 11, strokeColor: C.primary });
            return board;
        },
    },

    // ── 28. Approximate π (Monte Carlo) ──────────────────────────────────────
    {
        id: 'approximate-pi-montecarlo',
        name: 'Approximate π — Monte Carlo',
        category: 'Statistics',
        tags: ['pi', 'Monte Carlo', 'probability', 'approximation', 'circle area', 'random', 'simulation'],
        description: 'Monte Carlo estimation of π using random points in a unit square.',
        defaultConfig: { n: 500 },
        init(JXG, boardId, cfg) {
            const { n = 500 } = cfg;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-0.1, 1.1, 1.1, -0.1], axis: false, ...BOARD_BASE_OPTS,
            });
            board.create('arc', [[0, 0], [1, 0], [0, 1]], { strokeColor: C.primary, strokeWidth: 2 });
            board.create('polygon', [[0, 0], [1, 0], [1, 1], [0, 1]], {
                fillColor: 'none', strokeColor: '#475569', strokeWidth: 1.5,
            });
            let inside = 0;
            const total = Math.min(n, 2000);
            for (let i = 0; i < total; i++) {
                const x = Math.random(), y = Math.random();
                const isIn = x * x + y * y <= 1;
                if (isIn) inside++;
                board.create('point', [x, y], {
                    size: 1.5,
                    fillColor: isIn ? C.tertiary : C.secondary,
                    strokeColor: 'none', name: '',
                });
            }
            const piEst = 4 * inside / total;
            board.create('text', [0.05, 1.07, `n=${total}  π ≈ ${piEst.toFixed(4)}  (actual: 3.14159…)`],
                { fontSize: 11, strokeColor: C.primary });
            return board;
        },
    },
];
