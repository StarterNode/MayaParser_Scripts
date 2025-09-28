// ========== lockManager.js ==========
// Protects schema sheets from editing

/**
 * Lock schema sheet to prevent modifications
 * @param {Sheet} sheet - Sheet to protect
 */
function lockSchema(sheet) {
  // Create protection
  const protection = sheet.protect();
  
  // Set description
  protection.setDescription('Immutable schema — do not edit');
  
  // Remove all editors (makes it view-only for everyone except owner)
  protection.removeEditors(protection.getEditors());
  
  // Ensure warning is shown when someone tries to edit
  protection.setWarningOnly(false);
  
  // Add visual indicator
  addProtectionIndicator(sheet);
  
  // Lock specific ranges with extra protection
  protectCriticalColumns(sheet);
}

/**
 * Add visual indicator that sheet is protected
 * @param {Sheet} sheet - Protected sheet
 */
function addProtectionIndicator(sheet) {
  // Add protection notice in row 2
  sheet.getRange(2, 1).setValue('🔒 LOCKED SCHEMA');
  sheet.getRange(2, 2).setValue('This sheet is protected and serves as an immutable reference');
  
  // Style the notice
  sheet.getRange(2, 1, 1, 12)
    .setBackground('#FFEBEE')
    .setFontColor('#C62828')
    .setFontWeight('bold')
    .setFontSize(10);
  
  // Merge cells for the message
  sheet.getRange(2, 2, 1, 11).merge();
}

/**
 * Add extra protection to critical columns
 * @param {Sheet} sheet - Sheet to protect
 */
function protectCriticalColumns(sheet) {
  const criticalColumns = [
    { name: 'section_id', col: 1 },
    { name: 'section_name', col: 2 },
    { name: 'question_id', col: 3 },
    { name: 'maps_to', col: 9 }
  ];
  
  criticalColumns.forEach(column => {
    const range = sheet.getRange(3, column.col, sheet.getMaxRows() - 2, 1);
    const protection = range.protect();
    protection.setDescription(`Protected: ${column.name} - DO NOT MODIFY`);
    protection.removeEditors(protection.getEditors());
  });
}

/**
 * Check if a sheet is locked
 * @param {Sheet} sheet - Sheet to check
 * @returns {boolean} True if locked
 */
function isSheetLocked(sheet) {
  const protections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  return protections.length > 0;
}

/**
 * Unlock a schema sheet (for updates/maintenance)
 * @param {Sheet} sheet - Sheet to unlock
 */
function unlockSchema(sheet) {
  // Get all protections on the sheet
  const protections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  
  // Remove each protection
  protections.forEach(protection => {
    protection.remove();
  });
  
  // Get range protections
  const rangeProtections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  rangeProtections.forEach(protection => {
    protection.remove();
  });
  
  // Remove visual indicator
  sheet.getRange(2, 1, 1, 12).clear();
}

/**
 * Create a backup before locking
 * @param {Sheet} sheet - Sheet to backup
 * @returns {Sheet} Backup sheet
 */
function createBackupBeforeLock(sheet) {
  const ss = sheet.getParent();
  const backupName = `${sheet.getName()}_backup_${new Date().getTime()}`;
  
  // Copy the sheet
  const backup = sheet.copyTo(ss);
  backup.setName(backupName);
  
  // Hide the backup
  backup.hideSheet();
  
  return backup;
}