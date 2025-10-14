// js/auth.js

// --- CONFIG ---
const FIREBASE_API_KEY = "AIzaSyCCa_hDjwjubm1FXLuGo5YMfRIueoDgUew";
const FIREBASE_PROJECT_ID = "shopnfinity";
const ADMIN_EMAIL = "hariprasath7112@gmail.com"; // your admin Gmail

// Handle Google Login response
async function handleCredentialResponse(response) {
  try {
    const credential = response.credential;

    // Exchange Google ID token for Firebase custom token (via REST)
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

    // Save login info in session storage
    const userInfo = {
      email: data.email,
      name: data.displayName,
      photo: data.photoUrl,
      idToken: data.idToken,
      expiresIn: data.expiresIn,
    };

    sessionStorage.setItem("user", JSON.stringify(userInfo));

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

// --- Logout Helper ---
function logout() {
  sessionStorage.clear();
  window.location.href = "index.html";
}




