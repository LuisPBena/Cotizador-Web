import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB9U66-JGM82xs0sSYzfxHYQB6qKpRHkfM",
    authDomain: "cotizador-pbimprenta.firebaseapp.com",
    projectId: "cotizador-pbimprenta",
    storageBucket: "cotizador-pbimprenta.appspot.com",
    messagingSenderId: "415376792358",
    appId: "1:415376792358:web:05e5d152bb04d4edae3fe7",
    measurementId: "G-8FT426TJ18"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Función para iniciar sesión
async function iniciarSesion(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Usuario autenticado:", user.email);
        window.location.href = "admin.html"; // Redirigir al panel de administración
    } catch (error) {
        console.error("Error de autenticación:", error.message);
        alert("Error de autenticación: " + error.message);
    }
}

// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            iniciarSesion(email, password);
        });
    } else {
        console.error("No se encontró el formulario de inicio de sesión en el DOM");
    }
});
