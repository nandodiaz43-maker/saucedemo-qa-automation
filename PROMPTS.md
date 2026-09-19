# Bitácora de prompts

Herramienta de IA utilizada: **Claude (Claude Code, modelo Claude Sonnet 5)**.

> **Nota de transparencia.**
> - El único prompt de la fase inicial fue el enunciado de la prueba (sección 0, transcrito de forma condensada: el mensaje original incluía además el texto completo del enunciado). Con él Claude Code generó la matriz, el código, la configuración y el diagnóstico en una sola sesión.
> - Los prompts de las secciones 1 a 4 son la **formulación equivalente** de cada fase, **reconstruida después** para que cada paso sea reproducible con cualquier asistente. **No se enviaron de forma separada.**
> - Desde "Fases de mejora" los prompts sí son los aprobados en la sesión; donde la ejecución se desvió de ellos, se indica.
> - Las consultas de diseño y la revisión final hechas en la conversación se recogen al final, en "Guía de prompts profesionales", como **versiones profesionales equivalentes**: los mensajes originales fueron coloquiales y no se transcriben.

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

**Prompt** (reconstruido: el log y el snapshot son reales, salen de `npm run test:fail` y de `error-context.md`, pero el diagnóstico no se pidió en una conversación aparte; lo produjo Claude Code en la misma sesión al leer esos artefactos)

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

En estas fases cada prompt es el propuesto por la IA y aprobado por el usuario en la sesión (confirmado con "ok"). Se ejecutó con las desviaciones que se indican en cada fase. La numeración sigue el plan aprobado, no el orden de ejecución: las fases 4, 5 y 6 (workflow de GitHub Actions, evidencia con Pages y resumen en Teams) se ejecutaron **después** de la 7a.

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

### Fase 7a. Resultado real de la ejecución del healer

Tras reiniciar Claude Code (los agentes y el servidor MCP `playwright-test` se cargan al arrancar), se invocó el agente `playwright-test-healer` con este prompt, tal como se envió:

```
Corrige tests/healing-sandbox.spec.ts. Ejecútalo con el proyecto "chrome" (npm run test:healing
equivale a: playwright test --grep @healing-sandbox --project=chrome). Respeta las restricciones
de proyecto de tu definición y de CLAUDE.md: solo puedes modificar locators dentro de pages/.
Termina con tu reporte HEALED / NOT HEALED.
```

**Reporte del agente**: `HEALED`. `TimeoutError` en `loginButton.click()`; el snapshot mostraba el botón con el mismo rol y propósito pero con nombre accesible "Login". Fallo de locator, no de aserción.

**Diff real** (`git diff`, verificado por separado, no solo por el informe del agente):

```diff
--- a/pages/sandbox/SandboxLoginPage.ts
+++ b/pages/sandbox/SandboxLoginPage.ts
-    this.loginButton = page.getByRole('button', { name: 'Log in' });
+    this.loginButton = page.getByRole('button', { name: 'Login' });
```

**Verificación**: `git status` mostró un único archivo modificado, dentro de `pages/`. La aserción del test y `tests/` quedaron intactos. `npm run typecheck` sin errores, `npm run test:healing` 1 passed, `npm test` 6 passed.

**Limitación observada**: el agente no dispone de shell, así que no pudo ejecutar `typecheck` ni `npm test` (lo que `CLAUDE.md` pide al terminar); se ejecutaron manualmente. Esto se debe considerar en el paso de CI (Fase 7b).

**Estado del sandbox**: tras registrar el resultado se restauró `SandboxLoginPage.ts` a su versión rota (`git checkout`) para que `npm run test:healing` siga siendo una demo repetible.

---

## Fase 4. Workflow de GitHub Actions

**Prompt** (el aprobado en la sesión; la instrucción de zona horaria y disparadores la dio el usuario antes)

```
Crea .github/workflows/e2e.yml con triggers: push a master, schedule (cron '0 11 * * *',
6:00 a. m. Colombia) y workflow_dispatch. Pasos: checkout, setup-node, npm ci, instalar chrome
y msedge con dependencias, npm test, subir playwright-report como artifact (if: always()).
Excluye @failure-demo.
Criterio: el workflow pasa en verde tras un push de prueba.
```

**Resultado (parcial)**: workflow creado y validado contra el esquema de GitHub Actions (`@action-validator/cli`). **El criterio (pasa en verde en GitHub) no se ha verificado todavía**: requiere subir el código.

