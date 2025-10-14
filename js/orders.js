// js/orders.js

// Check login
//const user = JSON.parse(sessionStorage.getItem("user"));
//if (!user) {
  //alert("Please login first!");
  //window.location.href = "index.html";
//}

// Back to Home
$('#backHome').click(() => {
  window.location.href = "home.html";
});

// Load cart
let cart = JSON.parse(sessionStorage.getItem("cart")) || [];

function renderCart() {
  const tbody = $('#cartTable tbody');
  tbody.empty();
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    tbody.append(`
      <tr data-index="${index}">
        <td>${item.title}</td>
        <td>${item.cat_id}</td>
        <td>₹${item.price}</td>
        <td contenteditable="true">${item.qty}</td>
        <td>₹${itemTotal}</td>
        <td><button class="removeItem">Remove</button></td>
      </tr>
    `);
  });

  $('#cartTotal').text(total);
  sessionStorage.setItem("cart", JSON.stringify(cart));
}

$(document).on('input', '#cartTable td[contenteditable]', function() {
  const index = $(this).closest('tr').data('index');
  let qty = parseInt($(this).text());
  if (isNaN(qty) || qty < 1) qty = 1;
  cart[index].qty = qty;
  renderCart();
});

$(document).on('click', '.removeItem', function() {
  const index = $(this).closest('tr').data('index');
  cart.splice(index, 1);
  renderCart();
});

renderCart();

// Place Order
$('#placeOrderBtn').click(() => {
  if(cart.length===0) return alert("Cart is empty!");
  
  const paymentMethod = $('#paymentMethod').val();
  const totalAmount = cart.reduce((sum,item)=>sum+item.price*item.qty,0);
  
  if(paymentMethod==='credit' && totalAmount > user.creditLimit - (user.creditUsed||0)) {
    return alert("Not enough credit limit!");
  }

  // Update user credit if credit payment
  if(paymentMethod==='credit'){
    user.creditUsed = (user.creditUsed||0)+totalAmount;
    sessionStorage.setItem("user", JSON.stringify(user));
  }

  // Generate Order
  const orders = JSON.parse(sessionStorage.getItem("orders")) || [];
  const orderId = "ORD"+(orders.length+1).toString().padStart(4,'0');
  const date = new Date().toLocaleString();

  const order = {
    id: orderId,
    userEmail: user.email,
    items: cart,
    totalAmount,
    paymentMethod,
    date
  };
  orders.push(order);
  sessionStorage.setItem("orders", JSON.stringify(orders));

  // Reduce product stock
  let products = JSON.parse(sessionStorage.getItem("products")) || [];
  cart.forEach(item => {
    const prod = products.find(p=>p.title===item.title);
    if(prod) prod.qty -= item.qty;
  });
  sessionStorage.setItem("products", JSON.stringify(products));

  alert(`Order placed successfully! Order ID: ${orderId}`);
  cart = [];
  sessionStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
  renderOrderHistory();
});

// Render Order History
function renderOrderHistory() {
  const orders = JSON.parse(sessionStorage.getItem("orders")) || [];
  const tbody = $('#orderTable tbody');
  tbody.empty();

  const userOrders = orders.filter(o=>o.userEmail===user.email);
  userOrders.forEach(o => {
    const productsList = o.items.map(i=>`${i.title} (x${i.qty})`).join(", ");
    tbody.append(`
      <tr>
        <td>${o.id}</td>
        <td>${o.date}</td>
        <td>₹${o.totalAmount}</td>
        <td>${o.paymentMethod}</td>
        <td>${productsList}</td>
      </tr>
    `);
  });
}

renderOrderHistory();
