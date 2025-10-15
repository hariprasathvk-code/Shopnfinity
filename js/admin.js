
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
        <td class="catName" contenteditable="false">${c.name}</td>
        <td>
          <button class="editCategory">Edit</button>
          <button class="saveCategory" style="display:none;">Save</button>
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

// Add new category
$('#addCategoryBtn').click(async () => {
  const name = $('#newCategory').val().trim();
  if (!name) return alert("Enter category name");
  await addDocument("categories", { name });
  $('#newCategory').val('');
  await loadCategories();
});

// Enable editing
$(document).on('click', '.editCategory', function() {
  const row = $(this).closest('tr');
  row.find('.catName').attr('contenteditable', 'true').focus();
  row.find('.editCategory').hide();
  row.find('.saveCategory').show();
});

// Save after editing
$(document).on('click', '.saveCategory', async function() {
  const row = $(this).closest('tr');
  const id = row.data('id');
  const newName = row.find('.catName').text().trim();
  if (!newName) return alert("Category name cannot be empty");

  await updateDocument("categories", id, { name: newName });

  row.find('.catName').attr('contenteditable', 'false');
  row.find('.saveCategory').hide();
  row.find('.editCategory').show();
  await loadCategories();
});

// Delete category
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
        <td class="prodTitle" contenteditable="false">${p.title}</td>
        <td class="prodDes" contenteditable="false">${p.des}</td>
        <td>
          <select class="prodCatSelect" disabled>
            ${categories.map(c => 
              `<option value="${c.name}" ${c.name === p.cat_id ? "selected" : ""}>${c.name}</option>`
            ).join('')}
          </select>
        </td>
        <td class="prodPrice" contenteditable="false">${p.price}</td>
        <td class="prodQty" contenteditable="false">${p.qty}</td>
        <td class="prodImage" contenteditable="false">${p.image || ""}</td>
        <td>
          <button class="editProdBtn">Edit</button>
          <button class="saveProdBtn" style="display:none;">Save</button>
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
  const price = parseFloat($('#productPrice').val());
  const qty = parseInt($('#productQty').val());
  const cat_id = $('#productCat').val();
  const image = $('#productImage').val().trim();

  if (!title || !des || !price || !qty || !cat_id) {
    return alert("Fill all product fields");
  }

  await addDocument("products", { title, des, cat_id, price, qty, image });

  $('#productTitle,#productDesc,#productPrice,#productQty,#productImage').val('');
  await loadProducts();
});

// Enable editing when "Edit" is clicked
$(document).on('click', '.editProdBtn', function () {
  const row = $(this).closest('tr');
  row.find('[contenteditable="false"]').attr('contenteditable', 'true');
  row.find('select').prop('disabled', false);
  $(this).hide();
  row.find('.saveProdBtn').show();
});

// Save updates
$(document).on('click', '.saveProdBtn', async function () {
  const row = $(this).closest('tr');
  const id = row.data('id');
  const title = row.find('.prodTitle').text().trim();
  const des = row.find('.prodDes').text().trim();
  const cat_id = row.find('select').val();
  const price = parseFloat(row.find('.prodPrice').text());
  const qty = parseInt(row.find('.prodQty').text());
  const image = row.find('.prodImage').text().trim();

  if (!title || !des || !cat_id || isNaN(price) || isNaN(qty)) {
    alert("Invalid product data");
    return;
  }

  await updateDocument("products", id, { title, des, cat_id, price, qty, image });

  row.find('[contenteditable="true"]').attr('contenteditable', 'false');
  row.find('select').prop('disabled', true);
  row.find('.saveProdBtn').hide();
  row.find('.editProdBtn').show();

  await loadProducts();
});

// Delete Product
$(document).on('click', '.deleteProdBtn', async function () {
  const id = $(this).closest('tr').data('id');
  await deleteDocument("products", id);
  await loadProducts();
});

// --------- Users CRUD ---------
async function fetchAllUsers() {
  try {
    const res = await fetch(`${BASE_URL}/users`, { // REST endpoint
      headers: { Authorization: `Bearer ${user.idToken}` }
    });
    const data = await res.json();
    if (!data.documents) return [];

    return data.documents.map(doc => {
      const fields = doc.fields || {};
      return {
        id: doc.name.split("/").pop(), // document ID
        email: fields.email?.stringValue || "",
        name: fields.name?.stringValue || "",
        photo: fields.photo?.stringValue || "",
        uid: fields.uid?.stringValue || ""
      };
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return [];
  }
}


async function renderAdminUsers() {
  const users = await fetchAllUsers();
  const tbody = $('#usersTable tbody');
  tbody.empty();

  if (users.length === 0) {
    tbody.append('<tr><td colspan="5">No users found</td></tr>');
    return;
  }

  users.forEach(u => {
    tbody.append(`
      <tr data-id="${u.id}">
        <td><img src="${u.photo || 'https://via.placeholder.com/50'}" alt="photo" style="width:50px; height:50px; border-radius:50%;"></td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.uid}</td>
        <td><button class="deleteUserBtn">Delete</button></td>
      </tr>
    `);
  });
}

// Initialize users section
$(document).ready(async () => {
  if ($('#usersTable').length) await renderAdminUsers();
});

// Delete User
$(document).on('click', '.deleteUserBtn', async function() {
  const id = $(this).closest('tr').data('id');
  const confirmDelete = confirm("Are you sure you want to delete this user?");
  if (!confirmDelete) return;

  try {
    await fetch(`${BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.idToken}`
      }
    });
    alert("User deleted successfully!");
    await renderAdminUsers(); // Refresh the users list
  } catch (err) {
    console.error("Error deleting user:", err);
    alert("Failed to delete user");
  }
});


