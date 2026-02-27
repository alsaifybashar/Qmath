# Interactive Learning: Core Templates Reference

This document serves as the technical reference for the 12 core curriculum `JSXGraphBoard` wrappers built for Qmath. All components reside under `components/interactive/templates/`.

## Architecture Overview

Each template adheres to a unified initialization pattern, leveraging the `useGraphStream` WebSocket and the generic `JSXGraphBoard` bounding layer.
- **State Coupling**: State (`y > 2x`, `Score`, etc.) is maintained in React using robust `useState` blocks.
- **Geometry Sync**: Event listeners (`point.on('drag')`) translate raw JSXGraph internal Cartesian coordinates into formatted React-readable props or `useGraphStream` dispatches.
- **Rendering Layer**: We use arbitrary rendering boxes (e.g. `boundingbox: [-5, 5, 5, -5]`) customized per component's scale necessity.

## Available Modules

### Prerequisites
- **`PolynomialRootFinder`**: Implements 2 `glider` elements strictly constrained to the x-axis, representing $r_1$ and $r_2$. Real-time equation rendering.
- **`InteractiveUnitCircle`**: Displays $sin(\theta)$ wrapped against time/angle displacement horizontally starting at $x = 1.5$.
- **`InequalitiesVisualizer`**: Renders `JSXGraph.inequality` elements with a shaded `.2` opacity layer dependent on the line connecting Point A and B.

### Linear Algebra (TATA24)
- **`VectorOperationsBoard`**: Adds geometric dot-product monitoring utilizing origin-bound `arrow` shapes. Parallelogram rendering maps transparent lines to Cartesian sums.
- **`MatrixDeformationBoard`**: Tracks a custom polygonal boundary stretched relative to $(X,Y)$ positions of $i$ and $j$ vector representations. Calculates $|A|$.
- **`LinearSpanExplorer`**: Assesses matrix dependencies (i.e. rank) by computing the determinant of mapping combinations, dynamically rendering an infinite yellow plane if $Span(S) = \mathbb{R}^2$.
- **`EigenvectorVisualizer`**: Uses a fixed underlying $2 \times 2$ matrix to continuously map $f(x)$ against dragged vector $x$. Matches directionality tolerance using cross-products.
- **`IntersectingPlanes3D`**: Implements `JSXGraph.view3d`. An interactive 1D glider element maps the scale of $k$ moving the relative $z$-plane.

### Single-Variable Calculus
- **`DerivativeDefinitionBoard`**: Interactive secant limits. Calculates and limits $h$ to minimum increments to prevent strict division-by-zero bounds during rendering.
- **`CurveSketchingBoard`**: Stacks multiple graph representations overlaying $f$, $f'$, and $f''$ alongside a vertical tracking line scanner mapping intersections.
- **`RiemannSumsVisualizer`**: A functional application demonstrating Riemann integration via midpoint limits modified by a discrete variable integer slider.
- **`TaylorSeriesApproximation`**: Dynamically rebuilds polynomial representations resolving $n$-degree $Math.sin()$ derivatives using factorial mathematics logic bound to UX sliders.

---

### Integration Guide

To deploy these within the broader application contexts (like custom question setups), import them directly within the `InteractiveWidgetWrapper`. You can optionally bind `streamState` directly inside the component scope over to an API payload instead of local-only display components.
