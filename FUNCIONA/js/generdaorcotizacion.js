document.addEventListener("DOMContentLoaded", function() {
  const generarPdfBtn = document.getElementById("generar-pdf-btn");
  generarPdfBtn.addEventListener("click", function(event) {
    event.preventDefault();

    const estimado = document.getElementById("estimado").value;
    const empresa = document.getElementById("empresa").value;
    const direccion = document.getElementById("direccion").value;
    const comuna = document.getElementById("comuna").value;
    const telefono = document.getElementById("telefono").value;
    const correo = document.getElementById("correo").value;
    const cantidad = document.getElementById("cantidad").value;
    const nombreProducto = document.getElementById("nombre-producto").value;
    const detalle = document.getElementById("detalle").value;
    const valor = document.getElementById("valor").value;
    const costoEnvio = document.getElementById("costo-envio").value;

    const contenidoPDF = `
      Estimado: ${estimado}
      Empresa: ${empresa}
      Dirección: ${direccion}
      Comuna: ${comuna}
      Teléfono: ${telefono}
      Correo: ${correo}
      Cantidad: ${cantidad}
      Nombre del Producto: ${nombreProducto}
      Detalle: ${detalle}
      Valor: ${valor}
      Costo de Envío: ${costoEnvio}
    `;

    const doc = new jsPDF();
    doc.text(contenidoPDF, 10, 10);
    doc.save("cotizacion.pdf");
  });
});
