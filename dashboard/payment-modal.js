export function createAddPaymentModal({
  api,
  getReservations,
  setReservations,
  getActiveUserId,
  showToast,
  refreshReservations,
  refreshOverview,
  refreshRooms,
  modal,
  form,
  reservationIdInput,
  guestName,
  roomInfo,
  totalPrice,
  paidAmount,
  remainingBalance,
  newAmount,
  paymentMethod,
  closeButton,
  cancelButton,
  payFullButton,
  saveButton,
  schedule = (callback, delay) => setTimeout(callback, delay)
}) {
  let currentPayingReservation = null;

  async function openAddPaymentModal(reservationId) {
    if (!modal) {
      console.error('Modal #add-payment-modal not found in DOM');
      return;
    }

    const targetId = parseInt(reservationId, 10);
    if (!targetId || isNaN(targetId)) {
      showToast('رقم الحجز غير صالح.', 'error');
      return;
    }

    let reservation = (getReservations() || []).find(item => parseInt(item.id, 10) === targetId);
    if (!reservation) {
      try {
        const allReservations = await api.getAllReservations();
        if (allReservations && allReservations.success && allReservations.data) {
          setReservations(allReservations.data);
          reservation = (getReservations() || []).find(item => parseInt(item.id, 10) === targetId);
        }
      } catch (error) {
        console.error('Error fetching reservation for payment:', error);
      }
    }

    if (!reservation) {
      showToast('تعذر العثور على بيانات الحجز المطلوب.', 'error');
      return;
    }

    currentPayingReservation = reservation;
    const isContract = reservation.booking_type === 'عقد مفتوح';
    const total = Math.round((parseFloat(reservation.total_price || 0) + Number.EPSILON) * 100) / 100;
    const paid = Math.round((parseFloat(reservation.paid_amount || 0) + Number.EPSILON) * 100) / 100;
    const rawRemaining = Math.round((total - paid + Number.EPSILON) * 100) / 100;
    const remaining = isContract ? rawRemaining : Math.max(0, rawRemaining);
    const formatMoney = amount => amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (reservationIdInput) reservationIdInput.value = reservation.id;
    if (guestName) guestName.textContent = reservation.guest_name || 'نزيل';
    if (roomInfo) roomInfo.textContent = `حجز #${reservation.id} - غرفة ${reservation.room_number || '-'}${isContract ? ' (عقد مفتوح)' : ''}`;
    if (totalPrice) totalPrice.textContent = `${formatMoney(total)} ريال`;
    if (paidAmount) paidAmount.textContent = `${formatMoney(paid)} ريال`;
    if (remainingBalance) {
      if (isContract && remaining < -0.005) {
        remainingBalance.textContent = `رصيد دائن: ${formatMoney(Math.abs(remaining))} ريال`;
        remainingBalance.style.color = '#2563eb';
      } else {
        remainingBalance.textContent = `${formatMoney(remaining)} ريال`;
        remainingBalance.style.color = remaining > 0 ? '#dc2626' : '#059669';
      }
    }

    if (newAmount) {
      newAmount.value = remaining > 0 ? remaining.toFixed(2) : '';
      if (isContract) {
        newAmount.removeAttribute('max');
      } else {
        newAmount.max = remaining > 0 ? remaining.toFixed(2) : '';
      }
    }

    modal.style.display = 'flex';
    schedule(() => {
      if (newAmount) {
        newAmount.focus();
        newAmount.select();
      }
    }, 50);
  }

  function closeAddPaymentModal() {
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
    currentPayingReservation = null;
  }

  if (closeButton) closeButton.addEventListener('click', closeAddPaymentModal);
  if (cancelButton) cancelButton.addEventListener('click', closeAddPaymentModal);
  if (modal) {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeAddPaymentModal();
    });
  }

  if (payFullButton) {
    payFullButton.addEventListener('click', () => {
      if (!currentPayingReservation) return;
      const total = Math.round((parseFloat(currentPayingReservation.total_price || 0) + Number.EPSILON) * 100) / 100;
      const paid = Math.round((parseFloat(currentPayingReservation.paid_amount || 0) + Number.EPSILON) * 100) / 100;
      const rawRemaining = Math.round((total - paid + Number.EPSILON) * 100) / 100;
      const remaining = Math.max(0, rawRemaining);
      if (newAmount && remaining > 0) {
        newAmount.value = remaining.toFixed(2);
        newAmount.focus();
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const reservationId = parseInt(reservationIdInput.value, 10);
      const amount = Math.round((parseFloat(newAmount.value) + Number.EPSILON) * 100) / 100;
      const method = paymentMethod ? paymentMethod.value : 'نقداً';

      if (!reservationId || isNaN(reservationId)) {
        showToast('معرف الحجز غير صالح.', 'error');
        return;
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        showToast('يرجى إدخال مبلغ سداد صحيح وموجب أكبر من الصفر.', 'error');
        return;
      }

      if (currentPayingReservation && currentPayingReservation.booking_type !== 'عقد مفتوح') {
        const total = Math.round((parseFloat(currentPayingReservation.total_price || 0) + Number.EPSILON) * 100) / 100;
        const paid = Math.round((parseFloat(currentPayingReservation.paid_amount || 0) + Number.EPSILON) * 100) / 100;
        const remaining = Math.max(0, Math.round((total - paid + Number.EPSILON) * 100) / 100);
        if (amount - remaining > 0.005) {
          showToast(`المبلغ المدخل (${amount.toLocaleString()} ريال) يتجاوز الرصيد المتبقي المستحق (${remaining.toLocaleString()} ريال).`, 'error');
          return;
        }
      }

      const activeUserId = getActiveUserId();

      try {
        if (saveButton) {
          saveButton.disabled = true;
          saveButton.textContent = 'جاري الحفظ...';
        }

        const result = await api.addPayment({
          reservationId,
          newAmount: amount,
          paymentMethod: method,
          userId: activeUserId ? parseInt(activeUserId, 10) : null
        });

        if (result.success) {
          const statusText = result.isFullyPaid || result.paymentStatus === 'مدفوع بالكامل' ? 'مدفوع بالكامل ✓' : 'مدفوع جزئياً';
          const receiptMessage = result.receiptNumber ? ` (رقم السند: ${result.receiptNumber})` : '';
          showToast(`تم تسجيل سداد مبلغ ${amount.toLocaleString()} ريال بنجاح!${receiptMessage} - [${statusText}]`, 'success');
          closeAddPaymentModal();
          await Promise.all([refreshReservations(), refreshOverview(), refreshRooms()]);
        } else {
          showToast(result.error || 'فشل تسجيل الدفعة.', 'error');
        }
      } catch (error) {
        console.error('Payment submit error:', error);
        showToast(`خطأ أثناء تسجيل الدفعة: ${error.message}`, 'error');
      } finally {
        if (saveButton) {
          saveButton.disabled = false;
          saveButton.innerHTML = '<span>حفظ وتأكيد السداد ✓</span>';
        }
      }
    });
  }

  return { openAddPaymentModal, closeAddPaymentModal };
}