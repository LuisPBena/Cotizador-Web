import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, addDoc, collection, getDocs, query, where, deleteDoc, writeBatch, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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
const auth = getAuth(app);

let campos = [];
let aplicarIVA = false;

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const params = new URLSearchParams(window.location.search);
            const subproductoUrl = params.get('nombre');

            if (subproductoUrl) {
                const subproductosSnapshot = await getDocs(collection(db, "subproductos"));
                let subproductoId = null;

                subproductosSnapshot.forEach(doc => {
                    if (doc.data().url === subproductoUrl) {
                        subproductoId = doc.id;
                    }
                });

                if (subproductoId) {
                    const subproductoDoc = await getDoc(doc(db, "subproductos", subproductoId));
                    if (subproductoDoc.exists()) {
                        const subproducto = subproductoDoc.data();
                        document.getElementById('subproducto-title').textContent = subproducto.nombre;
                        const subproductoNombreInput = document.getElementById('subproducto-nombre-input');
                        if (subproductoNombreInput) {
                            subproductoNombreInput.value = subproducto.nombre;
                        }

                        document.body.dataset.subproductoId = subproductoId;

                        const camposContainer = document.getElementById('subproducto-campos');
                        await cargarCampos(subproductoId, camposContainer);

                        // Cargar estado del checkbox "Aplicar IVA"
                        if (subproducto.aplicarIVA !== undefined) {
                            document.getElementById('aplicar-iva').checked = subproducto.aplicarIVA;
                            aplicarIVA = subproducto.aplicarIVA;
                        }
                        calcularTotal(); // Calcular el total con el estado del checkbox cargado

                        document.getElementById('guardar-subproducto').onclick = async () => {
                            const nombre = subproductoNombreInput.value;
                            await updateDoc(doc(db, "subproductos", subproductoId), {
                                nombre,
                                aplicarIVA: document.getElementById('aplicar-iva').checked // Guardar estado del checkbox
                            });

                            document.getElementById('mensaje').textContent = 'Subproducto actualizado exitosamente';
                        };

                        document.getElementById('aplicar-iva').onchange = async () => {
                            aplicarIVA = document.getElementById('aplicar-iva').checked;
                            await updateDoc(doc(db, "subproductos", subproductoId), {
                                aplicarIVA: aplicarIVA
                            });
                            calcularTotal(); // Recalcular el total cuando el checkbox cambie
                        };

                        document.getElementById('agregar-campo').onclick = async () => {
                            const nombreCampo = document.getElementById('nuevo-campo-nombre').value;
                            const tipoCampo = document.getElementById('nuevo-campo-tipo').value;
                            const tipoCalculo = document.getElementById('tipo-calculo').value;

                            let valoresCampo = [];
                            let preciosCampo = [];

                            if (tipoCampo === 'opciones') {
                                document.querySelectorAll('.opcion-item').forEach((item) => {
                                    const valor = item.querySelector('.opcion-valor').value;
                                    const precio = parseFloat(item.querySelector('.opcion-precio').value);
                                    valoresCampo.push(valor);
                                    preciosCampo.push(precio);
                                });
                            } else if (tipoCalculo === 'metros-cuadrados') {
                                const ancho = parseFloat(document.getElementById('ancho-campo').value);
                                const alto = parseFloat(document.getElementById('alto-campo').value);
                                const precioCampo = parseFloat(document.getElementById('precio-campo').value);
                                const area = ancho * alto;
                                valoresCampo.push(`${ancho} x ${alto}`);
                                preciosCampo.push(precioCampo * area);
                            } else {
                                const precioCampo = parseFloat(document.getElementById('precio-campo').value);
                                valoresCampo.push(document.getElementById('nuevo-campo-valores').value);
                                preciosCampo.push(precioCampo);
                            }

                            const campoDocRef = await addDoc(collection(db, "campos"), {
                                subproductoId,
                                nombre: nombreCampo,
                                tipo: tipoCampo,
                                valores: valoresCampo,
                                precios: preciosCampo,
                                calculo: tipoCalculo
                            });

                            const campoData = {
                                campoId: campoDocRef.id,
                                subproductoId,
                                orden: campos.length // Asignar el orden basado en la longitud actual de los campos
                            };

                            await addDoc(collection(db, "orden_campos"), campoData);

                            await cargarCampos(subproductoId, camposContainer);
                            limpiarFormularioCampo();
                        };
                    } else {
                        document.getElementById('mensaje').textContent = 'Subproducto no encontrado';
                    }
                } else {
                    document.getElementById('mensaje').textContent = 'Subproducto no encontrado';
                }
            } else {
                document.getElementById('mensaje').textContent = 'ID del subproducto no proporcionado';
            }
        } else {
            window.location.href = "login.html";
        }
    });

    document.getElementById('nuevo-campo-tipo').addEventListener('change', (event) => {
        const tipo = event.target.value;
        const valoresContainer = document.getElementById('valores-campo-container');
        const precioContainer = document.getElementById('precio-campo-container');
        const opcionesContainer = document.getElementById('opciones-container');
        const dimensionesContainer = document.getElementById('dimensiones-container');

        if (tipo === 'opciones') {
            valoresContainer.style.display = 'none';
            precioContainer.style.display = 'none';
            opcionesContainer.style.display = 'block';
            dimensionesContainer.style.display = 'none';
        } else if (tipo === 'metros-cuadrados') {
            valoresContainer.style.display = 'none';
            precioContainer.style.display = 'none';
            opcionesContainer.style.display = 'none';
            dimensionesContainer.style.display = 'block';
        } else if (tipo === 'cantidad') {
            valoresContainer.style.display = 'none';
            precioContainer.style.display = 'block';
            opcionesContainer.style.display = 'none';
            dimensionesContainer.style.display = 'none';
        } else {
            valoresContainer.style.display = 'block';
            precioContainer.style.display = 'block';
            opcionesContainer.style.display = 'none';
            dimensionesContainer.style.display = 'none';
        }
    });

    document.getElementById('agregar-opcion').addEventListener('click', () => {
        const opcionesContainer = document.getElementById('opciones-container');
        const opcionDiv = document.createElement('div');
        opcionDiv.classList.add('opcion-item');
        opcionDiv.innerHTML = `
            <input type="text" class="opcion-valor" placeholder="Opción">
            <input type="number" class="opcion-precio" placeholder="Precio">
            <button onclick="this.parentElement.remove()">Eliminar</button>
        `;
        opcionesContainer.insertBefore(opcionDiv, document.getElementById('agregar-opcion'));
    });

    // Script para agregar el campo 'orden' a todos los documentos existentes en la colección 'campos'
    agregarCampoOrden();
});

