export type TemplateCategory =
    | 'Functions'
    | 'Calculus'
    | 'Series'
    | 'Analysis'
    | '3D'
    | 'Statistics'
    | 'Physics'
    | 'Geometry';

export interface JSXTemplateConfig {
    [key: string]: any;
}

export interface JSXTemplateDef {
    id: string;
    name: string;
    category: TemplateCategory;
    /** Keywords the AI uses to pick the right template. */
    tags: string[];
    /** One-line description shown in the AI tool schema. */
    description: string;
    defaultConfig: JSXTemplateConfig;
    /** Called once when JSXGraph is ready. Must return the JXG board. */
    init: (JXG: any, boardId: string, config: JSXTemplateConfig) => any;
}
