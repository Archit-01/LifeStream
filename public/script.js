document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles background
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#e94560" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: {
                enable: true,
                distance: 150,
                color: "#e94560",
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: false
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "grab" },
                onclick: { enable: true, mode: "push" },
                resize: true
            }
        },
        retina_detect: true
    });

    // Tab switching functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Phone number formatting - automatically add +91 as default
    const phoneInput = document.getElementById('phone');
    
    // Set default value to +91
    phoneInput.value = '+91';
    
    phoneInput.addEventListener('input', function(e) {
        let phoneNumber = e.target.value;
        
        // Ensure it starts with +91
        if (!phoneNumber.startsWith('+91')) {
            // If user tries to delete the +91, restore it
            if (phoneNumber.length < 3) {
                phoneNumber = '+91';
            } else {
                // Otherwise, format the number properly
                phoneNumber = '+91' + phoneNumber.replace(/\D/g, '');
            }
        }
        
        // Limit to 13 characters total (+91 + 10 digits)
        if (phoneNumber.length > 13) {
            phoneNumber = phoneNumber.substring(0, 13);
        }
        
        e.target.value = phoneNumber;
    });
    
    phoneInput.addEventListener('keydown', function(e) {
        // Prevent deletion of the +91 prefix
        if (e.key === 'Backspace' && this.value.length <= 3) {
            e.preventDefault();
        }
    });
    
    phoneInput.addEventListener('focus', function() {
        // Place cursor at the end of the number
        this.setSelectionRange(this.value.length, this.value.length);
    });
    
    // User registration form submission
    const userForm = document.getElementById('user-form');
    const userMessage = document.getElementById('user-message');
    
    userForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userData = {
            name: document.getElementById('name').value,
            area: document.getElementById('area').value,
            phone: document.getElementById('phone').value,
            bloodGroup: document.getElementById('blood-group').value
        };
        
        // Validate phone number format
        if (!userData.phone.startsWith('+91') || userData.phone.length !== 13) {
            showMessage(userMessage, 'error', 'Please enter a valid 10-digit Indian phone number (e.g., +919322659210)');
            return;
        }
        
        try {
            const response = await fetch('/api/register-donor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showMessage(userMessage, 'success', 'Thank you for registering as a blood donor! You may save a life soon.');
                userForm.reset();
                // Reset the phone field to +91 after form reset
                phoneInput.value = '+91';
            } else {
                showMessage(userMessage, 'error', result.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            showMessage(userMessage, 'error', 'Network error. Please check your connection and try again.');
        }
    });
    
    // Hospital alert form submission
    const hospitalForm = document.getElementById('hospital-form');
    const hospitalMessage = document.getElementById('hospital-message');
    
    hospitalForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // ===== UPDATED TO INCLUDE PASSWORD =====
        const alertData = {
            hospitalName: document.getElementById('hospital-name').value,
            area: document.getElementById('alert-area').value,
            bloodGroup: document.getElementById('alert-blood-group').value,
            additionalInfo: document.getElementById('additional-info').value,
            password: document.getElementById('hospital-password').value
        };
        // =======================================
        
        try {
            const response = await fetch('/api/send-alert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(alertData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showMessage(hospitalMessage, 'success', 'Emergency alert sent successfully! Donors in the area will be notified.');
                hospitalForm.reset();
            } else {
                showMessage(hospitalMessage, 'error', result.message || 'Failed to send alert. Please try again.');
            }
        } catch (error) {
            showMessage(hospitalMessage, 'error', 'Network error. Please check your connection and try again.');
        }
    });
    
    // Helper function to show messages
    function showMessage(element, type, text) {
        element.textContent = text;
        element.className = `message ${type}`; // Use template literal for cleaner class assignment
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 5000);
    }
});