// export default class Suppliers {
//     constructor(app) {
//         this.app = app;
//     }

//     async load() {
//         return `
//             <div class="content-header">
//                 <div class="header-left">
//                     <h1><i class="material-icons">business</i> Suppliers</h1>
//                     <p class="content-subtitle">Manage your manufacturers and suppliers</p>
//                 </div>
//                 <div class="header-right">
//                     <button class="btn btn-primary" id="addSupplierBtn">
//                         <i class="material-icons">add</i> Add Supplier
//                     </button>
//                 </div>
//             </div>

//             <!-- Search and Filters -->
//             <div class="card">
//                 <div class="card-body">
//                     <div class="search-filter-container">
//                         <div class="search-box">
//                             <i class="material-icons">search</i>
//                             <input type="text" id="supplierSearch" placeholder="Search suppliers by name, phone, or GST..." class="form-control">
//                         </div>
//                         <div class="filter-options">
//                             <select class="form-control" id="filterStatus">
//                                 <option value="">All Status</option>
//                                 <option value="active">Active</option>
//                                 <option value="inactive">Inactive</option>
//                             </select>
//                             <button class="btn btn-outline" id="exportSuppliers">
//                                 <i class="material-icons">download</i> Export
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- Suppliers Table -->
//             <div class="card">
//                 <div class="card-header">
//                     <h2 class="card-title">Supplier List</h2>
//                     <div class="card-actions">
//                         <div class="table-summary">
//                             Showing <span id="showingCount">0</span> of <span id="totalCount">0</span> suppliers
//                         </div>
//                     </div>
//                 </div>
//                 <div class="card-body">
//                     <div class="table-responsive">
//                         <table class="table" id="suppliersTable">
//                             <thead>
//                                 <tr>
//                                     <th>ID</th>
//                                     <th>Name</th>
//                                     <th>Contact Person</th>
//                                     <th>Phone</th>
//                                     <th>Email</th>
//                                     <th>GST No.</th>
//                                     <th>Products</th>
//                                     <th>Last Purchase</th>
//                                     <th>Actions</th>
//                                 </tr>
//                             </thead>
//                             <tbody id="suppliersTableBody">
//                                 <!-- Suppliers will be loaded here -->
//                                 <tr>
//                                     <td colspan="9" class="text-center">
//                                         <div class="loading-content">
//                                             <i class="material-icons spin">refresh</i>
//                                             <p>Loading suppliers...</p>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             </tbody>
//                         </table>
//                     </div>
                    
//                     <!-- Pagination -->
//                     <div class="pagination-container" id="suppliersPagination">
//                         <div class="pagination-info">
//                             Page <span id="currentPage">1</span> of <span id="totalPages">1</span>
//                         </div>
//                         <div class="pagination-controls">
//                             <button class="btn btn-outline" id="prevPage" disabled>
//                                 <i class="material-icons">chevron_left</i>
//                             </button>
//                             <button class="btn btn-outline" id="nextPage" disabled>
//                                 <i class="material-icons">chevron_right</i>
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <!-- Supplier Details Modal (will be created dynamically) -->
//         `;
//     }

//     async init() {
//         await this.loadSuppliers();
//         this.setupEventListeners();
//         this.setupSearch();
//     }

//     async loadSuppliers(page = 1, search = '') {
//         try {
//             this.app.showLoading();
            
//             const limit = 10;
//             const offset = (page - 1) * limit;

//             let query = `
//                 SELECT s.*, 
//                     COUNT(DISTINCT p.id) as product_count,
//                     MAX(pr.purchase_date) as last_purchase_date
//                 FROM suppliers s
//                 LEFT JOIN products p ON s.id = p.supplier_id
//                 LEFT JOIN purchases pr ON s.id = pr.supplier_id
//             `;

//             const params = [];
            
//             if (search) {
//                 query += ` WHERE s.name LIKE ? OR s.phone LIKE ? OR s.gst_number LIKE ?`;
//                 const searchTerm = `%${search}%`;
//                 params.push(searchTerm, searchTerm, searchTerm);
//             }

//             query += ` GROUP BY s.id ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;
//             params.push(limit, offset);

//             const suppliers = await this.app.queryDatabase(query, params);
            