async function agregarCampoOrden() {
    const camposCollection = collection(db, "campos");
    const camposSnapshot = await getDocs(camposCollection);
    
    let orden = 0;
    const batch = writeBatch(db);

    camposSnapshot.forEach((docSnapshot) => {
        const campoRef = docSnapshot.ref;
        batch.update(campoRef, { orden: orden });
        orden++;
    });

    await batch.commit();
    console.log("Campo 'orden' agregado a todos los documentos.");
}

async function cargarCampos(subproductoId, container) {
    container.innerHTML = '';
    const camposSnapshot = await getDocs(query(collection(db, "orden_campos"), where("subproductoId", "==", subproductoId), orderBy("orden")));
    const vistaTrabajadorContainer = document.getElementById('vista-trabajador-campos');
    vistaTrabajadorContainer.innerHTML = '';

    let total = 0;

    campos = [];

    for (const docSnapshot of camposSnapshot.docs) {
        const campoData = docSnapshot.data();
        const campoDoc = await getDoc(doc(db, "campos", campoData.campoId));
        if (campoDoc.exists()) {
            const campo = { id: campoDoc.id, ...campoDoc.data() };
            campos.push(campo);

            const valores = campo.valores || [];
            const precios = campo.precios || [];

            const campoDiv = document.createElement('div');
            campoDiv.innerHTML = `
                <label>${campo.nombre}</label>
                ${campo.tipo === 'cantidad' ? `
                    <input type="number" class="cantidad-input" oninput="actualizarCantidad(this)" placeholder="Cantidad">
                    <div>
                        <span>Precio Unitario: </span>
                        <span class="precio-unitario">${precios[0]}</span>
                    </div>
                    <div>
                        <span>Precio Total: </span>
                        <span class="precio-total">0</span>
                    </div>
                ` : `
                    <select onchange="actualizarPrecio(this)">
                        ${valores.map((valor, index) => `<option value="${precios[index]}">${valor}</option>`).join('')}
                    </select>
                    <div>
                        <span>Precio: </span>
                        <span class="precio">${precios[0]}</span>
                    </div>
                `}
                <div class="botones-container">
                    <button onclick="mostrarDialogoEditar('${campo.id}')">Editar</button>
                    <button onclick="mostrarDialogoEliminar('${campo.id}')">Eliminar</button>
                </div>
            `;
            container.appendChild(campoDiv);

            const trabajadorCampoDiv = document.createElement('div');
            trabajadorCampoDiv.innerHTML = `<label>${campo.nombre}:</label>`;

            if (campo.tipo === 'opciones') {
                const select = document.createElement('select');
                valores.forEach((valor, index) => {
                    const option = document.createElement('option');
                    option.value = precios[index];
                    option.textContent = `${valor}, Precio: ${precios[index]}`;
                    select.appendChild(option);
                });
                select.addEventListener('change', async (event) => {
                    total = await calcularTotal();
                    document.getElementById('total-valor').textContent = total.toFixed(2);
                });
                trabajadorCampoDiv.appendChild(select);
            } else if (campo.tipo === 'cantidad') {
                trabajadorCampoDiv.innerHTML += `
                    <input type="number" class="cantidad-input" oninput="actualizarCantidad(this)" placeholder="Cantidad">
                    <div>
                        <span>Precio Unitario: </span>
                        <span class="precio-unitario">${precios[0]}</span>
                    </div>
                    <div>
                        <span>Precio Total: </span>
                        <span class="precio-total">0</span>
                    </div>
                `;
            } else {
                trabajadorCampoDiv.innerHTML += `<span>${valores[0]}, Precio: ${precios[0]}</span>`;
                total += precios[0];
            }

            vistaTrabajadorContainer.appendChild(trabajadorCampoDiv);
        }
    }

    total = await calcularTotal();
    document.getElementById('total-valor').textContent = total.toFixed(2);

    // Inicializar Sortable.js
    new Sortable(container, {
        animation: 150,
        onEnd: async (evt) => {
            const orden = [];
            container.childNodes.forEach((child, index) => {
                const id = child.querySelector('button').getAttribute('onclick').split("'")[1];
                orden.push({ id, orden: index });
            });

            await actualizarOrdenCampos(orden, subproductoId);
        },
    });

    // Asignar evento al botón "Guardar Orden"
    document.getElementById('guardar-orden').onclick = async () => {
        const orden = [];
        container.childNodes.forEach((child, index) => {
            const id = child.querySelector('button').getAttribute('onclick').split("'")[1];
            orden.push({ id, orden: index });
        });

        await actualizarOrdenCampos(orden, subproductoId);
        await cargarCampos(subproductoId, container); // Recargar los campos para reflejar el nuevo orden
        await cargarVistaTrabajador(subproductoId); // Recargar la vista del trabajador
    };
}

