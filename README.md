# SauceDemo QA Automation

Prueba técnica QA Engineer: automatización E2E del flujo de compra de [saucedemo.com](https://www.saucedemo.com/) con **Playwright + TypeScript** y **Page Object Model**, ejecutada en **Chrome y Edge**.

## Requisitos

- Node.js 20 o superior
- Google Chrome y Microsoft Edge instalados (Playwright los usa por `channel`, no descarga sus propios binarios de Chromium)

## Instalación

```bash
npm install
npx playwright install chrome msedge   # solo si alguno de los dos navegadores no está instalado
```

## Ejecutar

```bash
npm test          # los 3 casos en Chrome y Edge (6 ejecuciones) y genera el reporte HTML
npm run report    # abre el reporte HTML (playwright-report/)
```

| Comando | Descripción |
|---------|-------------|
| `npm test` | Regresión: TC-01, TC-02 y TC-03 en Chrome y Edge |
| `npm run verify` | `typecheck` + `lint` + `test`: lo que debe estar en verde antes de dar algo por terminado |
| `npm run lint` | Verifica las convenciones del proyecto (`scripts/check-conventions.mjs`) |
| `npm run typecheck` | Verifica tipos con TypeScript |
| `npm run test:headed` | Igual que `npm test`, con el navegador visible |
| `npm run test:fail` | Fallo **intencional**: genera trace, screenshot y video (ver [REPORTE.md](REPORTE.md)) |
| `npm run test:healing` | Banco de pruebas del agente healer: falla **a propósito** por un locator roto |
| `npx playwright test --grep @TC-02` | Un caso por su ID |

`test:fail` y `test:healing` terminan en rojo por diseño; no forman parte de la regresión y `npm test` no los ejecuta.

## Estructura

```
pages/              Page Objects: LoginPage, InventoryPage, CartPage, CheckoutPage
  BasePage.ts       Bases: BasePage (error) y SectionPage (título)
  components/       Fragmentos reutilizables: HeaderComponent, ProductCard
  sandbox/          Page Object con un locator roto a propósito (solo para el healer)
fixtures/           Fixtures que inyectan los Page Objects en los tests
data/               Datos de prueba
tests/              purchase.spec.ts (regresión), failure-demo, healing-sandbox y seed (demos)
scripts/            Verificador de convenciones
docs/evidence/      Captura del fallo intencional
.claude/            Skill add-test-case y agentes de Playwright (planner, generator, healer)
```

## Evidencia y reportes

- Trace, screenshot y video se conservan solo cuando un test falla (`retain-on-failure`).
- Reporte HTML: `playwright-report/` (se regenera con cada `npm test`; no se sube al repo).
- Captura de ejemplo del fallo intencional: [docs/evidence/failure-demo-chrome.png](docs/evidence/failure-demo-chrome.png).

## CI/CD (GitHub Actions)

Workflow: [.github/workflows/e2e.yml](.github/workflows/e2e.yml)

| Disparador | Cuándo | Evidencia |
|---|---|---|
| `schedule` | Todos los días 6:00 a. m. Colombia (cron `0 11 * * *`, en UTC) | Captura y video de **todos** los tests |
| `push` a `master` | Tras cada merge | Solo de los fallos |
| `workflow_dispatch` | Manual desde la pestaña Actions | A elección (`failures` o `full`) |

Cada ejecución: `typecheck` → `lint` → `npm test` (Chrome y Edge) → publica el reporte HTML en **GitHub Pages** (el último) y como **artifact** (30 días, uno por ejecución) → envía un **resumen gerencial a Teams**.

**Configuración única en GitHub:**

1. *Settings → Pages → Source: **GitHub Actions**.*
2. *Settings → Secrets and variables → Actions → New repository secret* `TEAMS_WEBHOOK_URL`.
   - En Teams: canal → ⋯ → **Workflows** → "Post to a channel when a webhook request is received" → copiar la URL.
   - Mientras no se configure el webhook real, el secret puede contener una URL falsa: el aviso falla con una advertencia y la ejecución no se marca como fallida.

Probar el resumen en local: `npm test && npm run notify:teams:dry` (imprime la tarjeta sin enviar nada). Los cron de GitHub se desactivan tras 60 días sin actividad en un repo público.

## Documentación de la prueba

- [TEST_MATRIX.md](TEST_MATRIX.md): matriz de casos de prueba
- [PROMPTS.md](PROMPTS.md): bitácora de prompts a la IA
- [REPORTE.md](REPORTE.md): reporte final con diagnóstico de fallo asistido por IA
- [CLAUDE.md](CLAUDE.md): convenciones del proyecto y reglas de los agentes

## Agentes de IA (opcional)

`.claude/agents/` contiene los agentes de Playwright (`init-agents`) con restricciones de proyecto; el healer solo puede corregir locators dentro de `pages/`. Requieren Claude Code y aprobar el servidor MCP de `.mcp.json` (definido para Windows; en macOS/Linux quitar `cmd /c`). Detalle en [CLAUDE.md](CLAUDE.md).
