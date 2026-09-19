# Matriz de casos de prueba — Flujo de compra E2E (saucedemo.com)

Generada con IA (ver prompt 1 en [PROMPTS.md](PROMPTS.md)). Los resultados esperados y los mensajes de error se contrastaron ejecutando cada caso contra la aplicación real.

## Casos automatizados

| ID (tag) | Tipo | Título | Precondiciones | Pasos | Resultado esperado | Prioridad |
|----|------|--------|----------------|-------|--------------------|-----------|
| TC-01 (`@TC-01`) | Happy Path | Compra completa de un producto | Usuario `standard_user` válido | 1. Abrir `/` 2. Login con `standard_user` / `secret_sauce` 3. Agregar "Sauce Labs Backpack" 4. Abrir carrito 5. Checkout 6. Completar First Name, Last Name y Zip 7. Continue 8. Finish | Se llega a `checkout-complete.html` con el mensaje "Thank you for your order!" | Alta |
| TC-02 (`@TC-02`) | Error | Login con credenciales inválidas | Ninguna | 1. Abrir `/` 2. Login con `standard_user` / `wrong_password` | Mensaje "Epic sadface: Username and password do not match any user in this service"; el usuario permanece en `/` | Alta |
| TC-03 (`@TC-03`) | Límite | Checkout con datos incompletos | Usuario logueado con 1 producto en el carrito | 1. Ir a Checkout 2. Dejar First Name vacío, completar Last Name y Zip 3. Continue | Mensaje "Error: First Name is required"; permanece en `checkout-step-one.html` | Alta |

## Casos candidatos (fuera del alcance automatizado)

| ID | Tipo | Título | Nota |
|----|------|--------|------|
| TC-04 | Límite | Checkout con carrito vacío | SauceDemo **permite** avanzar con el carrito vacío; se considera un defecto/observación de la AUT, no un caso pasando. |
| TC-05 | Error | Usuario bloqueado (`locked_out_user`) | Mensaje real: "Epic sadface: Sorry, this user has been locked out." (verificado contra la aplicación). |
| TC-06 | Límite | Checkout sin Last Name / sin Zip | Variantes de TC-03 (parametrizables). |
| TC-07 | Límite | Quitar producto desde el carrito | El badge del carrito desaparece. |