//             // Get total count
//             let countQuery = `SELECT COUNT(*) as total FROM suppliers`;
//             if (search) {
//                 countQuery += ` WHERE name LIKE ? OR phone LIKE ? OR gst_number LIKE ?`;
//             }
            
//             const countResult = await this.app.queryDatabase(
//                 countQuery, 
//                 search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []
//             );
            
//             const total = countResult[0].total;
//             const totalPages = Math.ceil(total / limit);

//             this.updateSuppliersTable(suppliers);
//             this.updatePagination(page, totalPages, total);

//         } catch (error) {
//             console.error('Error loading suppliers:', error);
//             this.app.showToast('Error', 'Failed to load suppliers', 'error');
//         } finally {
//             this.app.hideLoading();
//         }
//     }

//     updateSuppliersTable(suppliers) {
//         const tbody = document.getElementById('suppliersTableBody');
//         if (!tbody) return;

//         if (suppliers.length === 0) {
//             tbody.innerHTML = `
//                 <tr>
//                     <td colspan="9" class="text-center">
//                         <div class="empty-state">
//                             <i class="material-icons">business</i>
//                             <h3>No Suppliers Found</h3>
//                             <p>Add your first supplier to get started</p>
//                             <button class="btn btn-primary" id="addFirstSupplier">
//                                 <i class="material-icons">add</i> Add Supplier
//                             </button>
//                         </div>
//                     </td>
//                 </tr>
//             `;
            
//             document.getElementById('addFirstSupplier')?.addEventListener('click', () => {
//                 this.showAddSupplierModal();
//             });
            
//             return;
//         }

//         let tableHTML = '';
        
//         suppliers.forEach(supplier => {
//             const lastPurchase = supplier.last_purchase_date 
//                 ? this.app.formatDate(supplier.last_purchase_date)
//                 : 'Never';
            
//             tableHTML += `
//                 <tr data-id="${supplier.id}">
//                     <td>SUP${supplier.id.toString().padStart(4, '0')}</td>
//                     <td>
//                         <div class="supplier-name">
//                             <strong>${supplier.name}</strong>
//                             ${supplier.contact_person ? `<small>${supplier.contact_person}</small>` : ''}
//                         </div>
//                     </td>
//                     <td>${supplier.contact_person || 'N/A'}</td>
//                     <td>
//                         <div class="phone-cell">
//                             ${supplier.phone || 'N/A'}
//                             ${supplier.phone ? `<a href="tel:${supplier.phone}" class="phone-link"><i class="material-icons">phone</i></a>` : ''}
//                         </div>
//                     </td>
//                     <td>
//                         ${supplier.email ? `
//                             <div class="email-cell">
//                                 <a href="mailto:${supplier.email}">${supplier.email}</a>
//                             </div>
//                         ` : 'N/A'}
//                     </td>
//                     <td>${supplier.gst_number || 'N/A'}</td>
//                     <td>
//                         <span class="badge ${supplier.product_count > 0 ? 'badge-success' : 'badge-warning'}">
//                             ${supplier.product_count} products
//                         </span>
//                     </td>
//                     <td>${lastPurchase}</td>
//                     <td>
//                         <div class="table-actions">
//                             <button class="btn btn-sm btn-text view-supplier" data-id="${supplier.id}" title="View">
//                                 <i class="material-icons">visibility</i>
//                             </button>
//                             <button class="btn btn-sm btn-text edit-supplier" data-id="${supplier.id}" title="Edit">
//                                 <i class="material-icons">edit</i>
//                             </button>
//                             <button class="btn btn-sm btn-text delete-supplier" data-id="${supplier.id}" title="Delete">
//                                 <i class="material-icons">delete</i>
//                             </button>
//                         </div>
//                     </td>
//                 </tr>
//             `;
//         });

//         tbody.innerHTML = tableHTML;

//         // Add event listeners to action buttons
//         this.attachSupplierEventListeners();
//     }

//     updatePagination(currentPage, totalPages, totalCount) {
//         const showingElement = document.getElementById('showingCount');
//         const totalElement = document.getElementById('totalCount');
//         const currentPageElement = document.getElementById('currentPage');
//         const totalPagesElement = document.getElementById('totalPages');
//         const prevButton = document.getElementById('prevPage');
//         const nextButton = document.getElementById('nextPage');

