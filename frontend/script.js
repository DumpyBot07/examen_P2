// Configuración
const API_URL = "http://127.0.0.1:8000";

// Elementos del DOM
const registroForm = document.getElementById("registro-form");
const loginForm = document.getElementById("login-form");
const mostrarInfoBtn = document.getElementById("mostrar-info-btn");
const usuarioInfo = document.getElementById("usuario-info");
const alertContainer = document.getElementById("alert-container");

// Event Listeners
registroForm.addEventListener("submit", handleRegistro);
loginForm.addEventListener("submit", handleLogin);
mostrarInfoBtn.addEventListener("click", handleMostrarInfo);

/**
 * Maneja el envío del formulario de registro
 */
async function handleRegistro(e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!nombre || !username || !password) {
    mostrarAlerta("Por favor completa todos los campos", "error");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre,
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Error al crear el usuario");
    }

    mostrarAlerta(`✅ Usuario ${data.nombre} creado exitosamente`, "success");
    registroForm.reset();
  } catch (error) {
    mostrarAlerta(`❌ Error: ${error.message}`, "error");
  }
}

/**
 * Maneja el envío del formulario de login
 */
async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (!username || !password) {
    mostrarAlerta("Por favor completa todos los campos", "error");
    return;
  }

  try {
    // Crear FormData para enviar como form-urlencoded
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/token`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Error en la autenticación");
    }

    // Token obtenido del backend
    const token = data.access_token;

    // Guardar token en localStorage (como referencia)
    localStorage.setItem("access_token", token);

    // La cookie se establece automáticamente por el navegador
    mostrarAlerta(
      `✅ Usuario autenticado exitosamente\n\nToken: ${token.substring(0, 30)}...`,
      "success",
    );
    loginForm.reset();
  } catch (error) {
    mostrarAlerta(`❌ ${error.message}`, "error");
  }
}

/**
 * Maneja la obtención de información del usuario autenticado
 */
async function handleMostrarInfo() {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: "GET",
      credentials: "include", // Incluir cookies
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "No hay autenticación");
    }

    // Llenar la información del usuario
    document.getElementById("user-id").textContent = data.id;
    document.getElementById("user-nombre").textContent = data.nombre;
    document.getElementById("user-username").textContent = data.username;

    // Mostrar si existe contraseña hasheada (el backend no la devuelve, pero la documentación lo menciona)
    if (data.password_hashed) {
      document.getElementById("user-password").textContent =
        data.password_hashed;
    } else {
      document.getElementById("user-password").textContent = "No disponible";
    }

    // Mostrar la sección de información
    usuarioInfo.classList.remove("hidden");

    mostrarAlerta(`✅ Información del usuario cargada`, "info");
  } catch (error) {
    usuarioInfo.classList.add("hidden");
    mostrarAlerta(`❌ ${error.message}`, "error");
  }
}

/**
 * Muestra una alerta en pantalla
 * @param {string} mensaje - El mensaje a mostrar
 * @param {string} tipo - Tipo de alerta: 'success', 'error', 'info'
 */
function mostrarAlerta(mensaje, tipo = "info") {
  const alert = document.createElement("div");
  alert.className = `alert alert-${tipo}`;

  const mensajeDiv = document.createElement("div");
  mensajeDiv.textContent = mensaje;

  const closeBtn = document.createElement("button");
  closeBtn.className = "alert-close";
  closeBtn.textContent = "×";
  closeBtn.onclick = () => alert.remove();

  alert.appendChild(mensajeDiv);
  alert.appendChild(closeBtn);

  alertContainer.appendChild(alert);

  // Remover automáticamente después de 5 segundos
  setTimeout(() => {
    alert.style.animation = "slideInRight 0.4s ease-out reverse";
    setTimeout(() => alert.remove(), 400);
  }, 5000);
}

/**
 * Verifica si el usuario está autenticado al cargar la página
 */
window.addEventListener("DOMContentLoaded", () => {
  checkAuthentication();
});

/**
 * Verifica si hay una cookie de autenticación válida
 */
async function checkAuthentication() {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      mostrarAlerta("✅ Ya estás autenticado", "info");
    }
  } catch (error) {
    // Usuario no autenticado, es normal
  }
}
