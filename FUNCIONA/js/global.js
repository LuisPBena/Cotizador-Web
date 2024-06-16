function toggleSubproductos(id) {
    const subproductosDiv = document.getElementById(`subproductos-${id}`);
    const isVisible = subproductosDiv.style.display === "block";
    document.querySelectorAll('.subproductos').forEach(div => div.style.display = 'none');
    subproductosDiv.style.display = isVisible ? "none" : "block";
}

function ordenarProductosPorCategoria(productos) {
    const ordenCategorias = [
        'Área Digital y Offset',
        'Área de Impresión y Ploter de Corte'
    ];
    
    return productos.sort((a, b) => {
        const indexA = ordenCategorias.indexOf(a.categoria);
        const indexB = ordenCategorias.indexOf(b.categoria);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
}