**Desviaciones**: `typecheck` y `lint` como pasos separados antes de `npm test`; `concurrency` para que dos ejecuciones se encolen sin cancelarse; artifacts adicionales (resultados JSON y trazas/videos); versiones de las actions consultadas en el momento (checkout v7, setup-node v7, upload-artifact v7, download-artifact v8, upload-pages-artifact v5, deploy-pages v5) en vez de fijarlas de memoria. `@failure-demo` queda excluido por la config, no por el workflow.

---

## Fase 5. Evidencia y GitHub Pages

**Prompt**

```
Usa dos perfiles de evidencia: en el run diario screenshot y video 'on'; en push a master solo
retain-on-failure. Publica playwright-report en GitHub Pages con actions/deploy-pages
(fuente: GitHub Actions).
Criterio: el reporte abre por URL pública con imágenes y video.
```

**Resultado (parcial)**: perfil de evidencia por variable de entorno `PW_EVIDENCE=full` (la fija el workflow en la ejecución diaria o manual con `full`); jobs `deploy` (Pages) y artifact del reporte. **Sin verificar en GitHub**: Pages aún no está habilitado en el repo y el criterio "abre por URL pública" depende de la primera ejecución.

**Desviación**: además de Pages (solo guarda el último reporte), se conserva el reporte como artifact por ejecución 30 días.

---

## Fase 6. Resumen gerencial a Teams (URL de prueba)

**Prompt** (el aprobado; el usuario pidió dejar una URL falsa para probar)

```
Añade el reporter 'json' de Playwright y un script que genere un resumen gerencial:
estado global, casos pasados/fallidos por navegador, duración, disparador (diario o merge),
commit, y enlace al reporte de Pages. Envíalo a Teams por webhook, guardado en el secret
TEAMS_WEBHOOK_URL, con if: always() para que avise también cuando falla.
Criterio: llega el mensaje al canal en un run exitoso y en uno con fallo forzado.
```

**Resultado (parcial)**: `scripts/teams-summary.mjs` y reporter JSON. Verificado **en local**:
- Tarjeta con resultados reales: 🟢 exitosa (6/6, por navegador), 🔴 fallida (2 fallos reales de `test:fail`, con el error) y 🔴 sin resultados (sin `results.json`).
- Envío HTTP a un servidor local que simula Teams: `POST`, `application/json`, Adaptive Card 1.4, respuesta 202.
- URL falsa (`example.invalid`): falla con `No se pudo contactar a example.invalid (ENOTFOUND)`, código de salida 1, **sin filtrar el token** de la URL; en el workflow eso genera una advertencia y no marca la ejecución como fallida.

**No verificado**: la llegada real a un canal de Teams. El criterio original ("llega el mensaje al canal") **no se cumple** con una URL falsa; se cumplirá al sustituir el secret por el webhook real de la app Workflows.

**Desviación**: el aviso falla en silencio (advertencia) en vez de romper la ejecución, para que un webhook caído no oculte el resultado de las pruebas.

---

# Guía de prompts profesionales

Las secciones siguientes recogen las consultas hechas en la conversación en su **versión profesional equivalente**. No son los mensajes que se enviaron (eran coloquiales y no se transcriben): son cómo se formularían para obtener el mismo resultado con menos rondas de aclaración.

**Plantilla** (una o dos líneas por dato, sin alargar):

```
Objetivo:  qué se quiere lograr
Contexto:  dónde (archivo, fase, cuenta, rama)
Límites:   qué NO tocar y qué NO publicar
Criterio:  cómo se sabrá que terminó (comando en verde, salida esperada)
Formato:   cómo se quiere la respuesta (análisis sin cambios, diff, tabla)
```

## Revisión final y depuración

**Versión profesional equivalente**

```
Objetivo:  auditar el proyecto y corregir lo que incumpla buenas prácticas.
Contexto:  repo saucedemo-qa-automation; código, tests, documentación, PROMPTS.md y agentes de Playwright.
Límites:   contrastar con la aplicación real cualquier afirmación de la documentación antes de darla por buena;
           no instalar dependencias incompatibles con TypeScript 7; no subir nada a GitHub sin confirmar.
Criterio:  npm run verify en verde; test:fail y test:healing siguen fallando por diseño.
Formato:   tabla de hallazgos con su corrección.
```

