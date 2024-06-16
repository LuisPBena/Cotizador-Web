import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js";

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
                        document.body.dataset.subproductoId = subproductoId;

                        const camposContainer = document.getElementById('vista-trabajador-campos');
                        await cargarCampos(subproductoId, camposContainer);

                        document.getElementById('subproducto-nombre').textContent = subproducto.nombre;

                        if (subproducto.aplicarIVA !== undefined) {
                            document.getElementById('aplicar-iva').checked = subproducto.aplicarIVA;
                            aplicarIVA = subproducto.aplicarIVA;
                        }
                        calcularTotal(); // Calcular el total con el estado del checkbox cargado

                        document.getElementById('aplicar-iva').onchange = async () => {
                            aplicarIVA = document.getElementById('aplicar-iva').checked;
                            calcularTotal(); // Recalcular el total cuando el checkbox cambie
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

    document.getElementById('generar-cotizacion').addEventListener('click', generarPDF);
    document.getElementById('generar-cotizacion-detallada-btn').addEventListener('click', redirigirACotizacionDetallada);
});

async function cargarCampos(subproductoId, container) {
    container.innerHTML = '';
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
                    option.textContent = `${valor}`;
                    select.appendChild(option);
                });
                select.addEventListener('change', async (event) => {
                    total = await calcularTotal();
                    document.getElementById('total-valor').textContent = total;
                });
                trabajadorCampoDiv.appendChild(select);
            } else if (campo.tipo === 'cantidad') {
                trabajadorCampoDiv.innerHTML += `
                    <input type="number" class="cantidad-input" oninput="actualizarCantidad(this)" placeholder="Cantidad">
                    <div style="display:none;">
                        <span>Precio Unitario: </span>
                        <span class="precio-unitario">${campo.precios[0]}</span>
                    </div>
                    <div>
                        <span>Precio Total: </span>
                        <span class="precio-total" style="display:none;">0</span>
                    </div>
                `;
            } else {
                trabajadorCampoDiv.innerHTML += `<span>${campo.valores[0]}</span>`;
                total += campo.precios[0];
            }

            container.appendChild(trabajadorCampoDiv);
        }
    }

    total = await calcularTotal();
    document.getElementById('total-valor').textContent = total;
}

window.actualizarCantidad = function(inputElement) {
    const cantidad = parseFloat(inputElement.value);
    const precioUnitario = parseFloat(inputElement.nextElementSibling.querySelector('.precio-unitario').textContent);

    const precioTotalElement = inputElement.nextElementSibling.nextElementSibling.querySelector('.precio-total');
    if (!isNaN(cantidad) && !isNaN(precioUnitario)) {
        precioTotalElement.textContent = (cantidad * precioUnitario);
    } else {
        precioTotalElement.textContent = '0';
    }
    calcularTotal();
};

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

    const totalRedondeado = Math.round(total * 100) / 100; // Redondea a dos decimales
    const totalFormateado = Number.isInteger(totalRedondeado) ? totalRedondeado.toString() : totalRedondeado.toFixed(2).replace(/\.00$/, '');

    document.getElementById('total-valor').textContent = totalFormateado;
    return totalRedondeado;
}

function volverAtras() {
    window.history.back();
}

window.volverAtras = volverAtras;

function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const subproductoNombre = document.getElementById('subproducto-nombre').textContent;
    const totalValor = document.getElementById('total-valor').textContent;

    let contenido = `Cotización\n\n${subproductoNombre}\n\n`;

    document.querySelectorAll('#vista-trabajador-campos > div').forEach(div => {
        const label = div.querySelector('label').textContent;
        const select = div.querySelector('select');
        const cantidad = div.querySelector('.cantidad-input');
        if (select) {
            const valorSeleccionado = select.options[select.selectedIndex].textContent;
            contenido += `${label} ${valorSeleccionado}\n`;
        } else if (cantidad) {
            const precioUnitario = div.querySelector('.precio-unitario').textContent;
            contenido += `${label} ${cantidad.value}\n`;
        }
    });

    contenido += `\nTotal: ${totalValor}\n`;

    doc.text(contenido, 10, 10);
    doc.save(`${subproductoNombre}_cotizacion.pdf`);
}

function redirigirACotizacionDetallada() {
    const nombreSubproducto = document.getElementById('subproducto-nombre').textContent;
    const total = document.getElementById('total-valor').textContent;
    const detalleSubproducto = obtenerDetalleSubproducto();

    window.location.href = `cotizacion_detallada.html?nombre=${encodeURIComponent(nombreSubproducto)}&total=${encodeURIComponent(total)}&detalle=${encodeURIComponent(detalleSubproducto)}`;
}

function obtenerDetalleSubproducto() {
    let detalle = '';
    document.querySelectorAll('#vista-trabajador-campos > div').forEach(div => {
        const label = div.querySelector('label').textContent;
        const select = div.querySelector('select');
        const cantidad = div.querySelector('.cantidad-input');
        if (select) {
            const valorSeleccionado = select.options[select.selectedIndex].textContent;
            detalle += `${label}: ${valorSeleccionado}\n`;
        } else if (cantidad) {
            const precioUnitario = div.querySelector('.precio-unitario').textContent;
            detalle += `${label}: ${cantidad.value}\n`;
        }
    });
    return detalle.trim();
}
