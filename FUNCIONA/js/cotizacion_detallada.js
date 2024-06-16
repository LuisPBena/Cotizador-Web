document.getElementById('form-cotizacion').addEventListener('submit', generarPDFDetallado);

function generarPDFDetallado(event) {
    event.preventDefault();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const empresa = document.getElementById('empresa').value;
    const estimado = document.getElementById('estimado').value;
    const direccion = document.getElementById('direccion').value;
    const comuna = document.getElementById('comuna').value;
    const telefono = document.getElementById('telefono').value;
    const correo = document.getElementById('correo').value;

    const params = new URLSearchParams(window.location.search);
    const subproductoNombre = params.get('nombre');
    const total = params.get('total');
    const detalle = params.get('detalle');

    const fechaEmision = new Date().toLocaleDateString();

    let contenido = `
        COTIZACIÓN
        Fecha de Emisión: ${fechaEmision}
        
        Empresa: ${empresa}
        Estimado (a): ${estimado}
        Dirección: ${direccion}
        Comuna: ${comuna}
        Teléfono: ${telefono}
        Correo: ${correo}
        
        Subproducto: ${subproductoNombre}
        
        DETALLE
        ${detalle}
        
        Total: ${total}
    `;

    doc.text(contenido, 10, 10);
    doc.save(`Cotización_${subproductoNombre}.pdf`);
}
