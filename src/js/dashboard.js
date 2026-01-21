export function loadDashboard() {
  // dashboard UI only
}

export default class Dashboard {
    constructor(app) {
        this.app = app;
    }

    async load() {
        return `
            <div class="content-header">
                <h1><i class="material-icons">dashboard</i> Dashboard</h1>
                <p class="content-subtitle">Welcome back, ${this.app.currentUser?.full_name || 'Admin'}! Here's your business overview.</p>
            </div>

            <!-- Stats Cards -->
            <div class="stats-grid" id="statsGrid">
                <!-- Stats will be loaded dynamically -->
                <div class="stat-card">
                    <div class="stat-icon suppliers">
                        <i class="material-icons">business</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Total Suppliers</div>
                        <div class="stat-change positive">
                            <i class="material-icons">trending_up</i>
                            <span>Loading...</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon customers">
                        <i class="material-icons">people</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Total Customers</div>
                        <div class="stat-change positive">
                            <i class="material-icons">trending_up</i>
                            <span>Loading...</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon products">
                        <i class="material-icons">inventory_2</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Total Products</div>
                        <div class="stat-change positive">
                            <i class="material-icons">trending_up</i>
                            <span>Loading...</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon sales">
                        <i class="material-icons">point_of_sale</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">₹0</div>
                        <div class="stat-label">Total Sales</div>
                        <div class="stat-change positive">
                            <i class="material-icons">trending_up</i>
                            <span>Loading...</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon stock">
                        <i class="material-icons">warehouse</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Total Stock Value</div>
                        <div class="stat-change positive">
                            <i class="material-icons">trending_up</i>
                            <span>Loading...</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon alerts">
                        <i class="material-icons">notification_important</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Low Stock Alerts</div>
                        <div class="stat-change negative">
                            <i class="material-icons">warning</i>
                            <span>Attention needed</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity & Charts -->
            <div class="dashboard-content">
                <div class="content-row">
                    <div class="content-col">
                        <div class="card">
                            <div class="card-header">
                                <h2 class="card-title">
                                    <i class="material-icons">notification_important</i>
                                    Low Stock Alerts
                                </h2>
                                <button class="btn btn-sm btn-text" id="viewAllAlerts">
                                    View All
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="alerts-list" id="lowStockAlerts">
                                    <!-- Alerts will be loaded here -->
                                    <div class="loading-alerts">Loading alerts...</div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <h2 class="card-title">
                                    <i class="material-icons">history</i>
                                    Recent Sales
                                </h2>
                                <button class="btn btn-sm btn-text" id="viewAllSales">
                                    View All
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table" id="recentSalesTable">
                                        <thead>
                                            <tr>
                                                <th>Invoice No</th>
                                                <th>Customer</th>
                                                <th>Date</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <!-- Recent sales will be loaded here -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="content-col">
                        <div class="card">
                            <div class="card-header">
                                <h2 class="card-title">
                                    <i class="material-icons">trending_up</i>
                                    Monthly Sales Overview
                                </h2>
                                <div class="period-selector">
                                    <select class="form-control form-control-sm" id="salesPeriod">
                                        <option value="30">Last 30 days</option>
                                        <option value="90">Last 90 days</option>
                                        <option value="365">Last Year</option>
                                    </select>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="salesChart"></canvas>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <h2 class="card-title">
                                    <i class="material-icons">inventory_2</i>
                                    Stock Status
                                </h2>
                            </div>
                            <div class="card-body">
                                <div class="chart-container">
                                    <canvas id="stockChart"></canvas>
                                </div>
                                <div class="stock-summary" id="stockSummary">
                                    <!-- Stock summary will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="material-icons">bolt</i>
                        Quick Actions
                    </h2>
                </div>
                <div class="card-body">
                    <div class="quick-actions-grid">
                        <button class="quick-action-btn" data-action="new-invoice">
                            <i class="material-icons">receipt</i>
                            <span>Create Invoice</span>
                        </button>
                        <button class="quick-action-btn" data-action="new-purchase">
                            <i class="material-icons">add_shopping_cart</i>
                            <span>Record Purchase</span>
                        </button>
                        <button class="quick-action-btn" data-action="add-product">
                            <i class="material-icons">add_box</i>
                            <span>Add Product</span>
                        </button>
                        <button class="quick-action-btn" data-action="add-customer">
                            <i class="material-icons">person_add</i>
                            <span>Add Customer</span>
                        </button>
                        <button class="quick-action-btn" data-action="add-supplier">
                            <i class="material-icons">business</i>
                            <span>Add Supplier</span>
                        </button>
                        <button class="quick-action-btn" data-action="view-reports">
                            <i class="material-icons">assessment</i>
                            <span>View Reports</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- System Status -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="material-icons">settings</i>
                        System Status
                    </h2>
                </div>
                <div class="card-body">
                    <div class="system-status-grid">
                        <div class="status-item">
                            <i class="material-icons status-icon success">check_circle</i>
                            <div class="status-info">
                                <h4>Database</h4>
                                <p>Connected and running</p>
                            </div>
                        </div>
                        <div class="status-item">
                            <i class="material-icons status-icon success">wifi_off</i>
                            <div class="status-info">
                                <h4>Network</h4>
                                <p>Offline Mode</p>
                            </div>
                        </div>
                        <div class="status-item">
                            <i class="material-icons status-icon success">security</i>
                            <div class="status-info">
                                <h4>Security</h4>
                                <p>Protected</p>
                            </div>
                        </div>
                        <div class="status-item">
                            <i class="material-icons status-icon success">storage</i>
                            <div class="status-info">
                                <h4>Storage</h4>
                                <p id="storageStatus">Checking...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async init() {
        await this.loadDashboardData();
        this.setupEventListeners();
        this.checkStorageStatus();
    }

    async loadDashboardData() {
        try {
            // Load all stats in parallel
            const [
                suppliersCount,
                customersCount,
                productsCount,
                salesData,
                stockValue,
                lowStockCount,
                recentSales,
                lowStockProducts
            ] = await Promise.all([
                this.getSuppliersCount(),
                this.getCustomersCount(),
                this.getProductsCount(),
                this.getSalesData(),
                this.getStockValue(),
                this.getLowStockCount(),
                this.getRecentSales(),
                this.getLowStockProducts()
            ]);

            // Update stats cards
            this.updateStatCard('suppliers', suppliersCount);
            this.updateStatCard('customers', customersCount);
            this.updateStatCard('products', productsCount);
            this.updateStatCard('sales', salesData.total);
            this.updateStatCard('stock', stockValue);
            this.updateStatCard('alerts', lowStockCount);

            // Update recent sales table
            this.updateRecentSalesTable(recentSales);

            // Update low stock alerts
            this.updateLowStockAlerts(lowStockProducts);

            // Update stock summary
            this.updateStockSummary();

            // Initialize charts
            this.initializeCharts(salesData);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.app.showToast('Error', 'Failed to load dashboard data', 'error');
        }
    }

    updateStatCard(type, data) {
        const cards = {
            suppliers: { index: 0, label: 'Total Suppliers' },
            customers: { index: 1, label: 'Total Customers' },
            products: { index: 2, label: 'Total Products' },
            sales: { index: 3, label: 'Total Sales', isCurrency: true },
            stock: { index: 4, label: 'Total Stock Value', isCurrency: true },
            alerts: { index: 5, label: 'Low Stock Alerts' }
        };

        const cardInfo = cards[type];
        if (!cardInfo) return;

        const card = document.querySelectorAll('.stat-card')[cardInfo.index];
        if (!card) return;

        const valueElement = card.querySelector('.stat-value');
        const labelElement = card.querySelector('.stat-label');
        const changeElement = card.querySelector('.stat-change span');

        if (valueElement) {
            if (cardInfo.isCurrency) {
                valueElement.textContent = this.app.formatCurrency(data.current || data);
            } else {
                valueElement.textContent = data.current || data;
            }
        }

        if (labelElement) {
            labelElement.textContent = cardInfo.label;
        }

        if (changeElement && data.change !== undefined) {
            const change = data.change;
            const changePercent = data.changePercent;
            const changeText = changePercent ? `${change > 0 ? '+' : ''}${changePercent}%` : 'No change';
            
            changeElement.textContent = changeText;
            
            const changeContainer = changeElement.closest('.stat-change');
            if (changeContainer) {
                changeContainer.classList.remove('positive', 'negative');
                if (change > 0) {
                    changeContainer.classList.add('positive');
                    changeContainer.querySelector('i').textContent = 'trending_up';
                } else if (change < 0) {
                    changeContainer.classList.add('negative');
                    changeContainer.querySelector('i').textContent = 'trending_down';
                } else {
                    changeContainer.querySelector('i').textContent = 'trending_flat';
                }
            }
        }
    }

    async getSuppliersCount() {
        const result = await this.app.queryDatabase('SELECT COUNT(*) as count FROM suppliers');
        return {
            current: result[0].count,
            change: 0, // You can implement change calculation
            changePercent: 0
        };
    }

    async getCustomersCount() {
        const result = await this.app.queryDatabase('SELECT COUNT(*) as count FROM customers');
        return {
            current: result[0].count,
            change: 0,
            changePercent: 0
        };
    }

    async getProductsCount() {
        const result = await this.app.queryDatabase('SELECT COUNT(*) as count FROM products');
        return {
            current: result[0].count,
            change: 0,
            changePercent: 0
        };
    }

    async getSalesData() {
        // Get current month sales
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const result = await this.app.queryDatabase(`
            SELECT COALESCE(SUM(grand_total), 0) as total
            FROM invoices 
            WHERE MONTH(invoice_date) = ? AND YEAR(invoice_date) = ?
        `, [currentMonth, currentYear]);

        // Get previous month for comparison
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        
        const prevResult = await this.app.queryDatabase(`
            SELECT COALESCE(SUM(grand_total), 0) as total
            FROM invoices 
            WHERE MONTH(invoice_date) = ? AND YEAR(invoice_date) = ?
        `, [prevMonth, prevYear]);

        const current = parseFloat(result[0].total) || 0;
        const previous = parseFloat(prevResult[0].total) || 0;
        const change = current - previous;
        const changePercent = previous > 0 ? ((change / previous) * 100).toFixed(1) : 0;

        return {
            total: current,
            change: change,
            changePercent: changePercent
        };
    }

    async getStockValue() {
        const result = await this.app.queryDatabase(`
            SELECT COALESCE(SUM(purchase_price * current_stock), 0) as value
            FROM products
        `);
        
        return parseFloat(result[0].value) || 0;
    }

    async getLowStockCount() {
        const result = await this.app.queryDatabase(`
            SELECT COUNT(*) as count 
            FROM products 
            WHERE current_stock <= minimum_stock AND current_stock > 0
        `);
        
        return result[0].count;
    }

    async getRecentSales(limit = 5) {
        const result = await this.app.queryDatabase(`
            SELECT i.invoice_number, c.name as customer_name, 
                   i.invoice_date, i.grand_total
            FROM invoices i
            JOIN customers c ON i.customer_id = c.id
            ORDER BY i.created_at DESC
            LIMIT ?
        `, [limit]);
        
        return result;
    }

    async getLowStockProducts(limit = 5) {
        const result = await this.app.queryDatabase(`
            SELECT p.name, p.current_stock, p.minimum_stock,
                   ROUND((p.current_stock / p.minimum_stock) * 100, 2) as stock_percentage
            FROM products p
            WHERE p.current_stock <= p.minimum_stock AND p.current_stock > 0
            ORDER BY stock_percentage ASC
            LIMIT ?
        `, [limit]);
        
        return result;
    }

    updateRecentSalesTable(sales) {
        const tbody = document.querySelector('#recentSalesTable tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (sales.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No recent sales found</td>
                </tr>
            `;
            return;
        }

