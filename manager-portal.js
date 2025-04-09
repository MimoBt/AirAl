// Manager Portal JavaScript
let leaveManagement; // Declare global variable for onclick handlers
let teamManagementInstance; // Optional: if needed globally
let calendarInstance; // Optional: if needed globally

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed - Main Initializer Running"); // DEBUG

    // Reset button functionality
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données? Cette action est irréversible.')) {
                resetAllData();
                showNotification('Toutes les données ont été réinitialisées avec succès!', 'success');
                
                // Reload the page to reflect changes
                window.location.reload();
            }
        });
    }

    // Function to reset all data
    function resetAllData() {
        // Clear shared localStorage data
        localStorage.removeItem('allLeaveRequests');
        localStorage.removeItem('managerNotificationCount');
        localStorage.removeItem('generatedPDFs');
        
        // Reset manager profile picture if exists
        localStorage.removeItem('managerProfilePicture');
        
        console.log('All data has been reset');
    }

    // 1. Initialize Calendar first
    if (document.getElementById('calendarDays') && document.getElementById('currentMonth')) {
        console.log("Initializing Standalone Calendar");
        try {
            calendarInstance = new Calendar(); // Assign here
        } catch(error) {
            console.error("Error initializing Calendar:", error);
        }
    } else {
         console.warn("Calendar elements (calendarDays/currentMonth) not found, skipping Calendar init.");
    }
    // --- DEBUG: Check global calendarInstance value BEFORE passing it ---
    console.log("DEBUG: Value of global calendarInstance before LeaveManagement init:", calendarInstance);

    // 2. Initialize Leave Management, pass the calendar instance
    if (document.getElementById('leave-approvals')) {
        console.log("Initializing Leave Management");
        try {
            // Pass calendarInstance (which might be null/undefined if calendar init failed)
            leaveManagement = new LeaveManagement(calendarInstance);
        } catch (error) {
            console.error("Error initializing Leave Management:", error);
        }
    } else {
        console.warn("Leave approval section not found, skipping LeaveManagement init.");
    }

    // 3. Initialize Team Management
    if (document.getElementById('team-management')) {
        console.log("Initializing Team Management");
        try {
            teamManagementInstance = new TeamManagement();
        } catch (error) {
            console.error("Error initializing Team Management:", error);
        }
    } else {
        console.warn("Team management section not found, skipping TeamManagement init.");
    }

    // 4. Perform initial rendering *after* instances are potentially created
    if (leaveManagement) {
        console.log("Performing initial render for Dashboard Requests...");
        renderDashboardPendingRequests(leaveManagement.leaveRequests);
        
        console.log("Performing initial update for Leave Stats...");
        updateLeaveStats(leaveManagement.leaveRequests);
        
        console.log("Performing initial update for Dashboard Stats...");
        updateDashboardStats(teamManagementInstance ? teamManagementInstance.employees : [], leaveManagement.leaveRequests);
        
        if (calendarInstance) {
             console.log("Performing initial render for Calendar...");
             calendarInstance.render(leaveManagement.leaveRequests);
        }
    } else {
         console.warn("LeaveManagement instance not available for initial rendering.");
    }

    // Initialize other core functionalities (can run independently)
    initializeNavigation();
    initializeCharts();
    initializeNotifications();
    initializeProfilePictureUpload();
});

// Navigation Management
function initializeNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('.section');
    const pageTitle = document.querySelector('.page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                    pageTitle.textContent = link.textContent.trim();
                }
            });
        });
    });

    // Show default section
    const defaultSection = document.querySelector('.section');
    if (defaultSection) defaultSection.classList.add('active');
}

