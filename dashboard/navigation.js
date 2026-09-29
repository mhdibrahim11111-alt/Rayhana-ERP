export function createNavigation({
  navLinks,
  navAdmin,
  navLogs,
  viewSections,
  topbarHeading,
  topbarSubheading,
  getActiveRole,
  showToast,
  loadViews,
  documentRef = document,
  scheduleFrame = callback => requestAnimationFrame(callback)
}) {
  const titleMap = {
    overview: ['ريحانة للوحدات السكنية', 'Rayhana Suites • لوحة التحكم وإدارة العمليات'],
    reservations: ['سجل وإدارة الحجوزات', 'عرض وتتبع جميع الحجوزات المؤكدة والمكتملة والملغاة'],
    rooms: ['إدارة الغرف الفندقية', 'متابعة حالات الإشغال والغرف المتاحة ودورة النظافة'],
    guests: ['دليل وسجل النزلاء', 'Guest Directory • بيانات النزلاء وسجل الإقامات السابقة'],
    admin: ['لوحة الإدارة والمستخدمين', 'Admin Panel • إضافة وتعديل المستخدمين وتعيين الصلاحيات'],
    logs: ['سجل نشاط وحضور الموظفين', 'Employee Logs • متابعة أوقات تسجيل الدخول والخروج لكافة الموظفين']
  };

  function switchView(targetView) {
    const activeRole = getActiveRole();
    if ((targetView === 'admin' || targetView === 'logs') && activeRole !== 'Admin') {
      showToast('Access Denied: Admin privileges required. (عذراً: هذا القسم مخصص لمدير النظام فقط)', 'error');
      targetView = 'overview';
    }

    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === targetView);
    });

    Object.keys(viewSections).forEach(key => {
      const section = viewSections[key];
      if (section) {
        section.style.display = key === targetView ? 'block' : 'none';
      }
    });

    if (titleMap[targetView]) {
      topbarHeading.textContent = titleMap[targetView][0];
      topbarSubheading.textContent = titleMap[targetView][1];
    }

    scheduleFrame(() => {
      const loadView = loadViews[targetView];
      if (loadView) loadView();
    });
  }

  function applyRbacUi(role) {
    const isAdmin = role === 'Admin';
    if (navAdmin) navAdmin.style.display = isAdmin ? 'flex' : 'none';
    if (navLogs) navLogs.style.display = isAdmin ? 'flex' : 'none';

    const adminElements = documentRef.querySelectorAll('.admin-only, [data-role-required="Admin"]');
    adminElements.forEach(element => {
      element.style.display = isAdmin ? '' : 'none';
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const target = link.dataset.section;
      if (target) switchView(target);
    });
  });

  return { switchView, applyRbacUi };
}