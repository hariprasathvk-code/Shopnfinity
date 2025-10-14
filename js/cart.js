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
  window.location.href = "login.html";
});

// Initial render
$(document).ready(() => {
  renderCart();
});
