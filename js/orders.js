const user = JSON.parse(sessionStorage.getItem("user"));
if (!user) {
  alert("Please login first!");
  window.location.href = "index.html";
}

// Firestore base
const PROJECT_ID = "shopnfinity";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Helper: Convert JS object to Firestore fields
function toFirestoreFields(obj) {
  const fields = {};
  for (let key in obj) {
    if (typeof obj[key] === "number") fields[key] = { integerValue: obj[key] };
    else if (typeof obj[key] === "string") fields[key] = { stringValue: obj[key] };
    else if (Array.isArray(obj[key])) {
      fields[key] = {
        arrayValue: {
          values: obj[key].map(item => ({ mapValue: { fields: toFirestoreFields(item) } }))
        }
      };
    }
  }
  return fields;
}

// Helper: Parse Firestore document
function parseFirestoreDoc(doc) {
  const fields = {};
  for (let key in doc.fields) {
    const val = doc.fields[key];
    if (val.stringValue !== undefined) fields[key] = val.stringValue;
    else if (val.integerValue !== undefined) fields[key] = parseInt(val.integerValue);
    else if (val.arrayValue !== undefined) {
      fields[key] = val.arrayValue.values.map(v => {
        const subFields = {};
        for (let k in v.mapValue.fields) {
          const subVal = v.mapValue.fields[k];
          subFields[k] = subVal.stringValue ?? parseInt(subVal.integerValue ?? 0);
        }
        return subFields;
      });
    }
  }
  return { id: doc.name.split("/").pop(), ...fields };
}

// Fetch orders for current user
async function fetchOrdersFromDB() {
  try {
    const res = await fetch(`${BASE_URL}/users/${user.uid}/orders`, {
      headers: { Authorization: `Bearer ${user.idToken}` }
    });
    const data = await res.json();
    if (!data.documents) return [];
    return data.documents.map(parseFirestoreDoc);
  } catch (err) {
    console.error("Error fetching orders:", err);
    return [];
  }
}

// Render order history
async function renderOrderHistory() {
  const orders = await fetchOrdersFromDB();
  const tbody = $('#orderTable tbody');
  tbody.empty();

  if (orders.length === 0) {
    tbody.append('<tr><td colspan="6" style="text-align:center;">No orders found</td></tr>');
    return;
  }

  orders.forEach(o => {
    const productsList = o.items.map(i => `${i.title} (x${i.qty})`).join(", ");
    tbody.append(`
      <tr>
        <td>${o.id}</td>
        <td>${o.date}</td>
        <td>₹${o.totalAmount}</td>
        <td>${o.paymentMethod}</td>
        <td>${productsList}</td>
        <td>${o.status || "Pending"}</td>
      </tr>
    `);
  });
}

// Back to Home button
$('#backHome').click(() => {
  window.location.href = "home.html";
});

// Initial load
$(document).ready(async () => {
  await renderOrderHistory();
});