window.actualizarPrecio = function(selectElement) {
    const precioElement = selectElement.nextElementSibling.querySelector('.precio');
    precioElement.textContent = selectElement.value;
    calcularTotal();
};

window.actualizarCantidad = function(inputElement) {
    const cantidad = parseFloat(inputElement.value);
    const precioUnitario = parseFloat(inputElement.nextElementSibling.querySelector('.precio-unitario').textContent);

    const precioTotalElement = inputElement.nextElementSibling.nextElementSibling.querySelector('.precio-total');
    if (!isNaN(cantidad) && !isNaN(precioUnitario)) {
        precioTotalElement.textContent = (cantidad * precioUnitario).toFixed(2);
    } else {
        precioTotalElement.textContent = '0';
    }
    calcularTotal();
};

async function actualizarOrdenCampos(orden, subproductoId) {
    const batch = writeBatch(db);

    for (const { id, orden: ordenIndex } of orden) {
        const ordenCamposSnapshot = await getDocs(query(collection(db, "orden_campos"), where("campoId", "==", id), where("subproductoId", "==", subproductoId)));
        if (!ordenCamposSnapshot.empty) {
            const ordenCampoDoc = ordenCamposSnapshot.docs[0];
            batch.update(doc(db, "orden_campos", ordenCampoDoc.id), { orden: ordenIndex });
        }
    }

    await batch.commit();
}

async function obtenerIVA() {
    const configuracionesRef = collection(db, 'configuraciones');
    const ivaDoc = await getDocs(query(configuracionesRef, where('nombre', '==', 'IVA')));
    if (!ivaDoc.empty) {
        const ivaData = ivaDoc.docs[0].data();
        return ivaData.valor / 100;
    }
    return 0;
}

