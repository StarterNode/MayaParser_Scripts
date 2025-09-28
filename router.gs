// ========== router.gs ==========
// REMINDER: Google Apps Script Architecture
// This file exists to document how GAS works - no actual code needed here

/**
 * HOW GOOGLE APPS SCRIPT ROUTING WORKS:
 * 
 * 1. ALL .gs files are loaded globally - there's no module system
 * 2. ALL top-level functions are accessible from anywhere
 * 3. Functions called from HTML via google.script.run must be global
 * 4. File names are just for organization - not for imports
 * 
 * FILE NAMING:
 * - Use .gs extension (not .js) when creating files in Apps Script editor
 * - HTML files keep .html extension
 * 
 * FUNCTION VISIBILITY:
 * - main.gs functions like processIntakeJSON() are callable from ui.html
 * - jsonParser.gs functions like flattenIntakeJSON() are callable from main.gs
 * - No need for exports/imports - everything is global
 * 
 * EXECUTION FLOW:
 * 1. User clicks menu → onOpen() in main.gs
 * 2. Shows sidebar → showSidebar() loads ui.html
 * 3. User uploads JSON → ui.html calls processIntakeJSON()
 * 4. processIntakeJSON() orchestrates:
 *    - flattenIntakeJSON() from jsonParser.gs
 *    - buildIntakeSheet() from sheetBuilder.gs
 *    - lockSchema() from lockManager.gs
 * 
 * DATA FLOW:
 * JSON file → parsedData object → rows array → Google Sheet
 * 
 * REMEMBER:
 * - No Node.js features (no require, import, export)
 * - No npm packages
 * - Built-in Google services via SpreadsheetApp, HtmlService, etc.
 * - All code runs on Google's servers, not locally
 */