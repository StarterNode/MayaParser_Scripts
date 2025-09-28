// ========== main.js ==========
// Entry point functions and orchestration for Maya JSON → Sheets Parser

/**
 * Runs when spreadsheet opens - creates menu
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Maya Parser')
    .addItem('📤 Open Parser', 'showSidebar')
    .addItem('📊 List All Schemas', 'listSchemas')
    .addSeparator()
    .addItem('ℹ️ About', 'showAbout')
    .addToUi();
}

/**
 * Shows the sidebar for JSON upload
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('ui')
    .setTitle('Maya Intake Parser')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Main orchestration - called from UI
 * @param {string} jsonContent - Raw JSON string
 * @param {boolean} forceNewVersion - Create new version even if sheet doesn't exist
 * @returns {Object} Result with success status and details
 */
function processIntakeJSON(jsonContent, forceNewVersion = false) {
  try {
    // Parse JSON
    const intakeData = JSON.parse(jsonContent);
    
    // Validate structure
    if (!intakeData.template_name) {
      throw new Error('Missing template_name in JSON');
    }
    
    if (!intakeData.conversation_flow || !intakeData.conversation_flow.sections) {
      throw new Error('Invalid JSON structure - missing conversation_flow.sections');
    }
    
    // Determine sheet name with versioning
    const sheetName = getVersionedSheetName(intakeData.template_name, forceNewVersion);
    
    // Call jsonParser to flatten data
    const parsedData = flattenIntakeJSON(intakeData);
    
    // Check for duplicate IDs
    const duplicates = checkDuplicateIds(parsedData.rows);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate question IDs found: ${duplicates.join(', ')}`);
    }
    
    // Call sheetBuilder to create sheet
    const sheet = buildIntakeSheet(sheetName, parsedData);
    
    // Call lockManager to protect schema
    lockSchema(sheet);
    
    // Add metadata timestamp
    addMetadata(sheet, intakeData);
    
    return {
      success: true,
      sheetName: sheetName,
      rowCount: rows.length,
      message: `Successfully created ${sheetName} with ${rows.length} questions`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handles versioning for sheet names
 * @param {string} templateName - Base template name
 * @param {boolean} forceNew - Force new version
 * @returns {string} Versioned sheet name
 */
function getVersionedSheetName(templateName, forceNew) {
  const baseName = `Intake_${templateName}`;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!forceNew && !ss.getSheetByName(baseName)) {
    return baseName;
  }
  
  // Find next available version
  let version = 2;
  while (ss.getSheetByName(`${baseName}_v${version}`)) {
    version++;
  }
  
  return `${baseName}_v${version}`;
}

/**
 * Check for duplicate question IDs
 * @param {Array} rows - Parsed data rows
 * @returns {Array} Array of duplicate IDs
 */
function checkDuplicateIds(rows) {
  const ids = rows.map(row => row[2]); // question_id is column 2
  const seen = new Set();
  const duplicates = [];
  
  ids.forEach(id => {
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  });
  
  return [...new Set(duplicates)];
}

/**
 * Add metadata to sheet
 * @param {Sheet} sheet - Target sheet
 * @param {Object} intakeData - Original intake data
 */
function addMetadata(sheet, intakeData) {
  sheet.insertRowBefore(1);
  sheet.insertRowBefore(1);
  
  const metadata = [
    ['METADATA', `Template: ${intakeData.template_name}`, `Version: ${intakeData.template_version || '1.0'}`, `Imported: ${new Date().toLocaleString()}`]
  ];
  
  sheet.getRange(1, 1, 1, 4).setValues(metadata);
  sheet.getRange(1, 1, 1, 4)
    .setBackground('#1a1a1a')
    .setFontColor('#ffffff')
    .setFontSize(10);
}

/**
 * Preview JSON without creating sheet
 * @param {string} jsonContent - Raw JSON string
 * @returns {Object} Preview information
 */
function previewJSON(jsonContent) {
  try {
    const intakeData = JSON.parse(jsonContent);
    const parsedData = flattenIntakeJSON(intakeData);
    const duplicates = checkDuplicateIds(parsedData.rows);
    
    return {
      success: true,
      templateName: intakeData.template_name,
      questionCount: parsedData.rows.length,
      sectionCount: intakeData.conversation_flow.sections.length,
      hasDuplicates: duplicates.length > 0,
      duplicates: duplicates
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * List all schema sheets
 */
function listSchemas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const schemas = sheets
    .map(sheet => sheet.getName())
    .filter(name => name.startsWith('Intake_'));
  
  if (schemas.length === 0) {
    SpreadsheetApp.getUi().alert('No schema sheets found');
    return;
  }
  
  const message = 'Schema Sheets:\n\n' + schemas.join('\n');
  SpreadsheetApp.getUi().alert(message);
}

/**
 * Show about dialog
 */
function showAbout() {
  const message = 'Maya Intake Parser v1.0\n\n' +
    'Converts mayaIntake.json files into structured Google Sheets\n' +
    'for AI consumption and site generation.\n\n' +
    'Part of the StarterNode AI Web Design System';
  
  SpreadsheetApp.getUi().alert('About', message, SpreadsheetApp.getUi().ButtonSet.OK);
}