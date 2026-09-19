import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

// Los tests de demostración (fallo intencional, banco del healer y semilla de los agentes)
// quedan fuera por defecto para que `npx playwright test` sea siempre la regresión limpia.
// Se activan con PW_DEMOS=1 (lo hacen los scripts test:fail y test:healing, y .mcp.json).
const DEMO_TAGS = /@failure-demo|@healing-sandbox|@seed/;
const includeDemos = !!process.env.PW_DEMOS;
const fullEvidence = process.env.PW_EVIDENCE === 'full';

export default defineConfig({
  testDir: './tests',
  grepInvert: includeDemos ? undefined : DEMO_TAGS,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    isCI ? ['github'] : ['list'],
    ['html', { open: 'never' }],
    // Fuente del resumen gerencial que se envía a Teams (scripts/teams-summary.mjs).
    ['json', { outputFile: 'reports/results.json' }],
  ],
  use: {
    baseURL: 'https://www.saucedemo.com',
    // SauceDemo usa el atributo data-test en lugar de data-testid.
    testIdAttribute: 'data-test',
    actionTimeout: 10_000,
    // Medido: ~1 de cada 8 navegaciones a saucedemo.com tarda ~20 s en responder desde Chrome en Windows
    // (ocurre ya en domcontentloaded, no es un recurso de terceros). Con 20 s esa lentitud fallaba el test.
    navigationTimeout: 45_000,
    trace: 'retain-on-failure',
    // Perfil de evidencia: 'full' (ejecución diaria) guarda captura y video de TODOS los tests;
    // por defecto solo se conservan cuando un test falla.
    screenshot: fullEvidence ? 'on' : 'only-on-failure',
    video: fullEvidence ? 'on' : 'retain-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1920, height: 1080 } },
    },
  ],
});
