// Gemini API Key - Make it globally available FIRST (before Firebase)
const GEMINI_API_KEY = "AIzaSyAMS3Lg483T8B2UWbE_HbfQoozujLvdGVI";
// Make it available globally for other scripts immediately
if (typeof window !== 'undefined') {
  window.GEMINI_API_KEY = GEMINI_API_KEY;
}

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmQiY6rpr82daMw2AL6YbRkuEBR9EXkvc",
  authDomain: "ai-health-navigator-6bad7.firebaseapp.com",
  projectId: "ai-health-navigator-6bad7"
};

// Initialize Firebase only if it's loaded
let db, auth;
if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
} else if (typeof firebase !== 'undefined') {
  // Firebase already initialized
  db = firebase.firestore();
  auth = firebase.auth();
}

// Authentication check function
function requireAuth() {
  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged(user => {
      if (user) {
        resolve(user);
      } else {
        alert("Please login first to access this page");
        window.location.href = "login.html";
        reject(new Error("Not authenticated"));
      }
    });
  });
}

