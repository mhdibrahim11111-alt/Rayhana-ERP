import { getLocalDateString } from './utils.js';

export function createExtendStayModal({
  elements,
  quickExtendButtons,
  api,
  getReservations,
  setReservations,
  getActiveUserId,
  showToast,
  refreshReservations,
  refreshRooms,
  refreshOverview,
  refreshTodayCheckouts,
  schedule = (callback, delay) => setTimeout(callback, delay)
}) {
  const {
    modal,
    closeButton,
    cancelButton,
    form,
    reservationId,
    guestNamePreview,
    roomPreview,
    currentCheckoutPreview,
    nightlyRatePreview,
    newCheckoutDate,
    extraNightsPreview,
    additionalCostPreview,
    newTotalPreview,
    collectNowToggle,
    paymentFields,
    settleAmount,
    paymentMethod,
    confirmButton,
    nightlyRateInput,
    discountInput,
    calculatedRatePreview,
    discountBadge
  } = elements;

  let currentReservation = null;
  let calculatedExtraNights = 0;
  let calculatedAdditionalCost = 0;
  let calculatedNewTotal = 0;

  function updateExtendStayCalculations() {
    if (!currentReservation || !newCheckoutDate) return;

    const oldDate = currentReservation.check_out_date;
    const newDate = newCheckoutDate.value;
    let rate = parseFloat(nightlyRateInput ? nightlyRateInput.value : NaN);
    if (isNaN(rate) || rate < 0) {
      rate = (currentReservation.custom_nightly_price != null && !isNaN(Number(currentReservation.custom_nightly_price)))
        ? parseFloat(currentReservation.custom_nightly_price)
        : parseFloat(currentReservation.price_per_night || 0);
    }

    const discount = Math.max(0, parseFloat(discountInput ? discountInput.value : 0) || 0);
    const currentTotal = Math.round((parseFloat(currentReservation.total_price || 0) + Number.EPSILON) * 100) / 100;

    if (!newDate || newDate <= oldDate) {
      calculatedExtraNights = 0;
      calculatedAdditionalCost = 0;
      calculatedNewTotal = currentTotal;

      if (extraNightsPreview) extraNightsPreview.textContent = '0';
      if (calculatedRatePreview) calculatedRatePreview.textContent = `${rate.toLocaleString()} ر.س`;
      if (additionalCostPreview) additionalCostPreview.textContent = '0 ر.س';
      if (discountBadge) discountBadge.style.display = 'none';
      if (newTotalPreview) newTotalPreview.textContent = `${currentTotal.toLocaleString()} ر.س`;
      if (settleAmount && collectNowToggle && collectNowToggle.checked) settleAmount.value = '0.00';
      return;
    }

    const oldDateValue = new Date(oldDate + 'T00:00:00');
    const newDateValue = new Date(newDate + 'T00:00:00');
    calculatedExtraNights = Math.round((newDateValue.getTime() - oldDateValue.getTime()) / (1000 * 60 * 60 * 24));

    const baseCost = Math.round((calculatedExtraNights * rate + Number.EPSILON) * 100) / 100;
    calculatedAdditionalCost = Math.max(0, Math.round((baseCost - discount + Number.EPSILON) * 100) / 100);
    calculatedNewTotal = Math.round((currentTotal + calculatedAdditionalCost + Number.EPSILON) * 100) / 100;

    const nightsLabel = calculatedExtraNights === 1 ? 'ليلة واحدة' : (calculatedExtraNights === 2 ? 'ليلتين' : `${calculatedExtraNights} ليالٍ`);
    if (extraNightsPreview) extraNightsPreview.textContent = nightsLabel;
    if (calculatedRatePreview) calculatedRatePreview.textContent = `${rate.toLocaleString()} ر.س`;
    if (additionalCostPreview) additionalCostPreview.textContent = `+${calculatedAdditionalCost.toLocaleString()} ر.س`;

    if (discountBadge) {
      if (discount > 0) {
        discountBadge.textContent = `(خصم: -${discount.toLocaleString()} ر.س)`;
        discountBadge.style.display = 'block';
      } else {
        discountBadge.style.display = 'none';
      }
    }

    if (newTotalPreview) newTotalPreview.textContent = `${calculatedNewTotal.toLocaleString()} ر.س`;
    if (settleAmount && collectNowToggle && collectNowToggle.checked) {
      settleAmount.value = calculatedAdditionalCost > 0 ? calculatedAdditionalCost.toFixed(2) : '0.00';
    }
  }

  async function openExtendStayModal(reservationIdValue) {
    if (!modal) {
      console.error('Modal #extend-stay-modal not found in DOM');
      return;
    }

    const targetId = parseInt(reservationIdValue, 10);
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
        console.error('Error fetching reservation for extension:', error);
      }
    }

    if (!reservation) {
      showToast('تعذر العثور على بيانات الحجز المطلوب.', 'error');
      return;
    }
    if (reservation.status !== 'مؤكد') {
      showToast('لا يمكن تمديد هذا الحجز، متاح فقط للحجوزات المؤكدة والنشطة حالياً.', 'warning');
      return;
    }
    if (reservation.check_out_date === 'مفتوح' || !reservation.check_out_date) {
      showToast('حجوزات العقود المفتوحة ليس لها تاريخ مغادرة محدد ليتم تمديدها.', 'warning');
      return;
    }

    currentReservation = reservation;
    if (reservationId) reservationId.value = reservation.id;
    if (guestNamePreview) guestNamePreview.textContent = reservation.guest_name || 'نزيل';
    if (roomPreview) roomPreview.textContent = `غرفة ${reservation.room_number || '-'} (${reservation.room_type || ''})`;
    if (currentCheckoutPreview) currentCheckoutPreview.textContent = reservation.check_out_date;

    const effectiveNightlyRate = (reservation.custom_nightly_price != null && !isNaN(Number(reservation.custom_nightly_price)))
      ? parseFloat(reservation.custom_nightly_price)
      : parseFloat(reservation.price_per_night || 0);
    if (nightlyRatePreview) {
      const customBadge = (reservation.custom_nightly_price != null && !isNaN(Number(reservation.custom_nightly_price))) ? ' (سعر خاص)' : '';
      nightlyRatePreview.textContent = `${effectiveNightlyRate.toLocaleString()} ريال / ليلة${customBadge}`;
    }
    if (nightlyRateInput) nightlyRateInput.value = effectiveNightlyRate > 0 ? effectiveNightlyRate.toFixed(2) : '0.00';
    if (discountInput) discountInput.value = '0.00';

    const oldDate = new Date(reservation.check_out_date + 'T00:00:00');
    const minimumDate = new Date(oldDate);
    minimumDate.setDate(minimumDate.getDate() + 1);
    const minimumDateString = getLocalDateString(minimumDate);
    if (newCheckoutDate) {
      newCheckoutDate.min = minimumDateString;
      newCheckoutDate.value = minimumDateString;
    }

    if (collectNowToggle) collectNowToggle.checked = true;
    if (paymentFields) paymentFields.style.display = 'grid';
    if (paymentMethod) paymentMethod.value = 'نقداً';

    updateExtendStayCalculations();
    modal.style.display = 'flex';
  }

  function closeExtendStayModal() {
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
    currentReservation = null;
    calculatedExtraNights = 0;
    calculatedAdditionalCost = 0;
    calculatedNewTotal = 0;
  }

  if (closeButton) closeButton.addEventListener('click', closeExtendStayModal);
  if (cancelButton) cancelButton.addEventListener('click', closeExtendStayModal);
  if (modal) {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeExtendStayModal();
    });
  }

  quickExtendButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (!currentReservation || !currentReservation.check_out_date) return;
      const days = parseInt(button.dataset.days, 10);
      if (!days || isNaN(days)) return;

      const date = new Date(currentReservation.check_out_date + 'T00:00:00');
      date.setDate(date.getDate() + days);
      if (newCheckoutDate) {
        newCheckoutDate.value = getLocalDateString(date);
        updateExtendStayCalculations();
      }
    });
  });

  if (newCheckoutDate) {
    newCheckoutDate.addEventListener('input', updateExtendStayCalculations);
    newCheckoutDate.addEventListener('change', updateExtendStayCalculations);
  }
  if (nightlyRateInput) {
    nightlyRateInput.addEventListener('input', updateExtendStayCalculations);
    nightlyRateInput.addEventListener('change', updateExtendStayCalculations);
  }
  if (discountInput) {
    discountInput.addEventListener('input', updateExtendStayCalculations);
    discountInput.addEventListener('change', updateExtendStayCalculations);
  }
  if (collectNowToggle) {
    collectNowToggle.addEventListener('change', () => {
      if (paymentFields) paymentFields.style.display = collectNowToggle.checked ? 'grid' : 'none';
      if (!collectNowToggle.checked) {
        if (settleAmount) settleAmount.value = '0.00';
      } else if (settleAmount) {
        settleAmount.value = calculatedAdditionalCost > 0 ? calculatedAdditionalCost.toFixed(2) : '0.00';
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!currentReservation) return;

      const newDate = newCheckoutDate ? newCheckoutDate.value.trim() : '';
      if (!newDate) {
        showToast('يرجى تحديد تاريخ المغادرة الجديد.', 'error');
        return;
      }
      if (newDate <= currentReservation.check_out_date) {
        showToast(`تاريخ المغادرة الجديد (${newDate}) يجب أن يكون بعد تاريخ المغادرة الحالي (${currentReservation.check_out_date}).`, 'error');
        return;
      }

      const settle = (collectNowToggle && collectNowToggle.checked)
        ? Math.max(0, parseFloat(settleAmount ? settleAmount.value : 0) || 0)
        : 0;
      const paymentMethodValue = paymentMethod ? paymentMethod.value : 'نقداً';
      if (confirmButton) {
        confirmButton.disabled = true;
        confirmButton.textContent = 'جاري تمديد الإقامة...';
      }

      try {
        const activeUserId = getActiveUserId();
        const nightlyRate = parseFloat(nightlyRateInput ? nightlyRateInput.value : NaN);
        const discount = Math.max(0, parseFloat(discountInput ? discountInput.value : 0) || 0);
        const result = await api.extendReservation({
          reservationId: currentReservation.id,
          newCheckOutDate: newDate,
          customNightlyPrice: !isNaN(nightlyRate) && nightlyRate >= 0 ? nightlyRate : undefined,
          discountAmount: discount,
          additionalCost: calculatedAdditionalCost,
          settleAmount: settle,
          paymentMethod: paymentMethodValue,
          userId: activeUserId ? parseInt(activeUserId, 10) : null,
          notes: `تمديد فترة الإقامة (${calculatedExtraNights} ليالٍ إضافية حتى ${newDate})${discount > 0 ? ` [خصم تمديد: ${discount} ر.س]` : ''}`
        });

        if (result && result.success) {
          const receiptInfo = result.receiptNumber ? ` (سند قبض رقم: ${result.receiptNumber})` : '';
          const settleInfo = settle > 0 ? ` وتم تحصيل ${settle.toLocaleString()} ريال` : ' (مسجلة ذمة مستحقة)';
          const discountInfo = discount > 0 ? ` [خصم: ${discount.toLocaleString()} ريال]` : '';
          showToast(`تم تمديد إقامة النزيل (${result.reservation?.guest_name || currentReservation.guest_name}) بنجاح حتى ${newDate}${discountInfo}${settleInfo}${receiptInfo} ✓`, 'success');
          closeExtendStayModal();
          await Promise.all([refreshReservations(), refreshRooms(), refreshOverview(), refreshTodayCheckouts()]);
        } else {
          showToast(result?.error || 'فشل تمديد الحجز.', 'error');
        }
      } catch (error) {
        console.error('Extend stay submit error:', error);
        showToast(`خطأ: ${error.message}`, 'error');
      } finally {
        if (confirmButton) {
          confirmButton.disabled = false;
          confirmButton.textContent = 'تأكيد تمديد الحجز ✓';
        }
      }
    });
  }

  return { openExtendStayModal, closeExtendStayModal, updateExtendStayCalculations };
}