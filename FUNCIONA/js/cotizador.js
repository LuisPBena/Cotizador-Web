import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyB9U66-JGM82xs0sSYzfxHYQB6qKpRHkfM",
    authDomain: "cotizador-pbimprenta.firebaseapp.com",
    projectId: "cotizador-pbimprenta",
    storageBucket: "cotizador-pbimprenta.appspot.com",
    messagingSenderId: "415376792358",
    appId: "1:415376792358:web:05e5d152bb04d4edae3fe7",
    measurementId: "G-8FT426TJ18"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('cerrar-sesion').addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = "login.html";
            }).catch((error) => {
                console.error("Error al cerrar sesión: ", error);
            });
        });
        await cargarProductos(db);
    } else {
        window.location.href = "login.html";
    }
});

async function cargarProductos(db) {
    const contenedor = document.getElementById('contenedor-productos');
    contenedor.innerHTML = ''; // Limpiar el contenedor antes de cargar productos

    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        const productos = [];
        querySnapshot.forEach((doc) => {
            const producto = doc.data();
            producto.id = doc.id; // Guardar el ID del documento
            productos.push(producto);
        });

        const productosOrdenados = ordenarProductosPorCategoria(productos);
        let categoriasMostradas = new Set();

        for (const producto of productosOrdenados) {
            if (!categoriasMostradas.has(producto.categoria)) {
                const categoriaSection = document.createElement('section');
                categoriaSection.className = 'categoria-section';
                categoriaSection.id = `categoria-${producto.categoria.replace(/\s+/g, '-')}`;
                const categoriaTitulo = document.createElement('h2');
                categoriaTitulo.textContent = producto.categoria;
                const productoContainer = document.createElement('div');
                productoContainer.className = 'producto-container';
                categoriaSection.appendChild(categoriaTitulo);
                categoriaSection.appendChild(productoContainer);
                contenedor.appendChild(categoriaSection);
                categoriasMostradas.add(producto.categoria);
            }

            const productoElement = document.createElement('div');
            productoElement.className = 'producto';
            productoElement.innerHTML = `
                <h3 onclick="toggleSubproductos('${producto.id}')">${producto.nombre}</h3>
                <div id="subproductos-${producto.id}" class="subproductos" style="display:none;">
                </div>
            `;

            document.getElementById(`categoria-${producto.categoria.replace(/\s+/g, '-')}`).querySelector('.producto-container').appendChild(productoElement);

            // Cargar subproductos
            const subproductosSnapshot = await getDocs(query(collection(db, "subproductos"), where("productoId", "==", producto.id)));
            const subproductosContainer = document.getElementById(`subproductos-${producto.id}`);
            subproductosSnapshot.forEach((subDoc) => {
                const subproducto = subDoc.data();
                const subproductoElement = document.createElement('div');
                subproductoElement.className = 'subproducto';
                subproductoElement.textContent = subproducto.nombre;
                subproductoElement.onclick = () => window.location.href = `subproducto_template_trabajador.html?nombre=${subproducto.url}`; // Redirigir al hacer clic
                subproductosContainer.appendChild(subproductoElement);
            });
        }
    } catch (error) {
        console.error("Error al cargar productos: ", error);
    }
}

function ordenarProductosPorCategoria(productos) {
    const ordenCategorias = [
        'Área Digital y Offset',
        'Área de Impresión y Ploter de corte'
    ];

    return productos.sort((a, b) => {
        const indexA = ordenCategorias.indexOf(a.categoria);
        const indexB = ordenCategorias.indexOf(b.categoria);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
}
