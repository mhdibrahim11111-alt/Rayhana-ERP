const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } = require('@jest/globals');
const db = require('../../db');

let temporaryRoot;
let temporaryDatabase;
let guestSequence = 0;

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return db.getLocalDateString(date);
}

function makeReservation(overrides = {}) {
  const room = overrides.roomId
    ? db.getAllRooms().find(item => item.id === Number(overrides.roomId))
    : db.getAllRooms().find(item => item.status === 'متاحة');
  if (!room) throw new Error('Test fixture has no available room.');

  guestSequence += 1;
  const today = db.getLocalDateString();
  return db.createReservation({
    guestName: `Guest ${guestSequence}`,
    guestPhone: `05${String(guestSequence).padStart(8, '0')}`,
    guestIdNumber: `${String(guestSequence).padStart(10, '0')}`,
    roomId: room.id,
    checkInDate: today,
    checkOutDate: addDays(today, 1),
    totalPrice: 100,
    paidAmount: 0,
    ...overrides
  });
}

function getReservation(id) {
  return db.getReservationById(id);
}

function assertDatabaseIsTemporary() {
  const actualPath = path.resolve(db.getDatabaseFilePath());
  expect(actualPath).toBe(temporaryDatabase);
  expect(actualPath.startsWith(`${temporaryRoot}${path.sep}`)).toBe(true);
}

async function resetTemporaryDatabase() {
  await db.factoryReset(temporaryDatabase);
  guestSequence = 0;
  assertDatabaseIsTemporary();
}

beforeAll(async () => {
  temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rayhana-unit-db-'));
  temporaryDatabase = path.join(temporaryRoot, 'test-only.sqlite');
  await db.init(temporaryDatabase);
  assertDatabaseIsTemporary();
});

beforeEach(async () => {
  await resetTemporaryDatabase();
});

afterEach(() => {
  assertDatabaseIsTemporary();
});

afterAll(() => {
  db.close();
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
});

