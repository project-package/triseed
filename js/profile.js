// Profile page JavaScript

function loadProfile() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Populate form fields
    document.getElementById('firstName').value = user.firstName || '';
    document.getElementById('lastName').value = user.lastName || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('username').value = user.username || '';
    document.getElementById('institution').value = user.institution || '';
    document.getElementById('memberSince').textContent = user.memberSince || 'Jan 2026';
    
    // Load stats
    const history = Storage.get(`history_${user.username}`) || [];
    document.getElementById('totalAnalysesStat').textContent = history.length;
}

function saveProfile() {
    const user = getCurrentUser();
    if (!user) return;
    
    const updatedUser = {
        ...user,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        institution: document.getElementById('institution').value
    };
    
    setCurrentUser(updatedUser);
    
    // Update in users DB
    const users = Storage.get('users') || [];
    const userIndex = users.findIndex(u => u.username === user.username);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedUser };
        Storage.set('users', users);
    }
    
    showNotification('Profile updated successfully!', 'success');
}

function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    const user = getCurrentUser();
    const users = Storage.get('users') || [];
    const userIndex = users.findIndex(u => u.username === user.username);
    
    if (userIndex !== -1 && users[userIndex].password === currentPassword) {
        users[userIndex].password = newPassword;
        Storage.set('users', users);
        showNotification('Password changed successfully!', 'success');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
    } else {
        showNotification('Current password is incorrect', 'error');
    }
}

function savePreferences() {
    const preferences = {
        theme: document.getElementById('theme').value,
        defaultPage: document.getElementById('defaultPage').value,
        resultsDisplay: document.getElementById('resultsDisplay').value,
        language: document.getElementById('language').value,
        exportFormat: document.getElementById('exportFormat').value
    };
    
    Storage.set('userPreferences', preferences);
    showNotification('Preferences saved!', 'success');
}

function saveNotifications() {
    const notifications = {
        emailAnalysis: document.getElementById('notifyAnalysis').checked,
        emailBatch: document.getElementById('notifyBatch').checked,
        emailWeekly: document.getElementById('notifyWeekly').checked,
        pushAnalysis: document.getElementById('pushAnalysis').checked,
        pushTips: document.getElementById('pushTips').checked
    };
    
    Storage.set('notificationSettings', notifications);
    showNotification('Notification settings saved!', 'success');
}

// Tab switching
function initProfileTabs() {
    const tabBtns = document.querySelectorAll('.profile-tabs .tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.profile-content .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

// Avatar upload
function initAvatarUpload() {
    const avatarBtn = document.getElementById('changeAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    
    if (avatarBtn) {
        avatarBtn.addEventListener('click', () => avatarInput.click());
    }
    
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    avatarPreview.src = ev.target.result;
                    // Save to localStorage
                    Storage.set('userAvatar', ev.target.result);
                    showNotification('Avatar updated!', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Load saved avatar
    const savedAvatar = Storage.get('userAvatar');
    if (savedAvatar && avatarPreview) {
        avatarPreview.src = savedAvatar;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    initProfileTabs();
    initAvatarUpload();
    
    // Form submissions
    const personalForm = document.getElementById('personalInfoForm');
    if (personalForm) {
        personalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfile();
        });
    }
    
    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', (e) => {
            e.preventDefault();
            changePassword();
        });
    }
    
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            savePreferences();
        });
    }
    
    const notificationsForm = document.getElementById('notificationsForm');
    if (notificationsForm) {
        notificationsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveNotifications();
        });
    }
    
    // Load saved preferences
    const savedPrefs = Storage.get('userPreferences');
    if (savedPrefs) {
        if (document.getElementById('theme')) document.getElementById('theme').value = savedPrefs.theme || 'light';
        if (document.getElementById('defaultPage')) document.getElementById('defaultPage').value = savedPrefs.defaultPage || 'dashboard';
        if (document.getElementById('resultsDisplay')) document.getElementById('resultsDisplay').value = savedPrefs.resultsDisplay || 'detailed';
        if (document.getElementById('language')) document.getElementById('language').value = savedPrefs.language || 'en';
        if (document.getElementById('exportFormat')) document.getElementById('exportFormat').value = savedPrefs.exportFormat || 'pdf';
    }
    
    // Load saved notification settings
    const savedNotifs = Storage.get('notificationSettings');
    if (savedNotifs) {
        if (document.getElementById('notifyAnalysis')) document.getElementById('notifyAnalysis').checked = savedNotifs.emailAnalysis || false;
        if (document.getElementById('notifyBatch')) document.getElementById('notifyBatch').checked = savedNotifs.emailBatch || false;
        if (document.getElementById('notifyWeekly')) document.getElementById('notifyWeekly').checked = savedNotifs.emailWeekly || false;
        if (document.getElementById('pushAnalysis')) document.getElementById('pushAnalysis').checked = savedNotifs.pushAnalysis || false;
        if (document.getElementById('pushTips')) document.getElementById('pushTips').checked = savedNotifs.pushTips || false;
    }
});