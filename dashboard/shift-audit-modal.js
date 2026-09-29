import { getLocalDateString } from './utils.js';

export function createShiftAuditModal({
  api,
  elements,
  renderReport,
  formatDateRange,
  showToast,
  printIsolatedElement,
  getTodayDate = () => getLocalDateString(),
  documentRef = document
}) {
  const { modal, openButton, closeButton, printButton, exportButton, previewButton, content } = elements;
  let currentPreset = 'today';
  let currentStartDate = null;
  let currentEndDate = null;

  function getPresetDates(preset) {
    const today = new Date();
    const todayString = getLocalDateString(today);
    switch (preset) {
      case 'today':
        return { startDate: todayString, endDate: todayString };
      case 'week': {
        const daysSinceSaturday = (today.getDay() + 1) % 7;
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - daysSinceSaturday);
        return { startDate: getLocalDateString(startOfWeek), endDate: todayString };
      }
      case 'month': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return { startDate: getLocalDateString(startOfMonth), endDate: todayString };
      }
      case 'quarter': {
        const firstQuarterMonth = Math.floor(today.getMonth() / 3) * 3;
        const startOfQuarter = new Date(today.getFullYear(), firstQuarterMonth, 1);
        return { startDate: getLocalDateString(startOfQuarter), endDate: todayString };
      }
      default:
        return { startDate: todayString, endDate: todayString };
    }
  }

  async function applyPresetDates(startDate, endDate) {
    currentStartDate = startDate;
    currentEndDate = endDate;
    await renderReport(startDate, endDate);
  }

  function ensureFilterBar() {
    let filterBar = documentRef.getElementById('shift-audit-filter-bar');
    if (!filterBar && content && content.parentNode) {
      filterBar = documentRef.createElement('div');
      filterBar.id = 'shift-audit-filter-bar';
      filterBar.className = 'no-print';
      filterBar.style.cssText = 'background: #1e293b; color: white; padding: 12px 24px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; direction: rtl;';
      filterBar.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-weight: 700; font-size: 0.85rem; color: #94a3b8;">فترة التقرير:</span>
          <div class="audit-preset-pills" style="display: inline-flex; gap: 4px; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);">
            <button type="button" class="btn-audit-preset" data-preset="today" style="border: none; background: #1a4332; color: #a7f3d0; padding: 6px 14px; border-radius: 6px; font-weight: 800; font-size: 0.82rem; cursor: pointer; transition: all 0.15s;">اليوم</button>
            <button type="button" class="btn-audit-preset" data-preset="week" style="border: none; background: transparent; color: #cbd5e1; padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.82rem; cursor: pointer; transition: all 0.15s;">هذا الأسبوع</button>
            <button type="button" class="btn-audit-preset" data-preset="month" style="border: none; background: transparent; color: #cbd5e1; padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.82rem; cursor: pointer; transition: all 0.15s;">هذا الشهر</button>
            <button type="button" class="btn-audit-preset" data-preset="quarter" style="border: none; background: transparent; color: #cbd5e1; padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.82rem; cursor: pointer; transition: all 0.15s;">هذا الربع</button>
            <button type="button" class="btn-audit-preset" data-preset="custom" style="border: none; background: transparent; color: #cbd5e1; padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 0.82rem; cursor: pointer; transition: all 0.15s;">فترة مخصصة</button>
          </div>
        </div>
        <div id="shift-audit-custom-dates" style="display: none; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 0.8rem; color: #cbd5e1;">من:</span>
          <input type="date" id="shift-audit-custom-start" style="padding: 5px 8px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: white; font-size: 0.82rem; font-family: monospace;">
          <span style="font-size: 0.8rem; color: #cbd5e1;">إلى:</span>
          <input type="date" id="shift-audit-custom-end" style="padding: 5px 8px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: white; font-size: 0.82rem; font-family: monospace;">
          <button type="button" id="btn-apply-audit-custom" class="btn btn-sm" style="background: #1a4332; color: #a7f3d0; border: 1px solid #34d399; font-weight: 800; padding: 5px 12px; border-radius: 6px; cursor: pointer;">تطبيق</button>
        </div>
      `;

      content.parentNode.insertBefore(filterBar, content);
      const presetButtons = filterBar.querySelectorAll('.btn-audit-preset');
      const customDatesBox = filterBar.querySelector('#shift-audit-custom-dates');
      const customStartInput = filterBar.querySelector('#shift-audit-custom-start');
      const customEndInput = filterBar.querySelector('#shift-audit-custom-end');
      const applyCustomButton = filterBar.querySelector('#btn-apply-audit-custom');

      presetButtons.forEach(button => {
        button.addEventListener('click', async () => {
          const preset = button.dataset.preset;
          currentPreset = preset;
          presetButtons.forEach(item => {
            const isActive = item === button;
            item.style.background = isActive ? '#1a4332' : 'transparent';
            item.style.color = isActive ? '#a7f3d0' : '#cbd5e1';
            item.style.fontWeight = isActive ? '800' : '600';
          });

          if (preset === 'custom') {
            if (customDatesBox) customDatesBox.style.display = 'flex';
            if (customStartInput && !customStartInput.value) customStartInput.value = currentStartDate || getLocalDateString();
            if (customEndInput && !customEndInput.value) customEndInput.value = currentEndDate || getLocalDateString();
          } else {
            if (customDatesBox) customDatesBox.style.display = 'none';
            const dates = getPresetDates(preset);
            await applyPresetDates(dates.startDate, dates.endDate);
          }
        });
      });

      if (applyCustomButton) {
        applyCustomButton.addEventListener('click', async () => {
          const startDate = customStartInput ? customStartInput.value : '';
          const endDate = customEndInput ? customEndInput.value : '';
          if (!startDate || !endDate) {
            showToast('يرجى تحديد تاريخ البداية والنهاية للفترة المخصصة.', 'warning');
            return;
          }
          await applyPresetDates(startDate, endDate);
        });
      }
    }
    return filterBar;
  }

  async function openShiftAuditModal(targetDateOrOptions) {
    try {
      ensureFilterBar();

      let startDate = null;
      let endDate = null;
      if (targetDateOrOptions && typeof targetDateOrOptions === 'object') {
        startDate = targetDateOrOptions.startDate || targetDateOrOptions.date;
        endDate = targetDateOrOptions.endDate || startDate;
        currentPreset = targetDateOrOptions.preset || (startDate === endDate ? 'today' : 'custom');
      } else if (typeof targetDateOrOptions === 'string' && targetDateOrOptions.trim() !== '') {
        startDate = targetDateOrOptions.trim();
        endDate = startDate;
        currentPreset = startDate === getLocalDateString() ? 'today' : 'custom';
      } else {
        currentPreset = 'today';
        const dates = getPresetDates('today');
        startDate = dates.startDate;
        endDate = dates.endDate;
      }

      currentStartDate = startDate;
      currentEndDate = endDate;
      const filterBar = documentRef.getElementById('shift-audit-filter-bar');
      if (filterBar) {
        const presetButtons = filterBar.querySelectorAll('.btn-audit-preset');
        presetButtons.forEach(button => {
          const isActive = button.dataset.preset === currentPreset;
          button.style.background = isActive ? '#1a4332' : 'transparent';
          button.style.color = isActive ? '#a7f3d0' : '#cbd5e1';
          button.style.fontWeight = isActive ? '800' : '600';
        });
        const customDatesBox = filterBar.querySelector('#shift-audit-custom-dates');
        const customStartInput = filterBar.querySelector('#shift-audit-custom-start');
        const customEndInput = filterBar.querySelector('#shift-audit-custom-end');
        if (customDatesBox) customDatesBox.style.display = currentPreset === 'custom' ? 'flex' : 'none';
        if (customStartInput) customStartInput.value = startDate;
        if (customEndInput) customEndInput.value = endDate;
      }

      await renderReport(startDate, endDate);
      if (modal) modal.style.display = 'flex';
    } catch (error) {
      console.error('Shift audit error:', error);
      showToast(`خطأ في تقرير الإقفال: ${error.message}`, 'error');
    }
  }

  function closeShiftAuditModal() {
    if (modal) modal.style.display = 'none';
    documentRef.body.classList.remove('printing-invoice', 'printing-shift-audit');
  }

  if (openButton) openButton.addEventListener('click', () => openShiftAuditModal());
  if (closeButton) closeButton.addEventListener('click', closeShiftAuditModal);
  if (modal) {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeShiftAuditModal();
    });
  }

  if (printButton) {
    printButton.addEventListener('click', () => {
      const isMultiDay = currentStartDate && currentEndDate && currentStartDate !== currentEndDate;
      const title = isMultiDay
        ? `تقرير إقفال الفترة (${formatDateRange(currentStartDate, currentEndDate)})`
        : 'تقرير إقفال الوردية والموازنة المالية';
      printIsolatedElement(content ? content.innerHTML : '', title, false);
    });
  }

  if (exportButton) {
    exportButton.addEventListener('click', async () => {
      try {
        if (!content || !content.innerHTML.trim()) {
          showToast('لا توجد بيانات تقرير لتصديرها.', 'error');
          return;
        }
        showToast('جاري إنشاء وحفظ تقرير الوردية بصيغة PDF...', 'info');
        const isMultiDay = currentStartDate && currentEndDate && currentStartDate !== currentEndDate;
        const title = isMultiDay
          ? `تقرير إقفال الفترة (${formatDateRange(currentStartDate, currentEndDate)})`
          : 'تقرير إقفال الوردية والموازنة المالية';
        const defaultFilename = isMultiDay
          ? `shift_audit_${currentStartDate}_to_${currentEndDate}.pdf`
          : `shift_audit_${getTodayDate()}.pdf`;
        const result = await api.printToPdf({ html: content.innerHTML, title, defaultFilename });
        if (result && result.canceled) return;
        if (result && result.success) {
          showToast(`تم تصدير وحفظ تقرير الوردية بنجاح في: ${result.filePath}`, 'success');
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
        if (!content || !content.innerHTML.trim()) {
          showToast('لا توجد بيانات تقرير للمعاينة.', 'error');
          return;
        }
        const isMultiDay = currentStartDate && currentEndDate && currentStartDate !== currentEndDate;
        const title = isMultiDay
          ? `معاينة تقرير إقفال الفترة (${formatDateRange(currentStartDate, currentEndDate)})`
          : 'معاينة تقرير إقفال الوردية والموازنة المالية';
        await api.openPrintPreviewWindow({ html: content.innerHTML, title });
      } catch (error) {
        showToast(`تعذر فتح نافذة المعاينة: ${error.message}`, 'error');
      }
    });
  }

  return { openShiftAuditModal };
}