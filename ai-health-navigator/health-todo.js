// Health To-Do List Management
let currentUserId = null;
let currentDay = 1;
let currentTodoList = null;
let healthData = null;
let todoHistory = [];

// Initialize health todo functionality
function initHealthTodo(userId) {
  currentUserId = userId;
  
  // Load existing to-do list if available
  loadExistingTodoList();
  
  // Setup form submission
  const healthForm = document.getElementById('healthForm');
  if (healthForm) {
    healthForm.addEventListener('submit', handleFormSubmit);
  }
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Collect form data
  const formData = {
    weight: document.getElementById('weight').value,
    height: document.getElementById('height').value,
    age: document.getElementById('age').value,
    gender: document.getElementById('gender').value,
    symptoms: document.getElementById('symptoms').value.trim(),
    medicalHistory: document.getElementById('medicalHistory').value.trim(),
    lifestyle: document.getElementById('lifestyle').value.trim()
  };
  
  // Validate required fields
  if (!formData.symptoms) {
    if (typeof toast !== 'undefined') {
      toast.warning('Please describe your symptoms or health concerns.', 'Missing Information');
    } else {
      alert('Please describe your symptoms or health concerns.');
    }
    return;
  }
  
  // Show loading overlay
  showLoading('Analyzing your health information and generating personalized recovery plan...');
  
  try {
    // Save health data to Firestore
    healthData = formData;
    healthData.timestamp = firebase.firestore.FieldValue.serverTimestamp();
    healthData.userId = currentUserId;
    
    const healthDataRef = await db.collection('health_todo_data').add(healthData);
    healthData.id = healthDataRef.id;
    
    // Generate to-do list using AI
    const todoList = await generateTodoListWithAI(formData);
    
    // Reset to day 1
    currentDay = 1;
    currentTodoList = todoList;
    todoHistory = [];
    
    // Save initial to-do list
    await saveTodoListToFirestore(todoList, 1);
    
    // Display to-do list
    displayTodoList(todoList, 1);
    
    // Hide form, show to-do section
    document.getElementById('healthFormSection').style.display = 'none';
    document.getElementById('todoSection').classList.add('active');
    document.getElementById('emptyState').style.display = 'none';
    
    if (typeof toast !== 'undefined') {
      toast.success('Your personalized recovery plan has been generated!', 'Success');
    }
    
  } catch (error) {
    console.error('Error generating to-do list:', error);
    if (typeof toast !== 'undefined') {
      toast.error('Failed to generate to-do list. Please try again.', 'Error', 7000);
    } else {
      alert('Error: ' + error.message);
    }
  } finally {
    hideLoading();
  }
}

