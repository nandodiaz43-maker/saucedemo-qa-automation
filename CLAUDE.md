# Convenciones del proyecto

Automatización E2E de https://www.saucedemo.com/ con Playwright + TypeScript y Page Object Model.

## Comandos

- `npm test`: regresión (TC-01..03 en Chrome y Edge). Los tests de demostración (`@failure-demo`, `@healing-sandbox`, `@seed`) quedan excluidos por la config salvo que exista `PW_DEMOS=1`, así que `npx playwright test` a secas también es seguro.
- `npm run verify`: `typecheck` + `lint` + `test`. Es lo que hay que ver en verde antes de dar algo por terminado.
- `npm run lint`: `scripts/check-conventions.mjs` (locators fuera del POM, `waitForTimeout`, `.only`/`.skip`, credenciales incrustadas, ID/tag por test). No es ESLint: `typescript-eslint` aún no soporta TypeScript 7.
- `npx playwright test --grep @TC-02`: un caso por su ID
- `npm run notify:teams:dry`: imprime la tarjeta de Teams con los últimos `reports/results.json`, sin enviar. `npm run notify:teams` envía a `TEAMS_WEBHOOK_URL`.
- `PW_EVIDENCE=full`: guarda captura y video de todos los tests (lo usa la ejecución diaria de CI); por defecto solo de los fallos.
- `npm run test:fail`: fallo intencional para la demo de diagnóstico (no es una regresión)
- `npm run test:healing`: banco de pruebas del healer (falla a propósito; no es una regresión)

## Estructura

- `pages/`: Page Objects. `BasePage` (error) y `SectionPage` (título) son las bases.
- `pages/components/`: fragmentos reutilizables entre pantallas (`HeaderComponent`, `ProductCard`).
- `pages/sandbox/`: Page Object con un locator roto a propósito, solo para el healer.
- `fixtures/pages.ts`: inyecta los page objects en los tests. Todo Page Object nuevo se registra aquí.
- `data/testData.ts`: usuarios, productos y datos de checkout. Sin datos incrustados en los tests.
- `tests/`: specs. Los tests solo orquestan métodos del POM.
- `scripts/`: utilidades de proyecto (`check-conventions.mjs`, `teams-summary.mjs`).
- `.github/workflows/e2e.yml`: pipeline (diario 6:00 a. m. Colombia, push a master, manual). `TEAMS_WEBHOOK_URL` es un secret: nunca se escribe en el repo ni en logs.
- `docs/evidence/`: evidencia estática del fallo intencional (captura).

## Reglas

1. **Selectores, en este orden:** `getByRole` > `getByPlaceholder` > `getByText` > `getByTestId` (el atributo es `data-test`, ya configurado) > CSS. XPath no se usa. Para un producto se usa su nombre **exacto** (`ProductCard`), no una subcadena.
2. **Los locators viven solo en el POM.** Un test nunca llama a `page.getByX` ni `page.locator`. Si un elemento aparece en varias pantallas, va a un componente. (`npm run lint` lo comprueba.)
3. **Las aserciones van en métodos `expectXxx` del POM.** En el test se permite `expect` solo para el estado de la página (por ejemplo la URL).
4. **Sin `waitForTimeout` ni sleeps.** Se confía en el auto-wait y en las aserciones web-first.
5. **Cada test lleva el ID de `TEST_MATRIX.md` como tag** (`{ tag: '@TC-XX' }`) y el ID también en el título.
6. **Los datos van en `data/`.** Credenciales y valores de checkout no se repiten en los specs.
7. Los tests `@failure-demo` y `@healing-sandbox` fallan deliberadamente. No se corrigen, no entran en `npm test` y no se ejecutan en CI como regresión.
8. **Los mensajes de error de SauceDemo llevan el prefijo `Epic sadface:`** en el login. Las aserciones usan `toContainText` con la parte estable del mensaje.

## Agentes de Playwright (`.claude/agents/`)

Generados con `npx playwright init-agents --loop claude`. **El healer y el generator tienen restricciones de proyecto añadidas** (sección "Project restrictions"); si se regeneran con `init-agents` se pierden y hay que volver a aplicarlas.

- **healer**: solo edita **locators dentro de `pages/`**. Nunca cambia aserciones, textos, URLs ni valores esperados, ni usa `test.fixme` / `test.skip` / más timeout. Un fallo de aserción es un posible bug de la aplicación: se reporta, no se cura. Solo cura fallos de locator (TimeoutError esperando un elemento que en el snapshot sigue existiendo con otro nombre o estructura). Tiene solo `Edit` (sin `Write`/`MultiEdit`) y no tiene shell: un humano ejecuta `npm run verify` y revisa `git diff`. Se prueba con `tests/healing-sandbox.spec.ts`, nunca con `failure-demo` ni `purchase`.
- **generator**: produce borradores; hay que integrarlos al POM y a las convenciones (skill `add-test-case`) antes de aceptarlos.
- **planner**: sin restricciones añadidas. No tiene herramientas para editar código (su única escritura es `planner_save_plan`), así que no puede tocar `pages/` ni `tests/`.
- `.mcp.json` define el servidor MCP `playwright-test` y le pasa `PW_DEMOS=1` para que los agentes vean los tests de demostración. El comando usa `cmd /c npx`, válido en Windows; en macOS/Linux sería `npx playwright run-test-mcp-server` sin `cmd`.

## Al terminar cualquier cambio

Ejecutar `npm run verify`. No dar el trabajo por hecho sin verlo en verde.

## Documentación que hay que mantener

- Nuevo caso: agregarlo a `TEST_MATRIX.md`.
- Cada prompt real usado con la IA: registrarlo en `PROMPTS.md`, tal como se envió y sin reconstruirlo. Si algo se reconstruye, se dice explícitamente.
