import { JSXTemplateDef } from './types';
import { makeJSFunction, BOARD_BASE_OPTS, C } from '../mathUtils';

export const functionTemplates: JSXTemplateDef[] = [
    // ── 1. Generic function plotter ──────────────────────────────────────────
    {
        id: 'function-plotter',
        name: 'Function Plotter',
        category: 'Functions',
        tags: ['plot', 'graph', 'f(x)', 'visualize', 'function', 'curve', 'hyperbola', 'exponential', 'logarithm', 'parabola', 'draggable'],
        description: 'Plot one or two f(x) functions on configurable axes. Use expression/expression2 for the formulas.',
        defaultConfig: { expression: 'sin(x)', xMin: -7, xMax: 7, yMin: -4, yMax: 4 },
        init(JXG, boardId, cfg) {
            const { expression = 'sin(x)', expression2, xMin = -7, xMax = 7, yMin = -4, yMax = 4 } = cfg;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [xMin, yMax, xMax, yMin],
                axis: true, ...BOARD_BASE_OPTS,
            });
            const f = makeJSFunction(expression);
            board.create('functiongraph', [f, xMin, xMax], {
                strokeColor: C.primary, strokeWidth: 2.5,
            });
            if (expression2) {
                const g = makeJSFunction(expression2);
                board.create('functiongraph', [g, xMin, xMax], {
                    strokeColor: C.secondary, strokeWidth: 2.5,
                });
            }
            board.create('text', [xMin + 0.3, yMax - 0.4,
                expression2 ? `f(x) = ${expression}   g(x) = ${expression2}` : `f(x) = ${expression}`
            ], { fontSize: 12, strokeColor: C.primary });
            return board;
        },
    },

    // ── 2. Function composition f(g(x)) ─────────────────────────────────────
    {
        id: 'function-composer',
        name: 'Function Composition f(g(x))',
        category: 'Functions',
        tags: ['composition', 'f(g(x))', 'chain rule', 'composite', 'inverse composition'],
        description: 'Visualize f(x), g(x), and their composition f(g(x)) overlaid.',
        defaultConfig: { fExpression: 'x^2', gExpression: 'sin(x)' },
        init(JXG, boardId, cfg) {
            const { fExpression = 'x^2', gExpression = 'sin(x)' } = cfg;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-7, 5, 7, -5], axis: true, ...BOARD_BASE_OPTS,
            });
            const f = makeJSFunction(fExpression);
            const g = makeJSFunction(gExpression);
            board.create('functiongraph', [f], { strokeColor: C.blue, strokeWidth: 2, dash: 2 });
            board.create('functiongraph', [g], { strokeColor: C.tertiary, strokeWidth: 2, dash: 1 });
            board.create('functiongraph', [(x: number) => f(g(x))], { strokeColor: C.primary, strokeWidth: 3 });
            board.create('text', [-6.5, 4.5, `f(x) = ${fExpression}`], { fontSize: 11, strokeColor: C.blue });
            board.create('text', [-6.5, 3.9, `g(x) = ${gExpression}`], { fontSize: 11, strokeColor: C.tertiary });
            board.create('text', [-6.5, 3.3, `f(g(x))`], { fontSize: 11, strokeColor: C.primary });
            return board;
        },
    },

    // ── 3. Linear function y = mx + b ────────────────────────────────────────
    {
        id: 'linear-function-params',
        name: 'Linear Function y = mx + b',
        category: 'Functions',
        tags: ['linear', 'slope', 'intercept', 'y=mx+b', 'straight line', 'affine'],
        description: 'Interactive y = mx + b with draggable slope (m) and intercept (b) sliders.',
        defaultConfig: { m: 1, b: 0 },
        init(JXG, boardId, cfg) {
            const { m = 1, b = 0 } = cfg;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-7, 6, 7, -6], axis: true, ...BOARD_BASE_OPTS,
            });
            const sM = board.create('slider', [[-5, 5.3], [5, 5.3], [-5, m, 5]], { name: 'm', snapWidth: 0.1 });
            const sB = board.create('slider', [[-5, 4.6], [5, 4.6], [-5, b, 5]], { name: 'b', snapWidth: 0.1 });
            board.create('functiongraph', [(x: number) => sM.Value() * x + sB.Value()], {
                strokeColor: C.primary, strokeWidth: 2.5,
            });
            board.create('text', [0.5, -4.5,
                () => `y = ${sM.Value().toFixed(2)}x ${sB.Value() >= 0 ? '+' : ''} ${sB.Value().toFixed(2)}`
            ], { fontSize: 14, strokeColor: C.primary });
            return board;
        },
    },

    // ── 4. Power functions x^n ───────────────────────────────────────────────
    {
        id: 'power-functions',
        name: 'Power Functions x^n',
        category: 'Functions',
        tags: ['power', 'x^n', 'polynomial degree', 'monomial', 'n-th root', 'even odd'],
        description: 'Explore the family f(x) = x^n with a slider for the exponent n.',
        defaultConfig: { n: 2 },
        init(JXG, boardId, cfg) {
            const { n = 2 } = cfg;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-4, 6, 4, -6], axis: true, ...BOARD_BASE_OPTS,
            });
            const sN = board.create('slider', [[-3, 5.5], [3, 5.5], [-8, n, 8]], {
                name: 'n', snapWidth: 1,
            });
            board.create('functiongraph', [(x: number) => {
                const exp = Math.round(sN.Value());
                if (exp < 0 && Math.abs(x) < 1e-6) return NaN;
                return Math.pow(Math.abs(x), exp) * (exp % 2 !== 0 ? Math.sign(x) : 1);
            }], { strokeColor: C.primary, strokeWidth: 2.5 });
            board.create('text', [0.3, -4.5, () => `f(x) = x^${Math.round(sN.Value())}`],
                { fontSize: 13, strokeColor: C.primary });
            return board;
        },
    },

    // ── 5. Sine and cosine functions ─────────────────────────────────────────
    {
        id: 'sine-cosine-functions',
        name: 'Sine and Cosine Functions',
        category: 'Functions',
        tags: ['sine', 'cosine', 'amplitude', 'period', 'frequency', 'sinusoidal', 'waveform', 'trig', 'cosine', 'pulse', 'sawtooth'],
        description: 'A·sin(ωx) and A·cos(ωx) with amplitude and frequency sliders.',
        defaultConfig: { amplitude: 1, omega: 1 },
        init(JXG, boardId, cfg) {
            const { amplitude = 1, omega = 1 } = cfg;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-7, 3.5, 7, -3.5], axis: true, ...BOARD_BASE_OPTS,
            });
            const sA = board.create('slider', [[-5, 3.1], [5, 3.1], [0, amplitude, 3]], { name: 'A', snapWidth: 0.1 });
            const sW = board.create('slider', [[-5, 2.6], [5, 2.6], [0.1, omega, 4]], { name: 'ω', snapWidth: 0.1 });
            board.create('functiongraph', [(x: number) => sA.Value() * Math.sin(sW.Value() * x)], {
                strokeColor: C.primary, strokeWidth: 2.5,
            });
            board.create('functiongraph', [(x: number) => sA.Value() * Math.cos(sW.Value() * x)], {
                strokeColor: C.secondary, strokeWidth: 2, dash: 2,
            });
            board.create('text', [-6.5, 1.5, 'sin'], { fontSize: 11, strokeColor: C.primary });
            board.create('text', [-6.5, 1.1, 'cos (dashed)'], { fontSize: 11, strokeColor: C.secondary });
            return board;
        },
    },

    // ── 6. Exploring functions (zeros / local extrema) ───────────────────────
    {
        id: 'exploring-functions',
        name: 'Exploring Functions',
        category: 'Functions',
        tags: ['zeros', 'roots', 'extrema', 'increasing', 'decreasing', 'polynomial', 'sketch polynomial', 'trace'],
        description: 'Plot f(x) with a draggable tracer point showing x, f(x), f\'(x) values.',
        defaultConfig: { expression: 'x^3 - 3*x' },
        init(JXG, boardId, cfg) {
            const { expression = 'x^3 - 3*x' } = cfg;
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-5, 5, 5, -5], axis: true, ...BOARD_BASE_OPTS,
            });
            const f = makeJSFunction(expression);
            const curve = board.create('functiongraph', [f], { strokeColor: C.primary, strokeWidth: 2.5 });
            const tracer = board.create('glider', [0, f(0), curve], {
                name: '', size: 5, fillColor: C.amber, strokeColor: C.amber,
            });
            board.create('text', [0.5, 4.3, () => {
                const x0 = tracer.X();
                const df = (f(x0 + 1e-5) - f(x0 - 1e-5)) / 2e-5;
                return `x=${x0.toFixed(2)}  f=${f(x0).toFixed(2)}  f'=${df.toFixed(2)}`;
            }], { fontSize: 12, strokeColor: C.amber });
            board.create('text', [-4.5, 4.3, `f(x) = ${expression}`], { fontSize: 12, strokeColor: C.primary });
            return board;
        },
    },

    // ── 7. Step / piecewise function ─────────────────────────────────────────
    {
        id: 'step-function',
        name: 'Step Function ⌊x⌋',
        category: 'Functions',
        tags: ['step', 'floor', 'ceiling', 'Heaviside', 'piecewise', 'discontinuous', 'integer part', 'waveform'],
        description: 'The floor function ⌊x⌋ (greatest integer function) showing jump discontinuities.',
        defaultConfig: {},
        init(JXG, boardId, _cfg) {
            const board = JXG.JSXGraph.initBoard(boardId, {
                boundingbox: [-5, 5, 5, -5], axis: true, ...BOARD_BASE_OPTS,
            });
            for (let k = -5; k <= 4; k++) {
                board.create('segment', [[k, k], [k + 1, k]], {
                    strokeColor: C.primary, strokeWidth: 2.5,
                    straightFirst: false, straightLast: false,
                });
                board.create('point', [k, k], { size: 3, fillColor: C.primary, strokeColor: C.primary, name: '' });
                board.create('point', [k + 1, k], { size: 3, fillColor: 'white', strokeColor: C.primary, name: '' });
            }
            board.create('text', [-4.5, 4.5, 'f(x) = ⌊x⌋  (floor / step)'], { fontSize: 12, strokeColor: C.primary });
            return board;
        },
    },
];
