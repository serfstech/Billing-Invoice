export default class Products {
    constructor(app) {
        this.app = app;
    }

    async load() {
        return `
            <div class="content-header">
                <div class="header-left">
                    <h1><i class="material-icons">inventory_2</i> Products</h1>
                    <p class="content-subtitle">Manage your product inventory</p>
                </div>
                <div class="header-right">
                    <button class="btn btn-primary" id="addProductBtn">
                        <i class="material-icons">add_box</i> Add Product
                    </button>
                    <button class="btn btn-outline" id="bulkUpdateBtn">
                        <i class="material-icons">update</i> Bulk Update
                    </button>
                </div>
            </div>

            <!-- Stock Status Overview -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--blue-400), var(--blue-600));">
                        <i class="material-icons">category</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="totalProducts">0</div>
                        <div class="stat-label">Total Products</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--green-400), var(--green-600));">
                        <i class="material-icons">check_circle</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="inStockProducts">0</div>
                        <div class="stat-label">In Stock</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--orange-400), var(--orange-600));">
                        <i class="material-icons">warning</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="lowStockProducts">0</div>
                        <div class="stat-label">Low Stock</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, var(--red-400), var(--red-600));">
                        <i class="material-icons">error</i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="outOfStockProducts">0</div>
                        <div class="stat-label">Out of Stock</div>
                    </div>
                </div>
            </div>

            <!-- Search and Filters -->
            <div class="card">
                <div class="card-body">
                    <div class="search-filter-container">
                        <div class="search-box">
                            <i class="material-icons">search</i>
                            <input type="text" id="productSearch" placeholder="Search products by name, SKU, or category..." class="form-control">
                        </div>
                        <div class="filter-options">
                            <select class="form-control" id="filterCategory">
                                <option value="">All Categories</option>
                                <!-- Categories will be loaded dynamically -->
                            </select>
                            <select class="form-control" id="filterStock">
                                <option value="">All Stock Status</option>
                                <option value="in_stock">In Stock</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                            </select>
                            <select class="form-control" id="filterSupplier">
                                <option value="">All Suppliers</option>
                                <!-- Suppliers will be loaded dynamically -->
                            </select>
                            <button class="btn btn-outline" id="exportProducts">
                                <i class="material-icons">download</i> Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Products Table -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Product Inventory</h2>
                    <div class="card-actions">
                        <div class="table-summary">
                            Showing <span id="showingCount">0</span> of <span id="totalCount">0</span> products
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table" id="productsTable">
                            <thead>
                                <tr>
                                    <th>SKU</th>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th>Supplier</th>
                                    <th>Purchase Price</th>
                                    <th>Selling Price</th>
                                    <th>GST %</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="productsTableBody">
                                <tr>
                                    <td colspan="10" class="text-center">
                                        <div class="loading-content">
                                            <i class="material-icons spin">refresh</i>
                                            <p>Loading products...</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="pagination-container" id="productsPagination">
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
        await this.loadProductStats();
        await this.loadCategories();
        await this.loadSuppliers();
        await this.loadProducts();
        this.setupEventListeners();
        this.setupSearch();
    }

    async loadProductStats() {
        try {
            const [total, inStock, lowStock, outOfStock] = await Promise.all([
                this.app.queryDatabase('SELECT COUNT(*) as count FROM products'),
                this.app.queryDatabase(`
                    SELECT COUNT(*) as count 
                    FROM products 
                    WHERE current_stock > minimum_stock
                `),
                this.app.queryDatabase(`
                    SELECT COUNT(*) as count 
                    FROM products 
                    WHERE current_stock <= minimum_stock AND current_stock > 0
                `),
                this.app.queryDatabase(`
                    SELECT COUNT(*) as count 
                    FROM products 
                    WHERE current_stock <= 0
                `)
            ]);

            document.getElementById('totalProducts').textContent = total[0].count;
            document.getElementById('inStockProducts').textContent = inStock[0].count;
            document.getElementById('lowStockProducts').textContent = lowStock[0].count;
            document.getElementById('outOfStockProducts').textContent = outOfStock[0].count;

        } catch (error) {
            console.error('Error loading product stats:', error);
        }
    }

    async loadCategories() {
        try {
            const categories = await this.app.queryDatabase(`
                SELECT DISTINCT category 
                FROM products 
                WHERE category IS NOT NULL AND category != ''
                ORDER BY category
            `);

            const select = document.getElementById('filterCategory');
            if (select) {
                select.innerHTML = '<option value="">All Categories</option>';
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.category;
                    option.textContent = cat.category;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadSuppliers() {
        try {
            const suppliers = await this.app.queryDatabase(`
                SELECT s.id, s.name 
                FROM suppliers s
                JOIN products p ON s.id = p.supplier_id
                GROUP BY s.id, s.name
                ORDER BY s.name
            `);

            const select = document.getElementById('filterSupplier');
            if (select) {
                select.innerHTML = '<option value="">All Suppliers</option>';
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

    async loadProducts(page = 1, search = '', filters = {}) {
        try {
            this.app.showLoading();
            
            const limit = 15;
            const offset = (page - 1) * limit;

            let query = `
                SELECT p.*, s.name as supplier_name,
                    CASE 
                        WHEN p.current_stock <= 0 THEN 'OUT_OF_STOCK'
                        WHEN p.current_stock <= p.minimum_stock THEN 'LOW_STOCK'
                        ELSE 'IN_STOCK'
                    END as stock_status
                FROM products p
                LEFT JOIN suppliers s ON p.supplier_id = s.id
            `;

            const params = [];
            const conditions = [];
            
            // Search condition
            if (search) {
                conditions.push(`(p.name LIKE ? OR p.sku LIKE ? OR p.category LIKE ?)`);
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
            
            // Filter conditions
            if (filters.category) {
                conditions.push(`p.category = ?`);
                params.push(filters.category);
            }
            
            if (filters.supplier) {
                conditions.push(`p.supplier_id = ?`);
                params.push(filters.supplier);
            }
            
            if (filters.stock) {
                switch(filters.stock) {
                    case 'in_stock':
                        conditions.push(`p.current_stock > p.minimum_stock`);
                        break;
                    case 'low_stock':
                        conditions.push(`p.current_stock <= p.minimum_stock AND p.current_stock > 0`);
                        break;
                    case 'out_of_stock':
                        conditions.push(`p.current_stock <= 0`);
                        break;
                }
            }
            
            // Add WHERE clause if conditions exist
            if (conditions.length > 0) {
                query += ` WHERE ` + conditions.join(' AND ');
            }
            
            query += ` ORDER BY p.name LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const products = await this.app.queryDatabase(query, params);
            
            // Get total count
            let countQuery = `SELECT COUNT(*) as total FROM products p`;
            if (conditions.length > 0) {
                countQuery += ` WHERE ` + conditions.join(' AND ');
            }
            
            const countResult = await this.app.queryDatabase(countQuery, params.slice(0, -2));
            const total = countResult[0].total;
            const totalPages = Math.ceil(total / limit);

            this.updateProductsTable(products);
            this.updatePagination(page, totalPages, total);

        } catch (error) {
            console.error('Error loading products:', error);
            this.app.showToast('Error', 'Failed to load products', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    updateProductsTable(products) {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        <div class="empty-state">
                            <i class="material-icons">inventory_2</i>
                            <h3>No Products Found</h3>
                            <p>Add your first product to get started</p>
                            <button class="btn btn-primary" id="addFirstProduct">
                                <i class="material-icons">add_box</i> Add Product
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            
            document.getElementById('addFirstProduct')?.addEventListener('click', () => {
                this.showAddProductModal();
            });
            
            return;
        }

        let tableHTML = '';
        
        products.forEach(product => {
            const stockStatus = {
                'IN_STOCK': { class: 'badge-success', label: 'In Stock' },
                'LOW_STOCK': { class: 'badge-warning', label: 'Low Stock' },
                'OUT_OF_STOCK': { class: 'badge-danger', label: 'Out of Stock' }
            }[product.stock_status] || { class: 'badge-secondary', label: 'Unknown' };
            
            const stockPercentage = product.minimum_stock > 0 
                ? Math.round((product.current_stock / product.minimum_stock) * 100)
                : 100;
            
            tableHTML += `
                <tr data-id="${product.id}" class="${product.stock_status === 'LOW_STOCK' ? 'table-warning' : product.stock_status === 'OUT_OF_STOCK' ? 'table-danger' : ''}">
                    <td>${product.sku || 'N/A'}</td>
                    <td>
                        <div class="product-name">
                            <strong>${product.name}</strong>
                            ${product.description ? `<small class="text-muted">${product.description}</small>` : ''}
                        </div>
                    </td>
                    <td>${product.category || 'Uncategorized'}</td>
                    <td>${product.supplier_name || 'N/A'}</td>
                    <td>${this.app.formatCurrency(product.purchase_price)}</td>
                    <td>${this.app.formatCurrency(product.selling_price)}</td>
                    <td>${product.gst_percentage}%</td>
                    <td>
                        <div class="stock-info">
                            <div class="stock-bar">
                                <div class="stock-fill" style="width: ${Math.min(stockPercentage, 100)}%; 
                                     background: ${stockPercentage <= 20 ? 'var(--danger-color)' : stockPercentage <= 50 ? 'var(--warning-color)' : 'var(--success-color)'}">
                                </div>
                            </div>
                            <div class="stock-numbers">
                                <span>${product.current_stock} ${product.unit || ''}</span>
                                <small class="text-muted">/ min ${product.minimum_stock}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge ${stockStatus.class}">
                            ${stockStatus.label}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-text view-product" data-id="${product.id}" title="View">
                                <i class="material-icons">visibility</i>
                            </button>
                            <button class="btn btn-sm btn-text edit-product" data-id="${product.id}" title="Edit">
                                <i class="material-icons">edit</i>
                            </button>
                            <button class="btn btn-sm btn-text adjust-stock" data-id="${product.id}" title="Adjust Stock">
                                <i class="material-icons">sync_alt</i>
                            </button>
                            <button class="btn btn-sm btn-text delete-product" data-id="${product.id}" title="Delete">
                                <i class="material-icons">delete</i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = tableHTML;
        this.attachProductEventListeners();
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
                const search = document.getElementById('productSearch')?.value || '';
                const category = document.getElementById('filterCategory')?.value || '';
                const stock = document.getElementById('filterStock')?.value || '';
                const supplier = document.getElementById('filterSupplier')?.value || '';
                this.loadProducts(currentPage - 1, search, { category, stock, supplier });
            };
        }

        if (nextButton) {
            nextButton.disabled = currentPage === totalPages;
            nextButton.onclick = () => {
                const search = document.getElementById('productSearch')?.value || '';
                const category = document.getElementById('filterCategory')?.value || '';
                const stock = document.getElementById('filterStock')?.value || '';
                const supplier = document.getElementById('filterSupplier')?.value || '';
                this.loadProducts(currentPage + 1, search, { category, stock, supplier });
            };
        }
    }

    attachProductEventListeners() {
        // View product
        document.querySelectorAll('.view-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.id;
                this.viewProduct(productId);
            });
        });

        // Edit product
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.id;
                this.editProduct(productId);
            });
        });

        // Adjust stock
        document.querySelectorAll('.adjust-stock').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.id;
                this.showAdjustStockModal(productId);
            });
        });

        // Delete product
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.id;
                this.deleteProduct(productId);
            });
        });
    }

    setupEventListeners() {
        // Add product button
        document.getElementById('addProductBtn')?.addEventListener('click', () => {
            this.showAddProductModal();
        });

        // Bulk update button
        document.getElementById('bulkUpdateBtn')?.addEventListener('click', () => {
            this.showBulkUpdateModal();
        });

        // Export button
        document.getElementById('exportProducts')?.addEventListener('click', () => {
            this.exportProducts();
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('productSearch');
        const categoryFilter = document.getElementById('filterCategory');
        const stockFilter = document.getElementById('filterStock');
        const supplierFilter = document.getElementById('filterSupplier');

        const loadWithFilters = this.app.debounce(() => {
            const search = searchInput?.value || '';
            const category = categoryFilter?.value || '';
            const stock = stockFilter?.value || '';
            const supplier = supplierFilter?.value || '';
            this.loadProducts(1, search, { category, stock, supplier });
        }, 300);

        if (searchInput) {
            searchInput.addEventListener('input', loadWithFilters);
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', loadWithFilters);
        }

        if (stockFilter) {
            stockFilter.addEventListener('change', loadWithFilters);
        }

        if (supplierFilter) {
            supplierFilter.addEventListener('change', loadWithFilters);
        }
    }

    showAddProductModal() {
        this.loadSuppliersForModal().then(suppliersHTML => {
            const modalContent = `
                <form id="addProductForm" class="modal-form">
                    <div class="form-grid">
                        <div class="form-row">
                            <label class="form-label">Product Name *</label>
                            <input type="text" class="form-control" name="name" required autocomplete="off">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">SKU (Optional)</label>
                            <input type="text" class="form-control" name="sku" autocomplete="off">
                            <small class="form-text">Unique product identifier</small>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Category</label>
                            <input type="text" class="form-control" name="category" autocomplete="off" list="categoryList">
                            <datalist id="categoryList">
                                <!-- Existing categories will be added here -->
                            </datalist>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Supplier</label>
                            <select class="form-control" name="supplier_id">
                                <option value="">Select Supplier</option>
                                ${suppliersHTML}
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Unit</label>
                            <select class="form-control" name="unit">
                                <option value="">Select Unit</option>
                                <option value="pcs">Pieces</option>
                                <option value="kg">Kilogram</option>
                                <option value="g">Gram</option>
                                <option value="l">Liter</option>
                                <option value="ml">Milliliter</option>
                                <option value="m">Meter</option>
                                <option value="cm">Centimeter</option>
                                <option value="box">Box</option>
                                <option value="pack">Pack</option>
                                <option value="bottle">Bottle</option>
                                <option value="carton">Carton</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Purchase Price *</label>
                            <input type="number" class="form-control" name="purchase_price" step="0.01" min="0" required autocomplete="off">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Selling Price *</label>
                            <input type="number" class="form-control" name="selling_price" step="0.01" min="0" required autocomplete="off">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">GST %</label>
                            <input type="number" class="form-control" name="gst_percentage" step="0.01" min="0" max="28" value="18" autocomplete="off">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Initial Stock</label>
                            <input type="number" class="form-control" name="current_stock" step="0.01" min="0" value="0" autocomplete="off">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Minimum Stock Level</label>
                            <input type="number" class="form-control" name="minimum_stock" step="0.01" min="0" value="10" autocomplete="off">
                            <small class="form-text">Alert when stock falls below this level</small>
                        </div>
                        
                        <div class="form-row full-width">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" name="description" rows="2" autocomplete="off"></textarea>
                        </div>
                    </div>
                </form>
            `;

            const modal = this.app.showModal('Add New Product', modalContent, [
                { text: 'Cancel', class: 'btn-secondary' },
                { text: 'Save Product', class: 'btn-primary', id: 'saveProductBtn' }
            ]);

            // Load existing categories
            this.loadCategoriesForDatalist(modal.querySelector('#categoryList'));

            const form = modal.querySelector('#addProductForm');
            const saveBtn = modal.querySelector('#saveProductBtn');

            saveBtn.addEventListener('click', async () => {
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                // Validate prices
                if (parseFloat(data.selling_price) < parseFloat(data.purchase_price)) {
                    this.app.showToast('Warning', 'Selling price is less than purchase price', 'warning');
                    // Continue anyway, just warn
                }

                await this.saveProduct(data);
            });
        });
    }

    async loadSuppliersForModal() {
        try {
            const suppliers = await this.app.queryDatabase(`
                SELECT id, name FROM suppliers ORDER BY name
            `);

            let options = '';
            suppliers.forEach(supplier => {
                options += `<option value="${supplier.id}">${supplier.name}</option>`;
            });

            return options;
        } catch (error) {
            console.error('Error loading suppliers:', error);
            return '';
        }
    }

    async loadCategoriesForDatalist(datalist) {
        try {
            const categories = await this.app.queryDatabase(`
                SELECT DISTINCT category 
                FROM products 
                WHERE category IS NOT NULL AND category != ''
                ORDER BY category
            `);

            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.category;
                datalist.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async saveProduct(data) {
        try {
            this.app.showLoading();

            // Generate SKU if not provided
            if (!data.sku) {
                const prefix = data.category ? data.category.substring(0, 3).toUpperCase() : 'PRO';
                const random = Math.floor(1000 + Math.random() * 9000);
                data.sku = `${prefix}${random}`;
            }

            const result = await this.app.executeDatabase(`
                INSERT INTO products (
                    sku, name, description, category, unit,
                    purchase_price, selling_price, gst_percentage,
                    current_stock, minimum_stock, supplier_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                data.sku,
                data.name,
                data.description || null,
                data.category || null,
                data.unit || null,
                parseFloat(data.purchase_price),
                parseFloat(data.selling_price),
                parseFloat(data.gst_percentage) || 0,
                parseFloat(data.current_stock) || 0,
                parseFloat(data.minimum_stock) || 10,
                data.supplier_id || null
            ]);

            this.app.showToast('Success', 'Product added successfully!', 'success');
            
            // Reload stats, categories, and products
            await this.loadProductStats();
            await this.loadCategories();
            await this.loadProducts();
            
            // Close modal
            document.querySelector('.modal-overlay')?.remove();

        } catch (error) {
            console.error('Error saving product:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                this.app.showToast('Error', 'SKU already exists. Please use a different SKU.', 'error');
            } else {
                this.app.showToast('Error', 'Failed to save product', 'error');
            }
        } finally {
            this.app.hideLoading();
        }
    }

    async viewProduct(productId) {
        try {
            this.app.showLoading();

            const [product] = await this.app.queryDatabase(`
                SELECT p.*, s.name as supplier_name,
                    (SELECT SUM(quantity) FROM purchase_items WHERE product_id = p.id) as total_purchased,
                    (SELECT SUM(quantity) FROM invoice_items WHERE product_id = p.id) as total_sold,
                    (SELECT MAX(purchase_date) FROM purchases WHERE id IN (
                        SELECT purchase_id FROM purchase_items WHERE product_id = p.id
                    )) as last_purchased,
                    (SELECT MAX(invoice_date) FROM invoices WHERE id IN (
                        SELECT invoice_id FROM invoice_items WHERE product_id = p.id
                    )) as last_sold
                FROM products p
                LEFT JOIN suppliers s ON p.supplier_id = s.id
                WHERE p.id = ?
            `, [productId]);

            if (!product) {
                this.app.showToast('Error', 'Product not found', 'error');
                return;
            }

            const stockStatus = product.current_stock <= 0 ? 'OUT_OF_STOCK' : 
                              product.current_stock <= product.minimum_stock ? 'LOW_STOCK' : 'IN_STOCK';
            
            const statusInfo = {
                'IN_STOCK': { class: 'badge-success', label: 'In Stock' },
                'LOW_STOCK': { class: 'badge-warning', label: 'Low Stock' },
                'OUT_OF_STOCK': { class: 'badge-danger', label: 'Out of Stock' }
            }[stockStatus];

            const modalContent = `
                <div class="product-details">
                    <div class="details-header">
                        <h3>${product.name}</h3>
                        <div class="product-stats">
                            <div class="stat-item">
                                <i class="material-icons">inventory_2</i>
                                <span>${product.current_stock} ${product.unit || ''}</span>
                            </div>
                            <div class="stat-item">
                                <i class="material-icons">trending_up</i>
                                <span>${product.total_purchased || 0} Purchased</span>
                            </div>
                            <div class="stat-item">
                                <i class="material-icons">trending_down</i>
                                <span>${product.total_sold || 0} Sold</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-section">
                            <h4><i class="material-icons">info</i> Basic Information</h4>
                            <div class="detail-item">
                                <strong>SKU:</strong> ${product.sku || 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>Category:</strong> ${product.category || 'Uncategorized'}
                            </div>
                            <div class="detail-item">
                                <strong>Unit:</strong> ${product.unit || 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>Supplier:</strong> ${product.supplier_name || 'N/A'}
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4><i class="material-icons">attach_money</i> Pricing</h4>
                            <div class="detail-item">
                                <strong>Purchase Price:</strong> ${this.app.formatCurrency(product.purchase_price)}
                            </div>
                            <div class="detail-item">
                                <strong>Selling Price:</strong> ${this.app.formatCurrency(product.selling_price)}
                            </div>
                            <div class="detail-item">
                                <strong>Profit Margin:</strong> 
                                ${((product.selling_price - product.purchase_price) / product.purchase_price * 100).toFixed(2)}%
                            </div>
                            <div class="detail-item">
                                <strong>GST:</strong> ${product.gst_percentage}%
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section full-width">
                        <h4><i class="material-icons">storage</i> Stock Information</h4>
                        <div class="stock-details">
                            <div class="stock-meter">
                                <div class="meter-label">
                                    <span>Current: ${product.current_stock}</span>
                                    <span>Minimum: ${product.minimum_stock}</span>
                                </div>
                                <div class="meter-bar">
                                    <div class="meter-fill" style="width: ${Math.min((product.current_stock / product.minimum_stock) * 100, 100)}%"></div>
                                </div>
                                <div class="meter-status">
                                    <span class="badge ${statusInfo.class}">${statusInfo.label}</span>
                                </div>
                            </div>
                            
                            <div class="stock-history">
                                <div class="history-item">
                                    <i class="material-icons">arrow_upward</i>
                                    <div>
                                        <strong>Last Purchased:</strong>
                                        <p>${product.last_purchased ? this.app.formatDate(product.last_purchased) : 'Never'}</p>
                                    </div>
                                </div>
                                <div class="history-item">
                                    <i class="material-icons">arrow_downward</i>
                                    <div>
                                        <strong>Last Sold:</strong>
                                        <p>${product.last_sold ? this.app.formatDate(product.last_sold) : 'Never'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${product.description ? `
                        <div class="detail-section full-width">
                            <h4><i class="material-icons">description</i> Description</h4>
                            <div class="description-content">
                                ${product.description}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="detail-section full-width">
                        <h4><i class="material-icons">history</i> Recent Stock Movements</h4>
                        <div id="stockMovements">
                            Loading stock movements...
                        </div>
                    </div>
                </div>
            `;

            const modal = this.app.showModal('Product Details', modalContent, [
                { text: 'Close', class: 'btn-secondary' },
                { text: 'Edit', class: 'btn-primary', id: 'editProductBtn' },
                { text: 'Adjust Stock', class: 'btn-warning', id: 'adjustStockBtn' }
            ]);

            // Load stock movements
            this.loadStockMovements(productId, modal.querySelector('#stockMovements'));

            // Edit button
            modal.querySelector('#editProductBtn')?.addEventListener('click', () => {
                modal.remove();
                this.editProduct(productId);
            });

            // Adjust stock button
            modal.querySelector('#adjustStockBtn')?.addEventListener('click', () => {
                modal.remove();
                this.showAdjustStockModal(productId);
            });

        } catch (error) {
            console.error('Error viewing product:', error);
            this.app.showToast('Error', 'Failed to load product details', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async loadStockMovements(productId, container) {
        try {
            const movements = await this.app.queryDatabase(`
                SELECT sl.*,
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
                WHERE sl.product_id = ?
                ORDER BY sl.created_at DESC
                LIMIT 10
            `, [productId]);

            if (movements.length === 0) {
                container.innerHTML = '<p class="text-muted">No stock movements found</p>';
                return;
            }

            let html = `
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Change</th>
                                <th>Previous</th>
                                <th>New</th>
                                <th>Reference</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            movements.forEach(movement => {
                const changeClass = movement.quantity_change > 0 ? 'text-success' : 'text-danger';
                const changeSymbol = movement.quantity_change > 0 ? '+' : '';
                
                html += `
                    <tr>
                        <td>${this.app.formatDate(movement.created_at)}</td>
                        <td>
                            <span class="badge" style="background: ${movement.type_color}">
                                ${movement.type_label}
                            </span>
                        </td>
                        <td class="${changeClass}">
                            ${changeSymbol}${movement.quantity_change}
                        </td>
                        <td>${movement.previous_stock}</td>
                        <td>${movement.new_stock}</td>
                        <td>${movement.reference_id ? `#${movement.reference_id}` : 'Manual'}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;

            container.innerHTML = html;

        } catch (error) {
            console.error('Error loading stock movements:', error);
            container.innerHTML = '<p class="text-danger">Failed to load stock movements</p>';
        }
    }

    async editProduct(productId) {
        try {
            this.app.showLoading();

            const [product] = await this.app.queryDatabase(
                'SELECT * FROM products WHERE id = ?',
                [productId]
            );

            if (!product) {
                this.app.showToast('Error', 'Product not found', 'error');
                return;
            }

            const suppliersHTML = await this.loadSuppliersForModal();

            const modalContent = `
                <form id="editProductForm" class="modal-form">
                    <div class="form-grid">
                        <div class="form-row">
                            <label class="form-label">Product Name *</label>
                            <input type="text" class="form-control" name="name" value="${product.name}" required autocomplete="off">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">SKU</label>
                            <input type="text" class="form-control" name="sku" value="${product.sku || ''}" autocomplete="off">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Category</label>
                            <input type="text" class="form-control" name="category" value="${product.category || ''}" autocomplete="off" list="editCategoryList">
                            <datalist id="editCategoryList">
                                <!-- Existing categories will be added here -->
                            </datalist>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Supplier</label>
                            <select class="form-control" name="supplier_id">
                                <option value="">Select Supplier</option>
                                ${suppliersHTML}
                            </select>
                            <script>
                                // Set current supplier
                                document.currentScript.parentElement.querySelector('select[name="supplier_id"]').value = ${product.supplier_id || '""'};
                            </script>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Unit</label>
                            <select class="form-control" name="unit">
                                <option value="">Select Unit</option>
                                <option value="pcs" ${product.unit === 'pcs' ? 'selected' : ''}>Pieces</option>
                                <option value="kg" ${product.unit === 'kg' ? 'selected' : ''}>Kilogram</option>
                                <option value="g" ${product.unit === 'g' ? 'selected' : ''}>Gram</option>
                                <option value="l" ${product.unit === 'l' ? 'selected' : ''}>Liter</option>
                                <option value="ml" ${product.unit === 'ml' ? 'selected' : ''}>Milliliter</option>
                                <option value="m" ${product.unit === 'm' ? 'selected' : ''}>Meter</option>
                                <option value="cm" ${product.unit === 'cm' ? 'selected' : ''}>Centimeter</option>
                                <option value="box" ${product.unit === 'box' ? 'selected' : ''}>Box</option>
                                <option value="pack" ${product.unit === 'pack' ? 'selected' : ''}>Pack</option>
                                <option value="bottle" ${product.unit === 'bottle' ? 'selected' : ''}>Bottle</option>
                                <option value="carton" ${product.unit === 'carton' ? 'selected' : ''}>Carton</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Purchase Price *</label>
                            <input type="number" class="form-control" name="purchase_price" step="0.01" min="0" 
                                   value="${product.purchase_price}" required autocomplete="off">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Selling Price *</label>
                            <input type="number" class="form-control" name="selling_price" step="0.01" min="0" 
                                   value="${product.selling_price}" required autocomplete="off">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">GST %</label>
                            <input type="number" class="form-control" name="gst_percentage" step="0.01" min="0" max="28" 
                                   value="${product.gst_percentage}" autocomplete="off">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Current Stock</label>
                            <input type="number" class="form-control" name="current_stock" step="0.01" min="0" 
                                   value="${product.current_stock}" readonly>
                            <small class="form-text">Use "Adjust Stock" to change stock level</small>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Minimum Stock Level</label>
                            <input type="number" class="form-control" name="minimum_stock" step="0.01" min="0" 
                                   value="${product.minimum_stock}" autocomplete="off">
                        </div>
                        
                        <div class="form-row full-width">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" name="description" rows="2" autocomplete="off">${product.description || ''}</textarea>
                        </div>
                    </div>
                </form>
            `;

            const modal = this.app.showModal('Edit Product', modalContent, [
                { text: 'Cancel', class: 'btn-secondary' },
                { text: 'Update', class: 'btn-primary', id: 'updateProductBtn' }
            ]);

            // Load existing categories
            this.loadCategoriesForDatalist(modal.querySelector('#editCategoryList'));

            const form = modal.querySelector('#editProductForm');
            const updateBtn = modal.querySelector('#updateProductBtn');

            updateBtn.addEventListener('click', async () => {
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                // Validate prices
                if (parseFloat(data.selling_price) < parseFloat(data.purchase_price)) {
                    this.app.showToast('Warning', 'Selling price is less than purchase price', 'warning');
                    // Continue anyway, just warn
                }

                await this.updateProduct(productId, data);
            });

        } catch (error) {
            console.error('Error editing product:', error);
            this.app.showToast('Error', 'Failed to load product for editing', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async updateProduct(productId, data) {
        try {
            this.app.showLoading();

            await this.app.executeDatabase(`
                UPDATE products 
                SET name = ?, sku = ?, description = ?, category = ?, unit = ?,
                    purchase_price = ?, selling_price = ?, gst_percentage = ?,
                    minimum_stock = ?, supplier_id = ?
                WHERE id = ?
            `, [
                data.name,
                data.sku || null,
                data.description || null,
                data.category || null,
                data.unit || null,
                parseFloat(data.purchase_price),
                parseFloat(data.selling_price),
                parseFloat(data.gst_percentage) || 0,
                parseFloat(data.minimum_stock) || 10,
                data.supplier_id || null,
                productId
            ]);

            this.app.showToast('Success', 'Product updated successfully!', 'success');
            
            // Reload products and stats
            await this.loadProductStats();
            await this.loadProducts();
            
            // Close modal
            document.querySelector('.modal-overlay')?.remove();

        } catch (error) {
            console.error('Error updating product:', error);
            this.app.showToast('Error', 'Failed to update product', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async showAdjustStockModal(productId) {
        try {
            const [product] = await this.app.queryDatabase(
                'SELECT name, current_stock FROM products WHERE id = ?',
                [productId]
            );

            if (!product) {
                this.app.showToast('Error', 'Product not found', 'error');
                return;
            }

            const modalContent = `
                <form id="adjustStockForm" class="modal-form">
                    <div class="form-grid">
                        <div class="form-row">
                            <label class="form-label">Product</label>
                            <input type="text" class="form-control" value="${product.name}" readonly>
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">Current Stock</label>
                            <input type="number" class="form-control" id="currentStock" value="${product.current_stock}" readonly>
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
                            <label class="form-label">Quantity</label>
                            <input type="number" class="form-control" id="adjustmentQuantity" step="0.01" min="0.01" required autocomplete="off">
                        </div>
                        
                        <div class="form-row">
                            <label class="form-label">New Stock</label>
                            <input type="number" class="form-control" id="newStock" readonly>
                        </div>
                        
                        <div class="form-row full-width">
                            <label class="form-label">Reason</label>
                            <textarea class="form-control" id="adjustmentReason" rows="2" placeholder="Reason for stock adjustment..." autocomplete="off"></textarea>
                        </div>
                    </div>
                </form>
            `;

            const modal = this.app.showModal('Adjust Stock', modalContent, [
                { text: 'Cancel', class: 'btn-secondary' },
                { text: 'Save Adjustment', class: 'btn-primary', id: 'saveAdjustmentBtn' }
            ]);

            // Setup calculation
            const setupCalculation = () => {
                const currentStock = parseFloat(document.getElementById('currentStock').value) || 0;
                const adjustmentType = document.getElementById('adjustmentType').value;
                const quantity = parseFloat(document.getElementById('adjustmentQuantity').value) || 0;
                
                let newStock = currentStock;
                
                switch(adjustmentType) {
                    case 'increase':
                        newStock = currentStock + quantity;
                        break;
                    case 'decrease':
                        newStock = currentStock - quantity;
                        break;
                    case 'set':
                        newStock = quantity;
                        break;
                }
                
                document.getElementById('newStock').value = newStock.toFixed(2);
                
                // Validate
                const saveBtn = document.getElementById('saveAdjustmentBtn');
                if (newStock < 0) {
                    saveBtn.disabled = true;
                    saveBtn.title = 'Stock cannot be negative';
                } else {
                    saveBtn.disabled = false;
                    saveBtn.title = '';
                }
            };

            document.getElementById('adjustmentType').addEventListener('change', setupCalculation);
            document.getElementById('adjustmentQuantity').addEventListener('input', setupCalculation);

            // Initial calculation
            setupCalculation();

            // Save button
            document.getElementById('saveAdjustmentBtn').addEventListener('click', async () => {
                const newStock = parseFloat(document.getElementById('newStock').value);
                const reason = document.getElementById('adjustmentReason').value || 'Manual adjustment';
                
                if (newStock < 0) {
                    this.app.showToast('Error', 'Stock cannot be negative', 'error');
                    return;
                }

                await this.adjustStock(productId, product.current_stock, newStock, reason);
            });

        } catch (error) {
            console.error('Error showing adjust stock modal:', error);
            this.app.showToast('Error', 'Failed to load stock adjustment', 'error');
        }
    }

    async adjustStock(productId, oldStock, newStock, reason) {
        try {
            this.app.showLoading();

            const quantityChange = newStock - oldStock;
            const transactionType = quantityChange > 0 ? 'adjustment' : 'adjustment';

            // Update product stock
            await this.app.executeDatabase(
                'UPDATE products SET current_stock = ? WHERE id = ?',
                [newStock, productId]
            );

            // Log stock change
            await this.app.executeDatabase(`
                INSERT INTO stock_logs (product_id, transaction_type, quantity_change, previous_stock, new_stock, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                productId,
                transactionType,
                quantityChange,
                oldStock,
                newStock,
                reason
            ]);

            this.app.showToast('Success', 'Stock adjusted successfully!', 'success');
            
            // Reload products and stats
            await this.loadProductStats();
            await this.loadProducts();
            
            // Close modal
            document.querySelector('.modal-overlay')?.remove();

        } catch (error) {
            console.error('Error adjusting stock:', error);
            this.app.showToast('Error', 'Failed to adjust stock', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async deleteProduct(productId) {
        const confirm = await this.app.showConfirmation(
            'Delete Product',
            'Are you sure you want to delete this product? This action cannot be undone.',
            'Delete',
            'Cancel'
        );

        if (!confirm) return;

        try {
            this.app.showLoading();

            // Check if product has transactions
            const [purchases, sales] = await Promise.all([
                this.app.queryDatabase('SELECT COUNT(*) as count FROM purchase_items WHERE product_id = ?', [productId]),
                this.app.queryDatabase('SELECT COUNT(*) as count FROM invoice_items WHERE product_id = ?', [productId])
            ]);

            if (purchases[0].count > 0 || sales[0].count > 0) {
                this.app.showToast('Error', 'Cannot delete product with purchase or sales history', 'error');
                return;
            }

            await this.app.executeDatabase(
                'DELETE FROM products WHERE id = ?',
                [productId]
            );

            this.app.showToast('Success', 'Product deleted successfully!', 'success');
            
            // Reload products and stats
            await this.loadProductStats();
            await this.loadProducts();

        } catch (error) {
            console.error('Error deleting product:', error);
            this.app.showToast('Error', 'Failed to delete product', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async showBulkUpdateModal() {
        const modalContent = `
            <div class="bulk-update-modal">
                <h4>Bulk Update Products</h4>
                <p>Update multiple products at once. Select products and choose what to update.</p>
                
                <div class="form-grid">
                    <div class="form-row">
                        <label class="form-label">Update Field</label>
                        <select class="form-control" id="bulkUpdateField">
                            <option value="">Select Field to Update</option>
                            <option value="category">Category</option>
                            <option value="selling_price">Selling Price</option>
                            <option value="purchase_price">Purchase Price</option>
                            <option value="gst_percentage">GST Percentage</option>
                            <option value="minimum_stock">Minimum Stock</option>
                            <option value="supplier_id">Supplier</option>
                        </select>
                    </div>
                    
                    <div class="form-row" id="bulkUpdateValueContainer" style="display: none;">
                        <label class="form-label" id="bulkUpdateValueLabel">New Value</label>
                        <div id="bulkUpdateValueInput">
                            <!-- Dynamic input based on field selection -->
                        </div>
                    </div>
                    
                    <div class="form-row full-width">
                        <label class="form-label">Select Products</label>
                        <div class="product-selection" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px;">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="selectAllProducts">
                                <label class="form-check-label" for="selectAllProducts">Select All Products</label>
                            </div>
                            <div id="productCheckboxes">
                                <!-- Product checkboxes will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = this.app.showModal('Bulk Update Products', modalContent, [
            { text: 'Cancel', class: 'btn-secondary' },
            { text: 'Update Selected', class: 'btn-primary', id: 'bulkUpdateBtn', disabled: true }
        ]);

        // Load products for selection
        await this.loadProductsForBulkUpdate(modal.querySelector('#productCheckboxes'));

        // Setup field change handler
        modal.querySelector('#bulkUpdateField').addEventListener('change', (e) => {
            this.handleBulkFieldChange(e.target.value, modal);
        });

        // Select all checkbox
        modal.querySelector('#selectAllProducts').addEventListener('change', (e) => {
            const checkboxes = modal.querySelectorAll('.product-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            this.updateBulkUpdateButton(modal);
        });

        // Update button state based on selections
        modal.querySelectorAll('.product-checkbox').forEach(cb => {
            cb.addEventListener('change', () => {
                this.updateBulkUpdateButton(modal);
            });
        });

        // Bulk update button
        modal.querySelector('#bulkUpdateBtn').addEventListener('click', () => {
            this.processBulkUpdate(modal);
        });
    }

    async loadProductsForBulkUpdate(container) {
        try {
            const products = await this.app.queryDatabase(`
                SELECT id, name, sku FROM products ORDER BY name
            `);

            let html = '';
            products.forEach(product => {
                html += `
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input product-checkbox" id="product_${product.id}" value="${product.id}">
                        <label class="form-check-label" for="product_${product.id}">
                            ${product.name} ${product.sku ? `(${product.sku})` : ''}
                        </label>
                    </div>
                `;
            });

            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading products for bulk update:', error);
            container.innerHTML = '<p class="text-danger">Failed to load products</p>';
        }
    }

    handleBulkFieldChange(field, modal) {
        const container = modal.querySelector('#bulkUpdateValueContainer');
        const label = modal.querySelector('#bulkUpdateValueLabel');
        const inputContainer = modal.querySelector('#bulkUpdateValueInput');

        if (!field) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        
        let inputHTML = '';
        
        switch(field) {
            case 'category':
                label.textContent = 'New Category';
                inputHTML = `<input type="text" class="form-control" id="bulkUpdateValue" placeholder="Enter new category">`;
                break;
                
            case 'selling_price':
            case 'purchase_price':
                label.textContent = `New ${field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
                inputHTML = `<input type="number" class="form-control" id="bulkUpdateValue" step="0.01" min="0" placeholder="Enter new price">`;
                break;
                
            case 'gst_percentage':
                label.textContent = 'New GST Percentage';
                inputHTML = `<input type="number" class="form-control" id="bulkUpdateValue" step="0.01" min="0" max="28" placeholder="Enter GST percentage">`;
                break;
                
            case 'minimum_stock':
                label.textContent = 'New Minimum Stock';
                inputHTML = `<input type="number" class="form-control" id="bulkUpdateValue" step="0.01" min="0" placeholder="Enter minimum stock">`;
                break;
                
            case 'supplier_id':
                label.textContent = 'New Supplier';
                this.loadSuppliersForBulkUpdate(modal, inputContainer);
                return;
        }

        inputContainer.innerHTML = inputHTML;
    }

    async loadSuppliersForBulkUpdate(modal, container) {
        try {
            const suppliers = await this.app.queryDatabase(`
                SELECT id, name FROM suppliers ORDER BY name
            `);

            let options = '<option value="">Select Supplier</option>';
            suppliers.forEach(supplier => {
                options += `<option value="${supplier.id}">${supplier.name}</option>`;
            });

            container.innerHTML = `<select class="form-control" id="bulkUpdateValue">${options}</select>`;
        } catch (error) {
            console.error('Error loading suppliers:', error);
            container.innerHTML = '<p class="text-danger">Failed to load suppliers</p>';
        }
    }

    updateBulkUpdateButton(modal) {
        const field = modal.querySelector('#bulkUpdateField').value;
        const checkboxes = modal.querySelectorAll('.product-checkbox:checked');
        const updateBtn = modal.querySelector('#bulkUpdateBtn');

        updateBtn.disabled = !field || checkboxes.length === 0;
    }

    async processBulkUpdate(modal) {
        try {
            const field = modal.querySelector('#bulkUpdateField').value;
            const valueInput = modal.querySelector('#bulkUpdateValue');
            const value = valueInput ? valueInput.value : '';
            const checkboxes = modal.querySelectorAll('.product-checkbox:checked');

            if (!field || !value || checkboxes.length === 0) {
                this.app.showToast('Error', 'Please fill all required fields', 'error');
                return;
            }

            // Validate value based on field
            if ((field === 'selling_price' || field === 'purchase_price') && parseFloat(value) < 0) {
                this.app.showToast('Error', 'Price cannot be negative', 'error');
                return;
            }

            if (field === 'gst_percentage' && (parseFloat(value) < 0 || parseFloat(value) > 28)) {
                this.app.showToast('Error', 'GST must be between 0 and 28%', 'error');
                return;
            }

            if (field === 'minimum_stock' && parseFloat(value) < 0) {
                this.app.showToast('Error', 'Minimum stock cannot be negative', 'error');
                return;
            }

            this.app.showLoading();

            const productIds = Array.from(checkboxes).map(cb => cb.value);
            
            // Prepare query based on field
            let query = `UPDATE products SET ${field} = ? WHERE id IN (${productIds.map(() => '?').join(',')})`;
            let params = [value, ...productIds];

            // Convert value to appropriate type
            if (field.includes('price') || field === 'gst_percentage' || field === 'minimum_stock') {
                params[0] = parseFloat(value);
            }

            await this.app.executeDatabase(query, params);

            this.app.showToast('Success', `Updated ${productIds.length} products`, 'success');
            
            // Reload products
            await this.loadProducts();
            
            // Close modal
            modal.remove();

        } catch (error) {
            console.error('Error in bulk update:', error);
            this.app.showToast('Error', 'Failed to update products', 'error');
        } finally {
            this.app.hideLoading();
        }
    }

    async exportProducts() {
        try {
            this.app.showLoading();

            const products = await this.app.queryDatabase(`
                SELECT p.sku, p.name, p.description, p.category, p.unit,
                       p.purchase_price, p.selling_price, p.gst_percentage,
                       p.current_stock, p.minimum_stock,
                       s.name as supplier_name,
                       CASE 
                           WHEN p.current_stock <= 0 THEN 'OUT_OF_STOCK'
                           WHEN p.current_stock <= p.minimum_stock THEN 'LOW_STOCK'
                           ELSE 'IN_STOCK'
                       END as stock_status
                FROM products p
                LEFT JOIN suppliers s ON p.supplier_id = s.id
                ORDER BY p.name
            `);

            if (products.length === 0) {
                this.app.showToast('Info', 'No products to export', 'info');
                return;
            }

            // Create CSV content
            const headers = ['SKU', 'Name', 'Description', 'Category', 'Unit', 'Purchase Price', 'Selling Price', 
                           'GST %', 'Current Stock', 'Minimum Stock', 'Supplier', 'Stock Status'];
            const csvRows = [headers.join(',')];

            products.forEach(product => {
                const row = [
                    `"${product.sku || ''}"`,
                    `"${product.name}"`,
                    `"${(product.description || '').replace(/"/g, '""')}"`,
                    `"${product.category || ''}"`,
                    `"${product.unit || ''}"`,
                    product.purchase_price,
                    product.selling_price,
                    product.gst_percentage,
                    product.current_stock,
                    product.minimum_stock,
                    `"${product.supplier_name || ''}"`,
                    `"${product.stock_status}"`
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `products_${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.app.showToast('Success', `Exported ${products.length} products`, 'success');

        } catch (error) {
            console.error('Error exporting products:', error);
            this.app.showToast('Error', 'Failed to export products', 'error');
        } finally {
            this.app.hideLoading();
        }
    }
}