// --------- Orders CRUD for Admin ---------
async function fetchAllOrders() {
  try {
    const res = await fetch(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${user.idToken}` }
    });
    const data = await res.json();
    if (!data.documents) return [];

    return data.documents.map(doc => {
      const fields = doc.fields || {};
      const items = (fields.items?.arrayValue?.values || []).map(i => {
        const itemFields = i.mapValue.fields;
        return {
          title: itemFields.title?.stringValue || '',
          qty: parseInt(itemFields.qty?.integerValue || 0)
        };
      });

      return {
        id: doc.name.split("/").pop(),
        userEmail: fields.userEmail?.stringValue || '',
        date: fields.date?.stringValue || '',
        totalAmount: parseFloat(fields.totalAmount?.doubleValue || fields.totalAmount?.integerValue || 0),
        paymentMethod: fields.paymentMethod?.stringValue || '',
        status: fields.status?.stringValue || 'Pending',
        items
      };
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return [];
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await fetch(`${BASE_URL}/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.idToken}`
      },
      body: JSON.stringify({ fields: toFirestoreFields({ status }) })
    });
    alert("Order status updated!");
    await renderAdminOrders();
  } catch (err) {
    console.error("Error updating order:", err);
  }
}

async function renderAdminOrders() {
  const orders = await fetchAllOrders();
  const tbody = $('#adminOrderTable tbody');
  tbody.empty();

  if (orders.length === 0) {
    tbody.append('<tr><td colspan="8">No orders found</td></tr>');
    return;
  }

  orders.forEach(o => {
    const productsList = o.items.map(i => `${i.title} (x${i.qty})`).join(", ");
    tbody.append(`
      <tr data-id="${o.id}">
        <td>${o.id}</td>
        <td>${o.userEmail}</td>
        <td>${o.date}</td>
        <td>₹${o.totalAmount}</td>
        <td>${o.paymentMethod}</td>
        <td>${productsList}</td>
        <td class="orderStatus">${o.status}</td>
        <td>
          <select class="statusSelect">
            <option value="Pending" ${o.status === "Pending" ? "selected" : ""}>Pending</option>
            <option value="Shipped" ${o.status === "Shipped" ? "selected" : ""}>Shipped</option>
            <option value="Delivered" ${o.status === "Delivered" ? "selected" : ""}>Delivered</option>
          </select>
          <button class="updateStatusBtn">Update</button>
        </td>
      </tr>
    `);
  });
}

// Handle status update click
$(document).on('click', '.updateStatusBtn', async function() {
  const row = $(this).closest('tr');
  const orderId = row.data('id');
  const status = row.find('select.statusSelect').val();
  await updateOrderStatus(orderId, status);
});

// --------- Search ---------
$('#searchCategory').on('keyup', function() {
  const query = $(this).val().toLowerCase();
  $('#categoriesTable tbody tr').each(function() {
    const name = $(this).find('td:first').text().toLowerCase();
    $(this).toggle(name.includes(query));
  });
});

$('#searchProduct').on('keyup', function() {
  const query = $(this).val().toLowerCase();
  $('#productTable tbody tr').each(function() {
    const title = $(this).find('td:first').text().toLowerCase();
    const des = $(this).find('td:eq(1)').text().toLowerCase();
    const category = $(this).find('select').val()?.toLowerCase() || '';
    $(this).toggle(title.includes(query) || des.includes(query) || category.includes(query));
  });
});

// --------- Initialize ---------
$(document).ready(async () => {
  await loadCategories();
  await loadProducts();
  await loadCustomers();
  if ($('#adminOrderTable').length) await renderAdminOrders();
});


//------reports

async function fetchAllUsers() {
  try {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${user.idToken}` }
    });
    const data = await res.json();
    if (!data.documents) return [];

    return data.documents.map(doc => {
      const fields = {};
      for (let key in doc.fields) {
        const val = doc.fields[key];
        fields[key] = val.stringValue ?? '';
      }
      return { id: doc.name.split("/").pop(), ...fields };
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return [];
  }
}


//product report
async function fetchAllProducts() {
  try {
    const res = await fetch(`${BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${user.idToken}` }
    });
    const data = await res.json();
    if (!data.documents) return [];

    return data.documents.map(doc => {
      const fields = {};
      for (let key in doc.fields) {
        const val = doc.fields[key];
        if (val.stringValue !== undefined) fields[key] = val.stringValue;
        else if (val.integerValue !== undefined) fields[key] = parseInt(val.integerValue);
        else if (val.doubleValue !== undefined) fields[key] = parseFloat(val.doubleValue);
      }
      return { id: doc.name.split("/").pop(), ...fields };
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    return [];
  }
}


//sales report
async function fetchAllOrders() {
  try {
    const res = await fetch(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${user.idToken}` }
    });
    const data = await res.json();
    if (!data.documents) return [];

    return data.documents.map(doc => {
      const fields = {};
      for (let key in doc.fields) {
        const val = doc.fields[key];
        if (val.stringValue !== undefined) fields[key] = val.stringValue;
        else if (val.integerValue !== undefined) fields[key] = parseInt(val.integerValue);
        else if (val.doubleValue !== undefined) fields[key] = parseFloat(val.doubleValue);
        else if (val.arrayValue) {
          fields[key] = val.arrayValue.values.map(v => {
            const obj = {};
            for (let k in v.mapValue.fields) {
              const fv = v.mapValue.fields[k];
              obj[k] = fv.stringValue ?? parseInt(fv.integerValue ?? fv.doubleValue ?? 0);
            }
            return obj;
          });
        }
      }
      return { id: doc.name.split("/").pop(), ...fields };
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return [];
  }
}
