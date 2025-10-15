const user = JSON.parse(sessionStorage.getItem("user"));
if (!user) window.location.href = "index.html";

let cart = [];

// Firestore base
const PROJECT_ID = "shopnfinity";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Helper: Convert JS object to Firestore fields
function toFirestoreFields(obj) {
  const fields = {};
  for (let key in obj) {
    if (typeof obj[key] === "number") fields[key] = { integerValue: obj[key] };
    else fields[key] = { stringValue: obj[key] };
  }
  return fields;
}

// --------- Firestore Helpers ---------

// Fetch cart for current user
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

// Add or update cart item in Firestore
// Add or update cart item in Firestore (robust)
async function updateCartItemInDB(item) {
  const docUrl = `${BASE_URL}/users/${user.uid}/cart/${item.id}`;
  const body = { fields: toFirestoreFields(item) };

  try {
    // Try PATCH first (update existing document)
    await fetch(`${docUrl}?currentDocument.exists=true`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.idToken}`
      },
      body: JSON.stringify(body)
    });
  } catch (err) {
    // If PATCH fails (document doesn't exist), create it with POST
    try {
      await fetch(`${BASE_URL}/users/${user.uid}/cart?documentId=${item.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.idToken}`
        },
        body: JSON.stringify(body)
      });
    } catch (err2) {
      console.error("Error creating cart item in DB:", err2);
    }
  }
}


// Remove cart item from Firestore
async function removeCartItemFromDB(itemId) {
  try {
    await fetch(`${BASE_URL}/users/${user.uid}/cart/${itemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user.idToken}` }
    });
  } catch (err) {
    console.error("Error deleting cart item from DB:", err);
  }
}

// --------- Cart Functions ---------

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
$(document).on("click", ".increaseQty", async function () {
  const index = $(this).closest(".cart-item").data("index");
  cart[index].qty += 1;
  renderCart();
  await updateCartItemInDB(cart[index]);
});

// Quantity decrease
$(document).on("click", ".decreaseQty", async function () {
  const index = $(this).closest(".cart-item").data("index");
  if (cart[index].qty > 1) {
    cart[index].qty -= 1;
    await updateCartItemInDB(cart[index]);
  } else {
    await removeCartItemFromDB(cart[index].id);
    cart.splice(index, 1);
  }
  renderCart();
});

// Remove item
$(document).on("click", ".remove-btn", async function () {
  const index = $(this).closest(".cart-item").data("index");
  await removeCartItemFromDB(cart[index].id);
  cart.splice(index, 1);
  renderCart();
});

// Checkout
$("#checkoutBtn").click(async () => {
  const paymentMethod = $("#paymentMethod").val();
  if (cart.length === 0) return alert("Your cart is empty!");
  
  alert(`Order placed successfully using ${paymentMethod.toUpperCase()} payment!`);

  // Clear cart both locally and in DB
  for (let item of cart) {
    await removeCartItemFromDB(item.id);
  }
  cart = [];
  sessionStorage.removeItem("cart");
  renderCart();
});

// Logout
$("#logoutBtn").click(() => {
  sessionStorage.clear();
  window.location.href = "index.html";
});

// Initial load: fetch cart from DB
$(document).ready(async () => {
  $("#userName").text(`Hello, ${user.name}`);
  cart = await fetchCartFromDB();
  renderCart();
});
