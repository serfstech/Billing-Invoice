export default class Invoices {
    constructor(app) {
        this.app = app;
    }

    async load() {
        return `
            <div class="content-header">
                <div class="header-left">
                    <h1><i class="material-icons">receipt</i> Invoices</h1>
                    <p class="content-subtitle">Manage and view all sales invoices</p>
                </div>
                <div class="header-right">
                    <button class="btn btn-primary" id="createInvoiceBtn">
                        <i class="material-icons">add</i> Create Invoice
                    </button>
                    <button class="btn btn-outline" id="filterInvoices">
                        <i class="material-icons">filter_list</i> Filter
                    </button>
                </div>
            </div>

            <!-- Invoice Summary Cards -->
            <div class="stats-grid">
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
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--green-400), var(--green-600));">
                        <i class="material-icons">check_circle</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="paidInvoices">0</div>
                        <div class="stat-label">Paid</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--orange-400), var(--orange-600));">
                        <i class="material-icons">pending</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="pendingInvoices">0</div>
                        <div class="stat-label">Pending</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--red-400), var(--red-600));">
                        <i class="material-icons">warning</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="overdueInvoices">0</div>
                        <div class="stat-label">Overdue</div>
                    </div>
                </div>
            </div>

            <!-- Search and Date Filters -->
            <div class="card">
                <div class="card-body">
                    <div class="search-filter-container">
                        <div class="search-box">
                            <i class="material-icons">search</i>
                            <input type="text" id="invoiceSearch" placeholder="Search by invoice number, customer name..." class="form-control">
                        </div>
                        <div class="filter-options">
                            <input type="date" class="form-control" id="dateFrom" placeholder="From Date">
                            <input type="date" class="form-control" id="dateTo" placeholder="To Date">
                            <select class="form-control" id="statusFilter">
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                            </select>
                            <button class="btn btn-outline" id="exportInvoices">
                                <i class="material-icons">download</i> Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Invoices Table -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Invoice List</h2>
                    <div class="card-actions">
                        <div class="table-summary">
                            Showing <span id="showingCount">0</span> of <span id="totalCount">0</span> invoices
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table" id="invoicesTable">
                            <thead>
                                <tr>
                                    <th>Invoice No</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Due Date</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Paid</th>
                                    <th>Balance</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="invoicesTableBody">
                                <tr>
                                    <td colspan="10" class="text-center">
                                        <div class="loading-content">
                                            <i class="material-icons spin">refresh</i>
                                            <p>Loading invoices...</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="pagination-container" id="invoicesPagination">
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
        await this.loadInvoiceStats();
        await this.loadInvoices();
        this.setupEventListeners();
        this.setupSearch();
    }

    async loadInvoiceStats() {
        try {
            const [total, paid, pending, overdue] = await Promise.all([
                this.app.queryDatabase('SELECT COUNT(*) as count FROM invoices'),
                this.app.queryDatabase(`SELECT COUNT(*) as count FROM invoices WHERE payment_status = 'paid'`),
                this.app.queryDatabase(`SELECT COUNT(*) as count FROM invoices WHERE payment_status = 'pending'`),
                this.app.queryDatabase(`
                    SELECT COUNT(*) as count 
                    FROM invoices 
                    WHERE payment_status IN ('pending', 'partial') 
                    AND due_date < CURDATE()
                `)
            ]);

            document.getElementById('totalInvoices').textContent = total[0].count;
            document.getElementById('paidInvoices').textContent = paid[0].count;
            document.getElementById('pendingInvoices').textContent = pending[0].count;
            document.getElementById('overdueInvoices').textContent = overdue[0].count;

        } catch (error) {
            console.error('Error loading invoice stats:', error);
        }
    }

    async loadInvoices(page = 1, search = '', filters = {}) {
        try {
            this.app.showLoading();
            
            const limit = 15;
            const offset = (page - 1) * limit;

            let query = `
                SELECT i.*, c.name as customer_name,
                    COUNT(ii.id) as item_count,
                    (i.grand_total - i.amount_paid) as balance
                FROM invoices i
                JOIN customers c ON i.customer_id = c.id
                LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
            `;

            const params = [];
            const conditions = [];
            
            // Search condition
            if (search) {
                conditions.push(`(i.invoice_number LIKE ? OR c.name LIKE ?)`);
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm);
            }
            
            // Date filters
            if (filters.dateFrom) {
                conditions.push(`i.invoice_date >= ?`);
                params.push(filters.dateFrom);
            }
            
            if (filters.dateTo) {
                conditions.push(`i.invoice_date <= ?`);
                params.push(filters.dateTo);
            }
            
            // Status filter
            if (filters.status) {
                conditions.push(`i.payment_status = ?`);
                params.push(filters.status);
            }
            
            // Add WHERE clause if conditions exist
            if (conditions.length > 0) {
                query += ` WHERE ` + conditions.join(' AND ');
            }
            
            query += ` GROUP BY i.id ORDER BY i.invoice_date DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const invoices = await this.app.queryDatabase(query, params);
            
            // Get total count
            let countQuery = `
                SELECT COUNT(DISTINCT i.id) as total 
                FROM invoices i
                JOIN customers c ON i.customer_id = c.id
            `;
            
            if (conditions.length > 0) {
                countQuery += ` WHERE ` + conditions.join(' AND ');
            }
            
            const countResult = await this.app.queryDatabase(countQuery, params.slice(0, -2));
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);

            this.updateInvoicesTable(invoices);
            this.updatePagination(page, totalPages, total);

        } catch (error) {
            console.error('Error loading invoices:', error);
            this.app.showToast('Error', 'Failed to load invoices', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    updateInvoicesTable(invoices) {
        const tbody = document.getElementById('invoicesTableBody');
        if (!tbody) return;

        if (invoices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        <div class="empty-state">
                            <i class="material-icons">receipt</i>
                            <p>No invoices found</p>
                            <button class="btn btn-primary" id="createFirstInvoice">
                                <i class="material-icons">add</i> Create Invoice
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            
            document.getElementById('createFirstInvoice')?.addEventListener('click', () => {
                this.app.navigateTo('sales');
            });
            
            return;
        }

        let tableHTML = '';
        
        invoices.forEach(invoice => {
            const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.balance > 0;
            const statusInfo = this.getInvoiceStatusInfo(invoice.payment_status, isOverdue);
            
            tableHTML += `
                <tr data-id="${invoice.id}" class="${isOverdue ? 'table-danger' : ''}">
                    <td>
                        <div class="invoice-number">
                            <strong>${invoice.invoice_number}</strong>
                            ${isOverdue ? '<i class="material-icons text-danger" title="Overdue">warning</i>' : ''}
                        </div>
                    </td>
                    <td>${invoice.customer_name}</td>
                    <td>${this.app.formatDate(invoice.invoice_date)}</td>
                    <td>${invoice.due_date ? this.app.formatDate(invoice.due_date) : 'N/A'}</td>
                    <td>${invoice.item_count}</td>
                    <td>${this.app.formatCurrency(invoice.grand_total)}</td>
                    <td>${this.app.formatCurrency(invoice.amount_paid)}</td>
                    <td>${this.app.formatCurrency(invoice.balance)}</td>
                    <td>
                        <span class="badge ${statusInfo.class}" title="${statusInfo.tooltip}">
                            ${statusInfo.label}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-text view-invoice" data-id="${invoice.id}" title="View">
                                <i class="material-icons">visibility</i>
                            </button>
                            <button class="btn btn-sm btn-text print-invoice" data-id="${invoice.id}" title="Print">
                                <i class="material-icons">print</i>
                            </button>
                            ${invoice.balance > 0 ? `
                                <button class="btn btn-sm btn-text record-payment" data-id="${invoice.id}" title="Record Payment">
                                    <i class="material-icons">payments</i>
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-text delete-invoice" data-id="${invoice.id}" title="Delete">
                                <i class="material-icons">delete</i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = tableHTML;
        this.attachInvoiceEventListeners();
    }

    getInvoiceStatusInfo(status, isOverdue) {
        if (isOverdue) {
            return {
                class: 'badge-danger',
                label: 'Overdue',
                tooltip: 'Payment overdue'
            };
        }
        
        switch(status) {
            case 'paid':
                return {
                    class: 'badge-success',
                    label: 'Paid',
                    tooltip: 'Payment completed'
                };
            case 'partial':
                return {
                    class: 'badge-info',
                    label: 'Partial',
                    tooltip: 'Partial payment received'
                };
            case 'pending':
                return {
                    class: 'badge-warning',
                    label: 'Pending',
                    tooltip: 'Awaiting payment'
                };
            default:
                return {
                    class: 'badge-secondary',
                    label: status,
                    tooltip: status
                };
        }
    }

    updatePagination(currentPage, totalPages, totalCount) {
        const showingElement = document.getElementById('showingCount');
        const totalElement = document.getElementById('totalCount');
        const currentPageElement = document.getElementById('currentPage');
        const totalPagesElement = document.getElementById('totalPages');
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');

        if (showingElement) {
            const showing = Math.min(currentPage * 15, totalCount);
            const from = (currentPage - 1) * 15 + 1;
            showingElement.textContent = `${from}-${showing}`;
        }

        if (totalElement) totalElement.textContent = totalCount;
        if (currentPageElement) currentPageElement.textContent = currentPage;
        if (totalPagesElement) totalPagesElement.textContent = totalPages;

        if (prevButton) {
            prevButton.disabled = currentPage === 1;
            prevButton.onclick = () => {
                const search = document.getElementById('invoiceSearch')?.value || '';
                const dateFrom = document.getElementById('dateFrom')?.value || '';
                const dateTo = document.getElementById('dateTo')?.value || '';
                const status = document.getElementById('statusFilter')?.value || '';
                this.loadInvoices(currentPage - 1, search, { dateFrom, dateTo, status });
            };
        }

        if (nextButton) {
            nextButton.disabled = currentPage === totalPages;
            nextButton.onclick = () => {
                const search = document.getElementById('invoiceSearch')?.value || '';
                const dateFrom = document.getElementById('dateFrom')?.value || '';
                const dateTo = document.getElementById('dateTo')?.value || '';
                const status = document.getElementById('statusFilter')?.value || '';
                this.loadInvoices(currentPage + 1, search, { dateFrom, dateTo, status });
            };
        }
    }

    attachInvoiceEventListeners() {
        // View invoice
        document.querySelectorAll('.view-invoice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceId = e.currentTarget.dataset.id;
                this.viewInvoice(invoiceId);
            });
        });

        // Print invoice
        document.querySelectorAll('.print-invoice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceId = e.currentTarget.dataset.id;
                this.printInvoice(invoiceId);
            });
        });

        // Record payment
        document.querySelectorAll('.record-payment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceId = e.currentTarget.dataset.id;
                this.showPaymentModal(invoiceId);
            });
        });

        // Delete invoice
        document.querySelectorAll('.delete-invoice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceId = e.currentTarget.dataset.id;
                this.deleteInvoice(invoiceId);
            });
        });
    }

    setupEventListeners() {
        // Create invoice button
        document.getElementById('createInvoiceBtn')?.addEventListener('click', () => {
            this.app.navigateTo('sales');
        });

        // Export button
        document.getElementById('exportInvoices')?.addEventListener('click', () => {
            this.exportInvoices();
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('invoiceSearch');
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const statusFilter = document.getElementById('statusFilter');

        const loadWithFilters = this.app.debounce(() => {
            const search = searchInput?.value || '';
            const from = dateFrom?.value || '';
            const to = dateTo?.value || '';
            const status = statusFilter?.value || '';
            this.loadInvoices(1, search, { dateFrom: from, dateTo: to, status });
        }, 300);

        if (searchInput) {
            searchInput.addEventListener('input', loadWithFilters);
        }

        if (dateFrom) {
            dateFrom.addEventListener('change', loadWithFilters);
        }

        if (dateTo) {
            dateTo.addEventListener('change', loadWithFilters);
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', loadWithFilters);
        }
    }

    async viewInvoice(invoiceId) {
        try {
            this.app.showLoading();

            const [invoice] = await this.app.queryDatabase(`
                SELECT i.*, c.name as customer_name, c.phone, c.address, c.gst_number,
                    c.email as customer_email
                FROM invoices i
                JOIN customers c ON i.customer_id = c.id
                WHERE i.id = ?
            `, [invoiceId]);

            if (!invoice) {
                this.app.showToast('Error', 'Invoice not found', 'error');
                return;
            }

            // Get invoice items
            const items = await this.app.queryDatabase(`
                SELECT ii.*, p.name as product_name, p.sku, p.unit, p.gst_percentage as product_gst
                FROM invoice_items ii
                JOIN products p ON ii.product_id = p.id
                WHERE ii.invoice_id = ?
            `, [invoiceId]);

            const modalContent = `
                <div class="invoice-details">
                    <div class="details-header">
                        <div class="header-left">
                            <h3>Invoice: ${invoice.invoice_number}</h3>
                            <div class="invoice-meta">
                                <span class="badge ${this.getInvoiceStatusInfo(invoice.payment_status, false).class}">
                                    ${invoice.payment_status.toUpperCase()}
                                </span>
                                <span>Date: ${this.app.formatDate(invoice.invoice_date)}</span>
                                ${invoice.due_date ? `<span>Due: ${this.app.formatDate(invoice.due_date)}</span>` : ''}
                            </div>
                        </div>
                        <div class="header-right">
                            <div class="invoice-totals">
                                <div class="total-item">
                                    <strong>Total:</strong> ${this.app.formatCurrency(invoice.grand_total)}
                                </div>
                                <div class="total-item">
                                    <strong>Paid:</strong> ${this.app.formatCurrency(invoice.amount_paid)}
                                </div>
                                <div class="total-item ${invoice.balance > 0 ? 'text-danger' : 'text-success'}">
                                    <strong>Balance:</strong> ${this.app.formatCurrency(invoice.grand_total - invoice.amount_paid)}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="customer-details">
                        <h4><i class="material-icons">person</i> Customer Information</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <strong>Name:</strong> ${invoice.customer_name}
                            </div>
                            <div class="detail-item">
                                <strong>Phone:</strong> ${invoice.phone || 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>Email:</strong> ${invoice.customer_email || 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>GST:</strong> ${invoice.gst_number || 'N/A'}
                            </div>
                            <div class="detail-item full-width">
                                <strong>Address:</strong> ${invoice.address ? invoice.address.replace(/\n/g, '<br>') : 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="invoice-items">
                        <h4><i class="material-icons">list</i> Invoice Items</h4>
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Unit</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                        <th>GST %</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.map((item, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${item.product_name}</td>
                                            <td>${item.sku || 'N/A'}</td>
                                            <td>${item.unit || 'N/A'}</td>
                                            <td>${item.quantity}</td>
                                            <td>${this.app.formatCurrency(item.unit_price)}</td>
                                            <td>${item.gst_percentage}%</td>
                                            <td>${this.app.formatCurrency(item.total)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="6"></td>
                                        <td><strong>Subtotal:</strong></td>
                                        <td>${this.app.formatCurrency(invoice.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="6"></td>
                                        <td><strong>Total GST:</strong></td>
                                        <td>${this.app.formatCurrency(invoice.total_gst)}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="6"></td>
                                        <td><strong>Grand Total:</strong></td>
                                        <td><strong>${this.app.formatCurrency(invoice.grand_total)}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    
                    <div class="payment-details">
                        <h4><i class="material-icons">payments</i> Payment Information</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <strong>Payment Method:</strong> ${invoice.payment_method || 'Not specified'}
                            </div>
                            <div class="detail-item">
                                <strong>Payment Status:</strong> ${invoice.payment_status}
                            </div>
                            <div class="detail-item">
                                <strong>Amount Paid:</strong> ${this.app.formatCurrency(invoice.amount_paid)}
                            </div>
                            <div class="detail-item">
                                <strong>Amount Due:</strong> ${this.app.formatCurrency(invoice.grand_total - invoice.amount_paid)}
                            </div>
                        </div>
                    </div>
                    
                    ${invoice.notes ? `
                        <div class="invoice-notes">
                            <h4><i class="material-icons">notes</i> Notes</h4>
                            <p>${invoice.notes}</p>
                        </div>
                    ` : ''}
                </div>
            `;

            const buttons = [
                { text: 'Close', class: 'btn-secondary' },
                { text: 'Print', class: 'btn-primary', id: 'printInvoiceBtn' }
            ];

            if (invoice.grand_total > invoice.amount_paid) {
                buttons.push({ text: 'Record Payment', class: 'btn-success', id: 'recordPaymentBtn' });
            }

            const modal = this.app.showModal('Invoice Details', modalContent, buttons);

            // Print button
            modal.querySelector('#printInvoiceBtn')?.addEventListener('click', () => {
                this.printInvoice(invoiceId);
            });

            // Record payment button
            modal.querySelector('#recordPaymentBtn')?.addEventListener('click', () => {
                modal.remove();
                this.showPaymentModal(invoiceId);
            });

        } catch (error) {
            console.error('Error viewing invoice:', error);
            this.app.showToast('Error', 'Failed to load invoice details', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async printInvoice(invoiceId) {
        try {
            this.app.showLoading();

            const [invoice] = await this.app.queryDatabase(`
                SELECT i.*, c.name as customer_name, c.phone, c.address, c.gst_number as customer_gst
                FROM invoices i
                JOIN customers c ON i.customer_id = c.id
                WHERE i.id = ?
            `, [invoiceId]);

            if (!invoice) {
                this.app.showToast('Error', 'Invoice not found', 'error');
                return;
            }

            // Get invoice items
            const items = await this.app.queryDatabase(`
                SELECT ii.*, p.name as product_name, p.sku
                FROM invoice_items ii
                JOIN products p ON ii.product_id = p.id
                WHERE ii.invoice_id = ?
            `, [invoiceId]);

            // Generate HTML for printing
            const printHTML = this.generatePrintHTML(invoice, items);
            
            // Open print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printHTML);
            printWindow.document.close();
            printWindow.focus();
            
            // Trigger print after content loads
            printWindow.onload = function() {
                printWindow.print();
                printWindow.close();
            };

        } catch (error) {
            console.error('Error printing invoice:', error);
            this.app.showToast('Error', 'Failed to print invoice', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    generatePrintHTML(invoice, items) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invoice ${invoice.invoice_number}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        color: #333;
                    }
                    .invoice-container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        padding: 30px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    .invoice-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                    }
                    .company-info {
                        flex: 2;
                    }
                    .invoice-info {
                        flex: 1;
                        text-align: right;
                    }
                    h1 {
                        color: #2196f3;
                        margin: 0 0 10px 0;
                    }
                    h2, h3 {
                        margin: 0 0 10px 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    th {
                        background: #f5f5f5;
                        padding: 10px;
                        text-align: left;
                        border: 1px solid #ddd;
                    }
                    td {
                        padding: 10px;
                        border: 1px solid #ddd;
                    }
                    .totals {
                        float: right;
                        margin-top: 20px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        width: 300px;
                        margin-bottom: 5px;
                    }
                    .grand-total {
                        font-size: 1.2em;
                        font-weight: bold;
                        border-top: 2px solid #333;
                        padding-top: 10px;
                        margin-top: 10px;
                    }
                    .footer {
                        margin-top: 50px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        text-align: center;
                        font-size: 0.9em;
                        color: #666;
                    }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .invoice-container { box-shadow: none; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <div class="invoice-header">
                        <div class="company-info">
                            <h1>TAX INVOICE</h1>
                            <h2>Your Company Name</h2>
                            <p>123 Business Street, City, State - 123456</p>
                            <p>Phone: +91 9876543210 | GST: 27ABCDE1234F1Z5</p>
                        </div>
                        <div class="invoice-info">
                            <h3>Invoice: ${invoice.invoice_number}</h3>
                            <p><strong>Date:</strong> ${this.app.formatDate(invoice.invoice_date)}</p>
                            ${invoice.due_date ? `<p><strong>Due Date:</strong> ${this.app.formatDate(invoice.due_date)}</p>` : ''}
                            <p><strong>Status:</strong> ${invoice.payment_status}</p>
                        </div>
                    </div>
                    
                    <div class="customer-info">
                        <h3>Bill To:</h3>
                        <p><strong>${invoice.customer_name}</strong></p>
                        <p>${invoice.address ? invoice.address.replace(/\n/g, '<br>') : ''}</p>
                        <p>Phone: ${invoice.phone || 'N/A'}</p>
                        <p>GST: ${invoice.customer_gst || 'N/A'}</p>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>GST %</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map((item, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${item.product_name}</td>
                                    <td>${item.sku || 'N/A'}</td>
                                    <td>${item.quantity}</td>
                                    <td>${this.app.formatCurrency(item.unit_price)}</td>
                                    <td>${item.gst_percentage}%</td>
                                    <td>${this.app.formatCurrency(item.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="totals">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>${this.app.formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div class="total-row">
                            <span>Total GST:</span>
                            <span>${this.app.formatCurrency(invoice.total_gst)}</span>
                        </div>
                        <div class="total-row grand-total">
                            <span>Grand Total:</span>
                            <span>${this.app.formatCurrency(invoice.grand_total)}</span>
                        </div>
                        <div class="total-row">
                            <span>Amount Paid:</span>
                            <span>${this.app.formatCurrency(invoice.amount_paid)}</span>
                        </div>
                        <div class="total-row">
                            <span>Balance Due:</span>
                            <span>${this.app.formatCurrency(invoice.grand_total - invoice.amount_paid)}</span>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>Thank you for your business!</p>
                        <p>Terms & Conditions: Goods once sold will not be taken back. Interest @18% p.a. on overdue payments.</p>
                        <p>Authorized Signatory</p>
                    </div>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    }
                </script>
            </body>
            </html>
        `;
    }

    async showPaymentModal(invoiceId) {
        try {
            const [invoice] = await this.app.queryDatabase(
                'SELECT * FROM invoices WHERE id = ?',
                [invoiceId]
            );

            if (!invoice) {
                this.app.showToast('Error', 'Invoice not found', 'error');
                return;
            }

            const balance = invoice.grand_total - invoice.amount_paid;

            const modalContent = `
                <form id="paymentForm" class="modal-form">
                    <div class="form-grid">
                        <div class="form-row">
                            <label class="form-label">Invoice Number</label>
                            <input type="text" class="form-control" value="${invoice.invoice_number}" readonly>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Customer</label>
                            <input type="text" class="form-control" value="${await this.getCustomerName(invoice.customer_id)}" readonly>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Total Amount</label>
                            <input type="text" class="form-control" value="${this.app.formatCurrency(invoice.grand_total)}" readonly>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Amount Paid</label>
                            <input type="text" class="form-control" value="${this.app.formatCurrency(invoice.amount_paid)}" readonly>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Balance Due</label>
                            <input type="text" class="form-control" value="${this.app.formatCurrency(balance)}" readonly>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Payment Amount *</label>
                            <input type="number" class="form-control" id="paymentAmount" 
                                   step="0.01" min="0.01" max="${balance}" 
                                   value="${balance}" required autocomplete="off">
                            <small class="form-text">Maximum: ${this.app.formatCurrency(balance)}</small>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Payment Method *</label>
                            <select class="form-control" id="paymentMethod" required>
                                <option value="cash" ${invoice.payment_method === 'cash' ? 'selected' : ''}>Cash</option>
                                <option value="card" ${invoice.payment_method === 'card' ? 'selected' : ''}>Card</option>
                                <option value="upi" ${invoice.payment_method === 'upi' ? 'selected' : ''}>UPI</option>
                                <option value="bank_transfer" ${invoice.payment_method === 'bank_transfer' ? 'selected' : ''}>Bank Transfer</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Payment Date</label>
                            <input type="date" class="form-control" id="paymentDate" 
                                   value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        
                        <div class="form-row full-width">
                            <label class="form-label">Notes</label>
                            <textarea class="form-control" id="paymentNotes" rows="2" placeholder="Payment reference or notes..."></textarea>
                        </div>
                    </div>
                </form>
            `;

            const modal = this.app.showModal('Record Payment', modalContent, [
                { text: 'Cancel', class: 'btn-secondary' },
                { text: 'Record Payment', class: 'btn-success', id: 'savePaymentBtn' }
            ]);

            const form = modal.querySelector('#paymentForm');
            const saveBtn = modal.querySelector('#savePaymentBtn');

            saveBtn.addEventListener('click', async () => {
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

                const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
                const paymentMethod = document.getElementById('paymentMethod').value;
                const paymentDate = document.getElementById('paymentDate').value;
                const notes = document.getElementById('paymentNotes').value || null;

                if (paymentAmount > balance) {
                    this.app.showToast('Error', 'Payment amount cannot exceed balance due', 'error');
                    return;
                }

                await this.recordPayment(invoiceId, paymentAmount, paymentMethod, paymentDate, notes);
            });

        } catch (error) {
            console.error('Error showing payment modal:', error);
            this.app.showToast('Error', 'Failed to load payment form', 'error');
        }
    }

    async getCustomerName(customerId) {
        try {
            const [customer] = await this.app.queryDatabase(
                'SELECT name FROM customers WHERE id = ?',
                [customerId]
            );
            return customer ? customer.name : 'Unknown';
        } catch (error) {
            return 'Unknown';
        }
    }

    async recordPayment(invoiceId, amount, method, date, notes) {
        try {
            this.app.showLoading();

            // Get current invoice
            const [invoice] = await this.app.queryDatabase(
                'SELECT * FROM invoices WHERE id = ?',
                [invoiceId]
            );

            const newPaidAmount = invoice.amount_paid + amount;
            const balance = invoice.grand_total - newPaidAmount;
            
            // Determine new status
            let newStatus = invoice.payment_status;
            if (balance <= 0) {
                newStatus = 'paid';
            } else if (newPaidAmount > 0) {
                newStatus = 'partial';
            }

            // Update invoice
            await this.app.executeDatabase(`
                UPDATE invoices 
                SET amount_paid = ?, payment_status = ?, payment_method = ?
                WHERE id = ?
            `, [newPaidAmount, newStatus, method, invoiceId]);

            // You could also create a payment record in a separate payments table here

            this.app.showToast('Success', `Payment of ${this.app.formatCurrency(amount)} recorded!`, 'success');
            
            // Reload invoice stats and list
            await this.loadInvoiceStats();
            await this.loadInvoices();
            
            // Close modal
            document.querySelector('.modal-overlay')?.remove();

        } catch (error) {
            console.error('Error recording payment:', error);
            this.app.showToast('Error', 'Failed to record payment', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async deleteInvoice(invoiceId) {
        const confirm = await this.app.showConfirmation(
            'Delete Invoice',
            'Are you sure you want to delete this invoice? This will also delete all invoice items and cannot be undone.',
            'Delete',
            'Cancel'
        );

        if (!confirm) return;

        try {
            this.app.showLoading();

            // Check if payment has been made
            const [invoice] = await this.app.queryDatabase(
                'SELECT amount_paid FROM invoices WHERE id = ?',
                [invoiceId]
            );

            if (invoice.amount_paid > 0) {
                this.app.showToast('Error', 'Cannot delete invoice with payments', 'error');
                return;
            }

            // Delete invoice (cascade will delete invoice_items)
            await this.app.executeDatabase(
                'DELETE FROM invoices WHERE id = ?',
                [invoiceId]
            );

            this.app.showToast('Success', 'Invoice deleted successfully!', 'success');
            
            // Reload invoice stats and list
            await this.loadInvoiceStats();
            await this.loadInvoices();

        } catch (error) {
            console.error('Error deleting invoice:', error);
            this.app.showToast('Error', 'Failed to delete invoice', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async exportInvoices() {
        try {
            this.app.showLoading();

            const invoices = await this.app.queryDatabase(`
                SELECT i.invoice_number, c.name as customer_name, 
                       i.invoice_date, i.due_date,
                       i.subtotal, i.total_gst, i.grand_total,
                       i.amount_paid, i.payment_status, i.payment_method
                FROM invoices i
                JOIN customers c ON i.customer_id = c.id
                ORDER BY i.invoice_date DESC
            `);

            if (invoices.length === 0) {
                this.app.showToast('Info', 'No invoices to export', 'info');
                return;
            }

            // Create CSV content
            const headers = ['Invoice No', 'Customer', 'Date', 'Due Date', 'Subtotal', 'GST', 'Grand Total', 
                           'Amount Paid', 'Balance', 'Status', 'Payment Method'];
            const csvRows = [headers.join(',')];

            invoices.forEach(invoice => {
                const balance = invoice.grand_total - invoice.amount_paid;
                const row = [
                    `"${invoice.invoice_number}"`,
                    `"${invoice.customer_name}"`,
                    `"${this.app.formatDate(invoice.invoice_date)}"`,
                    `"${invoice.due_date ? this.app.formatDate(invoice.due_date) : ''}"`,
                    invoice.subtotal,
                    invoice.total_gst,
                    invoice.grand_total,
                    invoice.amount_paid,
                    balance,
                    `"${invoice.payment_status}"`,
                    `"${invoice.payment_method || ''}"`
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `invoices_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.app.showToast('Success', `Exported ${invoices.length} invoices`, 'success');

        } catch (error) {
            console.error('Error exporting invoices:', error);
            this.app.showToast('Error', 'Failed to export invoices', 'error');
        } finally {
            this.app.hideLoading();
        }
    }
}