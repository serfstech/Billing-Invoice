export default class Purchases {
    constructor(app) {
        this.app = app;
        this.currentPurchase = null;
        this.purchaseItems = [];
    }

    async load() {
        return `
            <div class="content-header">
                <div class="header-left">
                    <h1><i class="material-icons">add_shopping_cart</i> Purchases</h1>
                    <p class="content-subtitle">Record stock purchases from suppliers</p>
                </div>
                <div class="header-right">
                    <button class="btn btn-primary" id="addPurchaseBtn">
                        <i class="material-icons">add</i> New Purchase
                    </button>
                    <button class="btn btn-outline" id="viewPurchaseHistory">
                        <i class="material-icons">history</i> History
                    </button>
                </div>
            </div>

            <!-- Purchase Form (Initially hidden) -->
            <div class="card" id="purchaseFormContainer" style="display: none;">
                <div class="card-header">
                    <h2 class="card-title">New Purchase Order</h2>
                    <div class="card-actions">
                        <button class="btn btn-secondary" id="cancelPurchase">
                            <i class="material-icons">close</i> Cancel
                        </button>
                        <button class="btn btn-primary" id="savePurchase">
                            <i class="material-icons">save</i> Save Purchase
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="form-grid">
                        <div class="form-row">
                            <label class="form-label">Supplier *</label>
                            <select class="form-control" id="purchaseSupplier" required>
                                <option value="">Select Supplier</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Purchase Date</label>
                            <input type="date" class="form-control" id="purchaseDate" 
                                   value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Purchase Number</label>
                            <input type="text" class="form-control" id="purchaseNumber" 
                                   value="PUR-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-" 
                                   placeholder="Auto-generated">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Notes</label>
                            <textarea class="form-control" id="purchaseNotes" rows="2" placeholder="Any additional notes..."></textarea>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add Products to Purchase -->
            <div class="card" id="purchaseItemsContainer" style="display: none;">
                <div class="card-header">
                    <h2 class="card-title">Add Products</h2>
                </div>
                <div class="card-body">
                    <div class="form-grid">
                        <div class="form-row">
                            <label class="form-label">Product *</label>
                            <select class="form-control" id="purchaseProduct">
                                <option value="">Select Product</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Purchase Price *</label>
                            <input type="number" class="form-control" id="purchasePrice" step="0.01" min="0" required>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">GST %</label>
                            <input type="number" class="form-control" id="purchaseGST" step="0.01" min="0" max="28" value="18">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Quantity *</label>
                            <div class="quantity-selector">
                                <button type="button" class="btn btn-outline" id="decreasePurchaseQty">
                                    <i class="material-icons">remove</i>
                                </button>
                                <input type="number" class="form-control" id="purchaseQuantity" value="1" min="1" style="text-align: center;">
                                <button type="button" class="btn btn-outline" id="increasePurchaseQty">
                                    <i class="material-icons">add</i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Total</label>
                            <input type="text" class="form-control" id="purchaseItemTotal" readonly>
                        </div>
                    </div>
                    
                    <button class="btn btn-success btn-block" id="addPurchaseItemBtn" style="margin-top: 20px;">
                        <i class="material-icons">add_shopping_cart</i> Add to Purchase
                    </button>
                </div>
            </div>

            <!-- Purchase Items List -->
            <div class="card" id="purchaseItemsListContainer" style="display: none;">
                <div class="card-header">
                    <h2 class="card-title">Purchase Items</h2>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table" id="purchaseItemsTable">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Purchase Price</th>
                                    <th>Qty</th>
                                    <th>GST %</th>
                                    <th>GST Amount</th>
                                    <th>Total</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="purchaseItemsBody">
                                <!-- Items will be added here -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="purchase-summary" style="margin-top: 30px;">
                        <div class="summary-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                            <div class="summary-card">
                                <h3>Subtotal: <span id="purchaseSubtotal">₹0.00</span></h3>
                            </div>
                            <div class="summary-card">
                                <h3>Total GST: <span id="purchaseGSTTotal">₹0.00</span></h3>
                            </div>
                            <div class="summary-card">
                                <h2>Grand Total: <span id="purchaseGrandTotal">₹0.00</span></h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Purchases -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Recent Purchases</h2>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-text" id="refreshPurchases">
                            <i class="material-icons">refresh</i> Refresh
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table" id="recentPurchasesTable">
                            <thead>
                                <tr>
                                    <th>Purchase No</th>
                                    <th>Supplier</th>
                                    <th>Date</th>
                                    <th>Items</th>
                                    <th>Total Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="recentPurchasesBody">
                                <!-- Recent purchases will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    async init() {
        await this.loadSuppliers();
        await this.loadProducts();
        await this.loadRecentPurchases();
        this.setupEventListeners();
    }

    async loadSuppliers() {
        try {
            const suppliers = await this.app.queryDatabase(`
                SELECT id, name FROM suppliers ORDER BY name
            `);
            
            const select = document.getElementById('purchaseSupplier');
            if (select) {
                select.innerHTML = '<option value="">Select Supplier</option>';
                suppliers.forEach(supplier => {
                    const option = document.createElement('option');
                    option.value = supplier.id;
                    option.textContent = supplier.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
        }
    }

    async loadProducts() {
        try {
            const products = await this.app.queryDatabase(`
                SELECT p.*, s.name as supplier_name 
                FROM products p 
                LEFT JOIN suppliers s ON p.supplier_id = s.id 
                ORDER BY p.name
            `);
            
            const select = document.getElementById('purchaseProduct');
            if (select) {
                select.innerHTML = '<option value="">Select Product</option>';
                products.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.dataset.supplier = product.supplier_id;
                    option.dataset.currentPrice = product.purchase_price;
                    option.textContent = `${product.name} ${product.sku ? `(${product.sku})` : ''}`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    async loadRecentPurchases(limit = 10) {
        try {
            const purchases = await this.app.queryDatabase(`
                SELECT p.*, s.name as supplier_name,
                    COUNT(pi.id) as item_count,
                    SUM(pi.total) as total_amount
                FROM purchases p
                JOIN suppliers s ON p.supplier_id = s.id
                LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
                GROUP BY p.id
                ORDER BY p.purchase_date DESC
                LIMIT ?
            `, [limit]);
            
            this.updateRecentPurchasesTable(purchases);
        } catch (error) {
            console.error('Error loading recent purchases:', error);
        }
    }

    updateRecentPurchasesTable(purchases) {
        const tbody = document.getElementById('recentPurchasesBody');
        if (!tbody) return;

        if (purchases.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="material-icons">add_shopping_cart</i>
                            <p>No purchases found</p>
                            <button class="btn btn-primary" id="createFirstPurchase">
                                <i class="material-icons">add</i> Create Purchase
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            
            document.getElementById('createFirstPurchase')?.addEventListener('click', () => {
                this.showPurchaseForm();
            });
            
            return;
        }

        let tableHTML = '';
        
        purchases.forEach(purchase => {
            tableHTML += `
                <tr data-id="${purchase.id}">
                    <td>${purchase.purchase_number || `PUR${purchase.id.toString().padStart(4, '0')}`}</td>
                    <td>${purchase.supplier_name}</td>
                    <td>${this.app.formatDate(purchase.purchase_date)}</td>
                    <td>${purchase.item_count}</td>
                    <td>${this.app.formatCurrency(purchase.total_amount || 0)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-text view-purchase" data-id="${purchase.id}" title="View">
                                <i class="material-icons">visibility</i>
                            </button>
                            <button class="btn btn-sm btn-text print-purchase" data-id="${purchase.id}" title="Print">
                                <i class="material-icons">print</i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = tableHTML;

        // Add event listeners
        document.querySelectorAll('.view-purchase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const purchaseId = e.currentTarget.dataset.id;
                this.viewPurchase(purchaseId);
            });
        });

        document.querySelectorAll('.print-purchase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const purchaseId = e.currentTarget.dataset.id;
                this.printPurchase(purchaseId);
            });
        });
    }

    setupEventListeners() {
        // New purchase button
        document.getElementById('addPurchaseBtn')?.addEventListener('click', () => {
            this.showPurchaseForm();
        });

        // Cancel purchase button
        document.getElementById('cancelPurchase')?.addEventListener('click', () => {
            this.cancelPurchase();
        });

        // Save purchase button
        document.getElementById('savePurchase')?.addEventListener('click', () => {
            this.savePurchase();
        });

        // Refresh purchases button
        document.getElementById('refreshPurchases')?.addEventListener('click', () => {
            this.loadRecentPurchases();
        });

        // View purchase history button
        document.getElementById('viewPurchaseHistory')?.addEventListener('click', () => {
            this.app.navigateTo('reports');
        });

        // Purchase form event listeners
        this.setupPurchaseFormListeners();
    }

    setupPurchaseFormListeners() {
        // Supplier change
        const supplierSelect = document.getElementById('purchaseSupplier');
        if (supplierSelect) {
            supplierSelect.addEventListener('change', () => {
                this.filterProductsBySupplier();
            });
        }

        // Product change
        const productSelect = document.getElementById('purchaseProduct');
        if (productSelect) {
            productSelect.addEventListener('change', (e) => {
                this.handleProductSelection(e.target.value);
            });
        }

        // Quantity controls
        document.getElementById('decreasePurchaseQty')?.addEventListener('click', () => {
            const qtyInput = document.getElementById('purchaseQuantity');
            let qty = parseInt(qtyInput.value) || 1;
            if (qty > 1) {
                qtyInput.value = qty - 1;
                this.calculatePurchaseItemTotal();
            }
        });

        document.getElementById('increasePurchaseQty')?.addEventListener('click', () => {
            const qtyInput = document.getElementById('purchaseQuantity');
            let qty = parseInt(qtyInput.value) || 1;
            qtyInput.value = qty + 1;
            this.calculatePurchaseItemTotal();
        });

        document.getElementById('purchaseQuantity')?.addEventListener('input', () => {
            this.calculatePurchaseItemTotal();
        });

        // Price and GST input
        document.getElementById('purchasePrice')?.addEventListener('input', () => {
            this.calculatePurchaseItemTotal();
        });

        document.getElementById('purchaseGST')?.addEventListener('input', () => {
            this.calculatePurchaseItemTotal();
        });

        // Add purchase item button
        document.getElementById('addPurchaseItemBtn')?.addEventListener('click', () => {
            this.addPurchaseItem();
        });
    }

    showPurchaseForm() {
        // Show purchase form containers
        document.getElementById('purchaseFormContainer').style.display = 'block';
        document.getElementById('purchaseItemsContainer').style.display = 'block';
        document.getElementById('purchaseItemsListContainer').style.display = 'block';
        
        // Reset form
        this.resetPurchaseForm();
        
        // Generate purchase number if empty
        const purchaseNumber = document.getElementById('purchaseNumber');
        if (purchaseNumber && !purchaseNumber.value) {
            const now = new Date();
            const year = now.getFullYear().toString().slice(-2);
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const random = Math.floor(1000 + Math.random() * 9000);
            purchaseNumber.value = `PUR-${year}${month}-${random}`;
        }
    }

    resetPurchaseForm() {
        this.purchaseItems = [];
        
        // Reset form fields
        document.getElementById('purchaseSupplier').value = '';
        document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('purchaseNotes').value = '';
        document.getElementById('purchaseProduct').value = '';
        document.getElementById('purchasePrice').value = '';
        document.getElementById('purchaseGST').value = '18';
        document.getElementById('purchaseQuantity').value = '1';
        document.getElementById('purchaseItemTotal').value = '';
        
        // Clear items table
        const tbody = document.getElementById('purchaseItemsBody');
        if (tbody) tbody.innerHTML = '';
        
        // Reset summary
        this.updatePurchaseSummary();
    }

    filterProductsBySupplier() {
        const supplierId = document.getElementById('purchaseSupplier').value;
        const productSelect = document.getElementById('purchaseProduct');
        
        if (!productSelect) return;
        
        // Reset all options visibility
        Array.from(productSelect.options).forEach(option => {
            option.style.display = 'block';
        });
        
        // If supplier is selected, filter products
        if (supplierId) {
            Array.from(productSelect.options).forEach(option => {
                if (option.value && option.dataset.supplier !== supplierId) {
                    option.style.display = 'none';
                }
            });
        }
        
        // Reset selection
        productSelect.value = '';
        document.getElementById('purchasePrice').value = '';
        document.getElementById('purchaseGST').value = '18';
        document.getElementById('purchaseQuantity').value = '1';
        document.getElementById('purchaseItemTotal').value = '';
    }

    handleProductSelection(productId) {
        if (!productId) {
            document.getElementById('purchasePrice').value = '';
            document.getElementById('purchaseGST').value = '18';
            this.calculatePurchaseItemTotal();
            return;
        }

        const select = document.getElementById('purchaseProduct');
        const selectedOption = select.options[select.selectedIndex];
        
        const currentPrice = selectedOption.dataset.currentPrice || 0;
        
        document.getElementById('purchasePrice').value = currentPrice;
        this.calculatePurchaseItemTotal();
    }

    calculatePurchaseItemTotal() {
        const price = parseFloat(document.getElementById('purchasePrice').value) || 0;
        const gstPercent = parseFloat(document.getElementById('purchaseGST').value) || 0;
        const quantity = parseInt(document.getElementById('purchaseQuantity').value) || 1;
        
        const subtotal = price * quantity;
        const gstAmount = subtotal * (gstPercent / 100);
        const total = subtotal + gstAmount;
        
        document.getElementById('purchaseItemTotal').value = this.app.formatCurrency(total);
    }

    addPurchaseItem() {
        const productSelect = document.getElementById('purchaseProduct');
        if (!productSelect.value) {
            this.app.showToast('Error', 'Please select a product', 'error');
            return;
        }

        const productId = productSelect.value;
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const productName = selectedOption.text.split(' (')[0];
        
        const price = parseFloat(document.getElementById('purchasePrice').value) || 0;
        const gstPercent = parseFloat(document.getElementById('purchaseGST').value) || 0;
        const quantity = parseInt(document.getElementById('purchaseQuantity').value) || 1;

        // Check if product already exists in purchase
        const existingItemIndex = this.purchaseItems.findIndex(item => item.productId == productId);
        if (existingItemIndex > -1) {
            // Update existing item
            this.purchaseItems[existingItemIndex].quantity += quantity;
            this.purchaseItems[existingItemIndex].recalculate();
        } else {
            // Add new item
            const item = {
                productId,
                productName,
                price,
                gstPercent,
                quantity,
                subtotal: price * quantity,
                gstAmount: (price * quantity) * (gstPercent / 100),
                total: (price * quantity) * (1 + gstPercent / 100),
                recalculate: function() {
                    this.subtotal = this.price * this.quantity;
                    this.gstAmount = this.subtotal * (this.gstPercent / 100);
                    this.total = this.subtotal + this.gstAmount;
                }
            };
            
            this.purchaseItems.push(item);
        }

        // Update table
        this.updatePurchaseItemsTable();
        
        // Clear product selection
        productSelect.value = '';
        document.getElementById('purchasePrice').value = '';
        document.getElementById('purchaseGST').value = '18';
        document.getElementById('purchaseQuantity').value = '1';
        document.getElementById('purchaseItemTotal').value = '';
        
        this.app.showToast('Success', 'Product added to purchase', 'success');
    }

    updatePurchaseItemsTable() {
        const tbody = document.getElementById('purchaseItemsBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.purchaseItems.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.productName}</td>
                <td>${this.app.formatCurrency(item.price)}</td>
                <td>
                    <div class="quantity-control">
                        <button class="btn btn-sm btn-outline decrease-purchase-item" data-index="${index}">
                            <i class="material-icons">remove</i>
                        </button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline increase-purchase-item" data-index="${index}">
                            <i class="material-icons">add</i>
                        </button>
                    </div>
                </td>
                <td>${item.gstPercent}%</td>
                <td>${this.app.formatCurrency(item.gstAmount)}</td>
                <td>${this.app.formatCurrency(item.total)}</td>
                <td>
                    <button class="btn btn-sm btn-danger remove-purchase-item" data-index="${index}">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners for item controls
        document.querySelectorAll('.decrease-purchase-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.adjustPurchaseItemQuantity(index, -1);
            });
        });

        document.querySelectorAll('.increase-purchase-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.adjustPurchaseItemQuantity(index, 1);
            });
        });

        document.querySelectorAll('.remove-purchase-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.removePurchaseItem(index);
            });
        });

        this.updatePurchaseSummary();
    }

    adjustPurchaseItemQuantity(index, change) {
        const item = this.purchaseItems[index];
        const newQuantity = item.quantity + change;
        
        if (newQuantity < 1) {
            this.removePurchaseItem(index);
            return;
        }

        item.quantity = newQuantity;
        item.recalculate();
        
        this.updatePurchaseItemsTable();
        this.app.showToast('Success', 'Quantity updated', 'success');
    }

    removePurchaseItem(index) {
        this.purchaseItems.splice(index, 1);
        this.updatePurchaseItemsTable();
        this.app.showToast('Info', 'Item removed from purchase', 'info');
    }

    updatePurchaseSummary() {
        const subtotal = this.purchaseItems.reduce((sum, item) => sum + item.subtotal, 0);
        const totalGST = this.purchaseItems.reduce((sum, item) => sum + item.gstAmount, 0);
        const grandTotal = this.purchaseItems.reduce((sum, item) => sum + item.total, 0);

        document.getElementById('purchaseSubtotal').textContent = this.app.formatCurrency(subtotal);
        document.getElementById('purchaseGSTTotal').textContent = this.app.formatCurrency(totalGST);
        document.getElementById('purchaseGrandTotal').textContent = this.app.formatCurrency(grandTotal);
    }

    validatePurchase() {
        const supplierId = document.getElementById('purchaseSupplier').value;
        if (!supplierId) {
            this.app.showToast('Error', 'Please select a supplier', 'error');
            return false;
        }

        if (this.purchaseItems.length === 0) {
            this.app.showToast('Error', 'Please add at least one product to the purchase', 'error');
            return false;
        }

        return true;
    }

    async savePurchase() {
        if (!this.validatePurchase()) {
            return;
        }

        try {
            this.app.showLoading();

            // Calculate totals
            const subtotal = this.purchaseItems.reduce((sum, item) => sum + item.subtotal, 0);
            const totalGST = this.purchaseItems.reduce((sum, item) => sum + item.gstAmount, 0);
            const grandTotal = this.purchaseItems.reduce((sum, item) => sum + item.total, 0);

            // Get purchase data
            const supplierId = document.getElementById('purchaseSupplier').value;
            const purchaseDate = document.getElementById('purchaseDate').value;
            const purchaseNumber = document.getElementById('purchaseNumber').value || null;
            const notes = document.getElementById('purchaseNotes').value || null;

            // Create purchase record
            const purchaseResult = await this.app.executeDatabase(`
                INSERT INTO purchases (purchase_number, supplier_id, purchase_date, total_amount, notes)
                VALUES (?, ?, ?, ?, ?)
            `, [
                purchaseNumber,
                supplierId,
                purchaseDate,
                grandTotal,
                notes
            ]);

            const purchaseId = purchaseResult.insertId;

            // Add purchase items
            for (const item of this.purchaseItems) {
                await this.app.executeDatabase(`
                    INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, gst_percentage, total)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    purchaseId,
                    item.productId,
                    item.quantity,
                    item.price,
                    item.gstPercent,
                    item.total
                ]);

                // Update product purchase price if different
                await this.app.executeDatabase(`
                    UPDATE products 
                    SET purchase_price = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ? AND (purchase_price != ? OR purchase_price IS NULL)
                `, [
                    item.price,
                    item.productId,
                    item.price
                ]);
            }

            this.app.showToast('Success', 'Purchase saved successfully!', 'success');
            
            // Reset form and hide containers
            this.cancelPurchase();
            
            // Reload recent purchases
            await this.loadRecentPurchases();

        } catch (error) {
            console.error('Error saving purchase:', error);
            this.app.showToast('Error', 'Failed to save purchase', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    cancelPurchase() {
        // Hide purchase form containers
        document.getElementById('purchaseFormContainer').style.display = 'none';
        document.getElementById('purchaseItemsContainer').style.display = 'none';
        document.getElementById('purchaseItemsListContainer').style.display = 'none';
        
        // Reset form
        this.resetPurchaseForm();
    }

    async viewPurchase(purchaseId) {
        try {
            this.app.showLoading();

            const [purchase] = await this.app.queryDatabase(`
                SELECT p.*, s.name as supplier_name, s.phone, s.address, s.gst_number
                FROM purchases p
                JOIN suppliers s ON p.supplier_id = s.id
                WHERE p.id = ?
            `, [purchaseId]);

            if (!purchase) {
                this.app.showToast('Error', 'Purchase not found', 'error');
                return;
            }

            // Get purchase items
            const items = await this.app.queryDatabase(`
                SELECT pi.*, pr.name as product_name, pr.sku, pr.unit
                FROM purchase_items pi
                JOIN products pr ON pi.product_id = pr.id
                WHERE pi.purchase_id = ?
            `, [purchaseId]);

            const modalContent = `
                <div class="purchase-details">
                    <div class="details-header">
                        <h3>Purchase Order</h3>
                        <div class="purchase-info">
                            <div class="info-row">
                                <strong>Purchase No:</strong> ${purchase.purchase_number || `PUR${purchase.id.toString().padStart(4, '0')}`}
                            </div>
                            <div class="info-row">
                                <strong>Date:</strong> ${this.app.formatDate(purchase.purchase_date)}
                            </div>
                            <div class="info-row">
                                <strong>Supplier:</strong> ${purchase.supplier_name}
                            </div>
                        </div>
                    </div>
                    
                    <div class="supplier-details">
                        <h4><i class="material-icons">business</i> Supplier Information</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <strong>Phone:</strong> ${purchase.phone || 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>GST:</strong> ${purchase.gst_number || 'N/A'}
                            </div>
                            <div class="detail-item full-width">
                                <strong>Address:</strong> ${purchase.address ? purchase.address.replace(/\n/g, '<br>') : 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="purchase-items">
                        <h4><i class="material-icons">list</i> Purchase Items</h4>
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
                                        <th>Total</th>
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
                            </table>
                        </div>
                    </div>
                    
                    <div class="purchase-summary">
                        <div class="summary-grid">
                            <div class="summary-item">
                                <strong>Subtotal:</strong> ${this.app.formatCurrency(items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0))}
                            </div>
                            <div class="summary-item">
                                <strong>Total GST:</strong> ${this.app.formatCurrency(items.reduce((sum, item) => sum + ((item.unit_price * item.quantity) * (item.gst_percentage / 100)), 0))}
                            </div>
                            <div class="summary-item total">
                                <strong>Grand Total:</strong> ${this.app.formatCurrency(purchase.total_amount)}
                            </div>
                        </div>
                    </div>
                    
                    ${purchase.notes ? `
                        <div class="purchase-notes">
                            <h4><i class="material-icons">notes</i> Notes</h4>
                            <p>${purchase.notes}</p>
                        </div>
                    ` : ''}
                </div>
            `;

            const modal = this.app.showModal('Purchase Details', modalContent, [
                { text: 'Close', class: 'btn-secondary' },
                { text: 'Print', class: 'btn-primary', id: 'printPurchaseDetailsBtn' }
            ]);

            // Print button
            modal.querySelector('#printPurchaseDetailsBtn').addEventListener('click', () => {
                this.printPurchase(purchaseId);
            });

        } catch (error) {
            console.error('Error viewing purchase:', error);
            this.app.showToast('Error', 'Failed to load purchase details', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async printPurchase(purchaseId) {
        try {
            // Similar to viewPurchase but for printing
            this.viewPurchase(purchaseId);
            
            // After modal loads, you could trigger print
            // This would need additional implementation for proper printing
            
        } catch (error) {
            console.error('Error printing purchase:', error);
            this.app.showToast('Error', 'Failed to print purchase', 'error');
        }
    }
}