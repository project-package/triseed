// Authentication JavaScript

// Mock user database
let usersDB = [
    { 
        username: "researcher", 
        password: "test123", 
        email: "res@cornlab.com",
        firstName: "John",
        lastName: "Researcher",
        institution: "Agricultural Research Institute",
        memberSince: "2024-01-15",
        totalAnalyses: 47
    },
    { 
        username: "agri_expert", 
        password: "corn2025", 
        email: "agri@corn.ai",
        firstName: "Jane",
        lastName: "Expert",
        institution: "Corn Research Center",
        memberSince: "2024-03-10",
        totalAnalyses: 128
    }
];

// Initialize from localStorage
function loadUsers() {
    const stored = localStorage.getItem('users');
    if (stored) {
        usersDB = JSON.parse(stored);
    } else {
        localStorage.setItem('users', JSON.stringify(usersDB));
    }
}

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(usersDB));
}

// Login function
function login(username, password) {
    loadUsers();
    const user = usersDB.find(u => u.username === username && u.password === password);
    if (user) {
        const { password, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
        showNotification('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        return true;
    } else {
        showNotification('Invalid username or password', 'error');
        return false;
    }
}

// Register function
function register(userData) {
    loadUsers();
    
    // Check if username exists
    if (usersDB.find(u => u.username === userData.username)) {
        showNotification('Username already exists', 'error');
        return false;
    }
    
    // Check if email exists
    if (usersDB.find(u => u.email === userData.email)) {
        showNotification('Email already registered', 'error');
        return false;
    }
    
    // Add new user
    const newUser = {
        ...userData,
        memberSince: new Date().toISOString().split('T')[0],
        totalAnalyses: 0
    };
    usersDB.push(newUser);
    saveUsers();
    
    showNotification('Registration successful! Please login.', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
    return true;
}

// Event listeners for login page
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        login(username, password);
    });
    
    // Toggle password visibility
    const toggleBtn = document.querySelector('.toggle-password');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            toggleBtn.querySelector('i').classList.toggle('fa-eye');
            toggleBtn.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
}

// Event listeners for register page
if (document.getElementById('registerForm')) {
    const passwordInput = document.getElementById('password');
    const strengthDiv = document.querySelector('.password-strength');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const strength = checkPasswordStrength(passwordInput.value);
            if (strengthDiv) {
                const strengths = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
                strengthDiv.innerHTML = `<span style="color: ${strength <= 2 ? 'red' : (strength <= 3 ? 'orange' : 'green')}">Password strength: ${strengths[strength-1] || 'Weak'}</span>`;
            }
        });
    }
    
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        
        const userData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            username: document.getElementById('username').value,
            password: password,
            institution: document.getElementById('institution').value || '',
        };
        
        register(userData);
    });
}

// Check if user is logged in on protected pages
function checkAuth() {
    const user = getCurrentUser();
    const protectedPages = ['dashboard.html', 'analyze.html', 'history.html', 'compare.html', 'dataset.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage) && !user) {
        window.location.href = 'login.html';
    }
    
    // Update user name displays
    if (user) {
        const userNameElements = document.querySelectorAll('#userName, #userDisplayName');
        userNameElements.forEach(el => {
            if (el) el.textContent = `${user.firstName} ${user.lastName}`;
        });
    }
}

// Run auth check on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Setup logout buttons
    const logoutBtns = document.querySelectorAll('#logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            logout();
        });
    });
});