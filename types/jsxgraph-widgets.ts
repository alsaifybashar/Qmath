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

export type AnyWidgetType = JSXGraphWidgetType | 'GridMultiplier' | 'ColumnAddition' | 'CalculusTangent' | 'VectorSpace';

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
