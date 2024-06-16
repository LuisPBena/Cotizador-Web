// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB9U66-JGM82xs0sSYzfxHYQB6qKpRHkfM",
    authDomain: "cotizador-pbimprenta.firebaseapp.com",
    projectId: "cotizador-pbimprenta",
    storageBucket: "cotizador-pbimprenta.appspot.com",
    messagingSenderId: "415376792358",
    appId: "1:415376792358:web:05e5d152bb04d4edae3fe7",
    measurementId: "G-8FT426TJ18"
  };
  
  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const functions = firebase.functions();
  
  function setAdminRole() {
    const email = prompt("Ingrese el correo electrónico del usuario para hacerlo administrador:");
    if (email) {
      const addAdminRole = firebase.functions().httpsCallable('addAdminRole');
      addAdminRole({ email: email }).then(result => {
        console.log(result);
        if (result.data.error) {
          alert("Error al establecer el rol de admin: " + result.data.error);
        } else {
          alert(result.data.message);
        }
      }).catch(error => {
        console.error(error);
        alert("Error al establecer el rol de admin: " + error.message);
      });
    }
  }
  