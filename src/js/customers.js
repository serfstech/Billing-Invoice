export default class Customers {
    constructor(app) {
        this.app = app;
    }

    async load() {
        return `
            <div class="content-header">
                <div class="header-left">
                    <h1><i class="material-icons">people</i> Customers</h1>
                    <p class="content-subtitle">Manage your customer database</p>
                </div>
                <div class="header-right">
                    <button class="btn btn-primary" id="addCustomerBtn">
                        <i class="material-icons">person_add</i> Add Customer
                    </button>
                    <button class="btn btn-outline" id="importCustomersBtn">
                        <i class="material-icons">upload</i> Import
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--purple-400), var(--purple-600));">
                        <i class="material-icons">person</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="totalCustomers">0</div>
                        <div class="stat-label">Total Customers</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--green-400), var(--green-600));">
                        <i class="material-icons">shopping_cart</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="activeCustomers">0</div>
                        <div class="stat-label">Active Customers</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--blue-400), var(--blue-600));">
                        <i class="material-icons">receipt</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="totalInvoices">0</div>
                        <div class="stat-label">Total Invoices</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--orange-400), var(--orange-600));">
                        <i class="material-icons">payments</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="totalRevenue">₹0</div>
                        <div class="stat-label">Total Revenue</div>
                    </div>
                </div>
            </div>

            <!-- Search and Filters -->
            <div class="card">
                <div class="card-body">
                    <div class="search-filter-container">
                        <div class="search-box">
                            <i class="material-icons">search</i>
                            <input type="text" id="customerSearch" placeholder="Search customers by name, phone, or GST..." class="form-control">
                        </div>
                        <div class="filter-options">
                            <select class="form-control" id="filterType">
                                <option value="">All Types</option>
                                <option value="retail">Retail</option>
                                <option value="wholesale">Wholesale</option>
                                <option value="corporate">Corporate</option>
                            </select>
                            <select class="form-control" id="filterActivity">
                                <option value="">All Activity</option>
                                <option value="active">Active (Last 30 days)</option>
                                <option value="inactive">Inactive (30+ days)</option>
                            </select>
                            <button class="btn btn-outline" id="exportCustomers">
                                <i class="material-icons">download</i> Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Customers Table -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Customer List</h2>
                    <div class="card-actions">
                        <div class="table-summary">
                            Showing <span id="showingCount">0</span> of <span id="totalCount">0</span> customers
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table" id="customersTable">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Type</th>
                                    <th>GST No.</th>
                                    <th>Total Invoices</th>
                                    <th>Total Amount</th>
                                    <th>Last Purchase</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="customersTableBody">
                                <tr>
                                    <td colspan="10" class="text-center">
                                        <div class="loading-content">
                                            <i class="material-icons spin">refresh</i>
                                            <p>Loading customers...</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="pagination-container" id="customersPagination">
                        <div class="pagination-info">
                            Page <span id="currentPage">1</span> of <span id="totalPages">1</span>
                        </div>
                        <div class="pagination-controls">
                            <button class="btn btn-outline" id="prevPage" disabled>
                                <i class="material-icons">chevron_left</i>
                            </button>
                            <button class="btn btn-outline" id="nextPage" disabled>
                                <i class="material-icons">chevron_right</i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async init() {
        await this.loadCustomerStats();
        await this.loadCustomers();
        this.setupEventListeners();
        this.setupSearch();
    }

    async loadCustomerStats() {
        try {
            const [total, active, invoices, revenue] = await Promise.all([
                this.app.queryDatabase('SELECT COUNT(*) as count FROM customers'),
                this.app.queryDatabase(`
                    SELECT COUNT(DISTINCT c.id) as count 
                    FROM customers c
                    JOIN invoices i ON c.id = i.customer_id
                    WHERE i.invoice_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                `),
                this.app.queryDatabase('SELECT COUNT(*) as count FROM invoices'),
                this.app.queryDatabase('SELECT COALESCE(SUM(grand_total), 0) as total FROM invoices')
            ]);

            document.getElementById('totalCustomers').textContent = total[0].count;
            document.getElementById('activeCustomers').textContent = active[0].count;
            document.getElementById('totalInvoices').textContent = invoices[0].count;
            document.getElementById('totalRevenue').textContent = this.app.formatCurrency(revenue[0].total);

        } catch (error) {
            console.error('Error loading customer stats:', error);
        }
    }

    async loadCustomers(page = 1, search = '', filters = {}) {
        try {
            this.app.showLoading();
            
            const limit = 10;
            const offset = (page - 1) * limit;

            let query = `
                SELECT c.*, 
                    COUNT(i.id) as invoice_count,
                    COALESCE(SUM(i.grand_total), 0) as total_amount,
                    MAX(i.invoice_date) as last_purchase_date
                FROM customers c
                LEFT JOIN invoices i ON c.id = i.customer_id
            `;

            const params = [];
            const conditions = [];
            
            // Search condition
            if (search) {
                conditions.push(`(c.name LIKE ? OR c.phone LIKE ? OR c.gst_number LIKE ?)`);
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
            
            // Filter conditions
            if (filters.type) {
                conditions.push(`c.customer_type = ?`);
                params.push(filters.type);
            }
            
            if (filters.activity) {
                if (filters.activity === 'active') {
                    conditions.push(`i.invoice_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`);
                } else if (filters.activity === 'inactive') {
                    conditions.push(`(i.invoice_date IS NULL OR i.invoice_date < DATE_SUB(NOW(), INTERVAL 30 DAY))`);
                }
            }
            
            // Add WHERE clause if conditions exist
            if (conditions.length > 0) {
                query += ` WHERE ` + conditions.join(' AND ');
            }
            
            query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const customers = await this.app.queryDatabase(query, params);
            
            // Get total count
            let countQuery = `
                SELECT COUNT(DISTINCT c.id) as total 
                FROM customers c
                LEFT JOIN invoices i ON c.id = i.customer_id
            `;
            
            if (conditions.length > 0) {
                countQuery += ` WHERE ` + conditions.join(' AND ');
            }
            
            const countResult = await this.app.queryDatabase(countQuery, params.slice(0, -2)); // Remove limit/offset
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);

            this.updateCustomersTable(customers);
            this.updatePagination(page, totalPages, total);

        } catch (error) {
            console.error('Error loading customers:', error);
            this.app.showToast('Error', 'Failed to load customers', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    updateCustomersTable(customers) {
        const tbody = document.getElementById('customersTableBody');
        if (!tbody) return;

        if (customers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        <div class="empty-state">
                            <i class="material-icons">people</i>
                            <h3>No Customers Found</h3>
                            <p>Add your first customer to get started</p>
                            <button class="btn btn-primary" id="addFirstCustomer">
                                <i class="material-icons">person_add</i> Add Customer
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            
            document.getElementById('addFirstCustomer')?.addEventListener('click', () => {
                this.showAddCustomerModal();
            });
            
            return;
        }

        let tableHTML = '';
        
        customers.forEach(customer => {
            const typeBadge = {
                retail: 'badge-info',
                wholesale: 'badge-success',
                corporate: 'badge-primary'
            }[customer.customer_type] || 'badge-secondary';
            
            const lastPurchase = customer.last_purchase_date 
                ? this.app.formatDate(customer.last_purchase_date)
                : 'Never';
            
            tableHTML += `
                <tr data-id="${customer.id}">
                    <td>CUST${customer.id.toString().padStart(4, '0')}</td>
                    <td>
                        <div class="customer-name">
                            <strong>${customer.name}</strong>
                            <span class="badge ${typeBadge}">${customer.customer_type}</span>
                        </div>
                    </td>
                    <td>
                        <div class="phone-cell">
                            ${customer.phone || 'N/A'}
                            ${customer.phone ? `<a href="tel:${customer.phone}" class="phone-link"><i class="material-icons">phone</i></a>` : ''}
                        </div>
                    </td>
                    <td>
                        ${customer.email ? `
                            <div class="email-cell">
                                <a href="mailto:${customer.email}">${customer.email}</a>
                            </div>
                        ` : 'N/A'}
                    </td>
                    <td>
                        <span class="badge ${typeBadge}">
                            ${customer.customer_type}
                        </span>
                    </td>
                    <td>${customer.gst_number || 'N/A'}</td>
                    <td>${customer.invoice_count}</td>
                    <td>${this.app.formatCurrency(customer.total_amount)}</td>
                    <td>${lastPurchase}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-text view-customer" data-id="${customer.id}" title="View">
                                <i class="material-icons">visibility</i>
                            </button>
                            <button class="btn btn-sm btn-text edit-customer" data-id="${customer.id}" title="Edit">
                                <i class="material-icons">edit</i>
                            </button>
                            <button class="btn btn-sm btn-text quick-invoice" data-id="${customer.id}" title="Quick Invoice">
                                <i class="material-icons">receipt</i>
                            </button>
                            <button class="btn btn-sm btn-text delete-customer" data-id="${customer.id}" title="Delete">
                                <i class="material-icons">delete</i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = tableHTML;
        this.attachCustomerEventListeners();
    }

    updatePagination(currentPage, totalPages, totalCount) {
        const showingElement = document.getElementById('showingCount');
        const totalElement = document.getElementById('totalCount');
        const currentPageElement = document.getElementById('currentPage');
        const totalPagesElement = document.getElementById('totalPages');
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');

        if (showingElement) {
            const showing = Math.min(currentPage * 10, totalCount);
            const from = (currentPage - 1) * 10 + 1;
            showingElement.textContent = `${from}-${showing}`;
        }

        if (totalElement) totalElement.textContent = totalCount;
        if (currentPageElement) currentPageElement.textContent = currentPage;
        if (totalPagesElement) totalPagesElement.textContent = totalPages;

        if (prevButton) {
            prevButton.disabled = currentPage === 1;
            prevButton.onclick = () => {
                const search = document.getElementById('customerSearch')?.value || '';
                const type = document.getElementById('filterType')?.value || '';
                const activity = document.getElementById('filterActivity')?.value || '';
                this.loadCustomers(currentPage - 1, search, { type, activity });
            };
        }

        if (nextButton) {
            nextButton.disabled = currentPage === totalPages;
            nextButton.onclick = () => {
                const search = document.getElementById('customerSearch')?.value || '';
                const type = document.getElementById('filterType')?.value || '';
                const activity = document.getElementById('filterActivity')?.value || '';
                this.loadCustomers(currentPage + 1, search, { type, activity });
            };
        }
    }

    attachCustomerEventListeners() {
        // View customer
        document.querySelectorAll('.view-customer').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const customerId = e.currentTarget.dataset.id;
                this.viewCustomer(customerId);
            });
        });

        // Edit customer
        document.querySelectorAll('.edit-customer').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const customerId = e.currentTarget.dataset.id;
                this.editCustomer(customerId);
            });
        });

        // Quick invoice
        document.querySelectorAll('.quick-invoice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const customerId = e.currentTarget.dataset.id;
                this.createQuickInvoice(customerId);
            });
        });

        // Delete customer
        document.querySelectorAll('.delete-customer').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const customerId = e.currentTarget.dataset.id;
                this.deleteCustomer(customerId);
            });
        });
    }

    setupEventListeners() {
        // Add customer button
        document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
            this.showAddCustomerModal();
        });

        // Import button
        document.getElementById('importCustomersBtn')?.addEventListener('click', () => {
            this.showImportModal();
        });

        // Export button
        document.getElementById('exportCustomers')?.addEventListener('click', () => {
            this.exportCustomers();
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('customerSearch');
        const typeFilter = document.getElementById('filterType');
        const activityFilter = document.getElementById('filterActivity');

        const loadWithFilters = this.app.debounce(() => {
            const search = searchInput?.value || '';
            const type = typeFilter?.value || '';
            const activity = activityFilter?.value || '';
            this.loadCustomers(1, search, { type, activity });
        }, 300);

        if (searchInput) {
            searchInput.addEventListener('input', loadWithFilters);
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', loadWithFilters);
        }

        if (activityFilter) {
            activityFilter.addEventListener('change', loadWithFilters);
        }
    }

    showAddCustomerModal() {
        const modalContent = `
            <form id="addCustomerForm" class="modal-form">
                <div class="form-grid">
                    <div class="form-row">
                        <label class="form-label">Customer Name *</label>
                        <input type="text" class="form-control" name="name" required autocomplete="off">
                    </div>
                    
                    <div class="form-row">
                        <label class="form-label">Customer Type</label>
                        <select class="form-control" name="customer_type">
                            <option value="retail">Retail</option>
                            <option value="wholesale">Wholesale</option>
                            <option value="corporate">Corporate</option>
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <label class="form-label">Phone Number *</label>
                        <input type="tel" class="form-control" name="phone" required autocomplete="off" pattern="[0-9]{10}">
                        <small class="form-text">10-digit phone number required</small>
                    </div>
                    
                    <div class="form-row">
                        <label class="form-label">Email Address</label>
                        <input type="email" class="form-control" name="email" autocomplete="off">
                    </div>
                    
                    <div class="form-row">
                        <label class="form-label">GST Number</label>
                        <input type="text" class="form-control" name="gst_number" autocomplete="off" 
                               pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                               title="Enter valid GST number (27ABCDE1234F1Z5)">
                    </div>
                    
                    <div class="form-row full-width">
                        <label class="form-label">Address</label>
                        <textarea class="form-control" name="address" rows="3" autocomplete="off"></textarea>
                    </div>
                </div>
            </form>
        `;

        const modal = this.app.showModal('Add New Customer', modalContent, [
            { text: 'Cancel', class: 'btn-secondary' },
            { text: 'Save Customer', class: 'btn-primary', id: 'saveCustomerBtn' }
        ]);

        const form = modal.querySelector('#addCustomerForm');
        const saveBtn = modal.querySelector('#saveCustomerBtn');

        saveBtn.addEventListener('click', async () => {
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Validate phone
            if (!this.app.validatePhone(data.phone)) {
                this.app.showToast('Error', 'Please enter a valid 10-digit phone number', 'error');
                return;
            }

            // Validate GST if provided
            if (data.gst_number && !this.app.validateGST(data.gst_number)) {
                this.app.showToast('Error', 'Please enter a valid GST number', 'error');
                return;
            }

            await this.saveCustomer(data);
        });
    }

    async saveCustomer(data) {
        try {
            this.app.showLoading();

            const result = await this.app.executeDatabase(`
                INSERT INTO customers (name, customer_type, phone, email, address, gst_number)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                data.name,
                data.customer_type,
                data.phone,
                data.email || null,
                data.address || null,
                data.gst_number || null
            ]);

            this.app.showToast('Success', 'Customer added successfully!', 'success');
            
            // Reload stats and customers
            await this.loadCustomerStats();
            await this.loadCustomers();
            
            // Close modal
            document.querySelector('.modal-overlay')?.remove();

        } catch (error) {
            console.error('Error saving customer:', error);
            this.app.showToast('Error', 'Failed to save customer', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async viewCustomer(customerId) {
        try {
            this.app.showLoading();

            const [customer] = await this.app.queryDatabase(`
                SELECT c.*, 
                    COUNT(i.id) as invoice_count,
                    COALESCE(SUM(i.grand_total), 0) as total_amount,
                    COALESCE(SUM(CASE WHEN i.payment_status = 'paid' THEN i.grand_total ELSE 0 END), 0) as paid_amount,
                    COALESCE(SUM(CASE WHEN i.payment_status = 'pending' THEN i.grand_total ELSE 0 END), 0) as pending_amount,
                    MAX(i.invoice_date) as last_purchase_date,
                    MIN(i.invoice_date) as first_purchase_date
                FROM customers c
                LEFT JOIN invoices i ON c.id = i.customer_id
                WHERE c.id = ?
                GROUP BY c.id
            `, [customerId]);

            if (!customer) {
                this.app.showToast('Error', 'Customer not found', 'error');
                return;
            }

            const modalContent = `
                <div class="customer-details">
                    <div class="details-header">
                        <h3>${customer.name}</h3>
                        <div class="customer-stats">
                            <div class="stat-item">
                                <i class="material-icons">receipt</i>
                                <span>${customer.invoice_count} Invoices</span>
                            </div>
                            <div class="stat-item">
                                <i class="material-icons">payments</i>
                                <span>${this.app.formatCurrency(customer.total_amount)}</span>
                            </div>
                            <div class="stat-item">
                                <i class="material-icons">pending</i>
                                <span>${this.app.formatCurrency(customer.pending_amount)} Due</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-section">
                            <h4><i class="material-icons">contact_phone</i> Contact Information</h4>
                            <div class="detail-item">
                                <strong>Customer Type:</strong> 
                                <span class="badge ${customer.customer_type === 'retail' ? 'badge-info' : customer.customer_type === 'wholesale' ? 'badge-success' : 'badge-primary'}">
                                    ${customer.customer_type}
                                </span>
                            </div>
                            <div class="detail-item">
                                <strong>Phone:</strong> 
                                ${customer.phone ? `
                                    <a href="tel:${customer.phone}">${customer.phone}</a>
                                ` : 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>Email:</strong> 
                                ${customer.email ? `
                                    <a href="mailto:${customer.email}">${customer.email}</a>
                                ` : 'N/A'}
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="material-icons">business</i> Business Information</h4>
                            <div class="detail-item">
                                <strong>GST Number:</strong> ${customer.gst_number || 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>First Purchase:</strong> ${customer.first_purchase_date ? this.app.formatDate(customer.first_purchase_date) : 'No purchases'}
                            </div>
                            <div class="detail-item">
                                <strong>Last Purchase:</strong> ${customer.last_purchase_date ? this.app.formatDate(customer.last_purchase_date) : 'No purchases'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section full-width">
                        <h4><i class="material-icons">location_on</i> Address</h4>
                        <div class="address-content">
                            ${customer.address ? customer.address.replace(/\n/g, '<br>') : 'No address provided'}
                        </div>
                    </div>
                    
                    <div class="detail-section full-width">
                        <h4><i class="material-icons">history</i> Recent Invoices</h4>
                        <div id="customerInvoices">
                            Loading invoices...
                        </div>
                    </div>
                </div>
            `;

            const modal = this.app.showModal('Customer Details', modalContent, [
                { text: 'Close', class: 'btn-secondary' },
                { text: 'Edit', class: 'btn-primary', id: 'editCustomerBtn' },
                { text: 'Create Invoice', class: 'btn-success', id: 'createInvoiceBtn' }
            ]);

            // Load recent invoices
            this.loadCustomerInvoices(customerId, modal.querySelector('#customerInvoices'));

            // Edit button
            modal.querySelector('#editCustomerBtn')?.addEventListener('click', () => {
                modal.remove();
                this.editCustomer(customerId);
            });

            // Create invoice button
            modal.querySelector('#createInvoiceBtn')?.addEventListener('click', () => {
                modal.remove();
                this.createQuickInvoice(customerId);
            });

        } catch (error) {
            console.error('Error viewing customer:', error);
            this.app.showToast('Error', 'Failed to load customer details', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async loadCustomerInvoices(customerId, container) {
        try {
            const invoices = await this.app.queryDatabase(`
                SELECT i.*, 
                    COUNT(ii.id) as item_count
                FROM invoices i
                LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
                WHERE i.customer_id = ?
                GROUP BY i.id
                ORDER BY i.invoice_date DESC
                LIMIT 10
            `, [customerId]);

            if (invoices.length === 0) {
                container.innerHTML = '<p class="text-muted">No invoices found</p>';
                return;
            }

            let html = `
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Invoice No</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            invoices.forEach(invoice => {
                const statusBadge = {
                    pending: 'badge-warning',
                    partial: 'badge-info',
                    paid: 'badge-success'
                }[invoice.payment_status] || 'badge-secondary';
                
                html += `
                    <tr>
                        <td>${invoice.invoice_number}</td>
                        <td>${this.app.formatDate(invoice.invoice_date)}</td>
                        <td>${invoice.item_count}</td>
                        <td>${this.app.formatCurrency(invoice.grand_total)}</td>
                        <td>
                            <span class="badge ${statusBadge}">
                                ${invoice.payment_status}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-text view-invoice" data-id="${invoice.id}">
                                <i class="material-icons">visibility</i>
                            </button>
                            <button class="btn btn-sm btn-text print-invoice" data-id="${invoice.id}">
                                <i class="material-icons">print</i>
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;

            container.innerHTML = html;

            // Add event listeners
            container.querySelectorAll('.view-invoice').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const invoiceId = e.currentTarget.dataset.id;
                    this.app.modules.invoices.viewInvoice(invoiceId);
                });
            });

            container.querySelectorAll('.print-invoice').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const invoiceId = e.currentTarget.dataset.id;
                    this.app.modules.invoices.printInvoice(invoiceId);
                });
            });

        } catch (error) {
            console.error('Error loading invoices:', error);
            container.innerHTML = '<p class="text-danger">Failed to load invoices</p>';
        }
    }

    async editCustomer(customerId) {
        try {
            this.app.showLoading();

            const [customer] = await this.app.queryDatabase(
                'SELECT * FROM customers WHERE id = ?',
                [customerId]
            );

            if (!customer) {
                this.app.showToast('Error', 'Customer not found', 'error');
                return;
            }

            const modalContent = `
                <form id="editCustomerForm" class="modal-form">
                    <div class="form-grid">
                        <div class="form-row">
                            <label class="form-label">Customer Name *</label>
                            <input type="text" class="form-control" name="name" value="${customer.name}" required autocomplete="off">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Customer Type</label>
                            <select class="form-control" name="customer_type">
                                <option value="retail" ${customer.customer_type === 'retail' ? 'selected' : ''}>Retail</option>
                                <option value="wholesale" ${customer.customer_type === 'wholesale' ? 'selected' : ''}>Wholesale</option>
                                <option value="corporate" ${customer.customer_type === 'corporate' ? 'selected' : ''}>Corporate</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Phone Number *</label>
                            <input type="tel" class="form-control" name="phone" value="${customer.phone}" required autocomplete="off" pattern="[0-9]{10}">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Email Address</label>
                            <input type="email" class="form-control" name="email" value="${customer.email || ''}" autocomplete="off">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">GST Number</label>
                            <input type="text" class="form-control" name="gst_number" value="${customer.gst_number || ''}" autocomplete="off"
                                   pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$">
                        </div>
                        
                        <div class="form-row full-width">
                            <label class="form-label">Address</label>
                            <textarea class="form-control" name="address" rows="3" autocomplete="off">${customer.address || ''}</textarea>
                        </div>
                    </div>
                </form>
            `;

            const modal = this.app.showModal('Edit Customer', modalContent, [
                { text: 'Cancel', class: 'btn-secondary' },
                { text: 'Update', class: 'btn-primary', id: 'updateCustomerBtn' }
            ]);

            const form = modal.querySelector('#editCustomerForm');
            const updateBtn = modal.querySelector('#updateCustomerBtn');

            updateBtn.addEventListener('click', async () => {
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                // Validate phone
                if (!this.app.validatePhone(data.phone)) {
                    this.app.showToast('Error', 'Please enter a valid 10-digit phone number', 'error');
                    return;
                }

                // Validate GST if provided
                if (data.gst_number && !this.app.validateGST(data.gst_number)) {
                    this.app.showToast('Error', 'Please enter a valid GST number', 'error');
                    return;
                }

                await this.updateCustomer(customerId, data);
            });

        } catch (error) {
            console.error('Error editing customer:', error);
            this.app.showToast('Error', 'Failed to load customer for editing', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async updateCustomer(customerId, data) {
        try {
            this.app.showLoading();

            await this.app.executeDatabase(`
                UPDATE customers 
                SET name = ?, customer_type = ?, phone = ?, email = ?, address = ?, gst_number = ?
                WHERE id = ?
            `, [
                data.name,
                data.customer_type,
                data.phone,
                data.email || null,
                data.address || null,
                data.gst_number || null,
                customerId
            ]);

            this.app.showToast('Success', 'Customer updated successfully!', 'success');
            
            // Reload stats and customers
            await this.loadCustomerStats();
            await this.loadCustomers();
            
            // Close modal
            document.querySelector('.modal-overlay')?.remove();

        } catch (error) {
            console.error('Error updating customer:', error);
            this.app.showToast('Error', 'Failed to update customer', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async deleteCustomer(customerId) {
        const confirm = await this.app.showConfirmation(
            'Delete Customer',
            'Are you sure you want to delete this customer? This will also delete all their invoices.',
            'Delete',
            'Cancel'
        );

        if (!confirm) return;

        try {
            this.app.showLoading();

            // Check if customer has invoices
            const invoices = await this.app.queryDatabase(
                'SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?',
                [customerId]
            );

            if (invoices[0].count > 0) {
                const confirm2 = await this.app.showConfirmation(
                    'Warning',
                    `This customer has ${invoices[0].count} invoices. Deleting will remove all invoices. Are you sure?`,
                    'Delete All',
                    'Cancel'
                );

                if (!confirm2) return;
            }

            await this.app.executeDatabase(
                'DELETE FROM customers WHERE id = ?',
                [customerId]
            );

            this.app.showToast('Success', 'Customer deleted successfully!', 'success');
            
            // Reload stats and customers
            await this.loadCustomerStats();
            await this.loadCustomers();

        } catch (error) {
            console.error('Error deleting customer:', error);
            this.app.showToast('Error', 'Failed to delete customer', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async createQuickInvoice(customerId) {
        // Navigate to sales page with customer pre-selected
        this.app.navigateTo('sales');
        
        // Wait for sales page to load
        setTimeout(async () => {
            try {
                const [customer] = await this.app.queryDatabase(
                    'SELECT * FROM customers WHERE id = ?',
                    [customerId]
                );

                if (customer) {
                    const customerSelect = document.getElementById('customerSelect');
                    if (customerSelect) {
                        customerSelect.value = customerId;
                        
                        // Trigger change event
                        const event = new Event('change');
                        customerSelect.dispatchEvent(event);
                    }
                }
            } catch (error) {
                console.error('Error loading customer for quick invoice:', error);
            }
        }, 500);
    }

    async showImportModal() {
        const modalContent = `
            <div class="import-instructions">
                <h4>Import Customers from CSV</h4>
                <p>Upload a CSV file with the following columns:</p>
                <ul>
                    <li><code>name</code> (required) - Customer name</li>
                    <li><code>phone</code> (required) - 10-digit phone number</li>
                    <li><code>email</code> - Email address</li>
                    <li><code>customer_type</code> - retail, wholesale, or corporate</li>
                    <li><code>gst_number</code> - GST number</li>
                    <li><code>address</code> - Full address</li>
                </ul>
                
                <div class="file-upload-area">
                    <input type="file" id="csvFile" accept=".csv" style="display: none;">
                    <div class="upload-dropzone" id="uploadDropzone">
                        <i class="material-icons">cloud_upload</i>
                        <p>Drag & drop CSV file here or click to browse</p>
                        <small>Max file size: 5MB</small>
                    </div>
                    <div class="file-info" id="fileInfo" style="display: none;">
                        <i class="material-icons">description</i>
                        <span id="fileName"></span>
                        <button type="button" class="btn btn-text" id="removeFile">
                            <i class="material-icons">close</i>
                        </button>
                    </div>
                </div>
                
                <div class="import-options" style="margin-top: 20px;">
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="skipDuplicates" checked>
                        <label class="form-check-label" for="skipDuplicates">Skip duplicate customers (by phone)</label>
                    </div>
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="updateExisting" checked>
                        <label class="form-check-label" for="updateExisting">Update existing customers</label>
                    </div>
                </div>
                
                <div class="import-preview" id="importPreview" style="display: none; margin-top: 20px;">
                    <h5>Preview (first 5 rows)</h5>
                    <div class="table-responsive">
                        <table class="table" id="previewTable">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="previewBody">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const modal = this.app.showModal('Import Customers', modalContent, [
            { text: 'Cancel', class: 'btn-secondary' },
            { text: 'Import', class: 'btn-primary', id: 'importBtn', disabled: true }
        ]);

        this.setupImportHandlers(modal);
    }

    setupImportHandlers(modal) {
        const dropzone = modal.querySelector('#uploadDropzone');
        const fileInput = modal.querySelector('#csvFile');
        const fileInfo = modal.querySelector('#fileInfo');
        const fileName = modal.querySelector('#fileName');
        const importBtn = modal.querySelector('#importBtn');
        const previewSection = modal.querySelector('#importPreview');
        const previewBody = modal.querySelector('#previewBody');

        // Click on dropzone to trigger file input
        dropzone.addEventListener('click', () => fileInput.click());

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                this.handleFileSelect(file, fileName, fileInfo, dropzone, previewSection, previewBody, importBtn);
            }
        });

        // Drag and drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                fileInput.files = e.dataTransfer.files;
                this.handleFileSelect(file, fileName, fileInfo, dropzone, previewSection, previewBody, importBtn);
            }
        });

        // Remove file
        modal.querySelector('#removeFile')?.addEventListener('click', () => {
            fileInput.value = '';
            fileInfo.style.display = 'none';
            dropzone.style.display = 'block';
            previewSection.style.display = 'none';
            importBtn.disabled = true;
        });

        // Import button
        importBtn.addEventListener('click', () => {
            this.processImport(fileInput.files[0], modal);
        });
    }

    handleFileSelect(file, fileName, fileInfo, dropzone, previewSection, previewBody, importBtn) {
        if (!file || !file.name.endsWith('.csv')) {
            this.app.showToast('Error', 'Please select a CSV file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.app.showToast('Error', 'File size must be less than 5MB', 'error');
            return;
        }

        fileName.textContent = file.name;
        fileInfo.style.display = 'flex';
        dropzone.style.display = 'none';
        importBtn.disabled = false;

        // Read and preview file
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.previewCSV(content, previewSection, previewBody);
        };
        reader.readAsText(file);
    }

    previewCSV(content, previewSection, previewBody) {
        try {
            const rows = content.split('\n');
            const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
            
            // Check required headers
            const required = ['name', 'phone'];
            const missing = required.filter(h => !headers.includes(h));
            
            if (missing.length > 0) {
                this.app.showToast('Error', `Missing required columns: ${missing.join(', ')}`, 'error');
                return;
            }

            // Show preview of first 5 rows
            previewBody.innerHTML = '';
            for (let i = 1; i < Math.min(6, rows.length); i++) {
                if (rows[i].trim()) {
                    const cells = rows[i].split(',');
                    const row = document.createElement('tr');
                    
                    const name = cells[headers.indexOf('name')] || '';
                    const phone = cells[headers.indexOf('phone')] || '';
                    const type = cells[headers.indexOf('customer_type')] || 'retail';
                    
                    // Validate phone
                    const isValidPhone = this.app.validatePhone(phone.trim());
                    
                    row.innerHTML = `
                        <td>${name}</td>
                        <td>${phone} ${isValidPhone ? '✓' : '✗'}</td>
                        <td>${type}</td>
                        <td>
                            <span class="badge ${isValidPhone ? 'badge-success' : 'badge-danger'}">
                                ${isValidPhone ? 'Valid' : 'Invalid'}
                            </span>
                        </td>
                    `;
                    previewBody.appendChild(row);
                }
            }
            
            previewSection.style.display = 'block';

        } catch (error) {
            console.error('Error parsing CSV:', error);
            this.app.showToast('Error', 'Failed to parse CSV file', 'error');
        }
    }

    async processImport(file, modal) {
        try {
            this.app.showLoading();
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target.result;
                const rows = content.split('\n');
                const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
                
                let imported = 0;
                let updated = 0;
                let skipped = 0;
                let errors = [];
                
                for (let i = 1; i < rows.length; i++) {
                    if (!rows[i].trim()) continue;
                    
                    const cells = rows[i].split(',');
                    const data = {};
                    
                    headers.forEach((header, index) => {
                        if (cells[index]) {
                            data[header] = cells[index].trim();
                        }
                    });
                    
                    // Validate required fields
                    if (!data.name || !data.phone) {
                        errors.push(`Row ${i}: Missing name or phone`);
                        continue;
                    }
                    
                    if (!this.app.validatePhone(data.phone)) {
                        errors.push(`Row ${i}: Invalid phone number`);
                        continue;
                    }
                    
                    // Check if customer exists
                    const existing = await this.app.queryDatabase(
                        'SELECT id FROM customers WHERE phone = ?',
                        [data.phone]
                    );
                    
                    if (existing.length > 0) {
                        const updateExisting = modal.querySelector('#updateExisting').checked;
                        
                        if (updateExisting) {
                            // Update existing customer
                            await this.app.executeDatabase(`
                                UPDATE customers 
                                SET name = ?, customer_type = ?, email = ?, address = ?, gst_number = ?
                                WHERE phone = ?
                            `, [
                                data.name,
                                data.customer_type || 'retail',
                                data.email || null,
                                data.address || null,
                                data.gst_number || null,
                                data.phone
                            ]);
                            updated++;
                        } else {
                            skipped++;
                        }
                    } else {
                        // Insert new customer
                        await this.app.executeDatabase(`
                            INSERT INTO customers (name, phone, email, customer_type, address, gst_number)
                            VALUES (?, ?, ?, ?, ?, ?)
                        `, [
                            data.name,
                            data.phone,
                            data.email || null,
                            data.customer_type || 'retail',
                            data.address || null,
                            data.gst_number || null
                        ]);
                        imported++;
                    }
                }
                
                // Close modal
                modal.remove();
                
                // Show results
                let message = `Imported: ${imported}, Updated: ${updated}, Skipped: ${skipped}`;
                if (errors.length > 0) {
                    message += `, Errors: ${errors.length}`;
                    console.error('Import errors:', errors);
                }
                
                this.app.showToast('Success', message, 'success');
                
                // Reload customers
                await this.loadCustomerStats();
                await this.loadCustomers();
                
            };
            
            reader.readAsText(file);
            
        } catch (error) {
            console.error('Error importing customers:', error);
            this.app.showToast('Error', 'Failed to import customers', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async exportCustomers() {
        try {
            this.app.showLoading();

            const customers = await this.app.queryDatabase(`
                SELECT name, phone, email, customer_type, gst_number, address, created_at
                FROM customers
                ORDER BY name
            `);

            if (customers.length === 0) {
                this.app.showToast('Info', 'No customers to export', 'info');
                return;
            }

            // Create CSV content
            const headers = ['Name', 'Phone', 'Email', 'Type', 'GST Number', 'Address', 'Created Date'];
            const csvRows = [headers.join(',')];

            customers.forEach(customer => {
                const row = [
                    `"${customer.name}"`,
                    `"${customer.phone}"`,
                    `"${customer.email || ''}"`,
                    `"${customer.customer_type}"`,
                    `"${customer.gst_number || ''}"`,
                    `"${(customer.address || '').replace(/"/g, '""')}"`,
                    `"${this.app.formatDate(customer.created_at)}"`
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `customers_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.app.showToast('Success', `Exported ${customers.length} customers`, 'success');

        } catch (error) {
            console.error('Error exporting customers:', error);
            this.app.showToast('Error', 'Failed to export customers', 'error');
        } finally {
            this.app.hideLoading();
        }
    }
}