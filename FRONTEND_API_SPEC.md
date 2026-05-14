# Especificación de API - Sistema de Autenticación

## 1. Registro de Usuario

### Endpoint: `POST /users`

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "nombre": "string",
  "username": "string",
  "password": "string"
}
```

**Campos requeridos:**

- `nombre` (string, requerido): Nombre completo del usuario. Ejemplo: "Santiago Ortega"
- `username` (string, requerido, único): Nombre de usuario para login. Debe ser único en la BD. Ejemplo: "santiago123"
- `password` (string, requerido): Contraseña en texto plano. Se hasheará con Argon2 en el servidor.

**Ejemplo de Request:**

```json
{
  "nombre": "Santiago Ortega",
  "username": "santiago",
  "password": "miPassword123"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "nombre": "Santiago Ortega",
  "username": "santiago"
}
```

**Posibles Errores:**

- `400 Bad Request`: Username ya existe o campos requeridos faltantes.
- `422 Unprocessable Entity`: Validación de campos fallida.

---

## 2. Login (Obtener Token)

### Endpoint: `POST /token`

**Content-Type:** `application/x-www-form-urlencoded`

**Form Fields:**

- `username` (string, requerido): Username registrado
- `password` (string, requerido): Contraseña en texto plano

**Ejemplo con curl:**

```bash
curl -X POST "http://localhost:8001/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=santiago&password=miPassword123"
```

**Ejemplo con fetch (JavaScript):**

```javascript
const formData = new URLSearchParams();
formData.append("username", "santiago");
formData.append("password", "miPassword123");