// Charts Initialization
function initializeCharts() {
    // Team Performance Chart
    const teamPerformanceCtx = document.getElementById('teamPerformanceChart')?.getContext('2d');
    if (teamPerformanceCtx) {
        new Chart(teamPerformanceCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Performance',
                    data: [85, 88, 92, 90, 95, 92],
                    borderColor: '#1e3a8a',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Absence Rate Chart
    const absenceRateCtx = document.getElementById('absenceRateChart')?.getContext('2d');
    if (absenceRateCtx) {
        new Chart(absenceRateCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Taux d\'Absence',
                    data: [5, 4, 6, 3, 5, 4],
                    backgroundColor: '#c41e3a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10
                    }
                }
            }
        });
    }

    // Leaves Trend Chart
    const leavesTrendCtx = document.getElementById('leavesTrendChart')?.getContext('2d');
    if (leavesTrendCtx) {
        new Chart(leavesTrendCtx, {
            type: 'line',
            data: {
                labels: ['1', '5', '10', '15', '20', '25', '30'],
                datasets: [{
                    label: 'Congés Approuvés',
                    data: [2, 5, 8, 12, 15, 18, 20],
                    borderColor: '#059669',
                    tension: 0.4,
                    fill: false
                }, {
                    label: 'Demandes en Attente',
                    data: [1, 3, 4, 6, 8, 9, 10],
                    borderColor: '#d97706',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Team Management
function initializeTeamManagement() {
    const teamMembers = [
        {
            name: 'Sarah Benali',
            position: 'Chef d\'Escale',
            department: 'Opérations',
            status: 'active',
            performance: 92,
            presence: 95
        },
        {
            name: 'Mohamed Kaci',
            position: 'Pilote Senior',
            department: 'Opérations',
            status: 'leave',
            performance: 88,
            presence: 90
        },
        {
            name: 'Amina Hadj',
            position: 'Technicienne',
            department: 'Maintenance',
            status: 'training',
            performance: 85,
            presence: 88
        }
    ];

    const teamGrid = document.querySelector('.team-grid');
    if (!teamGrid) return;

    // Clear existing content except the first card (template)
    const template = teamGrid.children[0];
    teamGrid.innerHTML = '';

    // Add team members
    teamMembers.forEach(member => {
        const card = template.cloneNode(true);
        
        // Update member info
        card.querySelector('.member-status').className = `member-status ${member.status}`;
        card.querySelector('img').src = `https://ui-avatars.com/api/?name=${member.name.replace(' ', '+')}`;
        card.querySelector('.member-info h3').textContent = member.name;
        card.querySelector('.member-info p').textContent = member.position;
        card.querySelector('.member-info .department').textContent = member.department;
        
        // Update metrics
        const metrics = card.querySelectorAll('.progress');
        metrics[0].style.width = `${member.performance}%`;
        metrics[1].style.width = `${member.presence}%`;

        teamGrid.appendChild(card);
    });

    // Initialize filters
    const departmentFilter = document.querySelector('.department-filter');
    const statusFilter = document.querySelector('.status-filter');

    [departmentFilter, statusFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', () => {
                const department = departmentFilter.value;
                const status = statusFilter.value;

                document.querySelectorAll('.team-member-card').forEach(card => {
                    const matchesDepartment = !department || card.querySelector('.department').textContent === department;
                    const matchesStatus = !status || card.querySelector('.member-status').classList.contains(status);
                    card.style.display = matchesDepartment && matchesStatus ? 'block' : 'none';
                });
            });
        }
    });
}

// Leave Approvals
function initializeLeaveApprovals() {
    const calendar = document.getElementById('absenceCalendar');
    if (!calendar) return;

    // Generate calendar days
    const days = 31;
    for (let i = 1; i <= days; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.innerHTML = `
            <span class="date">${i}</span>
            <div class="leaves">
                <span class="leave-dot approved"></span>
                <span class="leave-dot pending"></span>
            </div>
        `;
        calendar.appendChild(day);
    }

    // Initialize leave requests
    const requests = [
        {
            employee: 'Mohamed Kaci',
            type: 'Congé Annuel',
            startDate: '2025-03-20',
            endDate: '2025-03-25',
            status: 'pending'
        },
        {
            employee: 'Amina Hadj',
            type: 'Congé Maladie',
            startDate: '2025-03-15',
            endDate: '2025-03-18',
            status: 'approved'
        }
    ];

    const approvalsList = document.querySelector('.approvals-list');
    if (!approvalsList) return;

    requests.forEach(request => {
        const requestItem = document.createElement('div');
        requestItem.className = `request-item ${request.status}`;
        requestItem.innerHTML = `
            <div class="request-info">
                <h4>${request.employee}</h4>
                <p>${request.type}</p>
                <span class="dates">${request.startDate} - ${request.endDate}</span>
            </div>
            <div class="request-actions">
                <button class="approve-btn" ${request.status === 'approved' ? 'disabled' : ''}>
                    <i class="fas fa-check"></i> Approuver
                </button>
                <button class="reject-btn" ${request.status === 'approved' ? 'disabled' : ''}>
                    <i class="fas fa-times"></i> Refuser
                </button>
            </div>
        `;

        // Add event listeners for approve/reject buttons
        const approveBtn = requestItem.querySelector('.approve-btn');
        const rejectBtn = requestItem.querySelector('.reject-btn');

        approveBtn?.addEventListener('click', () => {
            requestItem.classList.add('approved');
            approveBtn.disabled = true;
            rejectBtn.disabled = true;
            showNotification('Demande approuvée avec succès', 'success');
        });

        rejectBtn?.addEventListener('click', () => {
            requestItem.classList.add('rejected');
            approveBtn.disabled = true;
            rejectBtn.disabled = true;
            showNotification('Demande refusée', 'error');
        });

        approvalsList.appendChild(requestItem);
    });
}

// Notifications System
function initializeNotifications() {
    const notificationIcon = document.querySelector('.notifications-icon');
    const notificationsDropdown = document.querySelector('.notifications-dropdown');

    if (notificationIcon && notificationsDropdown) {
        notificationIcon.addEventListener('click', () => {
            notificationsDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notifications')) {
                notificationsDropdown.classList.remove('active');
            }
        });
    }
}

// Notification function for manager portal
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `modern-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add to the notifications container or create one if it doesn't exist
    let notificationsContainer = document.querySelector('.modern-notifications-container');
    if (!notificationsContainer) {
        notificationsContainer = document.createElement('div');
        notificationsContainer.className = 'modern-notifications-container';
        document.body.appendChild(notificationsContainer);
    }

    notificationsContainer.appendChild(notification);

    // Add close button functionality
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    });

    // Auto-dismiss after 5 seconds
        setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-times-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// Team Calendar Implementation
function initializeTeamCalendar() {
    const calendar = document.getElementById('teamCalendarWidget');
    if (!calendar) return;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();

    let calendarHTML = `
        <div class="calendar-header">
            <h3>${new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate)}</h3>
        </div>
        <div class="calendar-days">
            <div>Dim</div><div>Lun</div><div>Mar</div><div>Mer</div>
            <div>Jeu</div><div>Ven</div><div>Sam</div>
        </div>
        <div class="calendar-grid">
    `;

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === currentDate.getDate();
        const hasAbsence = Math.random() < 0.2; // Simulate random absences
        
        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${hasAbsence ? 'absence' : ''}">
                <span>${day}</span>
                ${hasAbsence ? '<div class="absence-indicator">1</div>' : ''}
            </div>
        `;
    }

    calendarHTML += '</div>';
    calendar.innerHTML = calendarHTML;
}

