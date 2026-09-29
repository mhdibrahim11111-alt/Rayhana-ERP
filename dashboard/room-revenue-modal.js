import { getBookingTypeBadge, getReservationStatusBadge, getRoomStatusBadge } from './badges.js';
import { escapeHtml } from './utils.js';

export function createRoomRevenueModal({ api, modal, content, title, showToast }) {
  async function openRoomRevenueModal(roomId) {
    const targetId = parseInt(roomId, 10);
    if (!targetId || isNaN(targetId)) {
      showToast('معرف الغرفة غير صالح.', 'error');
      return;
    }

    if (modal) {
      modal.style.display = 'flex';
    }

    if (content) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748b;">
          <div class="spinner" style="margin: 0 auto 16px; border: 3px solid #cbd5e1; border-top: 3px solid #1a4332; border-radius: 50%; width: 32px; height: 32px; animation: spin 1s linear infinite;"></div>
          جاري استخراج تقرير إيرادات وحجوزات الغرفة...
        </div>
      `;
    }

    try {
      const res = await api.getRoomRevenue(targetId);
      if (!res || !res.success || !res.data) {
        if (content) {
          content.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #dc2626;">
              ${escapeHtml(res?.error || 'تعذر تحميل بيانات إيرادات الغرفة.')}
            </div>
          `;
        }
        return;
      }

      const rev = res.data;
      const room = rev.room || {};
      const totalExpected = parseFloat(rev.total_expected || 0);
      const totalCollected = parseFloat(rev.total_collected || 0);
      const totalOutstanding = parseFloat(rev.total_outstanding || 0);
      const totalReservations = rev.total_reservations || 0;
      const breakdown = rev.breakdown || [];

      if (title) {
        title.textContent = `تقرير إيرادات غرفة ${room.room_number || ''} (${room.type || ''})`;
      }

      if (content) {
        content.innerHTML = `
          <!-- Room Info Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <h3 style="margin: 0; font-size: 1.4rem; font-weight: 900; color: #1a4332;">غرفة ${escapeHtml(room.room_number)}</h3>
                <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">${escapeHtml(room.type)}</span>
                ${getRoomStatusBadge(room.status)}
              </div>
              <div style="font-size: 0.82rem; color: #64748b; margin-top: 4px;">
                السعر الأساسي: <strong style="color: #a67c52;">${parseFloat(room.price_per_night || 0).toLocaleString()} ريال / ليلة</strong>
                <span style="margin: 0 6px;">|</span>
                إجمالي الحجوزات المسجلة: <strong>${totalReservations}</strong>
              </div>
            </div>
            <div style="text-align: left; font-size: 0.8rem; color: #64748b;">
              تاريخ الاستخراج: <span>${new Date().toLocaleDateString('ar-SA')}</span>
            </div>
          </div>

          <!-- Financial Summary Cards (3 Cards matching Shift Audit) -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
            <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 0.8rem; color: #4338ca; font-weight: 700;">إجمالي متوقع</div>
              <div style="font-size: 1.35rem; font-weight: 900; color: #1e1b4b; margin-top: 4px;">
                ${totalExpected.toLocaleString()} <span style="font-size: 0.75rem;">ريال</span>
              </div>
            </div>

            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 0.8rem; color: #047857; font-weight: 700;">محصّل فعلياً</div>
              <div style="font-size: 1.35rem; font-weight: 900; color: #065f46; margin-top: 4px;">
                ${totalCollected.toLocaleString()} <span style="font-size: 0.75rem;">ريال</span>
              </div>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 0.8rem; color: #b45309; font-weight: 700;">مبالغ لم تحصّل بعد</div>
              <div style="font-size: 1.35rem; font-weight: 900; color: #92400e; margin-top: 4px;">
                ${totalOutstanding.toLocaleString()} <span style="font-size: 0.75rem;">ريال</span>
              </div>
            </div>
          </div>

          <!-- Breakdown Table -->
          <h4 style="font-size: 0.95rem; font-weight: 800; color: #1e1b4b; margin-bottom: 12px;">سجل حجوزات الغرفة والعمليات المالية</h4>
          ${breakdown.length === 0 ? `
            <div style="padding: 30px; text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; color: #64748b; font-size: 0.85rem;">
              لا توجد حجوزات مسجلة لهذه الغرفة حتى الآن.
            </div>
          ` : `
            <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
                <thead style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                  <tr>
                    <th style="padding: 10px 12px; text-align: right; color: #334155;">#</th>
                    <th style="padding: 10px 12px; text-align: right; color: #334155;">اسم النزيل</th>
                    <th style="padding: 10px 12px; text-align: center; color: #334155;">تاريخ الوصول</th>
                    <th style="padding: 10px 12px; text-align: center; color: #334155;">تاريخ المغادرة</th>
                    <th style="padding: 10px 12px; text-align: left; color: #334155;">قيمة الحجز</th>
                    <th style="padding: 10px 12px; text-align: left; color: #334155;">المحصّل</th>
                    <th style="padding: 10px 12px; text-align: left; color: #334155;">المتبقي</th>
                    <th style="padding: 10px 12px; text-align: center; color: #334155;">الحالة</th>
                    <th style="padding: 10px 12px; text-align: center; color: #334155;">نوع الحجز</th>
                  </tr>
                </thead>
                <tbody>
                  ${breakdown.map((r, idx) => {
                    const price = parseFloat(r.total_price || 0);
                    const paid = parseFloat(r.paid_amount || 0);
                    const collected = parseFloat(r.amount_collected || 0);
                    const remaining = Math.max(0, price - paid);
                    const checkOutDisplay = (r.check_out_date === 'مفتوح' || !r.check_out_date)
                      ? '<span style="color: #0284c7; font-weight: 700;">مفتوح</span>'
                      : escapeHtml(r.check_out_date);

                    return `
                      <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 1 ? 'background: #fcfcfc;' : ''}">
                        <td style="padding: 9px 12px; font-weight: 700; color: #64748b;">#${r.id}</td>
                        <td style="padding: 9px 12px; font-weight: 700; color: #0f172a;">${escapeHtml(r.guest_name || 'نزيل')}</td>
                        <td style="padding: 9px 12px; text-align: center; font-family: monospace; color: #334155;">${escapeHtml(r.check_in_date || '-')}</td>
                        <td style="padding: 9px 12px; text-align: center; font-family: monospace; color: #334155;">${checkOutDisplay}</td>
                        <td style="padding: 9px 12px; text-align: left; font-weight: 700; color: #1e1b4b;">${price.toLocaleString()} ريال</td>
                        <td style="padding: 9px 12px; text-align: left; font-weight: 700; color: #059669;">${collected.toLocaleString()} ريال</td>
                        <td style="padding: 9px 12px; text-align: left; font-weight: 700; color: ${remaining > 0 ? '#dc2626' : '#64748b'};">
                          ${remaining > 0 ? `${remaining.toLocaleString()} ريال` : '0 ريال'}
                        </td>
                        <td style="padding: 9px 12px; text-align: center;">${getReservationStatusBadge(r.status)}</td>
                        <td style="padding: 9px 12px; text-align: center;">${getBookingTypeBadge(r.booking_type) || escapeHtml(r.booking_type)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        `;
      }
    } catch (err) {
      console.error('Room revenue error:', err);
      showToast(`خطأ في استخراج إيرادات الغرفة: ${err.message}`, 'error');
    }
  }

  return { openRoomRevenueModal };
}