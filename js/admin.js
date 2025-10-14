// js/admin.js

const ADMIN_EMAIL = "hariprasath7112@gmail.com";

// Login check
const user = JSON.parse(sessionStorage.getItem("user"));
if (!user || user.email !== ADMIN_EMAIL) {
  alert("Access denied!");
  window.location.href = "index.html";
}
$('#adminName').text(`Hello, ${user.name}`);

// Logout
$('#logoutBtn').click(() => {
  sessionStorage.clear();
  window.location.href = "index.html";
});

// --------- Categories CRUD ---------
async function loadCategories() {
  const categories = await getDocuments("categories");
  const tbody = $('#categoriesTable tbody');
  tbody.empty();

  categories.forEach(c => {
    tbody.append(`
      <tr data-id="${c.id}">
        <td contenteditable="true">${c.name}</td>
        <td>
          <button class="editCategory">Edit</button>
          <button class="deleteCategory">Delete</button>
        </td>
      </tr>
    `);
  });

  // Update product dropdown
  const catSelect = $('#productCat');
  catSelect.empty().append('<option value="">Select Category</option>');
  categories.forEach(c => catSelect.append(`<option value="${c.name}">${c.name}</option>`));
}

$('#addCategoryBtn').click(async () => {
  const name = $('#newCategory').val().trim();
  if (!name) return alert("Enter category name");
  await addDocument("categories", { name });
  $('#newCategory').val('');
  await loadCategories();
});

$(document).on('click', '.editCategory', async function() {
  const row = $(this).closest('tr');
  const id = row.data('id');
  const newName = row.find('td:first').text().trim();
  if (!newName) return alert("Category name cannot be empty");
  await updateDocument("categories", id, { name: newName });
  await loadCategories();
});

$(document).on('click', '.deleteCategory', async function() {
  const id = $(this).closest('tr').data('id');
  await deleteDocument("categories", id);
  await loadCategories();
});

// --------- Products CRUD ---------
async function loadProducts() {
  const products = await getDocuments("products");
  const categories = await getDocuments("categories");
  const tbody = $('#productTable tbody');
  tbody.empty();

  products.forEach(p => {
    tbody.append(`
      <tr data-id="${p.id}">
        <td contenteditable="true">${p.title}</td>
        <td contenteditable="true">${p.des}</td>
        <td>
          <select class="prodCatSelect">
            ${categories.map(c => `<option value="${c.name}" ${c.name === p.cat_id ? "selected" : ""}>${c.name}</option>`).join('')}
          </select>
        </td>
        <td contenteditable="true">${p.price}</td>
        <td contenteditable="true">${p.qty}</td>
        <td>
          <button class="updateProdBtn">Update</button>
          <button class="deleteProdBtn">Delete</button>
        </td>
      </tr>
    `);
  });
}

// Add Product
$('#addProductBtn').click(async () => {
  const title = $('#productTitle').val().trim();
  const des = $('#productDesc').val().trim();
  const price = parseInt($('#productPrice').val());
  const qty = parseInt($('#productQty').val());
  const cat_id = $('#productCat').val();
  const image = $('#productImage').val().trim(); // NEW

  if (!title || !des || !price || !qty || !cat_id) return alert("Fill all product fields");

  await addDocument("products", { title, des, price, qty, cat_id, image }); // Include image
  $('#productTitle,#productDesc,#productPrice,#productQty,#productImage').val(''); // Clear input
  await loadProducts();
});

// Update Product
$(document).on('click', '.updateProdBtn', async function() {
  const row = $(this).closest('tr');
  const id = row.data('id');
  const title = row.find('td:eq(0)').text().trim();
  const des = row.find('td:eq(1)').text().trim();
  const cat_id = row.find('select').val();
  const price = parseInt(row.find('td:eq(3)').text());
  const qty = parseInt(row.find('td:eq(4)').text());
  const image = prompt("Enter new image URL:", row.find('td:eq(5)').text()) || ""; // optional

  if(!title || !des || !cat_id || !price || !qty) return alert("Invalid product data");

  await updateDocument("products", id, { title, des, cat_id, price, qty, image });
  await loadProducts();
});


// Delete Product without confirmation
$(document).on('click', '.deleteProdBtn', async function() {
  const id = $(this).closest('tr').data('id');
  await deleteDocument("products", id);
  await loadProducts();
});


// --------- Customers CRUD ---------
async function loadCustomers() {
  const customers = await getDocuments("customers");
  const tbody = $('#customerTable tbody');
  tbody.empty();

  customers.forEach(c => {
    tbody.append(`
      <tr data-id="${c.id}">
        <td>${c.name}</td>
        <td>${c.email}</td>
        <td contenteditable="true">${c.creditLimit}</td>
        <td>${c.creditUsed || 0}</td>
        <td>
          <button class="updateCustomerBtn">Update</button>
          <button class="deleteCustomerBtn">Delete</button>
        </td>
      </tr>
    `);
  });
}

$(document).on('click', '.updateCustomerBtn', async function() {
  const row = $(this).closest('tr');
  const id = row.data('id');
  const creditLimit = parseFloat(row.find('td:eq(2)').text());
  if(isNaN(creditLimit) || creditLimit < 0) return alert("Invalid credit limit");
  await updateDocument("customers", id, { creditLimit });
  await loadCustomers();
});

$(document).on('click', '.deleteCustomerBtn', async function() {
  const id = $(this).closest('tr').data('id');
  await deleteDocument("customers", id);
  await loadCustomers();
});

// --------- Initialize ---------
$(document).ready(async () => {
  await loadCategories();
  await loadProducts();
  await loadCustomers();
});
