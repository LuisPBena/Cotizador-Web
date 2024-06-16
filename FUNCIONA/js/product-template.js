document.addEventListener('DOMContentLoaded', function() {
  var productId = new URLSearchParams(window.location.search).get('id');
  loadProduct(productId);
  loadCustomFields(productId);
});

function loadProduct(productId) {
  const product = {
    nombre: 'Producto de ejemplo',
    imagen: 'url-imagen'
  };

  document.getElementById('product-info').innerHTML = `
    <h2>${product.nombre}</h2>
    <img src="${product.imagen}" alt="imagen">
  `;
  loadCustomFields(productId);
  loadPreview(productId);
}

function loadCustomFields(productId) {
  const customFields = [
    { nombre: 'Campo 1', tipo: 'texto', valor: 'Valor 1' },
    { nombre: 'Campo 2', tipo: 'numero', valor: '123' }
  ];

  const customFieldsDiv = document.getElementById("custom-fields");
  customFieldsDiv.innerHTML = "";
  customFields.forEach(field => {
    const fieldDiv = document.createElement("div");
    fieldDiv.textContent = `${field.nombre}: ${field.valor}`;
    customFieldsDiv.appendChild(fieldDiv);
  });
  console.log("Campos personalizados cargados");
}

function addCustomField() {
  const fieldName = document.getElementById("field-name").value;
  const fieldType = document.getElementById("field-type").value;
  const fieldValue = document.getElementById("field-value").value;

  if (!fieldName || !fieldValue) {
    alert("Por favor, complete todos los campos.");
    return;
  }

  const customField = {
    nombre: fieldName,
    tipo: fieldType,
    valor: fieldValue
  };

  alert("Campo personalizado agregado correctamente.");
  loadCustomFields(new URLSearchParams(window.location.search).get('id'));
  clearFieldForm();
}

function clearFieldForm() {
  document.getElementById("field-name").value = "";
  document.getElementById("field-type").value = "string";
  document.getElementById("field-value").value = "";
}

function loadPreview(productId) {
  const previewDiv = document.getElementById("product-preview");
  previewDiv.innerHTML = "";

  const product = {
    nombre: 'Producto de ejemplo',
    imagen: 'url-imagen'
  };
  
  const productDiv = document.createElement("div");
  productDiv.classList.add("product");

  const name = document.createElement("td");
  name.textContent = product.nombre;

  const img = document.createElement("img");
  img.src = product.imagen;
  img.alt = "imagen";

  productDiv.appendChild(name);
  productDiv.appendChild(img);

  previewDiv.appendChild(productDiv);

  const customFields = [
    { nombre: 'Campo 1', tipo: 'texto', valor: 'Valor 1' },
    { nombre: 'Campo 2', tipo: 'numero', valor: '123' }
  ];

  customFields.forEach(field => {
    const fieldDiv = document.createElement("div");
    fieldDiv.textContent = `${field.nombre}: ${field.valor}`;
    previewDiv.appendChild(fieldDiv);
  });
  console.log("Previsualización cargada");
}

function markAsComplete() {
  alert("Producto marcado como completo.");
  loadPreview(new URLSearchParams(window.location.search).get('id'));
}

function logout() {
  alert("Cerrar sesión");
}
