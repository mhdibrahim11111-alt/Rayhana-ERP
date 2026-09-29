import { BOOKING_TYPE, PAYMENT_STATUS, RESERVATION_STATUS, ROOM_STATUS } from './constants.js';
import { escapeHtml } from './utils.js';

export function getReservationStatusBadge(status) {
  if (status === RESERVATION_STATUS.confirmed) {
    return `<span class="badge badge-confirmed">حجز مؤكد</span>`;
  } else if (status === RESERVATION_STATUS.completed) {
    return `<span class="badge badge-completed">تم تسجيل الخروج</span>`;
  } else if (status === RESERVATION_STATUS.cancelled) {
    return `<span class="badge badge-cancelled">ملغي</span>`;
  } else if (status === RESERVATION_STATUS.partiallyCancelled) {
    return `<span class="badge" style="background: rgba(234, 88, 12, 0.12); color: #ea580c; border: 1px solid rgba(234, 88, 12, 0.3); font-weight: 700;">ملغي جزئياً</span>`;
  }
  return `<span class="badge">${escapeHtml(status)}</span>`;
}

export function getPaymentStatusBadge(status) {
  if (status === PAYMENT_STATUS.paid || status === PAYMENT_STATUS.completed) {
    return `<span class="badge badge-paid-full">مدفوع بالكامل ✓</span>`;
  } else if (status === PAYMENT_STATUS.credit) {
    return `<span class="badge" style="background: rgba(37, 99, 235, 0.12); color: #2563eb; border: 1px solid rgba(37, 99, 235, 0.3); font-weight: 800;">رصيد دائن 💳</span>`;
  } else if (status === PAYMENT_STATUS.partiallyPaid) {
    return `<span class="badge badge-paid-partial">مدفوع جزئياً</span>`;
  }
  return `<span class="badge badge-unpaid">غير مدفوع</span>`;
}

export function getBookingTypeBadge(type) {
  if (type === BOOKING_TYPE.openContract) {
    return `<span class="badge" style="background: rgba(14, 165, 233, 0.12); color: #0284c7; border: 1px solid rgba(14, 165, 233, 0.3); font-size: 0.72rem; font-weight: 800; padding: 2px 7px;">عقد مفتوح 📋</span>`;
  } else if (type === BOOKING_TYPE.monthly) {
    return `<span class="badge" style="background: rgba(168, 85, 247, 0.12); color: #9333ea; border: 1px solid rgba(168, 85, 247, 0.3); font-size: 0.72rem; font-weight: 800; padding: 2px 7px;">حجز شهري 📅</span>`;
  }
  return '';
}

export function getRoomStatusBadge(status) {
  if (status === ROOM_STATUS.available) {
    return `<span class="badge badge-available">متاحة (جاهزة)</span>`;
  } else if (status === ROOM_STATUS.occupied) {
    return `<span class="badge badge-occupied">مشغولة</span>`;
  } else if (status === ROOM_STATUS.cleaning) {
    return `<span class="badge badge-cleaning">قيد التنظيف</span>`;
  } else if (status === ROOM_STATUS.reserved) {
    return `<span class="badge badge-reserved">محجوزة (قادمة)</span>`;
  }
  return `<span class="badge">${escapeHtml(status)}</span>`;
}