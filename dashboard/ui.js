import { escapeHtml } from './utils.js';

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  toast.innerHTML = `
    ${iconMap[type] || iconMap.info}
    <span style="flex: 1;">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

export function showConfirmDialog({
  title = 'تأكيد الإجراء',
  message = 'هل أنت متأكد من رغبتك في المتابعة؟',
  confirmText = 'نعم، تأكيد',
  cancelText = 'إلغاء',
  isDanger = true
} = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('app-confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const btnConfirm = document.getElementById('btn-modal-confirm');
    const btnCancel = document.getElementById('btn-modal-cancel');
    const iconContainer = document.getElementById('confirm-modal-icon-container');

    if (!modal || !btnConfirm || !btnCancel) {
      resolve(window.confirm ? window.confirm(message) : true);
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (btnCancel) btnCancel.textContent = cancelText;

    if (btnConfirm) {
      btnConfirm.textContent = confirmText;
      if (isDanger) {
        btnConfirm.className = 'btn btn-danger';
        btnConfirm.style.background = '#dc2626';
        btnConfirm.style.color = '#ffffff';
        btnConfirm.style.border = 'none';
        if (iconContainer) {
          iconContainer.style.background = 'rgba(239, 68, 68, 0.12)';
          iconContainer.style.color = '#dc2626';
          iconContainer.style.borderColor = 'rgba(239, 68, 68, 0.25)';
        }
      } else {
        btnConfirm.className = 'btn btn-primary';
        btnConfirm.style.background = 'var(--primary-accent, #1a4332)';
        btnConfirm.style.color = '#ffffff';
        btnConfirm.style.border = 'none';
        if (iconContainer) {
          iconContainer.style.background = 'rgba(26, 67, 50, 0.12)';
          iconContainer.style.color = 'var(--primary-accent, #1a4332)';
          iconContainer.style.borderColor = 'rgba(26, 67, 50, 0.25)';
        }
      }
    }

    const cleanup = (result) => {
      modal.style.display = 'none';
      btnConfirm.removeEventListener('click', onConfirm);
      btnCancel.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKeyDown);
      window.focus();
      resolve(result);
    };

    const onConfirm = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onBackdrop = (event) => {
      if (event.target === modal) cleanup(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') cleanup(false);
    };

    btnConfirm.addEventListener('click', onConfirm);
    btnCancel.addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKeyDown);

    modal.style.display = 'flex';
    setTimeout(() => {
      btnConfirm.focus();
    }, 50);
  });
}

export function showPromptDialog({
  title = 'إدخال بيانات',
  message = 'يرجى إدخال القيمة المطلوبة:',
  defaultValue = '',
  placeholder = '',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء'
} = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('app-prompt-modal');
    const titleEl = document.getElementById('prompt-modal-title');
    const msgEl = document.getElementById('prompt-modal-message');
    const inputEl = document.getElementById('prompt-modal-input');
    const btnConfirm = document.getElementById('btn-prompt-confirm');
    const btnCancel = document.getElementById('btn-prompt-cancel');

    if (!modal || !btnConfirm || !btnCancel || !inputEl) {
      const value = window.prompt ? window.prompt(message, defaultValue) : defaultValue;
      resolve(value !== null ? value.trim() : null);
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (btnConfirm) btnConfirm.textContent = confirmText;
    if (btnCancel) btnCancel.textContent = cancelText;
    inputEl.value = defaultValue;
    if (placeholder) inputEl.placeholder = placeholder;

    const cleanup = (result) => {
      modal.style.display = 'none';
      btnConfirm.removeEventListener('click', onConfirm);
      btnCancel.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKeyDown);
      window.focus();
      resolve(result);
    };

    const onConfirm = () => cleanup(inputEl.value.trim());
    const onCancel = () => cleanup(null);
    const onBackdrop = (event) => {
      if (event.target === modal) cleanup(null);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') cleanup(null);
      if (event.key === 'Enter') cleanup(inputEl.value.trim());
    };

    btnConfirm.addEventListener('click', onConfirm);
    btnCancel.addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKeyDown);

    modal.style.display = 'flex';
    setTimeout(() => {
      inputEl.focus();
      inputEl.select();
    }, 50);
  });
}