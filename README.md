# SauceDemo QA Automation

Prueba técnica QA Engineer: automatización E2E del flujo de compra de [saucedemo.com](https://www.saucedemo.com/) con **Playwright + TypeScript** y **Page Object Model**.

## Requisitos

- Node.js 20 o superior

## Instalación

```bash
npm install
npx playwright install chrome msedge
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm test` | Ejecuta los 3 casos (TC-01, TC-02, TC-03) en Chrome y Edge y genera el reporte HTML |
| `npm run test:headed` | Igual, con el navegador visible |
| `npm run test:fail` | Ejecuta el fallo intencional (genera trace, screenshot y video) |
| `npm run test:healing` | Ejecuta el sandbox del healer (falla a propósito por un locator roto) |
| `npm run report` | Abre el reporte HTML de Playwright |
| `npm run typecheck` | Verifica tipos con TypeScript |

## Estructura

```
pages/       Page Objects: LoginPage, InventoryPage, CartPage, CheckoutPage
fixtures/    Fixtures que inyectan los page objects en los tests
data/        Datos de prueba
tests/       purchase.spec.ts (casos E2E) y failure-demo.spec.ts (fallo forzado)
```

## Documentación de la prueba

- [TEST_MATRIX.md](TEST_MATRIX.md): matriz de casos de prueba
- [PROMPTS.md](PROMPTS.md): bitácora de prompts a la IA
- [REPORTE.md](REPORTE.md): reporte final con diagnóstico de fallo asistido por IA
