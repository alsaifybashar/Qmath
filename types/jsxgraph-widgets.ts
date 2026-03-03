export type JSXGraphWidgetType =
    | 'PolynomialRootFinder'
    | 'InteractiveUnitCircle'
    | 'InequalitiesVisualizer'
    | 'VectorOperationsBoard'
    | 'MatrixDeformationBoard'
    | 'LinearSpanExplorer'
    | 'EigenvectorVisualizer'
    | 'IntersectingPlanes3D'
    | 'DerivativeDefinitionBoard'
    | 'CurveSketchingBoard'
    | 'RiemannSumsVisualizer'
    | 'TaylorSeriesApproximation';

/** IDs for the new generic JSXTemplate-based visualizations. */
export type JSXTemplateWidgetType =
    // Functions
    | 'function-plotter' | 'function-composer' | 'linear-function-params'
    | 'power-functions' | 'sine-cosine-functions' | 'exploring-functions' | 'step-function'
    // Calculus
    | 'secant-tangent' | 'mean-value-theorem' | 'antiderivative' | 'differentiability'
    | 'continuity-epsilon-delta' | 'approximate-arc-length' | 'shade-bounded-curves'
    // Series
    | 'taylor-series-sine' | 'power-series-exp' | 'power-series-sine-cosine'
    | 'convergence-sequence' | 'convergence-series'
    // Analysis / ODE / Physics
    | 'differential-equations' | 'logistic-process' | 'projectile-motion'
    | 'complex-arithmetic' | 'lagrange-interpolation' | 'binomial-distribution'
    | 'bezier-curves' | 'polar-grid' | 'approximate-pi-montecarlo'
    // 3D
    | '3d-function-graph' | '3d-curve' | '3d-vector-field';

export type AnyWidgetType =
    | JSXGraphWidgetType
    | JSXTemplateWidgetType
    | 'GridMultiplier' | 'ColumnAddition' | 'CalculusTangent' | 'VectorSpace';

export interface PolynomialRootFinderProps {
    initialRoot1?: number;
    initialRoot2?: number;
    onStateChange?: (state: Record<string, any>) => void;
}

export interface InteractiveUnitCircleProps {
    initialAngleDeg?: number;
    onStateChange?: (state: Record<string, any>) => void;
}

export interface InequalitiesVisualizerProps {
    initialSlope?: number;
    initialIntercept?: number;
    onStateChange?: (state: Record<string, any>) => void;
}

export interface VectorOperationsBoardProps {
    initialU?: [number, number];
    initialV?: [number, number];
    onStateChange?: (state: Record<string, any>) => void;
}

export interface MatrixDeformationBoardProps {
    initialMatrix?: [number, number, number, number];
    onStateChange?: (state: Record<string, any>) => void;
}

export interface LinearSpanExplorerProps {
    initialV1?: [number, number];
    initialV2?: [number, number];
    onStateChange?: (state: Record<string, any>) => void;
}

export interface EigenvectorVisualizerProps {
    initialVectorAngleDeg?: number;
    onStateChange?: (state: Record<string, any>) => void;
}

export interface IntersectingPlanes3DProps {
    initialK?: number;
    onStateChange?: (state: Record<string, any>) => void;
}

export interface DerivativeDefinitionBoardProps {
    initialH?: number;
    onStateChange?: (state: Record<string, any>) => void;
}

export interface CurveSketchingBoardProps {
    initialA?: number;
    onStateChange?: (state: Record<string, any>) => void;
}

export interface RiemannSumsVisualizerProps {
    initialN?: number;
    method?: 'left' | 'right' | 'middle';
    onStateChange?: (state: Record<string, any>) => void;
}

export interface TaylorSeriesApproximationProps {
    initialDegree?: number;
    centerPoint?: number;
    onStateChange?: (state: Record<string, any>) => void;
}

export interface BoardStateSnapshot {
    widgetType: AnyWidgetType;
    timestamp: number;
    data: Record<string, number | string | boolean>;
}