fetch("http://localhost:8001/token", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: formData,
  credentials: "include", // Importante para enviar cookies
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Headers de Respuesta:**

```
Set-Cookie: access_token="Bearer eyJhbGciOi..."; HttpOnly; Max-Age=180; Path=/; SameSite=lax
```

**Notas:**

- El token expira en 3 minutos (180 segundos).
- La cookie `access_token` se establece automáticamente (HttpOnly, no accesible desde JavaScript).
- Guardar el `access_token` en el response para usarlo en requests posteriores si se necesita usar Header en lugar de Cookie.

**Posibles Errores:**

- `401 Unauthorized`: Username o password incorrectos.

---

## 3. Obtener Información del Usuario Actual

### Endpoint: `GET /users/me`

**Autenticación (una de las dos opciones):**

**Opción A: Via Header (Authorization Bearer Token)**

```bash
curl -i \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:8001/users/me
```

**Opción B: Via Cookie (HttpOnly)**

```bash
# Si la cookie fue establecida por Set-Cookie, curl la envía automáticamente con -b o -j
curl -i -b cookiejar http://localhost:8001/users/me
```

**Ejemplo con fetch (JavaScript) vía Header:**

```javascript
const token = localStorage.getItem("access_token");

fetch("http://localhost:8001/users/me", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

**Ejemplo con fetch (JavaScript) vía Cookie:**

```javascript
// La cookie se envía automáticamente si fue establecida con HttpOnly
fetch("http://localhost:8001/users/me", {
  method: "GET",
  credentials: "include", // Envía cookies automáticamente
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

**Response (200 OK):**

```json
{
  "id": 1,
  "nombre": "Santiago Ortega",
  "username": "santiago"
}
```

**Posibles Errores:**

- `401 Unauthorized`: Token inválido, expirado o no autenticado.

---

## 4. Resumen de Flujo Completo (Frontend)

### 1. Registro

```javascript
async function registrar(nombre, username, password) {
  const response = await fetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, username, password }),
  });
  return response.json();
}
```

### 2. Login

```javascript
async function login(username, password) {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch("/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
    credentials: "include", // Guarda la cookie
  });

  const data = await response.json();

  // Opcionalmente, guardar token en localStorage para usarlo en Headers
  localStorage.setItem("access_token", data.access_token);

  return data;
}
```

### 3. Obtener Usuario Actual (opción con Cookie)

```javascript
async function obtenerUsuarioActual() {
  const response = await fetch("/users/me", {
    method: "GET",
    credentials: "include", // Envía la cookie HttpOnly automáticamente
  });
  return response.json();
}
```

### 3. Obtener Usuario Actual (opción con Header)

```javascript
async function obtenerUsuarioActual() {
  const token = localStorage.getItem("access_token");

  const response = await fetch("/users/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}
```

---

## 5. Códigos de Estado HTTP

| Código | Descripción                            |
| ------ | -------------------------------------- |
| 200    | OK - Request exitoso                   |
| 201    | Created - Usuario creado               |
| 400    | Bad Request - Validación fallida       |
| 401    | Unauthorized - Sin autenticación       |
| 422    | Unprocessable Entity - Datos inválidos |
| 500    | Internal Server Error                  |

---

## 6. Notas Importantes para el Frontend

1. **Token expira en 3 minutos:** Implementar lógica de refresh o re-login si es necesario.
2. **Cookie HttpOnly:** No puedes acceder a ella desde JavaScript, pero se envía automáticamente en requests si usas `credentials: 'include'`.
3. **CORS:** Si el frontend está en otro dominio, verificar que el servidor tenga CORS habilitado.
4. **Charset:** Usar UTF-8 en requests y responses.
5. **Manejo de errores:** Siempre verificar el status HTTP y el JSON de error antes de usar los datos.

---

## 7. Ejemplo Completo - Flow de Registro y Login

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Auth API Example</title>
  </head>
  <body>
    <h1>Registro y Login</h1>

    <section>
      <h2>Registro</h2>
      <input id="regNombre" type="text" placeholder="Nombre" />
      <input id="regUsername" type="text" placeholder="Username" />
      <input id="regPassword" type="password" placeholder="Password" />
      <button onclick="handleRegister()">Registrar</button>
      <div id="regResult"></div>
    </section>

    <section>
      <h2>Login</h2>
      <input id="loginUsername" type="text" placeholder="Username" />
      <input id="loginPassword" type="password" placeholder="Password" />
      <button onclick="handleLogin()">Login</button>
      <div id="loginResult"></div>
    </section>

    <section>
      <h2>Usuario Actual</h2>
      <button onclick="handleGetMe()">Obtener Mi Info</button>
      <div id="meResult"></div>
    </section>

    <script>
      const API_URL = "http://localhost:8001";

      async function handleRegister() {
        const nombre = document.getElementById("regNombre").value;
        const username = document.getElementById("regUsername").value;
        const password = document.getElementById("regPassword").value;

        try {
          const response = await fetch(`${API_URL}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, username, password }),
          });
          const data = await response.json();
          document.getElementById("regResult").textContent = JSON.stringify(
            data,
            null,
            2,
          );
        } catch (error) {
          document.getElementById("regResult").textContent =
            `Error: ${error.message}`;
        }
      }

      async function handleLogin() {
        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;

        try {
          const formData = new URLSearchParams();
          formData.append("username", username);
          formData.append("password", password);

          const response = await fetch(`${API_URL}/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
            credentials: "include",
          });
          const data = await response.json();
          localStorage.setItem("access_token", data.access_token);
          document.getElementById("loginResult").textContent =
            `Login exitoso! Token: ${data.access_token.substring(0, 20)}...`;
        } catch (error) {
          document.getElementById("loginResult").textContent =
            `Error: ${error.message}`;
        }
      }

      async function handleGetMe() {
        try {
          const response = await fetch(`${API_URL}/users/me`, {
            method: "GET",
            credentials: "include",
          });
          const data = await response.json();
          document.getElementById("meResult").textContent = JSON.stringify(
            data,
            null,
            2,
          );
        } catch (error) {
          document.getElementById("meResult").textContent =
            `Error: ${error.message}`;
        }
      }
    </script>
  </body>
</html>
```