async function calcularTotal() {
    let total = 0;
    document.querySelectorAll('#vista-trabajador-campos select').forEach((select) => {
        total += parseFloat(select.value);
    });
    document.querySelectorAll('#vista-trabajador-campos span.precio-total').forEach((span) => {
        total += parseFloat(span.textContent);
    });
    document.querySelectorAll('#vista-trabajador-campos span.precio').forEach((span) => {
        total += parseFloat(span.textContent);
    });

    if (aplicarIVA) {
        const iva = await obtenerIVA();
        total *= (1 + iva);
    }

    document.getElementById('total-valor').textContent = total.toFixed(2);
    return total;
}

async function cargarVistaTrabajador(subproductoId) {
    const vistaTrabajadorContainer = document.getElementById('vista-trabajador-campos');
    vistaTrabajadorContainer.innerHTML = '';

    const camposSnapshot = await getDocs(query(collection(db, "orden_campos"), where("subproductoId", "==", subproductoId), orderBy("orden")));

    let total = 0;

    for (const docSnapshot of camposSnapshot.docs) {
        const campoData = docSnapshot.data();
        const campoDoc = await getDoc(doc(db, "campos", campoData.campoId));
        if (campoDoc.exists()) {
            const campo = campoDoc.data();

            const trabajadorCampoDiv = document.createElement('div');
            trabajadorCampoDiv.innerHTML = `<label>${campo.nombre}:</label>`;

            if (campo.tipo === 'opciones') {
                const select = document.createElement('select');
                campo.valores.forEach((valor, index) => {
                    const option = document.createElement('option');
                    option.value = campo.precios[index];
                    option.textContent = valor;  // Aquí solo mostramos el valor
                    select.appendChild(option);
                });
                select.addEventListener('change', async (event) => {
                    total = await calcularTotal();
                    document.getElementById('total-valor').textContent = total.toFixed(0);  // Quitar decimales del total
                });
                trabajadorCampoDiv.appendChild(select);
            } else if (campo.tipo === 'cantidad') {
                trabajadorCampoDiv.innerHTML += `
                    <input type="number" class="cantidad-input" oninput="actualizarCantidad(this)" placeholder="Cantidad">
                    <div>
                        <span>Precio Unitario: </span>
                        <span class="precio-unitario">${precios[0]}</span>
                    </div>
                    <div>
                        <span>Precio Total: </span>
                        <span class="precio-total">0</span>
                    </div>
                `;
            } else {
                trabajadorCampoDiv.innerHTML += `<span>${campo.valores[0]}, Precio: ${campo.precios[0]}</span>`;
                total += campo.precios[0];
            }

            vistaTrabajadorContainer.appendChild(trabajadorCampoDiv);
        }
    }

    total = await calcularTotal();
    document.getElementById('total-valor').textContent = total.toFixed(0);  // Quitar decimales del total
}

function limpiarFormularioCampo() {
    document.getElementById('nuevo-campo-nombre').value = '';
    document.getElementById('nuevo-campo-tipo').value = 'texto';
    document.getElementById('nuevo-campo-valores').value = '';
    document.getElementById('precio-campo').value = '';
    document.getElementById('tipo-calculo').value = 'suma';
    const opcionesContainer = document.getElementById('opciones-container');
    opcionesContainer.innerHTML = '<button id="agregar-opcion">Agregar Opción</button>';
    const dimensionesContainer = document.getElementById('dimensiones-container');
    dimensionesContainer.style.display = 'none';

    document.getElementById('agregar-opcion').addEventListener('click', () => {
        const opcionDiv = document.createElement('div');
        opcionDiv.classList.add('opcion-item');
        opcionDiv.innerHTML = `
            <input type="text" class="opcion-valor" placeholder="Opción">
            <input type="number" class="opcion-precio" placeholder="Precio">
            <button onclick="this.parentElement.remove()">Eliminar</button>
        `;
        opcionesContainer.insertBefore(opcionDiv, document.getElementById('agregar-opcion'));
    });
}

