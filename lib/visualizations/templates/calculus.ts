import { JSXTemplateDef } from './types';
import { makeJSFunction, numDeriv, numIntegral, BOARD_BASE_OPTS, C } from '../mathUtils';

export const calculusTemplates: JSXTemplateDef[] = [
    // ── 8. Secant → tangent line ──────────────────────────────────────────────
    {
        id: 'secant-tangent',
        name: 'Secant and Tangent Lines',
        category: 'Calculus',
        tags: ['secant', 'tangent', 'derivative', 'limit', 'difference quotient', 'slope', 'h→0'],
        description: 'Drag x₀ on f(x); a slider h shrinks the secant into the tangent — visualising the limit definition of the derivative.',
        defaultConfig: { expression: 'x^2', x0: 1 },
        init(JXG, boardId, cfg) {
            const { expression = 'x^2', x0 = 1 } = cfg;
            const f = makeJSFunction(expression);
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-5, 8, 5, -3], axis: true, ...BOARD_BASE_OPTS,
            });
            board.create('functiongraph', [f], { strokeColor: C.primary, strokeWidth: 2.5 });
            const sH = board.create('slider', [[-4, 7.3], [4, 7.3], [0.01, 1.5, 3]], { name: 'h', snapWidth: 0.01 });
            const pX = board.create('glider', [x0, f(x0), board.defaultAxes.x], {
                name: 'x₀', size: 5, strokeColor: C.amber, fillColor: C.amber,
            });
            const ptA = board.create('point', [() => pX.X(), () => f(pX.X())], {
                name: '', size: 4, strokeColor: C.primary, fillColor: C.primary,
            });
            const ptB = board.create('point', [() => pX.X() + sH.Value(), () => f(pX.X() + sH.Value())], {
                name: '', size: 4, strokeColor: C.secondary, fillColor: C.secondary,
            });
            // Secant line through ptA and ptB
            board.create('line', [ptA, ptB], { strokeColor: C.secondary, strokeWidth: 2, dash: 1 });
            // Tangent line (h → 0 limit)
            board.create('functiongraph', [(x: number) => {
                const x0v = pX.X();
                const slope = numDeriv(f, x0v);
                return f(x0v) + slope * (x - x0v);
            }], { strokeColor: C.tertiary, strokeWidth: 2 });
            board.create('text', [-4.5, 6.5, () => {
                const h = sH.Value();
                const x0v = pX.X();
                const slope = (f(x0v + h) - f(x0v)) / h;
                return `secant slope = ${slope.toFixed(3)}   f'(${x0v.toFixed(2)}) = ${numDeriv(f, x0v).toFixed(3)}`;
            }], { fontSize: 11, strokeColor: C.secondary });
            return board;
        },
    },

    // ── 9. Mean Value Theorem ─────────────────────────────────────────────────
    {
        id: 'mean-value-theorem',
        name: 'Mean Value Theorem',
        category: 'Calculus',
        tags: ['MVT', 'mean value', 'secant', 'parallel tangent', 'Rolle', 'extended MVT'],
        description: 'Drag endpoints a, b to see the guaranteed MVT point c where f\'(c) equals the secant slope.',
        defaultConfig: { expression: 'x^3 - 3*x', a: -2, b: 2 },
        init(JXG, boardId, cfg) {
            const { expression = 'x^3 - 3*x', a = -2, b = 2 } = cfg;
            const f = makeJSFunction(expression);
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-5, 6, 5, -6], axis: true, ...BOARD_BASE_OPTS,
            });
            board.create('functiongraph', [f], { strokeColor: C.primary, strokeWidth: 2.5 });
            const ptA = board.create('glider', [a, 0, board.defaultAxes.x], {
                name: 'a', size: 5, strokeColor: C.blue, fillColor: C.blue,
            });
            const ptB = board.create('glider', [b, 0, board.defaultAxes.x], {
                name: 'b', size: 5, strokeColor: C.blue, fillColor: C.blue,
            });
            // Secant line
            board.create('line', [
                [() => ptA.X(), () => f(ptA.X())],
                [() => ptB.X(), () => f(ptB.X())],
            ], { strokeColor: C.secondary, strokeWidth: 2, dash: 1 });
            // Find c numerically (bisection on f'(c) = secant slope)
            const findC = () => {
                const av = ptA.X(), bv = ptB.X();
                if (Math.abs(bv - av) < 1e-8) return (av + bv) / 2;
                const slope = (f(bv) - f(av)) / (bv - av);
                let lo = Math.min(av, bv), hi = Math.max(av, bv);
                for (let i = 0; i < 60; i++) {
                    const mid = (lo + hi) / 2;
                    if (numDeriv(f, mid) < slope) lo = mid; else hi = mid;
                }
                return (lo + hi) / 2;
            };
            // Tangent at c (parallel to secant)
            board.create('functiongraph', [(x: number) => {
                const cv = findC();
                return f(cv) + numDeriv(f, cv) * (x - cv);
            }], { strokeColor: C.tertiary, strokeWidth: 2 });
            // Mark c
            board.create('point', [() => findC(), () => f(findC())], {
                name: 'c', size: 5, strokeColor: C.tertiary, fillColor: C.tertiary,
            });
            return board;
        },
    },

    // ── 10. Antiderivative / Accumulation function ────────────────────────────
    {
        id: 'antiderivative',
        name: 'Antiderivative F(x) = ∫ₐˣ f(t) dt',
        category: 'Calculus',
        tags: ['antiderivative', 'accumulation', 'integral', 'F(x)', 'area accumulation', 'fundamental theorem'],
        description: 'Shows f(x) and its accumulation function F(x) = ∫₀ˣ f(t)dt simultaneously.',
        defaultConfig: { expression: 'sin(x)', a: 0 },
        init(JXG, boardId, cfg) {
            const { expression = 'sin(x)', a: aVal = 0 } = cfg;
            const f = makeJSFunction(expression);
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-7, 4, 7, -4], axis: true, ...BOARD_BASE_OPTS,
            });
            board.create('functiongraph', [f], { strokeColor: C.primary, strokeWidth: 2.5 });
            // Accumulation function via numerical integration
            const F = (x: number) => numIntegral(f, aVal, x, 400);
            board.create('functiongraph', [F], { strokeColor: C.secondary, strokeWidth: 2.5 });
            // Draggable upper limit x to shade area
            const pX = board.create('glider', [2, 0, board.defaultAxes.x], {
                name: 'x', size: 5, fillColor: C.amber, strokeColor: C.amber,
            });
            // Shade area under f from a to x
            const shadeCurve = board.create('functiongraph', [f], { visible: false });
            const integral = board.create('integral',
                [[() => aVal, () => pX.X(), shadeCurve]],
                { fillColor: C.primary, fillOpacity: 0.2, strokeColor: 'none' }
            );
            board.create('text', [-6.5, 3.5, `f(x) = ${expression}`], { fontSize: 12, strokeColor: C.primary });
            board.create('text', [-6.5, 3.0, `F(x) = ∫₀ˣ f(t)dt`], { fontSize: 12, strokeColor: C.secondary });
            return board;
        },
    },

    // ── 11. Differentiability at a point ──────────────────────────────────────
    {
        id: 'differentiability',
        name: 'Differentiability at a Point',
        category: 'Calculus',
        tags: ['differentiability', 'left derivative', 'right derivative', 'corner', 'cusp', 'kink', 'discontinuous derivative'],
        description: 'Shows left- and right-hand difference quotients converging (or not) as h→0.',
        defaultConfig: { expression: 'abs(x)', x0: 0 },
        init(JXG, boardId, cfg) {
            const { expression = 'abs(x)', x0 = 0 } = cfg;
            const f = makeJSFunction(expression);
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-5, 5, 5, -3], axis: true, ...BOARD_BASE_OPTS,
            });
            board.create('functiongraph', [f], { strokeColor: C.primary, strokeWidth: 2.5 });
            const sH = board.create('slider', [[-4, 4.5], [4, 4.5], [0.01, 1, 3]], { name: 'h', snapWidth: 0.01 });
            const ptX = board.create('glider', [x0, 0, board.defaultAxes.x], {
                name: 'x₀', size: 5, fillColor: C.amber, strokeColor: C.amber,
            });
            // Right difference quotient line
            board.create('line', [
                [() => ptX.X(), () => f(ptX.X())],
                [() => ptX.X() + sH.Value(), () => f(ptX.X() + sH.Value())],
            ], { strokeColor: C.secondary, strokeWidth: 2 });
            // Left difference quotient line
            board.create('line', [
                [() => ptX.X() - sH.Value(), () => f(ptX.X() - sH.Value())],
                [() => ptX.X(), () => f(ptX.X())],
            ], { strokeColor: C.tertiary, strokeWidth: 2 });
            board.create('text', [-4.5, 3.7, () => {
                const h = sH.Value(), x0v = ptX.X();
                const dRight = (f(x0v + h) - f(x0v)) / h;
                const dLeft  = (f(x0v) - f(x0v - h)) / h;
                return `right: ${dRight.toFixed(3)}   left: ${dLeft.toFixed(3)}`;
            }], { fontSize: 11, strokeColor: C.secondary });
            return board;
        },
    },

    // ── 12. Continuity: ε-δ definition ────────────────────────────────────────
    {
        id: 'continuity-epsilon-delta',
        name: 'Continuity: ε-δ Definition',
        category: 'Calculus',
        tags: ['continuity', 'epsilon delta', 'ε-δ', 'limit', 'continuous', 'non-uniform'],
        description: 'Drag a and adjust ε/δ to explore the ε-δ definition of continuity at a point.',
        defaultConfig: { expression: 'sin(x)', a: 1 },
        init(JXG, boardId, cfg) {
            const { expression = 'sin(x)', a = 1 } = cfg;
            const f = makeJSFunction(expression);
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-5, 4, 5, -4], axis: true, ...BOARD_BASE_OPTS,
            });
            board.create('functiongraph', [f], { strokeColor: C.primary, strokeWidth: 2.5 });
            const sEps = board.create('slider', [[-4, 3.5], [2, 3.5], [0.05, 0.5, 2]], { name: 'ε', snapWidth: 0.05 });
            const sDel = board.create('slider', [[-4, 3.0], [2, 3.0], [0.05, 0.5, 2]], { name: 'δ', snapWidth: 0.05 });
            const ptA  = board.create('glider', [a, 0, board.defaultAxes.x], {
                name: 'a', size: 5, fillColor: C.amber, strokeColor: C.amber,
            });
            const L = () => f(ptA.X());
            // ε-band (horizontal)
            board.create('line', [[0, () => L() + sEps.Value()], [1, () => L() + sEps.Value()]], {
                strokeColor: C.secondary, strokeWidth: 1.5, dash: 2,
            });
            board.create('line', [[0, () => L() - sEps.Value()], [1, () => L() - sEps.Value()]], {
                strokeColor: C.secondary, strokeWidth: 1.5, dash: 2,
            });
            // δ-band (vertical)
            board.create('line', [[() => ptA.X() + sDel.Value(), -5], [() => ptA.X() + sDel.Value(), 5]], {
                strokeColor: C.tertiary, strokeWidth: 1.5, dash: 2,
            });
            board.create('line', [[() => ptA.X() - sDel.Value(), -5], [() => ptA.X() - sDel.Value(), 5]], {
                strokeColor: C.tertiary, strokeWidth: 1.5, dash: 2,
            });
            board.create('point', [() => ptA.X(), () => L()], {
                name: 'L', size: 5, fillColor: C.secondary, strokeColor: C.secondary,
            });
            return board;
        },
    },

    // ── 13. Approximate arc length ────────────────────────────────────────────
    {
        id: 'approximate-arc-length',
        name: 'Approximate Arc Length',
        category: 'Calculus',
        tags: ['arc length', 'curve length', 'chord approximation', 'Riemann'],
        description: 'Shows how chord segments approximate the arc length of f(x) on [a, b].',
        defaultConfig: { expression: 'sin(x)', a: 0, b: Math.PI * 2, n: 6 },
        init(JXG, boardId, cfg) {
            const { expression = 'sin(x)', a = 0, b = 6.28, n: nInit = 6 } = cfg;
            const f = makeJSFunction(expression);
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [a - 1, 3, b + 1, -3], axis: true, ...BOARD_BASE_OPTS,
            });
            board.create('functiongraph', [f, a, b], { strokeColor: C.primary, strokeWidth: 2.5 });
            const sN = board.create('slider', [[a, 2.7], [b, 2.7], [2, nInit, 50]], {
                name: 'n', snapWidth: 1,
            });
            // Draw chord segments
            const drawChords = () => {
                const nv = Math.round(sN.Value());
                const h = (b - a) / nv;
                let totalLen = 0;
                const segs: any[] = [];
                for (let i = 0; i < nv; i++) {
                    const x1 = a + i * h, x2 = a + (i + 1) * h;
                    const y1 = f(x1), y2 = f(x2);
                    totalLen += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                }
                return totalLen;
            };
            board.create('text', [a, -1.5,
                () => `Chord sum ≈ ${drawChords().toFixed(4)}`
            ], { fontSize: 12, strokeColor: C.secondary });
            // Dynamic chord segments via curve with n-controlled points
            board.create('curve', [
                (t: number, suspendedUpdate: boolean) => {
                    if (!suspendedUpdate) return;
                    const nv = Math.round(sN.Value());
                    const h = (b - a) / nv;
                    const pts: number[] = [];
                    for (let i = 0; i <= nv; i++) pts.push(a + i * h);
                    return pts[Math.round(t)];
                },
                (t: number) => {
                    const nv = Math.round(sN.Value());
                    const h = (b - a) / nv;
                    return f(a + Math.round(t) * h);
                },
                0,
                () => Math.round(sN.Value()),
            ], { strokeColor: C.secondary, strokeWidth: 1.5 });
            return board;
        },
    },

    // ── 14. Area between two curves ───────────────────────────────────────────
    {
        id: 'shade-bounded-curves',
        name: 'Area Between Curves',
        category: 'Calculus',
        tags: ['area', 'integral', 'bounded', 'shade', 'two curves', 'intersection'],
        description: 'Shade the region between f(x) and g(x) on [a, b] and display its area.',
        defaultConfig: { fExpression: 'x^2', gExpression: '2*x', a: 0, b: 2 },
        init(JXG, boardId, cfg) {
            const { fExpression = 'x^2', gExpression = '2*x', a = 0, b = 2 } = cfg;
            const f = makeJSFunction(fExpression);
            const g = makeJSFunction(gExpression);
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [a - 1, Math.max(f(b), g(b)) + 1.5, b + 1, Math.min(f(a), g(a)) - 1.5],
                axis: true, ...BOARD_BASE_OPTS,
            });
            const cF = board.create('functiongraph', [f], { strokeColor: C.primary, strokeWidth: 2.5 });
            const cG = board.create('functiongraph', [g], { strokeColor: C.secondary, strokeWidth: 2.5 });
            // Shade between f and g (use two integrals: ∫g - ∫f when g>f, etc.)
            board.create('curve', [
                (t: number) => {
                    if (t <= 0.5) return a + t * 2 * (b - a);
                    return b - (t - 0.5) * 2 * (b - a);
                },
                (t: number) => {
                    if (t <= 0.5) {
                        const x = a + t * 2 * (b - a);
                        return Math.min(f(x), g(x));
                    }
                    const x = b - (t - 0.5) * 2 * (b - a);
                    return Math.max(f(x), g(x));
                },
                0, 1,
            ], { fillColor: C.primary, fillOpacity: 0.2, strokeColor: 'none' });
            const area = numIntegral((x) => Math.abs(g(x) - f(x)), a, b);
            board.create('text', [a, Math.min(f(a), g(a)) - 0.8,
                `Area = ${area.toFixed(4)}`
            ], { fontSize: 12, strokeColor: C.primary });
            board.create('text', [a, Math.min(f(a), g(a)) - 1.3,
                `f(x) = ${fExpression}  |  g(x) = ${gExpression}`
            ], { fontSize: 11, strokeColor: C.secondary });
            return board;
        },
    },
];