describe('reservations and payments', () => {
  test('creates a regular reservation with its initial payment and discount fields', () => {
    const created = makeReservation({
      totalPrice: 250,
      paidAmount: 50,
      depositAmount: 25,
      discountAmount: 10,
      discountReason: 'Test discount'
    });
    const reservation = getReservation(created.reservationId);

    expect(created.success).toBe(true);
    expect(created.receiptNumber).toMatch(/^REC-/);
    expect(reservation).toMatchObject({
      total_price: 250,
      paid_amount: 50,
      deposit_amount: 25,
      discount_amount: 10,
      discount_reason: 'Test discount',
      payment_status: 'مدفوع جزئياً',
      status: 'مؤكد'
    });
  });

  test('allows upfront credit on an open contract', () => {
    const created = makeReservation({
      bookingType: 'عقد مفتوح',
      checkOutDate: null,
      totalPrice: 100,
      paidAmount: 130
    });
    const reservation = getReservation(created.reservationId);

    expect(reservation.booking_type).toBe('عقد مفتوح');
    expect(reservation.payment_status).toBe('رصيد دائن');
    expect(Number(reservation.paid_amount)).toBe(130);
  });

  test('extends an active stay with a discount and collected payment', () => {
    const created = makeReservation({
      totalPrice: 250,
      checkOutDate: addDays(db.getLocalDateString(), 1)
    });
    const newCheckout = addDays(db.getLocalDateString(), 4);
    const result = db.extendReservation({
      reservationId: created.reservationId,
      newCheckOutDate: newCheckout,
      customNightlyPrice: 100,
      discountAmount: 10,
      additionalCost: 290,
      settleAmount: 75,
      paymentMethod: 'بطاقة / مدى'
    });
    const reservation = getReservation(created.reservationId);

    expect(result.success).toBe(true);
    expect(result.extraNights).toBe(3);
    expect(result.additionalCost).toBe(290);
    expect(reservation.check_out_date).toBe(newCheckout);
    expect(reservation.total_price).toBe(540);
    expect(reservation.paid_amount).toBe(75);
    expect(reservation.discount_amount).toBe(10);
  });

  test('checks out and records the final settlement payment', () => {
    const created = makeReservation({ totalPrice: 100, paidAmount: 20 });
    const result = db.checkoutReservation(created.reservationId, {
      finalTotalPrice: 100,
      settleAmount: 80,
      paymentMethod: 'بطاقة / مدى'
    });
    const reservation = getReservation(created.reservationId);
    const room = db.getAllRooms().find(item => item.id === reservation.room_id);

    expect(result.success).toBe(true);
    expect(reservation.status).toBe('مكتمل');
    expect(reservation.paid_amount).toBe(100);
    expect(reservation.payment_status).toBe('مدفوع بالكامل');
    expect(room.status).toBe('تنظيف');
  });

  test('fully cancels before arrival and records a full refund', () => {
    const created = makeReservation({
      checkInDate: addDays(db.getLocalDateString(), 10),
      checkOutDate: addDays(db.getLocalDateString(), 12),
      totalPrice: 200,
      paidAmount: 50
    });
    const result = db.cancelReservation(created.reservationId);
    const reservation = getReservation(created.reservationId);

    expect(result).toMatchObject({ success: true, hasStarted: false, refundDue: 50, stillOwed: 0 });
    expect(reservation.status).toBe('ملغي');
    expect(reservation.paid_amount).toBe(0);
    expect(reservation.payment_status).toBe('مستردة');
    const refunds = db.getReservationPayments(created.reservationId).filter(payment => payment.amount < 0);
    expect(refunds).toHaveLength(1);
    expect(refunds[0].amount).toBe(-50);
  });

  test('partially cancels after arrival with an administrative override', () => {
    const today = db.getLocalDateString();
    const created = makeReservation({
      checkInDate: today,
      checkOutDate: addDays(today, 4),
      totalPrice: 500,
      paidAmount: 300
    });
    const result = db.cancelReservation(created.reservationId, addDays(today, 1), 200);
    const reservation = getReservation(created.reservationId);

    expect(result).toMatchObject({
      success: true,
      hasStarted: true,
      proRatedCharge: 200,
      originalCalculatedCharge: 250,
      refundDue: 100,
      stillOwed: 0,
      isOverridden: true
    });
    expect(reservation.status).toBe('ملغي جزئي');
    expect(reservation.total_price).toBe(200);
    expect(reservation.paid_amount).toBe(200);
  });

  test('records a partial payment and rejects regular-booking overpayment', () => {
    const created = makeReservation({ totalPrice: 100, paidAmount: 20 });
    const payment = db.addPaymentToReservation({ reservationId: created.reservationId, amount: 30 });

    expect(payment).toMatchObject({
      success: true,
      amountAdded: 30,
      newPaidAmount: 50,
      remainingBalance: 50,
      paymentStatus: 'مدفوع جزئياً',
      isFullyPaid: false
    });
    expect(() => db.addPaymentToReservation({ reservationId: created.reservationId, amount: 51 })).toThrow(/يتجاوز الرصيد المتبقي/);
  });

  test('allows a payment that pushes an open contract into credit balance', () => {
    const created = makeReservation({ bookingType: 'عقد مفتوح', checkOutDate: null, totalPrice: 100, paidAmount: 80 });
    const payment = db.addPaymentToReservation({ reservationId: created.reservationId, amount: 30 });

    expect(payment.paymentStatus).toBe('رصيد دائن');
    expect(payment.newPaidAmount).toBe(110);
    expect(payment.remainingBalance).toBe(-10);
    expect(getReservation(created.reservationId).payment_status).toBe('رصيد دائن');
  });
});

describe('rooms', () => {
  test('automatically assigns occupied, reserved, and cleaning room statuses', () => {
    const rooms = db.getAllRooms();
    const today = db.getLocalDateString();
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);
    const nextWeekEnd = addDays(today, 9);

    makeReservation({ roomId: rooms[0].id, checkInDate: today, checkOutDate: tomorrow });
    makeReservation({ roomId: rooms[1].id, checkInDate: nextWeek, checkOutDate: nextWeekEnd });
    db.updateRoomStatus(rooms[2].id, 'تنظيف');
    db.autoUpdateRoomStatuses(today);

    const updatedRooms = db.getAllRooms();
    expect(updatedRooms.find(room => room.id === rooms[0].id).status).toBe('مشغولة');
    expect(updatedRooms.find(room => room.id === rooms[1].id).status).toBe('محجوزة');
    expect(updatedRooms.find(room => room.id === rooms[2].id).status).toBe('تنظيف');
    expect(() => db.updateRoomStatus(rooms[0].id, 'متاحة')).toThrow(/مشغولة بنزيل/);
  });
});

