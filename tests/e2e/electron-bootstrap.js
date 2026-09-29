const fs = require('node:fs');
const path = require('node:path');
const { app, dialog } = require('electron');

const testRoot = process.env.RAYHANA_E2E_ROOT;
if (!testRoot || !path.isAbsolute(testRoot)) {
  throw new Error('RAYHANA_E2E_ROOT must be an absolute temporary directory.');
}

const appDataPath = path.join(testRoot, 'appData');
const userDataPath = path.join(testRoot, 'userData');
const documentsPath = path.join(testRoot, 'Documents');
const oneDrivePath = path.join(testRoot, 'OneDrive');

for (const directory of [appDataPath, userDataPath, documentsPath, oneDrivePath]) {
  fs.mkdirSync(directory, { recursive: true });
}

app.setPath('appData', appDataPath);
app.setPath('userData', userDataPath);
app.setPath('documents', documentsPath);
process.env.OneDrive = oneDrivePath;
process.env.OneDriveConsumer = oneDrivePath;

dialog.showSaveDialog = async () => ({
  canceled: false,
  filePath: path.join(testRoot, 'manual-backup.sqlite')
});
dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] });

require(path.join(process.env.RAYHANA_REPO_ROOT, 'main.js'));