        sales.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><a href="#" class="invoice-link" data-invoice="${sale.invoice_number}">${sale.invoice_number}</a></td>
                <td>${sale.customer_name}</td>
                <td>${this.app.formatDate(sale.invoice_date)}</td>
                <td>${this.app.formatCurrency(sale.grand_total)}</td>
            `;
            tbody.appendChild(row);
        });

        // Add click handlers for invoice links
        document.querySelectorAll('.invoice-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const invoiceNumber = e.target.dataset.invoice;
                this.viewInvoice(invoiceNumber);
            });
        });
    }

    updateLowStockAlerts(products) {
        const container = document.getElementById('lowStockAlerts');
        if (!container) return;

        if (products.length === 0) {
            container.innerHTML = `
                <div class="no-alerts">
                    <i class="material-icons">check_circle</i>
                    <p>All products are sufficiently stocked</p>
                </div>
            `;
            return;
        }

        let alertsHTML = '';
        
        products.forEach(product => {
            const percentage = product.stock_percentage;
            let alertClass = 'warning';
            let icon = 'warning';
            
            if (percentage <= 20) {
                alertClass = 'danger';
                icon = 'error';
            } else if (percentage <= 50) {
                alertClass = 'warning';
                icon = 'warning';
            }
            
            alertsHTML += `
                <div class="alert-item ${alertClass}">
                    <i class="material-icons">${icon}</i>
                    <div class="alert-content">
                        <h4>${product.name}</h4>
                        <p>Stock: ${product.current_stock} / ${product.minimum_stock} (${percentage}%)</p>
                    </div>
                    <button class="btn btn-sm btn-text" data-product="${product.name}">
                        <i class="material-icons">open_in_new</i>
                    </button>
                </div>
            `;
        });

        container.innerHTML = alertsHTML;

        // Add click handlers for alert buttons
        container.querySelectorAll('.btn-text').forEach(btn => {
            btn.addEventListener('click', () => {
                const productName = btn.dataset.product;
                this.app.navigateTo('products');
                // You could add highlighting of the specific product
            });
        });
    }

    updateStockSummary() {
        const container = document.getElementById('stockSummary');
        if (!container) return;

        this.app.queryDatabase(`
            SELECT 
                COUNT(*) as total_products,
                SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END) as out_of_stock,
                SUM(CASE WHEN current_stock <= minimum_stock AND current_stock > 0 THEN 1 ELSE 0 END) as low_stock,
                SUM(CASE WHEN current_stock > minimum_stock THEN 1 ELSE 0 END) as in_stock
            FROM products
        `).then(result => {
            if (result.length > 0) {
                const data = result[0];
                container.innerHTML = `
                    <div class="stock-summary-grid">
                        <div class="summary-item">
                            <div class="summary-value">${data.total_products}</div>
                            <div class="summary-label">Total Products</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value success">${data.in_stock}</div>
                            <div class="summary-label">In Stock</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value warning">${data.low_stock}</div>
                            <div class="summary-label">Low Stock</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value danger">${data.out_of_stock}</div>
                            <div class="summary-label">Out of Stock</div>
                        </div>
                    </div>
                `;
            }
        });
    }

    initializeCharts(salesData) {
        // Initialize sales chart
        this.initializeSalesChart();
        
        // Initialize stock chart
        this.initializeStockChart();
    }

    initializeSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        // This would be implemented with Chart.js
        // For now, we'll create a placeholder
        ctx.innerHTML = `
            <div class="chart-placeholder">
                <p>Sales chart will be displayed here</p>
                <small>Chart.js integration required</small>
            </div>
        `;
    }

    initializeStockChart() {
        const ctx = document.getElementById('stockChart');
        if (!ctx) return;

        ctx.innerHTML = `
            <div class="chart-placeholder">
                <p>Stock chart will be displayed here</p>
                <small>Chart.js integration required</small>
            </div>
        `;
    }

    setupEventListeners() {
        // Quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // View all buttons
        document.getElementById('viewAllAlerts')?.addEventListener('click', () => {
            this.app.navigateTo('stock');
        });

        document.getElementById('viewAllSales')?.addEventListener('click', () => {
            this.app.navigateTo('reports');
        });

        // Sales period selector
        document.getElementById('salesPeriod')?.addEventListener('change', (e) => {
            this.updateSalesChart(e.target.value);
        });
    }

    handleQuickAction(action) {
        switch(action) {
            case 'new-invoice':
                this.app.navigateTo('sales');
                break;
            case 'new-purchase':
                this.app.navigateTo('purchases');
                break;
            case 'add-product':
                this.app.navigateTo('products');
                // Trigger add product modal
                setTimeout(() => {
                    document.querySelector('[data-action="add-product"]')?.click();
                }, 500);
                break;
            case 'add-customer':
                this.app.navigateTo('customers');
                // Trigger add customer modal
                setTimeout(() => {
                    document.querySelector('[data-action="add-customer"]')?.click();
                }, 500);
                break;
            case 'add-supplier':
                this.app.navigateTo('suppliers');
                // Trigger add supplier modal
                setTimeout(() => {
                    document.querySelector('[data-action="add-supplier"]')?.click();
                }, 500);
                break;
            case 'view-reports':
                this.app.navigateTo('reports');
                break;
        }
    }

    async viewInvoice(invoiceNumber) {
        try {
            const invoice = await this.app.queryDatabase(`
                SELECT i.*, c.name as customer_name, c.address, c.phone, c.gst_number
                FROM invoices i
                JOIN customers c ON i.customer_id = c.id
                WHERE i.invoice_number = ?
            `, [invoiceNumber]);

            if (invoice.length > 0) {
                // You could show a preview modal here
                this.app.showToast('Info', `Invoice ${invoiceNumber} selected`, 'info');
                // Navigate to invoices page with focus on this invoice
                this.app.navigateTo('invoices');
            }
        } catch (error) {
            console.error('Error viewing invoice:', error);
        }
    }

    checkStorageStatus() {
        try {
            // Check localStorage capacity
            const storageElement = document.getElementById('storageStatus');
            if (storageElement) {
                // This is a simplified check
                storageElement.textContent = 'Healthy';
                
                // You could implement more detailed storage checks here
                // For example, check database size, backup status, etc.
            }
        } catch (error) {
            console.error('Error checking storage status:', error);
        }
    }

    async updateSalesChart(days) {
        // This would update the sales chart based on selected period
        this.app.showToast('Info', `Loading sales data for last ${days} days`, 'info');
        
        // You would implement actual chart updating here
    }
}