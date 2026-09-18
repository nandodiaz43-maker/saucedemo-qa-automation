# Bitácora de prompts

Herramienta de IA utilizada: **Claude (Claude Code, modelo Claude Sonnet 5)**.

> **Nota de transparencia.** El único prompt enviado literalmente a la IA fue el enunciado de la prueba (sección 0); con él Claude Code generó la matriz, el código, la configuración y el diagnóstico en una sola sesión. Los prompts de las secciones 1 a 4 son la **formulación equivalente** de cada fase (reconstruida después), para que cada paso sea reproducible con cualquier asistente. No se enviaron de forma separada.

---

## 0. Prompt real enviado

```
Quiero que crees la siguiente prueba técnica, crees y descargues todas las dependencias, pruebes:
Prueba Técnica QA Engineer — Playwright + TypeScript + Node.js. AUT: https://www.saucedemo.com/
1. Generación de casos de prueba asistida por IA: matriz para el flujo de compra E2E con
   1 Happy Path (Login -> Agregar producto -> Checkout -> Confirmación) y 2 casos de error/límite
   (carrito vacío, credenciales inválidas o datos incompletos en checkout). Documentar los prompts en PROMPTS.md.
2. Automatización con Playwright & POM (LoginPage, InventoryPage, CartPage, CheckoutPage) de los 3 casos,
   priorizando selectores getByRole, getByText, etc.
3. Diagnóstico de fallos con IA: trace 'retain-on-failure' y screenshots; modificar un selector para forzar un fallo;
   pasar el log a una IA para diagnosticar la causa raíz; incluir respuesta y análisis en el reporte final.
Entregables: repo con código ejecutable (npm test), estructura POM, PROMPTS.md y reporte HTML de Playwright.
```

---

## 1. Generación de la matriz de casos de prueba

**Prompt**

```
Actúa como QA Engineer senior. La aplicación bajo prueba es https://www.saucedemo.com/.
Genera una matriz de casos de prueba para el flujo de compra E2E con esta estructura:
ID, tipo, título, precondiciones, pasos, resultado esperado y prioridad.
Debe incluir:
- 1 caso "Happy Path": Login -> Agregar producto -> Checkout -> Confirmación.
- 2 casos con escenarios límite o de error (por ejemplo carrito vacío, credenciales
  inválidas o datos incompletos en el checkout).
Usa los datos públicos de la página (standard_user / secret_sauce). Indica los mensajes de
error exactos que muestra la aplicación y señala cualquier comportamiento inesperado.
```

**Resultado**: la matriz de [TEST_MATRIX.md](TEST_MATRIX.md). Se seleccionaron TC-01 (happy path), TC-02 (credenciales inválidas) y TC-03 (checkout con datos incompletos). Se descartó automatizar "carrito vacío" porque SauceDemo permite hacer checkout con el carrito vacío (se documenta como observación).

---

## 2. Boilerplate POM y selectores

**Prompt**

```
Crea un proyecto Playwright con TypeScript aplicando Page Object Model para LoginPage,
InventoryPage, CartPage y CheckoutPage en saucedemo.com.
Reglas:
- Prioriza getByRole, getByPlaceholder, getByText y getByTestId sobre CSS/XPath.
- SauceDemo usa el atributo data-test, no data-testid: configura testIdAttribute.
- Los page objects exponen locators y acciones de negocio (login, addToCart, checkout...);
  las aserciones van en métodos expectXxx, no en los tests.
- Inyecta los page objects mediante fixtures de Playwright.
- Automatiza TC-01, TC-02 y TC-03 de la matriz.
```

**Resultado**: carpetas `pages/`, `fixtures/`, `data/` y `tests/purchase.spec.ts`. Los selectores se validaron ejecutando la suite contra la aplicación real (3/3 en verde).

---

## 3. Configuración de trazas y screenshots

**Prompt**

```
Configura playwright.config.ts con trace: 'retain-on-failure', screenshot: 'only-on-failure',
video: 'retain-on-failure' y reporter HTML (open: 'never').
Crea un test aparte con un selector incorrecto a propósito (@failure-demo) que quede fuera de
`npm test` y se ejecute con un script distinto.
```

**Resultado**: [playwright.config.ts](playwright.config.ts) y [tests/failure-demo.spec.ts](tests/failure-demo.spec.ts).

---

## 4. Diagnóstico del fallo forzado

**Prompt** (se pegó el log real de `npm run test:fail` junto con el snapshot de página de `error-context.md`)

```
Explica por qué falló este test de Playwright, sé conciso y respeta las buenas prácticas de
Playwright. Da un snippet con la corrección.

TimeoutError: locator.click: Timeout 5000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Log in' })

  13 |   await page.getByRole('button', { name: 'Log in' }).click({ timeout: 5_000 });

Page snapshot:
- form "Login":
  - textbox "Username": standard_user
  - textbox "Password": secret_sauce
  - button "Login"
```

**Respuesta de la IA y análisis**: ver [REPORTE.md](REPORTE.md).

