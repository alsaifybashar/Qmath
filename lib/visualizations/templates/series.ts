import { JSXTemplateDef } from './types';
import { makeJSFunction, makeJSFunctionForSymbols, factorial, BOARD_BASE_OPTS, C } from '../mathUtils';

export const seriesTemplates: JSXTemplateDef[] = [
    // ── 15. Taylor series for sine ────────────────────────────────────────────
    {
        id: 'taylor-series-sine',
        name: 'Taylor Series for Sine',
        category: 'Series',
        tags: ['Taylor', 'Maclaurin', 'sine', 'polynomial approximation', 'power series', 'degree'],
        description: 'Interactive Taylor polynomial for sin(x): drag the degree slider to see convergence.',
        defaultConfig: { degree: 3, center: 0 },
        init(JXG, boardId, cfg) {
            const { degree = 3, center = 0 } = cfg;
            const a = center;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-8, 3, 8, -3], axis: true, ...BOARD_BASE_OPTS,
            });
            board.create('functiongraph', [Math.sin], { strokeColor: C.primary, strokeWidth: 3 });
            const sN = board.create('slider', [[-6, 2.6], [6, 2.6], [1, degree, 15]], {
                name: 'N', snapWidth: 2,
            });
            // Tₙ(x) = Σ_{k=0}^{N} (-1)^k (x-a)^(2k+1) / (2k+1)!
            board.create('functiongraph', [(x: number) => {
                const N = Math.round(sN.Value());
                let s = 0;
                for (let k = 0; k <= N; k++) {
                    s += (Math.pow(-1, k) * Math.pow(x - a, 2 * k + 1)) / factorial(2 * k + 1);
                }
                return s;
            }], { strokeColor: C.secondary, strokeWidth: 2.5 });
            board.create('text', [-7.5, 2.5, () => `T_${Math.round(sN.Value())}(x) — blue: sin(x)`],
                { fontSize: 11, strokeColor: C.secondary });
            if (a !== 0) {
                board.create('line', [[a, -5], [a, 5]], {
                    strokeColor: C.amber, strokeWidth: 1, dash: 2,
                });
                board.create('text', [a + 0.1, 2.4, `a=${a}`], { fontSize: 10, strokeColor: C.amber });
            }
            return board;
        },
    },

    // ── 16. Power series for e^x ──────────────────────────────────────────────
    {
        id: 'power-series-exp',
        name: 'Power Series for eˣ',
        category: 'Series',
        tags: ['exponential', 'Taylor', 'e^x', 'power series', 'Maclaurin', 'approximation of e', 'pointwise'],
        description: 'Taylor polynomial for eˣ = Σ xⁿ/n! with degree slider showing convergence.',
        defaultConfig: { degree: 4 },
        init(JXG, boardId, cfg) {
            const { degree = 4 } = cfg;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-5, 8, 5, -2], axis: true, ...BOARD_BASE_OPTS,
            });
            board.create('functiongraph', [Math.exp], { strokeColor: C.primary, strokeWidth: 3 });
            const sN = board.create('slider', [[-4, 7.2], [4, 7.2], [1, degree, 12]], {
                name: 'N', snapWidth: 1,
            });
            // Tₙ(x) = Σ_{k=0}^{n} x^k / k!
            board.create('functiongraph', [(x: number) => {
                const N = Math.round(sN.Value());
                let s = 0;
                for (let k = 0; k <= N; k++) s += Math.pow(x, k) / factorial(k);
                return s;
            }], { strokeColor: C.secondary, strokeWidth: 2.5 });
            board.create('text', [-4.5, 6.5, () => `T_${Math.round(sN.Value())}(x) ≈ eˣ (blue)`],
                { fontSize: 11, strokeColor: C.secondary });
            return board;
        },
    },

    // ── 17. Power series for sin and cos ──────────────────────────────────────
    {
        id: 'power-series-sine-cosine',
        name: 'Power Series for sin and cos',
        category: 'Series',
        tags: ['power series', 'sine', 'cosine', 'Maclaurin', 'alternating series', 'trig series'],
        description: 'Shows sin(x) and cos(x) alongside their Taylor polynomials simultaneously.',
        defaultConfig: { degree: 3 },
        init(JXG, boardId, cfg) {
            const { degree = 3 } = cfg;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-8, 3, 8, -3], axis: true, ...BOARD_BASE_OPTS,
            });
            board.create('functiongraph', [Math.sin], { strokeColor: C.primary, strokeWidth: 3 });
            board.create('functiongraph', [Math.cos], { strokeColor: C.blue, strokeWidth: 3 });
            const sN = board.create('slider', [[-6, 2.7], [6, 2.7], [1, degree, 10]], {
                name: 'N', snapWidth: 1,
            });
            // sin Taylor
            board.create('functiongraph', [(x: number) => {
                const N = Math.round(sN.Value());
                let s = 0;
                for (let k = 0; k <= N; k++) s += Math.pow(-1, k) * Math.pow(x, 2 * k + 1) / factorial(2 * k + 1);
                return s;
            }], { strokeColor: C.secondary, strokeWidth: 2, dash: 1 });
            // cos Taylor
            board.create('functiongraph', [(x: number) => {
                const N = Math.round(sN.Value());
                let s = 0;
                for (let k = 0; k <= N; k++) s += Math.pow(-1, k) * Math.pow(x, 2 * k) / factorial(2 * k);
                return s;
            }], { strokeColor: C.tertiary, strokeWidth: 2, dash: 1 });
            board.create('text', [-7.5, 2.7, 'sin (approx dashed)'], { fontSize: 10, strokeColor: C.secondary });
            board.create('text', [-7.5, 2.3, 'cos (approx dashed)'], { fontSize: 10, strokeColor: C.tertiary });
            return board;
        },
    },

    // ── 18. Convergence of a sequence ─────────────────────────────────────────
    {
        id: 'convergence-sequence',
        name: 'Convergence of Sequence',
        category: 'Series',
        tags: ['sequence', 'convergence', 'limit', 'a_n', 'epsilon band', 'n→∞'],
        description: 'Plots the first N terms of a sequence a_n and shows convergence to its limit.',
        defaultConfig: { expression: '1/n', nTerms: 30, limit: 0 },
        init(JXG, boardId, cfg) {
            const { expression = '1/n', nTerms = 30, limit = 0 } = cfg;
            const parsedSequence = makeJSFunctionForSymbols(expression, ['n']);
            const seqFn = (n: number) => {
                const value = parsedSequence(n);
                return Number.isFinite(value) ? value : 1 / n;
            };
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-1, 2, nTerms + 2, -0.5], axis: true, ...BOARD_BASE_OPTS,
            });
            for (let i = 1; i <= nTerms; i++) {
                const val = seqFn(i);
                if (!isFinite(val)) continue;
                board.create('point', [i, val], {
                    size: 3, fillColor: C.primary, strokeColor: C.primary, name: '',
                });
            }
            // Limit line
            board.create('line', [[0, limit], [1, limit]], {
                strokeColor: C.secondary, strokeWidth: 1.5, dash: 2,
            });
            board.create('text', [nTerms - 4, limit + 0.1, `L = ${limit}`],
                { fontSize: 11, strokeColor: C.secondary });
            board.create('text', [0.5, 1.8, `a_n = ${expression}`],
                { fontSize: 12, strokeColor: C.primary });
            return board;
        },
    },

    // ── 19. Convergence of a series (partial sums) ────────────────────────────
    {
        id: 'convergence-series',
        name: 'Convergence of Series',
        category: 'Series',
        tags: ['series', 'partial sums', 'convergence', 'divergence', 'sum', 'S_n'],
        description: 'Plots partial sums Sₙ = Σaₖ of a series; shows convergence (or divergence).',
        defaultConfig: { expression: '1/n^2', nTerms: 40 },
        init(JXG, boardId, cfg) {
            const { expression = '1/n^2', nTerms = 40 } = cfg;
            const parsedSequence = makeJSFunctionForSymbols(expression, ['n']);
            const seqFn = (n: number) => {
                const value = parsedSequence(n);
                return Number.isFinite(value) ? value : 1 / (n * n);
            };

            // Compute partial sums
            const partials: number[] = [];
            let s = 0;
            for (let i = 1; i <= nTerms; i++) {
                s += seqFn(i);
                partials.push(isFinite(s) ? s : NaN);
            }
            const yMax = Math.min(partials.filter(isFinite).reduce((a, b) => Math.max(a, b), 0) + 1, 20);
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-1, yMax, nTerms + 2, -0.5], axis: true, ...BOARD_BASE_OPTS,
            });
            for (let i = 0; i < partials.length; i++) {
                if (!isFinite(partials[i])) continue;
                board.create('point', [i + 1, partials[i]], {
                    size: 3, fillColor: C.primary, strokeColor: C.primary, name: '',
                });
                if (i > 0) {
                    board.create('segment', [[i, partials[i - 1]], [i + 1, partials[i]]], {
                        strokeColor: C.primary, strokeWidth: 1.5,
                    });
                }
            }
            const lastS = partials[partials.length - 1];
            if (isFinite(lastS)) {
                board.create('line', [[0, lastS], [1, lastS]], {
                    strokeColor: C.secondary, strokeWidth: 1.5, dash: 2,
                });
            }
            board.create('text', [0.5, yMax - 0.3, `Σ a_n  where  a_n = ${expression}`],
                { fontSize: 12, strokeColor: C.primary });
            return board;
        },
    },
];
