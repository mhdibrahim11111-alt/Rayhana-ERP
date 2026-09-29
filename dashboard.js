import { api } from './dashboard/api.js';
import { getBookingTypeBadge, getPaymentStatusBadge, getReservationStatusBadge, getRoomStatusBadge } from './dashboard/badges.js';
import { STORAGE_KEYS } from './dashboard/constants.js';
import { createNavigation } from './dashboard/navigation.js';
import { createEditGuestModal } from './dashboard/guest-modal.js';
import { createEditRoomModal } from './dashboard/room-modal.js';
import { createFactoryResetModal } from './dashboard/factory-reset-modal.js';
import { createAddPaymentModal } from './dashboard/payment-modal.js';
import { createRoomRevenueModal } from './dashboard/room-revenue-modal.js';
import { dashboardState } from './dashboard/state.js';
import { showConfirmDialog, showPromptDialog, showToast } from './dashboard/ui.js';
import { escapeHtml, getLocalDateString } from './dashboard/utils.js';

/**
 * نظام أحمد لإدارة الفنادق (Ahmed Hotel ERP)
 * Complete Interactive Multi-View Dashboard Script (dashboard.js)
 * Includes: RBAC, Chart.js Analytics, SheetJS Excel Import/Export
 */

(function () {
  'use strict';

  // Navigation Links & Views
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
  const navAdmin = document.getElementById('nav-admin');
  const navLogs = document.getElementById('nav-logs');
  const viewSections = {
    overview: document.getElementById('view-overview'),
    reservations: document.getElementById('view-reservations'),
    rooms: document.getElementById('view-rooms'),
    guests: document.getElementById('view-guests'),
    admin: document.getElementById('view-admin'),
    logs: document.getElementById('view-logs')
  };
  const topbarHeading = document.getElementById('topbar-heading');
  const topbarSubheading = document.getElementById('topbar-subheading');

  // Header Elements
  const userDisplayName = document.getElementById('user-display-name');
  const userDisplayRole = document.getElementById('user-display-role');
  const btnLogout = document.getElementById('btn-logout');
  const btnOpenDb = document.getElementById('btn-open-db');
  const dbFileName = document.getElementById('db-file-name');

  // Overview Elements
  const statAvailableRooms = document.getElementById('stat-available-rooms');
  const statOccupiedRooms = document.getElementById('stat-occupied-rooms');
  const statCleaningRooms = document.getElementById('stat-cleaning-rooms');
  const statTotalReservations = document.getElementById('stat-total-reservations');

  // Today's Checkouts Widget Elements
  const todayCheckoutsTableBody = document.getElementById('today-checkouts-table-body');
  const todayCheckoutsEmpty = document.getElementById('today-checkouts-empty');
  const todayCheckoutsCountBadge = document.getElementById('today-checkouts-count-badge');
  const todayDateBadge = document.getElementById('today-date-badge');
  const btnRefreshCheckouts = document.getElementById('btn-refresh-checkouts');

  // Reservation Form Elements
  const reservationForm = document.getElementById('reservation-form');
  const guestNameInput = document.getElementById('guest-name');
  const guestPhoneInput = document.getElementById('guest-phone');
  const guestPhoneError = document.getElementById('guest-phone-error');
  const guestIdNumberInput = document.getElementById('guest-id-number');
  const guestIdError = document.getElementById('guest-id-error');
  const roomSelect = document.getElementById('room-select');
  const bookingTypeSelect = document.getElementById('booking-type');
  const checkInInput = document.getElementById('check-in-date');
  const checkOutInput = document.getElementById('check-out-date');
  const nightlyRateInput = document.getElementById('nightly-rate-input');
  const discountAmountInput = document.getElementById('discount-amount-input');
  const discountReasonInput = document.getElementById('discount-reason-input');
  const roomDefaultRateBadge = document.getElementById('room-default-rate-badge');
  const priceCalculationBreakdown = document.getElementById('price-calculation-breakdown');
  const totalPriceInput = document.getElementById('total-price');
  const paymentMethodSelect = document.getElementById('payment-method');
  const paidAmountInput = document.getElementById('paid-amount');
  const depositAmountInput = document.getElementById('deposit-amount');
  const remainingBalanceVal = document.getElementById('remaining-balance-val');
  const btnClearForm = document.getElementById('btn-clear-form');
  const autofillGuestStatus = document.getElementById('autofill-guest-status');
  const autofillGuestMsg = document.getElementById('autofill-guest-msg');
  const autofillGuestBadge = document.getElementById('autofill-guest-badge');
  const bannedGuestWarning = document.getElementById('banned-guest-warning');
  const bannedGuestMsg = document.getElementById('banned-guest-msg');
  const overviewTableBody = document.getElementById('overview-table-body');
  const overviewEmpty = document.getElementById('overview-empty');

  // New Reservation Modal Elements
  const newReservationModal = document.getElementById('new-reservation-modal');
  const btnOpenNewReservationModal = document.getElementById('btn-open-new-reservation-modal');
  const btnCloseNewReservation = document.getElementById('btn-close-new-reservation');
  const btnResNewBooking = document.getElementById('btn-res-new-booking');

  // Topbar Actions (Backup, Restore, Shift Audit)
  const btnOpenShiftAudit = document.getElementById('btn-open-shift-audit');
  const btnBackupDb = document.getElementById('btn-backup-db');
  const btnRestoreDb = document.getElementById('btn-restore-db');

  // Daily Automated Backup (12:00 AM) Modal Elements
  const btnDailyBackupModal = document.getElementById('btn-daily-backup-modal');
  const dailyBackupModal = document.getElementById('daily-backup-modal');
  const btnCloseDailyBackup = document.getElementById('btn-close-daily-backup');
  const btnOpenDailyBackupsFolder = document.getElementById('btn-open-daily-backups-folder');
  const btnChangeDailyBackupFolder = document.getElementById('btn-change-daily-backup-folder');
  const btnResetDailyBackupFolder = document.getElementById('btn-reset-daily-backup-folder');
  const dailyBackupFolderTypeBadge = document.getElementById('daily-backup-folder-type-badge');
  const dailyBackupTableCountBadge = document.getElementById('daily-backup-table-count-badge');
  const btnTriggerDailyBackupNow = document.getElementById('btn-trigger-daily-backup-now');
  const btnRefreshDailyBackups = document.getElementById('btn-refresh-daily-backups');
  const dailyBackupStatusBadge = document.getElementById('daily-backup-status-badge');
  const dailyBackupNextRun = document.getElementById('daily-backup-next-run');
  const dailyBackupLastTime = document.getElementById('daily-backup-last-time');
  const dailyBackupLastFile = document.getElementById('daily-backup-last-file');
  const dailyBackupTotalCount = document.getElementById('daily-backup-total-count');
  const dailyBackupFolderPathDisplay = document.getElementById('daily-backup-folder-path-display');
  const dailyBackupsTableBody = document.getElementById('daily-backups-table-body');
  const dailyBackupsEmpty = document.getElementById('daily-backups-empty');

  // Invoice Modal
  let currentInvoiceReservationId = null;
  let currentInvoiceData = null;
  const invoiceModal = document.getElementById('invoice-modal');
  const btnCloseInvoiceModal = document.getElementById('btn-close-invoice-modal');
  const btnTriggerPrintInvoice = document.getElementById('btn-trigger-print-invoice');
  const btnExportPdfInvoice = document.getElementById('btn-export-pdf-invoice');
  const btnPreviewWindowInvoice = document.getElementById('btn-preview-window-invoice');
  const btnEditInvoice = document.getElementById('btn-edit-invoice');
  const invoicePrintableArea = document.getElementById('invoice-printable-area');

  // Room Revenue Modal
  const roomRevenueModal = document.getElementById('room-revenue-modal');
  const btnCloseRoomRevenueModal = document.getElementById('btn-close-room-revenue-modal');
  const roomRevenueContent = document.getElementById('room-revenue-content');
  const roomRevenueModalTitle = document.getElementById('room-revenue-modal-title');

  // Edit Invoice Modal Elements
  const editInvoiceModal = document.getElementById('edit-invoice-modal');
  const btnCloseEditInvoice = document.getElementById('btn-close-edit-invoice');
  const btnCancelEditInv = document.getElementById('btn-cancel-edit-inv');
  const editInvoiceForm = document.getElementById('edit-invoice-form');
  const editInvResId = document.getElementById('edit-inv-res-id');
  const editInvGuestName = document.getElementById('edit-inv-guest-name');
  const editInvGuestPhone = document.getElementById('edit-inv-guest-phone');
  const editInvGuestId = document.getElementById('edit-inv-guest-id');
  const editInvTotalPrice = document.getElementById('edit-inv-total-price');
  const editInvPaidAmount = document.getElementById('edit-inv-paid-amount');
  const editInvDepositAmount = document.getElementById('edit-inv-deposit-amount');
  const editInvPaymentMethod = document.getElementById('edit-inv-payment-method');
  const editInvRemainingPreview = document.getElementById('edit-inv-remaining-preview');

  // Edit Guest Modal Elements
  const editGuestModal = document.getElementById('edit-guest-modal');
  const btnCloseEditGuest = document.getElementById('btn-close-edit-guest');
  const btnCancelEditGuest = document.getElementById('btn-cancel-edit-guest');
  const editGuestForm = document.getElementById('edit-guest-form');
  const editGuestId = document.getElementById('edit-guest-id');
  const editGuestName = document.getElementById('edit-guest-name');
  const editGuestPhone = document.getElementById('edit-guest-phone');
  const editGuestIdNumber = document.getElementById('edit-guest-id-number');
  const btnSaveEditGuest = document.getElementById('btn-save-edit-guest');

  // Shift Audit Modal
  const shiftAuditModal = document.getElementById('shift-audit-modal');
  const btnCloseShiftAudit = document.getElementById('btn-close-shift-audit');
  const btnPrintShiftAudit = document.getElementById('btn-print-shift-audit');
  const btnExportPdfShiftAudit = document.getElementById('btn-export-pdf-shift-audit');
  const btnPreviewWindowShiftAudit = document.getElementById('btn-preview-window-shift-audit');
  const shiftAuditContent = document.getElementById('shift-audit-content');

  // Extend Stay Modal Elements
  const extendStayModal = document.getElementById('extend-stay-modal');
  const btnCloseExtendStay = document.getElementById('btn-close-extend-stay');
  const btnCancelExtendStay = document.getElementById('btn-cancel-extend-stay');
  const extendStayForm = document.getElementById('extend-stay-form');
  const extendResId = document.getElementById('extend-res-id');
  const extendGuestNamePreview = document.getElementById('extend-guest-name-preview');
  const extendRoomPreview = document.getElementById('extend-room-preview');
  const extendCurrentCheckoutPreview = document.getElementById('extend-current-checkout-preview');
  const extendNightlyRatePreview = document.getElementById('extend-nightly-rate-preview');
  const extendNewCheckoutDate = document.getElementById('extend-new-checkout-date');
  const extendExtraNightsPreview = document.getElementById('extend-extra-nights-preview');
  const extendAdditionalCostPreview = document.getElementById('extend-additional-cost-preview');
  const extendNewTotalPreview = document.getElementById('extend-new-total-preview');
  const extendCollectNowToggle = document.getElementById('extend-collect-now-toggle');
  const extendPaymentFields = document.getElementById('extend-payment-fields');
  const extendSettleAmount = document.getElementById('extend-settle-amount');
  const extendPaymentMethod = document.getElementById('extend-payment-method');
  const btnConfirmExtendStay = document.getElementById('btn-confirm-extend-stay');
  const extendNightlyRateInput = document.getElementById('extend-nightly-rate-input');
  const extendDiscountInput = document.getElementById('extend-discount-input');
  const extendCalcRatePreview = document.getElementById('extend-calc-rate-preview');
  const extendDiscountBadge = document.getElementById('extend-discount-badge');

  // All Reservations Elements
  const allReservationsTableBody = document.getElementById('all-reservations-table-body');
  const allReservationsEmpty = document.getElementById('all-reservations-empty');
  const searchAllReservations = document.getElementById('search-all-reservations');
  const resFilterTabs = document.querySelectorAll('#res-filter-tabs .filter-tab-btn');
  const btnExportReservationsExcel = document.getElementById('btn-export-reservations-excel');
  const inputImportReservationsExcel = document.getElementById('input-import-reservations-excel');

  // Rooms Elements
  const roomsGridContainer = document.getElementById('rooms-grid-container');
  const roomsFilterTabs = document.querySelectorAll('#rooms-filter-tabs .filter-tab-btn');
  const searchRoomsInput = document.getElementById('search-rooms');
  const roomsBookingTypeTabs = document.querySelectorAll('#rooms-booking-type-tabs .filter-tab-btn');
  const btnToggleAddRoom = document.getElementById('btn-toggle-add-room');
  const addRoomPanel = document.getElementById('add-room-panel');
  const addRoomForm = document.getElementById('add-room-form');
  const btnCancelAddRoom = document.getElementById('btn-cancel-add-room');
  const newRoomNumber = document.getElementById('new-room-number');
  const newRoomType = document.getElementById('new-room-type');
  const newRoomPrice = document.getElementById('new-room-price');
  const newRoomStatus = document.getElementById('new-room-status');

  // Edit Room Modal Elements
  const editRoomModal = document.getElementById('edit-room-modal');
  const editRoomForm = document.getElementById('edit-room-form');
  const editRoomId = document.getElementById('edit-room-id');
  const editRoomNumber = document.getElementById('edit-room-number');
  const editRoomType = document.getElementById('edit-room-type');
  const editRoomPrice = document.getElementById('edit-room-price');
  const editRoomStatus = document.getElementById('edit-room-status');
  const editRoomStatusLockedHint = document.getElementById('edit-room-status-locked-hint');
  const btnCloseEditRoomModal = document.getElementById('btn-close-edit-room-modal');
  const btnCancelEditRoom = document.getElementById('btn-cancel-edit-room');
  const btnDeleteRoom = document.getElementById('btn-delete-room');

  // Guests Elements
  const guestsTableBody = document.getElementById('guests-table-body');
  const guestsEmpty = document.getElementById('guests-empty');
  const searchGuests = document.getElementById('search-guests');
  const guestsBanFilterTabs = document.querySelectorAll('#guests-ban-filter-tabs .filter-tab-btn');
  const guestsCountBadge = document.getElementById('guests-count-badge');
  const btnExportGuestsExcel = document.getElementById('btn-export-guests-excel');
  const inputImportGuestsExcel = document.getElementById('input-import-guests-excel');
  const btnGuestsPrevPage = document.getElementById('btn-guests-prev-page');
  const btnGuestsNextPage = document.getElementById('btn-guests-next-page');
  const guestsCurrentPageEl = document.getElementById('guests-current-page');
  const guestsTotalPagesEl = document.getElementById('guests-total-pages');
  const guestsPageRangeEl = document.getElementById('guests-page-range');
  const guestsTotalCountEl = document.getElementById('guests-total-count');
  const btnToggleAddCustomer = document.getElementById('btn-toggle-add-customer');
  const addCustomerPanel = document.getElementById('add-customer-panel');
  const addCustomerForm = document.getElementById('add-customer-form');
  const btnCancelAddCustomer = document.getElementById('btn-cancel-add-customer');
  const newCustomerName = document.getElementById('new-customer-name');
  const newCustomerPhone = document.getElementById('new-customer-phone');
  const newCustomerId = document.getElementById('new-customer-id');

  // Admin Panel Elements
  const addUserForm = document.getElementById('add-user-form');
  const newUsernameInput = document.getElementById('new-username');
  const newUserPasswordInput = document.getElementById('new-user-password');
  const newUserRoleSelect = document.getElementById('new-user-role');
  const updatePasswordForm = document.getElementById('update-password-form');
  const currentAdminNewPasswordInput = document.getElementById('current-admin-new-password');
  const usersTableBody = document.getElementById('users-table-body');
  const btnRefreshUsers = document.getElementById('btn-refresh-users');

  // Employee Logs Elements
  const logsTableBody = document.getElementById('logs-table-body');
  const logsEmpty = document.getElementById('logs-empty');
  const searchLogs = document.getElementById('search-logs');
  const logsCountBadge = document.getElementById('logs-count-badge');
  const btnRefreshLogs = document.getElementById('btn-refresh-logs');

  // Set default dates
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  checkInInput.value = getLocalDateString(today);
  checkOutInput.value = getLocalDateString(tomorrow);

  // --- MID-STAY PRO-RATED CANCELLATION MODAL WITH DEPARTURE DATE & ADMIN OVERRIDE ---
  function showMidStayCancelModal(targetRes) {
    return new Promise((resolve) => {
      let modal = document.getElementById('midstay-cancel-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'midstay-cancel-modal';
        modal.className = 'modal-backdrop';
        modal.style.cssText = 'display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); z-index: 1000000; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;';
        document.body.appendChild(modal);
      }

      let nightlyRate = Number(targetRes.price_per_night || 0);
      if (!nightlyRate && dashboardState.roomsCache && dashboardState.roomsCache.length > 0) {
        const rm = dashboardState.roomsCache.find(r => r.id === targetRes.room_id || r.room_number === targetRes.room_number);
        if (rm && rm.price_per_night) nightlyRate = Number(rm.price_per_night);
      }

      const todayStr = getLocalDateString();
      const checkInDate = targetRes.check_in_date || todayStr;
      const activeRole = localStorage.getItem(STORAGE_KEYS.currentUserRole) || (dashboardState.currentUser ? dashboardState.currentUser.role : null);
      const isAdmin = activeRole === 'Admin';

      modal.innerHTML = `
        <div class="modal-glass-container" style="background: #ffffff; border-radius: 16px; max-width: 540px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; margin: auto; border: 1px solid #e2e8f0; direction: rtl; text-align: right;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1a4332 0%, #112d22 100%); color: white; padding: 16px 22px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(239, 68, 68, 0.2); color: #fca5a5; display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>
              <div>
                <h3 style="font-size: 1.1rem; font-weight: 800; margin: 0; color: #ffffff;">إلغاء حجز أثناء الإقامة وتصفية الحساب</h3>
                <p style="font-size: 0.76rem; color: #a7f3d0; margin: 2px 0 0;">الحجز #${targetRes.id} • ${escapeHtml(targetRes.guest_name || 'نزيل')}</p>
              </div>
            </div>
            <button id="btn-midstay-close" type="button" style="background: rgba(255,255,255,0.15); color: white; border: none; font-size: 1.3rem; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer;">&times;</button>
          </div>

          <!-- Body -->
          <div style="padding: 20px; max-height: calc(85vh - 75px); overflow-y: auto;">
            <!-- Info Strip -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.84rem;">
              <div><span style="color: #64748b;">الوحدة:</span> <strong>غرفة ${escapeHtml(targetRes.room_number || '-')}</strong> <span style="font-size: 0.74rem; color: #94a3b8;">(${escapeHtml(targetRes.room_type || '')})</span></div>
              <div><span style="color: #64748b;">تاريخ الوصول:</span> <strong style="font-family: monospace;">${escapeHtml(checkInDate)}</strong></div>
              <div><span style="color: #64748b;">سعر الليلة:</span> <strong>${Number(nightlyRate).toLocaleString()} ريال</strong></div>
              <div><span style="color: #64748b;">المبلغ المدفوع:</span> <strong style="color: #059669;">${Number(targetRes.paid_amount || 0).toLocaleString()} ريال</strong></div>
            </div>

            <!-- Departure Date Input -->
            <div style="margin-bottom: 16px;">
              <label for="midstay-dep-date" style="display: block; font-weight: 700; font-size: 0.88rem; color: #1e293b; margin-bottom: 6px;">
                تاريخ المغادرة الفعلي:
              </label>
              <input type="date" id="midstay-dep-date" value="${todayStr}" min="${checkInDate}" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-weight: 700; font-size: 0.95rem; font-family: monospace; box-sizing: border-box;">
              <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px;">افتراضياً تاريخ اليوم. يمكنك تعديل تاريخ المغادرة إذا غادر النزيل في تاريخ سابق.</div>
            </div>

            <!-- Auto Calculation Card -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.85rem;">
                <span style="color: #166534;">عدد الليالي المحتسبة:</span>
                <strong id="midstay-days-count" style="color: #166534; font-size: 1rem;">-</strong>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                <span style="color: #166534;">قيمة الإقامة المحتسبة تلقائياً:</span>
                <strong id="midstay-auto-charge" style="color: #166534; font-size: 1.05rem; font-family: monospace;">- ريال</strong>
              </div>
            </div>

            ${isAdmin ? `
            <!-- Admin Override Section (Admin Only) -->
            <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 10px; padding: 14px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <label for="midstay-override-input" style="font-weight: 700; font-size: 0.86rem; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 6px;">
                  <span style="background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 800;">مدير النظام فقط</span>
                  تعديل المبلغ المستحق يدوياً (اختياري):
                </label>
              </div>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0 0 8px 0;">يمكنك تجاوز الحساب التلقائي وتحديد مبلغ إجمالي مخصص للإقامة. سيتم توثيق الحساب الأصلي للتدقيق.</p>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="number" id="midstay-override-input" step="0.01" min="0" placeholder="اتركه فارغاً للاعتماد على الحساب التلقائي" style="flex: 1; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-weight: 700; font-size: 0.95rem; box-sizing: border-box;">
                <span style="font-weight: 700; color: #64748b; font-size: 0.88rem;">ريال</span>
              </div>
            </div>
            ` : ''}

            <!-- Settlement Outcome Preview -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.9rem;">
                <span style="font-weight: 700; color: #1e293b;">المبلغ الإجمالي المعتمد للإقامة:</span>
                <strong id="midstay-final-total" style="font-size: 1.1rem; color: #1e293b;">- ريال</strong>
              </div>
              <div id="midstay-outcome-badge" style="padding: 10px 14px; border-radius: 8px; font-weight: 700; font-size: 0.88rem; text-align: center;">
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div style="padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
            <button id="btn-midstay-cancel" type="button" class="btn btn-secondary" style="flex: 1; padding: 10px; font-weight: 700;">تراجع</button>
            <button id="btn-midstay-confirm" type="button" class="btn btn-danger" style="flex: 1; padding: 10px; font-weight: 800; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer;">تأكيد الإلغاء والتصفية</button>
          </div>
        </div>
      `;

      const depInput = modal.querySelector('#midstay-dep-date');
      const overrideInput = modal.querySelector('#midstay-override-input');
      const daysEl = modal.querySelector('#midstay-days-count');
      const autoChargeEl = modal.querySelector('#midstay-auto-charge');
      const finalTotalEl = modal.querySelector('#midstay-final-total');
      const outcomeEl = modal.querySelector('#midstay-outcome-badge');
      const btnClose = modal.querySelector('#btn-midstay-close');
      const btnCancel = modal.querySelector('#btn-midstay-cancel');
      const btnConfirm = modal.querySelector('#btn-midstay-confirm');

      function updateCalculations() {
        const depVal = (depInput && depInput.value) ? depInput.value : todayStr;
        const d1 = new Date(checkInDate + 'T00:00:00');
        const d2 = new Date(depVal + 'T00:00:00');
        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const days = Math.max(1, diffDays);

        const autoCharge = Math.round(days * nightlyRate * 100) / 100;
        if (daysEl) daysEl.textContent = `${days} ليلة`;
        if (autoChargeEl) autoChargeEl.textContent = `${autoCharge.toLocaleString()} ريال`;

        let finalCharge = autoCharge;
        if (isAdmin && overrideInput && overrideInput.value.trim() !== '') {
          const num = Number(overrideInput.value);
          if (!isNaN(num)) {
            finalCharge = Math.max(0, Math.round(num * 100) / 100);
          }
        }

        if (finalTotalEl) finalTotalEl.textContent = `${finalCharge.toLocaleString()} ريال`;

        const paid = Number(targetRes.paid_amount || 0);
        const refund = Math.max(0, Math.round((paid - finalCharge) * 100) / 100);
        const owed = Math.max(0, Math.round((finalCharge - paid) * 100) / 100);

        if (outcomeEl) {
          if (refund > 0) {
            outcomeEl.style.background = '#ecfdf5';
            outcomeEl.style.color = '#065f46';
            outcomeEl.style.border = '1px solid #6ee7b7';
            outcomeEl.textContent = `المبلغ المستحق إرجاعه للنزيل (مسترد): ${refund.toLocaleString()} ريال`;
          } else if (owed > 0) {
            outcomeEl.style.background = '#fffbeb';
            outcomeEl.style.color = '#92400e';
            outcomeEl.style.border = '1px solid #fde68a';
            outcomeEl.textContent = `المبلغ المتبقي للتحصيل من النزيل: ${owed.toLocaleString()} ريال`;
          } else {
            outcomeEl.style.background = '#f0f9ff';
            outcomeEl.style.color = '#0369a1';
            outcomeEl.style.border = '1px solid #bae6fd';
            outcomeEl.textContent = `الحساب متوازن بالكامل (المبلغ المدفوع يغطي الإقامة تماماً)`;
          }
        }
      }

      const cleanup = (result) => {
        modal.style.display = 'none';
        if (depInput) depInput.removeEventListener('input', updateCalculations);
        if (overrideInput) overrideInput.removeEventListener('input', updateCalculations);
        if (btnClose) btnClose.removeEventListener('click', onCancel);
        if (btnCancel) btnCancel.removeEventListener('click', onCancel);
        if (btnConfirm) btnConfirm.removeEventListener('click', onConfirm);
        modal.removeEventListener('click', onBackdrop);
        document.removeEventListener('keydown', onKeyDown);
        window.focus();
        resolve(result);
      };

      const onConfirm = () => {
        let depVal = (depInput && depInput.value) ? depInput.value : todayStr;
        if (checkInDate && depVal < checkInDate) {
          depVal = checkInDate;
        }

        let overrideVal = undefined;
        if (isAdmin && overrideInput && overrideInput.value.trim() !== '') {
          const num = Number(overrideInput.value);
          if (!isNaN(num)) {
            overrideVal = Math.max(0, Math.round(num * 100) / 100);
          }
        }

        cleanup({
          confirmed: true,
          actualDepartureDate: depVal,
          manualOverrideAmount: overrideVal
        });
      };

      const onCancel = () => cleanup({ confirmed: false });
      const onBackdrop = (e) => {
        if (e.target === modal) cleanup({ confirmed: false });
      };
      const onKeyDown = (e) => {
        if (e.key === 'Escape') cleanup({ confirmed: false });
      };

      if (depInput) depInput.addEventListener('input', updateCalculations);
      if (overrideInput) overrideInput.addEventListener('input', updateCalculations);
      if (btnClose) btnClose.addEventListener('click', onCancel);
      if (btnCancel) btnCancel.addEventListener('click', onCancel);
      if (btnConfirm) btnConfirm.addEventListener('click', onConfirm);
      modal.addEventListener('click', onBackdrop);
      document.addEventListener('keydown', onKeyDown);

      modal.style.display = 'flex';
      updateCalculations();
    });
  }

  const navigation = createNavigation({
    navLinks,
    navAdmin,
    navLogs,
    viewSections,
    topbarHeading,
    topbarSubheading,
    getActiveRole: () => localStorage.getItem(STORAGE_KEYS.currentUserRole) || (dashboardState.currentUser ? dashboardState.currentUser.role : null),
    showToast,
    loadViews: {
      overview: loadOverviewData,
      reservations: loadReservationsData,
      rooms: loadRoomsData,
      guests: loadGuestsData,
      admin: loadAdminData,
      logs: loadLogsData
    }
  });
  window.switchView = navigation.switchView;

  // --- AUTO CALCULATE TOTAL PRICE & REMAINING BALANCE ---
  let isPaidAmountCustomized = false;

  function updateRemainingBalance() {
    if (!totalPriceInput || !paidAmountInput || !remainingBalanceVal) return;
    const total = parseFloat(totalPriceInput.value) || 0;
    const paid = parseFloat(paidAmountInput.value) || 0;
    const bType = bookingTypeSelect ? bookingTypeSelect.value : 'عادي';

    if (bType === 'عقد مفتوح') {
      const remaining = total - paid;
      if (remaining < -0.005) {
        remainingBalanceVal.textContent = `رصيد دائن: ${Math.abs(remaining).toFixed(2)} ريال`;
        remainingBalanceVal.style.color = '#2563eb';
      } else {
        remainingBalanceVal.textContent = `${Math.max(0, remaining).toFixed(2)} ريال`;
        remainingBalanceVal.style.color = remaining > 0 ? '#dc2626' : '#059669';
      }
    } else {
      const remaining = Math.max(0, total - paid);
      remainingBalanceVal.textContent = `${remaining.toFixed(2)} ريال`;
      remainingBalanceVal.style.color = remaining > 0 ? '#dc2626' : '#059669';
    }
  }

  function handleBookingTypeChange() {
    const bType = bookingTypeSelect ? bookingTypeSelect.value : 'عادي';
    const checkOutStar = document.getElementById('check-out-required-star');
    const checkOutHint = document.getElementById('check-out-open-hint');
    const priceHint = document.getElementById('total-price-open-hint');

    if (bType === 'عقد مفتوح') {
      if (checkOutInput) {
        checkOutInput.value = '';
        checkOutInput.removeAttribute('required');
        checkOutInput.disabled = true;
      }
      if (checkOutStar) checkOutStar.style.display = 'none';
      if (checkOutHint) checkOutHint.style.display = 'block';
      if (totalPriceInput) {
        totalPriceInput.removeAttribute('required');
        totalPriceInput.value = '0.00';
      }
      if (priceHint) priceHint.style.display = 'block';
      isPaidAmountCustomized = false;
      updateRemainingBalance();
    } else if (bType === 'حجز شهري') {
      if (checkOutInput) {
        checkOutInput.disabled = false;
        checkOutInput.setAttribute('required', 'required');
      }
      if (checkOutStar) checkOutStar.style.display = 'inline';
      if (checkOutHint) checkOutHint.style.display = 'none';
      if (totalPriceInput) {
        totalPriceInput.setAttribute('required', 'required');
      }
      if (priceHint) priceHint.style.display = 'none';

      // Auto-fill checkout date to +30 days
      if (checkInInput && checkInInput.value) {
        const [y, m, d] = checkInInput.value.split('-').map(Number);
        const outDate = new Date(y, m - 1, d + 30);
        checkOutInput.value = getLocalDateString(outDate);
      }

      // Authoritatively calculate 30 days price from room rate
      const selectedOption = roomSelect ? roomSelect.options[roomSelect.selectedIndex] : null;
      const pricePerNight = selectedOption && selectedOption.dataset.price ? parseFloat(selectedOption.dataset.price) || 0 : 0;
      totalPriceInput.value = (pricePerNight * 30).toFixed(2);

      if (paidAmountInput && (!isPaidAmountCustomized || !paidAmountInput.value || parseFloat(paidAmountInput.value) === 0)) {
        paidAmountInput.value = totalPriceInput.value;
      }
      updateRemainingBalance();
    } else {
      // Normal booking ('عادي')
      if (checkOutInput) {
        checkOutInput.disabled = false;
        checkOutInput.setAttribute('required', 'required');
      }
      if (checkOutStar) checkOutStar.style.display = 'inline';
      if (checkOutHint) checkOutHint.style.display = 'none';
      if (totalPriceInput) {
        totalPriceInput.setAttribute('required', 'required');
      }
      if (priceHint) priceHint.style.display = 'none';

      // Restore checkout date if empty
      if (checkOutInput && !checkOutInput.value && checkInInput && checkInInput.value) {
        const [y, m, d] = checkInInput.value.split('-').map(Number);
        const outDate = new Date(y, m - 1, d + 1);
        checkOutInput.value = getLocalDateString(outDate);
      }

      calculatePrice(false);
    }
  }

  if (bookingTypeSelect) {
    bookingTypeSelect.addEventListener('change', handleBookingTypeChange);
  }

  function calculatePrice(forceSyncPaid = false) {
    const bType = bookingTypeSelect ? bookingTypeSelect.value : 'عادي';

    const selectedOption = roomSelect ? roomSelect.options[roomSelect.selectedIndex] : null;
    const defaultRoomPrice = (selectedOption && selectedOption.dataset.price) ? parseFloat(selectedOption.dataset.price) || 0 : 0;

    if (roomDefaultRateBadge) {
      if (defaultRoomPrice > 0) {
        roomDefaultRateBadge.textContent = `(الأساسي: ${defaultRoomPrice.toLocaleString()} ريال)`;
      } else {
        roomDefaultRateBadge.textContent = '';
      }
    }

    // Determine effective nightly price
    let effectiveRate = defaultRoomPrice;
    if (nightlyRateInput && nightlyRateInput.value !== '') {
      const parsedRate = parseFloat(nightlyRateInput.value);
      if (!isNaN(parsedRate) && parsedRate >= 0) {
        effectiveRate = parsedRate;
      }
    } else if (nightlyRateInput && defaultRoomPrice > 0) {
      nightlyRateInput.value = defaultRoomPrice;
      effectiveRate = defaultRoomPrice;
    }

    const discount = (discountAmountInput && discountAmountInput.value !== '') ? Math.max(0, parseFloat(discountAmountInput.value) || 0) : 0;

    if (bType === 'عقد مفتوح') {
      if (priceCalculationBreakdown) {
        if (effectiveRate > 0) {
          priceCalculationBreakdown.style.display = 'inline';
          priceCalculationBreakdown.textContent = `سعر الليلة المعتمد: ${effectiveRate} ريال`;
        } else {
          priceCalculationBreakdown.style.display = 'none';
        }
      }
      updateRemainingBalance();
      return;
    }

    if (bType === 'حجز شهري') {
      if (checkInInput.value) {
        const [y, m, d] = checkInInput.value.split('-').map(Number);
        const outDate = new Date(y, m - 1, d + 30);
        checkOutInput.value = getLocalDateString(outDate);
      }
      const subtotal = effectiveRate * 30;
      const netTotal = Math.max(0, subtotal - discount);
      totalPriceInput.value = netTotal.toFixed(2);

      if (priceCalculationBreakdown) {
        if (discount > 0) {
          priceCalculationBreakdown.style.display = 'inline';
          priceCalculationBreakdown.textContent = `(قبل الخصم: ${subtotal.toFixed(2)} - خصم: ${discount.toFixed(2)})`;
        } else {
          priceCalculationBreakdown.style.display = 'none';
        }
      }

      if (paidAmountInput) {
        if (forceSyncPaid || !isPaidAmountCustomized || !paidAmountInput.value || parseFloat(paidAmountInput.value) === 0) {
          paidAmountInput.value = totalPriceInput.value;
        }
      }
      updateRemainingBalance();
      return;
    }

    // Normal booking ('عادي')
    let nights = 1;
    if (checkInInput.value && checkOutInput.value) {
      const [y1, m1, day1] = checkInInput.value.split('-').map(Number);
      const [y2, m2, day2] = checkOutInput.value.split('-').map(Number);
      const diffDays = Math.round((Date.UTC(y2, m2 - 1, day2) - Date.UTC(y1, m1 - 1, day1)) / 86400000);
      nights = diffDays > 0 ? diffDays : 1;
    }

    const subtotal = nights * effectiveRate;
    const netTotal = Math.max(0, subtotal - discount);
    totalPriceInput.value = netTotal.toFixed(2);

    if (priceCalculationBreakdown) {
      if (discount > 0) {
        priceCalculationBreakdown.style.display = 'inline';
        priceCalculationBreakdown.textContent = `(قبل الخصم: ${subtotal.toFixed(2)} - خصم: ${discount.toFixed(2)})`;
      } else {
        priceCalculationBreakdown.style.display = 'none';
      }
    }

    // Always synchronize المبلغ المدفوع مقدماً when changing rooms or if not manually customized
    if (paidAmountInput) {
      if (forceSyncPaid || !isPaidAmountCustomized || !paidAmountInput.value || parseFloat(paidAmountInput.value) === 0) {
        paidAmountInput.value = totalPriceInput.value;
      }
    }
    updateRemainingBalance();
  }

  // When room is changed, always update both total price, nightly rate, and المبلغ المدفوع مقدماً to the new room's price
  roomSelect.addEventListener('change', () => {
    isPaidAmountCustomized = false;
    const selectedOption = roomSelect.options[roomSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.price && nightlyRateInput) {
      nightlyRateInput.value = selectedOption.dataset.price;
    }
    calculatePrice(true);
  });

  if (nightlyRateInput) {
    nightlyRateInput.addEventListener('input', () => {
      calculatePrice(false);
    });
  }

  if (discountAmountInput) {
    discountAmountInput.addEventListener('input', () => {
      calculatePrice(false);
    });
  }

  // When dates change, update paid amount if user hasn't explicitly customized a partial amount
  checkInInput.addEventListener('change', () => {
    calculatePrice(!isPaidAmountCustomized);
  });
  checkOutInput.addEventListener('change', () => {
    calculatePrice(!isPaidAmountCustomized);
  });

  if (totalPriceInput) {
    totalPriceInput.addEventListener('input', () => {
      if (!isPaidAmountCustomized && paidAmountInput) {
        paidAmountInput.value = totalPriceInput.value;
      }
      updateRemainingBalance();
    });
  }

  if (paidAmountInput) {
    paidAmountInput.addEventListener('input', () => {
      const currentTotal = parseFloat(totalPriceInput ? totalPriceInput.value : 0) || 0;
      const currentPaid = parseFloat(paidAmountInput.value) || 0;
      // Mark as customized only if user deliberately entered a partial amount different from total
      if (Math.abs(currentPaid - currentTotal) > 0.01) {
        isPaidAmountCustomized = true;
      } else {
        isPaidAmountCustomized = false;
      }
      updateRemainingBalance();
    });
  }

  // =========================================================================
  // ANALYTICS & CHART.JS VISUALIZATION (Light White Glass with Forest Green)
  // =========================================================================
  function renderAnalyticsCharts(monthlyData, stats) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js is not loaded.');
      return;
    }

    // 1. Monthly Revenue Bar Chart (Expected vs Collected)
    const revenueCtx = document.getElementById('monthly-revenue-chart');
    if (revenueCtx) {
      let labels = [];
      let expectedValues = [];
      let collectedValues = [];

      if (monthlyData && monthlyData.length > 0) {
        labels = monthlyData.map(d => d.month);
        expectedValues = monthlyData.map(d => parseFloat(d.expected !== undefined ? d.expected : d.revenue) || 0);
        collectedValues = monthlyData.map(d => parseFloat(d.collected) || 0);
      } else {
        const curMonth = (typeof getLocalDateString === 'function')
          ? getLocalDateString().substring(0, 7)
          : new Date().toISOString().substring(0, 7);
        labels = [curMonth];
        expectedValues = [0];
        collectedValues = [0];
      }

      if (dashboardState.monthlyRevenueChart) {
        dashboardState.monthlyRevenueChart.destroy();
      }

      dashboardState.monthlyRevenueChart = new Chart(revenueCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'المتوقع (Expected)',
              data: expectedValues,
              backgroundColor: '#94a3b8',
              hoverBackgroundColor: '#64748b',
              borderColor: '#64748b',
              borderWidth: 1,
              borderRadius: 6,
              maxBarThickness: 45
            },
            {
              label: 'المحصّل فعلياً (Collected)',
              data: collectedValues,
              backgroundColor: '#059669',
              hoverBackgroundColor: '#047857',
              borderColor: '#047857',
              borderWidth: 1,
              borderRadius: 6,
              maxBarThickness: 45
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                boxWidth: 14,
                padding: 12,
                color: '#475569',
                font: { family: 'Cairo, Segoe UI, Tahoma', size: 12, weight: '700' }
              }
            },
            tooltip: {
              backgroundColor: '#0f172a',
              titleColor: '#ffffff',
              bodyColor: '#f8fafc',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 10,
              displayColors: true,
              callbacks: {
                label: function (ctx) {
                  const val = ctx.parsed.y !== null ? ctx.parsed.y : 0;
                  return ` ${ctx.dataset.label}: ${val.toLocaleString()} ريال`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#64748b',
                font: { size: 11 },
                callback: function (val) {
                  return val.toLocaleString() + ' ر.س';
                }
              },
              grid: { color: 'rgba(226, 232, 240, 0.8)' }
            },
            x: {
              ticks: { color: '#64748b', font: { size: 11, weight: '700' } },
              grid: { display: false }
            }
          }
        }
      });
    }

    // 2. Room Status Doughnut Chart (Light Palette)
    const roomCtx = document.getElementById('room-status-chart');
    if (roomCtx) {
      const avail = stats ? stats.availableRooms : 0;
      const occ = stats ? stats.occupiedRooms : 0;
      const clean = stats ? stats.cleaningRooms : 0;

      if (dashboardState.roomStatusChart) {
        dashboardState.roomStatusChart.destroy();
      }

      dashboardState.roomStatusChart = new Chart(roomCtx, {
        type: 'doughnut',
        data: {
          labels: ['متاحة (Available)', 'مشغولة (Occupied)', 'تنظيف (Cleaning)'],
          datasets: [{
            data: [avail, occ, clean],
            backgroundColor: ['#059669', '#dc2626', '#d97706'],
            borderWidth: 2.5,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                // FIXED: was '#cbd5e1' — too light on white glass background, invisible.
                color: '#64748b',
                font: { size: 11, family: 'Cairo, Segoe UI, Tahoma' }
              }
            }
          },
          cutout: '72%'
        }
      });
    }
  }

  // =========================================================================
  // VIEW 1: OVERVIEW LOGIC
  // =========================================================================
  async function loadOverviewData() {
    try {
      // 1. Load Stats
      let stats = null;
      const statsRes = await api.getDashboardStats();
      if (statsRes.success && statsRes.data) {
        stats = statsRes.data;
        statAvailableRooms.textContent = stats.availableRooms.toLocaleString();
        statOccupiedRooms.textContent = stats.occupiedRooms.toLocaleString();
        statCleaningRooms.textContent = stats.cleaningRooms.toLocaleString();
        statTotalReservations.textContent = stats.totalReservations.toLocaleString();
      }

      // 2. Load Monthly Revenue for Analytics
      let monthlyData = [];
      const analyticsRes = await api.getMonthlyRevenue();
      if (analyticsRes.success) {
        monthlyData = analyticsRes.data || [];
      }

      // Render Charts
      renderAnalyticsCharts(monthlyData, stats);

      // 3. Load Available & Future Reserved Rooms into Booking Dropdown
      const currentSelectedVal = roomSelect ? roomSelect.value : '';
      const roomsRes = await api.getAvailableRooms();
      if (roomsRes.success) {
        let optionsHtml = `<option value="">-- اختر الغرفة --</option>`;
        (roomsRes.data || []).forEach(room => {
          const isReservedLater = room.status === 'محجوزة';
          optionsHtml += `
            <option value="${room.id}" data-price="${room.price_per_night}">
              غرفة رقم ${escapeHtml(room.room_number)} (${escapeHtml(room.type)}) - ${room.price_per_night} ريال/ليلة ${isReservedLater ? '⏳ (محجوزة لفترة لاحقة)' : '✓ (متاحة)'}
            </option>
          `;
        });
        roomSelect.innerHTML = optionsHtml;
        if (currentSelectedVal) {
          roomSelect.value = currentSelectedVal;
        }
      }

      // 4. Load Recent Reservations into Overview Table
      const resRes = await api.getAllReservations();
      if (resRes.success) {
        dashboardState.reservationsCache = resRes.data || [];
        renderOverviewTable();
      }

      // 5. Load Today's Check-outs Widget
      await loadTodayCheckouts();
    } catch (err) {
      console.error('Error loading overview data:', err);
    }
  }

  function renderOverviewTable() {
    const recent = dashboardState.reservationsCache.slice(0, 8);

    if (recent.length === 0) {
      overviewTableBody.innerHTML = '';
      overviewEmpty.style.display = 'block';
      return;
    }

    overviewEmpty.style.display = 'none';

    overviewTableBody.innerHTML = recent.map(r => {
      const isConfirmed = r.status === 'مؤكد';
      const isContract = r.booking_type === 'عقد مفتوح';
      const total = parseFloat(r.total_price || 0);
      const paid = parseFloat(r.paid_amount || 0);
      const rawRemaining = total - paid;
      const isCredit = rawRemaining < -0.005;
      const remaining = isContract ? rawRemaining : Math.max(0, rawRemaining);
      const typeBadge = getBookingTypeBadge(r.booking_type);
      const checkOutDisplay = r.check_out_date || (isContract ? 'مفتوح (غير محدد)' : '-');

      return `
        <tr>
          <td style="font-family: monospace; font-weight: 800; color: var(--primary); white-space: nowrap;">#${r.id}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="font-weight: 800; color: #1e293b; font-size: 0.92rem; white-space: nowrap;">${escapeHtml(r.guest_name)}</span>
              ${typeBadge}
            </div>
          </td>
          <td style="white-space: nowrap;">
            <span style="font-weight: 800; color: #1a4332;">غرفة ${escapeHtml(r.room_number)}</span>
          </td>
          <td style="font-size: 0.82rem; color: var(--text-secondary); white-space: nowrap; font-family: monospace; direction: ltr; text-align: right;">
            <div>${escapeHtml(r.check_in_date)}</div>
            ${r.booking_time ? `<div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">${escapeHtml(r.booking_time)}</div>` : ''}
          </td>
          <td style="font-size: 0.82rem; color: var(--text-secondary); white-space: nowrap; font-family: ${r.check_out_date ? 'monospace' : 'inherit'}; direction: ${r.check_out_date ? 'ltr' : 'rtl'}; text-align: right;">${escapeHtml(checkOutDisplay)}</td>
          <td style="white-space: nowrap;">
            <div style="font-weight: 800; color: #1e293b; font-size: 0.9rem;">${total.toLocaleString()} ريال</div>
            ${r.original_calculated_charge != null ? `<div style="font-size: 0.70rem; color: #64748b; font-weight: 600;" title="المبلغ الأصلي قبل تعديل الإدارة">معدل يدوياً (أصلي: ${parseFloat(r.original_calculated_charge).toLocaleString()} ريال)</div>` : ''}
            <div style="font-size: 0.74rem; color: #059669; font-weight: 700;">مدفوع: ${paid.toLocaleString()}</div>
            ${isCredit ? `<div style="font-size: 0.74rem; color: #2563eb; font-weight: 800;">رصيد دائن: ${Math.abs(rawRemaining).toLocaleString()} ريال</div>` : (remaining > 0 ? `<div style="font-size: 0.74rem; color: #dc2626; font-weight: 800;">متبقي: ${remaining.toLocaleString()}</div>` : '')}
          </td>
          <td style="white-space: nowrap;">${getPaymentStatusBadge(r.payment_status)}</td>
          <td style="white-space: nowrap;">
            ${getReservationStatusBadge(r.status)}
            ${r.checkout_time ? `<div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace; margin-top: 2px;">${escapeHtml(r.checkout_time)}</div>` : ''}
          </td>
          <td style="text-align: center; white-space: nowrap;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: nowrap;">
              <button type="button" class="btn-action-icon" data-action="invoice" data-id="${r.id}" style="width: 30px; height: 30px; padding: 0; background: #f0fdf4; color: #166534; border: 1.5px solid #bbf7d0; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;" title="طباعة سند الاستلام والإقامة (فاتورة)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              </button>
              ${isConfirmed && (remaining > 0 || isContract) ? `
                <button type="button" class="btn-action-icon btn-pay" data-action="add-payment" data-id="${r.id}" onclick="event.stopPropagation(); window.openAddPaymentModal && window.openAddPaymentModal(${r.id});" style="width: 30px; height: 30px; padding: 0; background: #a67c52; color: #ffffff; border: none; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; box-shadow: 0 2px 8px rgba(166, 124, 82, 0.35);" title="تسجيل دفعة سداد جديدة">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                </button>
              ` : ''}
              ${isConfirmed ? `
                ${r.check_out_date && r.check_out_date !== 'مفتوح' ? `
                  <button type="button" class="btn-action-icon" data-action="extend" data-id="${r.id}" style="width: 30px; height: 30px; padding: 0; background: #eff6ff; color: #1e40af; border: 1.5px solid #bfdbfe; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;" title="تمديد فترة الإقامة">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </button>
                ` : ''}
                <button type="button" class="btn-action-icon" data-action="checkout" data-id="${r.id}" style="width: 30px; height: 30px; padding: 0; background: #ffffff; color: #334155; border: 1.5px solid #cbd5e1; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;" title="تسجيل مغادرة وتسليم الغرفة">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
                <button type="button" class="btn-action-icon" data-action="whatsapp" data-id="${r.id}" style="width: 30px; height: 30px; padding: 0; background: #f0fdf4; color: #16a34a; border: 1.5px solid #86efac; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;" title="مراسلة النزيل عبر واتساب">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </button>
                <button type="button" class="btn-action-icon" data-action="cancel" data-id="${r.id}" style="width: 30px; height: 30px; padding: 0; background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;" title="إلغاء الحجز">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // TODAY'S CHECK-OUTS (مغادرات اليوم) WIDGET LOGIC
  // =========================================================================
  async function loadTodayCheckouts() {
    try {
      const todayStr = getLocalDateString();
      if (todayDateBadge) {
        todayDateBadge.textContent = todayStr;
      }

      const res = await api.getTodayCheckouts(todayStr);
      if (res && res.success) {
        const checkouts = res.data || [];
        renderTodayCheckoutsTable(checkouts);
      } else {
        console.warn('Could not load today checkouts:', res?.error);
      }
    } catch (err) {
      console.error('Error in loadTodayCheckouts:', err);
    }
  }

  function renderTodayCheckoutsTable(checkouts) {
    if (!todayCheckoutsTableBody) return;

    if (todayCheckoutsCountBadge) {
      const count = checkouts.length;
      todayCheckoutsCountBadge.textContent = `${count} ${count === 1 ? 'مغادرة' : 'مغادرات'}`;
    }

    if (checkouts.length === 0) {
      todayCheckoutsTableBody.innerHTML = '';
      if (todayCheckoutsEmpty) todayCheckoutsEmpty.style.display = 'block';
      return;
    }

    if (todayCheckoutsEmpty) todayCheckoutsEmpty.style.display = 'none';

    todayCheckoutsTableBody.innerHTML = checkouts.map(r => {
      const isConfirmed = r.status === 'مؤكد';
      const isCompleted = r.status === 'مكتمل';

      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td>
            <span style="font-weight: 800; font-size: 0.92rem; color: #1a4332; background: #ecfdf5; padding: 3px 8px; border-radius: 6px; border: 1px solid #a7f3d0;">
              غرفة ${escapeHtml(r.room_number)}
            </span>
          </td>
          <td style="font-size: 0.88rem; color: var(--text-secondary);">${escapeHtml(r.room_type || '')}</td>
          <td>
            <div style="font-weight: 800; color: #1e293b; font-size: 0.92rem;">${escapeHtml(r.guest_name)}</div>
            ${r.guest_id_number ? `<small style="color: var(--text-muted);">هوية: ${escapeHtml(r.guest_id_number)}</small>` : ''}
          </td>
          <td style="font-family: monospace; font-size: 0.88rem; color: var(--text-secondary);">${escapeHtml(r.guest_phone || '-')}</td>
          <td style="font-size: 0.84rem; color: var(--text-secondary);">${escapeHtml(r.check_in_date)}</td>
          <td style="font-weight: 800; color: var(--primary); font-size: 0.92rem;">${parseFloat(r.total_price || 0).toLocaleString()} ريال</td>
          <td>
            ${getReservationStatusBadge(r.status)}
            ${r.checkout_time ? `<div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace; margin-top: 2px;">${escapeHtml(r.checkout_time)}</div>` : ''}
          </td>
          <td style="text-align: center;">
            ${isConfirmed ? `
              <div style="display: flex; gap: 5px; justify-content: center; align-items: center;">
                <button class="btn btn-primary btn-sm" data-action="checkout" data-id="${r.id}" style="padding: 5px 11px; font-weight: 800; font-size: 0.8rem;" title="تسجيل مغادرة النزيل وتسليم الغرفة">
                  تسجيل مغادرة &larr;
                </button>
                <button type="button" class="btn btn-secondary btn-sm" data-action="extend" data-id="${r.id}" style="padding: 5px 9px; font-weight: 800; font-size: 0.8rem; background: #eff6ff; color: #1e40af; border: 1.5px solid #bfdbfe;" title="تمديد فترة الإقامة">
                  تمديد ⏳
                </button>
              </div>
            ` : isCompleted ? `
              <span class="badge" style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; font-weight: 800;">تمت المغادرة &check;</span>
            ` : `<span style="color: var(--text-secondary); font-size: 0.8rem;">-</span>`}
          </td>
        </tr>
      `;
    }).join('');
  }

  if (btnRefreshCheckouts) {
    btnRefreshCheckouts.addEventListener('click', loadTodayCheckouts);
  }

  // =========================================================================
  // RETURNING GUEST AUTO-FILL SYSTEM (البحث التلقائي عن النزلاء السابقين)
  // =========================================================================
  let lastAutoFilledGuestId = null;
  let autofillDebounceTimer = null;

  function resetAutofillBanner() {
    lastAutoFilledGuestId = null;
    if (autofillGuestStatus) {
      autofillGuestStatus.style.display = 'none';
    }
    if (bannedGuestWarning) {
      bannedGuestWarning.style.display = 'none';
    }
  }

  function highlightField(el) {
    if (!el) return;
    el.classList.add('input-autofill-highlight');
    setTimeout(() => el.classList.remove('input-autofill-highlight'), 1600);
  }

  async function handleGuestAutofill(triggeredBy, eventType) {
    const phoneVal = guestPhoneInput ? guestPhoneInput.value.trim() : '';
    const idVal = guestIdNumberInput ? guestIdNumberInput.value.trim() : '';

    const activeVal = triggeredBy === 'phone' ? phoneVal : idVal;

    // Minimum 4 characters to trigger search
    if (!activeVal || activeVal.length < 4) {
      if (!phoneVal && !idVal) {
        resetAutofillBanner();
      }
      return;
    }

    try {
      const res = await api.searchGuest({ phone: phoneVal, id_number: idVal });
      if (res && res.success && res.guest) {
        const guest = res.guest;

        // Show or hide banned guest warning banner
        if (bannedGuestWarning) {
          if (Number(guest.is_banned) === 1) {
            if (bannedGuestMsg) {
              const reasonText = guest.ban_reason ? ` (سبب الحظر: ${escapeHtml(guest.ban_reason)})` : '';
              bannedGuestMsg.innerHTML = `<strong>تنبيه (نزيل محظور):</strong> هذا النزيل مدرج في قائمة الحظر${reasonText}.`;
            }
            bannedGuestWarning.style.display = 'flex';
          } else {
            bannedGuestWarning.style.display = 'none';
          }
        }

        // Auto-fill if it's a new match or name is currently empty
        if (guest.id !== lastAutoFilledGuestId || !guestNameInput.value.trim()) {
          lastAutoFilledGuestId = guest.id;

          // 1. Fill Name
          if (guest.name) {
            guestNameInput.value = guest.name;
            highlightField(guestNameInput);
          }

          // 2. Cross-fill Phone / ID Number
          if (triggeredBy === 'phone' && guest.id_number && !guestIdNumberInput.value.trim()) {
            guestIdNumberInput.value = guest.id_number;
            highlightField(guestIdNumberInput);
          } else if (triggeredBy === 'id' && guest.phone && !guestPhoneInput.value.trim()) {
            guestPhoneInput.value = guest.phone;
            highlightField(guestPhoneInput);
          }

          // 3. Update Visual Status Banner
          const stays = parseInt(guest.total_stays, 10) || 0;
          let staysText = '';
          if (stays === 0) {
            staysText = 'بدون إقامات سابقة مكتملة';
          } else if (stays === 1) {
            staysText = 'إقامة سابقة واحدة';
          } else if (stays === 2) {
            staysText = 'إقامتان سابقتان';
          } else if (stays >= 3 && stays <= 10) {
            staysText = `${stays} إقامات سابقة`;
          } else {
            staysText = `${stays} إقامة سابقة`;
          }

          if (autofillGuestStatus && autofillGuestMsg) {
            autofillGuestMsg.innerHTML = stays > 0
              ? `<strong>تم التعرف على النزيل السابق:</strong> ${escapeHtml(guest.name)} (${staysText}) - تم ملء البيانات تلقائياً.`
              : `<strong>نزيل مسجل:</strong> ${escapeHtml(guest.name)} (${staysText}) - تم استرجاع البيانات تلقائياً.`;
            autofillGuestStatus.style.display = 'flex';
          }

          // 4. Alert / Toast in Arabic
          if (stays > 0) {
            showToast(`مرحباً بعودته! تم التعرف على النزيل السابق "${guest.name}" (${staysText}) واسترجاع بياناته تلقائياً.`, 'success');
          } else {
            showToast(`تم استرجاع بيانات النزيل المسجل "${guest.name}".`, 'info');
          }
        }
      } else {
        if (bannedGuestWarning) {
          bannedGuestWarning.style.display = 'none';
        }
      }
    } catch (err) {
      console.error('[Autofill Error]', err);
    }
  }

  // Setup keyup and blur listeners for Phone and ID Number inputs
  if (guestPhoneInput) {
    guestPhoneInput.addEventListener('keyup', () => {
      clearTimeout(autofillDebounceTimer);
      autofillDebounceTimer = setTimeout(() => {
        handleGuestAutofill('phone', 'keyup');
      }, 300);
    });

    guestPhoneInput.addEventListener('blur', () => {
      handleGuestAutofill('phone', 'blur');
    });
  }

  if (guestIdNumberInput) {
    guestIdNumberInput.addEventListener('keyup', () => {
      clearTimeout(autofillDebounceTimer);
      autofillDebounceTimer = setTimeout(() => {
        handleGuestAutofill('id', 'keyup');
      }, 300);
    });

    guestIdNumberInput.addEventListener('blur', () => {
      handleGuestAutofill('id', 'blur');
    });
  }

  // Inline Error UI Helpers
  function setFieldError(inputEl, errorEl, msg) {
    if (!inputEl) return;
    inputEl.classList.add('border-rose-500');
    inputEl.style.borderColor = '#f43f5e';
    inputEl.style.boxShadow = '0 0 0 1.5px #f43f5e';
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
      errorEl.style.display = 'block';
    }
  }

  function clearFieldError(inputEl, errorEl) {
    if (!inputEl) return;
    inputEl.classList.remove('border-rose-500');
    inputEl.style.borderColor = '';
    inputEl.style.boxShadow = '';
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
      errorEl.style.display = 'none';
    }
  }

  // Clear inline errors immediately on keystroke
  if (guestPhoneInput) {
    guestPhoneInput.addEventListener('input', () => {
      clearFieldError(guestPhoneInput, guestPhoneError);
    });
  }

  if (guestIdNumberInput) {
    guestIdNumberInput.addEventListener('input', () => {
      clearFieldError(guestIdNumberInput, guestIdError);
    });
  }

  // =========================================================================
  // STRICT FRONTEND DATA VALIDATIONS
  // =========================================================================
  function validateReservationInputs({ guestName, guestPhone, guestIdNumber, roomId, checkInDate, checkOutDate, totalPrice, bookingType = 'عادي' }) {
    clearFieldError(guestPhoneInput, guestPhoneError);
    clearFieldError(guestIdNumberInput, guestIdError);

    // 1. Required Essential Fields
    if (!guestName) {
      if (guestNameInput) { guestNameInput.focus(); highlightField(guestNameInput); }
      return { valid: false, error: 'يرجى إدخال اسم النزيل (حقل إلزامي).' };
    }
    if (!roomId) {
      if (roomSelect) { roomSelect.focus(); highlightField(roomSelect); }
      return { valid: false, error: 'يرجى اختيار رقم الغرفة المراد حجزها.' };
    }

    if (bookingType === 'عقد مفتوح') {
      if (isNaN(totalPrice) || totalPrice < 0) {
        if (totalPriceInput) { totalPriceInput.focus(); highlightField(totalPriceInput); }
        return { valid: false, error: 'السعر الإجمالي يجب أن يكون صفراً أو أكبر.' };
      }
    } else {
      if (isNaN(totalPrice) || totalPrice <= 0) {
        if (totalPriceInput) { totalPriceInput.focus(); highlightField(totalPriceInput); }
        return { valid: false, error: 'السعر الإجمالي مطلوب ويجب أن يكون أكبر من الصفر.' };
      }
    }

    // 2. Phone Number: Must start with 05 and be exactly 10 digits (Inline error)
    if (!guestPhone) {
      setFieldError(guestPhoneInput, guestPhoneError, 'يرجى إدخال رقم جوال النزيل.');
      if (guestPhoneInput) guestPhoneInput.focus();
      return { valid: false, inline: true, error: 'يرجى إدخال رقم جوال النزيل.' };
    }
    if (!/^05\d{8}$/.test(guestPhone)) {
      setFieldError(guestPhoneInput, guestPhoneError, 'رقم الجوال غير صحيح: يجب أن يبدأ بـ 05 ويتكون من 10 أرقام (مثال: 0501234567).');
      if (guestPhoneInput) guestPhoneInput.focus();
      return { valid: false, inline: true, error: 'رقم الجوال غير صحيح: يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.' };
    }

    // 3. National ID (10 digits) OR Passport (6-9 alphanumeric characters) (Inline error)
    if (guestIdNumber && !/^(?:\d{10}|[a-zA-Z0-9]{6,9})$/i.test(guestIdNumber)) {
      setFieldError(guestIdNumberInput, guestIdError, 'رقم الهوية الوطنية أو الإقامة (10 أرقام) أو جواز السفر (6 إلى 9 خانات) غير صحيح.');
      if (guestIdNumberInput) guestIdNumberInput.focus();
      return { valid: false, inline: true, error: 'رقم الهوية أو جواز السفر غير صحيح.' };
    }

    // 4. Dates Logic: check_in_date not in past
    if (!checkInDate) {
      if (checkInInput) { checkInInput.focus(); highlightField(checkInInput); }
      return { valid: false, error: 'يرجى تحديد تاريخ الوصول.' };
    }

    const todayStr = getLocalDateString(new Date());
    if (checkInDate < todayStr) {
      if (checkInInput) { checkInInput.focus(); highlightField(checkInInput); }
      return { valid: false, error: 'تاريخ الوصول لا يمكن أن يكون في الماضي (يجب أن يكون تاريخ اليوم أو تاريخاً مستقبلياً).' };
    }

    if (bookingType === 'عقد مفتوح') {
      if (checkOutDate && checkOutDate <= checkInDate) {
        if (checkOutInput) { checkOutInput.focus(); highlightField(checkOutInput); }
        return { valid: false, error: 'تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول بشكل محدد.' };
      }
    } else if (bookingType === 'حجز شهري') {
      if (checkOutDate && checkOutDate <= checkInDate) {
        if (checkOutInput) { checkOutInput.focus(); highlightField(checkOutInput); }
        return { valid: false, error: 'تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول بشكل محدد.' };
      }
    } else {
      if (!checkOutDate) {
        if (checkOutInput) { checkOutInput.focus(); highlightField(checkOutInput); }
        return { valid: false, error: 'يرجى تحديد تاريخ المغادرة.' };
      }
      if (checkOutDate <= checkInDate) {
        if (checkOutInput) { checkOutInput.focus(); highlightField(checkOutInput); }
        return { valid: false, error: 'تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول بشكل محدد.' };
      }
    }

    return { valid: true };
  }

  function validateGuestInputs({ name, phone, id_number }) {
    if (!name) {
      if (newCustomerName) { newCustomerName.focus(); highlightField(newCustomerName); }
      return { valid: false, error: 'يرجى إدخال اسم العميل / النزيل.' };
    }
    if (phone && !/^05\d{8}$/.test(phone)) {
      if (newCustomerPhone) { newCustomerPhone.focus(); highlightField(newCustomerPhone); }
      return { valid: false, error: 'رقم الجوال غير صحيح: يجب أن يبدأ بـ 05 ويتكون من 10 أرقام بالضبط (مثال: 0501234567).' };
    }
    if (id_number && !/^(?:\d{10}|[a-zA-Z0-9]{6,9})$/i.test(id_number)) {
      if (newCustomerId) { newCustomerId.focus(); highlightField(newCustomerId); }
      return { valid: false, error: 'رقم الهوية الوطنية أو الإقامة (10 أرقام) أو جواز السفر (6 إلى 9 خانات) غير صحيح.' };
    }
    return { valid: true };
  }

  // Quick Reservation Form Submit
  reservationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const bookingType = bookingTypeSelect ? bookingTypeSelect.value : 'عادي';
    const guestName = guestNameInput.value.trim();
    const guestPhone = guestPhoneInput.value.trim();
    const guestIdNumber = guestIdNumberInput.value.trim();
    const roomId = roomSelect.value;
    const checkInDate = checkInInput.value;
    const checkOutDate = checkOutInput.value;
    const totalPrice = parseFloat(totalPriceInput.value) || 0;
    const paidAmount = parseFloat(paidAmountInput ? paidAmountInput.value : 0) || 0;
    const depositAmount = parseFloat(depositAmountInput ? depositAmountInput.value : 0) || 0;
    const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : 'نقداً';
    const customNightlyPrice = (nightlyRateInput && nightlyRateInput.value !== '') ? parseFloat(nightlyRateInput.value) : null;
    const discountAmount = (discountAmountInput && discountAmountInput.value !== '') ? parseFloat(discountAmountInput.value) : 0;
    const discountReason = discountReasonInput ? discountReasonInput.value.trim() : '';

    // Strict Frontend Validation
    const validation = validateReservationInputs({
      guestName,
      guestPhone,
      guestIdNumber,
      roomId,
      checkInDate,
      checkOutDate,
      totalPrice,
      bookingType
    });

    if (!validation.valid) {
      if (!validation.inline) {
        showToast(validation.error, 'error');
      }
      return;
    }

    try {
      let res = await api.createReservation({
        guestName,
        guestPhone,
        guestIdNumber,
        roomId,
        checkInDate,
        checkOutDate,
        totalPrice,
        paidAmount,
        depositAmount,
        paymentMethod,
        bookingType,
        customNightlyPrice,
        discountAmount,
        discountReason
      });

      // Handle soft ban override confirmation
      if (res && !res.success && res.requiresOverride) {
        const confirmed = await showConfirmDialog({
          title: 'تنبيه: نزيل مدرج في قائمة الحظر',
          message: `${res.error || 'هذا النزيل مدرج في قائمة الحظر.'}\n\nهل ترغب في تجاوز الحظر ومتابعة إتمام الحجز للنزيل؟`,
          confirmText: 'نعم، تجاوز الحظر وتأكيد',
          cancelText: 'إلغاء الحجز',
          isDanger: true
        });

        if (confirmed) {
          res = await api.createReservation({
            guestName,
            guestPhone,
            guestIdNumber,
            roomId,
            checkInDate,
            checkOutDate,
            totalPrice,
            paidAmount,
            depositAmount,
            paymentMethod,
            bookingType,
            customNightlyPrice,
            discountAmount,
            discountReason,
            overrideBan: true
          });
        } else {
          return;
        }
      }

      if (res && res.success) {
        // 1. Reset form fields and error indicators
        reservationForm.reset();
        if (bookingTypeSelect) {
          bookingTypeSelect.value = 'عادي';
          handleBookingTypeChange();
        }
        guestNameInput.value = '';
        guestPhoneInput.value = '';
        guestIdNumberInput.value = '';
        totalPriceInput.value = '';
        if (paidAmountInput) paidAmountInput.value = '';
        if (depositAmountInput) depositAmountInput.value = '0';
        if (nightlyRateInput) nightlyRateInput.value = '';
        if (discountAmountInput) discountAmountInput.value = '0';
        if (discountReasonInput) discountReasonInput.value = '';
        if (roomDefaultRateBadge) roomDefaultRateBadge.textContent = '';
        if (priceCalculationBreakdown) priceCalculationBreakdown.style.display = 'none';
         clearFieldError(guestPhoneInput, guestPhoneError);
        clearFieldError(guestIdNumberInput, guestIdError);
        updateRemainingBalance();
        resetAutofillBanner();
        // form.reset() clears date inputs to empty (no default HTML value) —
        // always re-fill with today/tomorrow so the modal never opens empty
        // next time.
        checkInInput.value = getLocalDateString(new Date());
        checkOutInput.value = getLocalDateString(new Date(Date.now() + 86400000));

        // 2. Close booking modal

        // 2. Close booking modal
        closeNewReservationModal();

        // 3. Dynamic UI Update: Refresh rooms grid, overview stats, and reservations table
        await Promise.all([
          loadRoomsData(),
          loadOverviewData(),
          loadReservationsData()
        ]);

        // 4. Smooth Visual Feedback: Highlight the updated room card on screen
        const updatedCard = document.querySelector(`.room-card[data-room-id="${roomId}"]`);
        if (updatedCard) {
          updatedCard.style.transition = 'all 0.4s ease';
          updatedCard.style.boxShadow = '0 0 0 3px #10b981, 0 10px 25px -4px rgba(16, 185, 129, 0.35)';
          updatedCard.style.transform = 'translateY(-2px)';
          setTimeout(() => {
            updatedCard.style.boxShadow = '';
            updatedCard.style.transform = '';
          }, 1800);
        }

        showToast(`تم تأكيد الحجز بنجاح للنزيل "${guestName}"!`, 'success');
      } else {
        showToast(res.error || 'فشل في حفظ الحجز.', 'error');
      }
    } catch (err) {
      showToast(`خطأ: ${err.message}`, 'error');
    }
  });

  btnClearForm.addEventListener('click', () => {
    isPaidAmountCustomized = false;
    clearFieldError(guestPhoneInput, guestPhoneError);
    clearFieldError(guestIdNumberInput, guestIdError);
    reservationForm.reset();
    if (bookingTypeSelect) {
      bookingTypeSelect.value = 'عادي';
      handleBookingTypeChange();
    }
    if (nightlyRateInput) nightlyRateInput.value = '';
    if (discountAmountInput) discountAmountInput.value = '0';
    if (discountReasonInput) discountReasonInput.value = '';
    if (roomDefaultRateBadge) roomDefaultRateBadge.textContent = '';
    if (priceCalculationBreakdown) priceCalculationBreakdown.style.display = 'none';
    resetAutofillBanner();
    checkInInput.value = getLocalDateString(new Date());
    checkOutInput.value = getLocalDateString(new Date(Date.now() + 86400000));
    if (depositAmountInput) depositAmountInput.value = '0';
    calculatePrice(true);
  });

  // --- NEW RESERVATION MODAL & ROOM AUTO-FILL CONTROLS ---
  function unlockRoomSelect() {
    if (!roomSelect) return;
    roomSelect.classList.remove('select-locked');
    roomSelect.style.borderColor = '';
    roomSelect.style.background = '';
    roomSelect.style.color = '';
    roomSelect.style.fontWeight = '';
    const lockBadge = document.getElementById('room-select-lock-badge');
    if (lockBadge) {
      lockBadge.style.display = 'none';
      lockBadge.innerHTML = '';
    }
  }

  function initiateRoomBooking(roomId) {
    const targetId = parseInt(roomId, 10);
    const targetRoom = dashboardState.roomsCache.find(r => r.id === targetId);

    // 1. Open the New Reservation Modal
    openNewReservationModal();

    if (!roomSelect) return;

    // 2. Ensure option exists in roomSelect
    let optionExists = false;
    for (let i = 0; i < roomSelect.options.length; i++) {
      if (parseInt(roomSelect.options[i].value, 10) === targetId) {
        optionExists = true;
        break;
      }
    }

    if (!optionExists && targetRoom) {
      const opt = document.createElement('option');
      opt.value = targetRoom.id;
      opt.dataset.price = targetRoom.price_per_night;
      opt.textContent = `غرفة رقم ${targetRoom.room_number} (${targetRoom.type}) - ${targetRoom.price_per_night} ريال/ليلة`;
      roomSelect.appendChild(opt);
    }

    // 3. Pre-fill and calculate price (force update المبلغ المدفوع مقدماً to new room's price)
    roomSelect.value = String(targetId);
    isPaidAmountCustomized = false;
    if (nightlyRateInput && targetRoom) {
      nightlyRateInput.value = targetRoom.price_per_night;
    }
    if (roomDefaultRateBadge && targetRoom) {
      roomDefaultRateBadge.textContent = `(الأساسي: ${targetRoom.price_per_night} ريال)`;
    }
    if (discountAmountInput) discountAmountInput.value = '0';
    if (discountReasonInput) discountReasonInput.value = '';
    calculatePrice(true);

    // 4. Lock & Clearly indicate the room is pre-selected
    roomSelect.classList.add('select-locked');
    roomSelect.style.borderColor = '#1a4332';
    roomSelect.style.background = '#f0fdf4';
    roomSelect.style.color = '#166534';
    roomSelect.style.fontWeight = '800';

    const lockBadge = document.getElementById('room-select-lock-badge');
    if (lockBadge && targetRoom) {
      lockBadge.style.display = 'inline-flex';
      lockBadge.innerHTML = `🔒 محددة: غرفة ${escapeHtml(targetRoom.room_number)} (${escapeHtml(targetRoom.type)}) <a href="#" id="link-unlock-room" style="color: #dc2626; margin-right: 6px; text-decoration: underline; font-weight: 700;">[تغيير]</a>`;
      
      const linkUnlock = document.getElementById('link-unlock-room');
      if (linkUnlock) {
        linkUnlock.addEventListener('click', (e) => {
          e.preventDefault();
          unlockRoomSelect();
        });
      }
    }

    // 5. Auto-focus next field
    setTimeout(() => {
      if (guestPhoneInput) {
        guestPhoneInput.focus();
        highlightField(guestPhoneInput);
      }
    }, 150);

    if (targetRoom) {
      showToast(`تم اختيار وتثبيت غرفة ${targetRoom.room_number} (${targetRoom.type}) في نموذج الحجز!`, 'success');
    }
  }

 function openNewReservationModal() {
  if (!newReservationModal) return;
  clearFieldError(guestPhoneInput, guestPhoneError);
  clearFieldError(guestIdNumberInput, guestIdError);
  isPaidAmountCustomized = false;

  // Safety net: never open the modal with empty date fields, regardless
  // of what happened before this call.
  if (!checkInInput.value) {
    checkInInput.value = getLocalDateString(new Date());
  }
  if (!checkOutInput.value) {
    checkOutInput.value = getLocalDateString(new Date(Date.now() + 86400000));
  }

  if (roomSelect && roomSelect.value) {
    calculatePrice(true);
  }
  
  newReservationModal.style.display = 'flex';
  setTimeout(() => {
    if (guestPhoneInput) {
      guestPhoneInput.focus();
    }
  }, 100);
}
  function closeNewReservationModal() {
    if (!newReservationModal) return;
    newReservationModal.style.display = 'none';
    clearFieldError(guestPhoneInput, guestPhoneError);
    clearFieldError(guestIdNumberInput, guestIdError);
    isPaidAmountCustomized = false;
    unlockRoomSelect();
  }

  if (btnOpenNewReservationModal) {
    btnOpenNewReservationModal.addEventListener('click', openNewReservationModal);
  }

  if (btnResNewBooking) {
    btnResNewBooking.addEventListener('click', openNewReservationModal);
  }

  if (btnCloseNewReservation) {
    btnCloseNewReservation.addEventListener('click', closeNewReservationModal);
  }

  if (newReservationModal) {
    newReservationModal.addEventListener('click', (e) => {
      if (e.target === newReservationModal) {
        closeNewReservationModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && newReservationModal && newReservationModal.style.display === 'flex') {
      closeNewReservationModal();
    }
  });

  // =========================================================================
  // VIEW 2: ALL RESERVATIONS LOGIC + EXCEL IMPORT / EXPORT
  // =========================================================================
  async function loadReservationsData() {
    try {
      const res = await api.getAllReservations();
      if (res.success) {
        dashboardState.reservationsCache = res.data || [];
        renderAllReservationsTable();
      }
    } catch (err) {
      console.error('Error loading reservations:', err);
    }
  }

  function renderAllReservationsTable() {
    const query = (searchAllReservations.value || '').toLowerCase().trim();

    const filtered = dashboardState.reservationsCache.filter(item => {
      if (dashboardState.currentReservationFilter !== 'all') {
        if (dashboardState.currentReservationFilter === 'ملغي') {
          if (item.status !== 'ملغي' && item.status !== 'ملغي جزئي') return false;
        } else if (item.status !== dashboardState.currentReservationFilter) {
          return false;
        }
      }
      if (!query) return true;
      return (
        String(item.id || '').includes(query) ||
        String(item.guest_name || '').toLowerCase().includes(query) ||
        String(item.room_number || '').includes(query) ||
        String(item.guest_phone || '').includes(query) ||
        String(item.guest_id_number || '').includes(query)
      );
    });

    if (filtered.length === 0) {
      allReservationsTableBody.innerHTML = '';
      allReservationsEmpty.style.display = 'block';
      return;
    }

    allReservationsEmpty.style.display = 'none';

    // PERFORMANCE: Build the full HTML string first (no DOM touches), then set innerHTML
    // once to avoid hundreds of costly individual DOM reflows (layout thrashing).
    const rowsHtml = filtered.map(r => {
      const isConfirmed = r.status === 'مؤكد';
      const isContract = r.booking_type === 'عقد مفتوح';
      const total = parseFloat(r.total_price || 0);
      const paid = parseFloat(r.paid_amount || 0);
      const deposit = parseFloat(r.deposit_amount || 0);
      const rawRemaining = total - paid;
      const isCredit = rawRemaining < -0.005;
      const remaining = isContract ? rawRemaining : Math.max(0, rawRemaining);
      const fmtTotal = total.toLocaleString();
      const fmtPaid = paid.toLocaleString();
      const fmtRem = remaining.toLocaleString();
      const fmtDep = deposit.toLocaleString();
      const typeBadge = getBookingTypeBadge(r.booking_type);
      const checkOutDisplay = r.check_out_date || (isContract ? 'مفتوح (غير محدد)' : '-');

      return `
        <tr>
          <td style="font-family: monospace; font-weight: 700; color: var(--primary); white-space: nowrap;">#${r.id}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; line-height: 1.2;">
              <span style="font-weight: 800; color: #1e293b; font-size: 0.9rem; white-space: nowrap;">${escapeHtml(r.guest_name)}</span>
              ${typeBadge}
            </div>
            ${r.guest_id_number ? `<div style="font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; line-height: 1.2; margin-top: 2px;">هوية: ${escapeHtml(r.guest_id_number)}</div>` : ''}
          </td>
          <td style="font-family: monospace; font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap;">${escapeHtml(r.guest_phone || '-')}</td>
          <td style="white-space: nowrap; line-height: 1.2;">
            <span style="font-weight: 800; color: #1a4332; line-height: 1.2;">غرفة ${escapeHtml(r.room_number)}</span>
            <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.2; margin-top: 2px;">${escapeHtml(r.room_type || '')}</div>
          </td>
          <td style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; font-family: monospace; direction: ltr; text-align: right; line-height: 1.2;">
            <div style="line-height: 1.2;">${escapeHtml(r.check_in_date)}</div>
            ${r.booking_time ? `<div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace; line-height: 1.2; margin-top: 2px;">${escapeHtml(r.booking_time)}</div>` : ''}
          </td>
          <td style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; font-family: ${r.check_out_date ? 'monospace' : 'inherit'}; direction: ${r.check_out_date ? 'ltr' : 'rtl'}; text-align: right; line-height: 1.2;">${escapeHtml(checkOutDisplay)}</td>
          <td style="white-space: nowrap; line-height: 1.2;">
            <div style="font-weight: 800; color: #1e293b; font-size: 0.88rem; line-height: 1.2;">${fmtTotal} ريال</div>
            ${r.original_calculated_charge != null ? `<div style="font-size: 0.70rem; color: #64748b; font-weight: 600; line-height: 1.2; margin-top: 2px;" title="المبلغ الأصلي قبل تعديل الإدارة">معدل يدوياً (أصلي: ${parseFloat(r.original_calculated_charge).toLocaleString()} ريال)</div>` : ''}
            ${parseFloat(r.discount_amount || 0) > 0 ? `<div style="font-size: 0.70rem; color: #b91c1c; font-weight: 700; line-height: 1.2; margin-top: 2px;">خصم: ${parseFloat(r.discount_amount).toLocaleString()} ريال ${r.discount_reason ? `(${escapeHtml(r.discount_reason)})` : ''}</div>` : ''}
            <div style="font-size: 0.74rem; color: #059669; font-weight: 600; line-height: 1.2; margin-top: 2px;">مدفوع: ${fmtPaid}</div>
            ${isCredit ? `<div style="font-size: 0.72rem; color: #2563eb; font-weight: 800; line-height: 1.2; margin-top: 2px;">رصيد دائن: ${Math.abs(rawRemaining).toLocaleString()} ريال</div>` : (remaining > 0 ? `<div style="font-size: 0.72rem; color: #dc2626; font-weight: 700; line-height: 1.2; margin-top: 2px;">متبقي: ${fmtRem}</div>` : '')}
            ${deposit > 0 ? `<div style="font-size: 0.70rem; color: #4338ca; line-height: 1.2; margin-top: 2px;">تأمين: ${fmtDep}</div>` : ''}
          </td>
          <td style="font-size: 0.82rem; white-space: nowrap;">
            <span class="badge" style="background: rgba(0,0,0,0.04); color: #334155; border: 1px solid #cbd5e1; font-weight: 600;">${escapeHtml(r.payment_method || 'نقداً')}</span>
          </td>
          <td style="white-space: nowrap;">${getPaymentStatusBadge(r.payment_status)}</td>
          <td style="white-space: nowrap; line-height: 1.2;">
            ${getReservationStatusBadge(r.status)}
            ${r.checkout_time ? `<div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace; line-height: 1.2; margin-top: 2px;">${escapeHtml(r.checkout_time)}</div>` : ''}
          </td>
          <td style="text-align: center; white-space: nowrap;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: nowrap;">
              <button type="button" class="btn-action-icon" data-action="invoice" data-id="${r.id}" style="width: 30px; height: 30px; padding: 0; background: #f0fdf4; color: #166534; border: 1.5px solid #bbf7d0; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;" title="طباعة سند الاستلام والإقامة (فاتورة)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              </button>
              ${isConfirmed && (remaining > 0 || isContract) ? `
                <button type="button" class="btn-action-icon btn-pay" data-action="add-payment" data-id="${r.id}" onclick="event.stopPropagation(); window.openAddPaymentModal && window.openAddPaymentModal(${r.id});" style="width: 30px; height: 30px; padding: 0; background: #a67c52; color: #ffffff; border: none; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; box-shadow: 0 2px 8px rgba(166, 124, 82, 0.35);" title="تسجيل دفعة سداد جديدة">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                </button>
              ` : ''}
              ${isConfirmed ? `
                ${r.check_out_date && r.check_out_date !== 'مفتوح' ? `
                  <button type="button" class="btn-action-icon" data-action="extend" data-id="${r.id}" style="width: 30px; height: 30px; padding: 0; background: #eff6ff; color: #1e40af; border: 1.5px solid #bfdbfe; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;" title="تمديد فترة الإقامة">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </button>
                ` : ''}
                <button type="button" class="btn-action-icon" data-action="checkout" data-id="${r.id}" style="width: 30px; height: 30px; padding: 0; background: #ffffff; color: #334155; border: 1.5px solid #cbd5e1; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;" title="تسجيل مغادرة وتسليم الغرفة">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
                <button type="button" class="btn-action-icon" data-action="whatsapp" data-id="${r.id}" style="width: 30px; height: 30px; padding: 0; background: #f0fdf4; color: #16a34a; border: 1.5px solid #86efac; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;" title="مراسلة النزيل عبر واتساب">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </button>
                <button type="button" class="btn-action-icon" data-action="cancel" data-id="${r.id}" style="width: 30px; height: 30px; padding: 0; background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;" title="إلغاء الحجز">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Single DOM write (1 reflow vs N reflows for N rows) — critical for 100+ records
    allReservationsTableBody.innerHTML = rowsHtml;
  }

  // Filter tabs for reservations
  resFilterTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      resFilterTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dashboardState.currentReservationFilter = btn.dataset.filter;
      renderAllReservationsTable();
    });
  });

  searchAllReservations.addEventListener('input', renderAllReservationsTable);

  // 2. SheetJS Export Reservations to Excel
  btnExportReservationsExcel.addEventListener('click', () => {
    if (typeof XLSX === 'undefined') {
      showToast('مكتبة SheetJS غير متوفرة.', 'error');
      return;
    }

    if (dashboardState.reservationsCache.length === 0) {
      showToast('لا توجد حجوزات لتصديرها.', 'info');
      return;
    }

    try {
      const exportRows = dashboardState.reservationsCache.map(r => ({
        'رقم الحجز': r.id,
        'اسم النزيل': r.guest_name,
        'رقم الجوال': r.guest_phone || '',
        'رقم الهوية': r.guest_id_number || '',
        'رقم الغرفة': r.room_number,
        'نوع الغرفة': r.room_type,
        'تاريخ الوصول': r.check_in_date,
        'تاريخ المغادرة': r.check_out_date,
        'المبلغ الإجمالي': r.total_price,
        'حالة الحجز': r.status,
        'تاريخ الإنشاء': r.created_at
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportRows);

      ws['!cols'] = [
        { wch: 12 }, { wch: 26 }, { wch: 16 }, { wch: 18 },
        { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
        { wch: 16 }, { wch: 14 }, { wch: 20 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'الحجوزات');
      const filename = `hotel_reservations_${getLocalDateString()}.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast(`تم تصدير ${exportRows.length} حجز إلى "${filename}" بنجاح!`, 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast(`فشل تصدير Excel: ${err.message}`, 'error');
    }
  });

  // 2. SheetJS Import Reservations from Excel
  inputImportReservationsExcel.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (evt) {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
          showToast('ملف Excel فارغ أو لا يحتوي على صفوف بيانات.', 'error');
          return;
        }

        const res = await api.bulkImportReservations(rows);
        if (res.success && res.data) {
          showToast(`تم استيراد ${res.data.inserted} حجز بنجاح! (تم تخطي ${res.data.skipped})`, 'success');
          await loadReservationsData();
          await loadOverviewData();
        } else {
          showToast(res.error || 'فشل استيراد الحجوزات.', 'error');
        }
      } catch (err) {
        console.error('Import error:', err);
        showToast(`خطأ في قراءة ملف Excel: ${err.message}`, 'error');
      } finally {
        inputImportReservationsExcel.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  });

  // =========================================================================
  // VIEW 3: ROOMS MANAGEMENT LOGIC
  // =========================================================================
  async function loadRoomsData() {
    try {
      const [roomsRes, resRes] = await Promise.all([
        api.getAllRooms(),
        api.getAllReservations()
      ]);
      if (roomsRes && roomsRes.success) {
        dashboardState.roomsCache = roomsRes.data || [];
      }
      if (resRes && resRes.success) {
        dashboardState.reservationsCache = resRes.data || [];
      }
      renderRoomsGrid();
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  }

  function renderRoomsGrid() {
    const todayStr = getLocalDateString();
    const searchTerm = dashboardState.currentRoomSearch.trim().toLowerCase();

    const filtered = dashboardState.roomsCache.filter(room => {
      // 1. Status tab filter (unchanged behaviour)
      if (dashboardState.currentRoomFilter !== 'all' && room.status !== dashboardState.currentRoomFilter) return false;

      // 2. Search filter: room_number or type, case-insensitive
      if (searchTerm) {
        const inNumber = String(room.room_number || '').toLowerCase().includes(searchTerm);
        const inType   = String(room.type || '').toLowerCase().includes(searchTerm);
        if (!inNumber && !inType) return false;
      }

      // 3. Booking-type filter: match against the room's active confirmed reservation.
      //    Rooms with no active reservation are excluded when a type filter is active.
      if (dashboardState.currentRoomBookingType !== 'all') {
        const activeRes = dashboardState.reservationsCache.find(
          r => r.room_id === room.id &&
               r.status === 'مؤكد' &&
               r.check_in_date <= todayStr &&
               (r.check_out_date > todayStr || !r.check_out_date || r.booking_type === 'عقد مفتوح')
        );
        if (!activeRes || activeRes.booking_type !== dashboardState.currentRoomBookingType) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      roomsGridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-light);">
          لا توجد غرف مطابقة لهذا التصنيف.
        </div>
      `;
      return;
    }

    roomsGridContainer.innerHTML = filtered.map(room => {
      let borderClass = 'status-border-available';
      if (room.status === 'مشغولة') borderClass = 'status-border-occupied';
      else if (room.status === 'محجوزة') borderClass = 'status-border-reserved';
      else if (room.status === 'تنظيف') borderClass = 'status-border-cleaning';

      // 1. Actively occupied reservation today (check_in <= today AND (check_out > today OR open contract))
      const activeRes = (room.status === 'مشغولة')
        ? dashboardState.reservationsCache.find(r => r.room_id === room.id && r.status === 'مؤكد' && r.check_in_date <= todayStr && (r.check_out_date > todayStr || !r.check_out_date || r.booking_type === 'عقد مفتوح'))
        : null;

      // 2. Upcoming future reservation (check_in > today)
      const upcomingRes = (room.status === 'محجوزة' || room.status === 'متاحة')
        ? dashboardState.reservationsCache
            .filter(r => r.room_id === room.id && r.status === 'مؤكد' && r.check_in_date > todayStr)
            .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date))[0]
        : null;

      const checkOutDateVal = (activeRes && activeRes.check_out_date) || room.check_out_date;
      const hasCheckOut = checkOutDateVal && String(checkOutDateVal).trim() !== '';

      return `
        <div class="room-card ${borderClass}" data-room-id="${room.id}" style="background: rgba(255, 255, 255, 0.94); border: 1px solid rgba(226, 232, 240, 0.9); border-radius: 16px; box-shadow: 0 10px 25px -4px rgba(15, 23, 42, 0.05), 0 4px 10px -2px rgba(15, 23, 42, 0.02); overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s ease;">
          <div style="padding: 20px 20px 14px;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
              <div>
                <div style="font-size: 1.5rem; font-weight: 900; color: #1a4332; line-height: 1.2; letter-spacing: -0.01em;">
                  غرفة ${escapeHtml(room.room_number)}
                </div>
                <p style="font-size: 0.84rem; font-weight: 600; color: #64748b; margin-top: 2px;">${escapeHtml(room.type)}</p>
              </div>
              <div style="flex-shrink: 0;">
                ${getRoomStatusBadge(room.status)}
              </div>
            </div>

            <div style="font-size: 1.1rem; font-weight: 900; color: #a67c52; margin-top: 8px;">
              ${parseFloat(room.price_per_night || 0).toLocaleString()} <span style="font-size: 0.75rem; font-weight: 600; color: #94a3b8;">ريال / ليلة</span>
            </div>

            <!-- Active Stay Box (Occupied Today) -->
            ${activeRes ? `
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 9px 12px; margin-top: 10px;">
                <div style="font-weight: 700; color: #166534; font-size: 0.82rem; display: flex; align-items: center; justify-content: space-between;">
                  <span>👤 ${escapeHtml(activeRes.guest_name)}</span>
                  <span style="font-size: 0.72rem; color: #a67c52; font-weight: 800;">حجز نشط #${activeRes.id}</span>
                </div>
                <div style="font-size: 0.74rem; color: #475569; margin-top: 4px;">
                  ${hasCheckOut 
                    ? `المغادرة: <strong style="color: #0f172a;">${escapeHtml(checkOutDateVal)}</strong>` 
                    : `<span style="color: #0284c7; font-weight: 700;">المغادرة: عقد مفتوح (بدون تاريخ)</span>`}
                </div>
              </div>
            ` : ''}

            <!-- Upcoming Reservation Box (Future Booking) -->
            ${(!activeRes && upcomingRes) ? `
              <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 9px 12px; margin-top: 10px;">
                <div style="font-weight: 700; color: #1e40af; font-size: 0.82rem; display: flex; align-items: center; justify-content: space-between;">
                  <span>📅 ${escapeHtml(upcomingRes.guest_name)}</span>
                  <span style="font-size: 0.72rem; color: #2563eb; font-weight: 800;">حجز قادم #${upcomingRes.id}</span>
                </div>
                <div style="font-size: 0.74rem; color: #475569; margin-top: 4px;">
                  الوصول: <strong style="color: #1e3a8a;">${escapeHtml(upcomingRes.check_in_date)}</strong> | ${upcomingRes.check_out_date ? `المغادرة: <strong>${escapeHtml(upcomingRes.check_out_date)}</strong>` : 'المغادرة: <strong style="color: #0284c7;">عقد مفتوح (بدون تاريخ)</strong>'}
                </div>
              </div>
            ` : ''}

            <!-- Quick Action Buttons -->
            <div style="display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap;">
              ${(room.status === 'متاحة' || room.status === 'محجوزة') ? `
                <button type="button" class="btn-room-action" data-action="quick-book" data-room-id="${room.id}" style="border: none; border-radius: 8px; padding: 7px 14px; font-size: 0.8rem; font-weight: 800; cursor: pointer; transition: all 0.15s; background: #1a4332; color: #ffffff; box-shadow: 0 2px 6px rgba(26,67,50,0.25);">
                  <span>حجز الغرفة ➕</span>
                </button>
              ` : ''}

              ${room.status === 'تنظيف' ? `
                <button type="button" class="btn-room-action" data-action="quick-ready" data-room-id="${room.id}" style="border: none; border-radius: 8px; padding: 7px 14px; font-size: 0.8rem; font-weight: 800; cursor: pointer; transition: all 0.15s; background: #059669; color: #ffffff; box-shadow: 0 2px 6px rgba(5,150,105,0.25);">
                  <span>تم التنظيف (جاهزة) ✓</span>
                </button>
              ` : ''}

              ${room.status === 'مشغولة' && activeRes ? `
                <button type="button" class="btn-room-action" data-action="checkout" data-id="${activeRes.id}" style="border: none; border-radius: 8px; padding: 7px 12px; font-size: 0.8rem; font-weight: 800; cursor: pointer; transition: all 0.15s; background: #dc2626; color: #ffffff;">
                  <span>تسجيل خروج &larr;</span>
                </button>
                ${activeRes.check_out_date && activeRes.check_out_date !== 'مفتوح' ? `
                  <button type="button" class="btn-room-action" data-action="extend" data-id="${activeRes.id}" style="border: none; border-radius: 8px; padding: 7px 12px; font-size: 0.8rem; font-weight: 800; cursor: pointer; transition: all 0.15s; background: #1e3a8a; color: #ffffff;" title="تمديد فترة الإقامة">
                    <span>تمديد ⏳</span>
                  </button>
                ` : ''}
                <button type="button" class="btn-room-action" data-action="invoice" data-id="${activeRes.id}" style="border: none; border-radius: 8px; padding: 7px 12px; font-size: 0.8rem; font-weight: 800; cursor: pointer; transition: all 0.15s; background: #1a4332; color: #ffffff;">
                  <span>فاتورة 🖨️</span>
                </button>
              ` : ''}

              ${room.status === 'محجوزة' && upcomingRes ? `
                <button type="button" class="btn-room-action" data-action="invoice" data-id="${upcomingRes.id}" style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 12px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.15s; background: #ffffff; color: #1e293b;">
                  <span>فاتورة الحجز 🖨️</span>
                </button>
              ` : ''}

              <button type="button" class="btn-room-action" data-action="room-revenue" data-room-id="${room.id}" style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 12px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.15s; background: #f8fafc; color: #334155;">
                <span>إيرادات 📊</span>
              </button>
            </div>
          </div>

          <!-- Seamless Acrylic Footer -->
          <div style="border-top: 1px solid #f1f5f9; background: rgba(248, 250, 252, 0.7); padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 0.76rem; font-weight: 700; color: #64748b;">الحالة:</span>
              ${room.status === 'مشغولة' ? `
                <div style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 0.8rem; font-weight: 800; border-radius: 6px; background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5;" title="الغرفة مشغولة بنزيل حالياً - مقفلة حتى تسجيل المغادرة (Check-out)">
                  <span>🔒 مشغولة</span>
                </div>
              ` : room.status === 'محجوزة' ? `
                <div style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 0.8rem; font-weight: 800; border-radius: 6px; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;" title="الغرفة محجوزة لحجز قادم">
                  <span>⏳ محجوزة</span>
                </div>
              ` : `
                <select class="room-status-select" data-room-id="${room.id}" style="width: auto; padding: 4px 8px; font-size: 0.8rem; font-weight: 700; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; color: #0f172a;">
                  <option value="متاحة" ${room.status === 'متاحة' ? 'selected' : ''}>متاحة</option>
                  <option value="تنظيف" ${room.status === 'تنظيف' ? 'selected' : ''}>تنظيف</option>
                </select>
              `}
            </div>
            <button type="button" class="btn-room-action" data-action="edit-room" data-room-id="${room.id}" style="background: #ffffff; color: #1e293b; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 700; font-size: 0.78rem; padding: 5px 12px; cursor: pointer; transition: all 0.15s;" title="تعديل تفاصيل الغرفة (الرقم، النوع، السعر)">
              <span>تعديل ✏️</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  roomsFilterTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      roomsFilterTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dashboardState.currentRoomFilter = btn.dataset.roomFilter;
      renderRoomsGrid();
    });
  });

  // Search rooms by room_number / type — re-render on every keystroke
  if (searchRoomsInput) {
    searchRoomsInput.addEventListener('input', () => {
      dashboardState.currentRoomSearch = searchRoomsInput.value;
      renderRoomsGrid();
    });
  }

  // Booking-type filter tabs
  roomsBookingTypeTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      roomsBookingTypeTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dashboardState.currentRoomBookingType = btn.dataset.roomBookingType;
      renderRoomsGrid();
    });
  });

  // Room Card Click: Clicking an available or reserved room card initiates booking with auto-fill
  roomsGridContainer.addEventListener('click', (e) => {
    if (e.target.closest('button, select, input, a')) return;
    const card = e.target.closest('.room-card');
    if (!card) return;

    const roomId = card.dataset.roomId;
    const targetRoom = dashboardState.roomsCache.find(r => r.id === parseInt(roomId, 10));
    if (targetRoom && (targetRoom.status === 'متاحة' || targetRoom.status === 'محجوزة')) {
      initiateRoomBooking(roomId);
    }
  });

  roomsGridContainer.addEventListener('change', async (e) => {
    const select = e.target.closest('.room-status-select');
    if (!select) return;

    const roomId = parseInt(select.dataset.roomId, 10);
    const newStatus = select.value;

    const targetRoom = dashboardState.roomsCache.find(r => r.id === roomId);
    if (targetRoom && targetRoom.status === 'مشغولة') {
      showToast(`لا يمكن تغيير حالة الغرفة (${targetRoom.room_number}) لأنها مشغولة بحجز نشط. يجب تسجيل المغادرة أولاً.`, 'error');
      renderRoomsGrid();
      return;
    }

    try {
      const res = await api.updateRoomStatus(roomId, newStatus);
      if (res.success) {
        showToast(`تم تحديث حالة الغرفة إلى "${newStatus}"`, 'success');
        await loadRoomsData();
        await loadOverviewData();
      } else {
        showToast('فشل تحديث حالة الغرفة.', 'error');
      }
    } catch (err) {
      showToast(`خطأ: ${err.message}`, 'error');
      await loadRoomsData();
    }
  });

  btnToggleAddRoom.addEventListener('click', () => {
    const isHidden = addRoomPanel.style.display === 'none';
    addRoomPanel.style.display = isHidden ? 'block' : 'none';
    if (isHidden) newRoomNumber.focus();
  });

  btnCancelAddRoom.addEventListener('click', () => {
    addRoomPanel.style.display = 'none';
    addRoomForm.reset();
  });

  addRoomForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const room_number = newRoomNumber.value.trim();
    const type = newRoomType.value.trim();
    const price_per_night = parseFloat(newRoomPrice.value) || 0;
    const status = newRoomStatus.value;

    if (!room_number || !type || !price_per_night) {
      showToast('يرجى ملء جميع بيانات الغرفة.', 'error');
      return;
    }

    try {
      const res = await api.addRoom({ room_number, type, price_per_night, status });
      if (res.success) {
        showToast(`تمت إضافة الغرفة ${room_number} بنجاح!`, 'success');
        addRoomForm.reset();
        addRoomPanel.style.display = 'none';
        await loadRoomsData();
      } else {
        showToast(res.error || 'فشل في إضافة الغرفة.', 'error');
      }
    } catch (err) {
      showToast(`خطأ: ${err.message}`, 'error');
    }
  });

  const { openEditRoomModal, closeEditRoomModal } = createEditRoomModal({
    getRooms: () => dashboardState.roomsCache,
    modal: editRoomModal,
    form: editRoomForm,
    idInput: editRoomId,
    numberInput: editRoomNumber,
    typeInput: editRoomType,
    priceInput: editRoomPrice,
    statusInput: editRoomStatus,
    statusLockedHint: editRoomStatusLockedHint,
    deleteButton: btnDeleteRoom,
    showToast
  });

  if (btnCloseEditRoomModal) {
    btnCloseEditRoomModal.addEventListener('click', closeEditRoomModal);
  }
  if (btnCancelEditRoom) {
    btnCancelEditRoom.addEventListener('click', closeEditRoomModal);
  }
  if (editRoomModal) {
    editRoomModal.addEventListener('click', (e) => {
      if (e.target === editRoomModal) closeEditRoomModal();
    });
  }

  if (editRoomForm) {
    editRoomForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = parseInt(editRoomId.value, 10);
      const room_number = editRoomNumber.value.trim();
      const type = editRoomType.value.trim();
      const price_per_night = parseFloat(editRoomPrice.value) || 0;

      const currentRoom = dashboardState.roomsCache.find(r => r.id === id);
      const isOccupied = currentRoom && currentRoom.status === 'مشغولة';
      const status = isOccupied ? 'مشغولة' : editRoomStatus.value;

      if (!room_number || !type || !price_per_night) {
        showToast('يرجى ملء جميع بيانات الغرفة المطلوبة.', 'error');
        return;
      }

      try {
        const res = await api.updateRoom({ id, room_number, type, price_per_night, status });
        if (res && res.success) {
          showToast(`تم حفظ وتحديث بيانات الغرفة ${room_number} بنجاح! ✓`, 'success');
          closeEditRoomModal();
          await loadRoomsData();
          await loadOverviewData();
          await loadReservationsData();
        } else {
          showToast(res?.error || 'فشل تحديث بيانات الغرفة.', 'error');
        }
      } catch (err) {
        showToast(`خطأ: ${err.message}`, 'error');
      }
    });
  }

  if (btnDeleteRoom) {
    btnDeleteRoom.addEventListener('click', async () => {
      const id = parseInt(editRoomId.value, 10);
      const roomNum = editRoomNumber.value.trim();
      if (!id) return;

      const currentRoom = dashboardState.roomsCache.find(r => r.id === id);
      if (currentRoom && currentRoom.status === 'مشغولة') {
        showToast(`لا يمكن حذف الغرفة (${roomNum}) لأنها مشغولة بحجز نشط حالياً. يرجى إنهاء أو إلغاء الحجز أولاً.`, 'error');
        return;
      }

      const confirmed = await showConfirmDialog({
        title: 'حذف الغرفة الفندقية',
        message: `تحذير هام:\nهل أنت متأكد من رغبتك في حذف الغرفة رقم "${roomNum}" نهائياً من قاعدة البيانات؟`,
        confirmText: 'نعم، حذف الغرفة',
        cancelText: 'إلغاء',
        isDanger: true
      });
      if (!confirmed) {
        return;
      }

      try {
        const res = await api.deleteRoom(id);
        if (res && res.success) {
          showToast(`تم حذف الغرفة رقم ${roomNum} بنجاح.`, 'success');
          closeEditRoomModal();
          await loadRoomsData();
          await loadOverviewData();
          await loadReservationsData();
        } else {
          showToast(res?.error || 'فشل حذف الغرفة.', 'error');
        }
      } catch (err) {
        showToast(`خطأ أثناء الحذف: ${err.message}`, 'error');
      }
    });
  }

  // =========================================================================
  // VIEW 4: GUESTS DIRECTORY (SERVER-SIDE PAGINATION) + EXCEL IMPORT / EXPORT
  // =========================================================================
  let guestsCurrentPage = 1;
  const guestsPageLimit = 50;
  let guestsTotalPages = 1;
  let guestsTotalCount = 0;
  let guestSearchDebounceTimer = null;
  let currentGuestBanFilter = 'all';

  async function loadGuestsData(page = guestsCurrentPage) {
    try {
      guestsCurrentPage = Math.max(1, page);
      const query = (searchGuests ? searchGuests.value : '').trim();

      const res = await api.getGuestsPaginated({
        page: guestsCurrentPage,
        limit: guestsPageLimit,
        search: query,
        banFilter: currentGuestBanFilter
      });

      if (res && res.success) {
        dashboardState.guestsCache = res.data || [];
        const pag = res.pagination || {};
        guestsTotalCount = res.totalCount !== undefined ? res.totalCount : (pag.totalCount || 0);
        guestsTotalPages = res.totalPages !== undefined ? res.totalPages : (pag.totalPages || 1);
        guestsCurrentPage = res.page !== undefined ? res.page : (pag.page || 1);

        renderGuestsTable();
        updateGuestsPaginationUI();
      }
    } catch (err) {
      console.error('Error loading guests:', err);
      showToast('خطأ أثناء تحميل بيانات النزلاء.', 'error');
    }
  }

  function renderGuestsTable() {
    if (guestsCountBadge) guestsCountBadge.textContent = guestsTotalCount.toLocaleString();

    if (!dashboardState.guestsCache || dashboardState.guestsCache.length === 0) {
      guestsTableBody.innerHTML = '';
      if (guestsEmpty) guestsEmpty.style.display = 'block';
      return;
    }

    if (guestsEmpty) guestsEmpty.style.display = 'none';

    const activeRole = localStorage.getItem(STORAGE_KEYS.currentUserRole) || (dashboardState.currentUser ? dashboardState.currentUser.role : null);
    const isAdmin = activeRole === 'Admin';

    document.querySelectorAll('#view-guests .admin-only').forEach(el => {
      el.style.display = isAdmin ? '' : 'none';
    });

    guestsTableBody.innerHTML = dashboardState.guestsCache.map(g => {
      const totalStays = parseInt(g.total_stays, 10) || 0;
      const totalSpent = parseFloat(g.total_spent) || 0;
      const isBanned = Number(g.is_banned) === 1;

      return `
        <tr>
          <td style="font-family: monospace; font-weight: 700; color: var(--primary);">#${g.id}</td>
          <td style="font-weight: 800; color: #1e293b; font-size: 0.9rem;">
            ${escapeHtml(g.name)}
          </td>
          <td style="font-family: monospace; color: var(--text-secondary);">${escapeHtml(g.phone || '-')}</td>
          <td style="color: var(--text-secondary);">${escapeHtml(g.id_number || '-')}</td>
          <td>
            <span class="badge" style="background: #fdfaf7; color: #a67c52; border: 1px solid rgba(166, 124, 82, 0.35); font-weight: 800;">
              ${totalStays} ${totalStays === 1 ? 'إقامة' : 'إقامات'}
            </span>
          </td>
          <td style="font-weight: 800; color: var(--primary);">${totalSpent.toLocaleString()} ريال</td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(String(g.created_at || '').split(' ')[0])}</td>
          ${isAdmin ? `
            <td>
              <span class="badge ${isBanned ? 'badge-cancelled' : 'badge-confirmed'}">
                ${isBanned ? 'محظور' : 'نشط'}
              </span>
            </td>
          ` : ''}
          <td style="text-align: center; white-space: nowrap;">
            <div style="display: inline-flex; align-items: center; gap: 6px; justify-content: center;">
              <button type="button" class="btn btn-secondary btn-sm" data-action="edit-guest" data-id="${g.id}" style="padding: 4px 10px; font-size: 0.78rem; font-weight: 700;">
                تعديل ✏️
              </button>
              ${isAdmin ? `
                <button type="button" class="btn ${isBanned ? 'btn-secondary' : 'btn-danger'} btn-sm" data-action="toggle-ban-guest" data-id="${g.id}" data-name="${escapeHtml(g.name)}" data-banned="${isBanned ? '1' : '0'}" style="padding: 4px 10px; font-size: 0.78rem; font-weight: 700;">
                  ${isBanned ? 'إلغاء الحظر' : 'حظر'}
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function updateGuestsPaginationUI() {
    if (guestsCurrentPageEl) guestsCurrentPageEl.textContent = guestsCurrentPage;
    if (guestsTotalPagesEl) guestsTotalPagesEl.textContent = Math.max(1, guestsTotalPages);
    if (guestsTotalCountEl) guestsTotalCountEl.textContent = guestsTotalCount.toLocaleString();

    if (guestsPageRangeEl) {
      if (guestsTotalCount === 0) {
        guestsPageRangeEl.textContent = '0 - 0';
      } else {
        const start = (guestsCurrentPage - 1) * guestsPageLimit + 1;
        const end = Math.min(guestsCurrentPage * guestsPageLimit, guestsTotalCount);
        guestsPageRangeEl.textContent = `${start} - ${end}`;
      }
    }

    if (btnGuestsPrevPage) {
      btnGuestsPrevPage.disabled = guestsCurrentPage <= 1;
    }
    if (btnGuestsNextPage) {
      btnGuestsNextPage.disabled = guestsCurrentPage >= guestsTotalPages;
    }
  }

  if (btnGuestsPrevPage) {
    btnGuestsPrevPage.addEventListener('click', () => {
      if (guestsCurrentPage > 1) {
        loadGuestsData(guestsCurrentPage - 1);
      }
    });
  }

  if (btnGuestsNextPage) {
    btnGuestsNextPage.addEventListener('click', () => {
      if (guestsCurrentPage < guestsTotalPages) {
        loadGuestsData(guestsCurrentPage + 1);
      }
    });
  }

  if (searchGuests) {
    searchGuests.addEventListener('input', () => {
      clearTimeout(guestSearchDebounceTimer);
      guestSearchDebounceTimer = setTimeout(() => {
        loadGuestsData(1);
      }, 250);
    });
  }

  // Ban-status filter tabs — re-fetch from page 1 with new filter applied server-side
  guestsBanFilterTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      guestsBanFilterTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGuestBanFilter = btn.dataset.banFilter;
      loadGuestsData(1);
    });
  });

  // Ban / Unban & Edit Guest Action Delegation
  if (guestsTableBody) {
    guestsTableBody.addEventListener('click', async (e) => {
      // Edit Guest (All Staff & Admin)
      const editBtn = e.target.closest('button[data-action="edit-guest"]');
      if (editBtn) {
        const guestId = parseInt(editBtn.dataset.id, 10);
        openEditGuestModal(guestId);
        return;
      }

      const btn = e.target.closest('button[data-action="toggle-ban-guest"]');
      if (!btn) return;

      const guestId = parseInt(btn.dataset.id, 10);
      const guestName = btn.dataset.name || 'النزيل';
      const isCurrentlyBanned = btn.dataset.banned === '1';

      const activeRole = localStorage.getItem(STORAGE_KEYS.currentUserRole) || (dashboardState.currentUser ? dashboardState.currentUser.role : 'User');
      if (activeRole !== 'Admin') {
        showToast('عذراً: هذا الإجراء مخصص لمدير النظام فقط.', 'error');
        return;
      }

      if (isCurrentlyBanned) {
        // Unban confirmation
        const confirmed = await showConfirmDialog({
          title: 'إلغاء حظر النزيل',
          message: `هل أنت متأكد من إلغاء الحظر عن النزيل "${guestName}"؟\nسيتمكن النزيل من الحجز مجدداً دون قيود أو تنبيهات.`,
          confirmText: 'نعم، إلغاء الحظر',
          cancelText: 'تراجع',
          isDanger: false
        });

        if (!confirmed) return;

        try {
          const res = await api.setGuestBanStatus({ guestId, isBanned: 0, reason: '' });
          if (res && res.success) {
            showToast(`تم إلغاء الحظر عن النزيل "${guestName}" بنجاح!`, 'success');
            await loadGuestsData();
          } else {
            showToast(res?.error || 'فشل إلغاء الحظر.', 'error');
          }
        } catch (err) {
          showToast(`خطأ: ${err.message}`, 'error');
        }
      } else {
        // Ban prompt for reason
        const reason = await showPromptDialog({
          title: 'حظر النزيل (إدراج في القائمة السوداء)',
          message: `يرجى إدخال سبب حظر النزيل "${guestName}":`,
          placeholder: 'مثال: إتلاف أثاث الغرفة / سلوك غير لائق / تخلف عن السداد...',
          confirmText: 'تأكيد الحظر',
          cancelText: 'إلغاء'
        });

        if (reason === null) return; // User cancelled

        try {
          const res = await api.setGuestBanStatus({ guestId, isBanned: 1, reason });
          if (res && res.success) {
            showToast(`تم إدراج النزيل "${guestName}" في قائمة الحظر بنجاح!`, 'success');
            await loadGuestsData();
          } else {
            showToast(res?.error || 'فشل حظر النزيل.', 'error');
          }
        } catch (err) {
          showToast(`خطأ: ${err.message}`, 'error');
        }
      }
    });
  }

  const { openEditGuestModal, closeEditGuestModal } = createEditGuestModal({
    getGuests: () => dashboardState.guestsCache,
    modal: editGuestModal,
    form: editGuestForm,
    idInput: editGuestId,
    nameInput: editGuestName,
    phoneInput: editGuestPhone,
    idNumberInput: editGuestIdNumber,
    showToast
  });

  if (btnCloseEditGuest) btnCloseEditGuest.addEventListener('click', closeEditGuestModal);
  if (btnCancelEditGuest) btnCancelEditGuest.addEventListener('click', closeEditGuestModal);
  if (editGuestModal) {
    editGuestModal.addEventListener('click', (e) => {
      if (e.target === editGuestModal) closeEditGuestModal();
    });
  }

  if (editGuestForm) {
    editGuestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const guestId = parseInt(editGuestId.value, 10);
      const name = editGuestName.value.trim();
      const phone = editGuestPhone.value.trim();
      const id_number = editGuestIdNumber.value.trim();

      if (!name) {
        showToast('يرجى إدخال اسم النزيل.', 'warning');
        return;
      }

      try {
        if (btnSaveEditGuest) {
          btnSaveEditGuest.disabled = true;
          btnSaveEditGuest.textContent = 'جاري الحفظ...';
        }

        const res = await api.updateGuest({ guestId, name, phone, id_number });
        if (res && res.success) {
          showToast('تم تحديث بيانات النزيل بنجاح! ✓', 'success');
          closeEditGuestModal();
          await loadGuestsData(guestsCurrentPage);
        } else {
          showToast(res?.error || 'فشل تحديث بيانات النزيل.', 'error');
        }
      } catch (err) {
        showToast(`خطأ: ${err.message}`, 'error');
      } finally {
        if (btnSaveEditGuest) {
          btnSaveEditGuest.disabled = false;
          btnSaveEditGuest.textContent = 'حفظ التعديلات ✓';
        }
      }
    });
  }

  // Export Guests to Excel (fetches full list from database)
  btnExportGuestsExcel.addEventListener('click', async () => {
    if (typeof XLSX === 'undefined') {
      showToast('مكتبة SheetJS غير متوفرة.', 'error');
      return;
    }

    try {
      showToast('جاري تحضير ملف Excel لكافة النزلاء...', 'info');
      const allRes = await api.getAllGuests();
      const allGuestsList = (allRes && allRes.data) ? allRes.data : dashboardState.guestsCache;

      if (!allGuestsList || allGuestsList.length === 0) {
        showToast('لا توجد بيانات نزلاء لتصديرها.', 'info');
        return;
      }

      const exportRows = allGuestsList.map(g => ({
        'معرف النزيل': g.id,
        'اسم النزيل': g.name,
        'رقم الجوال': g.phone || '',
        'رقم الهوية / الجواز': g.id_number || '',
        'عدد الإقامات': parseInt(g.total_stays, 10) || 0,
        'إجمالي المدفوعات': parseFloat(g.total_spent) || 0,
        'تاريخ التسجيل': g.created_at
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportRows);

      ws['!cols'] = [
        { wch: 12 }, { wch: 28 }, { wch: 18 }, { wch: 20 },
        { wch: 14 }, { wch: 18 }, { wch: 20 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'قائمة النزلاء');
      const filename = `hotel_guests_${getLocalDateString()}.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast(`تم تصدير ${exportRows.length} نزيل إلى "${filename}" بنجاح!`, 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast(`فشل تصدير Excel: ${err.message}`, 'error');
    }
  });

  // Import Guests from CSV / Excel (with dual UTF-8 & Windows-1256 Arabic encoding support + smart column detector)
  if (inputImportGuestsExcel) {
    inputImportGuestsExcel.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async function (evt) {
        try {
          const rawBuffer = evt.target.result;
          const uint8Array = new Uint8Array(rawBuffer);

          let wb;
          // Check magic numbers for binary Excel (XLSX = PK / 0x50 0x4B, XLS = 0xD0 0xCF)
          const isZip = uint8Array.length > 2 && uint8Array[0] === 0x50 && uint8Array[1] === 0x4b;
          const isCfb = uint8Array.length > 2 && uint8Array[0] === 0xd0 && uint8Array[1] === 0xcf;

          if (isZip || isCfb) {
            wb = XLSX.read(uint8Array, { type: 'array' });
          } else {
            // Plain text CSV: decode with UTF-8 or fallback to Windows-1256 (standard Arabic Windows Excel encoding)
            let decodedText = '';
            try {
              const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
              decodedText = utf8Decoder.decode(uint8Array);
              if (decodedText.includes('\uFFFD')) {
                throw new Error('Mojibake detected');
              }
            } catch (utfErr) {
              try {
                const win1256Decoder = new TextDecoder('windows-1256');
                decodedText = win1256Decoder.decode(uint8Array);
              } catch (winErr) {
                decodedText = new TextDecoder('utf-8').decode(uint8Array);
              }
            }
            wb = XLSX.read(decodedText, { type: 'string' });
          }

          const sheetName = wb.SheetNames[0];
          const sheet = wb.Sheets[sheetName];
          if (!sheet) {
            showToast('الملف المرفوع لا يحتوي على أي صفحات بيانات.', 'error');
            return;
          }

          const cleanVal = (v) => String(v !== undefined && v !== null ? v : '').trim();

          // 1. Try reading as Object rows with flexible key lookup
          const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
          let guestsData = [];

          if (rawRows && rawRows.length > 0) {
            guestsData = rawRows.map(row => {
              let name = '', phone = '', id_number = '';
              const cleanEntries = Object.entries(row).map(([k, v]) => [cleanVal(k).toLowerCase(), cleanVal(v)]);

              // Header mapping
              for (const [k, v] of cleanEntries) {
                if (!v) continue;
                if (!name && /^(الاسم|اسم النزيل|اسم العميل|الاسم الكامل|النزيل|العميل|name|guest_name|customer_name|fullname|full_name)$/i.test(k)) {
                  name = v;
                } else if (!phone && /^(الجوال|رقم الجوال|الهاتف|رقم الهاتف|الموبايل|رقم الموبايل|phone|mobile|tel|telephone|phone_number|mobile_number)$/i.test(k)) {
                  phone = v;
                } else if (!id_number && /^(الهوية|رقم الهوية|الهوية الوطنية|السجل المدني|الإقامة|رقم الإقامة|بطاقة الأحوال|الجواز|رقم الجواز|جواز السفر|رقم جواز السفر|passport|passport_number|id|id_number|national_id|iqama)$/i.test(k)) {
                  id_number = v;
                }
              }

              // Smart content-pattern heuristic fallback
              if (!name || !phone || !id_number) {
                for (const [, v] of cleanEntries) {
                  if (!v) continue;
                  const digits = v.replace(/\D/g, '');
                  if (!id_number && /^[12]\d{9}$/.test(digits)) {
                    id_number = digits;
                  } else if (!id_number && /^[A-Za-z0-9\-]{6,15}$/.test(v.trim()) && !/^(الاسم|الجوال|الهوية|name|phone|id)$/i.test(v)) {
                    id_number = v.trim();
                  } else if (!phone && ((digits.startsWith('05') && digits.length === 10) || (digits.startsWith('5') && (digits.length === 8 || digits.length === 9)) || (digits.startsWith('9665') && digits.length === 12))) {
                    phone = digits;
                  } else if (!name && v.length >= 2 && !/^\d+$/.test(v) && !/^(الاسم|الجوال|الهوية|name|phone|id)$/i.test(v)) {
                    name = v;
                  }
                }
              }

              // Normalize phone (prepend 0 if starting with 5)
              let normPhone = phone.replace(/\D/g, '');
              if (normPhone.startsWith('9665') && normPhone.length === 12) {
                normPhone = '0' + normPhone.substring(3);
              } else if (normPhone.startsWith('5') && (normPhone.length === 8 || normPhone.length === 9)) {
                normPhone = '0' + normPhone;
              }

              return {
                name,
                phone: normPhone,
                id_number: id_number.replace(/[^A-Za-z0-9\-]/g, '').trim(),
                guest_name: name,
                phone_number: normPhone
              };
            }).filter(g => g.name);
          }

          // 2. Fallback to 2D Array by column index if header-based parsing returned nothing
          if (guestsData.length === 0) {
            const rawArrays = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            for (const arr of rawArrays) {
              if (!Array.isArray(arr) || arr.length === 0) continue;
              const c0 = cleanVal(arr[0]);
              const c1 = cleanVal(arr[1]);
              const c2 = cleanVal(arr[2]);
              // Skip header line if detected
              if (/^(الاسم|name|اسم النزيل)$/i.test(c0) || /^(الجوال|phone|رقم الجوال)$/i.test(c1)) continue;
              if (c0 && c0.length >= 2 && !/^\d+$/.test(c0)) {
                let p = c1.replace(/\D/g, '');
                if (p.startsWith('5') && (p.length === 8 || p.length === 9)) p = '0' + p;
                guestsData.push({
                  name: c0,
                  phone: p,
                  id_number: c2.replace(/[^A-Za-z0-9\-]/g, '').trim(),
                  guest_name: c0,
                  phone_number: p
                });
              }
            }
          }

          if (guestsData.length === 0) {
            showToast('لم يتم العثور على بيانات نزلاء صالحة في الملف المرفوع.', 'error');
            return;
          }

          // إرسال المصفوفة عبر IPC إلى الباك إند
          const res = await api.importGuests(guestsData);

          if (res.success) {
            const count = res.importedCount ?? res.data?.inserted ?? 0;
            const updated = res.updatedCount ?? res.data?.updated ?? 0;
            const total = res.totalCount ?? guestsData.length;
            const updatedGuests = res.updatedGuests || [];

            // 1. تحديث جدول النزلاء في الشاشة فوراً حتى تكون البيانات جاهزة خلف النافذة
            await loadGuestsData();

            // 2. إشعار Toast علوي سريع
            showToast(`تم استيراد ${count} عميل بنجاح!`, 'success');

            // 3. فتح نافذة التقرير العصرية المنبثقة (بدون alert النظام القديم)
            openImportResultModal({
              importedCount: count,
              updatedCount: updated,
              totalCount: total,
              updatedGuests: updatedGuests
            });
          } else {
            showToast(res.message || res.error || 'فشل استيراد بيانات النزلاء.', 'error');
          }
        } catch (err) {
          console.error('Import error:', err);
          showToast(`خطأ في قراءة ملف البيانات: ${err.message}`, 'error');
        } finally {
          inputImportGuestsExcel.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Import Result Modal Handlers
  const importResultModal = document.getElementById('import-result-modal');
  const btnCloseImportResultModal = document.getElementById('btn-close-import-result-modal');
  const btnConfirmImportResult = document.getElementById('btn-confirm-import-result');
  const btnToggleUpdatedGuestsList = document.getElementById('btn-toggle-updated-guests-list');
  const importModalUpdatedContainer = document.getElementById('import-modal-updated-container');
  const importModalToggleArrow = document.getElementById('import-modal-toggle-arrow');

  function openImportResultModal({ importedCount, updatedCount, totalCount, updatedGuests }) {
    if (!importResultModal) return;

    const insertedEl = document.getElementById('import-modal-inserted');
    const updatedEl = document.getElementById('import-modal-updated');
    const totalEl = document.getElementById('import-modal-total');
    const totalSystemEl = document.getElementById('import-modal-total-system-guests');

    if (insertedEl) insertedEl.textContent = importedCount;
    if (updatedEl) updatedEl.textContent = updatedCount;
    if (totalEl) totalEl.textContent = totalCount;
    if (totalSystemEl) totalSystemEl.textContent = dashboardState.guestsCache.length;

    const dedupNotice = document.getElementById('import-modal-dedup-notice');
    const updatedInline = document.getElementById('import-modal-updated-inline');
    const updatedSection = document.getElementById('import-modal-updated-section');
    const mergedListCount = document.getElementById('import-modal-merged-list-count');
    const updatedTbody = document.getElementById('import-modal-updated-table-body');

    if (updatedCount > 0) {
      if (dedupNotice) dedupNotice.style.display = 'block';
      if (updatedInline) updatedInline.textContent = updatedCount;
      if (updatedSection) updatedSection.style.display = 'block';
      if (mergedListCount) mergedListCount.textContent = (updatedGuests && updatedGuests.length > 0) ? updatedGuests.length : updatedCount;

      if (updatedTbody) {
        if (updatedGuests && updatedGuests.length > 0) {
          updatedTbody.innerHTML = updatedGuests.map(g => `
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
              <td style="padding: 8px 12px; font-weight: 700; color: #ffffff;">${escapeHtml(g.name || '-')}</td>
              <td style="padding: 8px 12px; font-family: monospace; color: var(--text-secondary);">${escapeHtml(g.phone || '-')}</td>
              <td style="padding: 8px 12px; font-family: monospace; color: var(--text-secondary);">${escapeHtml(g.id_number || '-')}</td>
              <td style="padding: 8px 12px; color: #f59e0b; font-weight: 600;">${escapeHtml(g.matchReason || 'تطابق بيانات')}</td>
            </tr>
          `).join('');
        } else {
          updatedTbody.innerHTML = `
            <tr>
              <td colspan="4" style="padding: 12px; text-align: center; color: var(--text-secondary);">
                تم دمج السجلات المكررة مع النزلاء المسجلين مسبقاً لمنع التكرار.
              </td>
            </tr>
          `;
        }
      }
    } else {
      if (dedupNotice) dedupNotice.style.display = 'none';
      if (updatedSection) updatedSection.style.display = 'none';
    }

    importResultModal.style.display = 'flex';
  }

  function closeImportResultModal() {
    if (importResultModal) {
      importResultModal.style.display = 'none';
    }
  }

  if (btnCloseImportResultModal) {
    btnCloseImportResultModal.addEventListener('click', closeImportResultModal);
  }

  if (btnConfirmImportResult) {
    btnConfirmImportResult.addEventListener('click', () => {
      closeImportResultModal();
      const tableCard = document.querySelector('#view-guests .card');
      if (tableCard) tableCard.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (btnToggleUpdatedGuestsList && importModalUpdatedContainer) {
    btnToggleUpdatedGuestsList.addEventListener('click', () => {
      const isVisible = importModalUpdatedContainer.style.display !== 'none';
      importModalUpdatedContainer.style.display = isVisible ? 'none' : 'block';
      if (importModalToggleArrow) {
        importModalToggleArrow.textContent = isVisible ? 'إظهار التفاصيل ▼' : 'إخفاء التفاصيل ▲';
      }
    });
  }

  // =========================================================================
  // SUBSEQUENT PAYMENT MODAL (تسجيل سداد دفعة جديدة للحجز)
  // =========================================================================
  const addPaymentModal = document.getElementById('add-payment-modal');
  const addPaymentForm = document.getElementById('add-payment-form');
  const paymentReservationId = document.getElementById('payment-reservation-id');
  const paymentModalGuestName = document.getElementById('payment-modal-guest-name');
  const paymentModalRoomInfo = document.getElementById('payment-modal-room-info');
  const paymentModalTotalPrice = document.getElementById('payment-modal-total-price');
  const paymentModalPaidAmount = document.getElementById('payment-modal-paid-amount');
  const paymentModalRemainingBalance = document.getElementById('payment-modal-remaining-balance');
  const paymentNewAmount = document.getElementById('payment-new-amount');
  const paymentMethodSelectModal = document.getElementById('payment-method-select-modal');
  const btnClosePaymentModal = document.getElementById('btn-close-payment-modal');
  const btnCancelPaymentModal = document.getElementById('btn-cancel-payment-modal');
  const btnPayFullRemaining = document.getElementById('btn-pay-full-remaining');

  const { openAddPaymentModal } = createAddPaymentModal({
    api,
    getReservations: () => dashboardState.reservationsCache,
    setReservations: reservations => { dashboardState.reservationsCache = reservations; },
    getActiveUserId: () => localStorage.getItem(STORAGE_KEYS.currentUserId) || (dashboardState.currentUser ? dashboardState.currentUser.id : null),
    showToast,
    refreshReservations: loadReservationsData,
    refreshOverview: loadOverviewData,
    refreshRooms: loadRoomsData,
    modal: addPaymentModal,
    form: addPaymentForm,
    reservationIdInput: paymentReservationId,
    guestName: paymentModalGuestName,
    roomInfo: paymentModalRoomInfo,
    totalPrice: paymentModalTotalPrice,
    paidAmount: paymentModalPaidAmount,
    remainingBalance: paymentModalRemainingBalance,
    newAmount: paymentNewAmount,
    paymentMethod: paymentMethodSelectModal,
    closeButton: btnClosePaymentModal,
    cancelButton: btnCancelPaymentModal,
    payFullButton: btnPayFullRemaining,
    saveButton: document.getElementById('btn-save-payment')
  });
  window.openAddPaymentModal = openAddPaymentModal;

  // =========================================================================
  // OPEN CONTRACT SETTLEMENT & CHECKOUT MODAL
  // =========================================================================
  const openContractSettleModalEl = document.getElementById('open-contract-settle-modal');
  const openContractSettleForm = document.getElementById('open-contract-settle-form');
  const settleReservationId = document.getElementById('settle-reservation-id');
  const settlePricePerNightInput = document.getElementById('settle-price-per-night');
  const settleGuestName = document.getElementById('settle-guest-name');
  const settleRoomInfo = document.getElementById('settle-room-info');
  const settleCheckinDate = document.getElementById('settle-checkin-date');
  const settleCheckoutDate = document.getElementById('settle-checkout-date');
  const settleNightsCount = document.getElementById('settle-nights-count');
  const settleTotalPriceDisplay = document.getElementById('settle-total-price-display');
  const settlePaidAmountDisplay = document.getElementById('settle-paid-amount-display');
  const settleBalanceBox = document.getElementById('settle-balance-box');
  const settleBalanceLabel = document.getElementById('settle-balance-label');
  const settleBalanceValue = document.getElementById('settle-balance-value');
  const settleBalanceSub = document.getElementById('settle-balance-sub');
  const settleDiscountInput = document.getElementById('settle-discount-input');
  const settleDiscountReasonInput = document.getElementById('settle-discount-reason-input');
  const settleBreakdownHint = document.getElementById('settle-breakdown-hint');
  const settleFinalTotalInput = document.getElementById('settle-final-total-input');
  const settlePaymentSection = document.getElementById('settle-payment-section');
  const settlePayNowInput = document.getElementById('settle-pay-now-input');
  const settlePaymentMethodSelect = document.getElementById('settle-payment-method-select');
  const settleRefundBanner = document.getElementById('settle-refund-banner');
  const settleRefundAmount = document.getElementById('settle-refund-amount');
  const btnCloseSettleModal = document.getElementById('btn-close-settle-modal');
  const btnCancelSettle = document.getElementById('btn-cancel-settle');
  const btnCheckoutWithoutSettle = document.getElementById('btn-checkout-without-settle');
  const btnConfirmSettleCheckout = document.getElementById('btn-confirm-settle-checkout');

  let currentSettlingReservation = null;

  function updateSettleCalculations() {
    if (!currentSettlingReservation) return;
    const paidSoFar = Math.round((parseFloat(currentSettlingReservation.paid_amount || 0) + Number.EPSILON) * 100) / 100;
    const finalTotal = Math.round((parseFloat(settleFinalTotalInput ? settleFinalTotalInput.value : 0) + Number.EPSILON) * 100) / 100;
    const netBalance = Math.round((finalTotal - paidSoFar + Number.EPSILON) * 100) / 100;

    const discountVal = parseFloat(settleDiscountInput ? settleDiscountInput.value : 0) || 0;
    if (settleBreakdownHint) {
      if (discountVal > 0) {
        settleBreakdownHint.textContent = `(الخصم المطبق: ${discountVal.toFixed(2)} ريال)`;
        settleBreakdownHint.style.color = '#b91c1c';
      } else {
        settleBreakdownHint.textContent = '(الأساس - الخصم)';
        settleBreakdownHint.style.color = '#64748b';
      }
    }

    if (netBalance > 0.005) {
      // Guest owes money
      if (settleBalanceBox) {
        settleBalanceBox.style.background = '#fef2f2';
        settleBalanceBox.style.borderColor = '#fca5a5';
      }
      if (settleBalanceLabel) {
        settleBalanceLabel.textContent = 'المتبقي للتحصيل';
        settleBalanceLabel.style.color = '#991b1b';
      }
      if (settleBalanceValue) {
        settleBalanceValue.textContent = `${netBalance.toFixed(2)} ريال`;
        settleBalanceValue.style.color = '#dc2626';
      }
      if (settleBalanceSub) {
        settleBalanceSub.textContent = '(مستحق على النزيل)';
        settleBalanceSub.style.color = '#dc2626';
      }
      if (settlePaymentSection) settlePaymentSection.style.display = 'block';
      if (settlePayNowInput) settlePayNowInput.value = netBalance.toFixed(2);
      if (settleRefundBanner) settleRefundBanner.style.display = 'none';
      if (btnConfirmSettleCheckout) btnConfirmSettleCheckout.textContent = 'تأكيد السداد وتسجيل المغادرة ✓';
    } else if (netBalance < -0.005) {
      // Guest has credit (refund)
      const absCredit = Math.abs(netBalance);
      if (settleBalanceBox) {
        settleBalanceBox.style.background = '#eff6ff';
        settleBalanceBox.style.borderColor = '#93c5fd';
      }
      if (settleBalanceLabel) {
        settleBalanceLabel.textContent = 'رصيد دائن للنزيل';
        settleBalanceLabel.style.color = '#1e40af';
      }
      if (settleBalanceValue) {
        settleBalanceValue.textContent = `${absCredit.toFixed(2)} ريال`;
        settleBalanceValue.style.color = '#2563eb';
      }
      if (settleBalanceSub) {
        settleBalanceSub.textContent = '(مبلغ مسترد للنزيل)';
        settleBalanceSub.style.color = '#2563eb';
      }
      if (settlePaymentSection) settlePaymentSection.style.display = 'none';
      if (settlePayNowInput) settlePayNowInput.value = '0.00';
      if (settleRefundBanner) settleRefundBanner.style.display = 'block';
      if (settleRefundAmount) settleRefundAmount.textContent = `${absCredit.toFixed(2)} ريال`;
      if (btnConfirmSettleCheckout) btnConfirmSettleCheckout.textContent = 'تأكيد الاسترداد وتسجيل المغادرة ✓';
    } else {
      // Perfectly balanced (0.00)
      if (settleBalanceBox) {
        settleBalanceBox.style.background = '#f0fdf4';
        settleBalanceBox.style.borderColor = '#86efac';
      }
      if (settleBalanceLabel) {
        settleBalanceLabel.textContent = 'صافي الحساب';
        settleBalanceLabel.style.color = '#166534';
      }
      if (settleBalanceValue) {
        settleBalanceValue.textContent = '0.00 ريال';
        settleBalanceValue.style.color = '#059669';
      }
      if (settleBalanceSub) {
        settleBalanceSub.textContent = '(الحساب خالص بالكامل)';
        settleBalanceSub.style.color = '#059669';
      }
      if (settlePaymentSection) settlePaymentSection.style.display = 'none';
      if (settlePayNowInput) settlePayNowInput.value = '0.00';
      if (settleRefundBanner) settleRefundBanner.style.display = 'none';
      if (btnConfirmSettleCheckout) btnConfirmSettleCheckout.textContent = 'تأكيد تسجيل المغادرة ✓';
    }
  }

  function openContractSettleModal(res) {
    if (!res) return;
    currentSettlingReservation = res;

    const todayStr = getLocalDateString();
    const checkInStr = res.check_in_date || todayStr;
    const [y1, m1, d1] = checkInStr.split('-').map(Number);
    const [y2, m2, d2] = todayStr.split('-').map(Number);
    const diffMs = Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1);
    const nights = Math.max(1, Math.round(diffMs / 86400000));

    const room = dashboardState.roomsCache.find(rm => rm.id === res.room_id);
    const pricePerNight = parseFloat(res.custom_nightly_price || res.price_per_night || (room ? room.price_per_night : 0)) || 0;
    const isContract = res.booking_type === 'عقد مفتوح';
    const calculatedBase = isContract
      ? Math.round((nights * pricePerNight + Number.EPSILON) * 100) / 100
      : Math.round((parseFloat(res.total_price || 0) + Number.EPSILON) * 100) / 100;
    const paidSoFar = Math.round((parseFloat(res.paid_amount || 0) + Number.EPSILON) * 100) / 100;
    const existingDiscount = Math.round((parseFloat(res.discount_amount || 0) + Number.EPSILON) * 100) / 100;

    if (settleReservationId) settleReservationId.value = res.id;
    if (settlePricePerNightInput) settlePricePerNightInput.value = pricePerNight;
    if (settleGuestName) settleGuestName.textContent = res.guest_name || 'نزيل';
    const contractTypeLabel = isContract ? `عقد #${res.id}` : `حجز #${res.id}`;
    if (settleRoomInfo) settleRoomInfo.textContent = `غرفة ${res.room_number || '-'} (${contractTypeLabel})`;
    if (settleCheckinDate) settleCheckinDate.textContent = checkInStr;
    if (settleCheckoutDate) settleCheckoutDate.textContent = todayStr;
    if (settleNightsCount) {
      const rateNote = res.custom_nightly_price ? ' - سعر خاص' : '';
      settleNightsCount.textContent = `${nights} ${nights === 1 ? 'ليلة' : 'ليالٍ'} (بسعر ${pricePerNight.toLocaleString()} ريال/ليلة${rateNote})`;
    }
    if (settleTotalPriceDisplay) settleTotalPriceDisplay.textContent = `${calculatedBase.toFixed(2)} ريال`;
    if (settlePaidAmountDisplay) settlePaidAmountDisplay.textContent = `${paidSoFar.toFixed(2)} ريال`;

    // Initialize discount inputs
    if (settleDiscountInput) settleDiscountInput.value = existingDiscount > 0 ? existingDiscount.toFixed(2) : '0';
    if (settleDiscountReasonInput) settleDiscountReasonInput.value = res.discount_reason || '';

    const initialNet = Math.max(0, calculatedBase - existingDiscount);
    if (settleFinalTotalInput) settleFinalTotalInput.value = initialNet.toFixed(2);

    updateSettleCalculations();

    if (openContractSettleModalEl) {
      openContractSettleModalEl.style.display = 'flex';
      setTimeout(() => {
        if (settlePayNowInput && settlePaymentSection && settlePaymentSection.style.display !== 'none') {
          settlePayNowInput.focus();
          settlePayNowInput.select();
        }
      }, 50);
    }
  }

  function closeContractSettleModal() {
    if (openContractSettleModalEl) openContractSettleModalEl.style.display = 'none';
    if (openContractSettleForm) openContractSettleForm.reset();
    if (settleDiscountInput) settleDiscountInput.value = '0';
    if (settleDiscountReasonInput) settleDiscountReasonInput.value = '';
    currentSettlingReservation = null;
  }

  if (btnCloseSettleModal) btnCloseSettleModal.addEventListener('click', closeContractSettleModal);
  if (btnCancelSettle) btnCancelSettle.addEventListener('click', closeContractSettleModal);
  if (openContractSettleModalEl) {
    openContractSettleModalEl.addEventListener('click', (e) => {
      if (e.target === openContractSettleModalEl) closeContractSettleModal();
    });
  }

  if (settleDiscountInput) {
    settleDiscountInput.addEventListener('input', () => {
      if (!currentSettlingReservation) return;
      const baseTotal = parseFloat(settleTotalPriceDisplay ? settleTotalPriceDisplay.textContent : 0) || 0;
      const disc = Math.max(0, parseFloat(settleDiscountInput.value) || 0);
      const net = Math.max(0, baseTotal - disc);
      if (settleFinalTotalInput) settleFinalTotalInput.value = net.toFixed(2);
      updateSettleCalculations();
    });
  }

  if (settleFinalTotalInput) {
    settleFinalTotalInput.addEventListener('input', () => {
      if (currentSettlingReservation && settleTotalPriceDisplay && settleDiscountInput) {
        const baseTotal = parseFloat(settleTotalPriceDisplay.textContent) || 0;
        const enteredTotal = parseFloat(settleFinalTotalInput.value) || 0;
        if (baseTotal > enteredTotal) {
          settleDiscountInput.value = (baseTotal - enteredTotal).toFixed(2);
        } else {
          settleDiscountInput.value = '0';
        }
      }
      updateSettleCalculations();
    });
  }

  if (btnCheckoutWithoutSettle) {
    btnCheckoutWithoutSettle.addEventListener('click', async () => {
      if (!currentSettlingReservation) return;
      const resId = currentSettlingReservation.id;
      const finalTotal = parseFloat(settleFinalTotalInput ? settleFinalTotalInput.value : 0) || 0;
      const discAmount = settleDiscountInput ? parseFloat(settleDiscountInput.value) || 0 : 0;
      const discReason = settleDiscountReasonInput ? settleDiscountReasonInput.value.trim() : '';

      const confirmed = await showConfirmDialog({
        title: 'تسجيل مغادرة بدون تحصيل (آجل)',
        message: `هل أنت متأكد من تسجيل مغادرة النزيل مع اعتماد إجمالي ${finalTotal.toFixed(2)} ريال وترحيل باقي المبلغ كدين آجل؟\nسيتم إكمال الحجز وتحويل الغرفة إلى "تنظيف".`,
        confirmText: 'نعم، مغادرة (آجل)',
        cancelText: 'تراجع',
        isDanger: true
      });

      if (!confirmed) return;

      try {
        const res = await api.checkoutReservation(resId, {
          finalTotalPrice: finalTotal,
          settleAmount: 0,
          discountAmount: discAmount,
          discountReason: discReason,
          notes: 'تسجيل مغادرة بدون تحصيل (آجل)'
        });

        if (res.success) {
          showToast(`تم تسجيل مغادرة الحجز #${resId} بنجاح وترحيل الحساب.`, 'success');
          closeContractSettleModal();
          await Promise.all([
            loadOverviewData(),
            loadReservationsData(),
            loadRoomsData(),
            loadTodayCheckouts()
          ]);
        } else {
          showToast(res.error || 'فشل تسجيل المغادرة.', 'error');
        }
      } catch (err) {
        showToast(`خطأ: ${err.message}`, 'error');
      }
    });
  }

  if (openContractSettleForm) {
    openContractSettleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentSettlingReservation) return;
      const resId = currentSettlingReservation.id;
      const finalTotal = parseFloat(settleFinalTotalInput ? settleFinalTotalInput.value : 0) || 0;
      const payNow = parseFloat(settlePayNowInput ? settlePayNowInput.value : 0) || 0;
      const method = settlePaymentMethodSelect ? settlePaymentMethodSelect.value : 'نقداً';
      const discAmount = settleDiscountInput ? parseFloat(settleDiscountInput.value) || 0 : 0;
      const discReason = settleDiscountReasonInput ? settleDiscountReasonInput.value.trim() : '';

      if (finalTotal < 0) {
        showToast('إجمالي الحساب لا يمكن أن يكون سالباً.', 'error');
        return;
      }
      if (payNow < 0) {
        showToast('مبلغ السداد لا يمكن أن يكون سالباً.', 'error');
        return;
      }

      try {
        if (btnConfirmSettleCheckout) {
          btnConfirmSettleCheckout.disabled = true;
          btnConfirmSettleCheckout.textContent = 'جاري التصفية...';
        }

        const res = await api.checkoutReservation(resId, {
          finalTotalPrice: finalTotal,
          settleAmount: payNow,
          paymentMethod: method,
          discountAmount: discAmount,
          discountReason: discReason,
          notes: 'سداد تصفية حساب مغادرة'
        });

        if (res.success) {
          showToast(`تمت تصفية حساب الحجز #${resId} وتسجيل المغادرة بنجاح!`, 'success');
          closeContractSettleModal();
          await Promise.all([
            loadOverviewData(),
            loadReservationsData(),
            loadRoomsData(),
            loadTodayCheckouts()
          ]);

          // Offer to open final invoice
          setTimeout(() => {
            if (typeof openInvoiceModal === 'function') {
              openInvoiceModal(resId);
            }
          }, 350);
        } else {
          showToast(res.error || 'فشل تسجيل المغادرة وتصفية الحساب.', 'error');
        }
      } catch (err) {
        showToast(`خطأ: ${err.message}`, 'error');
      } finally {
        if (btnConfirmSettleCheckout) {
          btnConfirmSettleCheckout.disabled = false;
          btnConfirmSettleCheckout.textContent = 'تأكيد السداد وتسجيل المغادرة ✓';
        }
      }
    });
  }

  // =========================================================================
  // EXTEND STAY MODAL (تمديد فترة الإقامة)
  // =========================================================================
  let currentExtendingReservation = null;
  let currentCalcExtraNights = 0;
  let currentCalcAdditionalCost = 0;
  let currentCalcNewTotal = 0;

  function updateExtendStayCalculations() {
    if (!currentExtendingReservation || !extendNewCheckoutDate) return;

    const oldDateStr = currentExtendingReservation.check_out_date;
    const newDateStr = extendNewCheckoutDate.value;

    let nightlyRate = parseFloat(extendNightlyRateInput ? extendNightlyRateInput.value : NaN);
    if (isNaN(nightlyRate) || nightlyRate < 0) {
      nightlyRate = (currentExtendingReservation.custom_nightly_price != null && !isNaN(Number(currentExtendingReservation.custom_nightly_price)))
        ? parseFloat(currentExtendingReservation.custom_nightly_price)
        : parseFloat(currentExtendingReservation.price_per_night || 0);
    }

    const discountAmount = Math.max(0, parseFloat(extendDiscountInput ? extendDiscountInput.value : 0) || 0);
    const currentTotal = Math.round((parseFloat(currentExtendingReservation.total_price || 0) + Number.EPSILON) * 100) / 100;

    if (!newDateStr || newDateStr <= oldDateStr) {
      currentCalcExtraNights = 0;
      currentCalcAdditionalCost = 0;
      currentCalcNewTotal = currentTotal;

      if (extendExtraNightsPreview) extendExtraNightsPreview.textContent = '0';
      if (extendCalcRatePreview) extendCalcRatePreview.textContent = `${nightlyRate.toLocaleString()} ر.س`;
      if (extendAdditionalCostPreview) extendAdditionalCostPreview.textContent = '0 ر.س';
      if (extendDiscountBadge) extendDiscountBadge.style.display = 'none';
      if (extendNewTotalPreview) extendNewTotalPreview.textContent = `${currentTotal.toLocaleString()} ر.س`;
      if (extendSettleAmount && extendCollectNowToggle && extendCollectNowToggle.checked) {
        extendSettleAmount.value = '0.00';
      }
      return;
    }

    const dOld = new Date(oldDateStr + 'T00:00:00');
    const dNew = new Date(newDateStr + 'T00:00:00');
    const diffTime = dNew.getTime() - dOld.getTime();
    currentCalcExtraNights = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    const baseCost = Math.round((currentCalcExtraNights * nightlyRate + Number.EPSILON) * 100) / 100;
    currentCalcAdditionalCost = Math.max(0, Math.round((baseCost - discountAmount + Number.EPSILON) * 100) / 100);
    currentCalcNewTotal = Math.round((currentTotal + currentCalcAdditionalCost + Number.EPSILON) * 100) / 100;

    const nightsLabel = currentCalcExtraNights === 1 ? 'ليلة واحدة' : (currentCalcExtraNights === 2 ? 'ليلتين' : `${currentCalcExtraNights} ليالٍ`);
    if (extendExtraNightsPreview) extendExtraNightsPreview.textContent = nightsLabel;
    if (extendCalcRatePreview) extendCalcRatePreview.textContent = `${nightlyRate.toLocaleString()} ر.س`;
    if (extendAdditionalCostPreview) extendAdditionalCostPreview.textContent = `+${currentCalcAdditionalCost.toLocaleString()} ر.س`;
    
    if (extendDiscountBadge) {
      if (discountAmount > 0) {
        extendDiscountBadge.textContent = `(خصم: -${discountAmount.toLocaleString()} ر.س)`;
        extendDiscountBadge.style.display = 'block';
      } else {
        extendDiscountBadge.style.display = 'none';
      }
    }

    if (extendNewTotalPreview) extendNewTotalPreview.textContent = `${currentCalcNewTotal.toLocaleString()} ر.س`;

    if (extendSettleAmount && extendCollectNowToggle && extendCollectNowToggle.checked) {
      // Auto-fill settle amount with additional cost
      extendSettleAmount.value = currentCalcAdditionalCost > 0 ? currentCalcAdditionalCost.toFixed(2) : '0.00';
    }
  }

  window.openExtendStayModal = async function openExtendStayModal(reservationId) {
    const modal = document.getElementById('extend-stay-modal');
    if (!modal) {
      console.error('Modal #extend-stay-modal not found in DOM');
      return;
    }

    const targetId = parseInt(reservationId, 10);
    if (!targetId || isNaN(targetId)) {
      showToast('رقم الحجز غير صالح.', 'error');
      return;
    }

    // Find reservation in cache or fetch
    let res = (dashboardState.reservationsCache || []).find(r => parseInt(r.id, 10) === targetId);
    if (!res) {
      try {
        const allRes = await api.getAllReservations();
        if (allRes && allRes.success && allRes.data) {
          dashboardState.reservationsCache = allRes.data;
          res = dashboardState.reservationsCache.find(r => parseInt(r.id, 10) === targetId);
        }
      } catch (err) {
        console.error('Error fetching reservation for extension:', err);
      }
    }

    if (!res) {
      showToast('تعذر العثور على بيانات الحجز المطلوب.', 'error');
      return;
    }

    if (res.status !== 'مؤكد') {
      showToast('لا يمكن تمديد هذا الحجز، متاح فقط للحجوزات المؤكدة والنشطة حالياً.', 'warning');
      return;
    }

    if (res.check_out_date === 'مفتوح' || !res.check_out_date) {
      showToast('حجوزات العقود المفتوحة ليس لها تاريخ مغادرة محدد ليتم تمديدها.', 'warning');
      return;
    }

    currentExtendingReservation = res;

    // Populate Info Previews
    if (extendResId) extendResId.value = res.id;
    if (extendGuestNamePreview) extendGuestNamePreview.textContent = res.guest_name || 'نزيل';
    if (extendRoomPreview) extendRoomPreview.textContent = `غرفة ${res.room_number || '-'} (${res.room_type || ''})`;
    if (extendCurrentCheckoutPreview) extendCurrentCheckoutPreview.textContent = res.check_out_date;

    const effectiveNightlyRate = (res.custom_nightly_price != null && !isNaN(Number(res.custom_nightly_price)))
      ? parseFloat(res.custom_nightly_price)
      : parseFloat(res.price_per_night || 0);

    if (extendNightlyRatePreview) {
      const customBadge = (res.custom_nightly_price != null && !isNaN(Number(res.custom_nightly_price))) ? ' (سعر خاص)' : '';
      extendNightlyRatePreview.textContent = `${effectiveNightlyRate.toLocaleString()} ريال / ليلة${customBadge}`;
    }

    if (extendNightlyRateInput) {
      extendNightlyRateInput.value = effectiveNightlyRate > 0 ? effectiveNightlyRate.toFixed(2) : '0.00';
    }
    if (extendDiscountInput) {
      extendDiscountInput.value = '0.00';
    }

    // Set min checkout date = current checkout + 1 day
    const oldDate = new Date(res.check_out_date + 'T00:00:00');
    const minDate = new Date(oldDate);
    minDate.setDate(minDate.getDate() + 1);
    const minDateStr = (typeof getLocalDateString === 'function') ? getLocalDateString(minDate) : minDate.toISOString().split('T')[0];

    if (extendNewCheckoutDate) {
      extendNewCheckoutDate.min = minDateStr;
      extendNewCheckoutDate.value = minDateStr; // Default to +1 night
    }

    // Reset toggle & payment fields
    if (extendCollectNowToggle) {
      extendCollectNowToggle.checked = true;
    }
    if (extendPaymentFields) {
      extendPaymentFields.style.display = 'grid';
    }
    if (extendPaymentMethod) {
      extendPaymentMethod.value = 'نقداً';
    }

    updateExtendStayCalculations();

    modal.style.display = 'flex';
  };

  function closeExtendStayModal() {
    if (extendStayModal) {
      extendStayModal.style.display = 'none';
    }
    if (extendStayForm) {
      extendStayForm.reset();
    }
    currentExtendingReservation = null;
    currentCalcExtraNights = 0;
    currentCalcAdditionalCost = 0;
    currentCalcNewTotal = 0;
  }

  if (btnCloseExtendStay) btnCloseExtendStay.addEventListener('click', closeExtendStayModal);
  if (btnCancelExtendStay) btnCancelExtendStay.addEventListener('click', closeExtendStayModal);
  if (extendStayModal) {
    extendStayModal.addEventListener('click', (e) => {
      if (e.target === extendStayModal) closeExtendStayModal();
    });
  }

  // Quick Extend Buttons (+1, +2, +3, +7, +30 / شهر)
  const quickExtendButtons = document.querySelectorAll('.btn-quick-extend');
  quickExtendButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!currentExtendingReservation || !currentExtendingReservation.check_out_date) return;
      const days = parseInt(btn.dataset.days, 10);
      if (!days || isNaN(days)) return;

      const d = new Date(currentExtendingReservation.check_out_date + 'T00:00:00');
      d.setDate(d.getDate() + days);
      const newDateStr = (typeof getLocalDateString === 'function') ? getLocalDateString(d) : d.toISOString().split('T')[0];

      if (extendNewCheckoutDate) {
        extendNewCheckoutDate.value = newDateStr;
        updateExtendStayCalculations();
      }
    });
  });

  if (extendNewCheckoutDate) {
    extendNewCheckoutDate.addEventListener('input', updateExtendStayCalculations);
    extendNewCheckoutDate.addEventListener('change', updateExtendStayCalculations);
  }

  if (extendNightlyRateInput) {
    extendNightlyRateInput.addEventListener('input', updateExtendStayCalculations);
    extendNightlyRateInput.addEventListener('change', updateExtendStayCalculations);
  }

  if (extendDiscountInput) {
    extendDiscountInput.addEventListener('input', updateExtendStayCalculations);
    extendDiscountInput.addEventListener('change', updateExtendStayCalculations);
  }

  if (extendCollectNowToggle) {
    extendCollectNowToggle.addEventListener('change', () => {
      if (extendPaymentFields) {
        extendPaymentFields.style.display = extendCollectNowToggle.checked ? 'grid' : 'none';
      }
      if (!extendCollectNowToggle.checked) {
        if (extendSettleAmount) extendSettleAmount.value = '0.00';
      } else {
        if (extendSettleAmount) extendSettleAmount.value = currentCalcAdditionalCost > 0 ? currentCalcAdditionalCost.toFixed(2) : '0.00';
      }
    });
  }

  if (extendStayForm) {
    extendStayForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentExtendingReservation) return;

      const newDate = extendNewCheckoutDate ? extendNewCheckoutDate.value.trim() : '';
      if (!newDate) {
        showToast('يرجى تحديد تاريخ المغادرة الجديد.', 'error');
        return;
      }
      if (newDate <= currentExtendingReservation.check_out_date) {
        showToast(`تاريخ المغادرة الجديد (${newDate}) يجب أن يكون بعد تاريخ المغادرة الحالي (${currentExtendingReservation.check_out_date}).`, 'error');
        return;
      }

      const settle = (extendCollectNowToggle && extendCollectNowToggle.checked)
        ? Math.max(0, parseFloat(extendSettleAmount ? extendSettleAmount.value : 0) || 0)
        : 0;

      const payMethod = extendPaymentMethod ? extendPaymentMethod.value : 'نقداً';

      const btnSubmit = document.getElementById('btn-confirm-extend-stay');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'جاري تمديد الإقامة...';
      }

      try {
        const activeUserId = localStorage.getItem(STORAGE_KEYS.currentUserId) || (dashboardState.currentUser ? dashboardState.currentUser.id : null);
        const nightlyRate = parseFloat(extendNightlyRateInput ? extendNightlyRateInput.value : NaN);
        const discount = Math.max(0, parseFloat(extendDiscountInput ? extendDiscountInput.value : 0) || 0);

        const res = await api.extendReservation({
          reservationId: currentExtendingReservation.id,
          newCheckOutDate: newDate,
          customNightlyPrice: !isNaN(nightlyRate) && nightlyRate >= 0 ? nightlyRate : undefined,
          discountAmount: discount,
          additionalCost: currentCalcAdditionalCost,
          settleAmount: settle,
          paymentMethod: payMethod,
          userId: activeUserId ? parseInt(activeUserId, 10) : null,
          notes: `تمديد فترة الإقامة (${currentCalcExtraNights} ليالٍ إضافية حتى ${newDate})${discount > 0 ? ` [خصم تمديد: ${discount} ر.س]` : ''}`
        });

        if (res && res.success) {
          const receiptInfo = res.receiptNumber ? ` (سند قبض رقم: ${res.receiptNumber})` : '';
          const settleInfo = settle > 0 ? ` وتم تحصيل ${settle.toLocaleString()} ريال` : ' (مسجلة ذمة مستحقة)';
          const discountInfo = discount > 0 ? ` [خصم: ${discount.toLocaleString()} ريال]` : '';
          showToast(`تم تمديد إقامة النزيل (${res.reservation?.guest_name || currentExtendingReservation.guest_name}) بنجاح حتى ${newDate}${discountInfo}${settleInfo}${receiptInfo} ✓`, 'success');
          closeExtendStayModal();

          await Promise.all([
            loadReservationsData(),
            loadRoomsData(),
            loadOverviewData(),
            typeof loadTodayCheckouts === 'function' ? loadTodayCheckouts() : Promise.resolve()
          ]);
        } else {
          showToast(res?.error || 'فشل تمديد الحجز.', 'error');
        }
      } catch (err) {
        console.error('Extend stay submit error:', err);
        showToast(`خطأ: ${err.message}`, 'error');
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'تأكيد تمديد الحجز ✓';
        }
      }
    });
  }

  // Toggle & Submit Add Customer Form (Available to both Admin and User roles)
  if (btnToggleAddCustomer && addCustomerPanel) {
    btnToggleAddCustomer.addEventListener('click', () => {
      const isHidden = addCustomerPanel.style.display === 'none' || !addCustomerPanel.style.display;
      addCustomerPanel.style.display = isHidden ? 'block' : 'none';
      if (isHidden && newCustomerName) newCustomerName.focus();
    });
  }

  if (btnCancelAddCustomer && addCustomerPanel) {
    btnCancelAddCustomer.addEventListener('click', () => {
      addCustomerPanel.style.display = 'none';
      if (addCustomerForm) addCustomerForm.reset();
    });
  }

  if (addCustomerForm) {
    addCustomerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = newCustomerName ? newCustomerName.value.trim() : '';
      const phone = newCustomerPhone ? newCustomerPhone.value.trim() : '';
      const id_number = newCustomerId ? newCustomerId.value.trim() : '';

      // Strict Guest Data Validation
      const validation = validateGuestInputs({ name, phone, id_number });
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return;
      }

      const activeRole = localStorage.getItem(STORAGE_KEYS.currentUserRole) || (dashboardState.currentUser ? dashboardState.currentUser.role : 'User');

      try {
        const res = await api.addCustomer({ name, phone, id_number }, activeRole);
        if (res.success) {
          showToast(`تم تسجيل بيانات النزيل "${name}" بنجاح!`, 'success');
          addCustomerForm.reset();
          addCustomerPanel.style.display = 'none';
          await loadGuestsData();
        } else {
          showToast(res.error || 'فشل حفظ بيانات النزيل.', 'error');
        }
      } catch (err) {
        console.error('Add customer error:', err);
        showToast(`خطأ أثناء الحفظ: ${err.message}`, 'error');
      }
    });
  }

  // =========================================================================
  // VIEW 5: ADMIN PANEL & USER MANAGEMENT (RBAC)
  // =========================================================================
  async function loadAdminData() {
    const activeRole = localStorage.getItem(STORAGE_KEYS.currentUserRole) || (dashboardState.currentUser ? dashboardState.currentUser.role : null);
    if (activeRole !== 'Admin') return;

    try {
      const res = await api.getAllUsers();
      if (res.success) {
        dashboardState.usersCache = res.data || [];
        renderUsersTable();
      } else {
        showToast(res.error || 'تعذر تحميل المستخدمين.', 'error');
      }
    } catch (err) {
      console.error('Load users error:', err);
    }
  }

  function renderUsersTable() {
    usersTableBody.innerHTML = dashboardState.usersCache.map(u => {
      const isAdmin = u.role === 'Admin';
      const isDefaultAdmin = u.username.toLowerCase() === 'admin';

      return `
        <tr>
          <td style="font-family: monospace; font-weight: 700; color: var(--primary);">#${u.id}</td>
          <td style="font-weight: 700; font-size: 0.9rem;">
            ${escapeHtml(u.username)}
            ${dashboardState.currentUser && u.id === dashboardState.currentUser.id ? ' <span style="font-size: 0.7rem; color: var(--success); font-weight: 600;">(أنت)</span>' : ''}
          </td>
          <td>
            <span class="${isAdmin ? 'badge-role-admin' : 'badge-role-staff'}">
              ${isAdmin ? 'مدير نظام (Admin)' : 'مستخدم (User)'}
            </span>
          </td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(String(u.created_at || '').split(' ')[0])}</td>
          <td style="text-align: center;">
            ${!isDefaultAdmin && (!dashboardState.currentUser || u.id !== dashboardState.currentUser.id) ? `
              <button class="btn btn-danger btn-sm" data-action="delete-user" data-id="${u.id}" data-username="${escapeHtml(u.username)}" title="حذف المستخدم">
                حذف
              </button>
            ` : `<span style="font-size: 0.75rem; color: var(--text-light);">-</span>`}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Add User Form (Admin Only)
  addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = newUsernameInput.value.trim();
    const password = newUserPasswordInput.value;
    const role = newUserRoleSelect.value;

    if (!username || !password) {
      showToast('يرجى ملء اسم المستخدم وكلمة المرور.', 'error');
      return;
    }

    const activeRole = localStorage.getItem(STORAGE_KEYS.currentUserRole) || (dashboardState.currentUser ? dashboardState.currentUser.role : 'User');

    try {
      const res = await api.addUser({ username, password, role }, activeRole);
      if (res.success) {
        showToast(`تم إنشاء حساب "${username}" بصلاحية ${role} بنجاح!`, 'success');
        addUserForm.reset();
        await loadAdminData();
      } else {
        showToast(res.error || 'فشل إنشاء المستخدم.', 'error');
      }
    } catch (err) {
      showToast(`خطأ: ${err.message}`, 'error');
    }
  });

  // Update Admin Password Form
  updatePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = currentAdminNewPasswordInput.value;
    if (!newPassword || newPassword.length < 3) {
      showToast('كلمة المرور يجب أن لا تقل عن 3 أحرف.', 'error');
      return;
    }

    try {
      const res = await api.updateUserPassword({
        userId: dashboardState.currentUser ? dashboardState.currentUser.id : null,
        newPassword
      });

      if (res.success) {
        showToast('تم تحديث كلمة المرور الخاصة بك بنجاح!', 'success');
        updatePasswordForm.reset();
      } else {
        showToast(res.error || 'فشل تحديث كلمة المرور.', 'error');
      }
    } catch (err) {
      showToast(`خطأ: ${err.message}`, 'error');
    }
  });

  btnRefreshUsers.addEventListener('click', loadAdminData);

  // Delete User delegation (Admin Only)
  usersTableBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action="delete-user"]');
    if (!btn) return;

    const userId = btn.dataset.id;
    const username = btn.dataset.username;
    const activeRole = localStorage.getItem(STORAGE_KEYS.currentUserRole) || (dashboardState.currentUser ? dashboardState.currentUser.role : 'User');

    const confirmed = await showConfirmDialog({
      title: 'حذف مستخدم من النظام',
      message: `هل أنت متأكد من رغبتك في حذف المستخدم "${username}"؟\nلن يتمكن هذا المستخدم من تسجيل الدخول للنظام بعد الحذف.`,
      confirmText: 'نعم، حذف المستخدم',
      cancelText: 'إلغاء',
      isDanger: true
    });

    if (confirmed) {
      try {
        const res = await api.deleteUser(userId, activeRole);
        if (res.success) {
          showToast(`تم حذف المستخدم "${username}" بنجاح.`, 'info');
          await loadAdminData();
        } else {
          showToast(res.error || 'فشل حذف المستخدم.', 'error');
        }
      } catch (err) {
        showToast(`خطأ: ${err.message}`, 'error');
      }
    }
  });

  // =========================================================================
  // FACTORY RESET APP DATA (Requires Admin Role & Password Challenge)
  // =========================================================================
  const btnOpenFactoryReset = document.getElementById('btn-open-factory-reset');
  const factoryResetModal = document.getElementById('factory-reset-modal');
  const btnCloseFactoryReset = document.getElementById('btn-close-factory-reset');
  const btnCancelFactoryReset = document.getElementById('btn-cancel-factory-reset');
  const factoryResetForm = document.getElementById('factory-reset-form');
  const factoryResetPasswordInput = document.getElementById('factory-reset-password');
  const factoryResetErrorMsg = document.getElementById('factory-reset-error-msg');
  const btnSubmitFactoryReset = document.getElementById('btn-submit-factory-reset');

  const { openFactoryResetModal, closeFactoryResetModal } = createFactoryResetModal({
    openButton: btnOpenFactoryReset,
    modal: factoryResetModal,
    closeButton: btnCloseFactoryReset,
    cancelButton: btnCancelFactoryReset,
    form: factoryResetForm,
    passwordInput: factoryResetPasswordInput,
    errorMessage: factoryResetErrorMsg,
    submitButton: btnSubmitFactoryReset,
    getActiveRole: () => localStorage.getItem(STORAGE_KEYS.currentUserRole) || (dashboardState.currentUser ? dashboardState.currentUser.role : null),
    api,
    showToast,
    highlightField,
    reload: () => window.location.reload()
  });

  // =========================================================================
  // OFFICIAL HOTEL TAX INVOICE & RECEIPT (FEATURE 1)
  // =========================================================================
  async function openInvoiceModal(reservationId) {
    const targetId = parseInt(reservationId, 10);
    if (!targetId || isNaN(targetId)) {
      showToast('يرجى تحديد حجز صالح لعرض الفاتورة.', 'error');
      return;
    }

    currentInvoiceReservationId = targetId;

    try {
      const res = await api.getInvoiceData(targetId);
      if (!res || !res.success || !res.data) {
        showToast(res?.error || 'تعذر تحميل بيانات الفاتورة.', 'error');
        return;
      }

      const inv = res.data;
      currentInvoiceData = inv;
      const isContract = inv.booking_type === 'عقد مفتوح';
      const total = parseFloat(inv.total_price || 0);
      const paid = parseFloat(inv.paid_amount || 0);
      const deposit = parseFloat(inv.deposit_amount || 0);
      const rawRemaining = total - paid;
      const isCredit = rawRemaining < -0.005;
      const remaining = isContract ? rawRemaining : Math.max(0, rawRemaining);

      const d1 = inv.check_in_date ? new Date(inv.check_in_date) : null;
      const d2 = inv.check_out_date ? new Date(inv.check_out_date) : null;
      const nights = (d1 && d2 && d2 > d1) ? Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24))) : (isContract ? '-' : 1);
      const stayDurationText = isContract ? 'عقد مفتوح (غير محدد)' : `${nights} ${nights === 1 ? 'ليلة' : 'ليالٍ'}`;
      const checkOutDisplay = inv.check_out_date ? `${escapeHtml(inv.check_out_date)} (${stayDurationText})` : 'مفتوح (غير محدد)';

      const effectiveNightlyRate = parseFloat(inv.custom_nightly_price || inv.price_per_night || 0);
      const discount = parseFloat(inv.discount_amount || 0);
      const discountReasonText = inv.discount_reason ? ` (${escapeHtml(inv.discount_reason)})` : '';
      const baseSubtotal = (typeof nights === 'number' && nights > 0) ? (nights * effectiveNightlyRate) : (total + discount);

      const invoiceNum = `SND-2026-${String(inv.id).padStart(5, '0')}`;
      const printDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      invoicePrintableArea.innerHTML = `
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
                رقم السند: <span style="font-family: monospace; color: #4338ca;">${invoiceNum}</span>
              </div>
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px; direction: rtl; text-align: left;">
                تاريخ الإصدار: <span>${printDate}</span>
              </div>
              <div style="margin-top: 6px; direction: rtl; text-align: left;">
                ${getPaymentStatusBadge(inv.payment_status)}
              </div>
            </div>
          </div>

          <!-- Guest & Reservation Info Box -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
            <div>
              <h4 style="font-size: 0.9rem; font-weight: 800; color: #334155; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">بيانات النزيل (Guest Details)</h4>
              <div style="font-size: 0.85rem; line-height: 1.7; color: #1e293b;">
                <div><strong>اسم النزيل:</strong> ${escapeHtml(inv.guest_name)}</div>
                <div><strong>رقم الجوال:</strong> ${escapeHtml(inv.guest_phone || '-')}</div>
                <div><strong>رقم الهوية / الإقامة:</strong> ${escapeHtml(inv.guest_id_number || 'غير مسجل')}</div>
              </div>
            </div>

            <div>
              <h4 style="font-size: 0.9rem; font-weight: 800; color: #334155; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">بيانات الإقامة والوحدة (Stay Details)</h4>
              <div style="font-size: 0.85rem; line-height: 1.7; color: #1e293b;">
                <div><strong>رقم الوحدة:</strong> ${escapeHtml(inv.room_number)} (${escapeHtml(inv.room_type || '')})</div>
                <div><strong>تاريخ الوصول:</strong> ${escapeHtml(inv.check_in_date)}</div>
                <div><strong>وقت الحجز:</strong> <span style="font-family: monospace;">${escapeHtml(inv.booking_time || '-')}</span></div>
                <div><strong>تاريخ المغادرة:</strong> ${checkOutDisplay}</div>
                ${inv.checkout_time ? `<div><strong>وقت المغادرة:</strong> <span style="font-family: monospace;">${escapeHtml(inv.checkout_time)}</span></div>` : ''}
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
                  <strong>إقامة سكنية - وحدة ${escapeHtml(inv.room_number)} ${isContract ? '(عقد مفتوح)' : ''}</strong>
                  <div style="font-size: 0.78rem; color: #64748b;">نوع الوحدة: ${escapeHtml(inv.room_type || 'عادية')} ${inv.custom_nightly_price ? '<span style="color:#166534; font-weight:700;">(سعر خاص معتمد)</span>' : ''}</div>
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
              ${inv.original_calculated_charge != null ? `
                <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                  <td style="padding: 10px 14px;">
                    <strong style="color: #4338ca;">تعديل إداري معتمد لمبلغ الإلغاء</strong>
                    <div style="font-size: 0.75rem; color: #64748b;">الحساب التلقائي الأصلي قبل التعديل: ${parseFloat(inv.original_calculated_charge).toLocaleString()} ريال</div>
                  </td>
                  <td style="padding: 10px 14px; text-align: center;">-</td>
                  <td style="padding: 10px 14px; text-align: center;">-</td>
                  <td style="padding: 10px 14px; text-align: left; font-weight: 800; color: #4338ca;">${parseFloat(inv.total_price || 0).toLocaleString()} ريال</td>
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
              <div style="font-weight: 700; color: #334155; margin-bottom: 4px;">طريقة السداد: ${escapeHtml(inv.payment_method || 'نقداً')}</div>
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

      if (invoiceModal) {
        invoiceModal.style.display = 'flex';
      }
    } catch (err) {
      console.error('Invoice error:', err);
      showToast(`خطأ في عرض الفاتورة: ${err.message}`, 'error');
    }
  }

  // =========================================================================
  // ROOM REVENUE REPORT MODAL
  // =========================================================================
  const { openRoomRevenueModal } = createRoomRevenueModal({
    api,
    modal: roomRevenueModal,
    content: roomRevenueContent,
    title: roomRevenueModalTitle,
    showToast
  });

  // =========================================================================
  // SHIFT AUDIT & NIGHT CLOSING (FEATURE 5 - DATE RANGES & PRESETS)
  // =========================================================================
  let currentShiftAuditPreset = 'today';
  let currentShiftAuditStartDate = null;
  let currentShiftAuditEndDate = null;

  const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  function formatArabicDateRange(startStr, endStr) {
    if (!startStr) return '';
    if (!endStr || startStr === endStr) {
      const parts = startStr.split('-').map(Number);
      if (parts.length !== 3 || isNaN(parts[0])) return startStr;
      const [y, m, d] = parts;
      return `${d} ${ARABIC_MONTHS[m - 1] || ''} ${y}`;
    }
    const [y1, m1, d1] = startStr.split('-').map(Number);
    const [y2, m2, d2] = endStr.split('-').map(Number);
    if (y1 === y2) {
      if (m1 === m2) {
        return `${d1} - ${d2} ${ARABIC_MONTHS[m1 - 1] || ''} ${y1}`;
      }
      return `${d1} ${ARABIC_MONTHS[m1 - 1] || ''} - ${d2} ${ARABIC_MONTHS[m2 - 1] || ''} ${y1}`;
    }
    return `${d1} ${ARABIC_MONTHS[m1 - 1] || ''} ${y1} - ${d2} ${ARABIC_MONTHS[m2 - 1] || ''} ${y2}`;
  }

  function getShiftAuditPresetDates(preset) {
    const todayObj = new Date();
    const todayStr = getLocalDateString(todayObj);

    switch (preset) {
      case 'today':
        return { startDate: todayStr, endDate: todayStr };

      case 'week': {
        // Current week starting Saturday (Saudi Arabia standard)
        const day = todayObj.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat
        const diffToSat = (day + 1) % 7;
        const startOfWeek = new Date(todayObj);
        startOfWeek.setDate(todayObj.getDate() - diffToSat);
        return { startDate: getLocalDateString(startOfWeek), endDate: todayStr };
      }

      case 'month': {
        // First day of current month to today
        const startOfMonth = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1);
        return { startDate: getLocalDateString(startOfMonth), endDate: todayStr };
      }

      case 'quarter': {
        // First day of current 3-month quarter to today
        const currentMonth = todayObj.getMonth();
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
        const startOfQuarter = new Date(todayObj.getFullYear(), quarterStartMonth, 1);
        return { startDate: getLocalDateString(startOfQuarter), endDate: todayStr };
      }

      default:
        return { startDate: todayStr, endDate: todayStr };
    }
  }

  function ensureShiftAuditFilterBar() {
    let filterBar = document.getElementById('shift-audit-filter-bar');
    if (!filterBar && shiftAuditContent && shiftAuditContent.parentNode) {
      filterBar = document.createElement('div');
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

      shiftAuditContent.parentNode.insertBefore(filterBar, shiftAuditContent);

      const presetButtons = filterBar.querySelectorAll('.btn-audit-preset');
      const customDatesBox = filterBar.querySelector('#shift-audit-custom-dates');
      const customStartInput = filterBar.querySelector('#shift-audit-custom-start');
      const customEndInput = filterBar.querySelector('#shift-audit-custom-end');
      const btnApplyCustom = filterBar.querySelector('#btn-apply-audit-custom');

      presetButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
          const preset = btn.dataset.preset;
          currentShiftAuditPreset = preset;

          presetButtons.forEach(b => {
            const isActive = b === btn;
            b.style.background = isActive ? '#1a4332' : 'transparent';
            b.style.color = isActive ? '#a7f3d0' : '#cbd5e1';
            b.style.fontWeight = isActive ? '800' : '600';
          });

          if (preset === 'custom') {
            if (customDatesBox) customDatesBox.style.display = 'flex';
            if (customStartInput && !customStartInput.value) {
              customStartInput.value = currentShiftAuditStartDate || getLocalDateString();
            }
            if (customEndInput && !customEndInput.value) {
              customEndInput.value = currentShiftAuditEndDate || getLocalDateString();
            }
          } else {
            if (customDatesBox) customDatesBox.style.display = 'none';
            const dates = getShiftAuditPresetDates(preset);
            currentShiftAuditStartDate = dates.startDate;
            currentShiftAuditEndDate = dates.endDate;
            await renderShiftAuditData(dates.startDate, dates.endDate);
          }
        });
      });

      if (btnApplyCustom) {
        btnApplyCustom.addEventListener('click', async () => {
          const s = customStartInput ? customStartInput.value : '';
          const e = customEndInput ? customEndInput.value : '';
          if (!s || !e) {
            showToast('يرجى تحديد تاريخ البداية والنهاية للفترة المخصصة.', 'warning');
            return;
          }
          currentShiftAuditStartDate = s;
          currentShiftAuditEndDate = e;
          await renderShiftAuditData(s, e);
        });
      }
    }
  }

  async function renderShiftAuditData(startDate, endDate) {
    try {
      const start = startDate || getLocalDateString();
      const end = endDate || start;
      const res = await api.getShiftAuditReport({ startDate: start, endDate: end });
      if (!res || !res.success || !res.data) {
        showToast(res?.error || 'تعذر استخراج تقرير إقفال الوردية.', 'error');
        return;
      }

      const rep = res.data;
      const fin = rep.financials || {};
      const mov = rep.movements || {};
      const rm = rep.rooms || {};
      const txs = rep.transactions || [];
      const printTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const isMultiDay = Boolean(rep.isRange || (rep.startDate && rep.endDate && rep.startDate !== rep.endDate));
      const periodLabel = formatArabicDateRange(rep.startDate, rep.endDate);

      shiftAuditContent.innerHTML = `
        <div style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 26px; background: white;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 18px; margin-bottom: 20px;">
            <div>
              <h2 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0;">
                ${isMultiDay ? 'تقرير إقفال الفترة والموازنة المالية التراكمية' : 'تقرير الإقفال اليومي للوردية والموازنة المالية'}
              </h2>
              <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
                ${isMultiDay ? 'Period Shift Audit & Financial Closing Reconciliation' : 'Daily Shift Audit & Financial Closing Reconciliation'}
              </p>
            </div>
            <div style="text-align: left; font-size: 0.82rem; color: #334155;">
              ${isMultiDay ? `
                <div>فترة التقرير: <strong>${escapeHtml(periodLabel)}</strong></div>
                <div style="font-size: 0.76rem; color: #64748b; font-family: monospace;">(${rep.startDate} إلى ${rep.endDate})</div>
              ` : `
                <div>التاريخ المستهدف: <strong>${rep.date}</strong></div>
              `}
              <div>وقت الاستخراج: <span>${printTime}</span></div>
              <div>المشرف المنفذ: <strong>${escapeHtml(dashboardState.currentUser?.username || 'الإدارة')}</strong></div>
            </div>
          </div>

          <!-- Financial KPIs Grid -->
          <h4 style="font-size: 0.95rem; font-weight: 800; color: #1e1b4b; margin-bottom: 12px;">1. ملخص الإيرادات والمقبوضات المالية حسب وسيلة الدفع</h4>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
            <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 0.78rem; color: #4338ca; font-weight: 700;">إجمالي المقبوضات</div>
              <div style="font-size: 1.25rem; font-weight: 900; color: #1e1b4b; margin-top: 4px;">${parseFloat(fin.totalRevenue || 0).toLocaleString()} <span style="font-size: 0.75rem;">ريال</span></div>
            </div>
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 0.78rem; color: #047857; font-weight: 700;">مقبوضات نقداً (كاش)</div>
              <div style="font-size: 1.25rem; font-weight: 900; color: #065f46; margin-top: 4px;">${parseFloat(fin.cashTotal || 0).toLocaleString()} <span style="font-size: 0.75rem;">ريال</span></div>
            </div>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 0.78rem; color: #1d4ed8; font-weight: 700;">مقبوضات مدى / شبكة</div>
              <div style="font-size: 1.25rem; font-weight: 900; color: #1e40af; margin-top: 4px;">${parseFloat(fin.cardTotal || 0).toLocaleString()} <span style="font-size: 0.75rem;">ريال</span></div>
            </div>
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 0.78rem; color: #b45309; font-weight: 700;">مبالغ لم تحصّل بعد</div>
              <div style="font-size: 1.25rem; font-weight: 900; color: #92400e; margin-top: 4px;">${parseFloat(fin.outstandingTotal || 0).toLocaleString()} <span style="font-size: 0.75rem;">ريال</span></div>
            </div>
          </div>

          <!-- Occupancy & Movements -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
              <h4 style="font-size: 0.88rem; font-weight: 800; color: #334155; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
                <span>2. ${isMultiDay ? 'الحالة الحالية للغرف (لحظية الآن)' : 'حالة ونسبة إشغال الفندق (Occupancy Rate)'}</span>
                ${isMultiDay ? '<span style="font-size: 0.72rem; color: #4338ca; background: #e0e7ff; padding: 2px 7px; border-radius: 5px; font-weight: 700;">حالة حية وليست تراكمية</span>' : ''}
              </h4>
              <div style="font-size: 0.84rem; line-height: 1.8; color: #1e293b;">
                <div style="display: flex; justify-content: space-between;"><span>إجمالي غرف الفندق:</span> <strong>${rm.totalRooms || 0} غرف</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>الغرف المشغولة حالياً:</span> <strong style="color: #dc2626;">${rm.occupiedCount || 0}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>الغرف المتاحة حالياً:</span> <strong style="color: #059669;">${rm.availableCount || 0}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>الغرف قيد التنظيف:</span> <strong style="color: #d97706;">${rm.cleaningCount || 0}</strong></div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 4px; font-weight: 800; color: #4338ca;">
                  <span>نسبة الإشغال اللحظية:</span>
                  <span>${rm.occupancyRate || 0}%</span>
                </div>
              </div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
              <h4 style="font-size: 0.88rem; font-weight: 800; color: #334155; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
                ${isMultiDay ? '3. حركة النزلاء خلال الفترة (Movements in Period)' : '3. حركة النزلاء خلال اليوم (Daily Movements)'}
              </h4>
              <div style="font-size: 0.84rem; line-height: 1.8; color: #1e293b;">
                <div style="display: flex; justify-content: space-between;">
                  <span>${isMultiDay ? 'إجمالي تسجيلات الدخول في الفترة (Check-ins):' : 'عمليات تسجيل الدخول اليوم (Check-ins):'}</span>
                  <strong style="color: #059669;">${mov.checkinsToday || 0}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>${isMultiDay ? 'إجمالي تسجيلات المغادرة في الفترة (Check-outs):' : 'عمليات تسجيل الخروج اليوم (Check-outs):'}</span>
                  <strong style="color: #d97706;">${mov.checkoutsToday || 0}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>${isMultiDay ? 'إجمالي الحجوزات النشطة في الفترة:' : 'إجمالي الحجوزات المنفذة اليوم:'}</span>
                  <strong>${mov.totalReservationsToday || 0}</strong>
                </div>
              </div>
            </div>
          </div>

          ${(isMultiDay && rep.dailyBreakdown && rep.dailyBreakdown.length > 1) ? `
            <!-- Daily Breakdown Trend (Range Mode) -->
            <h4 style="font-size: 0.95rem; font-weight: 800; color: #1e1b4b; margin-bottom: 10px;">4. الحركة اليومية وتوزيع الإيرادات عبر أيام الفترة</h4>
            <div style="max-height: 240px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
                <thead style="position: sticky; top: 0; background: #f8fafc; z-index: 1;">
                  <tr style="border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 8px 12px; text-align: right;">التاريخ</th>
                    <th style="padding: 8px 12px; text-align: center;">تسجيلات دخول</th>
                    <th style="padding: 8px 12px; text-align: center;">تسجيلات خروج</th>
                    <th style="padding: 8px 12px; text-align: left;">المتحصلات اليومية</th>
                  </tr>
                </thead>
                <tbody>
                  ${rep.dailyBreakdown.map(day => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 7px 12px; font-family: monospace; font-weight: 700; color: #334155;">${day.date}</td>
                      <td style="padding: 7px 12px; text-align: center; color: #059669; font-weight: 700;">${day.check_ins_count}</td>
                      <td style="padding: 7px 12px; text-align: center; color: #d97706; font-weight: 700;">${day.check_outs_count}</td>
                      <td style="padding: 7px 12px; text-align: left; font-weight: 800; color: #1e1b4b;">${Number(day.revenue).toLocaleString()} ريال</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Transactions Breakdown -->
          <h4 style="font-size: 0.95rem; font-weight: 800; color: #1e1b4b; margin-bottom: 10px;">
            ${isMultiDay ? '5. سجل العمليات والتحصيلات في الفترة' : '4. سجل العمليات المالية والتحصيلات في هذا اليوم'}
          </h4>
          ${txs.length === 0 ? `
            <div style="padding: 16px; text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; color: #64748b; font-size: 0.85rem; margin-bottom: 24px;">
              لا توجد عمليات مسجلة في هذه الفترة.
            </div>
          ` : `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 0.82rem;">
              <thead>
                <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 8px 10px; text-align: right;">الحجز</th>
                  <th style="padding: 8px 10px; text-align: right;">النزيل</th>
                  <th style="padding: 8px 10px; text-align: right;">الغرفة</th>
                  <th style="padding: 8px 10px; text-align: center;">طريقة الدفع</th>
                  <th style="padding: 8px 10px; text-align: center;">المدفوع</th>
                  <th style="padding: 8px 10px; text-align: center;">التأمين</th>
                  <th style="padding: 8px 10px; text-align: center;">حالة السداد</th>
                </tr>
              </thead>
              <tbody>
                ${txs.map(t => `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px 10px; font-family: monospace; font-weight: 700;">#${t.id}</td>
                    <td style="padding: 8px 10px; font-weight: 700;">${escapeHtml(t.guest_name)}</td>
                    <td style="padding: 8px 10px;">غرفة ${escapeHtml(t.room_number)}</td>
                    <td style="padding: 8px 10px; text-align: center;">${escapeHtml(t.payment_method || 'نقداً')}</td>
                    <td style="padding: 8px 10px; text-align: center; font-weight: 700; color: #059669;">${parseFloat(t.paid_amount || 0).toLocaleString()} ريال</td>
                    <td style="padding: 8px 10px; text-align: center; color: #701a75;">${parseFloat(t.deposit_amount || 0).toLocaleString()} ريال</td>
                    <td style="padding: 8px 10px; text-align: center;">${getPaymentStatusBadge(t.payment_status)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}

          <!-- Sign-off & Audit Closure Signatures -->
          <div style="display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px solid #cbd5e1; text-align: center; font-size: 0.85rem; color: #475569;">
            <div style="width: 220px;">
              <div>إعداد موظف الاستقبال / أمين الصندوق</div>
              <div style="margin-top: 36px; border-bottom: 1px solid #94a3b8;"></div>
            </div>
            <div style="width: 220px;">
              <div>المطابقة والمراجعة المحاسبية</div>
              <div style="margin-top: 36px; border-bottom: 1px solid #94a3b8;"></div>
            </div>
            <div style="width: 220px;">
              <div>اعتماد المدير العام</div>
              <div style="margin-top: 36px; border-bottom: 1px solid #94a3b8;"></div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Shift audit error:', err);
      showToast(`خطأ في تقرير الإقفال: ${err.message}`, 'error');
    }
  }

  async function openShiftAuditModal(targetDateOrOptions) {
    try {
      ensureShiftAuditFilterBar();

      let startDate = null;
      let endDate = null;

      if (targetDateOrOptions && typeof targetDateOrOptions === 'object') {
        startDate = targetDateOrOptions.startDate || targetDateOrOptions.date;
        endDate = targetDateOrOptions.endDate || startDate;
        currentShiftAuditPreset = targetDateOrOptions.preset || (startDate === endDate ? 'today' : 'custom');
      } else if (typeof targetDateOrOptions === 'string' && targetDateOrOptions.trim() !== '') {
        startDate = targetDateOrOptions.trim();
        endDate = startDate;
        currentShiftAuditPreset = (startDate === getLocalDateString()) ? 'today' : 'custom';
      } else {
        currentShiftAuditPreset = 'today';
        const dates = getShiftAuditPresetDates('today');
        startDate = dates.startDate;
        endDate = dates.endDate;
      }

      currentShiftAuditStartDate = startDate;
      currentShiftAuditEndDate = endDate;

      const filterBar = document.getElementById('shift-audit-filter-bar');
      if (filterBar) {
        const presetButtons = filterBar.querySelectorAll('.btn-audit-preset');
        presetButtons.forEach(b => {
          const isActive = b.dataset.preset === currentShiftAuditPreset;
          b.style.background = isActive ? '#1a4332' : 'transparent';
          b.style.color = isActive ? '#a7f3d0' : '#cbd5e1';
          b.style.fontWeight = isActive ? '800' : '600';
        });
        const customDatesBox = filterBar.querySelector('#shift-audit-custom-dates');
        const customStartInput = filterBar.querySelector('#shift-audit-custom-start');
        const customEndInput = filterBar.querySelector('#shift-audit-custom-end');
        if (customDatesBox) {
          customDatesBox.style.display = currentShiftAuditPreset === 'custom' ? 'flex' : 'none';
        }
        if (customStartInput) customStartInput.value = startDate;
        if (customEndInput) customEndInput.value = endDate;
      }

      await renderShiftAuditData(startDate, endDate);

      if (shiftAuditModal) {
        shiftAuditModal.style.display = 'flex';
      }
    } catch (err) {
      console.error('Shift audit error:', err);
      showToast(`خطأ في تقرير الإقفال: ${err.message}`, 'error');
    }
  }

  // =========================================================================
  // Isolated Element Printing Engine (Prevents any UI leakage)
  // =========================================================================
  function printIsolatedElement(contentHtml, documentTitle, isInvoice = true) {
    if (!contentHtml || !contentHtml.trim()) {
      showToast('لا يوجد محتوى متاح للطباعة.', 'error');
      return;
    }

    // Set scoped class on document body
    document.body.classList.remove('printing-invoice', 'printing-shift-audit');
    document.body.classList.add(isInvoice ? 'printing-invoice' : 'printing-shift-audit');

    let printFrame = document.getElementById('app-print-frame');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'app-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.style.visibility = 'hidden';
      document.body.appendChild(printFrame);
    }

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${documentTitle}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm 12mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: "Segoe UI", Tahoma, "Cairo", Arial, sans-serif;
            direction: rtl;
            text-align: right;
            background: white !important;
            color: #0f172a !important;
            padding: 0;
            margin: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body>
        <div style="padding: 10px; width: 100%;">${contentHtml}</div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (e) {
        console.error('Iframe print error, falling back to window.print():', e);
        window.print();
      } finally {
        setTimeout(() => {
          document.body.classList.remove('printing-invoice', 'printing-shift-audit');
        }, 1500);
      }
    }, 300);
  }

  // Close & Print Handlers for Invoice Modal
  if (btnCloseInvoiceModal) {
    btnCloseInvoiceModal.addEventListener('click', () => {
      if (invoiceModal) invoiceModal.style.display = 'none';
      document.body.classList.remove('printing-invoice', 'printing-shift-audit');
    });
  }
  if (invoiceModal) {
    invoiceModal.addEventListener('click', (e) => {
      if (e.target === invoiceModal) {
        invoiceModal.style.display = 'none';
        document.body.classList.remove('printing-invoice', 'printing-shift-audit');
      }
    });
  }

  // Close Handlers for Room Revenue Modal
  if (btnCloseRoomRevenueModal) {
    btnCloseRoomRevenueModal.addEventListener('click', () => {
      if (roomRevenueModal) roomRevenueModal.style.display = 'none';
    });
  }
  if (roomRevenueModal) {
    roomRevenueModal.addEventListener('click', (e) => {
      if (e.target === roomRevenueModal) {
        roomRevenueModal.style.display = 'none';
      }
    });
  }
  if (btnTriggerPrintInvoice) {
    btnTriggerPrintInvoice.addEventListener('click', () => {
      printIsolatedElement(invoicePrintableArea ? invoicePrintableArea.innerHTML : '', 'سند استلام', true);
    });
  }
  if (btnExportPdfInvoice) {
    btnExportPdfInvoice.addEventListener('click', async () => {
      try {
        if (!invoicePrintableArea || !invoicePrintableArea.innerHTML.trim()) {
          showToast('لا توجد بيانات سند لتصديره.', 'error');
          return;
        }
        showToast('جاري إنشاء وحفظ ملف السند بصيغة PDF...', 'info');
        const res = await api.printToPdf({
          html: invoicePrintableArea.innerHTML,
          title: 'سند استلام',
          defaultFilename: `receipt_${currentInvoiceReservationId || 'reservation'}.pdf`
        });
        if (res && res.canceled) return;
        if (res && res.success) {
          showToast(`تم تصدير وحفظ السند بنجاح في: ${res.filePath}`, 'success');
        } else {
          showToast(res?.error || 'فشل تصدير ملف PDF.', 'error');
        }
      } catch (err) {
        showToast(`خطأ أثناء تصدير PDF: ${err.message}`, 'error');
      }
    });
  }
  if (btnPreviewWindowInvoice) {
    btnPreviewWindowInvoice.addEventListener('click', async () => {
      try {
        if (!invoicePrintableArea || !invoicePrintableArea.innerHTML.trim()) {
          showToast('لا توجد بيانات سند للمعاينة.', 'error');
          return;
        }
        await api.openPrintPreviewWindow({
          html: invoicePrintableArea.innerHTML,
          title: 'معاينة سند الاستلام'
        });
      } catch (err) {
        showToast(`تعذر فتح نافذة المعاينة: ${err.message}`, 'error');
      }
    });
  }

  // Edit Receipt / Invoice Handlers
  function updateEditInvoiceRemaining() {
    const total = parseFloat(editInvTotalPrice ? editInvTotalPrice.value : 0) || 0;
    const paid = parseFloat(editInvPaidAmount ? editInvPaidAmount.value : 0) || 0;
    const isOpenContract = currentInvoiceData && currentInvoiceData.booking_type === 'عقد مفتوح';
    const remaining = total - paid;
    if (editInvRemainingPreview) {
      if (isOpenContract && remaining < -0.005) {
        editInvRemainingPreview.textContent = `رصيد دائن: ${Math.abs(remaining).toFixed(2)} ريال`;
        editInvRemainingPreview.style.color = '#2563eb';
      } else {
        const displayRemaining = Math.max(0, remaining);
        editInvRemainingPreview.textContent = `${displayRemaining.toFixed(2)} ريال`;
        editInvRemainingPreview.style.color = displayRemaining > 0 ? '#dc2626' : '#059669';
      }
    }
  }

  if (editInvTotalPrice) editInvTotalPrice.addEventListener('input', updateEditInvoiceRemaining);
  if (editInvPaidAmount) editInvPaidAmount.addEventListener('input', updateEditInvoiceRemaining);

  if (btnEditInvoice) {
    btnEditInvoice.addEventListener('click', () => {
      if (!currentInvoiceData) {
        showToast('يرجى فتح سند أولاً لتعديله.', 'error');
        return;
      }
      if (editInvResId) editInvResId.value = currentInvoiceData.id;
      if (editInvGuestName) editInvGuestName.value = currentInvoiceData.guest_name || '';
      if (editInvGuestPhone) editInvGuestPhone.value = currentInvoiceData.guest_phone || '';
      if (editInvGuestId) editInvGuestId.value = currentInvoiceData.guest_id_number || '';
      if (editInvTotalPrice) editInvTotalPrice.value = currentInvoiceData.total_price || 0;
      if (editInvPaidAmount) editInvPaidAmount.value = currentInvoiceData.paid_amount || 0;
      if (editInvDepositAmount) editInvDepositAmount.value = currentInvoiceData.deposit_amount || 0;
      if (editInvPaymentMethod) editInvPaymentMethod.value = currentInvoiceData.payment_method || 'نقداً';

      updateEditInvoiceRemaining();
      if (editInvoiceModal) editInvoiceModal.style.display = 'flex';
    });
  }

  function closeEditInvoiceModal() {
    if (editInvoiceModal) editInvoiceModal.style.display = 'none';
  }

  if (btnCloseEditInvoice) btnCloseEditInvoice.addEventListener('click', closeEditInvoiceModal);
  if (btnCancelEditInv) btnCancelEditInv.addEventListener('click', closeEditInvoiceModal);
  if (editInvoiceModal) {
    editInvoiceModal.addEventListener('click', (e) => {
      if (e.target === editInvoiceModal) closeEditInvoiceModal();
    });
  }

  if (editInvoiceForm) {
    editInvoiceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const resId = parseInt(editInvResId.value, 10);
      const guestName = editInvGuestName.value.trim();
      const guestPhone = editInvGuestPhone.value.trim();
      const guestIdNumber = editInvGuestId.value.trim();
      const totalPrice = parseFloat(editInvTotalPrice.value) || 0;
      const paidAmount = parseFloat(editInvPaidAmount.value) || 0;
      const depositAmount = parseFloat(editInvDepositAmount ? editInvDepositAmount.value : 0) || 0;
      const paymentMethod = editInvPaymentMethod.value;
      const isOpenContract = currentInvoiceData && currentInvoiceData.booking_type === 'عقد مفتوح';

      if (!guestName) {
        showToast('يرجى إدخال اسم النزيل.', 'error');
        return;
      }
      if (guestPhone && !/^05\d{8}$/.test(guestPhone)) {
        showToast('رقم الجوال غير صحيح: يجب أن يبدأ بـ 05 ويتكون من 10 أرقام (مثال: 0501234567).', 'error');
        return;
      }
      if (guestIdNumber && !/^(?:\d{10}|[a-zA-Z0-9]{6,9})$/i.test(guestIdNumber)) {
        showToast('رقم الهوية الوطنية أو الإقامة (10 أرقام) أو جواز السفر (6 إلى 9 خانات) غير صحيح.', 'error');
        return;
      }
      if (!isOpenContract && totalPrice <= 0) {
        showToast('السعر الإجمالي يجب أن يكون أكبر من الصفر.', 'error');
        return;
      }
      if (isOpenContract && totalPrice < 0) {
        showToast('السعر الإجمالي لا يمكن أن يكون سالباً.', 'error');
        return;
      }
      if (paidAmount < 0) {
        showToast('المبلغ المدفوع لا يمكن أن يكون سالباً.', 'error');
        return;
      }
      if (!isOpenContract && paidAmount - totalPrice > 0.005) {
        showToast(`المبلغ المدفوع (${paidAmount} ريال) لا يمكن أن يتجاوز السعر الإجمالي (${totalPrice} ريال).`, 'error');
        return;
      }

      try {
        const res = await api.updateReservationReceipt({
          reservationId: resId,
          guestName,
          guestPhone,
          guestIdNumber,
          totalPrice,
          paidAmount,
          depositAmount,
          paymentMethod
        });

        if (res && res.success) {
          showToast('تم حفظ وتحديث بيانات السند بنجاح!', 'success');
          closeEditInvoiceModal();
          // Reload updated invoice preview
          await openInvoiceModal(resId);
          // Sync all views
          await Promise.all([
            loadOverviewData(),
            loadRoomsData(),
            loadReservationsData()
          ]);
        } else {
          showToast(res?.error || 'فشل تحديث بيانات السند.', 'error');
        }
      } catch (err) {
        showToast(`خطأ أثناء الحفظ: ${err.message}`, 'error');
      }
    });
  }

  // Shift Audit Handlers
  if (btnOpenShiftAudit) {
    btnOpenShiftAudit.addEventListener('click', () => openShiftAuditModal());
  }
  if (btnCloseShiftAudit) {
    btnCloseShiftAudit.addEventListener('click', () => {
      if (shiftAuditModal) shiftAuditModal.style.display = 'none';
      document.body.classList.remove('printing-invoice', 'printing-shift-audit');
    });
  }
  if (shiftAuditModal) {
    shiftAuditModal.addEventListener('click', (e) => {
      if (e.target === shiftAuditModal) {
        shiftAuditModal.style.display = 'none';
        document.body.classList.remove('printing-invoice', 'printing-shift-audit');
      }
    });
  }
  if (btnPrintShiftAudit) {
    btnPrintShiftAudit.addEventListener('click', () => {
      const isMultiDay = currentShiftAuditStartDate && currentShiftAuditEndDate && currentShiftAuditStartDate !== currentShiftAuditEndDate;
      const title = isMultiDay
        ? `تقرير إقفال الفترة (${formatArabicDateRange(currentShiftAuditStartDate, currentShiftAuditEndDate)})`
        : 'تقرير إقفال الوردية والموازنة المالية';
      printIsolatedElement(shiftAuditContent ? shiftAuditContent.innerHTML : '', title, false);
    });
  }
  if (btnExportPdfShiftAudit) {
    btnExportPdfShiftAudit.addEventListener('click', async () => {
      try {
        if (!shiftAuditContent || !shiftAuditContent.innerHTML.trim()) {
          showToast('لا توجد بيانات تقرير لتصديرها.', 'error');
          return;
        }
        showToast('جاري إنشاء وحفظ تقرير الوردية بصيغة PDF...', 'info');
        const isMultiDay = currentShiftAuditStartDate && currentShiftAuditEndDate && currentShiftAuditStartDate !== currentShiftAuditEndDate;
        const title = isMultiDay
          ? `تقرير إقفال الفترة (${formatArabicDateRange(currentShiftAuditStartDate, currentShiftAuditEndDate)})`
          : 'تقرير إقفال الوردية والموازنة المالية';
        const defaultFilename = isMultiDay
          ? `shift_audit_${currentShiftAuditStartDate}_to_${currentShiftAuditEndDate}.pdf`
          : `shift_audit_${getLocalDateString()}.pdf`;

        const res = await api.printToPdf({
          html: shiftAuditContent.innerHTML,
          title: title,
          defaultFilename: defaultFilename
        });
        if (res && res.canceled) return;
        if (res && res.success) {
          showToast(`تم تصدير وحفظ تقرير الوردية بنجاح في: ${res.filePath}`, 'success');
        } else {
          showToast(res?.error || 'فشل تصدير ملف PDF.', 'error');
        }
      } catch (err) {
        showToast(`خطأ أثناء تصدير PDF: ${err.message}`, 'error');
      }
    });
  }
  if (btnPreviewWindowShiftAudit) {
    btnPreviewWindowShiftAudit.addEventListener('click', async () => {
      try {
        if (!shiftAuditContent || !shiftAuditContent.innerHTML.trim()) {
          showToast('لا توجد بيانات تقرير للمعاينة.', 'error');
          return;
        }
        const isMultiDay = currentShiftAuditStartDate && currentShiftAuditEndDate && currentShiftAuditStartDate !== currentShiftAuditEndDate;
        const title = isMultiDay
          ? `معاينة تقرير إقفال الفترة (${formatArabicDateRange(currentShiftAuditStartDate, currentShiftAuditEndDate)})`
          : 'معاينة تقرير إقفال الوردية والموازنة المالية';
        await api.openPrintPreviewWindow({
          html: shiftAuditContent.innerHTML,
          title: title
        });
      } catch (err) {
        showToast(`تعذر فتح نافذة المعاينة: ${err.message}`, 'error');
      }
    });
  }

  // Backup & Restore Database Handlers (Feature 4)
  if (btnBackupDb) {
    btnBackupDb.addEventListener('click', async () => {
      try {
        const res = await api.createBackup();
        if (res && res.canceled) return;
        if (res && res.success) {
          showToast(res.message || 'تم حفظ النسخة الاحتياطية لقاعدة البيانات بنجاح!', 'success');
        } else {
          showToast(res?.error || 'فشل إنشاء النسخة الاحتياطية.', 'error');
        }
      } catch (err) {
        showToast(`خطأ في النسخ الاحتياطي: ${err.message}`, 'error');
      }
    });
  }

  if (btnRestoreDb) {
    btnRestoreDb.addEventListener('click', async () => {
      const confirmed = await showConfirmDialog({
        title: 'استعادة قاعدة البيانات',
        message: 'تنبيه أمان هام جداً:\nاستعادة قاعدة بيانات ستستبدل جميع البيانات الحالية بالنسخة المحددة.\n\nهل أنت متأكد من رغبتك في المتابعة؟',
        confirmText: 'نعم، استعادة البيانات',
        cancelText: 'إلغاء',
        isDanger: true
      });
      if (!confirmed) {
        return;
      }
      try {
        const res = await api.restoreBackup();
        if (res && res.canceled) return;
        if (res && res.success) {
          showToast(res.message || 'تمت استعادة قاعدة البيانات بنجاح!', 'success');
          await loadOverviewData();
          await loadReservationsData();
          await loadRoomsData();
          await loadGuestsData();
        } else {
          showToast(res?.error || 'فشل استعادة قاعدة البيانات.', 'error');
        }
      } catch (err) {
        showToast(`خطأ في الاستعادة: ${err.message}`, 'error');
      }
    });
  }

  // =========================================================================
  // DAILY AUTOMATED BACKUP (12:00 AM) - HANDLERS & MODAL LOGIC
  // =========================================================================

  function formatArabicDateTime(isoString) {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + ' ' + d.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  }

  async function openDailyBackupModal() {
    if (!dailyBackupModal) return;
    try {
      const res = await api.getDailyBackupStatus();
      if (!res || !res.success) {
        showToast(res?.error || 'تعذر جلب حالة النسخ الاحتياطي اليومي.', 'error');
        return;
      }
      const data = res.data;

      // Update KPIs
      if (dailyBackupStatusBadge) {
        dailyBackupStatusBadge.textContent = data.enabled ? 'مفعّل ونشط ✅' : 'معطّل ⚠️';
        dailyBackupStatusBadge.style.color = data.enabled ? '#047857' : '#dc2626';
      }

      if (dailyBackupNextRun) {
        if (data.msUntilNext) {
          const hours = Math.floor(data.msUntilNext / (1000 * 60 * 60));
          const mins = Math.floor((data.msUntilNext % (1000 * 60 * 60)) / (1000 * 60));
          dailyBackupNextRun.textContent = `النسخة القادمة: الليلة 12:00 ص (خلال ${hours} س و ${mins} د)`;
        } else {
          dailyBackupNextRun.textContent = 'النسخة القادمة: الليلة 12:00 ص';
        }
      }

      if (dailyBackupLastTime) {
        dailyBackupLastTime.textContent = formatArabicDateTime(data.lastDailyBackupTimestamp);
      }
      if (dailyBackupLastFile) {
        dailyBackupLastFile.textContent = data.lastDailyBackupFile || 'لم يتم التسجيل بعد';
      }
      if (dailyBackupTotalCount) {
        dailyBackupTotalCount.textContent = `${data.totalBackupsCount || 0} نسخة`;
      }
      if (dailyBackupFolderPathDisplay) {
        dailyBackupFolderPathDisplay.textContent = data.backupDir || '';
        dailyBackupFolderPathDisplay.title = data.backupDir || '';
      }

      if (dailyBackupFolderTypeBadge) {
        if (data.isCustomFolder) {
          dailyBackupFolderTypeBadge.textContent = 'مجلد مخصص (Custom)';
          dailyBackupFolderTypeBadge.style.background = '#e0e7ff';
          dailyBackupFolderTypeBadge.style.color = '#3730a3';
        } else {
          dailyBackupFolderTypeBadge.textContent = 'المجلد الافتراضي (Default)';
          dailyBackupFolderTypeBadge.style.background = '#f1f5f9';
          dailyBackupFolderTypeBadge.style.color = '#475569';
        }
      }

      if (btnResetDailyBackupFolder) {
        btnResetDailyBackupFolder.style.display = data.isCustomFolder ? 'inline-flex' : 'none';
      }

      if (dailyBackupTableCountBadge) {
        dailyBackupTableCountBadge.textContent = `${data.totalBackupsCount || 0} ملف`;
      }

      // Populate Table
      if (dailyBackupsTableBody) {
        dailyBackupsTableBody.innerHTML = '';
        const list = data.backupsList || [];

        if (list.length === 0) {
          if (dailyBackupsEmpty) dailyBackupsEmpty.style.display = 'block';
        } else {
          if (dailyBackupsEmpty) dailyBackupsEmpty.style.display = 'none';
          list.forEach((item) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e2e8f0';

            const isDaily = item.isDaily;
            const isLatest = item.isLatest;

            let badgeHtml = '';
            if (isLatest) {
              badgeHtml = `<span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem;">الأحدث (Latest)</span>`;
            } else if (isDaily) {
              badgeHtml = `<span style="background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem;">يومي 12:00 ص 🕛</span>`;
            } else {
              badgeHtml = `<span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem;">نسخة يدوية 📁</span>`;
            }

            tr.innerHTML = `
              <td style="padding: 10px 14px; font-family: monospace; font-weight: 600; color: #1e293b; direction: ltr; text-align: right;">${item.filename}</td>
              <td style="padding: 10px 14px; color: #475569;">${formatArabicDateTime(item.modified)}</td>
              <td style="padding: 10px 14px; color: #475569;">${item.sizeFormatted}</td>
              <td style="padding: 10px 14px;">${badgeHtml}</td>
              <td style="padding: 10px 14px; text-align: center;">
                <button type="button" class="btn btn-sm btn-restore-single-backup" data-path="${item.path.replace(/"/g, '&quot;')}" style="background: #fffbeb; border: 1px solid #fde68a; color: #b45309; font-weight: 700; padding: 4px 10px; font-size: 0.78rem; cursor: pointer;">
                  استعادة هذه النسخة 🔄
                </button>
              </td>
            `;
            dailyBackupsTableBody.appendChild(tr);
          });

          // Attach restore handlers
          const restoreBtns = dailyBackupsTableBody.querySelectorAll('.btn-restore-single-backup');
          restoreBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
              const targetPath = btn.getAttribute('data-path');
              const confirmed = await showConfirmDialog({
                title: 'استعادة النسخة الاحتياطية اليومية',
                message: 'تنبيه أمان هام جداً:\nاستعادة هذه النسخة الاحتياطية سيستبدل بيانات النظام الحالية بالبيانات المحفوظة في هذا الملف.\n\nهل أنت متأكد من رغبتك في استعادة هذه النسخة؟',
                confirmText: 'نعم، استعادة النسخة',
                cancelText: 'إلغاء',
                isDanger: true
              });
              if (!confirmed) {
                return;
              }
              try {
                const restoreRes = await api.restoreDailyBackup(targetPath);
                if (restoreRes && restoreRes.success) {
                  showToast('تمت استعادة قاعدة البيانات بنجاح من النسخة المحددة!', 'success');
                  dailyBackupModal.style.display = 'none';
                  await loadOverviewData();
                  await loadReservationsData();
                  await loadRoomsData();
                  await loadGuestsData();
                } else {
                  showToast(restoreRes?.error || 'فشلت عملية استعادة النسخة.', 'error');
                }
              } catch (e) {
                showToast(`خطأ أثناء الاستعادة: ${e.message}`, 'error');
              }
            });
          });
        }
      }

      dailyBackupModal.style.display = 'flex';
    } catch (err) {
      console.error('[Daily Backup Modal Error]:', err);
      showToast(`خطأ في فتح نافذة النسخ الاحتياطي: ${err.message}`, 'error');
    }
  }

  if (btnDailyBackupModal) {
    btnDailyBackupModal.addEventListener('click', () => {
      openDailyBackupModal();
    });
  }

  if (btnCloseDailyBackup) {
    btnCloseDailyBackup.addEventListener('click', () => {
      if (dailyBackupModal) dailyBackupModal.style.display = 'none';
    });
  }

  if (dailyBackupModal) {
    dailyBackupModal.addEventListener('click', (e) => {
      if (e.target === dailyBackupModal) {
        dailyBackupModal.style.display = 'none';
      }
    });
  }

  if (btnOpenDailyBackupsFolder) {
    btnOpenDailyBackupsFolder.addEventListener('click', async () => {
      try {
        await api.openBackupsFolder();
      } catch (err) {
        showToast(`تعذر فتح مجلد النسخ: ${err.message}`, 'error');
      }
    });
  }

  if (btnChangeDailyBackupFolder) {
    btnChangeDailyBackupFolder.addEventListener('click', async () => {
      try {
        const originalHtml = btnChangeDailyBackupFolder.innerHTML;
        btnChangeDailyBackupFolder.disabled = true;
        btnChangeDailyBackupFolder.innerHTML = '<span>جاري الاختيار... ⏳</span>';

        const res = await api.selectBackupFolder();

        btnChangeDailyBackupFolder.disabled = false;
        btnChangeDailyBackupFolder.innerHTML = originalHtml;

        if (res && res.success) {
          showToast(`تم تغيير مجلد حفظ النسخ التلقائية بنجاح إلى:\n${res.folderPath}`, 'success');
          await openDailyBackupModal();
        } else if (res && res.error) {
          showToast(`تعذر تغيير المجلد: ${res.error}`, 'error');
        }
      } catch (err) {
        if (btnChangeDailyBackupFolder) {
          btnChangeDailyBackupFolder.disabled = false;
        }
        showToast(`خطأ في اختيار المجلد: ${err.message}`, 'error');
      }
    });
  }

  if (btnResetDailyBackupFolder) {
    btnResetDailyBackupFolder.addEventListener('click', async () => {
      const confirmed = await showConfirmDialog({
        title: 'استعادة مجلد الحفظ الافتراضي',
        message: 'هل ترغب في إعادة ضبط مسار حفظ النسخ الاحتياطية التلقائية إلى مجلد التطبيق الافتراضي؟',
        confirmText: 'استعادة الافتراضي',
        cancelText: 'إلغاء',
        isDanger: false
      });
      if (!confirmed) {
        return;
      }
      try {
        const res = await api.resetBackupFolder();
        if (res && res.success) {
          showToast('تمت استعادة مجلد الحفظ الافتراضي بنجاح.', 'info');
          await openDailyBackupModal();
        } else {
          showToast(res?.error || 'فشلت استعادة المجلد الافتراضي.', 'error');
        }
      } catch (err) {
        showToast(`خطأ: ${err.message}`, 'error');
      }
    });
  }

  if (btnTriggerDailyBackupNow) {
    btnTriggerDailyBackupNow.addEventListener('click', async () => {
      try {
        btnTriggerDailyBackupNow.disabled = true;
        const originalHtml = btnTriggerDailyBackupNow.innerHTML;
        btnTriggerDailyBackupNow.innerHTML = 'جاري النسخ... ⏳';

        const res = await api.runDailyBackupNow();
        if (res && res.success) {
          showToast(`تم أخذ نسخة احتياطية بنجاح! (${res.filename})`, 'success');
          await openDailyBackupModal();
        } else {
          showToast(res?.error || 'فشل إجراء النسخة الاحتياطية.', 'error');
        }
        btnTriggerDailyBackupNow.disabled = false;
        btnTriggerDailyBackupNow.innerHTML = originalHtml;
      } catch (err) {
        btnTriggerDailyBackupNow.disabled = false;
        showToast(`خطأ في النسخ الفوري: ${err.message}`, 'error');
      }
    });
  }

  if (btnRefreshDailyBackups) {
    btnRefreshDailyBackups.addEventListener('click', async () => {
      await openDailyBackupModal();
      showToast('تم تحديث قائمة النسخ الاحتياطية بنجاح.', 'info');
    });
  }

  // Live IPC Listener for 12:00 AM Automated Daily Backup
  if (window.api && api.onDailyBackupEvent) {
    api.onDailyBackupEvent((eventData) => {
      if (eventData && eventData.success) {
        showToast(`🕛 تم أخذ النسخة الاحتياطية اليومية بنجاح (12:00 AM):\n${eventData.filename}`, 'success');
        if (dailyBackupModal && dailyBackupModal.style.display === 'flex') {
          openDailyBackupModal();
        }
      }
    });
  }

  // =========================================================================
  // WHATSAPP RESERVATION CONFIRMATION (SAUDI ARABIA NUMBERS)
  // =========================================================================
  function formatSaudiWhatsAppNumber(rawPhone) {
    if (!rawPhone) return '';
    // Remove spaces, dashes, parentheses and non-numeric chars
    let cleaned = String(rawPhone).replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith('00966')) {
      cleaned = '966' + cleaned.substring(5);
    } else if (cleaned.startsWith('966')) {
      // Already formatted with 966
    } else if (cleaned.startsWith('0')) {
      // e.g., '0501234567' -> '966501234567'
      cleaned = '966' + cleaned.substring(1);
    } else if (cleaned.startsWith('5') && cleaned.length === 9) {
      // e.g., '501234567' -> '966501234567'
      cleaned = '966' + cleaned;
    }
    return cleaned;
  }

  async function sendReservationWhatsApp(reservationId) {
    const targetId = parseInt(reservationId, 10);
    const res = dashboardState.reservationsCache.find(r => r.id === targetId);
    if (!res) {
      showToast('لم يتم العثور على بيانات هذا الحجز.', 'error');
      return;
    }

    if (!res.guest_phone || !res.guest_phone.trim()) {
      showToast('لا يوجد رقم هاتف مسجل لهذا النزيل لإرسال رسالة واتساب.', 'error');
      return;
    }

    const cleanPhone = formatSaudiWhatsAppNumber(res.guest_phone);
    if (!cleanPhone || cleanPhone.length < 9) {
      showToast(`رقم الهاتف (${res.guest_phone}) غير صالح للمراسلة عبر واتساب.`, 'error');
      return;
    }

    const message = `مرحباً ${res.guest_name || 'عزيزنا النزيل'}،
تم تأكيد حجزك في فندقنا (Ahmed ERP).
رقم الغرفة: ${res.room_number || '-'}
تاريخ الوصول: ${res.check_in_date || '-'}
تاريخ المغادرة: ${res.check_out_date || '-'}
نتمنى لك إقامة سعيدة!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    try {
      showToast(`جاري فتح محادثة واتساب مع النزيل: ${res.guest_name}...`, 'info');
      const response = await api.openWhatsApp(whatsappUrl);
      if (response && response.success) {
        showToast('تم فتح محادثة واتساب بنجاح! ✓', 'success');
      } else {
        showToast(response?.error || 'تعذر فتح تطبيق واتساب.', 'error');
      }
    } catch (err) {
      showToast(`خطأ أثناء فتح واتساب: ${err.message}`, 'error');
    }
  }

  // =========================================================================
  // GLOBAL ACTIONS: CHECKOUT, CANCEL, INVOICE, QUICK-BOOK & QUICK-READY
  // =========================================================================
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id || btn.getAttribute('data-id'), 10);

    // Shift Audit Open
    if (action === 'open-shift-audit') {
      openShiftAuditModal();
      return;
    }

    // Daily Automated Backup Open
    if (action === 'open-daily-backup') {
      openDailyBackupModal();
      return;
    }

    // DB Backup & Restore
    if (action === 'backup-db') {
      if (btnBackupDb) btnBackupDb.click();
      return;
    }
    if (action === 'restore-db') {
      if (btnRestoreDb) btnRestoreDb.click();
      return;
    }

    // Invoice View & Print
    if (action === 'invoice') {
      openInvoiceModal(id);
      return;
    }

    // Send via WhatsApp
    if (action === 'whatsapp') {
      sendReservationWhatsApp(id);
      return;
    }

    // Edit Room Modal Open
    if (action === 'edit-room') {
      const roomId = btn.dataset.roomId || btn.dataset.id;
      openEditRoomModal(roomId);
      return;
    }

    // Edit Guest Modal Open
    if (action === 'edit-guest') {
      openEditGuestModal(id);
      return;
    }

    // Room Revenue Report Modal Open
    if (action === 'room-revenue') {
      const roomId = btn.dataset.roomId || btn.dataset.id;
      openRoomRevenueModal(roomId);
      return;
    }

    // Quick Book from Room Card
    if (action === 'quick-book') {
      const roomId = btn.dataset.roomId;
      initiateRoomBooking(roomId);
      return;
    }

    // Quick Cleaned (1-click ready)
    if (action === 'quick-ready') {
      const roomId = btn.dataset.roomId;
      try {
        const res = await api.updateRoomStatus(roomId, 'متاحة');
        if (res.success) {
          showToast('تم تحديث حالة الغرفة إلى "متاحة" وجاهزة للتسكين بنجاح! ✓', 'success');
          await loadRoomsData();
          await loadOverviewData();
        } else {
          showToast('فشل تحديث حالة الغرفة.', 'error');
        }
      } catch (err) {
        showToast(`خطأ: ${err.message}`, 'error');
      }
      return;
    }

    // Add Subsequent Payment Modal Open
    if (action === 'add-payment') {
      openAddPaymentModal(id);
      return;
    }

    // Extend Stay Modal Open
    if (action === 'extend') {
      openExtendStayModal(id);
      return;
    }

    if (action === 'checkout') {
      let resData = dashboardState.reservationsCache.find(r => r.id === id);
      if (!resData) {
        try {
          const invRes = await api.getInvoiceData(id);
          if (invRes && invRes.success && invRes.data) {
            resData = invRes.data;
          }
        } catch (e) {}
      }

      if (resData && (resData.booking_type === 'عقد مفتوح' || (parseFloat(resData.total_price || 0) - parseFloat(resData.paid_amount || 0) > 0.005))) {
        openContractSettleModal(resData);
        return;
      }

      const confirmed = await showConfirmDialog({
        title: 'تسجيل خروج النزيل',
        message: `هل أنت متأكد من تسجيل خروج النزيل للحجز #${id}؟\nسيتم إكمال الحجز وتحويل الغرفة تلقائياً لوضع "تنظيف".`,
        confirmText: 'تسجيل الخروج',
        cancelText: 'إلغاء',
        isDanger: false
      });

      if (confirmed) {
        try {
          const res = await api.checkoutReservation(id);
          if (res.success) {
            showToast(`تم تسجيل خروج الحجز #${id} بنجاح.`, 'success');
            await loadOverviewData();
            await loadReservationsData();
            await loadRoomsData();
          } else {
            showToast(res.error || 'فشل تسجيل الخروج.', 'error');
          }
        } catch (err) {
          showToast(`خطأ: ${err.message}`, 'error');
        }
      }
    } else if (action === 'cancel') {
      let targetRes = dashboardState.reservationsCache.find(r => r.id === id);
      if (!targetRes) {
        try {
          const allRes = await api.getAllReservations();
          if (allRes && allRes.data) {
            dashboardState.reservationsCache = allRes.data;
            targetRes = dashboardState.reservationsCache.find(r => r.id === id);
          }
        } catch (e) {}
      }

      const todayStr = getLocalDateString();
      const hasStarted = targetRes && targetRes.check_in_date ? (todayStr >= targetRes.check_in_date) : true;

      let cancelPayload = { reservationId: id };

      if (!hasStarted) {
        // Pre-arrival cancellation: keep it simple with standard confirm modal
        const confirmed = await showConfirmDialog({
          title: 'إلغاء حجز قبل الوصول',
          message: `هل أنت متأكد من إلغاء الحجز #${id} للنزيل (${targetRes?.guest_name || 'نزيل'})؟\n(الحجز لم يبدأ بعد - سيتم إلغاء الحجز بالكامل وإعادة أي مبالغ مدفوعة مسبقاً للنزيل).`,
          confirmText: 'نعم، إلغاء الحجز',
          cancelText: 'تراجع',
          isDanger: true
        });
        if (!confirmed) return;
      } else {
        // Mid-stay cancellation: show mid-stay cancellation modal with editable departure date & admin override
        const modalResult = await showMidStayCancelModal(targetRes || { id, check_in_date: todayStr });
        if (!modalResult || !modalResult.confirmed) return;
        cancelPayload.actualDepartureDate = modalResult.actualDepartureDate;
        cancelPayload.manualOverrideAmount = modalResult.manualOverrideAmount;
      }

      try {
        const res = await api.cancelReservation(cancelPayload);
        if (res && res.success) {
          await loadOverviewData();
          await loadReservationsData();
          await loadRoomsData();

          let summaryMsg = '';
          if (res.proRatedCharge > 0 || res.hasStarted) {
            summaryMsg = `تم إلغاء الحجز #${id} جزئياً (أثناء الإقامة):\n` +
              `• مدة الإقامة المحتسبة: ${res.daysStayed || 1} ليلة\n` +
              `• قيمة الإقامة المستحقة: ${Number(res.proRatedCharge).toLocaleString()} ريال\n`;
            if (res.isOverridden) {
              summaryMsg += `  (مبلغ معدل يدوياً بواسطة الإدارة - التكلفة المحتسبة تلقائياً كانت: ${Number(res.originalCalculatedCharge).toLocaleString()} ريال)\n`;
            }
            if (res.refundDue > 0) {
              summaryMsg += `• المبلغ المستحق إرجاعه للنزيل (مسترد): ${Number(res.refundDue).toLocaleString()} ريال\n(يرجى تسليم المبلغ نقداً للنزيل)`;
            } else if (res.stillOwed > 0) {
              summaryMsg += `• المبلغ المتبقي للتحصيل من النزيل: ${Number(res.stillOwed).toLocaleString()} ريال\n(يرجى تحصيل المبلغ المتبقي)`;
            } else {
              summaryMsg += `• الحساب متوازن بالكامل (المبلغ المدفوع يغطي الإقامة تماماً).`;
            }
          } else {
            summaryMsg = `تم إلغاء الحجز #${id} بالكامل قبل موعد الوصول:\n`;
            if (res.refundDue > 0) {
              summaryMsg += `• المبلغ المستحق إرجاعه للنزيل (عربون كامل): ${Number(res.refundDue).toLocaleString()} ريال\n(يرجى إعادة المبلغ للنزيل)`;
            } else {
              summaryMsg += `• تم الإلغاء بنجاح (لا توجد مبالغ مستحقة أو مدفوعة مسبقاً).`;
            }
          }

          await showConfirmDialog({
            title: (res.proRatedCharge > 0 || res.hasStarted) ? 'تصفية الإلغاء الجزئي للحجز' : 'تم إلغاء الحجز بنجاح',
            message: summaryMsg,
            confirmText: 'حسناً (تم الاطلاع)',
            cancelText: 'إغلاق',
            isDanger: false
          });

          showToast((res.proRatedCharge > 0 || res.hasStarted) ? `تم الإلغاء الجزئي للحجز #${id}.` : `تم إلغاء الحجز #${id}.`, 'info');
        } else {
          showToast(res?.error || 'فشل إلغاء الحجز.', 'error');
        }
      } catch (err) {
        showToast(`خطأ: ${err.message}`, 'error');
      }
    }
  });

  // In-App Logout Confirmation System (Zero native modal freezing)
  const logoutModal = document.getElementById('logout-confirm-modal');
  const btnCancelLogout = document.getElementById('btn-cancel-logout');
  const btnConfirmLogout = document.getElementById('btn-confirm-logout');

  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      if (logoutModal) {
        logoutModal.style.display = 'flex';
      } else {
        doLogout();
      }
    });
  }

  if (btnCancelLogout) {
    btnCancelLogout.addEventListener('click', () => {
      if (logoutModal) logoutModal.style.display = 'none';
    });
  }

  if (btnConfirmLogout) {
    btnConfirmLogout.addEventListener('click', async () => {
      if (logoutModal) logoutModal.style.display = 'none';
      await doLogout();
    });
  }

  async function doLogout() {
    const storedLogId = localStorage.getItem(STORAGE_KEYS.logId);
    try {
      if (window.api && api.logout) {
        await api.logout(storedLogId ? parseInt(storedLogId, 10) : null);
      }
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.logId);
      localStorage.removeItem(STORAGE_KEYS.currentUserRole);
      localStorage.removeItem(STORAGE_KEYS.currentUsername);
      localStorage.removeItem(STORAGE_KEYS.currentUserId);
      window.location.href = 'login.html';
    }
  }

  // Open DB folder
  btnOpenDb.addEventListener('click', async () => {
    try {
      await api.openDbFolder();
    } catch (err) {
      console.error(err);
    }
  });

  // =========================================================================
  // VIEW 6: EMPLOYEE ACTIVITY LOGS (سجل نشاط الموظفين - Admin Only)
  // =========================================================================
  async function loadLogsData() {
    const activeRole = localStorage.getItem(STORAGE_KEYS.currentUserRole) || (dashboardState.currentUser ? dashboardState.currentUser.role : null);
    if (activeRole !== 'Admin') return;

    try {
      const res = await api.getEmployeeLogs();
      if (res.success) {
        dashboardState.logsCache = res.data || [];
        renderLogsTable();
      } else {
        showToast(res.error || 'تعذر تحميل سجل الموظفين.', 'error');
      }
    } catch (err) {
      console.error('Load logs error:', err);
    }
  }

  function renderLogsTable() {
    const query = (searchLogs.value || '').toLowerCase().trim();

    const filtered = dashboardState.logsCache.filter(log => {
      if (!query) return true;
      return (
        String(log.id || '').includes(query) ||
        String(log.username || '').toLowerCase().includes(query) ||
        String(log.role || '').toLowerCase().includes(query)
      );
    });

    logsCountBadge.textContent = filtered.length;

    if (filtered.length === 0) {
      logsTableBody.innerHTML = '';
      logsEmpty.style.display = 'block';
      return;
    }

    logsEmpty.style.display = 'none';

    logsTableBody.innerHTML = filtered.map(log => {
      const isAdmin = log.role === 'Admin';
      const isActive = !log.logout_time;

      return `
        <tr>
          <td style="font-family: monospace; font-weight: 700; color: var(--primary);">#${log.id}</td>
          <td style="font-weight: 700; font-size: 0.9rem;">
            ${escapeHtml(log.username)}
          </td>
          <td>
            <span class="${isAdmin ? 'badge-role-admin' : 'badge-role-staff'}">
              ${isAdmin ? 'مدير نظام (Admin)' : 'مستخدم (User)'}
            </span>
          </td>
          <td style="font-family: monospace; font-size: 0.82rem; color: #334155;">
            ${escapeHtml(log.login_time || '-')}
          </td>
          <td style="font-family: monospace; font-size: 0.82rem; color: #334155;">
            ${log.logout_time ? escapeHtml(log.logout_time) : '<span style="color: var(--text-light);">-</span>'}
          </td>
          <td>
            ${isActive ? `
              <span class="badge" style="background: #ecfdf5; color: #065f46; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">
                <span class="online-dot" style="display:inline-block; width:6px; height:6px;"></span>
                متصل حالياً (نشط)
              </span>
            ` : `
              <span class="badge" style="background: #f1f5f9; color: #64748b; font-weight: 700;">
                جلسة منتهية
              </span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }

  searchLogs.addEventListener('input', renderLogsTable);
  btnRefreshLogs.addEventListener('click', loadLogsData);

  // --- INITIALIZE APPLICATION ---
  async function init() {
    // 1. Immediate UI state from localStorage cache
    const cachedRole = localStorage.getItem(STORAGE_KEYS.currentUserRole);
    if (cachedRole) {
      navigation.applyRbacUi(cachedRole);
      userDisplayRole.textContent = cachedRole === 'Admin' ? 'مدير نظام (Admin)' : 'مستخدم (User)';
    }

    try {
      const info = await api.getAppInfo();
      if (info && info.user) {
        dashboardState.currentUser = info.user;
        userDisplayName.textContent = dashboardState.currentUser.username;
        userDisplayRole.textContent = dashboardState.currentUser.role === 'Admin' ? 'مدير نظام (Admin)' : 'مستخدم (User)';
        localStorage.setItem(STORAGE_KEYS.currentUserRole, dashboardState.currentUser.role);
        localStorage.setItem(STORAGE_KEYS.currentUsername, dashboardState.currentUser.username);
        localStorage.setItem(STORAGE_KEYS.currentUserId, String(dashboardState.currentUser.id));

        navigation.applyRbacUi(dashboardState.currentUser.role);

        if (info.logId) {
          localStorage.setItem(STORAGE_KEYS.logId, String(info.logId));
        }
      }
      if (info && info.dbPath) {
        const name = info.dbPath.split(/[/\\]/).pop();
        dbFileName.textContent = `SQLite: ${name}`;
        dbFileName.title = info.dbPath;
      }

      // Initialize Daily Backup Tooltip
      try {
        const backupStatus = await api.getDailyBackupStatus();
        if (backupStatus && backupStatus.success && backupStatus.data && btnDailyBackupModal) {
          const d = backupStatus.data;
          btnDailyBackupModal.title = `النسخ الاحتياطي التلقائي: يومياً الساعة 12:00 منتصف الليل\nآخر نسخة: ${d.lastDailyBackupFile || 'اليوم'}`;
        }
      } catch (be) {}
    } catch (err) {
      console.warn('App info error:', err);
    }

    // Default view: overview
    window.switchView('overview');
  }

  window.openInvoiceModal = openInvoiceModal;
  window.openRoomRevenueModal = openRoomRevenueModal;
  window.openEditGuestModal = openEditGuestModal;
  window.openShiftAuditModal = openShiftAuditModal;
  window.openDailyBackupModal = openDailyBackupModal;
  window.showConfirmDialog = showConfirmDialog;
  window.showPromptDialog = showPromptDialog;
  window.openNewReservationModal = openNewReservationModal;
  window.closeNewReservationModal = closeNewReservationModal;
  window.initiateRoomBooking = initiateRoomBooking;
  window.showMidStayCancelModal = showMidStayCancelModal;

  init();

})();