// Profile Picture Upload Handler
function initializeProfilePictureUpload() {
    const profilePictureInput = document.getElementById('profilePictureInput');
    const profileImage = document.getElementById('profileImage');

    profilePictureInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Veuillez sélectionner une image valide.');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('L\'image ne doit pas dépasser 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                profileImage.src = e.target.result;
                // Here you would typically send the image to your server
                // For now, we'll just store it in localStorage
                localStorage.setItem('managerProfilePicture', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // Load saved profile picture if exists
    const savedProfilePicture = localStorage.getItem('managerProfilePicture');
    if (savedProfilePicture) {
        profileImage.src = savedProfilePicture;
    }
}

// --- Calendar Class Definition ---
class Calendar {
    constructor() {
        this.date = new Date();
        this.currentMonth = this.date.getMonth();
        this.currentYear = this.date.getFullYear();
        
        this.calendarDays = document.getElementById('calendarDays');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.prevButton = document.getElementById('prevMonth');
        this.nextButton = document.getElementById('nextMonth');
        
        this.leaveRequests = []; // Store leave requests for rendering
        
        if (!this.calendarDays || !this.currentMonthElement || !this.prevButton || !this.nextButton) {
             console.error("Calendar Error: One or more required elements not found (calendarDays, currentMonth, prevMonth, nextMonth).");
             return; // Stop initialization if elements missing
        }

        if (this.prevButton && this.nextButton) {
            this.prevButton.addEventListener('click', () => this.previousMonth());
            this.nextButton.addEventListener('click', () => this.nextMonth());
        }
        
        // Initial render is now handled by the main DOMContentLoaded listener
        // this.render(); 
    }
    
    render(leaveRequests = this.leaveRequests) { // Accept optional leave requests
        this.leaveRequests = leaveRequests; // Update internal store
        
        if (!this.calendarDays || !this.currentMonthElement) {
             console.warn("Calendar render called but required elements missing.");
             return;
        }

        console.log(`Calendar Rendering: ${this.currentMonth + 1}/${this.currentYear} with ${this.leaveRequests.length} requests`); // DEBUG

        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ...
        const totalDays = lastDay.getDate();
        
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        this.currentMonthElement.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        
        this.calendarDays.innerHTML = ''; // Clear previous days
        
        // Add empty cells for days before start of month
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty'; // Add 'empty' class
            this.calendarDays.appendChild(emptyDay);
        }
        
        // Add days of the month
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const currentDate = new Date(Date.UTC(this.currentYear, this.currentMonth, day));

            // Check for leaves on this day
            const leavesOnDay = this.leaveRequests.filter(req => {
                try {
                    const startDate = new Date(req.startDate);
                    const endDate = new Date(req.endDate);
                    // Ensure dates are valid before creating UTC dates
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
                    const startDateUTC = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
                    const endDateUTC = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999));
                    return currentDate >= startDateUTC && currentDate <= endDateUTC;
                } catch (e) { return false; }
            });

            // Add classes based on leave status (only if leaves exist)
            if (leavesOnDay.length > 0) {
                 if (leavesOnDay.some(req => req.status === 'Approuvé')) {
                    dayElement.classList.add('leave-approved');
                }
                if (leavesOnDay.some(req => req.status === 'En Attente')) {
                    dayElement.classList.add('leave-pending');
                }
                 if (leavesOnDay.some(req => req.status === 'Refusé')) {
                    dayElement.classList.add('leave-rejected');
                }
            }
            
            // Add today class if applicable
            if (day === today.getDate() && 
                this.currentMonth === today.getMonth() && 
                this.currentYear === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            this.calendarDays.appendChild(dayElement);
        }
    }
    
    previousMonth() {
        if (this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else {
            this.currentMonth--;
        }
        this.render(); // Re-render with stored leave data
    }
    
    nextMonth() {
        if (this.currentMonth === 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else {
            this.currentMonth++;
        }
        this.render(); // Re-render with stored leave data
    }
}
// --- End Calendar Class Definition ---

// Team Management Class
class TeamManagement {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.employees = []; // Initialize as empty
        
        // Initialize filters - Use CORRECT IDs from HTML
        this.searchInput = document.getElementById('searchEmployee');
        this.departmentFilter = document.getElementById('departmentFilter');
        this.statusFilter = document.getElementById('teamStatusFilter'); // <-- Use the new correct ID for Team Management
        this.roleFilter = document.getElementById('roleFilter');
        this.resetFiltersBtn = document.getElementById('resetFilters');
        
        // Initialize pagination
        this.prevPageBtn = document.getElementById('prevPage');
        this.nextPageBtn = document.getElementById('nextPage');
        this.pageNumbers = document.getElementById('pageNumbers');
        this.teamTableBody = document.getElementById('teamTableBody'); // Get table body

        // Add null checks for all elements before proceeding
        if (!this.searchInput || !this.departmentFilter || !this.statusFilter || !this.roleFilter || !this.resetFiltersBtn || !this.prevPageBtn || !this.nextPageBtn || !this.pageNumbers || !this.teamTableBody) {
            console.error("TeamManagement Error: One or more required elements not found in the DOM.");
            return; // Prevent initialization if elements are missing
        }
        
        this.initializeEventListeners();
        this.loadEmployees();
    }
    
    initializeEventListeners() {
        // Filter event listeners
        this.searchInput.addEventListener('input', () => this.applyFilters());
        this.departmentFilter.addEventListener('change', () => this.applyFilters());
        this.statusFilter.addEventListener('change', () => this.applyFilters());
        this.roleFilter.addEventListener('change', () => this.applyFilters());
        this.resetFiltersBtn.addEventListener('click', () => this.resetFilters());
        
        // Pagination event listeners
        this.prevPageBtn.addEventListener('click', () => this.previousPage());
        this.nextPageBtn.addEventListener('click', () => this.nextPage());
    }
    
    loadEmployees() {
        // Replace with actual API call in a real application
        this.employees = [
            {
                id: 101,
                name: 'Amina Cherif',
                email: 'amina.cherif@airalgerie.dz',
                department: 'Opérations',
                role: 'Chef d\'Escale',
                status: 'Active',
                avatar: 'https://ui-avatars.com/api/?name=Amina+C'
            },
            {
                id: 102,
                name: 'Bilal Hamdi',
                email: 'bilal.hamdi@airalgerie.dz',
                department: 'Maintenance',
                role: 'Technicien',
                status: 'Active',
                avatar: 'https://ui-avatars.com/api/?name=Bilal+H'
            },
            {
                id: 103,
                name: 'Samia Kadri',
                email: 'samia.kadri@airalgerie.dz',
                department: 'Commercial',
                role: 'Agent',
                status: 'On Leave',
                avatar: 'https://ui-avatars.com/api/?name=Samia+K'
            },
            {
                id: 104,
                name: 'Mehdi Bennani',
                email: 'mehdi.bennani@airalgerie.dz',
                department: 'IT',
                role: 'Superviseur',
                status: 'Training',
                avatar: 'https://ui-avatars.com/api/?name=Mehdi+B'
            },
            {
                id: 105,
                name: 'Nadia Ziani',
                email: 'nadia.ziani@airalgerie.dz',
                department: 'Opérations',
                role: 'Agent',
                status: 'Mission',
                avatar: 'https://ui-avatars.com/api/?name=Nadia+Z'
            },
            // Add more sample employees...
        ];
        
        // Apply initial filters/render after loading
        this.applyFilters();
    }
    
    applyFilters() {
        let filteredEmployees = [...this.employees]; // Use spread to copy
        
        // Apply search filter
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            filteredEmployees = filteredEmployees.filter(emp => 
                emp.name.toLowerCase().includes(searchTerm) ||
                emp.email.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply department filter
        if (this.departmentFilter.value) {
            filteredEmployees = filteredEmployees.filter(emp => 
                emp.department === this.departmentFilter.value
            );
        }
        
        // Apply status filter
        if (this.statusFilter.value) {
            filteredEmployees = filteredEmployees.filter(emp => 
                emp.status === this.statusFilter.value
            );
        }
        
        // Apply role filter
        if (this.roleFilter.value) {
            filteredEmployees = filteredEmployees.filter(emp => 
                emp.role === this.roleFilter.value
            );
        }
        
        // Render table with filtered data
        this.renderTable(filteredEmployees);
        // Update pagination based on filtered results
        this.updatePagination(filteredEmployees.length);
    }
    
    renderTable(employeesToRender) { // Accept the list to render
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginatedEmployees = employeesToRender.slice(start, end);
        
        // Make sure table body exists
        if (!this.teamTableBody) return;

        this.teamTableBody.innerHTML = paginatedEmployees.map(emp => `
            <tr>
                <td>
                    <div class="employee-info">
                        <img src="${emp.avatar || 'https://ui-avatars.com/api/?name=N+A'}" alt="${emp.name}" class="employee-avatar">
                        <div class="employee-details">
                            <span class="employee-name">${emp.name}</span>
                            <span class="employee-email">${emp.email}</span>
                        </div>
                    </div>
                </td>
                <td>${emp.department}</td>
                <td>${emp.role}</td>
                <td>
                    <span class="status-badge ${emp.status.toLowerCase().replace(' ', '-')}">
                        ${emp.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }
    
    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        this.prevPageBtn.disabled = this.currentPage === 1;
        this.nextPageBtn.disabled = this.currentPage === totalPages;
        
        this.pageNumbers.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const pageNumber = document.createElement('div');
            pageNumber.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
            pageNumber.textContent = i;
            pageNumber.addEventListener('click', () => this.goToPage(i));
            this.pageNumbers.appendChild(pageNumber);
        }
    }
    
    resetFilters() {
        this.searchInput.value = '';
        this.departmentFilter.value = '';
        this.statusFilter.value = '';
        this.roleFilter.value = '';
        this.currentPage = 1;
        this.applyFilters();
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.applyFilters();
        }
    }
    
    nextPage() {
        const totalPages = Math.ceil(this.employees.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.applyFilters();
        }
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.applyFilters();
    }
}

// Function to update the leave statistics display
function updateLeaveStats(requests) {
    const pendingCountEl = document.getElementById('pendingCount');
    const approvedCountEl = document.getElementById('approvedCount');
    const rejectedCountEl = document.getElementById('rejectedCount');

    if (!pendingCountEl || !approvedCountEl || !rejectedCountEl) {
        console.warn("One or more leave stat count elements not found.");
        return;
    }

    let pending = 0;
    let approved = 0;
    let rejected = 0;

    requests.forEach(req => {
        switch (req.status) {
            case 'En Attente':
                pending++;
                break;
            case 'Approuvé':
                approved++;
                break;
            case 'Refusé':
                rejected++;
                break;
        }
    });

    pendingCountEl.textContent = pending;
    approvedCountEl.textContent = approved;
    rejectedCountEl.textContent = rejected;
}

// Function to update the dashboard statistics cards
function updateDashboardStats(teamMembers, leaveRequests) {
    const teamCountEl = document.getElementById('dashTeamMemberCount');
    const pendingCountEl = document.getElementById('dashPendingRequestCount');
    const absentTodayEl = document.getElementById('dashAbsentTodayCount');

    if (!teamCountEl || !pendingCountEl || !absentTodayEl) {
        console.warn("One or more dashboard stat elements not found.");
        return;
    }

    // 1. Team Members (Using provided team size for now)
    // In a real app, you'd fetch the actual team data
    const teamSize = teamMembers ? teamMembers.length : 12; // Use passed data or fallback
    teamCountEl.textContent = `${teamSize} employés`; 

    // 2. Pending Requests
    const pendingRequests = leaveRequests.filter(req => req.status === 'En Attente').length;
    pendingCountEl.textContent = `${pendingRequests} ${pendingRequests === 1 ? 'demande' : 'demandes'}`;

    // 3. Absent Today
    const today = new Date();
    const todayUTCStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const todayUTCEnd = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999));

    const absentTodayCount = leaveRequests.filter(req => {
        if (req.status !== 'Approuvé') return false; // Only count approved leaves
        try {
            const startDate = new Date(req.startDate);
            const endDate = new Date(req.endDate);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
            const startDateUTC = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
            const endDateUTC = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999));
            // Check if today falls within the approved leave range
            return todayUTCStart <= endDateUTC && todayUTCEnd >= startDateUTC;
        } catch (e) { return false; }
    }).length;
    absentTodayEl.textContent = `${absentTodayCount} ${absentTodayCount === 1 ? 'employé' : 'employés'}`;
}

// Leave Management Class
class LeaveManagement {
    constructor(calendarInstance) {
        this.calendarInstance = calendarInstance;
        this.leaveRequests = [];
        this.currentPage = 1;
        this.itemsPerPage = 5;
        this.statusFilter = 'all';
        this.employeeFilter = '';
        this.dateFilter = '';

        this.leaveTableBody = document.querySelector('.leave-table tbody');
        this.leaveFilters = document.querySelector('.leave-filters');
        this.paginationContainer = document.querySelector('.leave-pagination');

        this.loadLeaveRequests();
        this.initializeEventListeners();
        this.renderTable(this.leaveRequests);
        this.updateDashboardCounts();
    }

    initializeEventListeners() {
        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.statusFilter = statusFilter.value;
                this.currentPage = 1;
            this.applyFilters();
        });
        }

        // Reset filters
        const resetFiltersBtn = document.querySelector('.reset-filters-btn');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => this.resetFilters());
        }

        // Check for new leave requests periodically
        setInterval(() => this.checkForNewRequests(), 10000); // Check every 10 seconds
    }

    loadLeaveRequests() {
        // Load leave requests from the shared localStorage
        const requests = JSON.parse(localStorage.getItem('allLeaveRequests') || '[]');
        
        // Sort by date (newest first)
        requests.sort((a, b) => new Date(b.submitDate) - new Date(a.submitDate));
        
        this.leaveRequests = requests;
        console.log('Loaded leave requests:', this.leaveRequests);
        
        // Reset notification count
        localStorage.setItem('managerNotificationCount', '0');
        
        // Update notification badge
        const badge = document.querySelector('.notifications .badge');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }

    checkForNewRequests() {
        // Get notification count
        const notificationCount = parseInt(localStorage.getItem('managerNotificationCount') || '0');
        
        if (notificationCount > 0) {
            // Update badge
            const badge = document.querySelector('.notifications .badge');
            if (badge) {
                badge.textContent = notificationCount;
                badge.style.display = 'flex';
            }
            
            // Show notification
            showNotification(`${notificationCount} nouvelle(s) demande(s) de congé à traiter`, 'info');
            
            // Reload requests
            this.loadLeaveRequests();
            this.applyFilters();
            this.updateDashboardCounts();
        }
    }

    applyFilters() {
        let filteredRequests = [...this.leaveRequests];

        // Apply status filter
        if (this.statusFilter !== 'all') {
            filteredRequests = filteredRequests.filter(request => {
                if (this.statusFilter === 'pending') return request.status === 'En Attente';
                if (this.statusFilter === 'approved') return request.status === 'Approuvé';
                if (this.statusFilter === 'rejected') return request.status === 'Refusé' || request.status === 'Annulé';
                return true;
            });
        }
        
        // Apply employee filter
        if (this.employeeFilter) {
            const searchTerm = this.employeeFilter.toLowerCase();
            filteredRequests = filteredRequests.filter(request => 
                request.employeeName.toLowerCase().includes(searchTerm) || 
                request.employeeId.toLowerCase().includes(searchTerm)
            );
        }

        // Apply date filter
        if (this.dateFilter) {
            const filterDate = new Date(this.dateFilter);
            filteredRequests = filteredRequests.filter(request => {
                const startDate = new Date(request.startDate);
                const endDate = new Date(request.endDate);
                return startDate <= filterDate && filterDate <= endDate;
            });
        }
        
        // Calculate pagination
        const totalPages = Math.ceil(filteredRequests.length / this.itemsPerPage);
        
        // Render table with filtered data
        this.renderTable(filteredRequests);
        this.updatePagination(totalPages);
    }

    renderTable(requests) {
        if (!this.leaveTableBody) return;
        
        // Calculate pagination
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginatedRequests = requests.slice(start, end);

        // Clear table
        this.leaveTableBody.innerHTML = '';
        
        // Check if no requests
        if (paginatedRequests.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="7" class="empty-table">Aucune demande de congé trouvée</td>`;
            this.leaveTableBody.appendChild(emptyRow);
            return;
        }
        
        // Render each request
        paginatedRequests.forEach(request => {
            const startDate = new Date(request.startDate);
            const endDate = new Date(request.endDate);
            
            const row = document.createElement('tr');
            row.dataset.id = request.id;
            
            row.innerHTML = `
                <td>
                    <div class="employee-info">
                        <img src="${request.employeeAvatar || 'https://ui-avatars.com/api/?name=N+A'}" alt="${request.employeeName}" class="employee-avatar">
                        <div class="employee-details">
                            <span class="employee-name">${request.employeeName}</span>
                            <span class="employee-email">${request.employeeId}</span>
                        </div>
                    </div>
                </td>
                <td>${startDate.toLocaleDateString('fr-FR')}</td>
                <td>${endDate.toLocaleDateString('fr-FR')}</td>
                <td>${request.duration} jours</td>
                <td>${request.type}</td>
                <td>
                    <span class="status-badge ${request.status === 'En Attente' ? 'pending' : 
                                              request.status === 'Approuvé' ? 'approved' : 'rejected'}">
                        <i class="fas fa-${this.getStatusIcon(request.status)}"></i>
                        ${request.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view-btn" title="Voir détails" onclick="leaveManagement.viewDetails('${request.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${request.status === 'En Attente' ? `
                            <button class="action-btn approve-btn" title="Approuver" onclick="leaveManagement.approveRequest('${request.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="action-btn reject-btn" title="Refuser" onclick="leaveManagement.rejectRequest('${request.id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;

            this.leaveTableBody.appendChild(row);
        });
    }

    updatePagination(totalPages) {
        if (!this.paginationContainer) return;
        
        this.paginationContainer.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => this.previousPage());
        this.paginationContainer.appendChild(prevBtn);
        
        // Page buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => this.goToPage(i));
            this.paginationContainer.appendChild(pageBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn next';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => this.nextPage());
        this.paginationContainer.appendChild(nextBtn);
    }

    resetFilters() {
        this.statusFilter = 'all';
        this.employeeFilter = '';
        this.dateFilter = '';
        this.currentPage = 1;
        
        // Reset form elements
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) statusFilter.value = 'all';
        
        const employeeSearch = document.getElementById('employeeSearch');
        if (employeeSearch) employeeSearch.value = '';
        
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) dateFilter.value = '';
        
        this.applyFilters();
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.applyFilters();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.leaveRequests.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.applyFilters();
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.applyFilters();
    }

    getStatusIcon(status) {
        switch(status) {
            case 'Approuvé': return 'check-circle';
            case 'Refusé': return 'times-circle';
            case 'Annulé': return 'ban';
            default: return 'clock';
        }
    }

    approveRequest(id) {
        const allLeaveRequests = JSON.parse(localStorage.getItem('allLeaveRequests') || '[]');
        const requestIndex = allLeaveRequests.findIndex(req => req.id === id);
        
        if (requestIndex !== -1) {
            // Update status
            allLeaveRequests[requestIndex].status = 'Approuvé';
            allLeaveRequests[requestIndex].managerName = 'Ahmed Manager'; // Current manager name
            allLeaveRequests[requestIndex].approvedDate = new Date().toISOString();
            
            // Generate PDF document for the employee
            const pdfData = this.generateLeavePDF(allLeaveRequests[requestIndex]);
            
            // Store PDF data in localStorage
            const generatedPDFs = JSON.parse(localStorage.getItem('generatedPDFs') || '[]');
            generatedPDFs.push(pdfData);
            localStorage.setItem('generatedPDFs', JSON.stringify(generatedPDFs));
            
            // Save back to localStorage
            localStorage.setItem('allLeaveRequests', JSON.stringify(allLeaveRequests));
            
            // Show notification
            showNotification('Demande de congé approuvée avec succès', 'success');
            
            // Update table
            this.loadLeaveRequests();
            this.applyFilters();
            this.updateDashboardCounts();
            
            // Update calendar if available
            if (this.calendarInstance) {
                this.calendarInstance.render(this.leaveRequests);
            }
        }
    }
    
    // Generate PDF for approved leave request
    generateLeavePDF(request) {
        // Create a unique ID for the PDF
        const pdfId = 'pdf_' + Date.now();
        
        // Format dates nicely
        const startDate = new Date(request.startDate).toLocaleDateString('fr-FR');
        const endDate = new Date(request.endDate).toLocaleDateString('fr-FR');
        const approvedDate = new Date(request.approvedDate).toLocaleDateString('fr-FR');
        
        // Create PDF data - this would normally generate an actual PDF
        // but for this demo we'll just store the data to render later
        const pdfData = {
            id: pdfId,
            leaveRequestId: request.id,
            fileName: `Attestation_Congé_${request.employeeName.replace(' ', '_')}_${startDate.replace(/\//g, '-')}.pdf`,
            title: 'ATTESTATION DE CONGÉ',
            employeeName: request.employeeName,
            employeeId: request.employeeId,
            department: request.departmentName,
            leaveType: request.type,
            startDate: startDate,
            endDate: endDate,
            duration: request.duration,
            approvedBy: request.managerName,
            approvedDate: approvedDate,
            companyName: 'Air Algérie',
            companyLogo: 'logo.png',
            createdDate: new Date().toISOString(),
            fileSize: '165 KB',
            fileType: 'PDF'
        };
        
        // Log the generated PDF data
        console.log('Generated PDF for leave request:', pdfData);
        
        return pdfData;
    }

    rejectRequest(id) {
        // Ask for reason
        const reason = prompt('Veuillez indiquer la raison du refus:');
        if (reason === null) return; // User cancelled
        
        const allLeaveRequests = JSON.parse(localStorage.getItem('allLeaveRequests') || '[]');
        const requestIndex = allLeaveRequests.findIndex(req => req.id === id);
        
        if (requestIndex !== -1) {
            // Update status
            allLeaveRequests[requestIndex].status = 'Refusé';
            allLeaveRequests[requestIndex].managerName = 'Ahmed Manager'; // Current manager name
            allLeaveRequests[requestIndex].rejectedDate = new Date().toISOString();
            allLeaveRequests[requestIndex].managerComment = reason;
            
            // Save back to localStorage
            localStorage.setItem('allLeaveRequests', JSON.stringify(allLeaveRequests));
            
            // Show notification
            showNotification('Demande de congé refusée', 'error');
            
            // Update table
            this.loadLeaveRequests();
            this.applyFilters();
            this.updateDashboardCounts();
            
            // Update calendar if available
            if (this.calendarInstance) {
                this.calendarInstance.render(this.leaveRequests);
            }
        }
    }

    viewDetails(id) {
        const allLeaveRequests = JSON.parse(localStorage.getItem('allLeaveRequests') || '[]');
        const request = allLeaveRequests.find(req => req.id === id);
        
        if (request) {
            // Format dates
            const submitDate = new Date(request.submitDate).toLocaleDateString('fr-FR');
            const startDate = new Date(request.startDate).toLocaleDateString('fr-FR');
            const endDate = new Date(request.endDate).toLocaleDateString('fr-FR');
            
            // Show details in notification or modal
            const details = `
                Employé: ${request.employeeName} (${request.employeeId})
                Type: ${request.type}
                Période: ${startDate} - ${endDate} (${request.duration} jours)
                Motif: ${request.reason || 'Non spécifié'}
                Statut: ${request.status}
                Soumis le: ${submitDate}
            `;
            
            showNotification(details, 'info');
        }
    }

    updateDashboardCounts() {
        // Count pending requests
        const pendingCount = this.leaveRequests.filter(req => req.status === 'En Attente').length;
        const pendingCountElement = document.getElementById('dashPendingRequestCount');
        if (pendingCountElement) {
            pendingCountElement.textContent = `${pendingCount} demande${pendingCount !== 1 ? 's' : ''}`;
        }
        
        // Count employees on leave today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const onLeaveToday = this.leaveRequests.filter(req => {
            if (req.status !== 'Approuvé') return false;
            
            const startDate = new Date(req.startDate);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(req.endDate);
            endDate.setHours(0, 0, 0, 0);
            
            return startDate <= today && today <= endDate;
        }).length;
        
        const absentTodayElement = document.getElementById('dashAbsentTodayCount');
        if (absentTodayElement) {
            absentTodayElement.textContent = `${onLeaveToday} employé${onLeaveToday !== 1 ? 's' : ''}`;
        }
    }
}

