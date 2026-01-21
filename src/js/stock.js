export default class Stock {
    constructor(app) {
        this.app = app;
    }

    async load() {
        return `
            <div class="content-header">
                <div class="header-left">
                    <h1><i class="material-icons">warehouse</i> Stock Management</h1>
                    <p class="content-subtitle">Monitor and manage your inventory levels</p>
                </div>
                <div class="header-right">
                    <button class="btn btn-primary" id="stockAdjustmentBtn">
                        <i class="material-icons">sync_alt</i> Stock Adjustment
                    </button>
                    <button class="btn btn-outline" id="stockReportBtn">
                        <i class="material-icons">assessment</i> Stock Report
                    </button>
                </div>
            </div>

            <!-- Stock Alerts -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="material-icons">warning</i>
                        Stock Alerts
                    </h2>
                    <button class="btn btn-sm btn-text" id="viewAllAlerts">
                        View All
                    </button>
                </div>
                <div class="card-body">
                    <div id="stockAlertsContainer">
                        <!-- Alerts will be loaded here -->
                        <div class="loading-alerts">Loading alerts...</div>
                    </div>
                </div>
            </div>

            <!-- Stock Overview -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="material-icons">pie_chart</i>
                        Stock Overview
                    </h2>
                </div>
                <div class="card-body">
                    <div class="stock-overview">
                        <div class="overview-stats">
                            <div class="stat-item">
                                <div class="stat-value" id="totalStockValue">₹0</div>
                                <div class="stat-label">Total Stock Value</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="totalProducts">0</div>
                                <div class="stat-label">Total Products</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="totalQuantity">0</div>
                                <div class="stat-label">Total Quantity</div>
                            </div>
                        </div>
                        
                        <div class="stock-distribution">
                            <h4>Stock Distribution by Status</h4>
                            <div class="distribution-chart" id="stockDistributionChart">
                                <!-- Chart will be rendered here -->
                            </div>
                            <div class="distribution-legend" id="stockDistributionLegend">
                                <!-- Legend will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stock Movement History -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="material-icons">history</i>
                        Recent Stock Movements
                    </h2>
                    <div class="card-actions">
                        <select class="form-control form-control-sm" id="movementTypeFilter">
                            <option value="">All Types</option>
                            <option value="purchase">Purchases</option>
                            <option value="sale">Sales</option>
                            <option value="adjustment">Adjustments</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table" id="stockMovementsTable">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Type</th>
                                    <th>Quantity Change</th>
                                    <th>Previous</th>
                                    <th>New</th>
                                    <th>Reference</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="stockMovementsBody">
                                <!-- Movements will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="pagination-container" id="movementsPagination">
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

            <!-- Low Stock Products -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="material-icons">low_priority</i>
                        Low Stock Products
                    </h2>
                    <button class="btn btn-sm btn-text" id="refreshLowStock">
                        <i class="material-icons">refresh</i>
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table" id="lowStockTable">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Current Stock</th>
                                    <th>Minimum Stock</th>
                                    <th>Status</th>
                                    <th>Last Purchase</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="lowStockBody">
                                <!-- Low stock products will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    async init() {
        await this.loadStockAlerts();
        await this.loadStockOverview();
        await this.loadStockMovements();
        await this.loadLowStockProducts();
        this.setupEventListeners();
    }

    async loadStockAlerts() {
        try {
            const alerts = await this.app.queryDatabase(`
                SELECT p.*, 
                    ROUND((p.current_stock / p.minimum_stock) * 100, 2) as stock_percentage,
                    CASE 
                        WHEN p.current_stock <= 0 THEN 'OUT_OF_STOCK'
                        WHEN p.current_stock <= p.minimum_stock THEN 'LOW_STOCK'
                        ELSE 'IN_STOCK'
                    END as stock_status,
                    (SELECT MAX(purchase_date) FROM purchases WHERE id IN (
                        SELECT purchase_id FROM purchase_items WHERE product_id = p.id
                    )) as last_purchased
                FROM products p
                WHERE p.current_stock <= p.minimum_stock
                ORDER BY stock_percentage ASC
                LIMIT 5
            `);

            this.updateStockAlerts(alerts);
        } catch (error) {
            console.error('Error loading stock alerts:', error);
        }
    }

    updateStockAlerts(alerts) {
        const container = document.getElementById('stockAlertsContainer');
        if (!container) return;

        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="no-alerts">
                    <i class="material-icons">check_circle</i>
                    <p>All products are sufficiently stocked</p>
                </div>
            `;
            return;
        }

        let alertsHTML = '';
        
        alerts.forEach(product => {
            const percentage = product.stock_percentage;
            let alertType = 'warning';
            let icon = 'warning';
            let title = 'Low Stock';
            
            if (product.current_stock <= 0) {
                alertType = 'danger';
                icon = 'error';
                title = 'Out of Stock';
            } else if (percentage <= 20) {
                alertType = 'danger';
                icon = 'error';
                title = 'Critical Stock';
            } else if (percentage <= 50) {
                alertType = 'warning';
                icon = 'warning';
                title = 'Low Stock';
            }
            
            alertsHTML += `
                <div class="stock-alert ${alertType}">
                    <div class="alert-icon">
                        <i class="material-icons">${icon}</i>
                    </div>
                    <div class="alert-content">
                        <h4>${product.name}</h4>
                        <p>${title}: ${product.current_stock} / ${product.minimum_stock} (${percentage}%)</p>
                        <small>Last purchased: ${product.last_purchased ? this.app.formatDate(product.last_purchased) : 'Never'}</small>
                    </div>
                    <div class="alert-actions">
                        <button class="btn btn-sm btn-text" data-product="${product.id}" data-action="purchase">
                            <i class="material-icons">add_shopping_cart</i> Purchase
                        </button>
                        <button class="btn btn-sm btn-text" data-product="${product.id}" data-action="adjust">
                            <i class="material-icons">sync_alt</i> Adjust
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = alertsHTML;

        // Add event listeners to alert buttons
        container.querySelectorAll('button[data-product]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.product;
                const action = e.currentTarget.dataset.action;
                this.handleAlertAction(productId, action);
            });
        });
    }

    async loadStockOverview() {
        try {
            const [stats, distribution] = await Promise.all([
                this.app.queryDatabase(`
                    SELECT 
                        COUNT(*) as total_products,
                        SUM(current_stock) as total_quantity,
                        COALESCE(SUM(purchase_price * current_stock), 0) as total_value
                    FROM products
                `),
                this.app.queryDatabase(`
                    SELECT 
                        CASE 
                            WHEN current_stock <= 0 THEN 'Out of Stock'
                            WHEN current_stock <= minimum_stock THEN 'Low Stock'
                            ELSE 'In Stock'
                        END as status,
                        COUNT(*) as count,
                        SUM(current_stock) as quantity,
                        COALESCE(SUM(purchase_price * current_stock), 0) as value
                    FROM products
                    GROUP BY 
                        CASE 
                            WHEN current_stock <= 0 THEN 'Out of Stock'
                            WHEN current_stock <= minimum_stock THEN 'Low Stock'
                            ELSE 'In Stock'
                        END
                `)
            ]);

            this.updateStockOverview(stats[0], distribution);
        } catch (error) {
            console.error('Error loading stock overview:', error);
        }
    }

    updateStockOverview(stats, distribution) {
        // Update stats
        document.getElementById('totalStockValue').textContent = this.app.formatCurrency(stats.total_value || 0);
        document.getElementById('totalProducts').textContent = stats.total_products || 0;
        document.getElementById('totalQuantity').textContent = stats.total_quantity || 0;

        // Update distribution chart
        this.updateStockDistribution(distribution);
    }

    updateStockDistribution(distribution) {
        const chartContainer = document.getElementById('stockDistributionChart');
        const legendContainer = document.getElementById('stockDistributionLegend');
        
        if (!chartContainer || !legendContainer) return;

        if (distribution.length === 0) {
            chartContainer.innerHTML = '<p class="text-muted">No stock data available</p>';
            legendContainer.innerHTML = '';
            return;
        }

        // Create simple HTML chart
        const totalProducts = distribution.reduce((sum, item) => sum + item.count, 0);
        
        let chartHTML = '<div class="distribution-bars">';
        let legendHTML = '<div class="legend-items">';
        
        const colors = {
            'In Stock': '#4caf50',
            'Low Stock': '#ff9800',
            'Out of Stock': '#f44336'
        };

        distribution.forEach(item => {
            const percentage = ((item.count / totalProducts) * 100).toFixed(1);
            const color = colors[item.status] || '#999';
            
            chartHTML += `
                <div class="distribution-bar" style="width: ${percentage}%; background: ${color};">
                    <span class="bar-label">${item.status}: ${item.count}</span>
                </div>
            `;
            
            legendHTML += `
                <div class="legend-item">
                    <span class="legend-color" style="background: ${color}"></span>
                    <span class="legend-label">${item.status} (${item.count})</span>
                </div>
            `;
        });

        chartHTML += '</div>';
        legendHTML += '</div>';

        chartContainer.innerHTML = chartHTML;
        legendContainer.innerHTML = legendHTML;
    }

    async loadStockMovements(page = 1, type = '') {
        try {
            const limit = 10;
            const offset = (page - 1) * limit;

            let query = `
                SELECT sl.*, p.name as product_name, p.sku,
                    CASE 
                        WHEN sl.transaction_type = 'purchase' THEN 'Purchase'
                        WHEN sl.transaction_type = 'sale' THEN 'Sale'
                        WHEN sl.transaction_type = 'adjustment' THEN 'Adjustment'
                        ELSE 'Return'
                    END as type_label,
                    CASE 
                        WHEN sl.transaction_type = 'purchase' THEN 'var(--success-color)'
                        WHEN sl.transaction_type = 'sale' THEN 'var(--danger-color)'
                        ELSE 'var(--warning-color)'
                    END as type_color
                FROM stock_logs sl
                JOIN products p ON sl.product_id = p.id
            `;

            const params = [];
            
            if (type) {
                query += ` WHERE sl.transaction_type = ?`;
                params.push(type);
            }
            
            query += ` ORDER BY sl.created_at DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const movements = await this.app.queryDatabase(query, params);
            
            // Get total count
            let countQuery = `SELECT COUNT(*) as total FROM stock_logs`;
            if (type) {
                countQuery += ` WHERE transaction_type = ?`;
            }
            
            const countResult = await this.app.queryDatabase(countQuery, type ? [type] : []);
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);

            this.updateStockMovementsTable(movements);
            this.updateMovementsPagination(page, totalPages, total);

        } catch (error) {
            console.error('Error loading stock movements:', error);
        }
    }

    updateStockMovementsTable(movements) {
        const tbody = document.getElementById('stockMovementsBody');
        if (!tbody) return;

        if (movements.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <p class="text-muted">No stock movements found</p>
                    </td>
                </tr>
            `;
            return;
        }

        let tableHTML = '';
        
        movements.forEach(movement => {
            const changeClass = movement.quantity_change > 0 ? 'text-success' : 'text-danger';
            const changeSymbol = movement.quantity_change > 0 ? '+' : '';
            
            let referenceText = 'Manual';
            if (movement.reference_id) {
                if (movement.transaction_type === 'purchase') {
                    referenceText = `PUR${movement.reference_id.toString().padStart(4, '0')}`;
                } else if (movement.transaction_type === 'sale') {
                    referenceText = `INV${movement.reference_id.toString().padStart(4, '0')}`;
                } else {
                    referenceText = `#${movement.reference_id}`;
                }
            }
            
            tableHTML += `
                <tr>
                    <td>${this.app.formatDate(movement.created_at)}</td>
                    <td>
                        <div class="product-info">
                            <strong>${movement.product_name}</strong>
                            ${movement.sku ? `<small class="text-muted">${movement.sku}</small>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="badge" style="background: ${movement.type_color}">
                            ${movement.type_label}
                        </span>
                    </td>
                    <td class="${changeClass}">
                        <i class="material-icons">${movement.quantity_change > 0 ? 'arrow_upward' : 'arrow_downward'}</i>
                        ${changeSymbol}${movement.quantity_change}
                    </td>
                    <td>${movement.previous_stock}</td>
                    <td>${movement.new_stock}</td>
                    <td>${referenceText}</td>
                    <td>
                        <button class="btn btn-sm btn-text view-movement" data-id="${movement.id}">
                            <i class="material-icons">info</i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = tableHTML;

        // Add event listeners
        document.querySelectorAll('.view-movement').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const movementId = e.currentTarget.dataset.id;
                this.viewMovementDetails(movementId);
            });
        });
    }

    updateMovementsPagination(currentPage, totalPages, totalCount) {
        const currentPageElement = document.getElementById('currentPage');
        const totalPagesElement = document.getElementById('totalPages');
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');

        if (currentPageElement) currentPageElement.textContent = currentPage;
        if (totalPagesElement) totalPagesElement.textContent = totalPages;

        if (prevButton) {
            prevButton.disabled = currentPage === 1;
            prevButton.onclick = () => {
                const type = document.getElementById('movementTypeFilter')?.value || '';
                this.loadStockMovements(currentPage - 1, type);
            };
        }

        if (nextButton) {
            nextButton.disabled = currentPage === totalPages;
            nextButton.onclick = () => {
                const type = document.getElementById('movementTypeFilter')?.value || '';
                this.loadStockMovements(currentPage + 1, type);
            };
        }
    }

    async loadLowStockProducts() {
        try {
            const products = await this.app.queryDatabase(`
                SELECT p.*, s.name as supplier_name,
                    ROUND((p.current_stock / p.minimum_stock) * 100, 2) as stock_percentage,
                    (SELECT MAX(purchase_date) FROM purchases WHERE id IN (
                        SELECT purchase_id FROM purchase_items WHERE product_id = p.id
                    )) as last_purchased
                FROM products p
                LEFT JOIN suppliers s ON p.supplier_id = s.id
                WHERE p.current_stock <= p.minimum_stock AND p.current_stock > 0
                ORDER BY stock_percentage ASC
                LIMIT 10
            `);

            this.updateLowStockTable(products);
        } catch (error) {
            console.error('Error loading low stock products:', error);
        }
    }

    updateLowStockTable(products) {
        const tbody = document.getElementById('lowStockBody');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <p class="text-muted">No low stock products found</p>
                    </td>
                </tr>
            `;
            return;
        }

        let tableHTML = '';
        
        products.forEach(product => {
            const percentage = product.stock_percentage;
            let statusClass = 'warning';
            let statusLabel = 'Low Stock';
            
            if (percentage <= 20) {
                statusClass = 'danger';
                statusLabel = 'Critical';
            }
            
            tableHTML += `
                <tr>
                    <td>
                        <div class="product-info">
                            <strong>${product.name}</strong>
                            ${product.sku ? `<small class="text-muted">${product.sku}</small>` : ''}
                        </div>
                    </td>
                    <td>${product.category || 'Uncategorized'}</td>
                    <td>${product.current_stock} ${product.unit || ''}</td>
                    <td>${product.minimum_stock}</td>
                    <td>
                        <span class="badge badge-${statusClass}">
                            ${statusLabel} (${percentage}%)
                        </span>
                    </td>
                    <td>${product.last_purchased ? this.app.formatDate(product.last_purchased) : 'Never'}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-text" data-product="${product.id}" data-action="purchase">
                                <i class="material-icons">add_shopping_cart</i>
                            </button>
                            <button class="btn btn-sm btn-text" data-product="${product.id}" data-action="adjust">
                                <i class="material-icons">sync_alt</i>
                            </button>
                            <button class="btn btn-sm btn-text" data-product="${product.id}" data-action="view">
                                <i class="material-icons">visibility</i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = tableHTML;

        // Add event listeners
        document.querySelectorAll('button[data-product]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.product;
                const action = e.currentTarget.dataset.action;
                this.handleProductAction(productId, action);
            });
        });
    }

    setupEventListeners() {
        // Stock adjustment button
        document.getElementById('stockAdjustmentBtn')?.addEventListener('click', () => {
            this.showStockAdjustmentModal();
        });

        // Stock report button
        document.getElementById('stockReportBtn')?.addEventListener('click', () => {
            this.generateStockReport();
        });

        // View all alerts button
        document.getElementById('viewAllAlerts')?.addEventListener('click', () => {
            this.app.navigateTo('products');
        });

        // Refresh low stock button
        document.getElementById('refreshLowStock')?.addEventListener('click', () => {
            this.loadLowStockProducts();
        });

        // Movement type filter
        document.getElementById('movementTypeFilter')?.addEventListener('change', (e) => {
            this.loadStockMovements(1, e.target.value);
        });
    }

    handleAlertAction(productId, action) {
        switch(action) {
            case 'purchase':
                this.initiatePurchase(productId);
                break;
            case 'adjust':
                this.showAdjustStockModal(productId);
                break;
        }
    }

    handleProductAction(productId, action) {
        switch(action) {
            case 'purchase':
                this.initiatePurchase(productId);
                break;
            case 'adjust':
                this.showAdjustStockModal(productId);
                break;
            case 'view':
                this.app.modules.products.viewProduct(productId);
                break;
        }
    }

    async initiatePurchase(productId) {
        // Navigate to purchases and pre-select the product
        this.app.navigateTo('purchases');
        
        // Wait for page to load
        setTimeout(() => {
            // Trigger new purchase form
            document.getElementById('addPurchaseBtn')?.click();
            
            // Pre-select product (this would need coordination with purchases module)
            this.app.showToast('Info', 'Navigate to purchases and select product', 'info');
        }, 500);
    }

    async showAdjustStockModal(productId = null) {
        let productSelectHTML = '';
        let currentStock = 0;
        let productName = '';
        
        if (productId) {
            // Single product adjustment
            const [product] = await this.app.queryDatabase(
                'SELECT name, current_stock FROM products WHERE id = ?',
                [productId]
            );
            
            if (product) {
                productName = product.name;
                currentStock = product.current_stock;
                
                productSelectHTML = `
                    <div class="form-row">
                        <label class="form-label">Product</label>
                        <input type="text" class="form-control" value="${product.name}" readonly>
                        <input type="hidden" id="adjustProductId" value="${productId}">
                    </div>
                `;
            }
        } else {
            // Multiple product adjustment
            const products = await this.app.queryDatabase(`
                SELECT id, name, current_stock FROM products ORDER BY name
            `);
            
            productSelectHTML = `
                <div class="form-row">
                    <label class="form-label">Product</label>
                    <select class="form-control" id="adjustProductSelect">
                        <option value="">Select Product</option>
                        ${products.map(p => `<option value="${p.id}" data-stock="${p.current_stock}">${p.name}</option>`).join('')}
                    </select>
                </div>
            `;
        }

        const modalContent = `
            <form id="adjustStockForm" class="modal-form">
                <div class="form-grid">
                    ${productSelectHTML}
                    
                    <div class="form-row">
                        <label class="form-label">Current Stock</label>
                        <input type="number" class="form-control" id="currentStock" value="${currentStock}" readonly>
                    </div>
                    
                    <div class="form-row">
                        <label class="form-label">Adjustment Type</label>
                        <select class="form-control" id="adjustmentType">
                            <option value="increase">Increase Stock</option>
                            <option value="decrease">Decrease Stock</option>
                            <option value="set">Set Stock to</option>
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <label class="form-label">Quantity *</label>
                        <input type="number" class="form-control" id="adjustmentQuantity" 
                               step="0.01" min="0.01" required autocomplete="off">
                    </div>
                    
                    <div class="form-row">
                        <label class="form-label">New Stock</label>
                        <input type="number" class="form-control" id="newStock" readonly>
                    </div>
                    
                    <div class="form-row">
                        <label class="form-label">Reason *</label>
                        <select class="form-control" id="adjustmentReason">
                            <option value="">Select Reason</option>
                            <option value="damaged">Damaged Goods</option>
                            <option value="expired">Expired Products</option>
                            <option value="found">Found Stock</option>
                            <option value="theft">Theft/Loss</option>
                            <option value="count_error">Counting Error</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-row full-width">
                        <label class="form-label">Notes</label>
                        <textarea class="form-control" id="adjustmentNotes" rows="2" placeholder="Additional details..."></textarea>
                    </div>
                </div>
            </form>
        `;

        const modal = this.app.showModal('Stock Adjustment', modalContent, [
            { text: 'Cancel', class: 'btn-secondary' },
            { text: 'Save Adjustment', class: 'btn-primary', id: 'saveAdjustmentBtn', disabled: true }
        ]);

        // Setup calculation
        const setupCalculation = () => {
            let current = 0;
            let productId = null;
            
            if (productId) {
                current = parseFloat(document.getElementById('currentStock').value) || 0;
                productId = document.getElementById('adjustProductId')?.value;
            } else {
                const select = document.getElementById('adjustProductSelect');
                const selectedOption = select?.options[select.selectedIndex];
                if (selectedOption && selectedOption.value) {
                    current = parseFloat(selectedOption.dataset.stock) || 0;
                    productId = selectedOption.value;
                    document.getElementById('currentStock').value = current;
                }
            }
            
            const adjustmentType = document.getElementById('adjustmentType').value;
            const quantity = parseFloat(document.getElementById('adjustmentQuantity').value) || 0;
            const reason = document.getElementById('adjustmentReason').value;
            
            let newStock = current;
            
            switch(adjustmentType) {
                case 'increase':
                    newStock = current + quantity;
                    break;
                case 'decrease':
                    newStock = current - quantity;
                    break;
                case 'set':
                    newStock = quantity;
                    break;
            }
            
            document.getElementById('newStock').value = newStock.toFixed(2);
            
            // Validate
            const saveBtn = document.getElementById('saveAdjustmentBtn');
            if (newStock < 0 || !productId || !reason) {
                saveBtn.disabled = true;
                saveBtn.title = !productId ? 'Select a product' : !reason ? 'Select a reason' : 'Stock cannot be negative';
            } else {
                saveBtn.disabled = false;
                saveBtn.title = '';
            }
        };

        // Event listeners for calculation
        if (!productId) {
            document.getElementById('adjustProductSelect')?.addEventListener('change', setupCalculation);
        }
        
        document.getElementById('adjustmentType')?.addEventListener('change', setupCalculation);
        document.getElementById('adjustmentQuantity')?.addEventListener('input', setupCalculation);
        document.getElementById('adjustmentReason')?.addEventListener('change', setupCalculation);

        // Initial calculation
        setupCalculation();

        // Save button
        document.getElementById('saveAdjustmentBtn').addEventListener('click', async () => {
            let productId = null;
            let productName = '';
            
            if (productId) {
                productId = document.getElementById('adjustProductId').value;
                productName = document.querySelector('input[readonly]')?.value || 'Product';
            } else {
                const select = document.getElementById('adjustProductSelect');
                productId = select.value;
                productName = select.options[select.selectedIndex]?.text || 'Product';
            }
            
            const currentStock = parseFloat(document.getElementById('currentStock').value);
            const newStock = parseFloat(document.getElementById('newStock').value);
            const reason = document.getElementById('adjustmentReason').value;
            const notes = document.getElementById('adjustmentNotes').value || '';
            
            if (newStock < 0) {
                this.app.showToast('Error', 'Stock cannot be negative', 'error');
                return;
            }

            const quantityChange = newStock - currentStock;
            const reasonText = {
                damaged: 'Damaged goods',
                expired: 'Expired products',
                found: 'Found stock',
                theft: 'Theft/Loss',
                count_error: 'Counting error',
                other: 'Other'
            }[reason] || reason;
            
            const fullNotes = `${reasonText}${notes ? `: ${notes}` : ''}`;

            await this.saveStockAdjustment(productId, productName, currentStock, newStock, fullNotes);
        });
    }

    async saveStockAdjustment(productId, productName, oldStock, newStock, notes) {
        try {
            this.app.showLoading();

            const quantityChange = newStock - oldStock;

            // Update product stock
            await this.app.executeDatabase(
                'UPDATE products SET current_stock = ? WHERE id = ?',
                [newStock, productId]
            );

            // Log stock change
            await this.app.executeDatabase(`
                INSERT INTO stock_logs (product_id, transaction_type, quantity_change, previous_stock, new_stock, notes)
                VALUES (?, 'adjustment', ?, ?, ?, ?)
            `, [
                productId,
                quantityChange,
                oldStock,
                newStock,
                notes
            ]);

            this.app.showToast('Success', `Stock adjusted for ${productName}`, 'success');
            
            // Reload all stock data
            await this.loadStockAlerts();
            await this.loadStockOverview();
            await this.loadStockMovements();
            await this.loadLowStockProducts();
            
            // Close modal
            document.querySelector('.modal-overlay')?.remove();

        } catch (error) {
            console.error('Error saving stock adjustment:', error);
            this.app.showToast('Error', 'Failed to adjust stock', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async viewMovementDetails(movementId) {
        try {
            const [movement] = await this.app.queryDatabase(`
                SELECT sl.*, p.name as product_name, p.sku, p.unit,
                    CASE 
                        WHEN sl.transaction_type = 'purchase' THEN 'Purchase'
                        WHEN sl.transaction_type = 'sale' THEN 'Sale'
                        WHEN sl.transaction_type = 'adjustment' THEN 'Adjustment'
                        ELSE 'Return'
                    END as type_label
                FROM stock_logs sl
                JOIN products p ON sl.product_id = p.id
                WHERE sl.id = ?
            `, [movementId]);

            if (!movement) {
                this.app.showToast('Error', 'Movement not found', 'error');
                return;
            }

            let referenceInfo = 'Manual adjustment';
            if (movement.reference_id) {
                if (movement.transaction_type === 'purchase') {
                    const [purchase] = await this.app.queryDatabase(
                        'SELECT purchase_number FROM purchases WHERE id = ?',
                        [movement.reference_id]
                    );
                    if (purchase) {
                        referenceInfo = `Purchase: ${purchase.purchase_number || 'N/A'}`;
                    }
                } else if (movement.transaction_type === 'sale') {
                    const [invoice] = await this.app.queryDatabase(
                        'SELECT invoice_number FROM invoices WHERE id = ?',
                        [movement.reference_id]
                    );
                    if (invoice) {
                        referenceInfo = `Invoice: ${invoice.invoice_number}`;
                    }
                }
            }

            const modalContent = `
                <div class="movement-details">
                    <div class="details-header">
                        <h3>Stock Movement Details</h3>
                        <div class="movement-type">
                            <span class="badge ${movement.quantity_change > 0 ? 'badge-success' : 'badge-danger'}">
                                ${movement.type_label}
                            </span>
                        </div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-section">
                            <h4><i class="material-icons">inventory_2</i> Product Information</h4>
                            <div class="detail-item">
                                <strong>Product:</strong> ${movement.product_name}
                            </div>
                            <div class="detail-item">
                                <strong>SKU:</strong> ${movement.sku || 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>Unit:</strong> ${movement.unit || 'N/A'}
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="material-icons">swap_vert</i> Stock Changes</h4>
                            <div class="detail-item">
                                <strong>Date:</strong> ${this.app.formatDate(movement.created_at)}
                            </div>
                            <div class="detail-item ${movement.quantity_change > 0 ? 'text-success' : 'text-danger'}">
                                <strong>Change:</strong> ${movement.quantity_change > 0 ? '+' : ''}${movement.quantity_change}
                            </div>
                            <div class="detail-item">
                                <strong>Previous Stock:</strong> ${movement.previous_stock}
                            </div>
                            <div class="detail-item">
                                <strong>New Stock:</strong> ${movement.new_stock}
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section full-width">
                        <h4><i class="material-icons">link</i> Reference</h4>
                        <div class="detail-item">
                            ${referenceInfo}
                        </div>
                    </div>
                    
                    ${movement.notes ? `
                        <div class="detail-section full-width">
                            <h4><i class="material-icons">notes</i> Notes</h4>
                            <div class="detail-item">
                                ${movement.notes}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;

            this.app.showModal('Movement Details', modalContent, [
                { text: 'Close', class: 'btn-secondary' }
            ]);

        } catch (error) {
            console.error('Error viewing movement details:', error);
            this.app.showToast('Error', 'Failed to load movement details', 'error');
        }
    }

    async generateStockReport() {
        try {
            this.app.showLoading();

            const [products, summary] = await Promise.all([
                this.app.queryDatabase(`
                    SELECT p.*, s.name as supplier_name,
                        CASE 
                            WHEN p.current_stock <= 0 THEN 'OUT_OF_STOCK'
                            WHEN p.current_stock <= p.minimum_stock THEN 'LOW_STOCK'
                            ELSE 'IN_STOCK'
                        END as stock_status,
                        (p.purchase_price * p.current_stock) as stock_value
                    FROM products p
                    LEFT JOIN suppliers s ON p.supplier_id = s.id
                    ORDER BY p.name
                `),
                this.app.queryDatabase(`
                    SELECT 
                        COUNT(*) as total_products,
                        SUM(current_stock) as total_quantity,
                        COALESCE(SUM(purchase_price * current_stock), 0) as total_value,
                        SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END) as out_of_stock,
                        SUM(CASE WHEN current_stock <= minimum_stock AND current_stock > 0 THEN 1 ELSE 0 END) as low_stock,
                        SUM(CASE WHEN current_stock > minimum_stock THEN 1 ELSE 0 END) as in_stock
                    FROM products
                `)
            ]);

            const reportData = {
                generated: new Date().toISOString(),
                summary: summary[0],
                products: products,
                status_summary: {
                    in_stock: summary[0].in_stock,
                    low_stock: summary[0].low_stock,
                    out_of_stock: summary[0].out_of_stock
                }
            };

            // Create report HTML
            const reportHTML = this.generateReportHTML(reportData);
            
            // Open in new window for printing
            const reportWindow = window.open('', '_blank');
            reportWindow.document.write(reportHTML);
            reportWindow.document.close();
            reportWindow.focus();

        } catch (error) {
            console.error('Error generating stock report:', error);
            this.app.showToast('Error', 'Failed to generate stock report', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    generateReportHTML(reportData) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Stock Report - ${new Date().toLocaleDateString()}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        color: #333;
                    }
                    .report-container {
                        max-width: 1000px;
                        margin: 0 auto;
                        background: white;
                    }
                    .report-header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                    }
                    h1, h2, h3 {
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
                        font-weight: bold;
                    }
                    td {
                        padding: 8px 10px;
                        border: 1px solid #ddd;
                    }
                    .summary-cards {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin: 20px 0;
                    }
                    .summary-card {
                        padding: 15px;
                        border-radius: 8px;
                        background: #f8f9fa;
                        text-align: center;
                    }
                    .summary-card.in-stock { border-left: 4px solid #4caf50; }
                    .summary-card.low-stock { border-left: 4px solid #ff9800; }
                    .summary-card.out-of-stock { border-left: 4px solid #f44336; }
                    .summary-card.total { border-left: 4px solid #2196f3; }
                    .summary-value {
                        font-size: 1.5em;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .status-badge {
                        padding: 3px 8px;
                        border-radius: 4px;
                        font-size: 0.8em;
                        font-weight: bold;
                    }
                    .status-in-stock { background: #e8f5e9; color: #2e7d32; }
                    .status-low-stock { background: #fff3e0; color: #ef6c00; }
                    .status-out-of-stock { background: #ffebee; color: #c62828; }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .no-print { display: none; }
                        .summary-cards { break-inside: avoid; }
                        table { break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="report-header">
                        <h1>Stock Inventory Report</h1>
                        <p>Generated on: ${new Date().toLocaleString()}</p>
                        <p>Total Products: ${reportData.summary.total_products} | 
                           Total Quantity: ${reportData.summary.total_quantity} | 
                           Total Value: ${this.app.formatCurrency(reportData.summary.total_value)}</p>
                    </div>
                    
                    <div class="summary-cards">
                        <div class="summary-card in-stock">
                            <div class="summary-value">${reportData.status_summary.in_stock}</div>
                            <div class="summary-label">In Stock Products</div>
                        </div>
                        <div class="summary-card low-stock">
                            <div class="summary-value">${reportData.status_summary.low_stock}</div>
                            <div class="summary-label">Low Stock Products</div>
                        </div>
                        <div class="summary-card out-of-stock">
                            <div class="summary-value">${reportData.status_summary.out_of_stock}</div>
                            <div class="summary-label">Out of Stock Products</div>
                        </div>
                        <div class="summary-card total">
                            <div class="summary-value">${this.app.formatCurrency(reportData.summary.total_value)}</div>
                            <div class="summary-label">Total Stock Value</div>
                        </div>
                    </div>
                    
                    <h2>Product Inventory</h2>
                    <div class="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Category</th>
                                    <th>Supplier</th>
                                    <th>Current Stock</th>
                                    <th>Min Stock</th>
                                    <th>Status</th>
                                    <th>Purchase Price</th>
                                    <th>Stock Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reportData.products.map(product => `
                                    <tr>
                                        <td>${product.name}</td>
                                        <td>${product.sku || 'N/A'}</td>
                                        <td>${product.category || 'Uncategorized'}</td>
                                        <td>${product.supplier_name || 'N/A'}</td>
                                        <td>${product.current_stock} ${product.unit || ''}</td>
                                        <td>${product.minimum_stock}</td>
                                        <td>
                                            <span class="status-badge status-${product.stock_status.toLowerCase().replace('_', '-')}">
                                                ${product.stock_status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>${this.app.formatCurrency(product.purchase_price)}</td>
                                        <td>${this.app.formatCurrency(product.stock_value || 0)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="8" style="text-align: right;"><strong>Total Value:</strong></td>
                                    <td><strong>${this.app.formatCurrency(reportData.summary.total_value)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <div class="report-footer" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 0.9em; color: #666;">
                        <p>End of Report</p>
                        <p>Generated by Distributor Inventory System</p>
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
}