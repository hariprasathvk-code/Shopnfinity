// js/auth.js

// --- CONFIG ---
const FIREBASE_API_KEY = "AIzaSyCCa_hDjwjubm1FXLuGo5YMfRIueoDgUew";
const FIREBASE_PROJECT_ID = "shopnfinity";
const ADMIN_EMAIL = "hariprasath7112@gmail.com"; // your admin Gmail

// Handle Google Login response
async function handleCredentialResponse(response) {
  try {
    const credential = response.credential;

    // Exchange Google ID token for Firebase token
    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postBody: `id_token=${credential}&providerId=google.com`,
          requestUri: window.location.origin,
          returnIdpCredential: true,
          returnSecureToken: true,
        }),
      }
    );

    const data = await firebaseRes.json();

    if (!data.idToken) {
      alert("Login failed. Please try again.");
      console.error(data);
      return;
    }

    // Save user info in sessionStorage
    const userInfo = {
      email: data.email,
      name: data.displayName,
      photo: data.photoUrl,
      uid: data.localId,
      idToken: data.idToken,
      expiresIn: data.expiresIn,
    };
    sessionStorage.setItem("user", JSON.stringify(userInfo));

    // --- Check if user already exists in Firestore ---
    const userDocUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userInfo.uid}`;
    
    let exists = false;
    try {
      const res = await fetch(userDocUrl, {
        headers: { Authorization: `Bearer ${userInfo.idToken}` }
      });
      if (res.ok) exists = true;
    } catch (err) {
      console.log("User does not exist, creating new document...");
    }

    // --- Create user if not exists ---
    if (!exists) {
      const newUserDoc = {
        email: userInfo.email,
        name: userInfo.name,
        photo: userInfo.photo,
        uid: userInfo.uid
      };

      await fetch(userDocUrl, {
        method: "PATCH", // Creates the document
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.idToken}`
        },
        body: JSON.stringify({ fields: toFirestoreFields(newUserDoc) })
      });
    }

    // Redirect based on role
    if (userInfo.email === ADMIN_EMAIL) {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "home.html";
    }

  } catch (err) {
    console.error("Error during sign-in:", err);
  }
}

// Helper: convert JS object to Firestore fields
function toFirestoreFields(obj) {
  const fields = {};
  for (let key in obj) {
    fields[key] = { stringValue: obj[key] || "" };
  }
  return fields;
}


// --- Logout Helper ---
function logout() {
  sessionStorage.clear();
  window.location.href = "index.html";
}




