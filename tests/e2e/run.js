const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { _electron: electron } = require('playwright');

const repoRoot = path.resolve(__dirname, '../..');
const screenshotDirectory = path.join(repoRoot, 'tests', 'screenshots');

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateAfter(days, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

async function waitForView(page, section) {
  await page.waitForFunction(name => {
    const view = document.getElementById(`view-${name}`);
    return view && getComputedStyle(view).display !== 'none';
  }, section);
}

async function navigateToView(page, section) {
  const link = page.locator(`.sidebar-nav .nav-link[data-section="${section}"]`);
  await link.click();
  await waitForView(page, section);
}

async function takeViewScreenshot(page, section) {
  await navigateToView(page, section);
  const screenshotPath = path.join(screenshotDirectory, `${section}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot: ${path.relative(repoRoot, screenshotPath)}`);
}

async function login(page, username, password) {
  await page.locator('#login-form').waitFor({ state: 'visible' });
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.locator('#btn-submit').click();
  await waitForView(page, 'overview');
}

async function waitForFile(filePath, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (!fs.existsSync(filePath) && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.ok(fs.existsSync(filePath), `Expected file was not created: ${filePath}`);
}

async function createReservation(page, { name, phone, nationalId, checkIn, checkOut, paidAmount }) {
  await navigateToView(page, 'overview');
  await page.locator('#btn-open-new-reservation-modal').click();
  await page.locator('#reservation-form').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelectorAll('#room-select option[value]:not([value=""])').length > 0);
  const roomOptions = await page.locator('#room-select option').evaluateAll(options => options.filter(option => option.value).map(option => option.value));
  assert.ok(roomOptions.length > 0, 'No room options loaded in reservation form');

  await page.locator('#guest-name').fill(name);
  await page.locator('#guest-phone').fill(phone);
  await page.locator('#guest-id-number').fill(nationalId);
  await page.locator('#booking-type').selectOption('عادي');
  await page.locator('#room-select').selectOption(roomOptions[0]);
  await page.locator('#check-in-date').fill(checkIn);
  await page.locator('#check-out-date').fill(checkOut);
  await page.locator('#total-price').fill('250');
  await page.locator('#paid-amount').fill(String(paidAmount));
  await page.locator('#deposit-amount').fill('0');
  await page.locator('#reservation-form button[type="submit"]').click();
  await page.waitForFunction(() => {
    const modal = document.getElementById('new-reservation-modal');
    return modal && getComputedStyle(modal).display === 'none';
  });
  console.log(`Created reservation for ${name}`);
}

async function confirmDialog(page) {
  await page.locator('#app-confirm-modal').waitFor({ state: 'visible' });
  await page.locator('#btn-modal-confirm').click();
}

async function run() {
  fs.mkdirSync(screenshotDirectory, { recursive: true });
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rayhana-e2e-'));
  const pageErrors = [];
  let electronApp;

  try {
    const userData = path.join(temporaryRoot, 'userData');
    const oneDrive = path.join(temporaryRoot, 'OneDrive');
    const environment = {
      ...process.env,
      HOME: temporaryRoot,
      XDG_CONFIG_HOME: path.join(temporaryRoot, 'xdg-config'),
      RAYHANA_E2E_ROOT: temporaryRoot,
      RAYHANA_E2E_USER_DATA: userData,
      RAYHANA_REPO_ROOT: repoRoot,
      OneDrive: oneDrive,
      OneDriveConsumer: oneDrive,
      ELECTRON_DISABLE_SECURITY_WARNINGS: '1'
    };
    delete environment.ELECTRON_RUN_AS_NODE;

    const electronExecutable = require('electron');
    const executableCheck = spawnSync(electronExecutable, ['--version'], {
      cwd: repoRoot,
      env: environment,
      encoding: 'utf8'
    });
    if (executableCheck.status !== 0) {
      const details = executableCheck.error?.message || `${executableCheck.stdout || ''}${executableCheck.stderr || ''}`.trim();
      throw new Error(`Electron cannot start in this environment:\n${details}`);
    }
    console.log(`Electron ${executableCheck.stdout.trim()}`);

    electronApp = await electron.launch({
      args: ['--no-sandbox', '--headless=new', '--disable-gpu', path.join(repoRoot, 'tests/e2e/electron-bootstrap.js')],
      cwd: repoRoot,
      env: environment,
      timeout: 60000
    });

    const appPaths = await electronApp.evaluate(({ app }) => ({
      userData: app.getPath('userData'),
      appData: app.getPath('appData'),
      documents: app.getPath('documents')
    }));
    assert.ok(appPaths.userData.startsWith(temporaryRoot), `userData escaped temp root: ${appPaths.userData}`);
    assert.ok(appPaths.appData.startsWith(temporaryRoot), `appData escaped temp root: ${appPaths.appData}`);
    assert.ok(appPaths.documents.startsWith(temporaryRoot), `Documents escaped temp root: ${appPaths.documents}`);
    console.log(`Temporary userData: ${appPaths.userData}`);

    const page = await electronApp.firstWindow();
    page.setDefaultTimeout(20000);
    page.on('console', message => {
      if (message.type() === 'error') pageErrors.push(`console: ${message.text()}`);
    });
    page.on('pageerror', error => pageErrors.push(`pageerror: ${error.stack || error.message}`));

    await login(page, 'admin', 'admin');
    const appInfo = await page.evaluate(async () => window.api.getAppInfo());
    assert.ok(appInfo.dbPath.startsWith(appPaths.userData), `database escaped temp userData: ${appInfo.dbPath}`);
    assert.ok(fs.existsSync(appInfo.dbPath), 'Temporary app database was not created');
    console.log(`Temporary database: ${appInfo.dbPath}`);

    await page.waitForFunction(() => {
      if (typeof Chart === 'undefined') return false;
      const revenue = Chart.getChart(document.getElementById('monthly-revenue-chart'));
      const rooms = Chart.getChart(document.getElementById('room-status-chart'));
      return Boolean(revenue && rooms);
    });
    console.log('Overview charts rendered');

    for (const section of ['overview', 'reservations', 'rooms', 'guests', 'admin', 'logs']) {
      await takeViewScreenshot(page, section);
    }

    const today = formatDate(new Date());
    const tomorrow = dateAfter(1);
    await createReservation(page, {
      name: 'E2E Admin Guest',
      phone: '0509000001',
      nationalId: '1099000001',
      checkIn: today,
      checkOut: tomorrow,
      paidAmount: 50
    });

    await navigateToView(page, 'reservations');
    await page.locator('#search-all-reservations').fill('E2E Admin Guest');
    const firstReservationRow = page.locator('#all-reservations-table-body tr').filter({ hasText: 'E2E Admin Guest' }).first();
    await firstReservationRow.waitFor({ state: 'visible' });

    await firstReservationRow.locator('button[data-action="add-payment"]').click();
    await page.locator('#add-payment-modal').waitFor({ state: 'visible' });
    await page.locator('#payment-new-amount').fill('25');
    await page.locator('#btn-save-payment').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('add-payment-modal')).display === 'none');
    console.log('Added reservation payment');

    const refreshedReservationRow = page.locator('#all-reservations-table-body tr').filter({ hasText: 'E2E Admin Guest' }).first();
    await refreshedReservationRow.waitFor({ state: 'visible' });
    await refreshedReservationRow.locator('button[data-action="extend"]').click();
    await page.locator('#extend-stay-modal').waitFor({ state: 'visible' });
    const oldCheckout = await page.locator('#extend-current-checkout-preview').textContent();
    await page.locator('#extend-new-checkout-date').fill(dateAfter(1, new Date(`${oldCheckout.trim()}T00:00:00`)));
    await page.locator('#extend-collect-now-toggle').uncheck();
    await page.locator('#extend-stay-form button[type="submit"]').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('extend-stay-modal')).display === 'none');
    console.log('Extended reservation');

    const extendedReservationRow = page.locator('#all-reservations-table-body tr').filter({ hasText: 'E2E Admin Guest' }).first();
    await extendedReservationRow.waitFor({ state: 'visible' });
    await extendedReservationRow.locator('button[data-action="checkout"]').click();
    await page.locator('#open-contract-settle-modal').waitFor({ state: 'visible' });
    await page.locator('#btn-confirm-settle-checkout').click();
    await page.waitForFunction(() => getComputedStyle(document.getElementById('open-contract-settle-modal')).display === 'none');
    await page.locator('#invoice-modal').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('#btn-close-invoice-modal').click();
    console.log('Checked out reservation');

    await createReservation(page, {
      name: 'E2E Cancel Guest',
      phone: '0509000002',
      nationalId: '1099000002',
      checkIn: dateAfter(30),
      checkOut: dateAfter(31),
      paidAmount: 25
    });
    await navigateToView(page, 'reservations');
    await page.locator('#search-all-reservations').fill('E2E Cancel Guest');
    const cancelRow = page.locator('#all-reservations-table-body tr').filter({ hasText: 'E2E Cancel Guest' }).first();
    await cancelRow.waitFor({ state: 'visible' });
    await cancelRow.locator('button[data-action="cancel"]').click();
    await confirmDialog(page);
    await cancelRow.waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
    console.log('Cancelled future reservation');

    await navigateToView(page, 'guests');
    await page.locator('#search-guests').fill('E2E Cancel Guest');
    const guestRow = page.locator('#guests-table-body tr').filter({ hasText: 'E2E Cancel Guest' }).first();
    await guestRow.waitFor({ state: 'visible' });
    await guestRow.locator('button[data-action="toggle-ban-guest"]').click();
    await confirmDialog(page);
    await page.locator('#guests-table-body tr').filter({ hasText: 'E2E Cancel Guest' }).locator('button[data-action="toggle-ban-guest"][data-banned="1"]').waitFor({ state: 'visible' });
    console.log('Searched for and banned guest');

    const csvPath = path.join(temporaryRoot, 'guests-import.csv');
    fs.writeFileSync(csvPath, 'name,phone,id_number\nImported E2E Guest,0509000003,1099000003\n');
    await page.locator('#input-import-guests-excel').setInputFiles(csvPath);
    await page.locator('#import-result-modal').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#btn-confirm-import-result').click();
    await page.locator('#search-guests').fill('Imported E2E Guest');
    await page.locator('#guests-table-body tr').filter({ hasText: 'Imported E2E Guest' }).waitFor({ state: 'visible' });
    console.log('Imported guest CSV');

    await navigateToView(page, 'rooms');
    const availableRoom = await page.locator('#rooms-grid-container .room-status-select').evaluateAll(selects => {
      const select = selects.find(item => item.value === 'متاحة');
      return select ? select.dataset.roomId : null;
    });
    assert.ok(availableRoom, 'No available room status selector for E2E change');
    await page.locator(`#rooms-grid-container .room-status-select[data-room-id="${availableRoom}"]`).selectOption('تنظيف');
    await page.waitForFunction(roomId => {
      const select = document.querySelector(`#rooms-grid-container .room-status-select[data-room-id="${roomId}"]`);
      return select && select.value === 'تنظيف';
    }, availableRoom);
    console.log('Changed room status');

    await page.locator('#btn-open-shift-audit').click();
    await page.locator('#shift-audit-modal').waitFor({ state: 'visible' });
    await page.locator('#shift-audit-content').getByText(/تقرير الإقفال/).waitFor({ state: 'visible' });
    await page.locator('#btn-close-shift-audit').click();
    console.log('Opened shift audit');

    await page.locator('#btn-backup-db').click();
    const manualBackupPath = path.join(temporaryRoot, 'manual-backup.sqlite');
    await waitForFile(manualBackupPath);
    assert.ok(fs.statSync(manualBackupPath).size > 0, 'Manual backup file is empty');
    console.log(`Backup saved: ${manualBackupPath}`);

    await page.locator('#btn-logout').click();
    await page.locator('#logout-confirm-modal').waitFor({ state: 'visible' });
    await page.locator('#btn-confirm-logout').click();
    await page.locator('#login-form').waitFor({ state: 'visible' });
    await login(page, 'user', 'user');
    assert.equal(await page.locator('#nav-admin').isVisible(), false, 'User role should not see Admin');
    assert.equal(await page.locator('#nav-logs').isVisible(), false, 'User role should not see Logs');
    console.log('User login RBAC passed');

    assert.deepEqual(pageErrors, [], `Renderer console/page errors:\n${pageErrors.join('\n')}`);
    console.log('No console errors or uncaught page errors');
    console.log(`E2E flows passed. Screenshots saved in ${path.relative(repoRoot, screenshotDirectory)}/`);
  } finally {
    if (electronApp) await electronApp.close();
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