//         if (showingElement) {
//             const showing = Math.min(currentPage * 10, totalCount);
//             const from = (currentPage - 1) * 10 + 1;
//             showingElement.textContent = `${from}-${showing}`;
//         }

//         if (totalElement) totalElement.textContent = totalCount;
//         if (currentPageElement) currentPageElement.textContent = currentPage;
//         if (totalPagesElement) totalPagesElement.textContent = totalPages;

//         if (prevButton) {
//             prevButton.disabled = currentPage === 1;
//             prevButton.onclick = () => this.loadSuppliers(currentPage - 1, document.getElementById('supplierSearch')?.value || '');
//         }

//         if (nextButton) {
//             nextButton.disabled = currentPage === totalPages;
//             nextButton.onclick = () => this.loadSuppliers(currentPage + 1, document.getElementById('supplierSearch')?.value || '');
//         }
//     }

//     attachSupplierEventListeners() {
//         // View supplier
//         document.querySelectorAll('.view-supplier').forEach(btn => {
//             btn.addEventListener('click', (e) => {
//                 const supplierId = e.currentTarget.dataset.id;
//                 this.viewSupplier(supplierId);
//             });
//         });

//         // Edit supplier
//         document.querySelectorAll('.edit-supplier').forEach(btn => {
//             btn.addEventListener('click', (e) => {
//                 const supplierId = e.currentTarget.dataset.id;
//                 this.editSupplier(supplierId);
//             });
//         });

//         // Delete supplier
//         document.querySelectorAll('.delete-supplier').forEach(btn => {
//             btn.addEventListener('click', (e) => {
//                 const supplierId = e.currentTarget.dataset.id;
//                 this.deleteSupplier(supplierId);
//             });
//         });
//     }

//     setupEventListeners() {
//         // Add supplier button
//         document.getElementById('addSupplierBtn')?.addEventListener('click', () => {
//             this.showAddSupplierModal();
//         });

//         // Export button
//         document.getElementById('exportSuppliers')?.addEventListener('click', () => {
//             this.exportSuppliers();
//         });
//     }

//     setupSearch() {
//         const searchInput = document.getElementById('supplierSearch');
//         if (searchInput) {
//             let timeoutId;
            
//             searchInput.addEventListener('input', (e) => {
//                 clearTimeout(timeoutId);
//                 timeoutId = setTimeout(() => {
//                     this.loadSuppliers(1, e.target.value);
//                 }, 300);
//             });
//         }

//         // Filter status
//         document.getElementById('filterStatus')?.addEventListener('change', (e) => {
//             // Implement filter logic if needed
//             console.log('Filter changed:', e.target.value);
//         });
//     }

//     showAddSupplierModal() {
//         const modalContent = `
//             <form id="addSupplierForm" class="modal-form">
//                 <div class="form-grid">
//                     <div class="form-row">
//                         <label class="form-label">Supplier Name *</label>
//                         <input type="text" class="form-control" name="name" required autocomplete="off">
//                     </div>
                    
//                     <div class="form-row">
//                         <label class="form-label">Contact Person</label>
//                         <input type="text" class="form-control" name="contact_person" autocomplete="off">
//                     </div>
                    
//                     <div class="form-row">
//                         <label class="form-label">Phone Number</label>
//                         <input type="tel" class="form-control" name="phone" autocomplete="off">
//                     </div>
                    
//                     <div class="form-row">
//                         <label class="form-label">Email Address</label>
//                         <input type="email" class="form-control" name="email" autocomplete="off">
//                     </div>
                    
//                     <div class="form-row">
//                         <label class="form-label">GST Number</label>
//                         <input type="text" class="form-control" name="gst_number" autocomplete="off" 
//                                pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
//                                title="Enter valid GST number (27ABCDE1234F1Z5)">
//                     </div>
                    
//                     <div class="form-row full-width">
//                         <label class="form-label">Address</label>
//                         <textarea class="form-control" name="address" rows="3" autocomplete="off"></textarea>
//                     </div>
                    
//                     <div class="form-row full-width">
//                         <label class="form-label">Notes</label>
//                         <textarea class="form-control" name="notes" rows="2" autocomplete="off"></textarea>
//                     </div>
//                 </div>
//             </form>
//         `;

