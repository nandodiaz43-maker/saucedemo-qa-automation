# Convenciones del proyecto

Automatización E2E de https://www.saucedemo.com/ con Playwright + TypeScript y Page Object Model.

## Comandos

- `npm test`: suite completa, excluye `@failure-demo`
- `npm run typecheck`: verificación de tipos (debe quedar sin errores)
- `npx playwright test --grep @TC-02`: un caso por su ID
- `npm run test:fail`: fallo intencional para la demo de diagnóstico (no es una regresión)
- `npm run test:healing`: banco de pruebas del healer (falla a propósito; no es una regresión)

## Estructura

- `pages/`: Page Objects. `BasePage` (error) y `SectionPage` (título) son las bases.
- `pages/components/`: fragmentos reutilizables entre pantallas (`HeaderComponent`, `ProductCard`).
- `fixtures/pages.ts`: inyecta los page objects en los tests. Todo Page Object nuevo se registra aquí.
- `data/testData.ts`: usuarios, productos y datos de checkout. Sin datos incrustados en los tests.
- `tests/`: specs. Los tests solo orquestan métodos del POM.

## Reglas

1. **Selectores, en este orden:** `getByRole` > `getByPlaceholder` > `getByText` > `getByTestId` (el atributo es `data-test`, ya configurado) > CSS. XPath no se usa.
2. **Los locators viven solo en el POM.** Un test nunca llama a `page.getByX` ni `page.locator`. Si un elemento aparece en varias pantallas, va a un componente.
3. **Las aserciones van en métodos `expectXxx` del POM.** En el test se permite `expect` solo para el estado de la página (por ejemplo la URL).
4. **Sin `waitForTimeout` ni sleeps.** Se confía en el auto-wait y en las aserciones web-first.
5. **Cada test lleva el ID de `TEST_MATRIX.md` como tag** (`{ tag: '@TC-XX' }`) y el ID también en el título.
6. **Los datos van en `data/`.** Credenciales y valores de checkout no se repiten en los specs.
7. El test `@failure-demo` es un fallo deliberado. No se corrige, no entra en `npm test` y no se ejecuta en CI como regresión.

## Healing (agente `playwright-test-healer`)

Definido en `.claude/agents/playwright-test-healer.md`. Sus restricciones están también en el propio agente. Si se regenera con `npx playwright init-agents`, hay que volver a aplicarlas.

- Solo puede modificar **locators dentro de `pages/`**.
- **Nunca** cambia aserciones, textos, URLs ni valores esperados, ni usa `test.fixme` / `test.skip` / más timeout. Un fallo de aserción es un posible bug de la aplicación: se reporta, no se cura.
- Solo cura fallos de locator (TimeoutError esperando un elemento que en el snapshot sigue existiendo con otro nombre o estructura).
- Todo cambio del healer se revisa con `git diff` antes de aceptarlo.
- Para probarlo se usa `tests/healing-sandbox.spec.ts` (`npm run test:healing`), nunca `failure-demo` ni `purchase`.

## Al terminar cualquier cambio

Ejecutar `npm run typecheck` y `npm test`. No dar el trabajo por hecho sin ver ambos en verde.

## Documentación que hay que mantener

- Nuevo caso: agregarlo a `TEST_MATRIX.md`.
- Cada prompt real usado con la IA: registrarlo en `PROMPTS.md`, tal como se envió y sin reconstruirlo.
