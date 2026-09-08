(async function () {
  const user = await requireAuth();
  if (!user) return;
  await renderNavbar('account');
  renderFooter();

  document.getElementById('name-input').value = user.name;
  document.getElementById('email-input').value = user.email;
  document.getElementById('phone-input').value = user.phone || '';

  document.getElementById('account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving...';
    try {
      const payload = {
        name: document.getElementById('name-input').value,
        phone: document.getElementById('phone-input').value,
      };
      await apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) });
      showToast('Account updated successfully.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    }
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    try { await apiFetch('/auth/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
    window.location.href = 'login.html';
  });

  try {
    const { orders } = await apiFetch('/orders');
    const recent = orders.slice(0, 3);
    const container = document.getElementById('recent-orders');
    if (!recent.length) {
      container.innerHTML = `<p class="section-subtitle">You haven't placed any orders yet.</p>`;
    } else {
      container.innerHTML = recent.map((o) => `
        <div class="order-line">
          <span>${escapeHtml(o.orderNumber)} — ${formatOrderStatus(o.orderStatus)}</span>
          <span>${formatNaira(o.totalAmount)}</span>
        </div>
      `).join('');
    }
  } catch (e) { /* silent */ }
})();
