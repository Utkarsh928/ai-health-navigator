/************ 1. FIREBASE CONFIG ************/
// Firebase is initialized in auth.js - don't initialize again to avoid conflicts
// Use the global db and auth from auth.js if available
let db, auth;
if (typeof firebase !== 'undefined') {
  // Firebase should already be initialized by auth.js
  if (firebase.apps && firebase.apps.length > 0) {
    db = firebase.firestore();
    auth = firebase.auth();
  } else {
    // Fallback if auth.js didn't load
    const firebaseConfig = {
      apiKey: "AIzaSyAmQiY6rpr82daMw2AL6YbRkuEBR9EXkvc",
      authDomain: "ai-health-navigator-6bad7.firebaseapp.com",
      projectId: "ai-health-navigator-6bad7"
    };
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
  }
}

// Add event listeners only if elements exist (for login.html)
if (document.getElementById("signupBtn")) {
  document.getElementById("signupBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const statusEl = document.getElementById("authStatus");
    const btn = document.getElementById("signupBtn");

    // Input validation
    if (!email || !email.includes('@')) {
      statusEl.innerText = "❌ Please enter a valid email address";
      return;
    }
    if (!password || password.length < 6) {
      statusEl.innerText = "❌ Password must be at least 6 characters";
      return;
    }

    // Show loading state
    btn.disabled = true;
    btn.textContent = "Signing up...";
    statusEl.innerText = "⏳ Creating account...";

    try {
      if (!auth) throw new Error("Authentication service not available");
      await auth.createUserWithEmailAndPassword(email, password);
      statusEl.innerText = "✅ Signed up successfully! Redirecting...";
      setTimeout(() => window.location.href = "index.html", 1500);
    } catch (err) {
      statusEl.innerText = "❌ " + err.message;
      btn.disabled = false;
      btn.textContent = "Sign Up";
    }
  });
}

if (document.getElementById("loginBtn")) {
  document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const statusEl = document.getElementById("authStatus");
    const btn = document.getElementById("loginBtn");

    // Input validation
    if (!email || !email.includes('@')) {
      statusEl.innerText = "❌ Please enter a valid email address";
      return;
    }
    if (!password) {
      statusEl.innerText = "❌ Please enter your password";
      return;
    }

    // Show loading state
    btn.disabled = true;
    btn.textContent = "Logging in...";
    statusEl.innerText = "⏳ Logging in...";

    try {
      if (!auth) throw new Error("Authentication service not available");
      await auth.signInWithEmailAndPassword(email, password);
      statusEl.innerText = "✅ Logged in! Redirecting...";
      setTimeout(() => window.location.href = "index.html", 1500);
    } catch (err) {
      statusEl.innerText = "❌ " + err.message;
      btn.disabled = false;
      btn.textContent = "Login";
    }
  });
}

if (document.getElementById("logoutBtn")) {
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    try {
      if (auth) {
        await auth.signOut();
        if (document.getElementById("authStatus")) {
          document.getElementById("authStatus").innerText = "👋 Logged out";
        }
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  });
}




/************ 2. GEMINI API KEY ************/
// Use the same API key from auth.js to avoid conflicts
// auth.js should be loaded first, so use the global key if available
const GEMINI_API_KEY = (typeof window !== 'undefined' && window.GEMINI_API_KEY) 
  ? window.GEMINI_API_KEY 
  : "AIzaSyAMS3Lg483T8B2UWbE_HbfQoozujLvdGVI";