//         const modal = this.app.showModal('Add New Supplier', modalContent, [
//             { text: 'Cancel', class: 'btn-secondary' },
//             { text: 'Save Supplier', class: 'btn-primary', id: 'saveSupplierBtn' }
//         ]);

//         // Add form validation
//         const form = modal.querySelector('#addSupplierForm');
//         const saveBtn = modal.querySelector('#saveSupplierBtn');

//         saveBtn.addEventListener('click', async () => {
//             if (!form.checkValidity()) {
//                 form.reportValidity();
//                 return;
//             }

//             const formData = new FormData(form);
//             const data = Object.fromEntries(formData.entries());

//             // Validate phone if provided
//             if (data.phone && !this.app.validatePhone(data.phone)) {
//                 this.app.showToast('Error', 'Please enter a valid 10-digit phone number', 'error');
//                 return;
//             }

//             // Validate GST if provided
//             if (data.gst_number && !this.app.validateGST(data.gst_number)) {
//                 this.app.showToast('Error', 'Please enter a valid GST number', 'error');
//                 return;
//             }

//             await this.saveSupplier(data);
//         });
//     }

//     async saveSupplier(data) {
//         try {
//             this.app.showLoading();

//             const result = await this.app.executeDatabase(`
//                 INSERT INTO suppliers (name, contact_person, phone, email, address, gst_number)
//                 VALUES (?, ?, ?, ?, ?, ?)
//             `, [
//                 data.name,
//                 data.contact_person || null,
//                 data.phone || null,
//                 data.email || null,
//                 data.address || null,
//                 data.gst_number || null
//             ]);

//             this.app.showToast('Success', 'Supplier added successfully!', 'success');
            
//             // Reload suppliers
//             await this.loadSuppliers();
            
//             // Close modal
//             document.querySelector('.modal-overlay')?.remove();

//         } catch (error) {
//             console.error('Error saving supplier:', error);
//             this.app.showToast('Error', 'Failed to save supplier', 'error');
//         } finally {
//             this.app.hideLoading();
//         }
//     }

//     async viewSupplier(supplierId) {
//         try {
//             this.app.showLoading();

//             const [supplier] = await this.app.queryDatabase(`
//                 SELECT s.*, 
//                     COUNT(DISTINCT p.id) as product_count,
//                     COALESCE(SUM(pr.total_amount), 0) as total_purchases,
//                     COUNT(DISTINCT pr.id) as purchase_count,
//                     MAX(pr.purchase_date) as last_purchase_date
//                 FROM suppliers s
//                 LEFT JOIN products p ON s.id = p.supplier_id
//                 LEFT JOIN purchases pr ON s.id = pr.supplier_id
//                 WHERE s.id = ?
//                 GROUP BY s.id
//             `, [supplierId]);

//             if (!supplier) {
//                 this.app.showToast('Error', 'Supplier not found', 'error');
//                 return;
//             }

//             const modalContent = `
//                 <div class="supplier-details">
//                     <div class="details-header">
//                         <h3>${supplier.name}</h3>
//                         <div class="supplier-stats">
//                             <div class="stat-item">
//                                 <i class="material-icons">inventory_2</i>
//                                 <span>${supplier.product_count} Products</span>
//                             </div>
//                             <div class="stat-item">
//                                 <i class="material-icons">shopping_cart</i>
//                                 <span>${supplier.purchase_count} Purchases</span>
//                             </div>
//                             <div class="stat-item">
//                                 <i class="material-icons">payments</i>
//                                 <span>${this.app.formatCurrency(supplier.total_purchases)}</span>
//                             </div>
//                         </div>
//                     </div>
                    
//                     <div class="details-grid">
//                         <div class="detail-section">
//                             <h4><i class="material-icons">contact_phone</i> Contact Information</h4>
//                             <div class="detail-item">
//                                 <strong>Contact Person:</strong> ${supplier.contact_person || 'N/A'}
//                             </div>
//                             <div class="detail-item">
//                                 <strong>Phone:</strong> 
//                                 ${supplier.phone ? `
//                                     <a href="tel:${supplier.phone}">${supplier.phone}</a>
//                                 ` : 'N/A'}
//                             </div>
//                             <div class="detail-item">
//                                 <strong>Email:</strong> 
//                                 ${supplier.email ? `
//                                     <a href="mailto:${supplier.email}">${supplier.email}</a>
//                                 ` : 'N/A'}
//                             </div>
//                         </div>
                        
