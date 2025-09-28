// ========== sheetBuilder.js ==========
// Sheet creation and formatting module

/**
 * Build intake sheet with parsed data
 * @param {string} sheetName - Name for the new sheet
 * @param {Object} parsedData - Object with rows array from jsonParser
 * @returns {Sheet} Created sheet object
 */
function buildIntakeSheet(sheetName, parsedData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Delete sheet if it exists (shouldn't happen with versioning)
  let sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  
  // Create new sheet
  sheet = ss.insertSheet(sheetName);
  
  // Define headers
  const headers = [
    'section_id',
    'section_name',
    'question_id',
    'question',
    'context',
    'type',
    'required',
    'validation',
    'maps_to',
    'default',
    'examples',
    'options'
  ];
  
  // Write headers (row 3 to leave room for metadata)
  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
  
  // Write data rows
  if (parsedData.rows && parsedData.rows.length > 0) {
    sheet.getRange(4, 1, parsedData.rows.length, headers.length).setValues(parsedData.rows);
  }
  
  // Apply formatting
  formatSheet(sheet, parsedData.rows.length);
  
  return sheet;
}

/**
 * Apply formatting to the sheet
 * @param {Sheet} sheet - Sheet to format
 * @param {number} dataRowCount - Number of data rows
 */
function formatSheet(sheet, dataRowCount) {
  // Format header row
  const headerRange = sheet.getRange(3, 1, 1, 12);
  headerRange
    .setBackground('#440DC3')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(11);
  
  // Freeze header row
  sheet.setFrozenRows(3);
  
  // Apply alternating row colors
  for (let i = 4; i <= dataRowCount + 3; i++) {
    if (i % 2 === 0) {
      sheet.getRange(i, 1, 1, 12).setBackground('#F9FAFB');
    } else {
      sheet.getRange(i, 1, 1, 12).setBackground('#FFFFFF');
    }
  }
  
  // Set column widths with min/max constraints
  setColumnWidths(sheet);
  
  // Add borders
  const dataRange = sheet.getRange(3, 1, dataRowCount + 1, 12);
  dataRange.setBorder(
    true, true, true, true, true, true,
    '#E5E7EB', SpreadsheetApp.BorderStyle.SOLID
  );
  
  // Format required column as checkboxes
  if (dataRowCount > 0) {
    const requiredRange = sheet.getRange(4, 7, dataRowCount);
    requiredRange.insertCheckboxes();
  }
}

/**
 * Set optimal column widths
 * @param {Sheet} sheet - Sheet to format
 */
function setColumnWidths(sheet) {
  const widthConfig = [
    { col: 1, width: 120 },  // section_id
    { col: 2, width: 150 },  // section_name
    { col: 3, width: 150 },  // question_id
    { col: 4, width: 350 },  // question
    { col: 5, width: 250 },  // context
    { col: 6, width: 100 },  // type
    { col: 7, width: 80 },   // required
    { col: 8, width: 200 },  // validation
    { col: 9, width: 300 },  // maps_to
    { col: 10, width: 120 }, // default
    { col: 11, width: 200 }, // examples
    { col: 12, width: 200 }  // options
  ];
  
  widthConfig.forEach(config => {
    // Apply min/max constraints (100-500px)
    const width = Math.min(500, Math.max(100, config.width));
    sheet.setColumnWidth(config.col, width);
  });
  
  // Auto-resize to fit content where appropriate
  sheet.autoResizeColumns(1, 12);
}