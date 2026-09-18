---
name: add-test-case
description: Agrega un nuevo caso de prueba E2E a este proyecto Playwright de SauceDemo siguiendo el POM, los tags @TC-XX y la matriz de casos. Úsalo cuando se pida automatizar un caso nuevo o ampliar la cobertura.
---

# Agregar un caso de prueba

Lee primero `CLAUDE.md`: sus reglas aplican a todo lo de abajo.

## Pasos

1. **Definir el caso en la matriz.** Tomar el siguiente ID libre de `TEST_MATRIX.md` (TC-04, TC-05...) y completar tipo, título, precondiciones, pasos, resultado esperado y prioridad. Si el caso ya estaba como candidato, moverlo a la tabla de automatizados.
2. **Comprobar el comportamiento real** de la aplicación antes de escribir aserciones. No asumir mensajes de error ni URLs: abrir la página o ejecutar un test de prueba y leer el resultado. SauceDemo tiene comportamientos que no son los esperables (por ejemplo permite hacer checkout con el carrito vacío).
3. **Reutilizar antes de crear.** Revisar `pages/`, `pages/components/` y `data/`.
   - Si falta una acción, agregarla al Page Object correspondiente.
   - Si un locator se repite entre pantallas, crear o ampliar un componente en `pages/components/`.
   - Si se crea un Page Object nuevo, extender `BasePage` o `SectionPage` y registrarlo en `fixtures/pages.ts`.
4. **Datos nuevos** en `data/testData.ts`, nunca incrustados en el spec.
5. **Escribir el test** en `tests/`, con el ID en título y tag:
   ```ts
   test('TC-04 Error: ...', { tag: '@TC-04' }, async ({ loginPage, inventoryPage }) => {
     // solo orquesta métodos del POM
   });
   ```
6. **Verificar:**
   - `npm run typecheck` sin errores.
   - `npx playwright test --grep @TC-04` en verde y ejecuta solo ese caso.
   - `npm test` completo en verde.
7. **Registrar** en `PROMPTS.md` el prompt real que se usó.

## Casos de datos variables

Si un caso es una variante de otro (por ejemplo checkout sin Last Name o sin Zip), parametrizar el test existente iterando sobre los datos, en lugar de duplicar el spec.

## Qué no hacer

- No subir timeouts para "arreglar" un selector: se corrige el selector.
- No tocar `tests/failure-demo.spec.ts`.
- No dejar un caso marcado como automatizado en la matriz si no tiene test con su tag.