//                         <div class="detail-section">
//                             <h4><i class="material-icons">business</i> Business Information</h4>
//                             <div class="detail-item">
//                                 <strong>GST Number:</strong> ${supplier.gst_number || 'N/A'}
//                             </div>
//                             <div class="detail-item">
//                                 <strong>Last Purchase:</strong> ${supplier.last_purchase_date ? this.app.formatDate(supplier.last_purchase_date) : 'Never'}
//                             </div>
//                             <div class="detail-item">
//                                 <strong>Added On:</strong> ${this.app.formatDate(supplier.created_at)}
//                             </div>
//                         </div>
//                     </div>
                    
//                     <div class="detail-section full-width">
//                         <h4><i class="material-icons">location_on</i> Address</h4>
//                         <div class="address-content">
//                             ${supplier.address ? supplier.address.replace(/\n/g, '<br>') : 'No address provided'}
//                         </div>
//                     </div>
                    
//                     <div class="detail-section full-width">
//                         <h4><i class="material-icons">history</i> Recent Purchases</h4>
//                         <div id="supplierPurchases">
//                             Loading purchases...
//                         </div>
//                     </div>
//                 </div>
//             `;

//             const modal = this.app.showModal('Supplier Details', modalContent, [
//                 { text: 'Close', class: 'btn-secondary' },
//                 { text: 'Edit', class: 'btn-primary', id: 'editSupplierBtn' }
//             ]);

//             // Load recent purchases
//             this.loadSupplierPurchases(supplierId, modal.querySelector('#supplierPurchases'));

//             // Edit button
//             modal.querySelector('#editSupplierBtn')?.addEventListener('click', () => {
//                 modal.remove();
//                 this.editSupplier(supplierId);
//             });

//         } catch (error) {
//             console.error('Error viewing supplier:', error);
//             this.app.showToast('Error', 'Failed to load supplier details', 'error');
//         } finally {
//             this.app.hideLoading();
//         }
//     }

//     async loadSupplierPurchases(supplierId, container) {
//         try {
//             const purchases = await this.app.queryDatabase(`
//                 SELECT pr.*, 
//                     COUNT(pi.id) as item_count,
//                     SUM(pi.total) as total_amount
//                 FROM purchases pr
//                 LEFT JOIN purchase_items pi ON pr.id = pi.purchase_id
//                 WHERE pr.supplier_id = ?
//                 GROUP BY pr.id
//                 ORDER BY pr.purchase_date DESC
//                 LIMIT 10
//             `, [supplierId]);

//             if (purchases.length === 0) {
//                 container.innerHTML = '<p class="text-muted">No purchases found</p>';
//                 return;
//             }

//             let html = `
//                 <div class="table-responsive">
//                     <table class="table">
//                         <thead>
//                             <tr>
//                                 <th>Purchase No</th>
//                                 <th>Date</th>
//                                 <th>Items</th>
//                                 <th>Total</th>
//                                 <th>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//             `;

//             purchases.forEach(purchase => {
//                 html += `
//                     <tr>
//                         <td>${purchase.purchase_number || `PUR${purchase.id.toString().padStart(4, '0')}`}</td>
//                         <td>${this.app.formatDate(purchase.purchase_date)}</td>
//                         <td>${purchase.item_count}</td>
//                         <td>${this.app.formatCurrency(purchase.total_amount || 0)}</td>
//                         <td>
//                             <button class="btn btn-sm btn-text view-purchase" data-id="${purchase.id}">
//                                 <i class="material-icons">visibility</i>
//                             </button>
//                         </td>
//                     </tr>
//                 `;
//             });

//             html += `
//                         </tbody>
//                     </table>
//                 </div>
//             `;

//             container.innerHTML = html;

//             // Add event listeners to view buttons
//             container.querySelectorAll('.view-purchase').forEach(btn => {
//                 btn.addEventListener('click', (e) => {
//                     const purchaseId = e.currentTarget.dataset.id;
//                     // You could implement purchase viewing here
//                     this.app.showToast('Info', 'Purchase viewing not implemented', 'info');
//                 });
//             });

//         } catch (error) {
//             console.error('Error loading purchases:', error);
//             container.innerHTML = '<p class="text-danger">Failed to load purchases</p>';
//         }
//     }

