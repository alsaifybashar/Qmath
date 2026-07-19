import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOTS = ['app', 'components', 'lib'];
const FILES = ['auth.ts', 'auth.config.ts', 'proxy.ts'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
const RULES = [
    { name: 'dynamic code execution', pattern: /\b(?:eval|Function)\s*\(/ },
    { name: 'React raw HTML injection', pattern: /dangerouslySetInnerHTML\s*=/ },
    { name: 'unrestricted mathjs evaluator', pattern: /\bmath\.(?:evaluate|compile)\s*\(/ },
    { name: 'client-controlled identity cookie', pattern: /cookies?[^\n]{0,120}user_id/i },
    { name: 'new bcrypt password hash', pattern: /\bbcrypt\.(?:hash|hashSync)\s*\(/ },
];

function collect(directory) {
    const files = [];
    for (const entry of readdirSync(directory)) {
        const file = join(directory, entry);
        const stat = statSync(file);
        if (stat.isDirectory()) files.push(...collect(file));
        else if (EXTENSIONS.has(extname(file)) && !file.includes('.test.')) files.push(file);
    }
    return files;
}

const findings = [];
for (const file of [...FILES, ...ROOTS.flatMap(collect)]) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
        if (line.trimStart().startsWith('//')) return;
        for (const rule of RULES) {
            if (rule.pattern.test(line)) findings.push(`${file}:${index + 1}: ${rule.name}`);
        }
    });
}

if (findings.length > 0) {
    console.error(findings.join('\n'));
    process.exitCode = 1;
} else {
    console.log('Security static checks passed.');
}
