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

  document.getElementById('product-name').textContent = product.nombre;
  document.getElementById('product-image').src = product.imagen;
}

function loadCustomFields(productId) {
  const customFields = [
    { nombre_campo: 'Campo 1', tipo: 'texto', valores: ['Valor 1'] },
    { nombre_campo: 'Campo 2', tipo: 'numero', valores: [123] }
  ];

  const fieldsList = document.getElementById('fields-list');
  fieldsList.innerHTML = '';
  customFields.forEach(field => {
    const fieldDiv = document.createElement('div');
    fieldDiv.classList.add('field');

    const fieldName = document.createElement('p');
    fieldName.textContent = `Nombre del campo: ${field.nombre_campo}`;

    const fieldType = document.createElement('p');
    fieldType.textContent = `Tipo: ${field.tipo}`;

    const fieldValues = document.createElement('p');
    fieldValues.textContent = `Valores: ${field.valores ? field.valores.join(', ') : 'N/A'}`;

    fieldDiv.appendChild(fieldName);
    fieldDiv.appendChild(fieldType);
    fieldDiv.appendChild(fieldValues);

    fieldsList.appendChild(fieldDiv);
  });
}

function addCustomField() {
  const fieldName = document.getElementById('field-name').value;
  const fieldType = document.getElementById('field-type').value;
  const fieldValues = document.getElementById('field-values').value.split(',');

  const newField = {
    nombre_campo: fieldName,
    tipo: fieldType,
    valores: fieldType === 'opciones' ? fieldValues : []
  };

  alert('Campo personalizado agregado');
  loadCustomFields(new URLSearchParams(window.location.search).get('id'));
  clearFieldForm();
}

function clearFieldForm() {
  document.getElementById('field-name').value = '';
  document.getElementById('field-type').value = 'texto';
  document.getElementById('field-values').value = '';
}
