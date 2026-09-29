export function createEditRoomModal({ getRooms, modal, form, idInput, numberInput, typeInput, priceInput, statusInput, statusLockedHint, deleteButton, showToast }) {
  function openEditRoomModal(roomId) {
    const room = (getRooms() || []).find(item => item.id === parseInt(roomId, 10));
    if (!room) {
      showToast('لم يتم العثور على بيانات الغرفة.', 'error');
      return;
    }

    if (idInput) idInput.value = room.id;
    if (numberInput) numberInput.value = room.room_number || '';
    if (typeInput) typeInput.value = room.type || '';
    if (priceInput) priceInput.value = room.price_per_night || '';

    const isOccupied = room.status === 'مشغولة';
    if (statusInput) {
      statusInput.value = room.status || 'متاحة';
      statusInput.disabled = isOccupied;
      statusInput.title = isOccupied
        ? 'الغرفة مشغولة بنزيل حالياً - مقفلة حتى تسجيل المغادرة (Check-out)'
        : '';
    }

    if (statusLockedHint) {
      statusLockedHint.style.display = isOccupied ? 'block' : 'none';
    }

    if (deleteButton) {
      deleteButton.disabled = isOccupied;
      deleteButton.style.opacity = isOccupied ? '0.5' : '1';
      deleteButton.style.cursor = isOccupied ? 'not-allowed' : 'pointer';
      deleteButton.title = isOccupied ? 'لا يمكن حذف الغرفة لأنها مشغولة بحجز نشط' : '';
    }

    if (modal) modal.style.display = 'flex';
    if (numberInput) numberInput.focus();
  }

  function closeEditRoomModal() {
    if (modal) modal.style.display = 'none';
    if (statusInput) {
      statusInput.disabled = false;
      statusInput.title = '';
    }
    if (statusLockedHint) statusLockedHint.style.display = 'none';
    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.style.opacity = '1';
      deleteButton.style.cursor = 'pointer';
      deleteButton.title = '';
    }
    if (form) form.reset();
  }

  return { openEditRoomModal, closeEditRoomModal };
}