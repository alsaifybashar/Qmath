/**
 * Central template registry.
 * Import `getTemplate`, `allTemplates`, `TEMPLATE_IDS` anywhere in the app.
 */
import { JSXTemplateDef } from './types';
import { functionTemplates } from './functions';
import { calculusTemplates } from './calculus';
import { seriesTemplates } from './series';
import { analysisTemplates } from './analysis';
import { threeDTemplates } from './3d';

export { JSXTemplateDef } from './types';

/** Every registered template in one flat list. */
export const allTemplates: JSXTemplateDef[] = [
    ...functionTemplates,
    ...calculusTemplates,
    ...seriesTemplates,
    ...analysisTemplates,
    ...threeDTemplates,
];

/** Quick lookup map by id. */
const registry = new Map<string, JSXTemplateDef>(
    allTemplates.map(t => [t.id, t])
);

/** Returns the template definition for a given id, or undefined. */
export function getTemplate(id: string): JSXTemplateDef | undefined {
    return registry.get(id);
}

/** The full list of template IDs (used to build the AI tool enum). */
export const TEMPLATE_IDS = allTemplates.map(t => t.id);

/** IDs grouped by category — useful for system-prompt generation. */
export function getTemplatesByCategory() {
    const map = new Map<string, JSXTemplateDef[]>();
    for (const t of allTemplates) {
        if (!map.has(t.category)) map.set(t.category, []);
        map.get(t.category)!.push(t);
    }
    return map;
}
