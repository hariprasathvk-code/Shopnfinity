const user = JSON.parse(sessionStorage.getItem("user"));
if (!user) window.location.href = "index.html";

$('#userName').text(`Hello, ${user.name}`);

// Logout
$('#logoutBtn').click(() => {
  sessionStorage.clear();
  window.location.href = "index.html";
});

// My Orders
$('#viewOrdersBtn').click(() => {
  window.location.href = "orders.html";
});

// Cart
$('#cartBtn').click(() => {
  window.location.href = "cart.html";
});

// Pagination
let products = [];
let currentPage = 1;
const pageSize = 10;

//  Firestore Helper 
const PROJECT_ID = "shopnfinity";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function getIdToken() {
  return user?.idToken || "";
}

function parseFirestoreDoc(doc) {
  const fields = {};
  for (let key in doc.fields) {
    const val = doc.fields[key];
    if (val.stringValue !== undefined) fields[key] = val.stringValue;
    else if (val.integerValue !== undefined) fields[key] = parseInt(val.integerValue);
    else fields[key] = val;
  }
  return { id: doc.name.split("/").pop(), ...fields };
}

async function getDocuments(collection) {
  const res = await fetch(`${BASE_URL}/${collection}`, {
    headers: { Authorization: `Bearer ${getIdToken()}` }
  });
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents.map(parseFirestoreDoc);
}

// Firestore: fetch user's cart
async function fetchCartFromDB() {
  try {
    const res = await fetch(`${BASE_URL}/users/${user.uid}/cart`, {
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
      }
      return { id: doc.name.split("/").pop(), ...fields };
    });
  } catch (err) {
    console.error("Error fetching cart from DB:", err);
    return [];
  }
}

// Firestore: add/update cart item
async function updateCartItemInDB(item) {
  try {
    await fetch(`${BASE_URL}/users/${user.uid}/cart/${item.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.idToken}`
      },
      body: JSON.stringify({ fields: toFirestoreFields(item) })
    });
  } catch (err) {
    console.error("Error updating cart in DB:", err);
  }
}

// Helper: convert JS object to Firestore fields
function toFirestoreFields(obj) {
  const fields = {};
  for (let key in obj) {
    if (typeof obj[key] === "number") fields[key] = { integerValue: obj[key] };
    else fields[key] = { stringValue: obj[key] };
  }
  return fields;
}

// Load Categories
async function fetchCategories() {
  const categories = await getDocuments("categories");
  const select = $('#categorySelect');
  select.empty().append('<option value="">All</option>');
  categories.forEach(c => select.append(`<option value="${c.name}">${c.name}</option>`));
}

// Load Products 
async function fetchProducts(category = "") {
  let allProducts = await getDocuments("products");

  // Only active products
  products = allProducts.filter(p => p.active !== "false");

  if (category) {
    products = products.filter(p => p.cat_id === category);
  }

  currentPage = 1;
  renderProducts();
}

// Render Products with Pagination 
function renderProducts(list = products) {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageProducts = list.slice(start, end);

  const container = $('#productList');
  container.empty();

  if (pageProducts.length === 0) {
    container.html('<p>No products found.</p>');
    $('#pageInfo').text('');
    return;
  }

  pageProducts.forEach(p => {
    container.append(`
      <div class="product-card">
        <img src="${p.image || 'assets/google-icon.png'}" alt="${p.title}" />
        <h3>${p.title}</h3>
        <p>${p.des || p.description}</p>
        <p>Price: ₹${p.price}</p>
        <p>Stock: ${p.qty}</p>
        <input type="number" min="1" max="${p.qty}" value="1" id="qty_${p.id}" />
        <button onclick="addToCart('${p.id}')">Add to Cart</button>
      </div>
    `);
  });

  const totalPages = Math.ceil(list.length / pageSize);
  $('#pageInfo').text(`Page ${currentPage} of ${totalPages}`);
}

//  Pagination Buttons
$('#prevPage').click(() => {
  if (currentPage > 1) {
    currentPage--;
    renderProducts();
  }
});
$('#nextPage').click(() => {
  const totalPages = Math.ceil(products.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    renderProducts();
  }
});

// Category Filter
$('#categorySelect').change(() => {
  const category = $('#categorySelect').val();
  fetchProducts(category);
});

// Cart Functions
function updateCartCount() {
  const cart = JSON.parse(sessionStorage.getItem("cart")) || [];
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  $('#cartCount').text(total);
}

async function addToCart(productId) {
  const qty = parseInt($(`#qty_${productId}`).val());
  if (qty <= 0) return alert("Quantity must be at least 1");

  let cart = JSON.parse(sessionStorage.getItem("cart")) || [];
  const existing = cart.find(item => item.id === productId);
  const product = products.find(p => p.id === productId);

  if (!product) return alert("Product not found!");

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      qty,
      description: product.des || product.description || "",
      image: product.image || "https://via.placeholder.com/150"
    });
  }

  sessionStorage.setItem("cart", JSON.stringify(cart));
  alert(`${qty} ${product.title} added to cart`);
  updateCartCount();

  // Sync with Firestor
  for (let item of cart) {
    await updateCartItemInDB(item);
  }
}

//  Initial Load 
$(document).ready(async () => {
  await fetchCategories();
  await fetchProducts();
  
  // Load user cart from Firestore and merge with sessionStorage
  const dbCart = await fetchCartFromDB();
  const sessionCart = JSON.parse(sessionStorage.getItem("cart")) || [];

  // Merge carts (Firestore cart overrides sessionStorage if conflict)
  const mergedCart = [...sessionCart];
  for (let dbItem of dbCart) {
    const existing = mergedCart.find(i => i.id === dbItem.id);
    if (existing) {
      existing.qty = dbItem.qty;
    } else {
      mergedCart.push(dbItem);
    }
  }

  sessionStorage.setItem("cart", JSON.stringify(mergedCart));
  updateCartCount();
});

async function placeOrder(userEmail, paymentMethod) {
  const cart = JSON.parse(sessionStorage.getItem("cart")) || [];
  if (cart.length === 0) return alert("Cart is empty!");

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const date = new Date().toISOString(); // or format as needed

  // Prepare Firestore fields
  const orderData = {
    userEmail,
    date,
    totalAmount,
    paymentMethod,
    status: "Pending",
    items: cart.map(item => ({
      title: item.title,
      qty: item.qty,
      price: item.price
    }))
  };

  try {
    await addDocument("orders", orderData); // Save in Firestore
    alert("Order placed successfully!");
    sessionStorage.removeItem("cart"); // Clear cart
    updateCartCount();
  } catch (err) {
    console.error("Error placing order:", err);
    alert("Failed to place order!");
  }
}


$('#searchProduct').on('input', function() {
  const query = $(this).val().toLowerCase();

  const filtered = products.filter(p => {
    const title = p.title.toLowerCase();
    const des = (p.des || p.description || "").toLowerCase();
    const category = (p.cat_id || "").toLowerCase();
    return title.includes(query) || des.includes(query) || category.includes(query);
  });

  currentPage = 1; // Reset pagination
  renderProducts(filtered);
});