// Function to render pending requests on the dashboard
function renderDashboardPendingRequests(requests) {
    const requestsListContainer = document.querySelector('#dashboard .requests-list');
    if (!requestsListContainer) {
        console.error("Dashboard requests list container not found!");
        return;
    }

    const pendingRequests = requests.filter(req => req.status === 'En Attente');

    if (pendingRequests.length === 0) {
        requestsListContainer.innerHTML = '<p>Aucune demande en attente.</p>';
        return;
    }

    requestsListContainer.innerHTML = pendingRequests.map(request => {
        // Determine date format based on whether start and end years are the same
        const startDate = new Date(request.startDate);
        const endDate = new Date(request.endDate);
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        // Always include year if start/end years differ OR if the start year is not the current year.
        const includeYear = startYear !== endYear || startYear !== new Date().getFullYear(); 
        
        return `
        <div class="request-item" data-request-id="${request.id}">
            <div class="request-header">
                <img src="${request.employee.avatar}" alt="${request.employee.name}">
                <div class="request-info">
                    <h4>${request.employee.name}</h4>
                    <p>${request.type}</p>
                </div>
                <div class="request-date">
                    <span>${formatDateRange(request.startDate, request.endDate, includeYear)}</span>
                    <small>${request.duration}</small>
                </div>
            </div>
            <div class="request-actions">
                <button class="approve-btn" data-id="${request.id}">Approuver</button>
                <button class="reject-btn" data-id="${request.id}">Refuser</button>
            </div>
        </div>
    `}).join('');

    // Add event listeners to the new buttons
    requestsListContainer.querySelectorAll('.approve-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const requestId = parseInt(e.target.dataset.id);
            console.log(`Dashboard: Approving request ${requestId}`); // DEBUG
            if (leaveManagement) {
                leaveManagement.approveRequest(requestId);
            }
        });
    });

    requestsListContainer.querySelectorAll('.reject-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const requestId = parseInt(e.target.dataset.id);
            console.log(`Dashboard: Rejecting request ${requestId}`); // DEBUG
            if (leaveManagement) {
                leaveManagement.rejectRequest(requestId);
            }
        });
    });
}

