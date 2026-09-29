export function createFactoryResetModal({
  openButton,
  modal,
  closeButton,
  cancelButton,
  form,
  passwordInput,
  errorMessage,
  submitButton,
  getActiveRole,
  api,
  showToast,
  highlightField,
  reload,
  schedule = (callback, delay) => setTimeout(callback, delay)
}) {
  function closeFactoryResetModal() {
    if (modal) modal.style.display = 'none';
    if (passwordInput) passwordInput.value = '';
    if (errorMessage) {
      errorMessage.textContent = '';
      errorMessage.style.display = 'none';
    }
  }

  function openFactoryResetModal() {
    if (getActiveRole() !== 'Admin') {
      showToast('غير مصرح: تصفير بيانات التطبيق يتطلب صلاحيات مدير النظام (Admin).', 'error');
      return;
    }
    if (passwordInput) passwordInput.value = '';
    if (errorMessage) {
      errorMessage.textContent = '';
      errorMessage.style.display = 'none';
    }
    if (modal) {
      modal.style.display = 'flex';
      schedule(() => {
        if (passwordInput) passwordInput.focus();
      }, 100);
    }
  }

  if (openButton) openButton.addEventListener('click', openFactoryResetModal);
  if (closeButton) closeButton.addEventListener('click', closeFactoryResetModal);
  if (cancelButton) cancelButton.addEventListener('click', closeFactoryResetModal);
  if (modal) {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeFactoryResetModal();
    });
  }

  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const password = passwordInput ? passwordInput.value : '';
      if (!password) {
        if (errorMessage) {
          errorMessage.textContent = 'يرجى كتابة كلمة المرور لتأكيد تصفير البيانات.';
          errorMessage.style.display = 'block';
        }
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'جاري تصفير البيانات...';
      }

      try {
        const result = await api.factoryResetDatabase(password);
        if (result && result.success) {
          showToast(result.message || 'تم تصفير بيانات النظام بنجاح واستعادة تهيئة المصنع!', 'success');
          closeFactoryResetModal();
          schedule(reload, 1200);
        } else {
          if (errorMessage) {
            errorMessage.textContent = result?.error || 'فشلت عملية تصفير البيانات: تأكد من صحة كلمة المرور.';
            errorMessage.style.display = 'block';
          }
          if (passwordInput) {
            passwordInput.focus();
            highlightField(passwordInput);
          }
        }
      } catch (error) {
        if (errorMessage) {
          errorMessage.textContent = `خطأ: ${error.message}`;
          errorMessage.style.display = 'block';
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'تأكيد التصفير واستعادة المصنع ⚠️';
        }
      }
    });
  }

  return { openFactoryResetModal, closeFactoryResetModal };
}