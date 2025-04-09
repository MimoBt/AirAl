document.addEventListener('DOMContentLoaded', () => {
    // Add sample PDF data for testing document viewing/downloading
    // This ensures we have documents to view/download in the demo
    const samplePDFs = [
        {
            id: 'pdf_001',
            title: 'Attestation de Congé Payé',
            employeeName: 'John Doe',
            employeeId: 'EMP2025-001',
            department: 'Développement',
            leaveType: 'Congé Payé',
            startDate: '01/08/2025',
            endDate: '15/08/2025',
            duration: '15',
            approvedBy: 'Ahmed Manager',
            approvedDate: '15/07/2025',
            fileName: 'attestation_conge_20250801.pdf',
            createdDate: '2025-07-15T10:30:00'
        },
        {
            id: 'pdf_002',
            title: 'Certificat de Travail',
            employeeName: 'John Doe',
            employeeId: 'EMP2025-001',
            department: 'Développement',
            leaveType: 'N/A',
            startDate: 'N/A',
            endDate: 'N/A',
            duration: 'N/A',
            approvedBy: 'Direction RH',
            approvedDate: '01/06/2025',
            fileName: 'certificat_travail_JohnDoe.pdf',
            createdDate: '2025-06-01T15:45:00'
        }
    ];
    
    // Store sample PDFs in localStorage if no PDFs exist yet
    const existingPDFs = JSON.parse(localStorage.getItem('generatedPDFs') || '[]');
    if (existingPDFs.length === 0) {
        localStorage.setItem('generatedPDFs', JSON.stringify(samplePDFs));
    }
    
    // Remove the automatic reset on page load
    // resetAllData();
    
    // Check for any manager updates immediately on load
    checkForManagerUpdates();
    
    // Set up periodic checking for manager updates (every 30 seconds)
    setInterval(checkForManagerUpdates, 30000);
    
    // Reset button functionality
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données? Cette action est irréversible.')) {
                resetAllData();
                showNotification('Toutes les données ont été réinitialisées avec succès!', 'success');
                
                // Reload specific section if it's active
                if (document.getElementById('documents').classList.contains('active')) {
                    Employee.loadDocuments();
                } else if (document.getElementById('history').classList.contains('active')) {
                    loadHistoryFromStorage();
                } else if (document.getElementById('leave-requests').classList.contains('active')) {
                    const activeTab = document.querySelector('.tab-btn.active');
                    if (activeTab) {
                        loadLeaveRequests(activeTab.dataset.tab);
                    } else {
                        loadLeaveRequests('pending');
                    }
                }
            }
        });
    }

    // Function to reset all data
    function resetAllData() {
        // Clear all localStorage data related to the employee portal
        localStorage.removeItem('leaveHistory');
        localStorage.removeItem('employeeProfilePicture');
        localStorage.removeItem('generatedPDFs'); // Clear documents data
        
        // Reset stats
        const availableDaysElement = document.querySelector('.stat-card:first-child .stat-details p');
        if (availableDaysElement) {
            availableDaysElement.textContent = '25 jours';
        }
        
        const pendingRequestsElement = document.querySelector('.stat-card:nth-child(2) .stat-details p');
        if (pendingRequestsElement) {
            pendingRequestsElement.textContent = '0 demandes';
        }
        
        // Clear history table
        const historyTableBody = document.getElementById('historyTableBody');
        if (historyTableBody) {
            historyTableBody.innerHTML = '';
        }
        
        // Clear pending requests
        const pendingContent = document.getElementById('pending-content');
        if (pendingContent) {
            pendingContent.innerHTML = '';
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-inbox"></i>
                <p>Aucune demande en attente</p>
            `;
            pendingContent.appendChild(emptyState);
        }
        
        // Clear documents grid
        const documentsGrid = document.getElementById('documentsGrid');
        if (documentsGrid) {
            documentsGrid.innerHTML = '';
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-documents-state';
            emptyState.innerHTML = `
                <i class="fas fa-file-pdf"></i>
                <p>Aucun document disponible</p>
                <small>Les documents apparaîtront ici après l'approbation de vos congés</small>
            `;
            documentsGrid.appendChild(emptyState);
        }
        
        // Update calendar
        if (typeof updateCalendar === 'function') {
            updateCalendar();
        }
        
        // Add back the sample PDF data for demo purposes when the page reloads
        const samplePDFs = [
            {
                id: 'pdf_001',
                title: 'Attestation de Congé Payé',
                employeeName: 'John Doe',
                employeeId: 'EMP2025-001',
                department: 'Développement',
                leaveType: 'Congé Payé',
                startDate: '01/08/2025',
                endDate: '15/08/2025',
                duration: '15',
                approvedBy: 'Ahmed Manager',
                approvedDate: '15/07/2025',
                fileName: 'attestation_conge_20250801.pdf',
                createdDate: '2025-07-15T10:30:00'
            },
            {
                id: 'pdf_002',
                title: 'Certificat de Travail',
                employeeName: 'John Doe',
                employeeId: 'EMP2025-001',
                department: 'Développement',
                leaveType: 'N/A',
                startDate: 'N/A',
                endDate: 'N/A',
                duration: 'N/A',
                approvedBy: 'Direction RH',
                approvedDate: '01/06/2025',
                fileName: 'certificat_travail_JohnDoe.pdf',
                createdDate: '2025-06-01T15:45:00'
            }
        ];
        localStorage.setItem('generatedPDFs', JSON.stringify(samplePDFs));
    }

    // Navigation Management
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('.section');
    const pageTitle = document.getElementById('currentPageTitle');

    // Initialize profile picture upload first
    initializeProfilePictureUpload();

    // Load initial leave requests for pending tab
    loadLeaveRequests('pending');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                    pageTitle.textContent = link.querySelector('span').textContent;
                    
                    // Initialize specific section content when it becomes active
                    if (targetSection === 'documents') {
                        Employee.loadDocuments();
                    } else if (targetSection === 'history') {
                        loadHistoryFromStorage();
                    } else if (targetSection === 'leave-requests') {
                        const activeTab = document.querySelector('.tab-btn.active');
                        if (activeTab) {
                            loadLeaveRequests(activeTab.dataset.tab);
                        } else {
                            loadLeaveRequests('pending');
                        }
                    }
                }
            });
        });
    });
 
    // Leave Request Form Handler
    const leaveForm = document.getElementById('leaveRequestForm');
    
    leaveForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(leaveForm);
        const startDate = new Date(formData.get('startDate'));
        const endDate = new Date(formData.get('endDate'));
        const leaveType = formData.get('leaveType');

        // Validate dates
        if (startDate > endDate) {
            showNotification('La date de fin doit être postérieure à la date de début', 'error');
            return;
        }

        // Check if the leave request is submitted with enough advance notice (15 days)
        // except for 'Congé Maladie' and 'Autre' (exceptional leave)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const minAdvanceNoticeDays = 15;
        const advanceNoticeRequired = ['Congé Payé', 'Congé Sans Solde', 'Congé Maternité', 'Congé Formation'];
        
        if (advanceNoticeRequired.includes(leaveType)) {
            const daysDifference = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysDifference < minAdvanceNoticeDays) {
                showNotification(`Les demandes de ${leaveType} doivent être effectuées au moins ${minAdvanceNoticeDays} jours à l'avance`, 'error');
                return;
            }
        }

        // Calculate duration
        const duration = calculateDuration(startDate, endDate);
        
        // Validate available days
        const availableDays = parseInt(document.querySelector('.stat-card:first-child .stat-details p').textContent);
        if (duration > availableDays) {
            showNotification('Vous n\'avez pas assez de jours de congés disponibles', 'error');
            return;
        }

        // Process form submission
        updateLeaveStats(duration);
        
        // Create leave request data object to be used in multiple places
        const leaveData = {
            type: leaveType,
            startDate: startDate,
            endDate: endDate,
            duration: duration,
            reason: formData.get('reason'),
            submitDate: new Date(),
            status: 'En Attente'
        };
        
        // Add to pending requests
        addNewLeaveRequest(leaveData);
        
        // Add to history
        addToHistory(leaveData);
        
        // Update calendar with new leave requests
        updateCalendar();
        
        // Show success notification with green checkmark
        showNotification('Demande de congé soumise avec succès!', 'success');
        
        leaveForm.reset();
    });

    // File Upload Handler
    const fileInput = document.getElementById('documents');
    const fileLabel = document.querySelector('.file-upload-label span');
    
    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        if (files.length > 0) {
            fileLabel.textContent = files.length > 1 
                ? `${files.length} fichiers sélectionnés` 
                : files[0].name;
        } else {
            fileLabel.textContent = 'Glissez vos fichiers ici ou cliquez pour télécharger';
        }
    });

    // Leave Status Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            // Load corresponding content
            loadLeaveRequests(button.dataset.tab);
        });
    });

    // Notification System
    const notificationSystem = {
        init() {
            this.notificationsContainer = document.querySelector('.notifications');
            this.notificationItems = document.querySelectorAll('.notification-item');
            this.markAllReadBtn = document.querySelector('.mark-all-read');
            this.badge = document.querySelector('.notifications .badge');
            this.setupEventListeners();
            this.updateBadgeCount();
        },

        setupEventListeners() {
            // Toggle notifications dropdown
            this.notificationsContainer.addEventListener('click', (e) => {
                if (e.target.closest('.notifications-icon')) {
                    this.toggleNotifications();
                }
            });

            // Close notifications when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.notifications')) {
                    this.notificationsContainer.classList.remove('active');
                }
            });

            // Mark all as read
            this.markAllReadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.markAllAsRead();
            });

            // Individual notification click
            this.notificationItems.forEach(item => {
                item.addEventListener('click', () => {
                    this.markAsRead(item);
                    this.updateBadgeCount();
                });
            });
        },

        toggleNotifications() {
            this.notificationsContainer.classList.toggle('active');
        },

        markAsRead(item) {
            item.classList.remove('unread');
        },

        markAllAsRead() {
            this.notificationItems.forEach(item => {
                this.markAsRead(item);
            });
            this.updateBadgeCount();
        },

        updateBadgeCount() {
            const unreadCount = document.querySelectorAll('.notification-item.unread').length;
            this.badge.textContent = unreadCount;
            this.badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    };

    // Initialize notification system
    notificationSystem.init();

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

    // Helper Functions
    function calculateDuration(startDate, endDate) {
        // Normalize dates to remove time component
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        // Calculate difference in days
        const diffTime = Math.abs(end - start);
        // Add 1 because the range is inclusive (both start and end days count)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }

    function updateLeaveStats(usedDays) {
        const availableDaysElement = document.querySelector('.stat-card:first-child .stat-details p');
        const currentDays = parseInt(availableDaysElement.textContent);
        availableDaysElement.textContent = `${currentDays - usedDays} jours`;

        const pendingRequestsElement = document.querySelector('.stat-card:nth-child(2) .stat-details p');
        const currentPending = parseInt(pendingRequestsElement.textContent);
        pendingRequestsElement.textContent = `${currentPending + 1} demandes`;
    }

    function addNewLeaveRequest(leaveData) {
        const pendingContent = document.getElementById('pending-content');
        
        const requestElement = document.createElement('div');
        requestElement.className = 'request-item pending';
        requestElement.innerHTML = `
            <div class="request-info">
                <h4>${leaveData.type}</h4>
                <p>${leaveData.startDate.toLocaleDateString('fr-FR')} - ${leaveData.endDate.toLocaleDateString('fr-FR')}</p>
                <small>Soumis le ${leaveData.submitDate.toLocaleDateString('fr-FR')}</small>
            </div>
            <span class="status">En Attente</span>
        `;

        pendingContent.insertBefore(requestElement, pendingContent.firstChild);
    }

    // Function to add leave request to history table
    function addToHistory(leaveData) {
        const historyTableBody = document.getElementById('historyTableBody');
        
        // Create row for history table
        const row = document.createElement('tr');
        
        // Only show cancel button for pending requests, not for approved ones
        const showCancelButton = leaveData.status === 'En Attente';
        
        row.innerHTML = `
            <td>${leaveData.submitDate.toLocaleDateString('fr-FR')}</td>
            <td>${leaveData.type}</td>
            <td>${leaveData.startDate.toLocaleDateString('fr-FR')} - ${leaveData.endDate.toLocaleDateString('fr-FR')}</td>
            <td>${leaveData.duration} jours</td>
            <td>
                <span class="status-badge ${leaveData.status === 'En Attente' ? 'pending' : 
                                          leaveData.status === 'Approuvé' ? 'approved' : 'rejected'}">
                    ${leaveData.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" title="Voir les détails">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${showCancelButton ? `
                    <button class="action-btn cancel" title="Annuler">
                        <i class="fas fa-times"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        // Add to history table (at the beginning for most recent)
        if (historyTableBody.firstChild) {
            historyTableBody.insertBefore(row, historyTableBody.firstChild);
        } else {
            historyTableBody.appendChild(row);
        }
        
        // Store leave data in localStorage for persistence
        saveLeaveHistory(leaveData);
    }
    
    // Function to save leave data to localStorage
    function saveLeaveHistory(leaveData) {
        // Get existing history or initialize empty array
        const history = JSON.parse(localStorage.getItem('leaveHistory') || '[]');
        
        // Create a unique ID for this leave request
        const leaveId = 'leave_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        
        // Add new request to history with the ID
        const newLeaveRequest = {
            id: leaveId,
            type: leaveData.type,
            startDate: leaveData.startDate.toISOString(),
            endDate: leaveData.endDate.toISOString(),
            duration: leaveData.duration,
            reason: leaveData.reason,
            submitDate: leaveData.submitDate.toISOString(),
            status: leaveData.status,
            employeeName: 'John Doe', // Current employee name
            employeeId: 'EMP2025-001', // Current employee ID
            employeeAvatar: 'https://ui-avatars.com/api/?name=John+Doe', // Current employee avatar
            departmentName: 'Développement', // Current employee department
            managerName: 'Ahmed Manager' // Current employee's manager
        };
        
        // Add to employee's history
        history.unshift(newLeaveRequest);
        localStorage.setItem('leaveHistory', JSON.stringify(history));
        
        // Also add to the shared storage for manager access
        const allLeaveRequests = JSON.parse(localStorage.getItem('allLeaveRequests') || '[]');
        allLeaveRequests.unshift(newLeaveRequest);
        localStorage.setItem('allLeaveRequests', JSON.stringify(allLeaveRequests));
        
        // Update the notification count for managers
        const managerNotifications = parseInt(localStorage.getItem('managerNotificationCount') || '0');
        localStorage.setItem('managerNotificationCount', managerNotifications + 1);
        
        console.log('Leave request saved and shared with manager portal:', newLeaveRequest);
    }
    
    // Function to load history from localStorage and check for manager updates
    function loadHistoryFromStorage() {
        // First, check for any updates from manager in the shared storage
        checkForManagerUpdates();
        
        // Now load the updated employee history
        const history = JSON.parse(localStorage.getItem('leaveHistory') || '[]');
        const historyTableBody = document.getElementById('historyTableBody');
        
        if (history.length === 0) return;
        
        historyTableBody.innerHTML = '';
        
        history.forEach(item => {
            // Parse dates from ISO strings
            const submitDate = new Date(item.submitDate);
            const startDate = new Date(item.startDate);
            const endDate = new Date(item.endDate);
            
            // Only show cancel button for pending requests
            const showCancelButton = item.status === 'En Attente';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${submitDate.toLocaleDateString('fr-FR')}</td>
                <td>${item.type}</td>
                <td>${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}</td>
                <td>${item.duration} jours</td>
                <td>
                    <span class="status-badge ${item.status === 'En Attente' ? 'pending' : 
                                              item.status === 'Approuvé' ? 'approved' : 'rejected'}">
                        ${item.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" title="Voir les détails">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${showCancelButton ? `
                        <button class="action-btn cancel" title="Annuler">
                            <i class="fas fa-times"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            `;
            
            historyTableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        addHistoryActionListeners();
    }
    
    // Function to check for updates from manager
    function checkForManagerUpdates() {
        const employeeHistory = JSON.parse(localStorage.getItem('leaveHistory') || '[]');
        const allLeaveRequests = JSON.parse(localStorage.getItem('allLeaveRequests') || '[]');
        
        let updated = false;
        
        // Check each employee request to see if it has been updated by the manager
        for (let index = 0; index < employeeHistory.length; index++) {
            const employeeRequest = employeeHistory[index];
            if (!employeeRequest.id) continue; // Skip if no ID (older requests)
            
            // Find the matching request in the shared storage
            const sharedRequest = allLeaveRequests.find(req => req.id === employeeRequest.id);
            
            // If found and status is different, update the employee history
            if (sharedRequest && sharedRequest.status !== employeeRequest.status) {
                console.log(`Status changed for request ${employeeRequest.id}: ${employeeRequest.status} -> ${sharedRequest.status}`);
                
                employeeHistory[index].status = sharedRequest.status;
                employeeHistory[index].managerComment = sharedRequest.managerComment || '';
                employeeHistory[index].approvedDate = sharedRequest.approvedDate || '';
                employeeHistory[index].rejectedDate = sharedRequest.rejectedDate || '';
                
                // Show notification about status change
                if (sharedRequest.status === 'Approuvé') {
                    showNotification(`Votre demande de congé a été approuvée par ${sharedRequest.managerName || 'votre responsable'}`, 'success');
                } else if (sharedRequest.status === 'Refusé') {
                    showNotification(`Votre demande de congé a été refusée par ${sharedRequest.managerName || 'votre responsable'}. Motif: ${sharedRequest.managerComment || 'Non spécifié'}`, 'error');
                }
                
                updated = true;
            }
        }
        
        // If any updates were found, save the updated history
        if (updated) {
            console.log('Saving updated employee history:', employeeHistory);
            localStorage.setItem('leaveHistory', JSON.stringify(employeeHistory));
            
            // Update all view components
            refreshAllViews();
        }
        
        return updated;
    }
    
    // Helper function to refresh all UI components
    function refreshAllViews() {
        // Refresh the pending tab and any active tabs
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            loadLeaveRequests(activeTab.dataset.tab);
        } else {
            loadLeaveRequests('pending');
        }
        
        // Refresh the history table
        loadHistoryFromStorage();
        
        // Update the calendar
        updateCalendar();
    }
    
    // Add event listeners to history table action buttons
    function addHistoryActionListeners() {
        // View details button
        document.querySelectorAll('#historyTableBody .action-btn.view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Get the row data and show details
                const row = e.target.closest('tr');
                
                // Get the request details from the row
                const type = row.cells[1].textContent;
                const period = row.cells[2].textContent;
                const duration = row.cells[3].textContent;
                const status = row.cells[4].querySelector('.status-badge').textContent;
                
                // Show a modern notification with details
                showNotification(`Détails: ${type} - ${period} (${duration}) - Statut: ${status}`, 'info');
            });
        });
        
        // Cancel button
        document.querySelectorAll('#historyTableBody .action-btn.cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (btn.disabled) return;
                
                // Get the row
                const row = e.target.closest('tr');
                if (confirm('Êtes-vous sûr de vouloir annuler cette demande de congé?')) {
                    // Update the history in localStorage
                    updateLeaveStatusInStorage(row, 'Annulé');
                    
                    // Update the status badge
                    const statusBadge = row.querySelector('.status-badge');
                    statusBadge.className = 'status-badge rejected';
                    statusBadge.textContent = 'Annulé';
                    
                    // Disable the cancel button
                    btn.disabled = true;
                    
                    // Refresh the leave requests tabs
                    loadLeaveRequests('pending');
                    
                    // Update calendar immediately - this ensures days are returned to default color
                    updateCalendar();
                }
            });
        });
    }
    
    // Update leave status in localStorage
    function updateLeaveStatusInStorage(row, newStatus) {
        const history = JSON.parse(localStorage.getItem('leaveHistory') || '[]');
        const rowIndex = Array.from(row.parentNode.children).indexOf(row);
        
        if (history[rowIndex]) {
            // Get the leave request ID
            const leaveId = history[rowIndex].id;
            
            // Update the status
            history[rowIndex].status = newStatus;
            
            // For cancelled requests, mark them properly
            if (newStatus === 'Annulé') {
                history[rowIndex].isCancelled = true;
                
                // Show a notification with red color and X mark
                showNotification(`Demande de congé annulée`, 'error');
            } else {
                // Show a success notification with green color and checkmark
                showNotification(`Demande de congé mise à jour`, 'success');
            }
            
            // Update employee's history
            localStorage.setItem('leaveHistory', JSON.stringify(history));
            
            // Also update in the shared storage for manager access
            const allLeaveRequests = JSON.parse(localStorage.getItem('allLeaveRequests') || '[]');
            const requestIndex = allLeaveRequests.findIndex(req => req.id === leaveId);
            
            if (requestIndex !== -1) {
                allLeaveRequests[requestIndex].status = newStatus;
                if (newStatus === 'Annulé') {
                    allLeaveRequests[requestIndex].isCancelled = true;
                }
                localStorage.setItem('allLeaveRequests', JSON.stringify(allLeaveRequests));
                console.log('Leave request updated in shared storage:', allLeaveRequests[requestIndex]);
            }
            
            // Immediately update the calendar to reflect changes
            updateCalendar();
        }
    }
    
    // Initialize history section when history tab is clicked
    document.querySelector('nav a[data-section="history"]').addEventListener('click', () => {
        loadHistoryFromStorage();
    });
    
    // Filter functionality for history table
    document.getElementById('yearFilter').addEventListener('change', filterHistory);
    document.getElementById('typeFilter').addEventListener('change', filterHistory);
    
    function filterHistory() {
        const yearValue = document.getElementById('yearFilter').value;
        const typeValue = document.getElementById('typeFilter').value;
        
        let history = JSON.parse(localStorage.getItem('leaveHistory') || '[]');
        
        // Filter by year
        if (yearValue) {
            history = history.filter(item => {
                const submitDate = new Date(item.submitDate);
                return submitDate.getFullYear().toString() === yearValue;
            });
        }
        
        // Filter by type
        if (typeValue && typeValue !== 'all') {
            const typeMap = {
                'paid': 'Congé Payé',
                'unpaid': 'Congé Sans Solde',
                'sick': 'Congé Maladie'
            };
            
            if (typeMap[typeValue]) {
                history = history.filter(item => item.type === typeMap[typeValue]);
            }
        }
        
        // Update history table with filtered data
        const historyTableBody = document.getElementById('historyTableBody');
        historyTableBody.innerHTML = '';
        
        history.forEach(item => {
            // Parse dates from ISO strings
            const submitDate = new Date(item.submitDate);
            const startDate = new Date(item.startDate);
            const endDate = new Date(item.endDate);
            
            // Only show cancel button for pending requests
            const showCancelButton = item.status === 'En Attente';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${submitDate.toLocaleDateString('fr-FR')}</td>
                <td>${item.type}</td>
                <td>${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}</td>
                <td>${item.duration} jours</td>
                <td>
                    <span class="status-badge ${item.status === 'En Attente' ? 'pending' : 
                                              item.status === 'Approuvé' ? 'approved' : 'rejected'}">
                        ${item.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" title="Voir les détails">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${showCancelButton ? `
                        <button class="action-btn cancel" title="Annuler">
                            <i class="fas fa-times"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            `;
            
            historyTableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        addHistoryActionListeners();
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
                    localStorage.setItem('employeeProfilePicture', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });

        // Load saved profile picture if exists
        const savedProfilePicture = localStorage.getItem('employeeProfilePicture');
        if (savedProfilePicture) {
            profileImage.src = savedProfilePicture;
        }
    }

    // Initialize Leave Status Content with manager updates check
    function loadLeaveRequests(status) {
        // First check for any manager updates
        const updatedByManager = checkForManagerUpdates();
        
        // Hide all content first
        const allContents = document.querySelectorAll('.tab-content');
        allContents.forEach(content => {
            content.style.display = 'none';
        });
     
        // Show selected content
        const container = document.getElementById(`${status}-content`);
        if (container) {
            container.style.display = 'block';
        }

        // Initialize empty request categories
        const requests = {
            pending: [],
            approved: [],
            rejected: []
        };
        
        // Load from localStorage
        const history = JSON.parse(localStorage.getItem('leaveHistory') || '[]');
        
        // Populate requests based on status
        history.forEach(item => {
            if (item.status === 'En Attente') {
                requests.pending.push(item);
            } else if (item.status === 'Approuvé') {
                requests.approved.push(item);
            } else if (item.status === 'Refusé' || item.status === 'Annulé') {
                requests.rejected.push(item);
            }
        });

        if (container && requests[status]) {
            const requestList = document.createElement('div');
            requestList.className = 'request-list';
            
            if (requests[status].length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerHTML = `
                    <i class="fas fa-inbox"></i>
                    <p>Aucune demande ${status === 'pending' ? 'en attente' : status === 'approved' ? 'approuvée' : 'refusée'}</p>
                `;
                requestList.appendChild(emptyState);
            } else {
                requests[status].forEach(request => {
                    const requestItem = document.createElement('div');
                    requestItem.className = 'request-item';
                    
                    // Convert dates if they're strings
                    const startDate = request.startDate instanceof Date ? 
                        request.startDate : new Date(request.startDate);
                    const endDate = request.endDate instanceof Date ? 
                        request.endDate : new Date(request.endDate);
                    const submitDate = request.submitDate instanceof Date ? 
                        request.submitDate : new Date(request.submitDate);
                    
                    // Determine status text and icon
                    let statusText, statusIcon, statusClass;
                    if (request.status === 'En Attente') {
                        statusText = 'En Attente';
                        statusIcon = 'clock';
                        statusClass = 'pending';
                    } else if (request.status === 'Approuvé') {
                        statusText = 'Approuvé';
                        statusIcon = 'check-circle';
                        statusClass = 'approved';
                    } else if (request.status === 'Refusé') {
                        statusText = 'Refusé';
                        statusIcon = 'times-circle';
                        statusClass = 'rejected';
                    } else if (request.status === 'Annulé') {
                        statusText = 'Annulé';
                        statusIcon = 'ban';
                        statusClass = 'rejected';
                    }
                    
                    requestItem.innerHTML = `
                        <div class="request-header">
                            <span class="request-type">${request.type}</span>
                            <span class="request-status ${statusClass}">
                                <i class="fas fa-${statusIcon}"></i>
                                ${statusText}
                            </span>
                        </div>
                        <div class="request-details">
                            <p>Du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}</p>
                            <small>Soumis le ${submitDate.toLocaleDateString('fr-FR')}</small>
                            ${request.managerComment ? `<p class="manager-comment"><strong>Commentaire:</strong> ${request.managerComment}</p>` : ''}
                        </div>
                    `;
                    requestList.appendChild(requestItem);
                });
            }
            
            container.innerHTML = '';
            container.appendChild(requestList);
        }
    }

    // Calendar functionality
    class LeaveCalendar {
        constructor() {
            this.currentDate = new Date();
            this.calendarDays = document.getElementById('calendarDays');
            this.currentMonthElement = document.querySelector('.current-month');
            this.prevMonthBtn = document.querySelector('.prev-month');
            this.nextMonthBtn = document.querySelector('.next-month');
            
            // Get leave data from localStorage
            this.updateLeaveData();

            this.init();
        }
        
        updateLeaveData() {
            // Initialize empty leave data
            this.leaveData = {};
            
            // Get leave requests from localStorage
            const history = JSON.parse(localStorage.getItem('leaveHistory') || '[]');
            
            // Populate leave data
            history.forEach(item => {
                // Skip any cancelled leave requests
                if (item.status === 'Annulé' || item.isCancelled) {
                    return; // Skip this item
                }
                
                // Convert dates using local time to avoid timezone issues
                const startDate = new Date(item.startDate);
                const endDate = new Date(item.endDate);
                
                // Normalize dates to avoid timezone issues
                const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                
                // For each day of the leave period
                const current = new Date(start);
                while (current <= end) {
                    const dateStr = this.formatDate(current);
                    this.leaveData[dateStr] = { 
                        type: item.status === 'En Attente' ? 'pending' : 
                              item.status === 'Approuvé' ? 'approved' : 'rejected',
                        title: item.type
                    };
                    
                    // Move to the next day
                    current.setDate(current.getDate() + 1);
                }
            });
        }

        init() {
            this.renderCalendar();
            this.attachEventListeners();
        }

        attachEventListeners() {
            this.prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
            this.nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
        }

        changeMonth(delta) {
            this.currentDate.setMonth(this.currentDate.getMonth() + delta);
            this.renderCalendar();
        }

        formatDate(date) {
            // Ensure the date is formatted in local time to avoid timezone issues
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        isWeekend(date) {
            const day = date.getDay();
            return day === 0 || day === 6;
        }

        isToday(date) {
            const today = new Date();
            return date.getDate() === today.getDate() &&
                   date.getMonth() === today.getMonth() &&
                   date.getFullYear() === today.getFullYear();
        }

        getLeaveInfo(date) {
            const dateStr = this.formatDate(date);
            return this.leaveData[dateStr];
        }

        renderCalendar() {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            
            // Update month display
            this.currentMonthElement.textContent = this.currentDate.toLocaleString('fr-FR', {
                month: 'long',
                year: 'numeric'
            });

            // Get first day of month and total days
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const totalDays = lastDay.getDate();
            const startingDay = firstDay.getDay() || 7; // Convert Sunday (0) to 7

            // Clear previous calendar
            this.calendarDays.innerHTML = '';

            // Add empty cells for days before the first day of the month
            for (let i = 1; i < startingDay; i++) {
                this.calendarDays.appendChild(this.createDayElement(''));
            }

            // Add days of the month
            for (let day = 1; day <= totalDays; day++) {
                const date = new Date(year, month, day);
                const leaveInfo = this.getLeaveInfo(date);
                const isWeekend = this.isWeekend(date);
                const isToday = this.isToday(date);
                
                const dayElement = this.createDayElement(day, {
                    isWeekend,
                    isToday,
                    hasLeave: leaveInfo?.type === 'approved',
                    pendingLeave: leaveInfo?.type === 'pending',
                    rejectedLeave: leaveInfo?.type === 'rejected',
                    title: leaveInfo?.title
                });

                this.calendarDays.appendChild(dayElement);
            }
        }

        createDayElement(day, options = {}) {
            const div = document.createElement('div');
            div.className = 'calendar-day';
            
            if (!day) {
                return div;
            }

            div.textContent = day;

            if (options.isWeekend) {
                div.classList.add('weekend');
            }
            if (options.isToday) {
                div.classList.add('today');
            }
            if (options.hasLeave) {
                div.classList.add('has-leave');
                div.title = options.title;
                const indicator = document.createElement('div');
                indicator.className = 'leave-indicator';
                div.appendChild(indicator);
            }
            if (options.pendingLeave) {
                div.classList.add('pending-leave');
                div.title = options.title;
                const indicator = document.createElement('div');
                indicator.className = 'leave-indicator';
                div.appendChild(indicator);
            }
            if (options.rejectedLeave) {
                div.classList.add('rejected-leave');
                div.title = options.title;
                const indicator = document.createElement('div');
                indicator.className = 'leave-indicator';
                div.appendChild(indicator);
            }

            return div;
        }
    }

    // Initialize calendar when DOM is loaded
    const leaveCalendar = new LeaveCalendar();
    
    // Update calendar when new leave requests are added
    function updateCalendar() {
        if (leaveCalendar) {
            leaveCalendar.updateLeaveData();
            leaveCalendar.renderCalendar();
        }
    }

    // Create a proper Employee object to handle employee-related functions
    const Employee = {
        loadEmployeeData() {
            // Load basic employee info (in a real app this would be from a server)
            this.employeeData = {
                id: 'EMP001',
                name: 'Mohammed Employee',
                position: 'Flight Attendant',
                department: 'Cabin Crew',
                joinDate: '2020-01-15',
                totalLeave: 30,
                usedLeave: 12,
                pendingLeave: 0
            };
    
            // Update leave counters
            this.updateLeaveCounters();
            
            // Load leave requests
            this.loadLeaveRequests();
            
            // Load documents (including generated PDFs)
            this.loadDocuments();
        },
        
        updateLeaveCounters() {
            // Placeholder for the updateLeaveCounters method
            console.log("Updating leave counters");
        },
        
        loadLeaveRequests() {
            // Placeholder for the loadLeaveRequests method
            console.log("Loading leave requests for employee");
        },
        
        loadDocuments() {
            const documentsGrid = document.getElementById('documentsGrid');
            if (!documentsGrid) return;
            
            // Clear previous content
            documentsGrid.innerHTML = '';
            
            // Get employee ID from the employee data
            const employeeId = this.employeeData?.id || 'EMP2025-001';
            
            // Load documents from localStorage 
            const generatedPDFs = JSON.parse(localStorage.getItem('generatedPDFs') || '[]');
            
            // For demo purposes, show all PDFs
            const allDocuments = [...generatedPDFs];
            
            // Check if we have documents
            if (allDocuments.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-documents-state';
                emptyState.innerHTML = `
                    <i class="fas fa-file-pdf"></i>
                    <p>Aucun document disponible</p>
                    <small>Les documents apparaîtront ici après l'approbation de vos congés</small>
                `;
                documentsGrid.appendChild(emptyState);
                return;
            }
            
            // Display documents
            allDocuments.forEach(doc => {
                const docName = doc.title || doc.fileName;
                const docType = 'PDF';
                const docSize = '320 KB';
                const docDate = new Date(doc.createdDate || Date.now()).toLocaleDateString('fr-FR');
                const docId = doc.id || '';
                
                // Get document icon based on type or title
                let docIcon = 'fa-file-pdf';
                if (docName.toLowerCase().includes('certificat')) {
                    docIcon = 'fa-certificate';
                } else if (docName.toLowerCase().includes('paie')) {
                    docIcon = 'fa-money-check-alt';
                } else if (docName.toLowerCase().includes('attestation')) {
                    docIcon = 'fa-file-signature';
                }
                
                const documentItem = document.createElement('div');
                documentItem.className = 'document-card';
                documentItem.innerHTML = `
                    <div class="document-icon">
                        <i class="fas ${docIcon}"></i>
                    </div>
                    <div class="document-info">
                        <h3>${docName}</h3>
                        <div class="document-meta">
                            <span><i class="fas fa-file-alt"></i> ${docType}</span>
                            <span><i class="fas fa-weight"></i> ${docSize}</span>
                            <span><i class="far fa-calendar-alt"></i> ${docDate}</span>
                        </div>
                    </div>
                    <div class="document-actions">
                        <button class="btn-view-doc" title="Visualiser" data-doc-id="${docId}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-download-doc" title="Télécharger" data-doc-id="${docId}">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                `;
                
                documentsGrid.appendChild(documentItem);
            });
            
            // Add event listeners for document actions
            this.addDocumentEventListeners();
            
            console.log("Documents loaded:", allDocuments.length);
        },
        
        addDocumentEventListeners() {
            // View document buttons
            document.querySelectorAll('.btn-view-doc').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const docId = e.currentTarget.getAttribute('data-doc-id');
                    if (docId) {
                        // For any document with an ID, try to view it
                        Employee.viewGeneratedPDF(docId);
                    } else {
                        showNotification('Visualisation du document non disponible pour le moment', 'info');
                    }
                });
            });
            
            // Download document buttons
            document.querySelectorAll('.btn-download-doc').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const docId = e.currentTarget.getAttribute('data-doc-id');
                    if (docId) {
                        // For any document with an ID, try to download it
                        Employee.downloadGeneratedPDF(docId);
                    } else {
                        showNotification('Téléchargement du document non disponible pour le moment', 'info');
                    }
                });
            });
        },
        
        viewGeneratedPDF(docId) {
            // First try to find in generatedPDFs
            const generatedPDFs = JSON.parse(localStorage.getItem('generatedPDFs') || '[]');
            let pdfData = generatedPDFs.find(pdf => pdf.id === docId);
            
            // If not found, create placeholder data for demos
            if (!pdfData) {
                // Create placeholder data for demo purposes
                pdfData = {
                    id: docId,
                    title: docId.includes('paie') ? 'Fiche de paie' : 'Attestation de travail',
                    employeeName: 'John Doe',
                    employeeId: 'EMP2025-001',
                    department: 'Développement',
                    leaveType: 'Congé Annuel',
                    startDate: '01/05/2025',
                    endDate: '15/05/2025',
                    duration: '15',
                    approvedBy: 'Ahmed Manager',
                    approvedDate: '15/04/2025',
                    fileName: `Document-${docId}.pdf`
                };
            }
            
            // Create a modal to display the PDF
            const modalHTML = `
                <div class="modal-content pdf-preview">
                    <div class="modal-header">
                        <h2>${pdfData.title}</h2>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="pdf-container">
                            <div class="pdf-header">
                                <div class="company-info">
                                    <img src="logo.png" alt="Air Algérie Logo" class="company-logo">
                                    <h1>Air Algérie</h1>
                                </div>
                                <h2>${pdfData.title}</h2>
                            </div>
                            <div class="pdf-content">
                                <p class="pdf-intro">Ce document atteste que :</p>
                                <div class="employee-details">
                                    <p><strong>Nom de l'employé:</strong> ${pdfData.employeeName}</p>
                                    <p><strong>ID de l'employé:</strong> ${pdfData.employeeId}</p>
                                    <p><strong>Département:</strong> ${pdfData.department}</p>
                                </div>
                                <p class="leave-confirmation">a obtenu l'autorisation de prendre un congé selon les détails suivants :</p>
                                <div class="leave-details">
                                    <p><strong>Type de congé:</strong> ${pdfData.leaveType}</p>
                                    <p><strong>Date de début:</strong> ${pdfData.startDate}</p>
                                    <p><strong>Date de fin:</strong> ${pdfData.endDate}</p>
                                    <p><strong>Durée totale:</strong> ${pdfData.duration} jours</p>
                                </div>
                                <div class="approval-details">
                                    <p><strong>Approuvé par:</strong> ${pdfData.approvedBy}</p>
                                    <p><strong>Date d'approbation:</strong> ${pdfData.approvedDate}</p>
                                </div>
                                <div class="pdf-footer">
                                    <p>Ce document est généré automatiquement et ne nécessite pas de signature physique.</p>
                                    <p class="legal-text">Conformément à la politique de congés d'Air Algérie.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-primary" id="downloadPdfBtn" data-pdf-id="${docId}">
                            <i class="fas fa-download"></i> Télécharger
                        </button>
                        <button class="btn-secondary close-modal">Fermer</button>
                    </div>
                </div>
            `;
            
            // Create and show the modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = modalHTML;
            document.body.appendChild(modal);
            
            // Show the modal
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            
            // Add event listeners for modal
            modal.querySelectorAll('.close-modal').forEach(el => {
                el.addEventListener('click', () => {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(modal);
                    }, 300);
                });
            });
            
            // Add download event listener
            const downloadBtn = modal.querySelector('#downloadPdfBtn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    // Show loading state on button
                    const originalText = downloadBtn.innerHTML;
                    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Téléchargement...';
                    downloadBtn.disabled = true;
                    
                    // Download the PDF
                    Employee.downloadGeneratedPDF(docId);
                    
                    // Reset button after download
                    setTimeout(() => {
                        downloadBtn.innerHTML = originalText;
                        downloadBtn.disabled = false;
                    }, 1500);
                });
            }
        },
        
        downloadGeneratedPDF(docId) {
            // First try to find in generatedPDFs
            const generatedPDFs = JSON.parse(localStorage.getItem('generatedPDFs') || '[]');
            let pdfData = generatedPDFs.find(pdf => pdf.id === docId);
            
            // If not found, create a placeholder for demo
            if (!pdfData) {
                // Create placeholder data for demo
                pdfData = {
                    id: docId,
                    title: docId.includes('paie') ? 'Fiche de paie' : 'Attestation de travail',
                    fileName: docId.includes('paie') ? 'Fiche-de-paie.pdf' : `Document-${docId}.pdf`,
                    employeeName: 'John Doe',
                    employeeId: 'EMP2025-001',
                    department: 'Développement',
                    leaveType: 'Congé Annuel',
                    startDate: '01/05/2025',
                    endDate: '15/05/2025',
                    duration: '15',
                    approvedBy: 'Ahmed Manager',
                    approvedDate: '15/04/2025'
                };
            }
            
            // Show notification that download is starting
            showNotification(`Téléchargement de "${pdfData.fileName}" en cours...`, 'success');
            
            try {
                // Create a blob with dummy content to simulate a PDF file
                const pdfContent = this.generatePDFContent(pdfData);
                const blob = new Blob([pdfContent], { type: 'application/pdf' });
                
                // Try modern browsers first
                if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                    // For IE
                    window.navigator.msSaveOrOpenBlob(blob, pdfData.fileName);
                    this.showDownloadSuccess(pdfData.fileName);
                    return;
                } 
                
                // For modern browsers
                const url = URL.createObjectURL(blob);
                
                // Create a link element and trigger download
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = pdfData.fileName || `document-${docId}.pdf`;
                downloadLink.style.display = 'none';
                
                // Append link to body, click it, then remove it
                document.body.appendChild(downloadLink);
                downloadLink.click();
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(downloadLink);
                    URL.revokeObjectURL(url);
                    this.showDownloadSuccess(pdfData.fileName);
                }, 100);
            } catch (error) {
                console.error('Download error:', error);
                
                // Fallback: Open file in new tab
                const pdfContent = this.generatePDFContent(pdfData);
                const base64Data = btoa(pdfContent);
                const dataUrl = `data:application/pdf;base64,${base64Data}`;
                
                window.open(dataUrl, '_blank');
                this.showDownloadSuccess(pdfData.fileName);
            }
        },
        
        showDownloadSuccess(fileName) {
            // Show success notification after slight delay
            setTimeout(() => {
                showNotification(`Document "${fileName}" téléchargé avec succès`, 'success');
            }, 500);
        },
        
        // Helper method to generate PDF content (in a real app, this would create a real PDF)
        generatePDFContent(pdfData) {
            // This is a very simplified simulation of PDF content
            // In a real app, you would use a proper PDF generation library
            return `%PDF-1.5
1 0 obj
<</Type/Catalog/Pages 2 0 R>>
endobj
2 0 obj
<</Type/Pages/Kids[3 0 R]/Count 1>>
endobj
3 0 obj
<</Type/Page/MediaBox[0 0 595 842]/Resources<<>>>>
endobj
xref
0 4
0000000000 65535 f
0000000010 00000 n
0000000053 00000 n
0000000102 00000 n
trailer
<</Size 4/Root 1 0 R>>
startxref
178
%%EOF
Document: ${pdfData.title}
Employee: ${pdfData.employeeName}
ID: ${pdfData.employeeId}
Department: ${pdfData.department}
Leave Type: ${pdfData.leaveType}
Period: ${pdfData.startDate} - ${pdfData.endDate}
Duration: ${pdfData.duration} days
Approved by: ${pdfData.approvedBy}
Date: ${pdfData.approvedDate}`;
        }
    };

    // Initialize Employee functionality
    Employee.employeeData = {
        id: 'EMP2025-001',
        name: 'John Doe',
        position: 'Développeur Senior',
        department: 'Développement',
        joinDate: '2023-01-15',
        totalLeave: 30,
        usedLeave: 15,
        pendingLeave: 2
    };

    // Call document load function specifically to populate documents
    document.querySelector('nav a[data-section="documents"]').addEventListener('click', () => {
        Employee.loadDocuments();
    });

    // Initialize the documents section if it's the active section
    if (document.getElementById('documents').classList.contains('active')) {
        Employee.loadDocuments();
    }
});
