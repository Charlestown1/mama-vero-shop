(async function () {
  const user = await requireAdmin();
  if (!user) return;
  await renderNavbar('admin');
  renderFooter();

  const modalMount = document.getElementById('modal-mount');
  let allProducts = [];
  let allOrders = [];

  /* ---------- Tabs ---------- */
  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'overview') loadOverview();
      if (tab.dataset.tab === 'products') loadProducts();
      if (tab.dataset.tab === 'orders') loadOrders();
      if (tab.dataset.tab === 'customers') loadCustomers();
    });
  });

  function closeModal() { modalMount.innerHTML = ''; }

  /* ---------- Overview ---------- */
  async function loadOverview() {
    const grid = document.getElementById('overview-grid');
    grid.innerHTML = `<div class="skeleton" style="height:80px;"></div>`.repeat(6);
    try {
      const { overview: o } = await apiFetch('/admin/overview');
      const cards = [
        ['Total Products', o.totalProducts, ''],
        ['In Stock', o.inStock, ''],
        ['Out of Stock', o.outOfStock, 'danger'],
        ['Total Orders', o.totalOrders, ''],
        ['Pending Payments', o.pendingPayments, 'warn'],
        ['Verified Payments', o.verifiedPayments, ''],
        ['Preparing', o.preparing, ''],
        ['Ready for Pickup', o.readyForPickup, ''],
        ['Completed Orders', o.completed, ''],
        ['Revenue', formatNaira(o.revenue), 'revenue'],
      ];
      grid.innerHTML = cards.map(([label, num, cls]) => `
        <div class="overview-card ${cls}">
          <div class="num">${num}</div>
          <div class="label">${label}</div>
        </div>`).join('');
    } catch (err) {
      grid.innerHTML = `<p>${escapeHtml(err.message)}</p>`;
    }
  }

  /* ---------- Products ---------- */
  async function loadProducts() {
    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = `<tr><td colspan="7">Loading products...</td></tr>`;
    try {
      const { products } = await apiFetch('/admin/products');
      allProducts = products;
      renderProductsTable(products);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  function renderProductsTable(products) {
    const tbody = document.getElementById('products-tbody');
    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="7">No products found.</td></tr>`;
      return;
    }
    tbody.innerHTML = products.map((p) => {
      const stock = stockStatusLabel(p);
      return `
        <tr>
          <td>${p.image ? `<img class="thumb" src="${escapeHtml(p.image)}">` : '—'}</td>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.category)}</td>
          <td>${formatNaira(p.price)}</td>
          <td>${p.stockQuantity}</td>
          <td><span class="${stock.cls}">${stock.text}</span>${!p.isAvailable ? ' <span class="badge badge-cancelled">Unavailable</span>' : ''}</td>
          <td>
            <button class="btn btn-outline btn-sm edit-product-btn" data-id="${p._id}">Edit</button>
            <button class="btn btn-danger btn-sm delete-product-btn" data-id="${p._id}">Delete</button>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('.edit-product-btn').forEach((btn) => btn.addEventListener('click', () => openProductModal(allProducts.find((p) => p._id === btn.dataset.id))));
    tbody.querySelectorAll('.delete-product-btn').forEach((btn) => btn.addEventListener('click', () => deleteProduct(btn.dataset.id)));
  }

  document.getElementById('product-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderProductsTable(allProducts.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
  });

  document.getElementById('add-product-btn').addEventListener('click', () => openProductModal(null));

  function openProductModal(product) {
    const isEdit = !!product;
    modalMount.innerHTML = `
      <div class="modal-overlay" id="product-modal-overlay">
        <div class="modal-box">
          <button class="modal-close" id="close-product-modal">&times;</button>
          <h3>${isEdit ? 'Edit Product' : 'Add Product'}</h3>
          <form id="product-form">
            <div class="form-group"><label>Name</label><input class="form-control" name="name" required value="${isEdit ? escapeHtml(product.name) : ''}"></div>
            <div class="form-group"><label>Description</label><textarea class="form-control" name="description" rows="2">${isEdit ? escapeHtml(product.description || '') : ''}</textarea></div>
            <div class="form-group"><label>Category</label><input class="form-control" name="category" required value="${isEdit ? escapeHtml(product.category) : ''}"></div>
            <div class="form-group"><label>Price (₦)</label><input class="form-control" type="number" min="0" name="price" required value="${isEdit ? product.price : ''}"></div>
            <div class="form-group"><label>Stock Quantity</label><input class="form-control" type="number" min="0" name="stockQuantity" required value="${isEdit ? product.stockQuantity : ''}"></div>
            <div class="form-group">
              <label><input type="checkbox" name="isAvailable" ${!isEdit || product.isAvailable ? 'checked' : ''}> Available for purchase</label>
            </div>
            <div class="form-group"><label>Product Image</label><input class="form-control" type="file" name="image" accept="image/jpeg,image/png,image/webp"></div>
            <button type="submit" class="btn btn-primary btn-block" id="product-submit-btn">${isEdit ? 'Save Changes' : 'Add Product'}</button>
          </form>
        </div>
      </div>`;

    document.getElementById('close-product-modal').addEventListener('click', closeModal);
    document.getElementById('product-modal-overlay').addEventListener('click', (e) => { if (e.target.id === 'product-modal-overlay') closeModal(); });

    document.getElementById('product-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('product-submit-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Saving...';

      const form = e.target;
      const formData = new FormData();
      formData.append('name', form.name.value);
      formData.append('description', form.description.value);
      formData.append('category', form.category.value);
      formData.append('price', form.price.value);
      formData.append('stockQuantity', form.stockQuantity.value);
      formData.append('isAvailable', form.isAvailable.checked);
      if (form.image.files[0]) formData.append('image', form.image.files[0]);

      try {
        if (isEdit) {
          await apiFetch(`/admin/products/${product._id}`, { method: 'PATCH', body: formData });
          showToast('Product updated successfully.', 'success');
        } else {
          await apiFetch('/admin/products', { method: 'POST', body: formData });
          showToast('Product added successfully.', 'success');
        }
        closeModal();
        loadProducts();
        loadOverview();
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = isEdit ? 'Save Changes' : 'Add Product';
      }
    });
  }

  async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;
    try {
      await apiFetch(`/admin/products/${id}`, { method: 'DELETE' });
      showToast('Product deleted successfully.', 'success');
      loadProducts();
      loadOverview();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  /* ---------- Orders ---------- */
  async function loadOrders() {
    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = `<tr><td colspan="7">Loading orders...</td></tr>`;
    const payment = document.getElementById('order-payment-filter').value;
    const status = document.getElementById('order-status-filter').value;
    const params = new URLSearchParams();
    if (payment) params.set('paymentStatus', payment);
    if (status) params.set('orderStatus', status);

    try {
      const { orders } = await apiFetch('/admin/orders?' + params.toString());
      allOrders = orders;
      renderOrdersTable(orders);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7">${escapeHtml(err.message)}</td></tr>`;
    }
  }
  document.getElementById('order-payment-filter').addEventListener('change', loadOrders);
  document.getElementById('order-status-filter').addEventListener('change', loadOrders);

  function renderOrdersTable(orders) {
    const tbody = document.getElementById('orders-tbody');
    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="7">No orders found.</td></tr>`;
      return;
    }
    tbody.innerHTML = orders.map((o) => `
      <tr>
        <td>${escapeHtml(o.orderNumber)}</td>
        <td>${o.user ? escapeHtml(o.user.name) : 'Deleted user'}</td>
        <td>${formatNaira(o.totalAmount)}</td>
        <td><span class="badge badge-${o.paymentStatus}">${formatOrderStatus(o.paymentStatus)}</span></td>
        <td><span class="badge badge-${o.orderStatus}">${formatOrderStatus(o.orderStatus)}</span></td>
        <td>${new Date(o.createdAt).toLocaleDateString()}</td>
        <td><button class="btn btn-outline btn-sm view-order-btn" data-id="${o._id}">Manage</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.view-order-btn').forEach((btn) => btn.addEventListener('click', () => openOrderModal(btn.dataset.id)));
  }

  async function openOrderModal(orderId) {
    modalMount.innerHTML = `<div class="modal-overlay" id="order-modal-overlay"><div class="modal-box"><p>Loading order...</p></div></div>`;
    document.getElementById('order-modal-overlay').addEventListener('click', (e) => { if (e.target.id === 'order-modal-overlay') closeModal(); });

    try {
      const { order } = await apiFetch(`/admin/orders/${orderId}`);
      const box = document.querySelector('.modal-box');
      box.innerHTML = `
        <button class="modal-close" id="close-order-modal">&times;</button>
        <h3>${escapeHtml(order.orderNumber)}</h3>
        <p class="section-subtitle" style="margin-bottom:10px;">
          ${escapeHtml(order.user ? order.user.name : 'Unknown')} — ${escapeHtml(order.user ? order.user.email : '')} — ${escapeHtml(order.user ? order.user.phone || '' : '')}
        </p>

        <h4 class="mb-1">Items</h4>
        ${order.items.map((i) => `<div class="order-line"><span>${escapeHtml(i.name)} × ${i.quantity}</span><span>${formatNaira(i.subtotal)}</span></div>`).join('')}
        <div class="order-line" style="font-weight:800;border-bottom:none;"><span>Total</span><span>${formatNaira(order.totalAmount)}</span></div>

        <h4 class="mb-1 mt-2">Payment</h4>
        <p>Status: <span class="badge badge-${order.paymentStatus}">${formatOrderStatus(order.paymentStatus)}</span></p>
        ${order.paymentProof && order.paymentProof.objectPath
          ? `<button class="btn btn-outline btn-sm mt-1" id="view-proof-btn">View Payment Proof</button>`
          : `<p class="form-hint">No payment proof uploaded yet.</p>`}
        <div class="flex gap-1 mt-2">
          <button class="btn btn-secondary btn-sm" id="verify-payment-btn">Verify Payment</button>
          <button class="btn btn-danger btn-sm" id="reject-payment-btn">Reject Payment</button>
        </div>

        <h4 class="mb-1 mt-3">Order Status</h4>
        <select class="form-control" id="order-status-select">
          <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="preparing" ${order.orderStatus === 'preparing' ? 'selected' : ''}>Preparing</option>
          <option value="ready_for_pickup" ${order.orderStatus === 'ready_for_pickup' ? 'selected' : ''}>Ready for Pickup</option>
          <option value="completed" ${order.orderStatus === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
        <button class="btn btn-primary btn-block mt-2" id="update-status-btn">Update Order Status</button>
      `;

      document.getElementById('close-order-modal').addEventListener('click', closeModal);

      const viewProofBtn = document.getElementById('view-proof-btn');
      if (viewProofBtn) {
        viewProofBtn.addEventListener('click', async () => {
          viewProofBtn.disabled = true;
          try {
            const { url } = await apiFetch(`/admin/orders/${orderId}/payment-proof-url`);
            window.open(url, '_blank', 'noopener');
          } catch (err) {
            showToast(err.message, 'error');
          } finally {
            viewProofBtn.disabled = false;
          }
        });
      }

      document.getElementById('verify-payment-btn').addEventListener('click', () => setPaymentStatus(orderId, 'verified'));
      document.getElementById('reject-payment-btn').addEventListener('click', () => setPaymentStatus(orderId, 'rejected'));
      document.getElementById('update-status-btn').addEventListener('click', async () => {
        const status = document.getElementById('order-status-select').value;
        try {
          await apiFetch(`/admin/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
          showToast('Order status updated successfully.', 'success');
          closeModal();
          loadOrders();
          loadOverview();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    } catch (err) {
      document.querySelector('.modal-box').innerHTML = `<p>${escapeHtml(err.message)}</p>`;
    }
  }

  async function setPaymentStatus(orderId, status) {
    try {
      await apiFetch(`/admin/orders/${orderId}/payment`, { method: 'PATCH', body: JSON.stringify({ status }) });
      showToast(`Payment marked as ${status}.`, 'success');
      closeModal();
      loadOrders();
      loadOverview();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  /* ---------- Customers ---------- */
  async function loadCustomers() {
    const tbody = document.getElementById('customers-tbody');
    tbody.innerHTML = `<tr><td colspan="4">Loading customers...</td></tr>`;
    try {
      const { customers } = await apiFetch('/admin/customers');
      if (!customers.length) {
        tbody.innerHTML = `<tr><td colspan="4">No customers yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = customers.map((c) => `
        <tr>
          <td>${escapeHtml(c.name)}</td>
          <td>${escapeHtml(c.email)}</td>
          <td>${escapeHtml(c.phone || '—')}</td>
          <td>${new Date(c.createdAt).toLocaleDateString()}</td>
        </tr>`).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  loadOverview();
})();
