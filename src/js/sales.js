export default class Sales {
    constructor(app) {
        this.app = app;
        this.currentInvoice = null;
        this.invoiceItems = [];
        this.selectedCustomer = null;
    }

    async load() {
        return `
            <div class="content-header">
                <h1><i class="material-icons">point_of_sale</i> Sales / Billing</h1>
                <p class="content-subtitle">Create new invoices and manage sales</p>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">New Invoice</h2>
                    <div class="card-actions">
                        <button class="btn btn-secondary" id="clearInvoice">
                            <i class="material-icons">clear</i> Clear
                        </button>
                        <button class="btn btn-primary" id="saveInvoice">
                            <i class="material-icons">save</i> Save Draft
                        </button>
                    </div>
                </div>

                <div class="card-body">
                    <div class="form-grid">
                        <div class="form-row">
                            <label class="form-label">Customer *</label>
                            <select class="form-control" id="customerSelect" required>
                                <option value="">Select Customer</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Invoice Date</label>
                            <input type="date" class="form-control" id="invoiceDate" 
                                   value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Payment Method</label>
                            <select class="form-control" id="paymentMethod">
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="upi">UPI</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>
                    </div>

                    <div class="customer-details" id="customerDetails" style="display: none; margin-top: 20px; padding: 15px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <div class="form-grid">
                            <div class="form-row">
                                <strong>Phone:</strong> <span id="customerPhone"></span>
                            </div>
                            <div class="form-row">
                                <strong>Address:</strong> <span id="customerAddress"></span>
                            </div>
                            <div class="form-row">
                                <strong>GST:</strong> <span id="customerGST"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Add Products</h2>
                </div>
                <div class="card-body">
                    <div class="form-grid">
                        <div class="form-row">
                            <label class="form-label">Product *</label>
                            <select class="form-control" id="productSelect">
                                <option value="">Select Product</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Available Stock</label>
                            <input type="text" class="form-control" id="availableStock" readonly>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Selling Price</label>
                            <input type="number" class="form-control" id="sellingPrice" step="0.01" min="0">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">GST %</label>
                            <input type="number" class="form-control" id="productGST" step="0.01" min="0" max="28">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Quantity</label>
                            <div class="quantity-selector">
                                <button type="button" class="btn btn-outline" id="decreaseQty">
                                    <i class="material-icons">remove</i>
                                </button>
                                <input type="number" class="form-control" id="quantity" value="1" min="1" style="text-align: center;">
                                <button type="button" class="btn btn-outline" id="increaseQty">
                                    <i class="material-icons">add</i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Total</label>
                            <input type="text" class="form-control" id="itemTotal" readonly>
                        </div>
                    </div>
                    
                    <button class="btn btn-success btn-block" id="addProductBtn" style="margin-top: 20px;">
                        <i class="material-icons">add_shopping_cart</i> Add to Invoice
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Invoice Items</h2>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table" id="invoiceItemsTable">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Qty</th>
                                    <th>GST %</th>
                                    <th>GST Amount</th>
                                    <th>Total</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="invoiceItemsBody">
                                <!-- Items will be added here -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="invoice-summary" style="margin-top: 30px;">
                        <div class="summary-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                            <div class="summary-card">
                                <h3>Subtotal: <span id="invoiceSubtotal">₹0.00</span></h3>
                            </div>
                            <div class="summary-card">
                                <h3>Total GST: <span id="invoiceGST">₹0.00</span></h3>
                            </div>
                            <div class="summary-card">
                                <h2>Grand Total: <span id="invoiceGrandTotal">₹0.00</span></h2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-body" style="text-align: center;">
                    <button class="btn btn-primary btn-lg" id="generateInvoiceBtn" style="min-width: 200px;">
                        <i class="material-icons">receipt</i> Generate Invoice
                    </button>
                    <button class="btn btn-secondary btn-lg" id="previewInvoiceBtn" style="min-width: 200px; margin-left: 10px;">
                        <i class="material-icons">visibility</i> Preview
                    </button>
                    <button class="btn btn-success btn-lg" id="printInvoiceBtn" style="min-width: 200px; margin-left: 10px;">
                        <i class="material-icons">print</i> Print
                    </button>
                </div>
            </div>

            <div id="invoicePreviewContainer" style="display: none;"></div>
        `;
    }

    async init() {
        await this.loadCustomers();
        await this.loadProducts();
        this.setupEventListeners();
        this.updateInvoiceSummary();
    }

    async loadCustomers() {
        try {
            const customers = await this.app.queryDatabase(`
                SELECT id, name, phone, address, gst_number 
                FROM customers 
                ORDER BY name
            `);
            
            const select = document.getElementById('customerSelect');
            select.innerHTML = '<option value="">Select Customer</option>';
            
            customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = `${customer.name} (${customer.phone || 'No phone'})`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading customers:', error);
        }
    }

    async loadProducts() {
        try {
            const products = await this.app.queryDatabase(`
                SELECT p.*, s.name as supplier_name 
                FROM products p 
                LEFT JOIN suppliers s ON p.supplier_id = s.id 
                WHERE p.current_stock > 0 
                ORDER BY p.name
            `);
            
            const select = document.getElementById('productSelect');
            select.innerHTML = '<option value="">Select Product</option>';
            
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.dataset.stock = product.current_stock;
                option.dataset.price = product.selling_price;
                option.dataset.gst = product.gst_percentage;
                option.textContent = `${product.name} - ₹${product.selling_price} (Stock: ${product.current_stock})`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    setupEventListeners() {
        // Customer selection
        document.getElementById('customerSelect').addEventListener('change', (e) => {
            this.handleCustomerChange(e.target.value);
        });

        // Product selection
        document.getElementById('productSelect').addEventListener('change', (e) => {
            this.handleProductChange(e.target.value);
        });

        // Quantity controls
        document.getElementById('decreaseQty').addEventListener('click', () => {
            const qtyInput = document.getElementById('quantity');
            let qty = parseInt(qtyInput.value) || 1;
            if (qty > 1) {
                qtyInput.value = qty - 1;
                this.calculateItemTotal();
            }
        });

        document.getElementById('increaseQty').addEventListener('click', () => {
            const qtyInput = document.getElementById('quantity');
            let qty = parseInt(qtyInput.value) || 1;
            qtyInput.value = qty + 1;
            this.calculateItemTotal();
        });

        document.getElementById('quantity').addEventListener('input', () => {
            this.calculateItemTotal();
        });

        // Price and GST input
        document.getElementById('sellingPrice').addEventListener('input', () => {
            this.calculateItemTotal();
        });

        document.getElementById('productGST').addEventListener('input', () => {
            this.calculateItemTotal();
        });

        // Add product button
        document.getElementById('addProductBtn').addEventListener('click', () => {
            this.addProductToInvoice();
        });

        // Generate invoice button
        document.getElementById('generateInvoiceBtn').addEventListener('click', () => {
            this.generateInvoice();
        });

        // Clear invoice button
        document.getElementById('clearInvoice').addEventListener('click', () => {
            this.clearInvoice();
        });

        // Save invoice button
        document.getElementById('saveInvoice').addEventListener('click', () => {
            this.saveInvoice();
        });

        // Preview invoice button
        document.getElementById('previewInvoiceBtn').addEventListener('click', () => {
            this.previewInvoice();
        });

        // Print invoice button
        document.getElementById('printInvoiceBtn').addEventListener('click', () => {
            this.printInvoice();
        });
    }

    async handleCustomerChange(customerId) {
        if (!customerId) {
            document.getElementById('customerDetails').style.display = 'none';
            this.selectedCustomer = null;
            return;
        }

        try {
            const customer = await this.app.queryDatabase(
                'SELECT * FROM customers WHERE id = ?',
                [customerId]
            );

            if (customer.length > 0) {
                this.selectedCustomer = customer[0];
                const details = document.getElementById('customerDetails');
                details.style.display = 'block';
                
                document.getElementById('customerPhone').textContent = customer[0].phone || 'N/A';
                document.getElementById('customerAddress').textContent = customer[0].address || 'N/A';
                document.getElementById('customerGST').textContent = customer[0].gst_number || 'N/A';
            }
        } catch (error) {
            console.error('Error loading customer details:', error);
        }
    }

    handleProductChange(productId) {
        if (!productId) {
            document.getElementById('availableStock').value = '';
            document.getElementById('sellingPrice').value = '';
            document.getElementById('productGST').value = '';
            return;
        }

        const select = document.getElementById('productSelect');
        const selectedOption = select.options[select.selectedIndex];
        
        const stock = selectedOption.dataset.stock || 0;
        const price = selectedOption.dataset.price || 0;
        const gst = selectedOption.dataset.gst || 0;
        
        document.getElementById('availableStock').value = stock;
        document.getElementById('sellingPrice').value = price;
        document.getElementById('productGST').value = gst;
        
        this.calculateItemTotal();
    }

    calculateItemTotal() {
        const price = parseFloat(document.getElementById('sellingPrice').value) || 0;
        const gstPercent = parseFloat(document.getElementById('productGST').value) || 0;
        const quantity = parseInt(document.getElementById('quantity').value) || 1;
        
        const subtotal = price * quantity;
        const gstAmount = subtotal * (gstPercent / 100);
        const total = subtotal + gstAmount;
        
        document.getElementById('itemTotal').value = this.app.formatCurrency(total);
    }

    addProductToInvoice() {
        const productSelect = document.getElementById('productSelect');
        if (!productSelect.value) {
            this.app.showToast('Error', 'Please select a product', 'error');
            return;
        }

        const productId = productSelect.value;
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const productName = selectedOption.text.split(' - ')[0];
        const availableStock = parseFloat(selectedOption.dataset.stock) || 0;
        
        const price = parseFloat(document.getElementById('sellingPrice').value) || 0;
        const gstPercent = parseFloat(document.getElementById('productGST').value) || 0;
        const quantity = parseInt(document.getElementById('quantity').value) || 1;

        // Check stock availability
        if (quantity > availableStock) {
            this.app.showToast('Error', `Insufficient stock! Available: ${availableStock}`, 'error');
            return;
        }

        // Check if product already exists in invoice
        const existingItemIndex = this.invoiceItems.findIndex(item => item.productId == productId);
        if (existingItemIndex > -1) {
            // Update existing item
            const existingItem = this.invoiceItems[existingItemIndex];
            const newQuantity = existingItem.quantity + quantity;
            
            if (newQuantity > availableStock) {
                this.app.showToast('Error', `Insufficient stock for additional quantity!`, 'error');
                return;
            }
            
            this.invoiceItems[existingItemIndex].quantity = newQuantity;
            this.invoiceItems[existingItemIndex].recalculate();
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
            
            this.invoiceItems.push(item);
        }

        // Update table
        this.updateInvoiceItemsTable();
        
        // Clear product selection
        productSelect.value = '';
        document.getElementById('availableStock').value = '';
        document.getElementById('sellingPrice').value = '';
        document.getElementById('productGST').value = '';
        document.getElementById('quantity').value = 1;
        document.getElementById('itemTotal').value = '';
        
        this.app.showToast('Success', 'Product added to invoice', 'success');
    }

    updateInvoiceItemsTable() {
        const tbody = document.getElementById('invoiceItemsBody');
        tbody.innerHTML = '';

        this.invoiceItems.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.productName}</td>
                <td>${this.app.formatCurrency(item.price)}</td>
                <td>
                    <div class="quantity-control">
                        <button class="btn btn-sm btn-outline decrease-item" data-index="${index}">
                            <i class="material-icons">remove</i>
                        </button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline increase-item" data-index="${index}">
                            <i class="material-icons">add</i>
                        </button>
                    </div>
                </td>
                <td>${item.gstPercent}%</td>
                <td>${this.app.formatCurrency(item.gstAmount)}</td>
                <td>${this.app.formatCurrency(item.total)}</td>
                <td>
                    <button class="btn btn-sm btn-danger remove-item" data-index="${index}">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners for item controls
        document.querySelectorAll('.decrease-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.adjustItemQuantity(index, -1);
            });
        });

        document.querySelectorAll('.increase-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.adjustItemQuantity(index, 1);
            });
        });

        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('button').dataset.index);
                this.removeItemFromInvoice(index);
            });
        });

        this.updateInvoiceSummary();
    }

    adjustItemQuantity(index, change) {
        const item = this.invoiceItems[index];
        const newQuantity = item.quantity + change;
        
        if (newQuantity < 1) {
            this.removeItemFromInvoice(index);
            return;
        }

        // Check stock availability (we need to query current stock)
        this.checkStockAndUpdateQuantity(item.productId, newQuantity, index);
    }

    async checkStockAndUpdateQuantity(productId, newQuantity, itemIndex) {
        try {
            const [product] = await this.app.queryDatabase(
                'SELECT current_stock FROM products WHERE id = ?',
                [productId]
            );

            if (!product) {
                this.app.showToast('Error', 'Product not found', 'error');
                return;
            }

            if (newQuantity > product.current_stock) {
                this.app.showToast('Error', `Insufficient stock! Available: ${product.current_stock}`, 'error');
                return;
            }

            // Update quantity
            const item = this.invoiceItems[itemIndex];
            item.quantity = newQuantity;
            item.recalculate();
            
            this.updateInvoiceItemsTable();
            this.app.showToast('Success', 'Quantity updated', 'success');
        } catch (error) {
            console.error('Error checking stock:', error);
            this.app.showToast('Error', 'Failed to check stock availability', 'error');
        }
    }

    removeItemFromInvoice(index) {
        this.invoiceItems.splice(index, 1);
        this.updateInvoiceItemsTable();
        this.app.showToast('Info', 'Item removed from invoice', 'info');
    }

    updateInvoiceSummary() {
        const subtotal = this.invoiceItems.reduce((sum, item) => sum + item.subtotal, 0);
        const totalGST = this.invoiceItems.reduce((sum, item) => sum + item.gstAmount, 0);
        const grandTotal = this.invoiceItems.reduce((sum, item) => sum + item.total, 0);

        document.getElementById('invoiceSubtotal').textContent = this.app.formatCurrency(subtotal);
        document.getElementById('invoiceGST').textContent = this.app.formatCurrency(totalGST);
        document.getElementById('invoiceGrandTotal').textContent = this.app.formatCurrency(grandTotal);
    }

    validateInvoice() {
        if (!this.selectedCustomer) {
            this.app.showToast('Error', 'Please select a customer', 'error');
            return false;
        }

        if (this.invoiceItems.length === 0) {
            this.app.showToast('Error', 'Please add at least one product to the invoice', 'error');
            return false;
        }

        // Check all items have sufficient stock
        for (const item of this.invoiceItems) {
            if (item.quantity <= 0) {
                this.app.showToast('Error', `Invalid quantity for ${item.productName}`, 'error');
                return false;
            }
        }

        return true;
    }

    async generateInvoice() {
        if (!this.validateInvoice()) {
            return;
        }

        try {
            this.app.showLoading();

            // Calculate totals
            const subtotal = this.invoiceItems.reduce((sum, item) => sum + item.subtotal, 0);
            const totalGST = this.invoiceItems.reduce((sum, item) => sum + item.gstAmount, 0);
            const grandTotal = this.invoiceItems.reduce((sum, item) => sum + item.total, 0);

            // Generate invoice number using stored procedure
            const [result] = await this.app.queryDatabase('CALL generate_invoice_number(@inv_num)');
            const [invoiceNumberResult] = await this.app.queryDatabase('SELECT @inv_num as invoice_number');
            const invoiceNumber = invoiceNumberResult[0].invoice_number;

            // Create invoice
            const invoiceResult = await this.app.executeDatabase(`
                INSERT INTO invoices (
                    invoice_number, customer_id, invoice_date, due_date,
                    subtotal, total_gst, grand_total, payment_method, payment_status
                ) VALUES (?, ?, ?, DATE_ADD(?, INTERVAL 30 DAY), ?, ?, ?, ?, 'pending')
            `, [
                invoiceNumber,
                this.selectedCustomer.id,
                document.getElementById('invoiceDate').value,
                document.getElementById('invoiceDate').value,
                subtotal,
                totalGST,
                grandTotal,
                document.getElementById('paymentMethod').value
            ]);

            const invoiceId = invoiceResult.insertId;

            // Add invoice items
            for (const item of this.invoiceItems) {
                await this.app.executeDatabase(`
                    INSERT INTO invoice_items (
                        invoice_id, product_id, quantity, unit_price, gst_percentage, total
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    invoiceId,
                    item.productId,
                    item.quantity,
                    item.price,
                    item.gstPercent,
                    item.total
                ]);
            }

            this.app.showToast('Success', `Invoice ${invoiceNumber} created successfully!`, 'success');
            
            // Clear current invoice
            this.clearInvoice();
            
            // Navigate to invoices page
            this.app.navigateTo('invoices');
            
        } catch (error) {
            console.error('Error generating invoice:', error);
            this.app.showToast('Error', 'Failed to generate invoice', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    clearInvoice() {
        this.invoiceItems = [];
        this.selectedCustomer = null;
        
        document.getElementById('customerSelect').value = '';
        document.getElementById('customerDetails').style.display = 'none';
        document.getElementById('invoiceItemsBody').innerHTML = '';
        document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('paymentMethod').value = 'cash';
        
        this.updateInvoiceSummary();
    }

    async saveInvoice() {
        // Save as draft (implement if needed)
        this.app.showToast('Info', 'Draft saving not implemented yet', 'info');
    }

    async previewInvoice() {
        if (!this.validateInvoice()) {
            return;
        }

        const previewContainer = document.getElementById('invoicePreviewContainer');
        
        // Calculate totals
        const subtotal = this.invoiceItems.reduce((sum, item) => sum + item.subtotal, 0);
        const totalGST = this.invoiceItems.reduce((sum, item) => sum + item.gstAmount, 0);
        const grandTotal = this.invoiceItems.reduce((sum, item) => sum + item.total, 0);

        // Generate preview HTML
        const previewHTML = `
            <div class="invoice-preview-modal">
                <div class="invoice-template">
                    <div class="invoice-header">
                        <div class="company-info">
                            <img src="../assets/logo.png" alt="Company Logo" class="invoice-logo">
                            <div>
                                <h2>Distributor Company Name</h2>
                                <p>123 Business Street, City, State - 123456</p>
                                <p>Phone: +91 9876543210 | GST: 27ABCDE1234F1Z5</p>
                            </div>
                        </div>
                        <div class="invoice-title">
                            <h1>TAX INVOICE</h1>
                            <p>Original for Recipient</p>
                        </div>
                    </div>
                    
                    <div class="invoice-details">
                        <div class="detail-row">
                            <div class="detail-column">
                                <h3>Bill To:</h3>
                                <p><strong>${this.selectedCustomer.name}</strong></p>
                                <p>${this.selectedCustomer.address || 'N/A'}</p>
                                <p>Phone: ${this.selectedCustomer.phone || 'N/A'}</p>
                                <p>GST: ${this.selectedCustomer.gst_number || 'N/A'}</p>
                            </div>
                            <div class="detail-column">
                                <table class="detail-table">
                                    <tr>
                                        <td>Invoice No:</td>
                                        <td><strong>INV-PREVIEW</strong></td>
                                    </tr>
                                    <tr>
                                        <td>Invoice Date:</td>
                                        <td>${this.app.formatDate(new Date())}</td>
                                    </tr>
                                    <tr>
                                        <td>Payment Method:</td>
                                        <td>${document.getElementById('paymentMethod').value.toUpperCase()}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="invoice-items">
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product Description</th>
                                    <th>HSN/SAC</th>
                                    <th>Qty</th>
                                    <th>Rate (₹)</th>
                                    <th>GST %</th>
                                    <th>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.invoiceItems.map((item, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${item.productName}</td>
                                        <td>N/A</td>
                                        <td>${item.quantity}</td>
                                        <td>${item.price.toFixed(2)}</td>
                                        <td>${item.gstPercent}%</td>
                                        <td>${item.total.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="invoice-totals">
                        <div class="total-section">
                            <table class="total-table">
                                <tr>
                                    <td>Subtotal:</td>
                                    <td>${this.app.formatCurrency(subtotal)}</td>
                                </tr>
                                <tr>
                                    <td>Total GST:</td>
                                    <td>${this.app.formatCurrency(totalGST)}</td>
                                </tr>
                                <tr class="grand-total">
                                    <td><strong>Grand Total:</strong></td>
                                    <td><strong>${this.app.formatCurrency(grandTotal)}</strong></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <div class="invoice-footer">
                        <div class="terms">
                            <h4>Terms & Conditions:</h4>
                            <p>1. Goods once sold will not be taken back.</p>
                            <p>2. Interest @18% p.a. will be charged on overdue payments.</p>
                            <p>3. Subject to City Jurisdiction.</p>
                        </div>
                        <div class="signature">
                            <p>Authorized Signatory</p>
                            <div class="signature-line"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        previewContainer.innerHTML = previewHTML;
        previewContainer.style.display = 'block';

        // Show modal
        const modal = this.app.showModal('Invoice Preview', previewContainer.innerHTML, [
            { text: 'Close', class: 'btn-secondary' },
            { text: 'Print', class: 'btn-primary', id: 'printPreviewBtn' }
        ]);

        // Add print functionality
        modal.querySelector('#printPreviewBtn')?.addEventListener('click', () => {
            this.printPreview();
        });
    }

    printPreview() {
        const printWindow = window.open('', '_blank');
        const content = document.querySelector('.invoice-template').outerHTML;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice Preview</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .invoice-template { max-width: 800px; margin: 0 auto; }
                    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .company-info { display: flex; gap: 20px; }
                    .invoice-logo { width: 100px; height: 100px; }
                    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .items-table th, .items-table td { border: 1px solid #000; padding: 8px; text-align: center; }
                    .grand-total { background: #f0f0f0; }
                    @media print {
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                ${content}
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    printInvoice() {
        if (!this.validateInvoice()) {
            return;
        }
        this.printPreview();
    }
}