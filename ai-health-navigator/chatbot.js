// Health Chatbot using Gemini API
let chatbotOpen = false;
let chatHistory = [];

function initChatbot() {
  // Create chatbot HTML
  const chatbotHTML = `
    <div id="chatbotContainer" class="chatbot-container">
      <div id="chatbotWindow" class="chatbot-window" style="display: none;">
        <div class="chatbot-header">
          <h3>🩺 Health Assistant</h3>
          <button id="chatbotMinimize" class="chatbot-btn-minimize">−</button>
        </div>
        <div id="chatbotMessages" class="chatbot-messages"></div>
        <div class="chatbot-input-area">
          <input type="text" id="chatbotInput" placeholder="Ask about health, symptoms, precautions..." />
          <button id="chatbotSend" class="chatbot-btn-send">Send</button>
        </div>
      </div>
      <button id="chatbotToggle" class="chatbot-toggle">
        <span id="chatbotIcon">💬</span>
      </button>
    </div>
  `;

  // Add chatbot to body
  document.body.insertAdjacentHTML('beforeend', chatbotHTML);

  // Add chatbot styles
  const style = document.createElement('style');
  style.textContent = `
    .chatbot-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      font-family: 'Poppins', sans-serif;
    }
    .chatbot-toggle {
      width: 80px;
      height: 80px;
      border-radius: 70%;
      background: linear-gradient(135deg, #1976d2, #42a5f5);
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      transition: transform 0.3s, box-shadow 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .chatbot-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0,0,0,0.4);
    }
    .chatbot-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      max-width: calc(100vw - 40px);
      height: 600px;
      max-height: calc(100vh - 100px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .chatbot-header {
      background: linear-gradient(135deg, #348ee8, #42a5f5);
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chatbot-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .chatbot-btn-minimize {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      transition: background 0.3s;
    }
    .chatbot-btn-minimize:hover {
      background: rgba(255,255,255,0.3);
    }
    .chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .chatbot-message {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 12px;
      word-wrap: break-word;
      line-height: 1.5;
    }
    .chatbot-message.user {
      align-self: flex-end;
      background: #1976d2;
      color: white;
      border-bottom-right-radius: 4px;
    }
    .chatbot-message.bot {
      align-self: flex-start;
      background: white;
      color: #333;
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .chatbot-message.typing {
      align-self: flex-start;
      background: white;
      padding: 12px 20px;
    }
    .typing-indicator {
      display: flex;
      gap: 4px;
    }
    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #999;
      animation: typing 1.4s infinite;
    }
    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }
    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
      30% { transform: translateY(-10px); opacity: 1; }
    }
    .chatbot-input-area {
      display: flex;
      gap: 10px;
      padding: 15px;
      background: white;
      border-top: 1px solid #e0e0e0;
    }
    #chatbotInput {
      flex: 1;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-family: inherit;
      font-size: 14px;
      outline: none;
      transition: border-color 0.3s;
    }
    #chatbotInput:focus {
      border-color: #1976d2;
    }
    .chatbot-btn-send {
      padding: 12px 24px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.3s;
      font-family: inherit;
    }
    .chatbot-btn-send:hover {
      background: #0d47a1;
    }
    .chatbot-btn-send:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    @media (max-width: 480px) {
      .chatbot-window {
        width: calc(100vw - 20px);
        right: -10px;
      }
      .chatbot-container {
        right: 10px;
        bottom: 10px;
      }
    }
  `;
  document.head.appendChild(style);

  // Event listeners
  const toggleBtn = document.getElementById('chatbotToggle');
  const minimizeBtn = document.getElementById('chatbotMinimize');
  const chatbotWindow = document.getElementById('chatbotWindow');
  const sendBtn = document.getElementById('chatbotSend');
  const input = document.getElementById('chatbotInput');
  const messagesContainer = document.getElementById('chatbotMessages');

  toggleBtn.addEventListener('click', () => {
    chatbotOpen = !chatbotOpen;
    chatbotWindow.style.display = chatbotOpen ? 'flex' : 'none';
    if (chatbotOpen) {
      input.focus();
      // Add welcome message if first time
      if (chatHistory.length === 0) {
        addBotMessage("Hello! I'm your health assistant. I can help you with:\n\n• Health-related questions\n• Symptom guidance\n• Wellness precautions\n• General health advice\n\nAsk me anything about health!");
      }
    }
  });

  minimizeBtn.addEventListener('click', () => {
    chatbotOpen = false;
    chatbotWindow.style.display = 'none';
  });

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${isUser ? 'user' : 'bot'}`;
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return messageDiv;
  }

  function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chatbot-message typing';
    typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typingDiv;
  }

  function addBotMessage(text) {
    chatHistory.push({ role: 'assistant', content: text });
    return addMessage(text, false);
  }

  async function sendMessage() {
    const userMessage = input.value.trim();
    if (!userMessage) return;

    // Add user message
    addMessage(userMessage, true);
    chatHistory.push({ role: 'user', content: userMessage });
    input.value = '';
    sendBtn.disabled = true;

    // Add typing indicator
    const typingIndicator = addTypingIndicator();

    try {
      // Validate API key
      const apiKey = window.GEMINI_API_KEY || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : null);
      if (!apiKey || apiKey.length < 20) {
        throw new Error("API key not configured properly");
      }

      // Call Gemini API
      const prompt = `You are a helpful health assistant for students. Provide accurate, supportive health-related advice.

Guidelines:
- Answer health questions clearly and simply
- Provide wellness precautions and tips
- Suggest when to see a healthcare professional
- Be supportive and encouraging
- Do NOT diagnose specific diseases
- Do NOT provide medical prescriptions
- Focus on general wellness and self-care
- If asked about serious symptoms, recommend professional consultation

User question: ${userMessage}

Provide a helpful, student-friendly response:`;

      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      });

      // Remove typing indicator
      typingIndicator.remove();

      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error?.message || errorMsg;
        } catch (e) {}
        throw new Error("AI service error: " + errorMsg);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error("AI service error: " + (data.error.message || "Unknown error"));
      }

      if (!data.candidates || !data.candidates.length) {
        throw new Error("AI could not generate a response");
      }

      const aiResponse = data.candidates[0].content.parts[0].text;
      addBotMessage(aiResponse);

      // Save to Firestore if user is logged in
      try {
        if (typeof auth !== 'undefined' && typeof db !== 'undefined' && auth && auth.currentUser && db) {
          await db.collection("chatbot_logs").add({
            userId: auth.currentUser.uid,
            userMessage: userMessage,
            aiResponse: aiResponse,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (e) {
        // Silently fail if Firestore is not available
      }

    } catch (error) {
      typingIndicator.remove();
      addBotMessage("Sorry, I'm having trouble right now. Please try again later or contact a healthcare professional for urgent concerns.");
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatbot);
} else {
  initChatbot();
}