---

# Fases de mejora

En estas fases cada prompt es el aprobado por el usuario en la sesión (propuesto por la IA, confirmado con "ok") y se ejecutó tal cual.

## Fase 1. Refactor POM (sin cambiar el comportamiento)

**Prompt**

```
Refactoriza los Page Objects de este proyecto Playwright para eliminar locators duplicados:
crea un BasePage (title, errorMessage) y componentes HeaderComponent (carrito y badge)
y ProductCard. Mantén las aserciones en métodos expectXxx dentro del POM.
Criterio de aceptación: npm run typecheck sin errores y npm test con 3/3 en verde.
```

**Resultado**: `pages/BasePage.ts`, `pages/components/HeaderComponent.ts` y `pages/components/ProductCard.ts`. `typecheck` sin errores y `npm test` 3/3 en verde. Los tests no se modificaron.

**Desviación respecto al prompt**: `title` no está en `BasePage` sino en `SectionPage` (que extiende `BasePage`). La pantalla de login no tiene título, y exponerlo allí sería un locator que nunca existe. `BasePage` conserva `errorMessage`.

---

## Fase 2. Convenciones reutilizables y trazabilidad

**Prompt**

```
Crea un CLAUDE.md y un skill de proyecto "add-test-case" con las convenciones: prioridad de
selectores (getByRole > getByPlaceholder > getByText > getByTestId), aserciones en el POM,
datos en data/, y que cada caso lleve su ID de TEST_MATRIX.md como tag (@TC-XX).
Añade los tags @TC-01..03 a los tests actuales.
Criterio: npx playwright test --grep @TC-02 ejecuta solo ese caso.
```

**Resultado**: `CLAUDE.md`, `.claude/skills/add-test-case/SKILL.md` y `{ tag: '@TC-XX' }` en los 3 tests. `--grep @TC-02` ejecuta 1 test y `npm test` sigue en 3/3.

**Ampliación respecto al prompt**: el `CLAUDE.md` incluye reglas adicionales que no estaban en el prompt (sin `waitForTimeout`, locators solo en el POM, el fallo `@failure-demo` no se corrige) y el skill agrega el paso de verificar el comportamiento real de la aplicación antes de escribir aserciones.

---

## Fase 3. Chrome y Edge

**Prompt**

```
Configura playwright.config.ts con dos projects: "chrome" (channel: 'chrome') y "edge"
(channel: 'msedge'), ambos Desktop. Ejecuta la suite en los dos.
Criterio: 6 tests en verde (3 casos x 2 navegadores) y el reporte los distingue por project.
```

**Resultado**: projects `chrome` y `edge` con viewport 1920x1080. `npm test` ejecuta 6 tests en verde (3 casos x 2 navegadores). El proyecto `chromium` se reemplazó por estos dos.

**Decisión no incluida en el prompt**: se fijó la resolución en 1920x1080 (propuesta en la sesión; las resoluciones adicionales quedan pendientes de decidir).

---

## Fase 7a. Healer local con límites

**Prompt**

```
Ejecuta npx playwright init-agents --loop claude. Añade a CLAUDE.md una sección "Healing":
el healer solo puede modificar locators en pages/; NO puede cambiar aserciones, URLs esperadas,
textos esperados ni marcar tests con test.fixme; si el fallo es de aserción, debe reportarlo
y no corregirlo. Crea tests/healing-sandbox.spec.ts con un selector roto (getByRole 'Log in')
y comprueba que el healer lo corrige en LoginPage sin tocar aserciones.
Criterio: el sandbox pasa tras el healer y git diff solo muestra cambios en pages/.
```

**Resultado (parcial)**: se generaron los agentes (`.claude/agents/`), `.mcp.json`, `specs/` y `tests/seed.spec.ts`. Sección "Healing" en `CLAUDE.md`. `tests/healing-sandbox.spec.ts` falla como se esperaba (`waiting for getByRole('button', { name: 'Log in' })`). `npm test` sigue en 6/6.

**Desviaciones respecto al prompt**:
- Las restricciones se escribieron también **dentro del agente** (`playwright-test-healer.md`), porque el prompt que trae por defecto le pide "corregir aserciones" y usar `test.fixme`, y un texto en `CLAUDE.md` no lo anula. Se reemplazaron esas tres instrucciones.
- El locator roto está en `pages/sandbox/SandboxLoginPage.ts` y no en `LoginPage`, porque romper `LoginPage` rompería la suite real.
- `seed.spec.ts` se etiquetó `@seed` y, junto con `@healing-sandbox`, se excluyó de `npm test`; el seed generado era un test vacío que habría contado como pase.

**Pendiente**: el criterio "el sandbox pasa tras el healer" **no se ha verificado**. Los agentes de `.claude/agents/` y el servidor MCP no están disponibles en la sesión en la que se crearon; hay que reiniciar Claude Code, aprobar el servidor `playwright-test` de `.mcp.json` e invocar el healer. Al hacerlo, registrar aquí el diff obtenido.
