export function createEditGuestModal({ getGuests, modal, form, idInput, nameInput, phoneInput, idNumberInput, showToast }) {
  function openEditGuestModal(guestId) {
    const targetId = parseInt(guestId, 10);
    if (!targetId || isNaN(targetId)) return;

    const guest = (getGuests() || []).find(item => item.id === targetId);
    if (!guest) {
      showToast('بيانات النزيل غير متوفرة في الصفحة الحالية.', 'error');
      return;
    }

    if (idInput) idInput.value = guest.id;
    if (nameInput) nameInput.value = guest.name || '';
    if (phoneInput) phoneInput.value = guest.phone || '';
    if (idNumberInput) idNumberInput.value = guest.id_number || '';

    if (modal) modal.style.display = 'flex';
    if (nameInput) nameInput.focus();
  }

  function closeEditGuestModal() {
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
  }

  return { openEditGuestModal, closeEditGuestModal };
}