// Generate to-do list using AI
async function generateTodoListWithAI(healthData) {
  const apiKey = window.GEMINI_API_KEY || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : null);
  
  if (!apiKey || apiKey.length < 20) {
    throw new Error("API key not configured properly");
  }
  
  // Build health information summary
  let healthSummary = `Health Information:\n`;
  if (healthData.weight) healthSummary += `- Weight: ${healthData.weight} kg\n`;
  if (healthData.height) healthSummary += `- Height: ${healthData.height} cm\n`;
  if (healthData.age) healthSummary += `- Age: ${healthData.age} years\n`;
  if (healthData.gender) healthSummary += `- Gender: ${healthData.gender}\n`;
  healthSummary += `- Symptoms: ${healthData.symptoms}\n`;
  if (healthData.medicalHistory) healthSummary += `- Medical History: ${healthData.medicalHistory}\n`;
  if (healthData.lifestyle) healthSummary += `- Lifestyle: ${healthData.lifestyle}\n`;
  
  const prompt = `You are a health assistant AI. Based on the following health information, create a personalized recovery plan with daily to-do lists.

${healthSummary}

Create a comprehensive recovery plan with the following structure:
1. Generate Day 1 to-do list with 5-8 specific, actionable items
2. Each item should be categorized as: exercise, diet, medication, rest, or other
3. Items should be specific and measurable (e.g., "Walk 30 minutes in the morning" not just "Exercise")
4. Include a mix of activities: exercises, dietary recommendations, rest periods, and self-care
5. Make items realistic and achievable for the person's condition

IMPORTANT: Return ONLY a JSON array in this exact format:
[
  {
    "id": 1,
    "text": "Walk 30 minutes in the morning at a moderate pace",
    "category": "exercise",
    "completed": false
  },
  {
    "id": 2,
    "text": "Drink 8 glasses of water throughout the day",
    "category": "diet",
    "completed": false
  }
]

Rules:
- Return ONLY valid JSON, no additional text
- Include 5-8 items for Day 1
- Categories must be: exercise, diet, medication, rest, or other
- Make items specific and actionable
- Consider the person's symptoms and condition
- Do NOT diagnose diseases
- Focus on general wellness and recovery`;

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
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error("AI service error: " + (data.error.message || "Unknown error"));
  }
  
  if (!data.candidates || !data.candidates.length) {
    throw new Error("AI could not generate a response");
  }
  
  const aiResponse = data.candidates[0].content.parts[0].text;
  
  // Extract JSON from response (AI might add extra text)
  let jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    // Fallback: try to parse the entire response
    jsonMatch = [aiResponse];
  }
  
  let todoList;
  try {
    todoList = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    // If JSON parsing fails, create a default to-do list
    console.error('Failed to parse AI response as JSON:', parseError);
    todoList = createDefaultTodoList(healthData);
  }
  
  // Validate and ensure proper structure
  if (!Array.isArray(todoList) || todoList.length === 0) {
    todoList = createDefaultTodoList(healthData);
  }
  
  // Ensure each item has required fields
  todoList = todoList.map((item, index) => ({
    id: item.id || index + 1,
    text: item.text || 'Complete this task',
    category: item.category || 'other',
    completed: item.completed || false
  }));
  
  return todoList;
}

// Create default to-do list if AI fails
function createDefaultTodoList(healthData) {
  return [
    { id: 1, text: "Take a 20-minute walk in the morning", category: "exercise", completed: false },
    { id: 2, text: "Drink at least 8 glasses of water", category: "diet", completed: false },
    { id: 3, text: "Eat a balanced meal with fruits and vegetables", category: "diet", completed: false },
    { id: 4, text: "Take 15 minutes of rest in the afternoon", category: "rest", completed: false },
    { id: 5, text: "Practice deep breathing exercises for 10 minutes", category: "exercise", completed: false },
    { id: 6, text: "Get 7-8 hours of sleep tonight", category: "rest", completed: false }
  ];
}