/************ 3. MAIN FUNCTION ************/
// Note: This function is defined but may not be used if symptom-checker.html has its own implementation
async function checkHealth() {
  const symptomsEl = document.getElementById("symptoms");
  const resultEl = document.getElementById("result");
  
  if (!symptomsEl || !resultEl) return; // Elements don't exist on this page

  const symptoms = symptomsEl.value.trim();

  if (!symptoms) {
    alert("Please enter your symptoms");
    return;
  }

  // Show loading state
  resultEl.innerHTML = '<div class="loading-spinner">⏳ Analyzing symptoms with AI...</div>';
  const checkBtn = document.querySelector('button[onclick*="checkHealth"]') || document.getElementById("checkBtn");
  if (checkBtn) {
    checkBtn.disabled = true;
    checkBtn.textContent = "Analyzing...";
  }

  try {
    // Validate API key
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 20) {
      throw new Error("API key not configured properly");
    }

    // Save to Firestore (with userId if user is logged in)
    const user = auth?.currentUser;
    if (user && db) {
      try {
        const logData = {
          symptoms: symptoms,
          userId: user.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection("symptom_logs").add(logData);
      } catch (dbError) {
        console.error("Failed to save to Firestore:", dbError);
        // Continue even if Firestore save fails
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are an AI health assistant for students.

Classify symptoms into:
1. Visit a Doctor
2. Talk to a Counselor
3. Home Care & Rest

Rules:
- Do NOT diagnose
- Use simple language

Symptoms:
${symptoms}
              `
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // ✅ SAFE CHECK
    if (!data.candidates || !data.candidates.length) {
      resultEl.innerHTML = '<div class="error-message">⚠️ AI could not generate a response. Please try again.</div>';
      return;
    }

    resultEl.innerHTML = '<div class="success-message">' + data.candidates[0].content.parts[0].text.replace(/\n/g, '<br>') + '</div>';

  } catch (error) {
    resultEl.innerHTML = '<div class="error-message">❌ Error connecting to AI service. Please try later.<br><small>' + error.message + '</small></div>';
  } finally {
    if (checkBtn) {
      checkBtn.disabled = false;
      checkBtn.textContent = "Analyze Symptoms";
    }
  }
}


/************ 4. MENTAL HEALTH CHECK-IN ************/
async function submitCheckin() {
  const moodEl = document.getElementById("mood");
  const sleepEl = document.getElementById("sleep");
  const stressEl = document.getElementById("stress");
  const resultEl = document.getElementById("checkinResult");
  
  if (!moodEl || !sleepEl || !stressEl || !resultEl) return;

  const mood = moodEl.value;
  const sleep = sleepEl.value;
  const stress = stressEl.value;

  // Input validation
  if (!sleep || isNaN(sleep) || sleep < 0 || sleep > 24) {
    resultEl.innerText = "❌ Please enter valid sleep hours (0-24)";
    return;
  }

  if (!currentUser) {
    resultEl.innerText = "❌ Please login first";
    return;
  }

  // Show loading state
  resultEl.innerText = "⏳ Saving check-in...";
  const submitBtn = document.querySelector('button[onclick*="submitCheckin"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";
  }

  try {
    if (!db) throw new Error("Database not available");
    
    await db.collection("checkins").add({
      userId: currentUser.uid,
      mood: mood || "neutral",
      sleep: parseFloat(sleep),
      stress: stress || "moderate",
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    resultEl.innerText = "✅ Check-in saved. Take care of yourself 💙";
    
    // Clear form
    moodEl.value = "";
    sleepEl.value = "";
    stressEl.value = "";
  } catch (error) {
    resultEl.innerText = "❌ Error saving check-in: " + error.message;
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Check-in";
    }
  }
}

/************ 5. SKETCH ANALYSIS ************/
// Initialize canvas if it exists
let canvas, ctx, drawing = false;
if (document.getElementById("symptomCanvas")) {
  canvas = document.getElementById("symptomCanvas");
  ctx = canvas.getContext("2d");
  
  canvas.addEventListener("mousedown", () => drawing = true);
  canvas.addEventListener("mouseup", () => drawing = false);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseleave", () => drawing = false);
}

function draw(e) {
  if (!drawing || !ctx) return;
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(e.offsetX, e.offsetY, 3, 0, Math.PI * 2);
  ctx.fill();
}

function clearCanvas() {
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

async function analyzeSketch() {
  const resultEl = document.getElementById("sketchResult");
  if (!resultEl) return;

  // Check if canvas has any drawing
  if (!canvas || !ctx) {
    resultEl.innerText = "❌ Canvas not available";
    return;
  }

  // Show loading state
  resultEl.innerHTML = '<div class="loading-spinner">⏳ Analyzing sketch with AI...</div>';
  const analyzeBtn = document.querySelector('button[onclick*="analyzeSketch"]');
  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";
  }

  const prompt = `
You are a wellness assistant.

A student has drawn areas where they feel discomfort or stress.
Based on the drawing pattern (general interpretation only),
explain what it could mean in a non-medical, supportive way.

Rules:
- Do NOT diagnose
- Do NOT mention diseases
- Give general wellness advice
`;

  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 20) {
      throw new Error("API key not configured properly");
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Could not analyze the sketch right now.";
    
    resultEl.innerHTML = '<div class="success-message">' + result.replace(/\n/g, '<br>') + '</div>';
  } catch (err) {
    resultEl.innerHTML = '<div class="error-message">❌ Error analyzing sketch: ' + err.message + '</div>';
  } finally {
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "Analyze Sketch";
    }
  }
}

/************ 6. VOICE ANALYSIS ************/
let recognition;
let transcript = "";

function startVoiceAnalysis() {
  const statusEl = document.getElementById("voiceStatus");
  const transcriptEl = document.getElementById("transcriptText");
  
  if (!statusEl) return;

  // Check if browser supports speech recognition
  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    statusEl.innerText = "❌ Your browser doesn't support speech recognition";
    return;
  }

  transcript = "";
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    transcript = "";
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if (transcriptEl) {
      transcriptEl.innerText = "📝 Transcript: " + transcript;
    }
  };

  recognition.onerror = (event) => {
    statusEl.innerText = "❌ Error: " + event.error;
  };

  recognition.onend = () => {
    if (statusEl.innerText.includes("Listening")) {
      statusEl.innerText = "⏹️ Recording stopped";
    }
  };

  try {
    recognition.start();
    statusEl.innerText = "🎙️ Listening... (Click Stop when done)";
  } catch (err) {
    statusEl.innerText = "❌ Could not start recording: " + err.message;
  }
}

function stopVoiceAnalysis() {
  const statusEl = document.getElementById("voiceStatus");
  
  if (recognition) {
    recognition.stop();
    if (statusEl) {
      statusEl.innerText = "⏹️ Processing voice...";
    }
    analyzeVoiceWithAI(transcript);
  }
}

async function analyzeVoiceWithAI(text) {
  const resultEl = document.getElementById("voiceResult");
  const statusEl = document.getElementById("voiceStatus");
  
  if (!resultEl) return;

  if (!text || text.length < 5) {
    resultEl.innerHTML = '<div class="error-message">❌ Please speak a bit more for analysis (at least 5 characters).</div>';
    return;
  }

  // Show loading state
  resultEl.innerHTML = '<div class="loading-spinner">⏳ Analyzing voice with AI...</div>';
  if (statusEl) {
    statusEl.innerText = "🤖 AI is analyzing your voice...";
  }

  const prompt = `
You are a student wellness AI assistant.

Analyze the student's spoken text and return the result in this EXACT format:

Stress Level: Calm | Moderate Stress | High Stress
Emotion: one word (calm, anxious, overwhelmed, happy, neutral)
Confidence: number between 0 and 100
Message: short supportive advice

Rules:
- Do NOT diagnose diseases
- This is NOT medical advice
- Be student-friendly

Student speech:
"${text}"
`;

  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 20) {
      throw new Error("API key not configured properly");
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const output =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to analyze voice right now.";

    resultEl.innerHTML = '<div class="success-message">' + output.replace(/\n/g, '<br>') + '</div>';
    if (statusEl) {
      statusEl.innerText = "✅ Analysis complete";
    }

    // Save to Firestore if available
    if (db && currentUser) {
      try {
        await db.collection("voiceStressLogs").add({
          userId: currentUser.uid,
          transcript: text,
          aiResult: output,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (dbError) {
        console.error("Failed to save voice log:", dbError);
        // Continue even if Firestore save fails
      }
    }

  } catch (error) {
    resultEl.innerHTML = '<div class="error-message">❌ AI analysis failed: ' + error.message + '</div>';
    if (statusEl) {
      statusEl.innerText = "❌ Analysis failed";
    }
  }
}

/************ 7. INITIALIZATION ************/
let currentUser = null;

// Initialize voice buttons if they exist
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startVoiceBtn");
  const stopBtn = document.getElementById("stopVoiceBtn");

  if (startBtn && stopBtn) {
    startBtn.addEventListener("click", startVoiceAnalysis);
    stopBtn.addEventListener("click", stopVoiceAnalysis);
  }
});

// Monitor auth state
if (auth) {
  auth.onAuthStateChanged(user => {
    currentUser = user;
    // Removed console.log statements for production
  });
}