describe('guests', () => {
  test('searches and bans guests, rejects duplicate IDs, and records duplicate-phone behavior', () => {
    const first = db.addCustomer({ name: 'Guest One', phone: '0501111111', id_number: '1111111111' });
    const second = db.addCustomer({ name: 'Guest Two', phone: '0501111111', id_number: '2222222222' });

    expect(first.id).not.toBe(second.id);
    expect(db.searchGuest({ phone: '0501111111' })).not.toBeNull();
    expect(() => db.addCustomer({ name: 'Duplicate ID', phone: '0503333333', id_number: '1111111111' })).toThrow(/مسجل مسبقاً/);
    expect(() => db.updateGuest(second.id, { name: 'Guest Two', phone: '0501111111', id_number: '' })).toThrow(/رقم الجوال.*مسجل مسبقاً/);

    db.setGuestBanStatus(first.id, true, 'Repeated policy violations');
    expect(db.getAllGuests().find(guest => guest.id === first.id)).toMatchObject({
      is_banned: 1,
      ban_reason: 'Repeated policy violations'
    });
  });

  test('bulk imports new guests, updates matches, and skips nameless rows', () => {
    db.addCustomer({ name: 'Existing Guest', phone: '0504444444', id_number: '4444444444' });
    const result = db.bulkImportGuests([
      { name: 'Updated Guest', phone: '0504444444', id_number: '4444444444' },
      { name: 'Imported Guest', phone: '0505555555', id_number: '5555555555' },
      { name: '', phone: '0506666666', id_number: '' }
    ]);

    expect(result).toMatchObject({ inserted: 1, updated: 1, skipped: 1, total: 3 });
    expect(db.searchGuest({ phone: '0504444444' }).name).toBe('Updated Guest');
    expect(db.searchGuest({ id_number: '5555555555' }).name).toBe('Imported Guest');
  });
});

describe('users and reports', () => {
  test('creates users, verifies credentials, and keeps the Admin role', () => {
    const added = db.addUser({ username: 'test-admin', password: 'password123', role: 'Admin' });
    expect(added.role).toBe('Admin');
    expect(db.verifyUser('test-admin', 'password123')).toMatchObject({ success: true, user: { role: 'Admin' } });
    expect(db.verifyUser('test-admin', 'wrong')).toMatchObject({ success: false });
    expect(() => db.addUser({ username: 'test-admin', password: 'other', role: 'User' })).toThrow(/مسجل مسبقاً/);
  });

  test('bulk imports reservations and reports monthly revenue and shift audit totals', () => {
    const today = db.getLocalDateString();
    const tomorrow = addDays(today, 1);
    const rooms = db.getAllRooms();
    const imported = db.bulkImportReservations([
      { guest_name: 'Bulk Reservation', guest_phone: '0507777777', room_number: rooms[0].room_number, check_in_date: today, check_out_date: tomorrow, total_price: 140 },
      { guest_name: '', guest_phone: '', room_number: '', check_in_date: '', check_out_date: '', total_price: 0 }
    ]);

    expect(imported).toEqual({ inserted: 1, skipped: 1, total: 2 });
    const created = makeReservation({ roomId: rooms[1].id, checkInDate: today, checkOutDate: tomorrow, totalPrice: 250, paidAmount: 40 });
    const monthly = db.getMonthlyRevenue();
    const month = today.slice(0, 7);
    expect(monthly.find(row => row.month === month)).toMatchObject({ expected: 390, collected: 40 });

    const audit = db.getShiftAuditReport(today, today);
    expect(audit.financials.totalRevenue).toBe(40);
    expect(audit.transactions.some(row => row.id === created.reservationId)).toBe(true);
    expect(audit.dailyBreakdown[0]).toMatchObject({ date: today, revenue: 40 });
  });
});
