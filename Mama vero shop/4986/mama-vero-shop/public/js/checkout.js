(async function () {
  const user = await requireAuth();
  if (!user) return;
  await renderNavbar('cart');
  renderFooter();

  const cart = getCart();
  if (!cart.length) {
    document.getElementById('checkout-body').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">🛒</div>
        <h3>Your cart is empty.</h3>
        <p>Add products before checking out.</p>
        <a href="index.html#shop" class="btn btn-primary mt-2">Shop Now</a>
      </div>`;
    return;
  }

  renderSummary();

  function renderSummary() {
    const summary = document.getElementById('order-summary');
    summary.innerHTML = cart.map((i) => `
      <div class="order-line">
        <span>${escapeHtml(i.name)} × ${i.quantity}</span>
        <span>${formatNaira(i.price * i.quantity)}</span>
      </div>
    `).join('') + `<div class="order-line" style="font-weight:800;border-bottom:none;"><span>Total</span><span>${formatNaira(cartTotal())}</span></div>`;
  }

  let currentOrder = null;
  let selectedFile = null;

  document.getElementById('place-order-btn').addEventListener('click', async (e) => {
    const btn = e.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Processing order...';

    try {
      const items = cart.map((i) => ({ productId: i.productId, quantity: i.quantity }));
      const { order } = await apiFetch('/orders', { method: 'POST', body: JSON.stringify({ items }) });
      currentOrder = order;
      clearCart();
      showToast('Your order has been placed.', 'success');

      btn.parentElement.parentElement.innerHTML = `
        <h3 class="mb-2">Order Placed 🎉</h3>
        <p class="section-subtitle" style="margin-bottom:6px;">Order Number: <b>${escapeHtml(order.orderNumber)}</b></p>
        <p class="section-subtitle">Total: <b>${formatNaira(order.totalAmount)}</b></p>
        <a href="order-details.html?id=${order._id}" class="btn btn-outline btn-block mt-2">View Order Details</a>
      `;

      await loadBankDetails();
      document.getElementById('payment-section').style.display = 'block';
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Place Order';
    }
  });

  async function loadBankDetails() {
    try {
      const { bankDetails } = await apiFetch('/config/bank-details');
      document.getElementById('bank-box').innerHTML = `
        <div class="bank-row"><span>Bank Name</span><b>${escapeHtml(bankDetails.bankName)}</b></div>
        <div class="bank-row"><span>Account Name</span><b>${escapeHtml(bankDetails.accountName)}</b></div>
        <div class="bank-row"><span>Account Number</span><b>${escapeHtml(bankDetails.accountNumber)}</b></div>
      `;
    } catch (e) { /* silent */ }
  }

  const uploadBox = document.getElementById('upload-box');
  const proofInput = document.getElementById('proof-input');
  const uploadBtn = document.getElementById('upload-btn');

  uploadBox.addEventListener('click', () => proofInput.click());
  proofInput.addEventListener('change', () => {
    const file = proofInput.files[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Only JPG, JPEG, PNG, and WebP images are allowed.', 'error');
      proofInput.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('File is too large. Maximum size is 5MB.', 'error');
      proofInput.value = '';
      return;
    }

    selectedFile = file;
    uploadBox.classList.add('has-file');
    document.getElementById('upload-placeholder').textContent = `✅ Selected: ${file.name}`;
    uploadBtn.disabled = false;
  });

  uploadBtn.addEventListener('click', async () => {
    if (!currentOrder || !selectedFile) return;
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span class="spinner"></span> Uploading payment proof...';

    try {
      const formData = new FormData();
      formData.append('paymentProof', selectedFile);
      await apiFetch(`/orders/${currentOrder._id}/payment-proof`, { method: 'POST', body: formData });
      showToast('Your payment proof has been uploaded successfully.', 'success');
      window.location.href = `order-details.html?id=${currentOrder._id}`;
    } catch (err) {
      showToast(err.message, 'error');
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload Payment Proof';
    }
  });
})();
