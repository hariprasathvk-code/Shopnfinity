// cart.js

let cart = JSON.parse(sessionStorage.getItem("cart")) || [];

// Render the cart items
function renderCart() {
  const container = $("#cartContainer");
  container.empty();

  if (cart.length === 0) {
    container.html(`<h3 style="text-align:center; color:#555;">Your cart is empty</h3>`);
    $(".cart-summary").hide();
    return;
  }

  $(".cart-summary").show();

  cart.forEach((item, index) => {
    container.append(`
      <div class="cart-item" data-index="${index}">
        <img src="${item.image || 'https://via.placeholder.com/100'}" alt="${item.title}">
        <div class="item-details">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <p class="price">₹${item.price}</p>

          <div class="quantity-controls">
            <button class="decreaseQty">-</button>
            <span>${item.qty}</span>
            <button class="increaseQty">+</button>
          </div>

          <button class="remove-btn">REMOVE</button>
        </div>
      </div>
    `);
  });

  updateSummary();
}

// Update summary (price & totals)
function updateSummary() {
  let totalItems = 0;
  let totalAmount = 0;

  cart.forEach(item => {
    totalItems += item.qty;
    totalAmount += item.price * item.qty;
  });

  $("#totalItems").text(totalItems);
  $("#totalAmount").text(totalAmount.toFixed(2));
  $("#finalAmount").text(totalAmount.toFixed(2));

  sessionStorage.setItem("cart", JSON.stringify(cart));
}

// Quantity increase
$(document).on("click", ".increaseQty", function () {
  const index = $(this).closest(".cart-item").data("index");
  cart[index].qty += 1;
  renderCart();
});

// Quantity decrease
$(document).on("click", ".decreaseQty", function () {
  const index = $(this).closest(".cart-item").data("index");
  if (cart[index].qty > 1) {
    cart[index].qty -= 1;
  } else {
    cart.splice(index, 1); // Remove if quantity goes to 0
  }
  renderCart();
});

// Remove item
$(document).on("click", ".remove-btn", function () {
  const index = $(this).closest(".cart-item").data("index");
  cart.splice(index, 1);
  renderCart();
});

// Checkout
$("#checkoutBtn").click(() => {
  const paymentMethod = $("#paymentMethod").val();
  if (cart.length === 0) return alert("Your cart is empty!");

  // You can later push this to Firebase orders collection
  alert(`Order placed successfully using ${paymentMethod.toUpperCase()} payment!`);

  cart = [];
  sessionStorage.removeItem("cart");
  renderCart();
});

// Logout
$("#logoutBtn").click(() => {
  sessionStorage.clear();
  window.location.href = "index.html";
});

// Initial render
$(document).ready(() => {
  renderCart();
});