// Helper function for date range formatting
function formatDateRange(start, end, includeYear = false) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return "Dates invalides";
    }

    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    // Define options based on whether to include the year
    const options = {
        day: 'numeric',
        month: 'short',
        year: includeYear ? 'numeric' : undefined
    };

    const startDateFormatted = startDate.toLocaleDateString('fr-FR', options);

    // If start and end dates are the same day
    if (startDate.toDateString() === endDate.toDateString()) {
        return startDateFormatted;
    }

    // If start and end dates are different
    const optionsEnd = {
        day: 'numeric',
        month: 'short',
        // Include year on end date ONLY if it's different from start date's year
        year: (includeYear || startYear !== endYear) ? 'numeric' : undefined 
    };
    
    // Special handling if same month and year: Format as "Day1-Day2 Month Year"
    if (startYear === endYear && startDate.getMonth() === endDate.getMonth()) {
         optionsEnd.year = undefined; // Don't repeat year
         optionsEnd.month = undefined; // Don't repeat month
         // Make sure start includes month and potentially year
         let startOptsForRange = { day: 'numeric', month: 'short', year: options.year }; 
         return `${startDate.toLocaleDateString('fr-FR', startOptsForRange).replace(/ \d{4}$/, '')} - ${endDate.toLocaleDateString('fr-FR', optionsEnd)} ${startYear}`;
    }

    // Default range format
    const endDateFormatted = endDate.toLocaleDateString('fr-FR', optionsEnd);
    return `${startDateFormatted} - ${endDateFormatted}`;
}
