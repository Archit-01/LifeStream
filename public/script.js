document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles background
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#e94560" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#e94560", opacity: 0.2, width: 1 },
            move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out", bounce: false }
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

    // --- Tab Switching ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            const activeTab = document.getElementById(`${tabId}-tab`);
            if (activeTab) {
                activeTab.classList.add('active');
                // If the directory tab is now active, load its data
                if (tabId === 'directory') {
                    loadDirectoryData();
                }
            }
        });
    });
    
    // --- Phone Number Formatting ---
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.value = '+91';
        phoneInput.addEventListener('input', function(e) {
            let phoneNumber = e.target.value.replace(/\D/g, '');
            if (phoneNumber.length < 2) {
                e.target.value = '+91';
            } else {
                e.target.value = '+91' + phoneNumber.substring(2, 12);
            }
        });
        phoneInput.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.selectionStart <= 3) {
                e.preventDefault();
            }
        });
        phoneInput.addEventListener('focus', function() {
            this.setSelectionRange(this.value.length, this.value.length);
        });
    }

    // --- User Registration Form ---
    const userForm = document.getElementById('user-form');
    const userMessage = document.getElementById('user-message');
    if(userForm) {
        userForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const userData = {
                name: document.getElementById('name').value,
                area: document.getElementById('area').value,
                phone: document.getElementById('phone').value,
                bloodGroup: document.getElementById('blood-group').value
            };
            
            if (!/^\+91\d{10}$/.test(userData.phone)) {
                showMessage(userMessage, 'error', 'Please enter a valid 10-digit Indian phone number.');
                return;
            }
            
            try {
                const response = await fetch('/api/register-donor', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                const result = await response.json();
                if (response.ok) {
                    showMessage(userMessage, 'success', 'Thank you for registering! You may save a life soon.');
                    userForm.reset();
                    document.getElementById('phone').value = '+91';
                } else {
                    showMessage(userMessage, 'error', result.message || 'Registration failed.');
                }
            } catch (error) {
                showMessage(userMessage, 'error', 'Network error. Please try again.');
            }
        });
    }

    // --- Hospital Alert Form ---
    const hospitalForm = document.getElementById('hospital-form');
    const hospitalMessage = document.getElementById('hospital-message');
    if(hospitalForm) {
        hospitalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const alertData = {
                hospitalName: document.getElementById('hospital-name').value,
                area: document.getElementById('alert-area').value,
                bloodGroup: document.getElementById('alert-blood-group').value,
                additionalInfo: document.getElementById('additional-info').value,
                password: document.getElementById('hospital-password').value
            };
            
            try {
                const response = await fetch('/api/send-alert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(alertData)
                });
                const result = await response.json();
                if (response.ok) {
                    showMessage(hospitalMessage, 'success', 'Emergency alert sent successfully!');
                    hospitalForm.reset();
                } else {
                    showMessage(hospitalMessage, 'error', result.message || 'Failed to send alert.');
                }
            } catch (error) {
                showMessage(hospitalMessage, 'error', 'Network error. Please try again.');
            }
        });
    }

    // --- Donor Directory Functionality ---
    const filterArea = document.getElementById('filter-area');
    const filterBloodGroup = document.getElementById('filter-blood-group');
    const refreshDirectoryBtn = document.getElementById('refresh-directory');
    const directoryContent = document.querySelector('.directory-content');
    const totalDonorsElement = document.getElementById('total-donors');
    const totalAreasElement = document.getElementById('total-areas');
    const mostCommonBloodElement = document.getElementById('most-common-blood');

    if(refreshDirectoryBtn) {
        refreshDirectoryBtn.addEventListener('click', loadDirectoryData);
        filterArea.addEventListener('change', loadDirectoryData);
        filterBloodGroup.addEventListener('change', loadDirectoryData);
        
        // Initial load if directory tab is active by default
        if (document.querySelector('.tab-btn[data-tab="directory"].active')) {
            loadDirectoryData();
        }
    }

    async function loadDirectoryData() {
        if (!directoryContent) return;
        directoryContent.innerHTML = '<div class="loading">Loading donor data...</div>';
        const refreshIcon = refreshDirectoryBtn.querySelector('i');
        refreshIcon.classList.add('refreshing');

        try {
            const area = filterArea.value;
            const bloodGroup = filterBloodGroup.value;
            
            const params = new URLSearchParams();
            if (area !== 'All') params.append('area', area);
            if (bloodGroup !== 'All') params.append('bloodGroup', bloodGroup);
            
            const response = await fetch(`/api/donors?${params.toString()}`);
            const donors = await response.json();
            
            if (!response.ok) throw new Error(donors.message || 'Failed to load data');
            
            displayDirectoryData(donors);
            updateStats(donors);

        } catch (error) {
            console.error('Error loading directory data:', error);
            directoryContent.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading data</h3><p>${error.message}</p></div>`;
        } finally {
             setTimeout(() => refreshIcon.classList.remove('refreshing'), 500);
        }
    }

    function displayDirectoryData(donors) {
        const donorsByArea = donors.reduce((acc, donor) => {
            (acc[donor.area] = acc[donor.area] || []).push(donor);
            return acc;
        }, {});
        
        if (Object.keys(donorsByArea).length === 0) {
            directoryContent.innerHTML = `<div class="empty-state"><i class="fas fa-users-slash"></i><h3>No donors found</h3><p>No donors match your current filters.</p></div>`;
            return;
        }
        
        let html = '';
        Object.keys(donorsByArea).sort().forEach(area => {
            const areaDonors = donorsByArea[area];
            html += `
                <div class="area-section">
                    <div class="area-header">
                        <h3 class="area-title">${area}</h3>
                        <span class="donor-count">${areaDonors.length} donor${areaDonors.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="donor-list">
                        ${areaDonors.map(donor => `
                            <div class="donor-card">
                                <div class="donor-info">
                                    <div class="donor-blood-group">${donor.bloodGroup}</div>
                                    <div class="donor-details">
                                        <h4>${donor.name}</h4>
                                        <p>${maskPhoneNumber(donor.phone)}</p>
                                    </div>
                                </div>
                                <button class="info-btn" onclick="showContactInfo()">
                                    <i class="fas fa-phone"></i>
                                    Contact
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        directoryContent.innerHTML = html;
    }

    function updateStats(donors) {
        totalDonorsElement.textContent = donors.length;
        totalAreasElement.textContent = new Set(donors.map(d => d.area)).size;
        
        if (donors.length === 0) {
            mostCommonBloodElement.textContent = '-';
            return;
        }
        
        const bloodCounts = donors.reduce((acc, donor) => {
            acc[donor.bloodGroup] = (acc[donor.bloodGroup] || 0) + 1;
            return acc;
        }, {});
        
        const mostCommon = Object.keys(bloodCounts).reduce((a, b) => bloodCounts[a] > bloodCounts[b] ? a : b);
        mostCommonBloodElement.textContent = mostCommon;
    }

    // --- Utility Functions ---
    function maskPhoneNumber(phone) {
        // Masks the phone number, e.g., +919876543210 -> +91******3210
        if (typeof phone !== 'string' || phone.length < 13) return phone;
        return `${phone.substring(0, 3)}******${phone.substring(9)}`;
    }
    
    window.showContactInfo = function() {
        alert('For donor privacy, direct contact is unavailable. Please use the "Hospital Alert" system to notify donors in case of an emergency.');
    }

    function showMessage(element, type, text) {
        if (!element) return;
        element.textContent = text;
        element.className = `message ${type}`;
        
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 5000);
    }
});