import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener('firebaseReady', (event) => {
    const db = window.db;
    cargarProductosYSubproductos(db);
    cargarIVA(db);

    document.getElementById('guardar-iva-btn').addEventListener('click', async () => {
        try {
            const nuevoIVA = parseFloat(document.getElementById('iva-valor').value);
            const configuracionesRef = collection(db, 'configuraciones');
            const ivaDoc = await getDocs(query(configuracionesRef, where('nombre', '==', 'IVA')));
            if (!ivaDoc.empty) {
                const ivaDocRef = doc(db, 'configuraciones', ivaDoc.docs[0].id);
                await updateDoc(ivaDocRef, { valor: nuevoIVA });
            } else {
                await addDoc(configuracionesRef, { nombre: 'IVA', valor: nuevoIVA });
            }
            alert('IVA actualizado correctamente');
        } catch (error) {
            console.error("Error al guardar la configuración de IVA: ", error);
        }
    });
});

async function cargarIVA(db) {
    try {
        const configuracionesRef = collection(db, 'configuraciones');
        const ivaDoc = await getDocs(query(configuracionesRef, where('nombre', '==', 'IVA')));
        if (!ivaDoc.empty) {
            const ivaData = ivaDoc.docs[0].data();
            document.getElementById('iva-valor').value = ivaData.valor;
        }
    } catch (error) {
        console.error("Error al cargar la configuración de IVA: ", error);
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

async function cargarProductosYSubproductos(db) {
    const productosContainer = document.getElementById('productos-container');
    productosContainer.innerHTML = ''; // Limpiar el contenedor antes de cargar productos
    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        const productos = [];
        querySnapshot.forEach((doc) => {
            const producto = doc.data();
            producto.id = doc.id; // Guardar el ID del documento
            productos.push(producto);
        });

        const productosOrdenados = ordenarProductosPorCategoria(productos);
        let ultimaCategoria = '';

        for (const producto of productosOrdenados) {
            if (producto.categoria !== ultimaCategoria) {
                const categoriaElement = document.createElement('h2');
                categoriaElement.textContent = producto.categoria;
                productosContainer.appendChild(categoriaElement);
                ultimaCategoria = producto.categoria;
            }
            const productoElement = document.createElement('div');
            productoElement.className = 'producto';
            productoElement.innerHTML = `
                <h3 onclick="toggleSubproductos('${producto.id}')">${producto.nombre}</h3>
                <button onclick="eliminarProducto('${producto.id}')">Eliminar</button>
                <button onclick="abrirDialogoProducto('${producto.id}', '${producto.nombre}', '${producto.categoria}')">Actualizar</button>
                <button onclick="abrirDialogoSubproducto('${producto.id}')">Agregar Subproducto</button>
                <div id="subproductos-${producto.id}" class="subproductos" style="display:none;">
                </div>
            `;
            productosContainer.appendChild(productoElement);

            // Cargar subproductos
            const subproductosSnapshot = await getDocs(query(collection(db, "subproductos"), where("productoId", "==", producto.id)));
            const subproductosContainer = document.getElementById(`subproductos-${producto.id}`);
            subproductosSnapshot.forEach((subDoc) => {
                const subproducto = subDoc.data();
                subproducto.id = subDoc.id; // Asegurarse de que el ID del subproducto se asigne correctamente
                const subproductoElement = document.createElement('div');
                subproductoElement.className = 'subproducto';
                subproductoElement.innerHTML = `
                    <h4>${subproducto.nombre}</h4>
                    <button onclick="verProducto('${subproducto.url}')">Ver Producto</button>
                    <button onclick="eliminarSubproducto('${subproducto.id}', '${producto.id}')">Eliminar</button>
                    <button onclick="abrirDialogoSubproducto('${producto.id}', '${subproducto.id}', '${subproducto.nombre}')">Actualizar</button>
                `;
                subproductosContainer.appendChild(subproductoElement);
            });
        }
    } catch (error) {
        console.error("Error al cargar productos: ", error);
    }
}

function toggleSubproductos(id) {
    const subproductosDiv = document.getElementById(`subproductos-${id}`);
    const isVisible = subproductosDiv.style.display === "block";
    document.querySelectorAll('.subproductos').forEach(div => div.style.display = 'none');
    subproductosDiv.style.display = isVisible ? "none" : "block";
}

function verProducto(url) {
    window.location.href = `subproducto_template.html?nombre=${url}`;
}

async function eliminarProducto(id) {
    const db = window.db;
    await deleteDoc(doc(db, "productos", id));
    // Eliminar también los subproductos
    const subproductosSnapshot = await getDocs(query(collection(db, "subproductos"), where("productoId", "==", id)));
    subproductosSnapshot.forEach(async (subDoc) => {
        await deleteDoc(doc(db, "subproductos", subDoc.id));
    });
    cargarProductosYSubproductos(db);
}

function abrirDialogoProducto(productoId = null, nombre = '', categoria = '') {
    const dialogo = document.getElementById('dialogo-producto');
    const titulo = 'Agregar/Actualizar Producto';
    const nombreInput = document.getElementById('dialogo-producto-nombre');
    const categoriaInput = document.getElementById('dialogo-producto-categoria');

    document.getElementById('dialogo-producto-titulo').textContent = titulo;
    nombreInput.value = nombre;
    categoriaInput.value = categoria;

    const guardarBtn = document.getElementById('dialogo-producto-guardar');
    guardarBtn.onclick = function() {
        guardarProducto(productoId);
    };

    dialogo.style.display = 'block';
}

function abrirDialogoSubproducto(productoId, subproductoId = null, nombre = '') {
    const dialogo = document.getElementById('dialogo-subproducto');
    const titulo = 'Agregar/Actualizar Subproducto';
    const nombreInput = document.getElementById('dialogo-subproducto-nombre');

    document.getElementById('dialogo-subproducto-titulo').textContent = titulo;
    nombreInput.value = nombre;

    const guardarBtn = document.getElementById('dialogo-subproducto-guardar');
    guardarBtn.onclick = function() {
        guardarSubproducto(productoId, subproductoId);
    };

    dialogo.style.display = 'block';
}

function abrirDialogoIVA() {
    const dialogo = document.getElementById('dialogo-iva');
    dialogo.style.display = 'block';
}

function cerrarDialogo(dialogoId = null) {
    if (dialogoId) {
        document.getElementById(dialogoId).style.display = 'none';
    } else {
        document.getElementById('dialogo-producto').style.display = 'none';
        document.getElementById('dialogo-subproducto').style.display = 'none';
        document.getElementById('dialogo-iva').style.display = 'none';
    }
}

async function guardarProducto(id) {
    const db = window.db;
    const nombre = document.getElementById('dialogo-producto-nombre').value;
    const categoria = document.getElementById('dialogo-producto-categoria').value;

    if (id) {
        await updateDoc(doc(db, "productos", id), { nombre, categoria });
    } else {
        await addDoc(collection(db, "productos"), { nombre, categoria });
    }
    cerrarDialogo();
    cargarProductosYSubproductos(db);
}

async function guardarSubproducto(productoId, subproductoId) {
    const db = window.db;
    const nombre = document.getElementById('dialogo-subproducto-nombre').value;
    const url = `producto_${productoId}_subproducto_${Date.now()}.html`;

    if (subproductoId) {
        await updateDoc(doc(db, "subproductos", subproductoId), { nombre, url });
    } else {
        await addDoc(collection(db, "subproductos"), { nombre, url, productoId });
    }
    cerrarDialogo();
    cargarProductosYSubproductos(db);
}

async function eliminarSubproducto(subproductoId, productoId) {
    const db = window.db;
    await deleteDoc(doc(db, "subproductos", subproductoId));
    cargarProductosYSubproductos(db);
}

document.addEventListener('DOMContentLoaded', (event) => {
    if (window.db) {
        cargarProductosYSubproductos(window.db);
    }
});

window.abrirDialogoProducto = abrirDialogoProducto;
window.abrirDialogoSubproducto = abrirDialogoSubproducto;
window.cerrarDialogo = cerrarDialogo;
window.eliminarProducto = eliminarProducto;
window.actualizarProducto = guardarProducto;
window.eliminarSubproducto = eliminarSubproducto;
window.verProducto = verProducto;
window.toggleSubproductos = toggleSubproductos;
window.abrirDialogoIVA = abrirDialogoIVA;