//     async editSupplier(supplierId) {
//         try {
//             this.app.showLoading();

//             const [supplier] = await this.app.queryDatabase(
//                 'SELECT * FROM suppliers WHERE id = ?',
//                 [supplierId]
//             );

//             if (!supplier) {
//                 this.app.showToast('Error', 'Supplier not found', 'error');
//                 return;
//             }

//             const modalContent = `
//                 <form id="editSupplierForm" class="modal-form">
//                     <div class="form-grid">
//                         <div class="form-row">
//                             <label class="form-label">Supplier Name *</label>
//                             <input type="text" class="form-control" name="name" value="${supplier.name}" required autocomplete="off">
//                         </div>
                        
//                         <div class="form-row">
//                             <label class="form-label">Contact Person</label>
//                             <input type="text" class="form-control" name="contact_person" value="${supplier.contact_person || ''}" autocomplete="off">
//                         </div>
                        
//                         <div class="form-row">
//                             <label class="form-label">Phone Number</label>
//                             <input type="tel" class="form-control" name="phone" value="${supplier.phone || ''}" autocomplete="off">
//                         </div>
                        
//                         <div class="form-row">
//                             <label class="form-label">Email Address</label>
//                             <input type="email" class="form-control" name="email" value="${supplier.email || ''}" autocomplete="off">
//                         </div>
                        
//                         <div class="form-row">
//                             <label class="form-label">GST Number</label>
//                             <input type="text" class="form-control" name="gst_number" value="${supplier.gst_number || ''}" autocomplete="off"
//                                    pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
//                                    title="Enter valid GST number (27ABCDE1234F1Z5)">
//                         </div>
                        
//                         <div class="form-row full-width">
//                             <label class="form-label">Address</label>
//                             <textarea class="form-control" name="address" rows="3" autocomplete="off">${supplier.address || ''}</textarea>
//                         </div>
//                     </div>
//                 </form>
//             `;

//             const modal = this.app.showModal('Edit Supplier', modalContent, [
//                 { text: 'Cancel', class: 'btn-secondary' },
//                 { text: 'Update', class: 'btn-primary', id: 'updateSupplierBtn' }
//             ]);

//             const form = modal.querySelector('#editSupplierForm');
//             const updateBtn = modal.querySelector('#updateSupplierBtn');

//             updateBtn.addEventListener('click', async () => {
//                 if (!form.checkValidity()) {
//                     form.reportValidity();
//                     return;
//                 }

//                 const formData = new FormData(form);
//                 const data = Object.fromEntries(formData.entries());

//                 // Validate phone if provided
//                 if (data.phone && !this.app.validatePhone(data.phone)) {
//                     this.app.showToast('Error', 'Please enter a valid 10-digit phone number', 'error');
//                     return;
//                 }

//                 // Validate GST if provided
//                 if (data.gst_number && !this.app.validateGST(data.gst_number)) {
//                     this.app.showToast('Error', 'Please enter a valid GST number', 'error');
//                     return;
//                 }

//                 await this.updateSupplier(supplierId, data);
//             });

//         } catch (error) {
//             console.error('Error editing supplier:', error);
//             this.app.showToast('Error', 'Failed to load supplier for editing', 'error');
//         } finally {
//             this.app.hideLoading();
//         }
//     }

//     async updateSupplier(supplierId, data) {
//         try {
//             this.app.showLoading();

//             await this.app.executeDatabase(`
//                 UPDATE suppliers 
//                 SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, gst_number = ?
//                 WHERE id = ?
//             `, [
//                 data.name,
//                 data.contact_person || null,
//                 data.phone || null,
//                 data.email || null,
//                 data.address || null,
//                 data.gst_number || null,
//                 supplierId
//             ]);

//             this.app.showToast('Success', 'Supplier updated successfully!', 'success');
            
//             // Reload suppliers
//             await this.loadSuppliers();
            
//             // Close modal
//             document.querySelector('.modal-overlay')?.remove();

//         } catch (error) {
//             console.error('Error updating supplier:', error);
//             this.app.showToast('Error', 'Failed to update supplier', 'error');
//         } finally {
//             this.app.hideLoading();
//         }
//     }

