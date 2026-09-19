// Verifica reglas de CLAUDE.md que son fáciles de romper y baratas de comprobar.
// Sin dependencias: typescript-eslint aún no es compatible con TypeScript 7.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Archivos de demostración: rompen las reglas a propósito.
const EXEMPT = new Set(['failure-demo.spec.ts', 'healing-sandbox.spec.ts', 'seed.spec.ts']);

const RULES = [
  {
    id: 'no-raw-locators-in-tests',
    pattern: /\bpage\s*\.\s*(getBy\w+|locator|frameLocator)\s*\(/,
    message: 'Los locators viven en pages/. Un test no llama a page.getByX ni page.locator (CLAUDE.md regla 2).',
  },
  {
    id: 'no-fixed-waits',
    pattern: /\bwaitForTimeout\s*\(|\bnetworkidle\b/,
    message: 'Sin waitForTimeout ni networkidle: usa auto-wait y aserciones web-first (regla 4).',
  },
  {
    id: 'no-focused-or-skipped',
    pattern: /\b(test|describe)\s*\.\s*(only|skip|fixme)\b/,
    message: 'No se dejan tests con .only, .skip ni .fixme.',
  },
  {
    id: 'no-xpath',
    pattern: /xpath=|\/\/\*\[|locator\(\s*['"`]\/\//,
    message: 'XPath no se usa (regla 1).',
  },
  {
    id: 'no-hardcoded-credentials',
    pattern: /['"`](secret_sauce|standard_user|locked_out_user)['"`]/,
    message: 'Las credenciales van en data/testData.ts, no en los specs (regla 6).',
  },
];

const failures = [];

const specs = readdirSync('tests').filter((f) => f.endsWith('.spec.ts') && !EXEMPT.has(f));
for (const file of specs) {
  const lines = readFileSync(join('tests', file), 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) failures.push(`tests/${file}:${i + 1} [${rule.id}] ${rule.message}`);
    }
  });

  // Regla 5: cada test lleva un tag @TC-XX.
  const source = lines.join('\n');
  const tests = [...source.matchAll(/\btest\s*\(\s*['"`]([^'"`]+)['"`]/g)];
  for (const [, title] of tests) {
    const id = title.match(/^(TC-\d+)\b/)?.[1];
    if (!id) failures.push(`tests/${file} [tc-id-in-title] "${title}" debe empezar con su ID TC-XX (regla 5).`);
    else if (!source.includes(`'@${id}'`)) failures.push(`tests/${file} [tc-tag] falta { tag: '@${id}' } para "${title}" (regla 5).`);
  }
}

if (failures.length > 0) {
  console.error(`check-conventions: ${failures.length} problema(s)\n` + failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}
console.log(`check-conventions: OK (${specs.length} spec(s) revisados)`);
