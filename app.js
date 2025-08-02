const firebaseConfig = {
  apiKey: "AIzaSyCplmPKfzmoxOOjDZUm-vZXmK4BC3-t3DI",
  authDomain: "cogninest-96113.firebaseapp.com",
  projectId: "cogninest-96113",
  storageBucket: "cogninest-96113.firebasestorage.app",
  messagingSenderId: "1007694135081",
  appId: "1:1007694135081:web:b7be719690c4e71c59c138",
  measurementId: "G-RTMMW2XYQ3"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let isLogin = true;
let currentUser = null;
let currentRole = null;

// DOM elements
const authContainer = document.getElementById('auth-container');
const mainApp = document.getElementById('main-app');
const authModeLabel = document.getElementById('auth-mode-label');
const authSubmitButton = document.getElementById('auth-submit-button');
const toggleAuthButton = document.getElementById('toggle-auth-button');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const roleSelect = document.getElementById('auth-role');
const appNav = document.getElementById('app-nav');
const appContent = document.getElementById('app-content');
const logoutButton = document.getElementById('logout-button');
const userWelcome = document.getElementById('user-welcome');

// Journaling prompts
const prompts = [
  "How was your day today?",
  "What made you smile recently?",
  "What was a pleasant memory from your childhood?",
  "Is there something you're grateful for today?",
  "Describe a moment you felt peaceful this week.",
  "What's one thing you'd like to improve tomorrow?",
  "Write about a happy memory.",
  "How are you feeling right now?",
  "What's something new you tried recently?",
  "Describe your favorite place and why you like it.",
  "Talk about a person who inspires you.",
];

const mockPatients = [
  {
    id: '1',
    name: 'Mary Huang',
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    journalScore: 4.5,
    status: 'active',
    recentEntries: 4,
    moodTrend: 'improving'
  },
];

// Clear session on page load to force re-authentication
window.addEventListener('load', () => {
  // Clear any stored authentication data
  localStorage.removeItem('cogninest-role');
  sessionStorage.clear();
  
  // Sign out any existing Firebase session
  if (auth.currentUser) {
    auth.signOut();
  }
});

// Toggle login/signup mode
toggleAuthButton.addEventListener('click', () => {
  isLogin = !isLogin;
  if (isLogin) {
    authModeLabel.textContent = 'Log In to Your Account';
    authSubmitButton.textContent = 'Log In';
    toggleAuthButton.textContent = 'Don\'t have an account? Sign up';
    toggleAuthButton.setAttribute('aria-pressed', 'false');
  } else {
    authModeLabel.textContent = 'Create Your Account';
    authSubmitButton.textContent = 'Sign Up';
    toggleAuthButton.textContent = 'Already have an account? Log in';
    toggleAuthButton.setAttribute('aria-pressed', 'true');
  }
  emailInput.value = '';
  passwordInput.value = '';
});

// Handle login/signup submit
authSubmitButton.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const selectedRole = roleSelect.value;

  if (!email || !password) {
    alert('Please enter both email and password.');
    return;
  }

  try {
    let userCredential;
    console.log("Passed user credentials validation");
    if (isLogin) {
        userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("Passed user sign-in");

        // Fetch user role from Firestore
        const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
        if (!userDoc.exists) {
            alert('User role data not found.');
            return;
        }
        currentRole = userDoc.data().role;
    } else {
        userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log("Passed create user validation");
        // Save user role in Firestore on signup
        await db.collection('users').doc(userCredential.user.uid).set({
        email,
        role: selectedRole,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  currentRole = selectedRole;
}
currentUser = userCredential.user;
showPortal(currentRole, currentUser);

  } catch (error) {
    alert((isLogin ? 'Login' : 'Sign up') + ' failed: ' + error.message);
  }
});

// Show portal based on role
function showPortal(role, user) {
  authContainer.classList.add('hidden');
  mainApp.classList.remove('hidden');
  
  // Update welcome message
  userWelcome.textContent = `Welcome, ${user.email} (${role.charAt(0).toUpperCase() + role.slice(1)})`;
  
  renderNav(role);
  renderContent(role, null); // Show default tab content
}

// Render navigation tabs for each role
function renderNav(role) {
  appNav.innerHTML = ''; // Clear existing tabs

  let tabs = [];

  if (role === 'user') {
    tabs = [
      { id: 'home', label: 'Home' },
      { id: 'journaling', label: 'Journaling' }
    ];
  } else if (role === 'caregiver') {
    tabs = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'patient-insights', label: 'Patient Insights' },
      { id: 'alerts-flags', label: 'Alerts & Flags' },
      { id: 'resources', label: 'Resources' }
    ];
  } else if (role === 'clinician') {
    tabs = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'individual-reports', label: 'Individual Reports' },
      { id: 'medicine-management', label: 'Medicine Management' },
    ];
  }

  tabs.forEach((tab, index) => {
    const btn = document.createElement('button');
    btn.textContent = tab.label;
    btn.className = 'px-4 py-2 text-green-900 font-semibold rounded focus:outline-none focus:ring-2 focus:ring-green-700 hover:bg-green-50 transition';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', tab.id);
    btn.setAttribute('data-tab', tab.id);
    btn.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    if (index === 0) btn.classList.add('tab-active', 'bg-green-100');
    btn.tabIndex = 0;

    btn.addEventListener('click', () => {
      // Update tab active state
      Array.from(appNav.children).forEach(sibling => {
        sibling.classList.remove('tab-active', 'bg-green-100');
        sibling.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('tab-active', 'bg-green-100');
      btn.setAttribute('aria-selected', 'true');

      renderContent(role, tab.id);
    });

    appNav.appendChild(btn);
  });
}

// Render content based on role and tab
function renderContent(role, tabId) {
  if (!tabId) {
    // Default first tab for each role
    if (role === 'user') tabId = 'home';
    else if (role === 'caregiver') tabId = 'dashboard';
    else if (role === 'clinician') tabId = 'cognitive-trends';
  }

  if (role === 'user') {
    if (tabId === 'home') {
      appContent.innerHTML = `
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold text-[#3a6d3a] mb-6">Welcome to Your Cognitive Care Hub</h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div class="metric-card">
              <div class="metric-value">1</div>
              <div class="metric-label">Days Active This Week</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">0</div>
              <div class="metric-label">Average Journal Score</div>
            </div>
          </div>
          <p class="text-gray-700 leading-relaxed mt-6">
            Engage gently with daily puzzles, journaling prompts, and mood check-ins designed to support your cognitive health.
          </p>
        </div>
      `;
    } else if (tabId === 'journaling') {
      const prompt = prompts[Math.floor(Math.random() * prompts.length)];
      appContent.innerHTML = `
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold text-[#3a6d3a] mb-4">Your Journal</h2>
          <div class="bg-blue-50 p-4 rounded-lg mb-4">
            <p class="mb-2 font-semibold text-blue-800">Today's Prompt:</p>
            <p class="italic text-blue-700">${prompt}</p>
          </div>
          <textarea id="journal-entry" class="w-full h-40 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-[#3a6d3a]" placeholder="Write your thoughts here..."></textarea>
          <button id="save-journal" class="mt-3 px-6 py-2 bg-[#3a6d3a] text-white rounded-lg hover:bg-[#2a552a] transition">Save Entry</button>
          <div id="journal-message" class="mt-2 text-green-600"></div>
        </div>
      `;

      document.getElementById('save-journal').addEventListener('click', async () => {
        const entry = document.getElementById('journal-entry').value.trim();
        const msg = document.getElementById('journal-message');
        if (!entry) {
          alert('Please write something before saving.');
          return;
        }

        const user = auth.currentUser;
        if (!user) {
          alert('User not logged in.');
          return;
        }

        // Example scoring function (simple sentiment or length-based)
        const score = Math.min(Math.floor(entry.length / 20), 5); // score 0-5 based on length

        try {
          // Save journal entry in Firestore
          const journalRef = await db.collection('journals').add({
            uid: user.uid,
            entry,
            score,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          msg.textContent = 'Journal entry saved with score ' + score + '!';
          setTimeout(() => { msg.textContent = ''; }, 4000);
          document.getElementById('journal-entry').value = '';

        } catch (err) {
          alert('Failed to save journal: ' + err.message);
        }
      });
    }
  } else if (role === 'caregiver') {
    switch(tabId) {
      case 'dashboard':
        renderCaregiverDashboard();
        break;
      case 'patient-insights':
        renderPatientInsights();
        break;
      case 'alerts-flags':
        renderAlertsFlags();
        break;
      case 'resources':
        renderResources();
        break;
    }
} else if (role === 'clinician') {
  switch(tabId) {
    case 'dashboard':
      renderClinicianDashboard();
      break;

    case 'individual-reports':
      appContent.innerHTML = `
        <h2 class="text-3xl font-bold text-[#3a6d3a] mb-4">Individual Reports</h2>
        <p>Export patient data for review or sharing with neurologists.</p>
        <!-- Here you can add the patient list and reports -->
      `;
      break;

    case 'medicine-management':
      renderMedicineManagement();
      break;

    default:
      appContent.innerHTML = `<p>Select a tab to view content.</p>`;
  }
}

}
// Caregiver Dashboard Functions
async function renderCaregiverDashboard() {
  appContent.innerHTML = `<p>Loading...</p>`;

  const patients = await fetchPatientsForCaregiver(currentUser.uid);

  // Calculate stats as before
  const totalPatients = patients.length;
  const activeToday = patients.filter(p => {
    if (!p.lastActivity) return false;
    const lastActiveDate = p.lastActivity.toDate ? p.lastActivity.toDate() : new Date(p.lastActivity);
    const now = new Date();
    return lastActiveDate.toDateString() === now.toDateString();
  }).length;

  const needAttention = patients.filter(p => p.status === 'warning').length;

  const avgWellbeingScore = patients.length
    ? (patients.reduce((sum, p) => sum + (p.journalScore || 0), 0) / patients.length).toFixed(2)
    : 'N/A';

  appContent.innerHTML = `
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold text-[#3a6d3a] mb-6">Caregiver Dashboard</h2>

      <div class="grid md:grid-cols-4 gap-4 mb-8">
        <div class="metric-card">
          <div class="metric-value">${totalPatients}</div>
          <div class="metric-label">Total Patients</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${activeToday}</div>
          <div class="metric-label">Active Today</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${needAttention}</div>
          <div class="metric-label">Need Attention</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${avgWellbeingScore}</div>
          <div class="metric-label">Avg. Wellbeing Score</div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <h3 class="text-xl font-semibold mb-4">Patient Summary</h3>
        <div id="patient-list"></div>
      </div>
    </div>
  `;

  renderPatientList(patients);
  createActivityChart(); // Adapt if you want real data here too
}


function renderPatientList() {
  const patientList = document.getElementById('patient-list');
  patientList.innerHTML = mockPatients.map(patient => `
    <div class="patient-card">
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-semibold text-lg">${patient.name}</h4>
          <p class="text-gray-600">Last active: ${formatDate(patient.lastActivity)}</p>
          <p class="text-sm">Recent entries: ${patient.recentEntries} | Avg. score: ${patient.journalScore}</p>
        </div>
        <div class="text-right">
          <span class="px-2 py-1 rounded text-sm ${getStatusClass(patient.status)}">
            ${patient.status.toUpperCase()}
          </span>
          <p class="text-sm mt-1">Mood: ${patient.moodTrend}</p>
        </div>
      </div>
    </div>
  `).join('');
}

function renderPatientInsights() {
  appContent.innerHTML = `
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold text-[#3a6d3a] mb-6">Patient Insights</h2>
      
      <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h3 class="text-xl font-semibold mb-4">Mood Trends Over Time</h3>
        <div class="chart-container">
          <canvas id="moodChart"></canvas>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <h3 class="text-lg font-semibold mb-4">Journal Analysis</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span>Positive sentiment</span>
              <span class="font-semibold text-green-600">68%</span>
            </div>
            <div class="flex justify-between">
              <span>Engagement level</span>
              <span class="font-semibold text-blue-600">Good</span>
            </div>
            <div class="flex justify-between">
              <span>Writing consistency</span>
              <span class="font-semibold text-yellow-600">Moderate</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <h3 class="text-lg font-semibold mb-4">Activity Patterns</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span>Best time of day</span>
              <span class="font-semibold">Morning (9-11 AM)</span>
            </div>
            <div class="flex justify-between">
              <span>Most active day</span>
              <span class="font-semibold">Tuesday</span>
            </div>
            <div class="flex justify-between">
              <span>Average session length</span>
              <span class="font-semibold">15 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  createMoodChart();
}

function renderAlertsFlags() {
  const alerts = [
    { type: 'high', message: 'Mary Huang hasn\'t logged in for 5 days', time: '2 hours ago' },
  ];

  appContent.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold text-[#3a6d3a] mb-6">Alerts & Flags</h2>
      
      <div class="space-y-4">
        ${alerts.map(alert => `
          <div class="p-4 rounded-lg alert-${alert.type}">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-semibold">${alert.message}</p>
                <p class="text-sm opacity-75 mt-1">${alert.time}</p>
              </div>
              <button class="px-3 py-1 bg-white bg-opacity-50 rounded text-sm hover:bg-opacity-75 transition">
                Mark as Read
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="mt-8 bg-white p-6 rounded-lg shadow-sm border">
        <h3 class="text-lg font-semibold mb-4">Alert Settings</h3>
        <div class="space-y-3">
          <label class="flex items-center">
            <input type="checkbox" checked class="mr-2 text-[#3a6d3a] focus:ring-[#3a6d3a]">
            <span>Notify when patient misses 3+ days</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" checked class="mr-2 text-[#3a6d3a] focus:ring-[#3a6d3a]">
            <span>Alert on declining journal scores</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" class="mr-2 text-[#3a6d3a] focus:ring-[#3a6d3a]">
            <span>Weekly summary reports</span>
          </label>
        </div>
      </div>
    </div>
  `;
}

function renderResources() {
  appContent.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold text-[#3a6d3a] mb-6">Resource Library</h2>
      
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <h3 class="text-lg font-semibold mb-4">Communication Guides</h3>
          <ul class="space-y-2">
            <li><a href="#" class="text-[#3a6d3a] hover:underline">Talking About Cognitive Changes</a></li>
            <li><a href="#" class="text-[#3a6d3a] hover:underline">Encouraging Daily Activities</a></li>
            <li><a href="#" class="text-[#3a6d3a] hover:underline">Managing Difficult Conversations</a></li>
          </ul>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <h3 class="text-lg font-semibold mb-4">Support Strategies</h3>
          <ul class="space-y-2">
            <li><a href="#" class="text-[#3a6d3a] hover:underline">Creating Routine and Structure</a></li>
            <li><a href="#" class="text-[#3a6d3a] hover:underline">Motivation Techniques</a></li>
            <li><a href="#" class="text-[#3a6d3a] hover:underline">Self-Care for Caregivers</a></li>
          </ul>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <h3 class="text-lg font-semibold mb-4">Educational Materials</h3>
          <ul class="space-y-2">
            <li><a href="#" class="text-[#3a6d3a] hover:underline">Understanding Parkinson's</a></li>
            <li><a href="#" class="text-[#3a6d3a] hover:underline">Cognitive Changes Overview</a></li>
            <li><a href="#" class="text-[#3a6d3a] hover:underline">Technology Tips</a></li>
          </ul>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <h3 class="text-lg font-semibold mb-4">Emergency Contacts</h3>
          <div class="space-y-2">
            <p><strong>Healthcare Provider:</strong> (555) 123-4567</p>
            <p><strong>Crisis Hotline:</strong> (555) 987-6543</p>
            <p><strong>Parkinson's Support:</strong> (555) 246-8135</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Clinician Dashboard Functions
function renderClinicianDashboard() {
  const appContent = document.getElementById('app-content');
  
  // Example patient data (replace with real fetched data)
  const patients = [
    { name: 'Mary Johnson', status: 'Active' },
    { name: 'John Smith', status: 'Warning' },
    { name: 'Alejandro Garcia', status: 'Inactive' },
  ];

  appContent.innerHTML = `
    <h2 class="text-3xl font-bold text-[#3a6d3a] mb-6">Clinician Dashboard</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="metric-card">
        <div class="metric-value">24</div>
        <div class="metric-label">Total Patients</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">5</div>
        <div class="metric-label">Patients with Alerts</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">12</div>
        <div class="metric-label">Upcoming Appointments</div>
      </div>
    </div>

    <section>
      <h3 class="text-2xl font-semibold mb-4">Recent Patients</h3>
      <div>
        ${patients.map(p => `
          <div class="patient-card flex justify-between items-center">
            <span>${p.name}</span>
            <span class="status-${p.status.toLowerCase()} font-semibold">${p.status}</span>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderMedicineManagement() {
  const appContent = document.getElementById('app-content');

  if (!renderMedicineManagement.medicines) {
    // Initialize with Mary Huang meds once
    renderMedicineManagement.medicines = [
      { name: 'Levodopa', dosage: '100 mg', schedule: 'Morning, Evening' },
      { name: 'Carbidopa', dosage: '25 mg', schedule: 'Morning, Evening' },
    ];
  }

  const medicines = renderMedicineManagement.medicines;

  appContent.innerHTML = `
    <h2 class="text-3xl font-bold text-[#3a6d3a] mb-6">Medicine Management for Mary Huang</h2>

    <section class="mb-8">
      <h3 class="text-2xl font-semibold mb-4">Current Medications</h3>
      <div id="medicine-list" class="space-y-3">
        ${medicines.map(m => `
          <div class="patient-card flex justify-between items-center">
            <div>
              <strong>${m.name}</strong> - ${m.dosage} - <em>${m.schedule}</em>
            </div>
            <button class="text-red-500 hover:underline" data-medicine="${m.name}">Remove</button>
          </div>
        `).join('')}
      </div>
    </section>

    <section>
      <h3 class="text-2xl font-semibold mb-4">Add Medication</h3>
      <form id="add-medicine-form" class="flex flex-col max-w-sm space-y-4">
        <input type="text" id="medicine-name" placeholder="Medicine Name" required
          class="px-4 py-2 border border-gray-300 rounded" />
        <input type="text" id="medicine-dosage" placeholder="Dosage (e.g., 100 mg)" required
          class="px-4 py-2 border border-gray-300 rounded" />
        <input type="text" id="medicine-schedule" placeholder="Schedule (e.g., Morning, Evening)" required
          class="px-4 py-2 border border-gray-300 rounded" />
        <button type="submit" class="bg-[#3a6d3a] text-white py-2 rounded hover:bg-[#2a552a] transition">
          Add Medication
        </button>
      </form>
    </section>
  `;

  // Attach event listeners **after** rendering:

  // Add medicine form submit
  const form = document.getElementById('add-medicine-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('medicine-name');
    const dosageInput = document.getElementById('medicine-dosage');
    const scheduleInput = document.getElementById('medicine-schedule');

    const newMedicine = {
      name: nameInput.value.trim(),
      dosage: dosageInput.value.trim(),
      schedule: scheduleInput.value.trim(),
    };

    if (newMedicine.name && newMedicine.dosage && newMedicine.schedule) {
      renderMedicineManagement.medicines.push(newMedicine);
      renderMedicineManagement(); // Re-render with updated list
    }
  });

  // Remove medicine button clicks - event delegation
  const medicineList = document.getElementById('medicine-list');
  medicineList.addEventListener('click', (e) => {
    if (e.target.matches('button[data-medicine]')) {
      const medName = e.target.getAttribute('data-medicine');
      renderMedicineManagement.medicines = renderMedicineManagement.medicines.filter(m => m.name !== medName);
      renderMedicineManagement(); // Re-render updated list
    }
  });
}



// Helper functions
function formatDate(date) {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function getStatusClass(status) {
  switch(status) {
    case 'active': return 'status-active bg-green-100';
    case 'warning': return 'status-warning bg-yellow-100';
    case 'inactive': return 'status-inactive bg-red-100';
    default: return 'bg-gray-100';
  }
}

function createActivityChart() {
  const ctx = document.getElementById('activityChart');
  if (!ctx) return;
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Daily Logins',
        data: [2, 3, 2, 1, 3, 2, 1],
        borderColor: '#3a6d3a',
        backgroundColor: 'rgba(58, 109, 58, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 4
        }
      }
    }
  });
}

function createMoodChart() {
  const ctx = document.getElementById('moodChart');
  if (!ctx) return;
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Average Mood Score',
        data: [3.2, 3.8, 3.5, 4.1],
        borderColor: '#3a6d3a',
        backgroundColor: 'rgba(58, 109, 58, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 5
        }
      }
    }
  });
}

// Logout function
logoutButton.addEventListener('click', async () => {
  try {
    await auth.signOut();
    localStorage.removeItem('cogninest-role');
    sessionStorage.clear();
    currentUser = null;
    currentRole = null;
    
    mainApp.classList.add('hidden');
    authContainer.classList.remove('hidden');
    emailInput.value = '';
    passwordInput.value = '';
    roleSelect.value = 'user';
    
    // Reset to login mode if needed
    if (!isLogin) toggleAuthButton.click();
  } catch (error) {
    alert('Logout failed: ' + error.message);
  }
});

// Modified auth state change handler - no auto-login
auth.onAuthStateChanged(user => {
  // Don't auto-login - force users to authenticate each session
  if (!user) {
    mainApp.classList.add('hidden');
    authContainer.classList.remove('hidden');
    currentUser = null;
    currentRole = null;
  }
});
