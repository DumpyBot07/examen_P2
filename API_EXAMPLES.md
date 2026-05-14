# Ejemplos de uso y pruebas

Instalación y puesta en marcha (Poetry recomendado):

Usando `poetry` (recomendado por la especificación del proyecto):

```bash
poetry install
poetry run uvicorn main:app --reload
```

Si no usas `poetry`, puedes crear un virtualenv y usar `pip`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn sqlmodel python-dotenv pyjwt pwdlib[argon2]
uvicorn main:app --reload
```

1. Crear un usuario

```bash
curl -X POST "http://127.0.0.1:8000/users" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Santiago","username":"santi","password":"secret123"}'
```

2. Login (obtiene token y cookie HttpOnly)

```bash
curl -i -X POST "http://127.0.0.1:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=santi&password=secret123"
```

La respuesta incluirá el token JSON y la cabecera `Set-Cookie` con `access_token` HttpOnly.

3. Usar el token via header

```bash
TOKEN="<pega_el_token_aqui>"
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/users/me
```

4. Usar la cookie (curl guarda y envía cookies)

```bash
# Guardar cookies en cookiejar
curl -c cookiejar -X POST "http://127.0.0.1:8000/token" -d "username=santi&password=secret123"

# Enviar cookie en petición
curl -b cookiejar http://127.0.0.1:8000/users/me
```

Notas:

- Asegúrate de tener el fichero `.env` en la raíz con `SECRET_KEY`, `ALGORITHM` y `ACCESS_TOKEN_EXPIRE_MINUTES`.
- El token expira en 3 minutos por defecto.
