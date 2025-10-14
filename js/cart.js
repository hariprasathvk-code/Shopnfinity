// js/cart.js

// Check login
const user = JSON.parse(sessionStorage.getItem("user"));
if (!user) window.location.href = "index.html";

$('#userName').text(`Hello, ${user.name}`);

// Logout
$('#logoutBtn').click(() => {
  sessionStorage.clear();
  window.location.href = "index.html";
});

// Load cart from sessionStorage
let cart = JSON.parse(sessionStorage.getItem("cart")) || [];

function renderCart() {
  const container = $('#cartContainer');
  container.empty();

  if (cart.length === 0) {
    container.html('<p>Your cart is empty.</p>');
    $('#totalItems').text(0);
    $('#totalAmount').text(0);
    return;
  }

  let totalAmount = 0;
  let totalItems = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    totalAmount += itemTotal;
    totalItems += item.qty;

    container.append(`
      <div class="cart-item" data-index="${index}">
        <h3>${item.title}</h3>
        <p>Price: ₹${item.price}</p>
        <label>Qty:</label>
        <input type="number" min="1" value="${item.qty}" class="itemQty" />
        <p>Subtotal: ₹<span class="itemSubtotal">${itemTotal}</span></p>
        <button class="removeItemBtn">Remove</button>
      </div>
    `);
  });

  $('#totalItems').text(totalItems);
  $('#totalAmount').text(totalAmount);
}

// Update quantity
$(document).on('input', '.itemQty', function () {
  const index = $(this).closest('.cart-item').data('index');
  const newQty = parseInt($(this).val());
  if (newQty <= 0) return alert("Quantity must be at least 1");
  cart[index].qty = newQty;
  sessionStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
});

// Remove item
$(document).on('click', '.removeItemBtn', function () {
  const index = $(this).closest('.cart-item').data('index');
  cart.splice(index, 1);
  sessionStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
});

// Checkout
$('#checkoutBtn').click(() => {
  if (cart.length === 0) return alert("Cart is empty!");

  const paymentMethod = $('#paymentMethod').val();
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (paymentMethod === 'credit') {
    const customer = JSON.parse(sessionStorage.getItem("user"));
    const creditLimit = 1000; // Example, you can make dynamic later
    const creditUsed = sessionStorage.getItem("creditUsed") || 0;
    if (totalAmount + parseInt(creditUsed) > creditLimit) {
      return alert(`Credit limit exceeded! Max: ₹${creditLimit}`);
    }
    sessionStorage.setItem("creditUsed", parseInt(creditUsed) + totalAmount);
  }

  // Save order to sessionStorage (simulate Firebase order)
  let orders = JSON.parse(sessionStorage.getItem("orders")) || [];
  const newOrder = {
    id: "order_" + Date.now(),
    items: cart,
    totalAmount,
    paymentMethod,
    date: new Date().toLocaleString()
  };
  orders.push(newOrder);
  sessionStorage.setItem("orders", JSON.stringify(orders));

  // Clear cart
  cart = [];
  sessionStorage.setItem("cart", JSON.stringify(cart));
  alert("Order placed successfully!");
  renderCart();
});

// Initial render
renderCart();