//     async deleteSupplier(supplierId) {
//         const confirm = await this.app.showConfirmation(
//             'Delete Supplier',
//             'Are you sure you want to delete this supplier? This action cannot be undone.',
//             'Delete',
//             'Cancel'
//         );

//         if (!confirm) return;

//         try {
//             this.app.showLoading();

//             // Check if supplier has products
//             const products = await this.app.queryDatabase(
//                 'SELECT COUNT(*) as count FROM products WHERE supplier_id = ?',
//                 [supplierId]
//             );

//             if (products[0].count > 0) {
//                 this.app.showToast('Error', 'Cannot delete supplier with associated products', 'error');
//                 return;
//             }

//             await this.app.executeDatabase(
//                 'DELETE FROM suppliers WHERE id = ?',
//                 [supplierId]
//             );

//             this.app.showToast('Success', 'Supplier deleted successfully!', 'success');
            
//             // Reload suppliers
//             await this.loadSuppliers();

//         } catch (error) {
//             console.error('Error deleting supplier:', error);
//             this.app.showToast('Error', 'Failed to delete supplier', 'error');
//         } finally {
//             this.app.hideLoading();
//         }
//     }

//     async exportSuppliers() {
//         try {
//             this.app.showLoading();

//             const suppliers = await this.app.queryDatabase(`
//                 SELECT name, contact_person, phone, email, gst_number, address, created_at
//                 FROM suppliers
//                 ORDER BY name
//             `);

//             if (suppliers.length === 0) {
//                 this.app.showToast('Info', 'No suppliers to export', 'info');
//                 return;
//             }

//             // Create CSV content
//             const headers = ['Name', 'Contact Person', 'Phone', 'Email', 'GST Number', 'Address', 'Created Date'];
//             const csvRows = [headers.join(',')];

//             suppliers.forEach(supplier => {
//                 const row = [
//                     `"${supplier.name}"`,
//                     `"${supplier.contact_person || ''}"`,
//                     `"${supplier.phone || ''}"`,
//                     `"${supplier.email || ''}"`,
//                     `"${supplier.gst_number || ''}"`,
//                     `"${(supplier.address || '').replace(/"/g, '""')}"`,
//                     `"${this.app.formatDate(supplier.created_at)}"`
//                 ];
//                 csvRows.push(row.join(','));
//             });

//             const csvContent = csvRows.join('\n');
//             const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//             const link = document.createElement('a');
            
//             const url = URL.createObjectURL(blob);
//             link.setAttribute('href', url);
//             link.setAttribute('download', `suppliers_${new Date().toISOString().slice(0, 10)}.csv`);
//             link.style.visibility = 'hidden';
            
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);

//             this.app.showToast('Success', `Exported ${suppliers.length} suppliers`, 'success');

//         } catch (error) {
//             console.error('Error exporting suppliers:', error);
//             this.app.showToast('Error', 'Failed to export suppliers', 'error');
//         } finally {
//             this.app.hideLoading();
//         }
//     }
// }


export function loadSuppliers() {
  const content = document.getElementById("content");

  content.innerHTML = `
    <h2>Suppliers</h2>

    <form id="supplierForm">
      <input type="text" id="name" placeholder="Name" required />
      <input type="email" id="email" placeholder="Email" />
      <input type="text" id="phone" placeholder="Phone" />
      <button type="submit">Add Supplier</button>
    </form>

    <table border="1" style="margin-top:15px; width:100%">
      <thead>
        <tr>
          <th>ID</th><th>Name</th><th>Email</th><th>Phone</th>
        </tr>
      </thead>
      <tbody id="supplierTable"></tbody>
    </table>
  `;

  loadSupplierData();

  document.getElementById("supplierForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const supplier = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value
    };

    await fetch("http://localhost:3000/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(supplier)
    });

    e.target.reset();
    loadSupplierData();
  });
}

async function loadSupplierData() {
  const res = await fetch("http://localhost:3000/api/suppliers");
  const data = await res.json();

  const table = document.getElementById("supplierTable");
  table.innerHTML = "";

  data.forEach(s => {
    table.innerHTML += `
      <tr>
        <td>${s.id}</td>
        <td>${s.name}</td>
        <td>${s.email || ""}</td>
        <td>${s.phone || ""}</td>
      </tr>
    `;
  });
}
