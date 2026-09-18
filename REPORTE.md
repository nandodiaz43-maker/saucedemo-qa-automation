# Reporte final

## Resultado de ejecución

| Suite | Comando | Resultado |
|-------|---------|-----------|
| Regresión E2E (TC-01, TC-02, TC-03) x Chrome y Edge | `npm test` | 6 passed |
| Fallo intencional (fase 3) | `npm run test:fail` | 2 failed (esperado: 1 por navegador) |

Reporte HTML: `npm run report` (se genera en `playwright-report/`).

## Diagnóstico de fallo con IA

### Fallo provocado

En [tests/failure-demo.spec.ts](tests/failure-demo.spec.ts) el selector del botón de login se cambió de `{ name: 'Login' }` a `{ name: 'Log in' }`.

Artefactos generados en `test-results/<test>/`: `trace.zip`, `test-failed-1.png`, `video.webm` y `error-context.md`.

### Log de error entregado a la IA

```
TimeoutError: locator.click: Timeout 5000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Log in' })

> 13 |   await page.getByRole('button', { name: 'Log in' }).click({ timeout: 5_000 });
```

### Respuesta de la IA (Claude)

> **Causa raíz:** el locator `getByRole('button', { name: 'Log in' })` no coincide con ningún elemento. El snapshot de accesibilidad de la página muestra un único botón llamado `"Login"` (sin espacio). `getByRole` con `name` de tipo string hace una coincidencia de subcadena insensible a mayúsculas, y `"Log in"` no es subcadena de `"Login"`, por lo que Playwright esperó los 5 s y lanzó `TimeoutError`. No es un problema de sincronización ni de la aplicación: es un nombre accesible incorrecto en el test.
>
> **Corrección:**
> ```ts
> await page.getByRole('button', { name: 'Login' }).click();
> // o, mejor, reutilizar el page object:
> await loginPage.loginButton.click();
> ```
> **Prevención:** centralizar el locator en `LoginPage` para que un cambio de texto se corrija en un solo lugar, y no subir el timeout para "ocultar" un selector erróneo.

### Análisis propio

- El diagnóstico se verificó con el `error-context.md` de Playwright: el snapshot confirma que el botón existe y se llama `Login`; el resto del formulario se llenó bien, así que el fallo está aislado en el selector.
- La IA acertó en la causa; se comprobó que la corrección funciona porque `LoginPage.loginButton` usa exactamente `{ name: 'Login' }` y los tests TC-01/TC-02 pasan.
- Lección: el fallo tardó 5 s (el timeout configurado) en lugar de fallar de inmediato, por lo que en un flujo real conviene un `expect(locator).toBeVisible()` previo para obtener un mensaje más claro.
- Para inspeccionar la traza visualmente: `npx playwright show-trace test-results/<carpeta>/trace.zip`.