**Qué se hizo**: línea base ejecutando todo, revisión de código, documentación, bitácora y agentes, y comprobación contra la aplicación de las afirmaciones no verificadas (mensajes de error, atributos de nombres de producto). Hallazgos y correcciones: tabla "Revisión final: hallazgos y correcciones" de [REPORTE.md](REPORTE.md).

**Correcciones a esta bitácora**: la nota inicial afirmaba que los prompts se enviaron "tal como se enviaron" y no era así; la sección 4 sugería que el log se había pegado en una conversación aparte; y las fases de mejora se describían como ejecutadas "tal cual" pese a las desviaciones.

**Cambios que sustituyen a decisiones anteriores**:
- La exclusión de los demos (`@failure-demo`, `@healing-sandbox`, `@seed`) pasó de `--grep-invert` en los scripts a la config (`grepInvert` salvo `PW_DEMOS=1`), porque `npx playwright test` a secas ejecutaba 12 tests en lugar de 6. `.mcp.json` pasa `PW_DEMOS=1` para que el healer siga viendo el sandbox.
- No se pudo usar ESLint: `typescript-eslint` exige `typescript <6.1` y el proyecto usa TypeScript 7, que además no expone `createProgram`. Se escribió `scripts/check-conventions.mjs` sin dependencias y con menor alcance; se comprobó que detecta infracciones reales.

**Verificación**: `npm run verify` en verde (typecheck, lint y 6 tests).

## Consultas de diseño (sin cambios de código)

Hechas antes de definir las fases de mejora. La IA respondió con análisis; las decisiones están en las fases 1 a 7a.

**1. Reutilización, auto-curación, navegadores, pipeline y reporte**

```
Objetivo:  analizar cómo evolucionar el proyecto: reutilizar convenciones y locators, auto-curación,
           multi-navegador y multi-resolución, pipeline calendarizado y reporte con imágenes y video.
Contexto:  proyecto Playwright + TypeScript + POM ya funcionando con 3 casos.
Límites:   solo análisis; no modificar archivos.
Criterio:  cada punto con opciones, riesgos y una recomendación.
Formato:   una sección por tema y una lista de decisiones que debo tomar.
```

*Qué mejora*: el "sin cambios, solo análisis" pasa a ser un límite explícito y el "criterio" obliga a recibir opciones con riesgos, no una lista genérica.

**2. Navegadores, disparadores y publicación del reporte**

```
Objetivo:  fijar navegadores y disparadores del pipeline y elegir dónde publicar el reporte.
Contexto:  Chrome y Edge; ejecución diaria y tras cada merge a master.
Límites:   comparar GitHub Pages y artifacts con criterio "más moderno y compartible".
Criterio:  una recomendación única con sus riesgos.
Formato:   tabla comparativa y recomendación.
```

**3. Zona horaria y canal de aviso**

```
Objetivo:  cerrar la programación y la notificación.
Contexto:  zona horaria de Colombia; ejecutar después del merge; avisar por Microsoft Teams.
Límites:   el aviso es un resumen gerencial (estado, casos por navegador, duración, enlace al reporte), no el log completo.
Criterio:  prompts por fase con criterio de aceptación verificable.
Formato:   lista de fases 1 a 6, cada una con su prompt.
```

**4. Auto-curación**

```
Objetivo:  evaluar el agente healer de Playwright antes de adoptarlo.
Contexto:  Playwright 1.63 con init-agents disponible; suite de regresión que no debe ocultar bugs.
Límites:   solo lectura; no generar ni modificar archivos del repo.
Criterio:  confirmar si el agente existe en la versión instalada, qué edita y qué riesgos tiene.
Formato:   qué hace, riesgos, cuándo curar y cuándo no, y opciones ordenadas por riesgo.
```

**5. Duda conceptual**

```
Objetivo:  entender si el healer es un agente y en qué se diferencia de un test, un skill y un prompt único.
Formato:   comparación breve con implicaciones prácticas.
```

**6. Creación del repositorio**

```
Objetivo:  publicar el proyecto en GitHub.
Contexto:  repo local en master con commit inicial; gh instalado.
Límites:   repo público saucedemo-qa-automation bajo la cuenta nandodiaz43-maker; no modificar
           la configuración global de git; revisar secretos antes del commit.
Criterio:  gh repo view muestra PUBLIC y el push de master coincide con el local.
```

*Qué mejora*: incluir cuenta, nombre y visibilidad evitó la ronda de preguntas; en la sesión real la cuenta activa de `gh` era distinta de la identidad de git y hubo que confirmarla.
