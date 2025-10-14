// firebase.js

// --------- Firebase Configuration ---------
const PROJECT_ID = "shopnfinity"; // your project ID
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// --------- Get idToken from session ---------
function getIdToken() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  return user?.idToken || "";
}

// --------- Helper: Convert JS object to Firestore fields ---------
function toFirestoreFields(obj) {
  const fields = {};
  for (let key in obj) {
    if (typeof obj[key] === "number") fields[key] = { integerValue: obj[key] };
    else fields[key] = { stringValue: obj[key] };
  }
  return fields;
}

// --------- Fetch documents from collection ---------
async function getDocuments(collection) {
  const res = await fetch(`${BASE_URL}/${collection}`, {
    headers: { Authorization: `Bearer ${getIdToken()}` }
  });
  const data = await res.json();
  if (!data.documents) return [];

  return data.documents.map(doc => {
    const fields = {};
    for (let key in doc.fields) {
      const val = doc.fields[key];
      if (val.stringValue !== undefined) fields[key] = val.stringValue;
      else if (val.integerValue !== undefined) fields[key] = parseInt(val.integerValue);
      else fields[key] = val;
    }
    return { id: doc.name.split("/").pop(), ...fields };
  });
}

// --------- Add document ---------
async function addDocument(collection, obj) {
  const body = { fields: toFirestoreFields(obj) };
  const res = await fetch(`${BASE_URL}/${collection}`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getIdToken()}`
    },
    body: JSON.stringify(body)
  });
  return await res.json();
}

// --------- Update document ---------
async function updateDocument(collection, docId, obj) {
  const fields = toFirestoreFields(obj);
  const updateMask = Object.keys(obj).map(f => `updateMask.fieldPaths=${f}`).join("&");
  const res = await fetch(`${BASE_URL}/${collection}/${docId}?${updateMask}`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getIdToken()}`
    },
    body: JSON.stringify({ fields })
  });
  return await res.json();
}

// --------- Delete document ---------
async function deleteDocument(collection, docId) {
  const res = await fetch(`${BASE_URL}/${collection}/${docId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getIdToken()}` }
  });
  return await res.json();
}
