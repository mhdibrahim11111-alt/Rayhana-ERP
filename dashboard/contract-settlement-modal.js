import { getLocalDateString } from './utils.js';

export function createContractSettlementModal({
  elements,
  api,
  getRooms,
  showToast,
  showConfirmDialog,
  refreshOverview,
  refreshReservations,
  refreshRooms,
  refreshTodayCheckouts,
  openInvoiceModal,
  schedule = (callback, delay) => setTimeout(callback, delay),
  today = () => getLocalDateString()
}) {
  const {
    modal,
    form,
    reservationId,
    pricePerNight,
    guestName,
    roomInfo,
    checkinDate,
    checkoutDate,
    nightsCount,
    totalPriceDisplay,
    paidAmountDisplay,
    balanceBox,
    balanceLabel,
    balanceValue,
    balanceSub,
    discountInput,
    discountReasonInput,
    breakdownHint,
    finalTotalInput,
    paymentSection,
    payNowInput,
    paymentMethodSelect,
    refundBanner,
    refundAmount,
    closeButton,
    cancelButton,
    checkoutWithoutSettleButton,
    confirmCheckoutButton
  } = elements;

  let currentReservation = null;

  function updateSettleCalculations() {
    if (!currentReservation) return;
    const paidSoFar = Math.round((parseFloat(currentReservation.paid_amount || 0) + Number.EPSILON) * 100) / 100;
    const finalTotal = Math.round((parseFloat(finalTotalInput ? finalTotalInput.value : 0) + Number.EPSILON) * 100) / 100;
    const netBalance = Math.round((finalTotal - paidSoFar + Number.EPSILON) * 100) / 100;
    const discountValue = parseFloat(discountInput ? discountInput.value : 0) || 0;

    if (breakdownHint) {
      if (discountValue > 0) {
        breakdownHint.textContent = `(الخصم المطبق: ${discountValue.toFixed(2)} ريال)`;
        breakdownHint.style.color = '#b91c1c';
      } else {
        breakdownHint.textContent = '(الأساس - الخصم)';
        breakdownHint.style.color = '#64748b';
      }
    }

    if (netBalance > 0.005) {
      if (balanceBox) {
        balanceBox.style.background = '#fef2f2';
        balanceBox.style.borderColor = '#fca5a5';
      }
      if (balanceLabel) {
        balanceLabel.textContent = 'المتبقي للتحصيل';
        balanceLabel.style.color = '#991b1b';
      }
      if (balanceValue) {
        balanceValue.textContent = `${netBalance.toFixed(2)} ريال`;
        balanceValue.style.color = '#dc2626';
      }
      if (balanceSub) {
        balanceSub.textContent = '(مستحق على النزيل)';
        balanceSub.style.color = '#dc2626';
      }
      if (paymentSection) paymentSection.style.display = 'block';
      if (payNowInput) payNowInput.value = netBalance.toFixed(2);
      if (refundBanner) refundBanner.style.display = 'none';
      if (confirmCheckoutButton) confirmCheckoutButton.textContent = 'تأكيد السداد وتسجيل المغادرة ✓';
    } else if (netBalance < -0.005) {
      const credit = Math.abs(netBalance);
      if (balanceBox) {
        balanceBox.style.background = '#eff6ff';
        balanceBox.style.borderColor = '#93c5fd';
      }
      if (balanceLabel) {
        balanceLabel.textContent = 'رصيد دائن للنزيل';
        balanceLabel.style.color = '#1e40af';
      }
      if (balanceValue) {
        balanceValue.textContent = `${credit.toFixed(2)} ريال`;
        balanceValue.style.color = '#2563eb';
      }
      if (balanceSub) {
        balanceSub.textContent = '(مبلغ مسترد للنزيل)';
        balanceSub.style.color = '#2563eb';
      }
      if (paymentSection) paymentSection.style.display = 'none';
      if (payNowInput) payNowInput.value = '0.00';
      if (refundBanner) refundBanner.style.display = 'block';
      if (refundAmount) refundAmount.textContent = `${credit.toFixed(2)} ريال`;
      if (confirmCheckoutButton) confirmCheckoutButton.textContent = 'تأكيد الاسترداد وتسجيل المغادرة ✓';
    } else {
      if (balanceBox) {
        balanceBox.style.background = '#f0fdf4';
        balanceBox.style.borderColor = '#86efac';
      }
      if (balanceLabel) {
        balanceLabel.textContent = 'صافي الحساب';
        balanceLabel.style.color = '#166534';
      }
      if (balanceValue) {
        balanceValue.textContent = '0.00 ريال';
        balanceValue.style.color = '#059669';
      }
      if (balanceSub) {
        balanceSub.textContent = '(الحساب خالص بالكامل)';
        balanceSub.style.color = '#059669';
      }
      if (paymentSection) paymentSection.style.display = 'none';
      if (payNowInput) payNowInput.value = '0.00';
      if (refundBanner) refundBanner.style.display = 'none';
      if (confirmCheckoutButton) confirmCheckoutButton.textContent = 'تأكيد تسجيل المغادرة ✓';
    }
  }

  function openContractSettleModal(reservation) {
    if (!reservation) return;
    currentReservation = reservation;

    const todayString = today();
    const checkinString = reservation.check_in_date || todayString;
    const [year1, month1, day1] = checkinString.split('-').map(Number);
    const [year2, month2, day2] = todayString.split('-').map(Number);
    const difference = Date.UTC(year2, month2 - 1, day2) - Date.UTC(year1, month1 - 1, day1);
    const nights = Math.max(1, Math.round(difference / 86400000));

    const room = (getRooms() || []).find(item => item.id === reservation.room_id);
    const nightlyPrice = parseFloat(reservation.custom_nightly_price || reservation.price_per_night || (room ? room.price_per_night : 0)) || 0;
    const isContract = reservation.booking_type === 'عقد مفتوح';
    const calculatedBase = isContract
      ? Math.round((nights * nightlyPrice + Number.EPSILON) * 100) / 100
      : Math.round((parseFloat(reservation.total_price || 0) + Number.EPSILON) * 100) / 100;
    const paidSoFar = Math.round((parseFloat(reservation.paid_amount || 0) + Number.EPSILON) * 100) / 100;
    const existingDiscount = Math.round((parseFloat(reservation.discount_amount || 0) + Number.EPSILON) * 100) / 100;

    if (reservationId) reservationId.value = reservation.id;
    if (pricePerNight) pricePerNight.value = nightlyPrice;
    if (guestName) guestName.textContent = reservation.guest_name || 'نزيل';
    const contractLabel = isContract ? `عقد #${reservation.id}` : `حجز #${reservation.id}`;
    if (roomInfo) roomInfo.textContent = `غرفة ${reservation.room_number || '-'} (${contractLabel})`;
    if (checkinDate) checkinDate.textContent = checkinString;
    if (checkoutDate) checkoutDate.textContent = todayString;
    if (nightsCount) {
      const rateNote = reservation.custom_nightly_price ? ' - سعر خاص' : '';
      nightsCount.textContent = `${nights} ${nights === 1 ? 'ليلة' : 'ليالٍ'} (بسعر ${nightlyPrice.toLocaleString()} ريال/ليلة${rateNote})`;
    }
    if (totalPriceDisplay) totalPriceDisplay.textContent = `${calculatedBase.toFixed(2)} ريال`;
    if (paidAmountDisplay) paidAmountDisplay.textContent = `${paidSoFar.toFixed(2)} ريال`;
    if (discountInput) discountInput.value = existingDiscount > 0 ? existingDiscount.toFixed(2) : '0';
    if (discountReasonInput) discountReasonInput.value = reservation.discount_reason || '';

    const initialNet = Math.max(0, calculatedBase - existingDiscount);
    if (finalTotalInput) finalTotalInput.value = initialNet.toFixed(2);
    updateSettleCalculations();

    if (modal) {
      modal.style.display = 'flex';
      schedule(() => {
        if (payNowInput && paymentSection && paymentSection.style.display !== 'none') {
          payNowInput.focus();
          payNowInput.select();
        }
      }, 50);
    }
  }

  function closeContractSettleModal() {
    if (modal) modal.style.display = 'none';
    if (form) form.reset();
    if (discountInput) discountInput.value = '0';
    if (discountReasonInput) discountReasonInput.value = '';
    currentReservation = null;
  }

  if (closeButton) closeButton.addEventListener('click', closeContractSettleModal);
  if (cancelButton) cancelButton.addEventListener('click', closeContractSettleModal);
  if (modal) {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeContractSettleModal();
    });
  }

  if (discountInput) {
    discountInput.addEventListener('input', () => {
      if (!currentReservation) return;
      const baseTotal = parseFloat(totalPriceDisplay ? totalPriceDisplay.textContent : 0) || 0;
      const discount = Math.max(0, parseFloat(discountInput.value) || 0);
      const net = Math.max(0, baseTotal - discount);
      if (finalTotalInput) finalTotalInput.value = net.toFixed(2);
      updateSettleCalculations();
    });
  }

  if (finalTotalInput) {
    finalTotalInput.addEventListener('input', () => {
      if (currentReservation && totalPriceDisplay && discountInput) {
        const baseTotal = parseFloat(totalPriceDisplay.textContent) || 0;
        const enteredTotal = parseFloat(finalTotalInput.value) || 0;
        discountInput.value = baseTotal > enteredTotal ? (baseTotal - enteredTotal).toFixed(2) : '0';
      }
      updateSettleCalculations();
    });
  }

  if (checkoutWithoutSettleButton) {
    checkoutWithoutSettleButton.addEventListener('click', async () => {
      if (!currentReservation) return;
      const reservationId = currentReservation.id;
      const finalTotal = parseFloat(finalTotalInput ? finalTotalInput.value : 0) || 0;
      const discountAmount = discountInput ? parseFloat(discountInput.value) || 0 : 0;
      const discountReason = discountReasonInput ? discountReasonInput.value.trim() : '';

      const confirmed = await showConfirmDialog({
        title: 'تسجيل مغادرة بدون تحصيل (آجل)',
        message: `هل أنت متأكد من تسجيل مغادرة النزيل مع اعتماد إجمالي ${finalTotal.toFixed(2)} ريال وترحيل باقي المبلغ كدين آجل؟\nسيتم إكمال الحجز وتحويل الغرفة إلى "تنظيف".`,
        confirmText: 'نعم، مغادرة (آجل)',
        cancelText: 'تراجع',
        isDanger: true
      });
      if (!confirmed) return;

      try {
        const result = await api.checkoutReservation(reservationId, {
          finalTotalPrice: finalTotal,
          settleAmount: 0,
          discountAmount,
          discountReason,
          notes: 'تسجيل مغادرة بدون تحصيل (آجل)'
        });

        if (result.success) {
          showToast(`تم تسجيل مغادرة الحجز #${reservationId} بنجاح وترحيل الحساب.`, 'success');
          closeContractSettleModal();
          await Promise.all([refreshOverview(), refreshReservations(), refreshRooms(), refreshTodayCheckouts()]);
        } else {
          showToast(result.error || 'فشل تسجيل المغادرة.', 'error');
        }
      } catch (error) {
        showToast(`خطأ: ${error.message}`, 'error');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!currentReservation) return;
      const reservationId = currentReservation.id;
      const finalTotal = parseFloat(finalTotalInput ? finalTotalInput.value : 0) || 0;
      const payNow = parseFloat(payNowInput ? payNowInput.value : 0) || 0;
      const method = paymentMethodSelect ? paymentMethodSelect.value : 'نقداً';
      const discountAmount = discountInput ? parseFloat(discountInput.value) || 0 : 0;
      const discountReason = discountReasonInput ? discountReasonInput.value.trim() : '';

      if (finalTotal < 0) {
        showToast('إجمالي الحساب لا يمكن أن يكون سالباً.', 'error');
        return;
      }
      if (payNow < 0) {
        showToast('مبلغ السداد لا يمكن أن يكون سالباً.', 'error');
        return;
      }

      try {
        if (confirmCheckoutButton) {
          confirmCheckoutButton.disabled = true;
          confirmCheckoutButton.textContent = 'جاري التصفية...';
        }

        const result = await api.checkoutReservation(reservationId, {
          finalTotalPrice: finalTotal,
          settleAmount: payNow,
          paymentMethod: method,
          discountAmount,
          discountReason,
          notes: 'سداد تصفية حساب مغادرة'
        });

        if (result.success) {
          showToast(`تمت تصفية حساب الحجز #${reservationId} وتسجيل المغادرة بنجاح!`, 'success');
          closeContractSettleModal();
          await Promise.all([refreshOverview(), refreshReservations(), refreshRooms(), refreshTodayCheckouts()]);
          schedule(() => openInvoiceModal(reservationId), 350);
        } else {
          showToast(result.error || 'فشل تسجيل المغادرة وتصفية الحساب.', 'error');
        }
      } catch (error) {
        showToast(`خطأ: ${error.message}`, 'error');
      } finally {
        if (confirmCheckoutButton) {
          confirmCheckoutButton.disabled = false;
          confirmCheckoutButton.textContent = 'تأكيد السداد وتسجيل المغادرة ✓';
        }
      }
    });
  }

  return { openContractSettleModal, closeContractSettleModal, updateSettleCalculations };
}