/*
// cart.js

const FIREBASE_PROJECT_ID = "shopnfinity"; // Your Firebase project ID
const FIREBASE_API_KEY = "AIzaSyCCa_hDjwjubm1FXLuGo5YMfRIueoDgUew"; // Your Firebase Web API Key
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

let cart = [];
const user = JSON.parse(sessionStorage.getItem("user"));
if (!user) window.location.href = "index.html";

// ---------------- Helper: parse Firestore cart document ----------------
function parseFirestoreCart(doc) {
  const items = doc.fields?.items?.arrayValue?.values || [];
  return items.map(item => {
    const fields = item.mapValue.fields;
    return {
      id: fields.id.stringValue,
      title: fields.title.stringValue,
      description: fields.description.stringValue,
      price: parseFloat(fields.price.doubleValue || fields.price.integerValue),
      qty: parseInt(fields.qty.integerValue),
      image: fields.image.stringValue
    };
  });
}

// ---------------- Load Cart from Firestore ----------------
async function loadCart() {
  try {
    const res = await fetch(`${BASE_URL}/carts/${user.uid}?key=${FIREBASE_API_KEY}`);
    if (!res.ok) {
      cart = [];
      renderCart();
      return;
    }
    const data = await res.json();
    cart = parseFirestoreCart(data);
    renderCart();
  } catch (err) {
    console.error("Error loading cart:", err);
    cart = [];
    renderCart();
  }
}

// ---------------- Save Cart to Firestore ----------------
async function saveCart() {
  try {
    const firestoreItems = {
      items: {
        arrayValue: {
          values: cart.map(item => ({
            mapValue: {
              fields: {
                id: { stringValue: item.id },
                title: { stringValue: item.title },
                description: { stringValue: item.description },
                price: { doubleValue: item.price },
                qty: { integerValue: item.qty },
                image: { stringValue: item.image }
              }
            }
          }))
        }
      }
    };

    await fetch(`${BASE_URL}/carts/${user.uid}?key=${FIREBASE_API_KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: firestoreItems })
    });
  } catch (err) {
    console.error("Error saving cart:", err);
  }
}

// ---------------- Render Cart ----------------
function renderCart() {
  const container = $("#cartContainer");
  container.empty();

  if (cart.length === 0) {
    container.html(`<h3 style="text-align:center; color:#555;">Your cart is empty</h3>`);
    $(".cart-summary").hide();
    return;
  }

  $(".cart-summary").show();

  cart.forEach((item, index) => {
    container.append(`
      <div class="cart-item" data-index="${index}">
        <img src="${item.image || 'https://via.placeholder.com/100'}" alt="${item.title}">
        <div class="item-details">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <p class="price">₹${item.price}</p>
          <div class="quantity-controls">
            <button class="decreaseQty" style="color:black">-</button>
            <span>${item.qty}</span>
            <button class="increaseQty" style="color:black">+</button>
          </div>
          <button class="remove-btn">REMOVE</button>
        </div>
      </div>
    `);
  });

  updateSummary();
}

// ---------------- Update Summary ----------------
function updateSummary() {
  let totalItems = 0, totalAmount = 0;
  cart.forEach(item => {
    totalItems += item.qty;
    totalAmount += item.price * item.qty;
  });

  $("#totalItems").text(totalItems);
  $("#totalAmount").text(totalAmount.toFixed(2));

  saveCart(); // Save updated cart to Firestore
}

// ---------------- Add to Cart ----------------
async function addToCart(productId) {
  const qty = parseInt($(`#qty_${productId}`).val());
  if (qty <= 0) return alert("Quantity must be at least 1");

  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) existing.qty += qty;
  else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      qty,
      description: product.des || product.description || "",
      image: product.image || "https://via.placeholder.com/150"
    });
  }

  renderCart();
}

// ---------------- Quantity Controls ----------------
$(document).on("click", ".increaseQty", function () {
  const index = $(this).closest(".cart-item").data("index");
  cart[index].qty += 1;
  renderCart();
});
$(document).on("click", ".decreaseQty", function () {
  const index = $(this).closest(".cart-item").data("index");
  if (cart[index].qty > 1) cart[index].qty -= 1;
  else cart.splice(index, 1);
  renderCart();
});

// ---------------- Remove Item ----------------
$(document).on("click", ".remove-btn", function () {
  const index = $(this).closest(".cart-item").data("index");
  cart.splice(index, 1);
  renderCart();
});

// ---------------- Checkout ----------------
$("#checkoutBtn").click(async () => {
  const paymentMethod = $("#paymentMethod").val();
  if (cart.length === 0) return alert("Your cart is empty!");

  // Format order for Firestore
  const firestoreItems = cart.map(item => ({
    mapValue: { fields: {
      id: { stringValue: item.id },
      title: { stringValue: item.title },
      description: { stringValue: item.description },
      price: { doubleValue: item.price },
      qty: { integerValue: item.qty },
      image: { stringValue: item.image }
    }}
  }));

  const order = {
    fields: {
      userEmail: { stringValue: user.email },
      items: { arrayValue: { values: firestoreItems } },
      totalAmount: { doubleValue: cart.reduce((sum, i) => sum + i.price * i.qty, 0) },
      date: { stringValue: new Date().toLocaleString() },
      paymentMethod: { stringValue: paymentMethod }
    }
  };

  await fetch(`${BASE_URL}/orders?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order)
  });

  alert(`Order placed successfully using ${paymentMethod.toUpperCase()}!`);

  cart = [];
  renderCart();
});

// ---------------- Logout ----------------
$("#logoutBtn").click(() => {
  sessionStorage.clear();
  window.location.href = "index.html";
});

// ---------------- Initial Load ----------------
$(document).ready(async () => {
  await loadCart();
});

*/