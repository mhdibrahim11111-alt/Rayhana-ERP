export const RESERVATION_STATUS = Object.freeze({
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  partiallyCancelled: 'ملغي جزئي'
});

export const PAYMENT_STATUS = Object.freeze({
  paid: 'مدفوع بالكامل',
  completed: 'مكتمل',
  credit: 'رصيد دائن',
  partiallyPaid: 'مدفوع جزئياً'
});

export const BOOKING_TYPE = Object.freeze({
  openContract: 'عقد مفتوح',
  monthly: 'حجز شهري'
});

export const ROOM_STATUS = Object.freeze({
  available: 'متاحة',
  occupied: 'مشغولة',
  cleaning: 'تنظيف',
  reserved: 'محجوزة'
});

export const STORAGE_KEYS = Object.freeze({
  currentUserRole: 'currentUserRole',
  currentUsername: 'currentUsername',
  currentUserId: 'currentUserId',
  logId: 'ahmed_hotel_log_id'
});