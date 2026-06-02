/**
 * ENTERPRISE PAYROLL SYSTEM - SETUP & MAINTENANCE
 * 
 * Instructions:
 * 1. Copy this code into a new file in your Google Apps Script project (e.g., "Setup.gs").
 * 2. This file handles the spreadsheet initialization and menu creation.
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 Enterprise Payroll')
    .addItem('Initialize System', 'setup')
    .addSeparator()
    .addItem('View Documentation', 'showExplanation')
    .addToUi();
}

/**
 * Utility to capitalize first character and handle spaces
 */
function toTitleCase(str) {
  if (!str) return '';
  return str.toString().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

function showExplanation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let expSheet = ss.getSheetByName('Explanation');
  if (expSheet) expSheet.activate();
}

/**
 * Initializes the spreadsheet with necessary sheets and mockup data
 */
function setup() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '⚠️ Permanent Data Loss Warning',
    'If you do this, your current data will be deleted permanently and replaced with mockup data. Are you sure you want to continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return; // User cancelled
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Setup MasterData
  let masterSheet = ss.getSheetByName('MasterData');
  if (!masterSheet) {
    masterSheet = ss.insertSheet('MasterData');
  } else {
    masterSheet.clear();
    masterSheet.clearConditionalFormatRules();
  }
  const masterHeaders = ['Access Code', 'Employee ID', 'Employee Name', 'Job Title', 'Department', 'joining Date'];
  masterSheet.getRange(1, 1, 1, masterHeaders.length)
    .setValues([masterHeaders])
    .setFontWeight('bold')
    .setBackground('#f3f3f3')
    .setHorizontalAlignment('center');
  
  const masterData = [
    ['1234', 'ARC001', toTitleCase('alexander sterling'), toTitleCase('principal architect'), toTitleCase('technology'), new Date(2022, 0, 12)],
    ['5678', 'MNG042', toTitleCase('elizabeth vance'), toTitleCase('hr business partner'), toTitleCase('human resources'), new Date(2023, 2, 5)],
    ['9012', 'FIN088', toTitleCase('marcus aurelius'), toTitleCase('financial controller'), toTitleCase('finance'), new Date(2021, 8, 15)],
    ['3456', 'OPS202', toTitleCase('sarah silverstone'), toTitleCase('operations director'), toTitleCase('operations'), new Date(2024, 5, 20)],
    ['1122', 'ENG303', toTitleCase('julian casablancas'), toTitleCase('lead engineer'), toTitleCase('engineering'), new Date(2023, 9, 10)],
    ['3344', 'DES404', toTitleCase('fiona apple'), toTitleCase('senior product designer'), toTitleCase('design'), new Date(2023, 1, 14)]
  ];
  masterSheet.getRange(2, 1, masterData.length, masterHeaders.length).setValues(masterData);
  const masterRange = masterSheet.getRange(1, 1, masterData.length + 1, masterHeaders.length);
  masterRange.setVerticalAlignment('middle');
  
  // Apply specific alignment (All Left-Aligned as requested)
  masterSheet.getRange(1, 1, masterData.length + 1, masterHeaders.length)
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');
  masterSheet.getRange(1, 1, 1, masterHeaders.length).setFontWeight('bold').setBackground('#f3f3f3');

  masterSheet.getRange(2, 6, masterData.length, 1).setNumberFormat('dd/mm/yyyy');
  masterSheet.setFrozenRows(1);
  
  // Auto-resize all columns to fit content
  SpreadsheetApp.flush();
  masterSheet.autoResizeColumns(1, masterSheet.getLastColumn());

  // Add Data Validation for Dates in MasterData
  const masterDateRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(F2<>"", NOT(ISDATE(F2)))')
    .setBackground('#ffcccc')
    .setFontColor('#990000')
    .setRanges([masterSheet.getRange('F2:F1000')])
    .build();
  const masterRules = masterSheet.getConditionalFormatRules();
  masterRules.push(masterDateRule);
  masterSheet.setConditionalFormatRules(masterRules);

  // 2. Setup Pay slip
  let slipSheet = ss.getSheetByName('Pay slip');
  if (!slipSheet) {
    slipSheet = ss.insertSheet('Pay slip');
  } else {
    slipSheet.clear();
    slipSheet.clearConditionalFormatRules();
  }
  const slipHeaders = [
    'Access code', 'Employee id', 'Employee Name', 'Month', 'Year', 'Amount', 'Payment Date', 
    'Status', 'Days Payable', 'Comments', 
    'ER_Basic_Salary', 'ER_House_Rent', 'ER_Transport', 'ER_Performance_Bonus',
    'DE_Income_Tax', 'DE_Social_Security', 'DE_Medical_Insurance'
  ];
  slipSheet.getRange(1, 1, 1, slipHeaders.length)
    .setValues([slipHeaders])
    .setFontWeight('bold')
    .setBackground('#f3f3f3')
    .setHorizontalAlignment('center');
  
  const slipData = [
    ['1234', 'ARC001', 'Alexander Sterling', toTitleCase('march'), 2026, 9450, new Date(2026, 2, 1), toTitleCase('processed'), 30, 'Excellent delivery on Project Phoenix.\nKeep up the high standard of architecture work.', 7500, 1500, 500, 1000, 600, 300, 150],
    ['1234', 'ARC001', 'Alexander Sterling', toTitleCase('february'), 2026, 8400, new Date(2026, 1, 1), toTitleCase('processed'), 28, 'Monthly routine statement.', 7500, 1500, 500, 0, 550, 400, 150],
    ['5678', 'MNG042', 'Elizabeth Vance', toTitleCase('march'), 2026, 7200, new Date(2026, 2, 1), toTitleCase('processed'), 30, 'Adjustment for annual leave carried over.', 6000, 1000, 500, 500, 450, 250, 100],
    ['9012', 'FIN088', 'Marcus Aurelius', toTitleCase('march'), 2026, 8800, new Date(2026, 2, 1), toTitleCase('under review'), 30, 'Pending final audit approval for quarterly audit bonus.', 7000, 1500, 500, 800, 600, 300, 100],
    ['1122', 'ENG303', 'Julian Casablancas', toTitleCase('march'), 2026, 6500, new Date(2026, 2, 1), toTitleCase('processed'), 30, 'Welcome to the team! Pro-rated bonus applied.', 5500, 500, 500, 500, 300, 150, 50],
    ['3344', 'DES404', 'Fiona Apple', toTitleCase('march'), 2026, 8200, new Date(2026, 2, 1), toTitleCase('processed'), 30, 'Design system MVP successfully launched.', 6500, 1200, 500, 500, 500, 200, 100]
  ];
  slipSheet.getRange(2, 1, slipData.length, slipHeaders.length).setValues(slipData);
  const slipRange = slipSheet.getRange(1, 1, slipData.length + 1, slipHeaders.length);
  slipRange.setVerticalAlignment('middle');

  // Apply specific alignment (All Left-Aligned as requested)
  slipSheet.getRange(1, 1, slipData.length + 1, slipHeaders.length)
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');
  slipSheet.getRange(1, 1, 1, slipHeaders.length).setFontWeight('bold').setBackground('#f3f3f3');

  slipSheet.getRange(2, 7, slipData.length, 1).setNumberFormat('dd/mm/yyyy');
  slipSheet.setFrozenRows(1);
  
  // Auto-resize all columns to fit content
  SpreadsheetApp.flush();
  slipSheet.autoResizeColumns(1, slipSheet.getLastColumn());

  // Add Data Validation for Dates in Pay slip
  const slipDateRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(G2<>"", NOT(ISDATE(G2)))')
    .setBackground('#ffcccc')
    .setFontColor('#990000')
    .setRanges([slipSheet.getRange('G2:G5000')])
    .build();

  // Add Amount Verification Rule (Highlight row if Amount != ER - DE)
  const slipAmountRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($F2<>"", ROUND($F2, 2) <> ROUND(SUMIF($K$1:$Z$1, "ER_*", $K2:$Z2) - SUMIF($K$1:$Z$1, "DE_*", $K2:$Z2), 2))')
    .setBackground('#fff7ed')
    .setFontColor('#c2410c')
    .setRanges([slipSheet.getRange(2, 1, 5000, slipHeaders.length)])
    .build();

  // Add Status "Under Review" Rule (Highlight row in light yellow)
  const slipStatusRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=LOWER($H2)="under review"')
    .setBackground('#fefce8')
    .setFontColor('#a16207')
    .setRanges([slipSheet.getRange(2, 1, 5000, slipHeaders.length)])
    .build();

  const slipRules = slipSheet.getConditionalFormatRules();
  slipRules.push(slipDateRule);
  slipRules.push(slipAmountRule);
  slipRules.push(slipStatusRule);
  slipSheet.setConditionalFormatRules(slipRules);

  // 3. Setup Admin accounts
  let adminSheet = ss.getSheetByName('Admin');
  if (!adminSheet) {
    adminSheet = ss.insertSheet('Admin');
  } else {
    adminSheet.clear();
  }
  const adminHeaders = ['Email', 'Password'];
  adminSheet.getRange(1, 1, 1, adminHeaders.length)
    .setValues([adminHeaders])
    .setFontWeight('bold')
    .setBackground('#f3f3f3')
    .setHorizontalAlignment('left');
  
  const adminData = [
    ['admin@enterprise.com', 'admin123'],
    ['hr@enterprise.com', 'hrpass456']
  ];
  adminSheet.getRange(2, 1, adminData.length, adminHeaders.length).setValues(adminData);
  adminSheet.getRange(1, 1, adminData.length + 1, adminHeaders.length).setVerticalAlignment('middle').setHorizontalAlignment('left');
  SpreadsheetApp.flush();
  adminSheet.autoResizeColumns(1, adminSheet.getLastColumn());

  // 4. Setup Explanation
  let expSheet = ss.getSheetByName('Explanation');
  if (!expSheet) {
    expSheet = ss.insertSheet('Explanation');
  }
  expSheet.clear();
  const expData = [
    ['💎 ENTERPRISE PAYROLL SYSTEM DOCUMENTATION'],
    [''],
    ['1. EMPLOYEE MANAGEMENT (MasterData Sheet)'],
    ['   • Access Code: A unique code of 4 or more characters (numbers and special characters allowed) used by employees for app authentication.'],
    ['   • Employee ID: Unique corporate identifier (e.g., ARC001).'],
    ['   • joining Date: MUST be a valid date entry (use DD/MM/YYYY formatting).'],
    [''],
    ['2. PAYSLIP DATA (Pay slip Sheet)'],
    ['   • DYNAMIC HEADERS (PRO FEATURE):'],
    ['     - Earnings: Any column starting with "ER_" (e.g., ER_Bonus) will be added to total earnings.'],
    ['     - Deductions: Any column starting with "DE_" (e.g., DE_Tax) will be subtracted.'],
    ['     - Presentation: The app automatically converts underscores to spaces (ER_Basic_Salary -> Basic Salary).'],
    ['   • TRANSACTION ENTRIES:'],
    ['     - Status: Use "PROCESSED" for final slips and "UNDER REVIEW" for drafts.'],
    ['     - Amount: Enter the final Net Pay value in this column.'],
    ['     - Comments: Detailed notes for the employee. Supports multi-line (Alt+Enter).'],
    [''],
    ['3. SYSTEM INTEGRATION & DEPLOYMENT'],
    ['   • Deployment Process:'],
    ['     1. Click "Deploy" button (top-right) > "New Deployment".'],
    ['     2. Select Type: "Web App".'],
    ['     3. Execute as: "Me" (Your Email).'],
    ['     4. Who has access: "Anyone".'],
    ['     5. Copy the Web App URL.'],
    ['   • Connecting the App:'],
    ['     - Send the copied URL to your system administrator, who will configure the app settings on your behalf.'],
    [''],
    ['4. MOBILE (ADD TO HOME SCREEN)'],
    ['     - iOS: Open link in Safari > Tap "Share" icon (square with arrow) > Tap "Add to Home Screen".'],
    ['     - Android: Open link in Chrome > Tap three-dot menu > Tap "Add to Home screen" or "Install app".'],
    ['     - AUTO-LOGIN: Use [App URL]/?ref=[AccessCode] for one-tap access (e.g. https://app.link/?ref=1234).'],
    [''],
    ['⚠️ IMPORTANT: Incorrect date formats in columns F (MasterData) and G (Pay slip) will be highlighted in RED.'],
    ['⚠️ IMPORTANT: If the value in the "Amount" column does not match (ER minus DE), the row will be highlighted in ORANGE.'],
    ['⚠️ IMPORTANT: Rows with "UNDER REVIEW" status will be highlighted in YELLOW.'],
    [''],
    ['© 2026 Enterprise Payroll Solutions | v2.3.0']
  ];
  
  expSheet.getRange(1, 1, expData.length, 1).setValues(expData);
  
  // Advanced Formatting for Explanation Sheet
  expSheet.getRange(1, 1).setFontSize(18).setFontWeight('bold').setFontColor('#003d9b');
  expSheet.getRange(3, 1).setFontWeight('bold').setBackground('#f1f3ff').setFontSize(11);
  expSheet.getRange(8, 1).setFontWeight('bold').setBackground('#f1f3ff').setFontSize(11);
  expSheet.getRange(18, 1).setFontWeight('bold').setBackground('#f1f3ff').setFontSize(11);
  expSheet.getRange(28, 1).setFontWeight('bold').setBackground('#f1f3ff').setFontSize(11);
  expSheet.getRange(33, 1).setFontWeight('bold').setFontColor('#b91c1c').setFontSize(10);
  expSheet.getRange(34, 1).setFontWeight('bold').setFontColor('#c2410c').setFontSize(10);
  expSheet.getRange(35, 1).setFontWeight('bold').setFontColor('#a16207').setFontSize(10);
  
  // Auto-resize documentation column
  SpreadsheetApp.flush();
  expSheet.autoResizeColumn(1);
  expSheet.setHiddenGridlines(true);

  // Tidy up: Remove empty columns and extra rows to make it look like a clean document
  const maxCols = expSheet.getMaxColumns();
  if (maxCols > 1) {
    expSheet.deleteColumns(2, maxCols - 1);
  }
  const maxRows = expSheet.getMaxRows();
  if (maxRows > expData.length) {
    expSheet.deleteRows(expData.length + 1, maxRows - expData.length);
  }

  // Final Workbook-wide Auto-Fit
  SpreadsheetApp.flush();
  ss.getSheets().forEach(sheet => {
    const lastCol = sheet.getLastColumn();
    if (lastCol > 0) {
      sheet.autoResizeColumns(1, lastCol);
    }
  });

  // Focus the explanation sheet
  expSheet.activate();
  SpreadsheetApp.getUi().alert('Welcome to Enterprise Payroll System!\n\nSystem initialized successfully.\n\nFirst Steps:\n1. Open the "MasterData" sheet to add your employees.\n2. Open the "Pay slip" sheet to add monthly salary details.\n3. Refer to the "Explanation" sheet for deployment instructions.');
}
