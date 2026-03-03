import { JSXTemplateDef } from './types';
import { makeJSFunction2D, BOARD_BASE_OPTS, C } from '../mathUtils';

/** Shared 3D board + view factory. Returns { board, view }. */
function make3DBoard(JXG: any, boardId: string, bbRange = 3) {
    const board = JXG.JSXGraph.initBoard(boardId, {
        boundingbox: [-bbRange - 2, bbRange + 2, bbRange + 2, -bbRange - 2],
        ...BOARD_BASE_OPTS,
        axis: false,
    });
    const view = board.create(
        'view3d',
        [[-bbRange, -bbRange], [bbRange * 2, bbRange * 2],
         [[-bbRange, bbRange], [-bbRange, bbRange], [-bbRange, bbRange]]],
        {
            xPlaneRear: { visible: false },
            yPlaneRear: { visible: false },
            zPlaneRear: { fillColor: '#0f172a', fillOpacity: 0.05, visible: true },
            projection: 'parallel',
        }
    );
    return { board, view };
}

export const threeDTemplates: JSXTemplateDef[] = [
    // ── 29. 3D function graph z = f(x, y) ─────────────────────────────────────
    {
        id: '3d-function-graph',
        name: '3D Function Graph z = f(x, y)',
        category: '3D',
        tags: ['3D', 'surface', 'z=f(x,y)', 'function graph 3D', 'surface plot', '3D plotter', 'gradient', 'tangent plane'],
        description: 'Interactive 3D surface plot of z = f(x, y). Set expression to any formula in x and y.',
        defaultConfig: { expression: 'sin(sqrt(x^2 + y^2))', range: 3 },
        init(JXG, boardId, cfg) {
            const { expression = 'sin(sqrt(x^2 + y^2))', range = 3 } = cfg;
            const f = makeJSFunction2D(expression);
            const { board, view } = make3DBoard(JXG, boardId, range);
            view.create('functiongraph3d', [
                (x: number, y: number) => {
                    const z = f(x, y);
                    return isFinite(z) ? z : 0;
                },
                [-range, range],
                [-range, range],
            ], {
                strokeColor: C.primary,
                strokeWidth: 0.5,
                mesh3d: { visible: true, strokeColor: '#1e1b4b', strokeWidth: 0.3 },
            });
            board.create('text', [10, 10, `z = ${expression}`], { fontSize: 11, strokeColor: C.primary });
            return board;
        },
    },

    // ── 30. 3D parametric curve ───────────────────────────────────────────────
    {
        id: '3d-curve',
        name: '3D Parametric Curve',
        category: '3D',
        tags: ['3D curve', 'helix', 'space curve', 'parametric', '3D', 'spiral'],
        description: 'A parametric 3D curve (t → x(t), y(t), z(t)). Default: helix.',
        defaultConfig: { xExpr: 'cos(t)', yExpr: 'sin(t)', zExpr: 't / (2*PI)', tMin: 0, tMax: 6 * Math.PI },
        init(JXG, boardId, cfg) {
            const {
                xExpr = 'cos(t)', yExpr = 'sin(t)', zExpr = 't / (2*PI)',
                tMin = 0, tMax = 6 * Math.PI,
            } = cfg;
            let xFn: (t: number) => number,
                yFn: (t: number) => number,
                zFn: (t: number) => number;
            const buildFn = (expr: string) => {
                try {
                    const js = expr.replace(/\^/g, '**');
                    return new Function('t', `
                        "use strict";
                        const {sin,cos,tan,exp,log,sqrt,abs,PI,E,pow} = Math;
                        try { return +(${js}); } catch(e) { return 0; }
                    `) as (t: number) => number;
                } catch { return () => 0; }
            };
            xFn = buildFn(xExpr); yFn = buildFn(yExpr); zFn = buildFn(zExpr);
            const { board, view } = make3DBoard(JXG, boardId, 2);
            view.create('curve3d', [xFn, yFn, zFn, [tMin, tMax]], {
                strokeColor: C.primary, strokeWidth: 2.5,
            });
            board.create('text', [8, 8,
                `(${xExpr}, ${yExpr}, ${zExpr})`
            ], { fontSize: 10, strokeColor: C.primary });
            return board;
        },
    },

    // ── 31. 3D vector field ───────────────────────────────────────────────────
    {
        id: '3d-vector-field',
        name: '3D Vector Field',
        category: '3D',
        tags: ['3D vector field', 'curl', 'divergence', 'flow', 'gradient field', '3D'],
        description: 'A 3D vector field F(x,y,z) = (Fx, Fy, Fz). Default: rotating field.',
        defaultConfig: { fxExpr: '-y', fyExpr: 'x', fzExpr: '0.2' },
        init(JXG, boardId, cfg) {
            const { fxExpr = '-y', fyExpr = 'x', fzExpr = '0.2' } = cfg;
            const buildFn3 = (expr: string) => {
                try {
                    const js = expr.replace(/\^/g, '**');
                    return new Function('x', 'y', 'z', `
                        "use strict";
                        const {sin,cos,exp,log,sqrt,abs,PI,E,pow} = Math;
                        try { return +(${js}); } catch(e) { return 0; }
                    `) as (x: number, y: number, z: number) => number;
                } catch { return () => 0; }
            };
            const Fx = buildFn3(fxExpr);
            const Fy = buildFn3(fyExpr);
            const Fz = buildFn3(fzExpr);
            const { board, view } = make3DBoard(JXG, boardId, 2);
            view.create('vectorfield3d', [
                (x: number, y: number, z: number) => Fx(x, y, z),
                (x: number, y: number, z: number) => Fy(x, y, z),
                (x: number, y: number, z: number) => Fz(x, y, z),
                [-2, 0.8, 2],
                [-2, 0.8, 2],
                [-2, 0.8, 2],
            ], { strokeColor: C.secondary, strokeWidth: 1.5 });
            board.create('text', [8, 8,
                `F = (${fxExpr}, ${fyExpr}, ${fzExpr})`
            ], { fontSize: 10, strokeColor: C.secondary });
            return board;
        },
    },
];
