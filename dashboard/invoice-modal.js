import { getPaymentStatusBadge } from './badges.js';
import { escapeHtml } from './utils.js';

export function createInvoiceModal({
  api,
  state,
  elements,
  showToast,
  printIsolatedElement,
  refreshOverview,
  refreshRooms,
  refreshReservations,
  documentRef = document
}) {
  const {
    modal,
    printableArea,
    closeButton,
    printButton,
    exportButton,
    previewButton,
    editButton,
    editModal,
    closeEditButton,
    cancelEditButton,
    editForm,
    editReservationId,
    editGuestName,
    editGuestPhone,
    editGuestId,
    editTotalPrice,
    editPaidAmount,
    editDepositAmount,
    editPaymentMethod,
    editRemainingPreview
  } = elements;

  async function openInvoiceModal(reservationId) {
    const targetId = parseInt(reservationId, 10);
    if (!targetId || isNaN(targetId)) {
      showToast('يرجى تحديد حجز صالح لعرض الفاتورة.', 'error');
      return;
    }

    state.currentInvoiceReservationId = targetId;

    try {
      const result = await api.getInvoiceData(targetId);
      if (!result || !result.success || !result.data) {
        showToast(result?.error || 'تعذر تحميل بيانات الفاتورة.', 'error');
        return;
      }

      const invoice = result.data;
      state.currentInvoiceData = invoice;
      const isContract = invoice.booking_type === 'عقد مفتوح';
      const total = parseFloat(invoice.total_price || 0);
      const paid = parseFloat(invoice.paid_amount || 0);
      const deposit = parseFloat(invoice.deposit_amount || 0);
      const rawRemaining = total - paid;
      const isCredit = rawRemaining < -0.005;
      const remaining = isContract ? rawRemaining : Math.max(0, rawRemaining);

      const checkinDate = invoice.check_in_date ? new Date(invoice.check_in_date) : null;
      const checkoutDate = invoice.check_out_date ? new Date(invoice.check_out_date) : null;
      const nights = (checkinDate && checkoutDate && checkoutDate > checkinDate)
        ? Math.max(1, Math.round((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24)))
        : (isContract ? '-' : 1);
      const stayDurationText = isContract ? 'عقد مفتوح (غير محدد)' : `${nights} ${nights === 1 ? 'ليلة' : 'ليالٍ'}`;
      const checkOutDisplay = invoice.check_out_date ? `${escapeHtml(invoice.check_out_date)} (${stayDurationText})` : 'مفتوح (غير محدد)';

      const effectiveNightlyRate = parseFloat(invoice.custom_nightly_price || invoice.price_per_night || 0);
      const discount = parseFloat(invoice.discount_amount || 0);
      const discountReasonText = invoice.discount_reason ? ` (${escapeHtml(invoice.discount_reason)})` : '';
      const baseSubtotal = (typeof nights === 'number' && nights > 0) ? (nights * effectiveNightlyRate) : (total + discount);
      const invoiceNumber = `SND-2026-${String(invoice.id).padStart(5, '0')}`;
      const printDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      printableArea.innerHTML = `
        <div style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 28px; background: white;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4338ca; padding-bottom: 20px; margin-bottom: 24px;">
            <div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 44px; height: 44px; border-radius: 10px; background: #4338ca; color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.3rem;">
                  ر
                </div>
                <div>
                  <h1 style="font-size: 1.5rem; font-weight: 800; color: #1e1b4b; margin: 0;">ريحانة للوحدات السكنية</h1>
                </div>
              </div>
              <div style="font-size: 0.82rem; color: #475569; margin-top: 10px; line-height: 1.6;">
                <div>العنوان: الخبر - الثقبة - طريق الملك خالد</div>
                <div>الرمز البريدي: 34625</div>
                <div>هاتف الاستقبال: 0560631783</div>
              </div>
            </div>

            <div style="text-align: left; direction: ltr;">
              <div style="background: #eef2ff; color: #3730a3; padding: 6px 18px; border-radius: 8px; font-weight: 800; font-size: 1.15rem; display: inline-block;">
                سند
              </div>
              <div style="font-size: 0.85rem; color: #334155; margin-top: 8px; font-weight: 700; direction: rtl; text-align: left;">
                رقم السند: <span style="font-family: monospace; color: #4338ca;">${invoiceNumber}</span>
              </div>
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px; direction: rtl; text-align: left;">
                تاريخ الإصدار: <span>${printDate}</span>
              </div>
              <div style="margin-top: 6px; direction: rtl; text-align: left;">
                ${getPaymentStatusBadge(invoice.payment_status)}
              </div>
            </div>
          </div>

          <!-- Guest & Reservation Info Box -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
            <div>
              <h4 style="font-size: 0.9rem; font-weight: 800; color: #334155; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">بيانات النزيل (Guest Details)</h4>
              <div style="font-size: 0.85rem; line-height: 1.7; color: #1e293b;">
                <div><strong>اسم النزيل:</strong> ${escapeHtml(invoice.guest_name)}</div>
                <div><strong>رقم الجوال:</strong> ${escapeHtml(invoice.guest_phone || '-')}</div>
                <div><strong>رقم الهوية / الإقامة:</strong> ${escapeHtml(invoice.guest_id_number || 'غير مسجل')}</div>
              </div>
            </div>

            <div>
              <h4 style="font-size: 0.9rem; font-weight: 800; color: #334155; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">بيانات الإقامة والوحدة (Stay Details)</h4>
              <div style="font-size: 0.85rem; line-height: 1.7; color: #1e293b;">
                <div><strong>رقم الوحدة:</strong> ${escapeHtml(invoice.room_number)} (${escapeHtml(invoice.room_type || '')})</div>
                <div><strong>تاريخ الوصول:</strong> ${escapeHtml(invoice.check_in_date)}</div>
                <div><strong>وقت الحجز:</strong> <span style="font-family: monospace;">${escapeHtml(invoice.booking_time || '-')}</span></div>
                <div><strong>تاريخ المغادرة:</strong> ${checkOutDisplay}</div>
                ${invoice.checkout_time ? `<div><strong>وقت المغادرة:</strong> <span style="font-family: monospace;">${escapeHtml(invoice.checkout_time)}</span></div>` : ''}
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 0.88rem;">
            <thead>
              <tr style="background: #1e1b4b; color: white;">
                <th style="padding: 10px 14px; text-align: right; border-radius: 0 6px 0 0;">الوصف والخدمة</th>
                <th style="padding: 10px 14px; text-align: center;">سعر الليلة</th>
                <th style="padding: 10px 14px; text-align: center;">المدة</th>
                <th style="padding: 10px 14px; text-align: left; border-radius: 6px 0 0 0;">المجموع</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 14px;">
                  <strong>إقامة سكنية - وحدة ${escapeHtml(invoice.room_number)} ${isContract ? '(عقد مفتوح)' : ''}</strong>
                  <div style="font-size: 0.78rem; color: #64748b;">نوع الوحدة: ${escapeHtml(invoice.room_type || 'عادية')} ${invoice.custom_nightly_price ? '<span style="color:#166534; font-weight:700;">(سعر خاص معتمد)</span>' : ''}</div>
                </td>
                <td style="padding: 12px 14px; text-align: center;">${effectiveNightlyRate.toLocaleString()} ريال</td>
                <td style="padding: 12px 14px; text-align: center; font-weight: 700;">${stayDurationText}</td>
                <td style="padding: 12px 14px; text-align: left; font-weight: 800; color: #1e1b4b;">${baseSubtotal.toLocaleString()} ريال</td>
              </tr>
              ${discount > 0 ? `
                <tr style="border-bottom: 1px solid #e2e8f0; background: #fff1f2;">
                  <td style="padding: 10px 14px;">
                    <strong style="color: #b91c1c;">خصم وتخفيض معتمد${discountReasonText}</strong>
                    <div style="font-size: 0.75rem; color: #991b1b;">تخفيض ممنوح على إجمالي قيمة الإقامة</div>
                  </td>
                  <td style="padding: 10px 14px; text-align: center;">-</td>
                  <td style="padding: 10px 14px; text-align: center;">-</td>
                  <td style="padding: 10px 14px; text-align: left; font-weight: 800; color: #b91c1c;">- ${discount.toFixed(2)} ريال</td>
                </tr>
              ` : ''}
              ${invoice.original_calculated_charge != null ? `
                <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                  <td style="padding: 10px 14px;">
                    <strong style="color: #4338ca;">تعديل إداري معتمد لمبلغ الإلغاء</strong>
                    <div style="font-size: 0.75rem; color: #64748b;">الحساب التلقائي الأصلي قبل التعديل: ${parseFloat(invoice.original_calculated_charge).toLocaleString()} ريال</div>
                  </td>
                  <td style="padding: 10px 14px; text-align: center;">-</td>
                  <td style="padding: 10px 14px; text-align: center;">-</td>
                  <td style="padding: 10px 14px; text-align: left; font-weight: 800; color: #4338ca;">${parseFloat(invoice.total_price || 0).toLocaleString()} ريال</td>
                </tr>
              ` : ''}
              ${deposit > 0 ? `
                <tr style="border-bottom: 1px solid #e2e8f0; background: #fdf4ff;">
                  <td style="padding: 10px 14px;">
                    <strong>مبلغ تأمين مسترد (Refundable Deposit)</strong>
                    <div style="font-size: 0.75rem; color: #64748b;">تأمين مسترد عند تسليم الوحدة وفحص المحتويات</div>
                  </td>
                  <td style="padding: 10px 14px; text-align: center;">-</td>
                  <td style="padding: 10px 14px; text-align: center;">-</td>
                  <td style="padding: 10px 14px; text-align: left; font-weight: 700; color: #701a75;">${deposit.toLocaleString()} ريال</td>
                </tr>
              ` : ''}
            </tbody>
          </table>

          <!-- Financial Breakdown & Totals -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div style="max-width: 340px; font-size: 0.82rem; color: #64748b; line-height: 1.6;">
              <div style="font-weight: 700; color: #334155; margin-bottom: 4px;">طريقة السداد: ${escapeHtml(invoice.payment_method || 'نقداً')}</div>
              <div>* يعتبر هذا المستند سند استلام رسمي ومعتمد.</div>
            </div>

            <div style="width: 280px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 0.88rem;">
              ${discount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #64748b; font-size: 0.85rem;">
                  <span>المجموع قبل الخصم:</span>
                  <span>${(total + discount).toFixed(2)} ريال</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #b91c1c; font-size: 0.85rem; font-weight: 700;">
                  <span>الخصم المعتمد:</span>
                  <span>- ${discount.toFixed(2)} ريال</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: 800; font-size: 1rem; color: #1e1b4b;">
                <span>الإجمالي الصافي:</span>
                <span>${total.toFixed(2)} ريال</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #059669; font-weight: 700;">
                <span>المبلغ المدفوع:</span>
                <span>${paid.toFixed(2)} ريال</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-weight: 800; color: ${isCredit ? '#2563eb' : (remaining > 0 ? '#dc2626' : '#059669')};">
                <span>${isCredit ? 'رصيد دائن:' : 'المبلغ المتبقي:'}</span>
                <span>${isCredit ? `${Math.abs(rawRemaining).toFixed(2)} ريال` : `${remaining.toFixed(2)} ريال`}</span>
              </div>
            </div>
          </div>
        </div>
      `;

      if (modal) modal.style.display = 'flex';
    } catch (error) {
      console.error('Invoice error:', error);
      showToast(`خطأ في عرض الفاتورة: ${error.message}`, 'error');
    }
  }

  function closeInvoiceModal() {
    if (modal) modal.style.display = 'none';
    documentRef.body.classList.remove('printing-invoice', 'printing-shift-audit');
  }

  if (closeButton) closeButton.addEventListener('click', closeInvoiceModal);
  if (modal) {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeInvoiceModal();
    });
  }

  if (printButton) {
    printButton.addEventListener('click', () => {
      printIsolatedElement(printableArea ? printableArea.innerHTML : '', 'سند استلام', true);
    });
  }

  if (exportButton) {
    exportButton.addEventListener('click', async () => {
      try {
        if (!printableArea || !printableArea.innerHTML.trim()) {
          showToast('لا توجد بيانات سند لتصديره.', 'error');
          return;
        }
        showToast('جاري إنشاء وحفظ ملف السند بصيغة PDF...', 'info');
        const result = await api.printToPdf({
          html: printableArea.innerHTML,
          title: 'سند استلام',
          defaultFilename: `receipt_${state.currentInvoiceReservationId || 'reservation'}.pdf`
        });
        if (result && result.canceled) return;
        if (result && result.success) {
          showToast(`تم تصدير وحفظ السند بنجاح في: ${result.filePath}`, 'success');
        } else {
          showToast(result?.error || 'فشل تصدير ملف PDF.', 'error');
        }
      } catch (error) {
        showToast(`خطأ أثناء تصدير PDF: ${error.message}`, 'error');
      }
    });
  }

  if (previewButton) {
    previewButton.addEventListener('click', async () => {
      try {
        if (!printableArea || !printableArea.innerHTML.trim()) {
          showToast('لا توجد بيانات سند للمعاينة.', 'error');
          return;
        }
        await api.openPrintPreviewWindow({ html: printableArea.innerHTML, title: 'معاينة سند الاستلام' });
      } catch (error) {
        showToast(`تعذر فتح نافذة المعاينة: ${error.message}`, 'error');
      }
    });
  }

  function updateEditInvoiceRemaining() {
    const total = parseFloat(editTotalPrice ? editTotalPrice.value : 0) || 0;
    const paid = parseFloat(editPaidAmount ? editPaidAmount.value : 0) || 0;
    const isOpenContract = state.currentInvoiceData && state.currentInvoiceData.booking_type === 'عقد مفتوح';
    const remaining = total - paid;
    if (editRemainingPreview) {
      if (isOpenContract && remaining < -0.005) {
        editRemainingPreview.textContent = `رصيد دائن: ${Math.abs(remaining).toFixed(2)} ريال`;
        editRemainingPreview.style.color = '#2563eb';
      } else {
        const displayRemaining = Math.max(0, remaining);
        editRemainingPreview.textContent = `${displayRemaining.toFixed(2)} ريال`;
        editRemainingPreview.style.color = displayRemaining > 0 ? '#dc2626' : '#059669';
      }
    }
  }

  if (editTotalPrice) editTotalPrice.addEventListener('input', updateEditInvoiceRemaining);
  if (editPaidAmount) editPaidAmount.addEventListener('input', updateEditInvoiceRemaining);

  if (editButton) {
    editButton.addEventListener('click', () => {
      if (!state.currentInvoiceData) {
        showToast('يرجى فتح سند أولاً لتعديله.', 'error');
        return;
      }
      if (editReservationId) editReservationId.value = state.currentInvoiceData.id;
      if (editGuestName) editGuestName.value = state.currentInvoiceData.guest_name || '';
      if (editGuestPhone) editGuestPhone.value = state.currentInvoiceData.guest_phone || '';
      if (editGuestId) editGuestId.value = state.currentInvoiceData.guest_id_number || '';
      if (editTotalPrice) editTotalPrice.value = state.currentInvoiceData.total_price || 0;
      if (editPaidAmount) editPaidAmount.value = state.currentInvoiceData.paid_amount || 0;
      if (editDepositAmount) editDepositAmount.value = state.currentInvoiceData.deposit_amount || 0;
      if (editPaymentMethod) editPaymentMethod.value = state.currentInvoiceData.payment_method || 'نقداً';
      updateEditInvoiceRemaining();
      if (editModal) editModal.style.display = 'flex';
    });
  }

  function closeEditInvoiceModal() {
    if (editModal) editModal.style.display = 'none';
  }

  if (closeEditButton) closeEditButton.addEventListener('click', closeEditInvoiceModal);
  if (cancelEditButton) cancelEditButton.addEventListener('click', closeEditInvoiceModal);
  if (editModal) {
    editModal.addEventListener('click', event => {
      if (event.target === editModal) closeEditInvoiceModal();
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', async event => {
      event.preventDefault();
      const reservationId = parseInt(editReservationId.value, 10);
      const guestNameValue = editGuestName.value.trim();
      const guestPhoneValue = editGuestPhone.value.trim();
      const guestIdNumber = editGuestId.value.trim();
      const totalPriceValue = parseFloat(editTotalPrice.value) || 0;
      const paidAmountValue = parseFloat(editPaidAmount.value) || 0;
      const depositAmountValue = parseFloat(editDepositAmount ? editDepositAmount.value : 0) || 0;
      const paymentMethodValue = editPaymentMethod.value;
      const isOpenContract = state.currentInvoiceData && state.currentInvoiceData.booking_type === 'عقد مفتوح';

      if (!guestNameValue) {
        showToast('يرجى إدخال اسم النزيل.', 'error');
        return;
      }
      if (guestPhoneValue && !/^05\d{8}$/.test(guestPhoneValue)) {
        showToast('رقم الجوال غير صحيح: يجب أن يبدأ بـ 05 ويتكون من 10 أرقام (مثال: 0501234567).', 'error');
        return;
      }
      if (guestIdNumber && !/^(?:\d{10}|[a-zA-Z0-9]{6,9})$/i.test(guestIdNumber)) {
        showToast('رقم الهوية الوطنية أو الإقامة (10 أرقام) أو جواز السفر (6 إلى 9 خانات) غير صحيح.', 'error');
        return;
      }
      if (!isOpenContract && totalPriceValue <= 0) {
        showToast('السعر الإجمالي يجب أن يكون أكبر من الصفر.', 'error');
        return;
      }
      if (isOpenContract && totalPriceValue < 0) {
        showToast('السعر الإجمالي لا يمكن أن يكون سالباً.', 'error');
        return;
      }
      if (paidAmountValue < 0) {
        showToast('المبلغ المدفوع لا يمكن أن يكون سالباً.', 'error');
        return;
      }
      if (!isOpenContract && paidAmountValue - totalPriceValue > 0.005) {
        showToast(`المبلغ المدفوع (${paidAmountValue} ريال) لا يمكن أن يتجاوز السعر الإجمالي (${totalPriceValue} ريال).`, 'error');
        return;
      }

      try {
        const result = await api.updateReservationReceipt({
          reservationId,
          guestName: guestNameValue,
          guestPhone: guestPhoneValue,
          guestIdNumber,
          totalPrice: totalPriceValue,
          paidAmount: paidAmountValue,
          depositAmount: depositAmountValue,
          paymentMethod: paymentMethodValue
        });

        if (result && result.success) {
          showToast('تم حفظ وتحديث بيانات السند بنجاح!', 'success');
          closeEditInvoiceModal();
          await openInvoiceModal(reservationId);
          await Promise.all([refreshOverview(), refreshRooms(), refreshReservations()]);
        } else {
          showToast(result?.error || 'فشل تحديث بيانات السند.', 'error');
        }
      } catch (error) {
        showToast(`خطأ أثناء الحفظ: ${error.message}`, 'error');
      }
    });
  }

  return { openInvoiceModal };
}