window.mostrarDialogoEditar = function(id) {
    const campo = campos.find(c => c.id === id);
    if (!campo) return;

    const dialogoEditar = document.getElementById('dialogo-editar');
    dialogoEditar.querySelector('#editar-campo-nombre').value = campo.nombre;
    dialogoEditar.querySelector('#editar-campo-tipo').value = campo.tipo;
    dialogoEditar.querySelector('#editar-campo-calculo').value = campo.calculo;

    const valoresContainer = dialogoEditar.querySelector('#editar-valores-container');
    valoresContainer.innerHTML = '';

    campo.valores.forEach((valor, index) => {
        const valorPrecioDiv = document.createElement('div');
        valorPrecioDiv.classList.add('valor-precio');

        const valorInput = document.createElement('input');
        valorInput.type = 'text';
        valorInput.value = valor;
        valorInput.classList.add('editar-valor');

        const precioInput = document.createElement('input');
        precioInput.type = 'number';
        precioInput.value = campo.precios[index];
        precioInput.classList.add('editar-precio');

        valorPrecioDiv.appendChild(valorInput);
        valorPrecioDiv.appendChild(precioInput);

        const eliminarBtn = document.createElement('button');
        eliminarBtn.textContent = 'Eliminar';
        eliminarBtn.onclick = () => valorPrecioDiv.remove();
        valorPrecioDiv.appendChild(eliminarBtn);

        valoresContainer.appendChild(valorPrecioDiv);
    });

    const agregarOpcionBtn = document.createElement('button');
    agregarOpcionBtn.textContent = 'Agregar Opción';
    agregarOpcionBtn.onclick = () => {
        const valorPrecioDiv = document.createElement('div');
        valorPrecioDiv.classList.add('valor-precio');

        const valorInput = document.createElement('input');
        valorInput.type = 'text';
        valorInput.placeholder = 'Opción';
        valorInput.classList.add('editar-valor');

        const precioInput = document.createElement('input');
        precioInput.type = 'number';
        precioInput.placeholder = 'Precio';
        precioInput.classList.add('editar-precio');

        valorPrecioDiv.appendChild(valorInput);
        valorPrecioDiv.appendChild(precioInput);

        const eliminarBtn = document.createElement('button');
        eliminarBtn.textContent = 'Eliminar';
        eliminarBtn.onclick = () => valorPrecioDiv.remove();
        valorPrecioDiv.appendChild(eliminarBtn);

        valoresContainer.appendChild(valorPrecioDiv);
    };
    valoresContainer.appendChild(agregarOpcionBtn);

    dialogoEditar.style.display = 'flex';

    document.getElementById('actualizar-campo-btn').onclick = async () => {
        await actualizarCampo(id);
    };
};

window.mostrarDialogoEliminar = function(id) {
    const dialogoEliminar = document.getElementById('dialogo-eliminar');
    dialogoEliminar.style.display = 'flex';

    document.getElementById('confirmar-eliminar-btn').onclick = async () => {
        await eliminarCampo(id);
        dialogoEliminar.style.display = 'none';
    };
};

async function actualizarCampo(id) {
    const dialogoEditar = document.getElementById('dialogo-editar');
    const subproductoId = document.body.dataset.subproductoId;

    const nombre = dialogoEditar.querySelector('#editar-campo-nombre').value;
    const tipo = dialogoEditar.querySelector('#editar-campo-tipo').value;
    const calculo = dialogoEditar.querySelector('#editar-campo-calculo').value;

    const valores = Array.from(dialogoEditar.querySelectorAll('.editar-valor')).map(input => input.value);
    const precios = Array.from(dialogoEditar.querySelectorAll('.editar-precio')).map(input => parseFloat(input.value));

    await updateDoc(doc(db, "campos", id), {
        nombre,
        tipo,
        calculo,
        valores,
        precios
    });

    const camposContainer = document.getElementById('subproducto-campos');
    await cargarCampos(subproductoId, camposContainer);

    dialogoEditar.style.display = 'none';
}

async function eliminarCampo(id) {
    const subproductoId = document.body.dataset.subproductoId;

    await deleteDoc(doc(db, "campos", id));

    const camposContainer = document.getElementById('subproducto-campos');
    await cargarCampos(subproductoId, camposContainer);
}

function cerrarDialogo(dialogoId) {
    const dialogo = document.getElementById(dialogoId);
    dialogo.style.display = 'none';
}

window.cerrarDialogo = cerrarDialogo;

function volverAtras() {
    window.history.back();
}

window.volverAtras = volverAtras;