// Display to-do list
function displayTodoList(todoList, day) {
  const container = document.getElementById('todoListContainer');
  const dayTitle = document.getElementById('dayTitle');
  const dayProgress = document.getElementById('dayProgress');
  
  dayTitle.textContent = `Day ${day} - Recovery Plan`;
  
  // Clear container
  container.innerHTML = '';
  
  // Calculate progress
  const completedCount = todoList.filter(item => item.completed).length;
  const totalCount = todoList.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  dayProgress.textContent = `${progressPercent}% Complete`;
  
  // Create to-do items
  const ul = document.createElement('ul');
  ul.className = 'todo-list';
  
  todoList.forEach(item => {
    const li = document.createElement('li');
    li.className = `todo-item ${item.completed ? 'completed' : ''}`;
    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${item.completed ? 'checked' : ''} 
             data-id="${item.id}" onchange="toggleTodoItem(${item.id})">
      <div class="todo-content">
        <div class="todo-text">${item.text}</div>
        <span class="todo-category ${item.category}">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
      </div>
    `;
    ul.appendChild(li);
  });
  
  container.appendChild(ul);
  
  // Check if all items are completed
  if (completedCount === totalCount && totalCount > 0) {
    document.getElementById('completionMessage').style.display = 'block';
    // Auto-load next day after a delay
    setTimeout(() => {
      loadNextDay();
    }, 2000);
  } else {
    document.getElementById('completionMessage').style.display = 'none';
  }
}

// Toggle todo item completion
async function toggleTodoItem(itemId) {
  if (!currentTodoList) return;
  
  const item = currentTodoList.find(t => t.id === itemId);
  if (!item) return;
  
  item.completed = !item.completed;
  
  // Update UI
  displayTodoList(currentTodoList, currentDay);
  
  // Save to Firestore
  await saveTodoListToFirestore(currentTodoList, currentDay);
  
  if (typeof toast !== 'undefined') {
    toast.success(item.completed ? 'Task completed!' : 'Task unchecked', 'Updated');
  }
}

// Load next day's to-do list
async function loadNextDay() {
  showLoading('Generating next day\'s recovery plan...');
  
  try {
    // Check if we already have the next day's list
    const nextDay = currentDay + 1;
    const existingList = await loadTodoListFromFirestore(nextDay);
    
    if (existingList && existingList.length > 0) {
      // Use existing list
      currentDay = nextDay;
      currentTodoList = existingList;
      displayTodoList(currentTodoList, currentDay);
    } else {
      // Generate new list for next day
      const nextDayList = await generateNextDayTodoList(nextDay);
      currentDay = nextDay;
      currentTodoList = nextDayList;
      displayTodoList(currentTodoList, currentDay);
      await saveTodoListToFirestore(nextDayList, nextDay);
    }
    
    if (typeof toast !== 'undefined') {
      toast.success(`Day ${nextDay} plan loaded!`, 'New Day');
    }
    
  } catch (error) {
    console.error('Error loading next day:', error);
    if (typeof toast !== 'undefined') {
      toast.error('Failed to load next day. Please try again.', 'Error', 7000);
    }
  } finally {
    hideLoading();
  }
}

// Generate next day's to-do list
async function generateNextDayTodoList(day) {
  const apiKey = window.GEMINI_API_KEY || (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : null);
  
  if (!apiKey || apiKey.length < 20) {
    throw new Error("API key not configured properly");
  }
  
  // Get completion history
  const completionHistory = todoHistory.map(dayData => ({
    day: dayData.day,
    completed: dayData.todos.filter(t => t.completed).length,
    total: dayData.todos.length
  }));
  
  const prompt = `You are a health assistant AI. Generate Day ${day} of a recovery plan.

Previous Health Information:
- Symptoms: ${healthData.symptoms}
${healthData.weight ? `- Weight: ${healthData.weight} kg` : ''}
${healthData.height ? `- Height: ${healthData.height} cm` : ''}

Completion History:
${completionHistory.map(h => `Day ${h.day}: ${h.completed}/${h.total} tasks completed`).join('\n')}

Create Day ${day} to-do list with:
1. 5-8 specific, actionable items
2. Progress from previous days (make tasks slightly more challenging if previous days were completed well)
3. Mix of exercise, diet, rest, and self-care activities
4. Items should be specific and measurable

Return ONLY a JSON array in this exact format:
[
  {
    "id": 1,
    "text": "Specific task description",
    "category": "exercise|diet|medication|rest|other",
    "completed": false
  }
]

Return ONLY valid JSON, no additional text.`;

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
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.candidates || !data.candidates.length) {
    throw new Error("AI could not generate a response");
  }
  
  const aiResponse = data.candidates[0].content.parts[0].text;
  let jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    jsonMatch = [aiResponse];
  }
  
  let todoList;
  try {
    todoList = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    todoList = createDefaultTodoList(healthData);
  }
  
  // Ensure proper structure
  if (!Array.isArray(todoList) || todoList.length === 0) {
    todoList = createDefaultTodoList(healthData);
  }
  
  todoList = todoList.map((item, index) => ({
    id: item.id || index + 1,
    text: item.text || 'Complete this task',
    category: item.category || 'other',
    completed: item.completed || false
  }));
  
  return todoList;
}

// Update condition (better, worse, different)
async function updateCondition(condition) {
  showLoading('Updating your recovery plan based on your condition...');
  
  try {
    if (condition === 'better') {
      // Stop to-do list if feeling better
      if (typeof toast !== 'undefined') {
        toast.success('Great to hear you\'re feeling better! To-do list will be stopped.', 'Condition Updated');
      }
      
      // Save condition update
      await db.collection('health_todo_updates').add({
        userId: currentUserId,
        condition: 'better',
        day: currentDay,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        message: 'User reported feeling better'
      });
      
      // Hide to-do section, show form
      document.getElementById('todoSection').classList.remove('active');
      document.getElementById('healthFormSection').style.display = 'block';
      document.getElementById('emptyState').style.display = 'none';
      
      // Reset form
      document.getElementById('healthForm').reset();
      
    } else if (condition === 'worse' || condition === 'different') {
      // Generate new to-do list based on updated condition
      const updatePrompt = condition === 'worse' 
        ? 'My condition has worsened. Please provide a new recovery plan.'
        : 'I\'m experiencing different symptoms. Please provide a new recovery plan.';
      
      // Show form to get updated information
      if (typeof toast !== 'undefined') {
        toast.info('Please update your health information below to get a new recovery plan.', 'Update Required', 5000);
      }
      
      // Show form, hide to-do section
      document.getElementById('todoSection').classList.remove('active');
      document.getElementById('healthFormSection').style.display = 'block';
      
      // Pre-fill symptoms field with update prompt
      const symptomsField = document.getElementById('symptoms');
      symptomsField.value = updatePrompt + '\n\n' + (symptomsField.value || '');
      symptomsField.focus();
      
      // Save condition update
      await db.collection('health_todo_updates').add({
        userId: currentUserId,
        condition: condition,
        day: currentDay,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        message: `User reported condition is ${condition}`
      });
    }
    
  } catch (error) {
    console.error('Error updating condition:', error);
    if (typeof toast !== 'undefined') {
      toast.error('Failed to update condition. Please try again.', 'Error', 7000);
    }
  } finally {
    hideLoading();
  }
}

// Save to-do list to Firestore
async function saveTodoListToFirestore(todoList, day) {
  if (!currentUserId || !db) return;
  
  try {
    await db.collection('health_todo_lists').add({
      userId: currentUserId,
      day: day,
      todos: todoList,
      healthDataId: healthData?.id || null,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Update history
    todoHistory.push({ day, todos: todoList });
    
  } catch (error) {
    console.error('Error saving to-do list:', error);
  }
}

// Load to-do list from Firestore
async function loadTodoListFromFirestore(day) {
  if (!currentUserId || !db) return null;
  
  try {
    const snapshot = await db.collection('health_todo_lists')
      .where('userId', '==', currentUserId)
      .where('day', '==', day)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return doc.data().todos;
    }
  } catch (error) {
    console.error('Error loading to-do list:', error);
  }
  
  return null;
}

// Load existing to-do list on page load
async function loadExistingTodoList() {
  if (!currentUserId || !db) return;
  
  try {
    // Get all to-do lists for user (without orderBy to avoid index requirements)
    const snapshot = await db.collection('health_todo_lists')
      .where('userId', '==', currentUserId)
      .get();
    
    if (!snapshot.empty) {
      // Sort in JavaScript to find most recent
      const allDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp || 0)
      }));
      
      // Sort by timestamp descending
      allDocs.sort((a, b) => b.timestamp - a.timestamp);
      
      // Get the most recent one
      const mostRecent = allDocs[0];
      currentDay = mostRecent.day;
      currentTodoList = mostRecent.todos;
      
      // Load health data if available
      if (mostRecent.healthDataId) {
        try {
          const healthDoc = await db.collection('health_todo_data').doc(mostRecent.healthDataId).get();
          if (healthDoc.exists) {
            healthData = healthDoc.data();
            healthData.id = healthDoc.id;
          }
        } catch (healthError) {
          console.error('Error loading health data:', healthError);
        }
      }
      
      // Build history from all docs
      todoHistory = allDocs.map(item => ({
        day: item.day,
        todos: item.todos
      }));
      
      // Sort history by day
      todoHistory.sort((a, b) => a.day - b.day);
      
      // Display to-do list
      displayTodoList(currentTodoList, currentDay);
      document.getElementById('healthFormSection').style.display = 'none';
      document.getElementById('todoSection').classList.add('active');
      document.getElementById('emptyState').style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading existing to-do list:', error);
    // If there's an error, just continue without loading - user can start fresh
  }
}

// Show loading overlay
function showLoading(text = 'Loading...') {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  if (overlay) {
    if (loadingText) loadingText.textContent = text;
    overlay.classList.add('active');
  }
}

// Hide loading overlay
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

// Make functions globally available
window.toggleTodoItem = toggleTodoItem;
window.updateCondition = updateCondition;
