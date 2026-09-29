import { getPaymentStatusBadge } from './badges.js';
import { escapeHtml, getLocalDateString } from './utils.js';

export function createShiftAuditReport({ api, content, getCurrentUser, formatDateRange, showToast }) {
  async function renderShiftAuditData(startDate, endDate) {
    try {
      const start = startDate || getLocalDateString();
      const end = endDate || start;
      const result = await api.getShiftAuditReport({ startDate: start, endDate: end });
      if (!result || !result.success || !result.data) {
        showToast(result?.error || 'تعذر استخراج تقرير إقفال الوردية.', 'error');
        return;
      }

      const report = result.data;
      const financials = report.financials || {};
      const movements = report.movements || {};
      const rooms = report.rooms || {};
      const transactions = report.transactions || [];
      const printTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const isMultiDay = Boolean(report.isRange || (report.startDate && report.endDate && report.startDate !== report.endDate));
      const periodLabel = formatDateRange(report.startDate, report.endDate);

      content.innerHTML = `
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
                <div style="font-size: 0.76rem; color: #64748b; font-family: monospace;">(${report.startDate} إلى ${report.endDate})</div>
              ` : `
                <div>التاريخ المستهدف: <strong>${report.date}</strong></div>
              `}
              <div>وقت الاستخراج: <span>${printTime}</span></div>
              <div>المشرف المنفذ: <strong>${escapeHtml(getCurrentUser()?.username || 'الإدارة')}</strong></div>
            </div>
          </div>

          <!-- Financial KPIs Grid -->
          <h4 style="font-size: 0.95rem; font-weight: 800; color: #1e1b4b; margin-bottom: 12px;">1. ملخص الإيرادات والمقبوضات المالية حسب وسيلة الدفع</h4>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
            <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 0.78rem; color: #4338ca; font-weight: 700;">إجمالي المقبوضات</div>
              <div style="font-size: 1.25rem; font-weight: 900; color: #1e1b4b; margin-top: 4px;">${parseFloat(financials.totalRevenue || 0).toLocaleString()} <span style="font-size: 0.75rem;">ريال</span></div>
            </div>
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 0.78rem; color: #047857; font-weight: 700;">مقبوضات نقداً (كاش)</div>
              <div style="font-size: 1.25rem; font-weight: 900; color: #065f46; margin-top: 4px;">${parseFloat(financials.cashTotal || 0).toLocaleString()} <span style="font-size: 0.75rem;">ريال</span></div>
            </div>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 0.78rem; color: #1d4ed8; font-weight: 700;">مقبوضات مدى / شبكة</div>
              <div style="font-size: 1.25rem; font-weight: 900; color: #1e40af; margin-top: 4px;">${parseFloat(financials.cardTotal || 0).toLocaleString()} <span style="font-size: 0.75rem;">ريال</span></div>
            </div>
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 0.78rem; color: #b45309; font-weight: 700;">مبالغ لم تحصّل بعد</div>
              <div style="font-size: 1.25rem; font-weight: 900; color: #92400e; margin-top: 4px;">${parseFloat(financials.outstandingTotal || 0).toLocaleString()} <span style="font-size: 0.75rem;">ريال</span></div>
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
                <div style="display: flex; justify-content: space-between;"><span>إجمالي غرف الفندق:</span> <strong>${rooms.totalRooms || 0} غرف</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>الغرف المشغولة حالياً:</span> <strong style="color: #dc2626;">${rooms.occupiedCount || 0}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>الغرف المتاحة حالياً:</span> <strong style="color: #059669;">${rooms.availableCount || 0}</strong></div>
                <div style="display: flex; justify-content: space-between;"><span>الغرف قيد التنظيف:</span> <strong style="color: #d97706;">${rooms.cleaningCount || 0}</strong></div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 4px; font-weight: 800; color: #4338ca;">
                  <span>نسبة الإشغال اللحظية:</span>
                  <span>${rooms.occupancyRate || 0}%</span>
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
                  <strong style="color: #059669;">${movements.checkinsToday || 0}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>${isMultiDay ? 'إجمالي تسجيلات المغادرة في الفترة (Check-outs):' : 'عمليات تسجيل الخروج اليوم (Check-outs):'}</span>
                  <strong style="color: #d97706;">${movements.checkoutsToday || 0}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>${isMultiDay ? 'إجمالي الحجوزات النشطة في الفترة:' : 'إجمالي الحجوزات المنفذة اليوم:'}</span>
                  <strong>${movements.totalReservationsToday || 0}</strong>
                </div>
              </div>
            </div>
          </div>

          ${(isMultiDay && report.dailyBreakdown && report.dailyBreakdown.length > 1) ? `
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
                  ${report.dailyBreakdown.map(day => `
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
          ${transactions.length === 0 ? `
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
                ${transactions.map(transaction => `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px 10px; font-family: monospace; font-weight: 700;">#${transaction.id}</td>
                    <td style="padding: 8px 10px; font-weight: 700;">${escapeHtml(transaction.guest_name)}</td>
                    <td style="padding: 8px 10px;">غرفة ${escapeHtml(transaction.room_number)}</td>
                    <td style="padding: 8px 10px; text-align: center;">${escapeHtml(transaction.payment_method || 'نقداً')}</td>
                    <td style="padding: 8px 10px; text-align: center; font-weight: 700; color: #059669;">${parseFloat(transaction.paid_amount || 0).toLocaleString()} ريال</td>
                    <td style="padding: 8px 10px; text-align: center; color: #701a75;">${parseFloat(transaction.deposit_amount || 0).toLocaleString()} ريال</td>
                    <td style="padding: 8px 10px; text-align: center;">${getPaymentStatusBadge(transaction.payment_status)}</td>
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
    } catch (error) {
      console.error('Shift audit error:', error);
      showToast(`خطأ في تقرير الإقفال: ${error.message}`, 'error');
    }
  }

  return { renderShiftAuditData };
}