/**
 * ENTERPRISE PAYROLL SYSTEM - CORE ENGINE (API)
 * 
 * Instructions:
 * 1. Copy this code into your Google Apps Script project (e.g., "Code.gs").
 * 2. Ensure this script is bound to your Google Sheet (Extensions > Apps Script).
 * 3. Deploy as a Web App (Execute as "Me", Access "Anyone").
 * 4. NOTE: System setup logic has been moved to "google-apps-script-setup.js".
 */

function getSpreadsheet() {
  try {
    const activeSS = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSS) {
      return activeSS;
    }
  } catch (err) {
    // Falls through to fallback
  }
  
  try {
    const active = SpreadsheetApp.getActive();
    if (active) {
      return active;
    }
  } catch (err) {
    // Falls through to fallback
  }
  
  throw new Error("Could not access Google Spreadsheet. This script must be container-bound to a Google Sheet (Extensions > Apps Script).");
}

function doGet(e) {
  const action = e.parameter.action;
  const accessCode = e.parameter.accessCode;
  
  try {
    const ss = getSpreadsheet();
    
    if (action === 'adminLogin') {
      const email = e.parameter.email;
      const password = e.parameter.password;
      return adminLogin(ss, email, password);
    }
    
    // Allow admin actions if authorized
    if (action === 'getAllEmployees') {
      return getAllEmployees(ss);
    } else if (action === 'getAllSlips') {
      return getAllSlips(ss);
    } else if (action === 'saveEmployee') {
      const emp = JSON.parse(e.parameter.employee);
      return saveEmployee(ss, emp);
    } else if (action === 'deleteEmployee') {
      return deleteEmployee(ss, e.parameter.accessCode);
    } else if (action === 'saveSlip') {
      const slip = JSON.parse(e.parameter.slip);
      return saveSlip(ss, slip, e.parameter.origAccessCode, e.parameter.origMonth, e.parameter.origYear);
    } else if (action === 'deleteSlip') {
      return deleteSlip(ss, e.parameter.accessCode, e.parameter.month, e.parameter.year);
    } else if (action === 'importData') {
      const employees = JSON.parse(e.parameter.employees || '[]');
      const slips = JSON.parse(e.parameter.slips || '[]');
      return importData(ss, employees, slips);
    }
    
    if (!accessCode) {
      return createResponse({ error: 'Access code required' }, 400);
    }
    
    if (action === 'getProfile') {
      return getProfile(ss, accessCode);
    } else if (action === 'getSlips') {
      return getSlips(ss, accessCode);
    } else if (action === 'getPayrollDetails') {
      const month = e.parameter.month;
      const year = e.parameter.year;
      return getPayrollDetails(ss, accessCode, month, year);
    } else if (action === 'getDashboard') {
      const year = parseInt(e.parameter.year || new Date().getFullYear());
      return getDashboard(ss, accessCode, year);
    }
    
    return createResponse({ error: 'Invalid action' }, 400);
  } catch (err) {
    return createResponse({ error: err.message }, 500);
  }
}

function doPost(e) {
  try {
    const ss = getSpreadsheet();
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    if (action === 'saveEmployee') {
      return saveEmployee(ss, postData.employee);
    } else if (action === 'deleteEmployee') {
      return deleteEmployee(ss, postData.accessCode);
    } else if (action === 'saveSlip') {
      return saveSlip(ss, postData.slip, postData.origAccessCode, postData.origMonth, postData.origYear);
    } else if (action === 'deleteSlip') {
      return deleteSlip(ss, postData.accessCode, postData.month, postData.year);
    } else if (action === 'importData') {
      return importData(ss, postData.employees, postData.slips);
    }
    
    return createResponse({ error: 'Invalid post action' }, 400);
  } catch (err) {
    return createResponse({ error: err.message }, 500);
  }
}

function getAllEmployees(ss) {
  const sheet = ss.getSheetByName('MasterData');
  if (!sheet) return createResponse([]);
  const data = sheet.getDataRange().getValues();
  if (data.length === 0 || (data.length === 1 && data[0].length === 0)) {
    return createResponse([]);
  }
  const headers = data[0];
  
  const colIndex = {
    accessCode: headers.indexOf('Access Code'),
    empId: headers.indexOf('Employee ID'),
    name: headers.indexOf('Employee Name'),
    title: headers.indexOf('Job Title'),
    dept: headers.indexOf('Department'),
    joinDate: headers.indexOf('joining Date')
  };
  
  const employees = [];
  for (let i = 1; i < data.length; i++) {
    employees.push({
      accessCode: String(data[i][colIndex.accessCode] || '').trim(),
      employeeId: String(data[i][colIndex.empId] || '').trim(),
      name: String(data[i][colIndex.name] || '').trim(),
      title: String(data[i][colIndex.title] || '').trim(),
      department: String(data[i][colIndex.dept] || '').trim(),
      joiningDate: formatDate(data[i][colIndex.joinDate])
    });
  }
  return createResponse(employees);
}

function getAllSlips(ss) {
  const sheet = ss.getSheetByName('Pay slip');
  if (!sheet) return createResponse([]);
  const data = sheet.getDataRange().getValues();
  if (data.length === 0 || (data.length === 1 && data[0].length === 0)) {
    return createResponse([]);
  }
  const headers = data[0];
  
  const colIndex = {};
  headers.forEach((h, i) => colIndex[h] = i);
  
  const slips = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const earnings = [];
    const deductions = [];
    
    headers.forEach((header, idx) => {
      const val = parseFloat(row[idx] || 0);
      if (header.startsWith('ER_') && val !== 0) {
        earnings.push({
          label: header.replace('ER_', '').replace(/_/g, ' '),
          val: val
        });
      } else if (header.startsWith('DE_') && val !== 0) {
        deductions.push({
          label: header.replace('DE_', '').replace(/_/g, ' '),
          val: val
        });
      }
    });
    
    slips.push({
      accessCode: String(row[colIndex['Access code']] || '').trim(),
      employeeId: String(row[colIndex['Employee id']] || '').trim(),
      employeeName: String(row[colIndex['Employee Name']] || '').trim(),
      month: String(row[colIndex['Month']] || '').trim(),
      year: parseInt(row[colIndex['Year']] || 0),
      amount: parseFloat(row[colIndex['Amount']] || 0),
      paymentDate: formatDate(row[colIndex['Payment Date']]),
      status: String(row[colIndex['Status']] || 'Processed').trim(),
      daysPayable: parseInt(row[colIndex['Days Payable']] || 30),
      comments: String(row[colIndex['Comments']] || '').trim(),
      earnings: earnings,
      deductions: deductions
    });
  }
  
  return createResponse(slips);
}

function saveEmployee(ss, employee) {
  let sheet = ss.getSheetByName('MasterData');
  if (!sheet) {
    sheet = ss.insertSheet('MasterData');
  }
  let data = sheet.getDataRange().getValues();
  if (data.length === 0 || (data.length === 1 && data[0].length === 0)) {
    const defaultHeaders = ['Access Code', 'Employee ID', 'Employee Name', 'Job Title', 'Department', 'joining Date'];
    sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
    data = [defaultHeaders];
  }
  const headers = data[0];
  const colIndex = {
    accessCode: headers.indexOf('Access Code'),
    empId: headers.indexOf('Employee ID'),
    name: headers.indexOf('Employee Name'),
    title: headers.indexOf('Job Title'),
    dept: headers.indexOf('Department'),
    joinDate: headers.indexOf('joining Date')
  };
  
  const accessCode = String(employee.accessCode || '').trim();
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex.accessCode]).trim() === accessCode) {
      foundRow = i + 1;
      break;
    }
  }
  
  const rowValues = [];
  headers.forEach((h, idx) => {
    if (idx === colIndex.accessCode) rowValues.push(employee.accessCode);
    else if (idx === colIndex.empId) rowValues.push(employee.employeeId);
    else if (idx === colIndex.name) rowValues.push(employee.name);
    else if (idx === colIndex.title) rowValues.push(employee.title || '');
    else if (idx === colIndex.dept) rowValues.push(employee.department || '');
    else if (idx === colIndex.joinDate) {
      const parts = (employee.joiningDate || '').split('/');
      if (parts.length === 3) {
        rowValues.push(new Date(parts[2], parts[1] - 1, parts[0]));
      } else {
        rowValues.push(employee.joiningDate || '');
      }
    } else {
      rowValues.push('');
    }
  });
  
  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  
  if (colIndex.joinDate !== -1) {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, colIndex.joinDate + 1, lastRow - 1, 1).setNumberFormat('dd/mm/yyyy');
    }
  }
  SpreadsheetApp.flush();
  return createResponse({ success: true });
}

function deleteEmployee(ss, accessCode) {
  const sheet = ss.getSheetByName('MasterData');
  if (!sheet) return createResponse({ error: 'Sheet "MasterData" not found' }, 404);
  const data = sheet.getDataRange().getValues();
  if (data.length === 0 || (data.length === 1 && data[0].length === 0)) {
    return createResponse({ error: 'Employee not found' }, 404);
  }
  const headers = data[0];
  const colIndex = headers.indexOf('Access Code');
  if (colIndex === -1) return createResponse({ error: 'Access Code column not found' }, 404);
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]).trim() === String(accessCode).trim()) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return createResponse({ success: true });
    }
  }
  return createResponse({ error: 'Employee not found' }, 404);
}

function saveSlip(ss, slip, origAccessCode, origMonth, origYear) {
  let sheet = ss.getSheetByName('Pay slip');
  if (!sheet) {
    sheet = ss.insertSheet('Pay slip');
  }
  
  let lastCol = sheet.getLastColumn();
  let headers;
  if (lastCol === 0) {
    headers = [
      'Access code', 'Employee id', 'Employee Name', 'Month', 'Year', 'Amount', 'Payment Date', 
      'Status', 'Days Payable', 'Comments'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    lastCol = headers.length;
  } else {
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }
  
  let headersChanged = false;
  
  (slip.earnings || []).forEach(function(e) {
    const normLabel = 'ER_' + e.label.trim().replace(/ /g, '_');
    if (headers.indexOf(normLabel) === -1) {
      headers.push(normLabel);
      headersChanged = true;
    }
  });
  
  (slip.deductions || []).forEach(function(d) {
    const normLabel = 'DE_' + d.label.trim().replace(/ /g, '_');
    if (headers.indexOf(normLabel) === -1) {
      headers.push(normLabel);
      headersChanged = true;
    }
  });
  
  if (headersChanged) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  
  const data = sheet.getDataRange().getValues();
  const colIndex = {};
  headers.forEach((h, i) => colIndex[h] = i);
  
  let foundRow = -1;
  const matchCode = String(origAccessCode || slip.accessCode).trim();
  const matchMonth = String(origMonth || slip.month).trim().toLowerCase();
  const matchYear = String(origYear || slip.year).trim();
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row[colIndex['Access code']] !== undefined &&
        String(row[colIndex['Access code']]).trim() === matchCode &&
        String(row[colIndex['Month']]).trim().toLowerCase() === matchMonth &&
        String(row[colIndex['Year']]).trim() === matchYear) {
      foundRow = i + 1;
      break;
    }
  }
  
  const rowValues = [];
  headers.forEach((header) => {
    if (header === 'Access code') rowValues.push(slip.accessCode);
    else if (header === 'Employee id') rowValues.push(slip.employeeId);
    else if (header === 'Employee Name') rowValues.push(slip.employeeName);
    else if (header === 'Month') rowValues.push(slip.month);
    else if (header === 'Year') rowValues.push(parseInt(slip.year));
    else if (header === 'Amount') rowValues.push(parseFloat(slip.amount || 0));
    else if (header === 'Payment Date') {
      const parts = (slip.paymentDate || '').split('/');
      if (parts.length === 3) {
        rowValues.push(new Date(parts[2], parts[1] - 1, parts[0]));
      } else {
        rowValues.push(slip.paymentDate || '');
      }
    }
    else if (header === 'Status') rowValues.push(slip.status);
    else if (header === 'Days Payable') rowValues.push(parseInt(slip.daysPayable || 30));
    else if (header === 'Comments') rowValues.push(slip.comments || '');
    else if (header.startsWith('ER_')) {
      const label = header.replace('ER_', '').replace(/_/g, ' ');
      const earth = (slip.earnings || []).find(e => e.label.toLowerCase() === label.toLowerCase());
      rowValues.push(earth ? parseFloat(earth.val || 0) : 0);
    }
    else if (header.startsWith('DE_')) {
      const label = header.replace('DE_', '').replace(/_/g, ' ');
      const ded = (slip.deductions || []).find(d => d.label.toLowerCase() === label.toLowerCase());
      rowValues.push(ded ? parseFloat(ded.val || 0) : 0);
    }
    else {
      rowValues.push('');
    }
  });
  
  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  
  if (colIndex['Payment Date'] !== undefined) {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, colIndex['Payment Date'] + 1, lastRow - 1, 1).setNumberFormat('dd/mm/yyyy');
    }
  }
  SpreadsheetApp.flush();
  return createResponse({ success: true });
}

function deleteSlip(ss, accessCode, month, year) {
  const sheet = ss.getSheetByName('Pay slip');
  if (!sheet) return createResponse({ error: 'Pay slip sheet not found' }, 404);
  const data = sheet.getDataRange().getValues();
  if (data.length === 0 || (data.length === 1 && data[0].length === 0)) {
    return createResponse({ error: 'Payslip not found' }, 404);
  }
  const headers = data[0];
  const colIndex = {};
  headers.forEach((h, i) => colIndex[h] = i);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row[colIndex['Access code']] !== undefined &&
        String(row[colIndex['Access code']]).trim() === String(accessCode).trim() &&
        String(row[colIndex['Month']]).trim().toLowerCase() === String(month).trim().toLowerCase() &&
        String(row[colIndex['Year']]).trim() === String(year).trim()) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return createResponse({ success: true });
    }
  }
  return createResponse({ error: 'Payslip not found' }, 404);
}

function importData(ss, employees, slips) {
  const masterSheet = ss.getSheetByName('MasterData') || ss.insertSheet('MasterData');
  if (masterSheet && employees && employees.length > 0) {
    masterSheet.clearContents();
    const masterHeaders = ['Access Code', 'Employee ID', 'Employee Name', 'Job Title', 'Department', 'joining Date'];
    masterSheet.getRange(1, 1, 1, masterHeaders.length).setValues([masterHeaders]);
    
    const rows = employees.map(emp => {
      let dVal = emp.joiningDate || '';
      const parts = dVal.split('/');
      if (parts.length === 3) {
        dVal = new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return [
        String(emp.accessCode || '').trim(),
        String(emp.employeeId || '').trim(),
        String(emp.name || '').trim(),
        String(emp.title || '').trim(),
        String(emp.department || '').trim(),
        dVal
      ];
    });
    masterSheet.getRange(2, 1, rows.length, masterHeaders.length).setValues(rows);
    masterSheet.getRange(2, 6, rows.length, 1).setNumberFormat('dd/mm/yyyy');
    SpreadsheetApp.flush();
    masterSheet.autoResizeColumns(1, masterSheet.getLastColumn());
  }
  
  const slipSheet = ss.getSheetByName('Pay slip') || ss.insertSheet('Pay slip');
  if (slipSheet && slips && slips.length > 0) {
    slipSheet.clearContents();
    
    const headers = [
      'Access code', 'Employee id', 'Employee Name', 'Month', 'Year', 'Amount', 'Payment Date', 
      'Status', 'Days Payable', 'Comments'
    ];
    const erKeys = new Set();
    const deKeys = new Set();
    
    slips.forEach(s => {
      (s.earnings || []).forEach(e => erKeys.add(e.label.trim().replace(/ /g, '_')));
      (s.deductions || []).forEach(d => deKeys.add(d.label.trim().replace(/ /g, '_')));
    });
    
    const sortedEr = Array.from(erKeys).sort();
    const sortedDe = Array.from(deKeys).sort();
    
    sortedEr.forEach(k => headers.push('ER_' + k));
    sortedDe.forEach(k => headers.push('DE_' + k));
    
    slipSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    const rows = slips.map(slip => {
      const rowValues = [];
      
      headers.forEach((header) => {
        if (header === 'Access code') rowValues.push(slip.accessCode);
        else if (header === 'Employee id') rowValues.push(slip.employeeId || '');
        else if (header === 'Employee Name') rowValues.push(slip.employeeName || '');
        else if (header === 'Month') rowValues.push(slip.month || '');
        else if (header === 'Year') rowValues.push(parseInt(slip.year || new Date().getFullYear()));
        else if (header === 'Amount') rowValues.push(parseFloat(slip.amount || 0));
        else if (header === 'Payment Date') {
          const parts = (slip.paymentDate || '').split('/');
          if (parts.length === 3) {
            rowValues.push(new Date(parts[2], parts[1] - 1, parts[0]));
          } else {
            rowValues.push(slip.paymentDate || '');
          }
        }
        else if (header === 'Status') rowValues.push(slip.status || 'Processed');
        else if (header === 'Days Payable') rowValues.push(parseInt(slip.daysPayable || 30));
        else if (header === 'Comments') rowValues.push(slip.comments || '');
        else if (header.startsWith('ER_')) {
          const label = header.replace('ER_', '').replace(/_/g, ' ');
          const earth = (slip.earnings || []).find(e => e.label.toLowerCase() === label.toLowerCase());
          rowValues.push(earth ? parseFloat(earth.val || 0) : 0);
        }
        else if (header.startsWith('DE_')) {
          const label = header.replace('DE_', '').replace(/_/g, ' ');
          const ded = (slip.deductions || []).find(d => d.label.toLowerCase() === label.toLowerCase());
          rowValues.push(ded ? parseFloat(ded.val || 0) : 0);
        }
        else {
          rowValues.push('');
        }
      });
      return rowValues;
    });
    
    slipSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    slipSheet.getRange(2, 7, rows.length, 1).setNumberFormat('dd/mm/yyyy');
    SpreadsheetApp.flush();
    slipSheet.autoResizeColumns(1, slipSheet.getLastColumn());
  }
  
  return createResponse({ success: true });
}

function adminLogin(ss, email, password) {
  const sheet = ss.getSheetByName('Admin');
  if (!sheet) {
    return createResponse({ error: 'Sheet named "Admin" not found. Columns are A: Email, B: Password.' }, 404);
  }
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowEmail = String(row[0] || '').trim().toLowerCase();
    const rowPass = String(row[1] || '').trim();
    if (rowEmail === String(email).trim().toLowerCase() && rowPass === String(password).trim()) {
      return createResponse({ success: true, email: rowEmail });
    }
  }
  return createResponse({ success: false, error: 'Invalid admin credentials' }, 401);
}

function formatDate(date) {
  if (!date) return '';
  let d = date;
  if (!(d instanceof Date)) {
    d = new Date(date);
  }
  if (isNaN(d.getTime())) return date;
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getPayrollDetails(ss, accessCode, month, year) {
  const sheet = ss.getSheetByName('Pay slip');
  if (!sheet) return createResponse({ error: 'Details not found' }, 404);
  const data = sheet.getDataRange().getValues();
  if (data.length === 0 || (data.length === 1 && data[0].length === 0)) {
    return createResponse({ error: 'Details not found' }, 404);
  }
  const headers = data[0];
  
  const colIndex = {};
  headers.forEach((h, i) => colIndex[h] = i);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row && row[colIndex['Access code']] == accessCode && row[colIndex['Month']] == month && row[colIndex['Year']] == year) {
      const earnings = [];
      const deductions = [];
      
      headers.forEach((header, idx) => {
        const val = parseFloat(row[idx] || 0);
        if (header.startsWith('ER_') && val !== 0) {
          earnings.push({
            label: header.replace('ER_', '').replace(/_/g, ' '),
            val: val
          });
        } else if (header.startsWith('DE_') && val !== 0) {
          deductions.push({
            label: header.replace('DE_', '').replace(/_/g, ' '),
            val: val
          });
        }
      });
      
      const grossEarnings = earnings.reduce((sum, item) => sum + item.val, 0);
      const totalDeductions = deductions.reduce((sum, item) => sum + item.val, 0);
      
      return createResponse({
        month: month,
        year: parseInt(year),
        netPay: parseFloat(row[colIndex['Amount']] || 0),
        paymentDate: formatDate(row[colIndex['Payment Date']]),
        status: row[colIndex['Status']],
        comments: row[colIndex['Comments']] || '',
        earnings,
        deductions,
        grossEarnings,
        totalDeductions,
        employeeId: row[colIndex['Employee id']],
        employeeName: row[colIndex['Employee Name']] || '',
        daysPayable: row[colIndex['Days Payable']]
      });
    }
  }
  return createResponse({ error: 'Details not found' }, 404);
}

function getProfile(ss, accessCode) {
  const sheet = ss.getSheetByName('MasterData');
  if (!sheet) return createResponse({ error: 'Profile not found' }, 404);
  const data = sheet.getDataRange().getValues();
  if (data.length === 0 || (data.length === 1 && data[0].length === 0)) {
    return createResponse({ error: 'Profile not found' }, 404);
  }
  const headers = data[0];
  
  const colIndex = {
    accessCode: headers.indexOf('Access Code'),
    empId: headers.indexOf('Employee ID'),
    name: headers.indexOf('Employee Name'),
    title: headers.indexOf('Job Title'),
    dept: headers.indexOf('Department'),
    joinDate: headers.indexOf('joining Date')
  };
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIndex.accessCode] == accessCode) {
      return createResponse({
        name: data[i][colIndex.name],
        employeeId: data[i][colIndex.empId],
        department: data[i][colIndex.dept],
        joiningDate: formatDate(data[i][colIndex.joinDate])
      });
    }
  }
  
  return createResponse({ error: 'Profile not found' }, 404);
}

function getSlips(ss, accessCode) {
  const sheet = ss.getSheetByName('Pay slip');
  if (!sheet) return createResponse([]);
  const data = sheet.getDataRange().getValues();
  if (data.length === 0 || (data.length === 1 && data[0].length === 0)) {
    return createResponse([]);
  }
  const headers = data[0];
  
  const colIndex = {
    accessCode: headers.indexOf('Access code'),
    id: headers.indexOf('Employee id'),
    month: headers.indexOf('Month'),
    year: headers.indexOf('Year'),
    amount: headers.indexOf('Amount'),
    status: headers.indexOf('Status'),
    employeeName: headers.indexOf('Employee Name')
  };
  
  const slips = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIndex.accessCode] == accessCode) {
      slips.push({
        id: i.toString(), // Use row index as temp ID
        month: data[i][colIndex.month],
        year: data[i][colIndex.year],
        status: data[i][colIndex.status],
        amount: parseFloat(data[i][colIndex.amount]),
        employeeName: data[i][colIndex.employeeName] || ''
      });
    }
  }
  
  return createResponse(slips.sort((a,b) => b.year - a.year)); // Sort by newest
}

function getDashboard(ss, accessCode, year) {
  const sheet = ss.getSheetByName('Pay slip');
  if (!sheet) return createResponse({ annualNet: 0, availableYears: [] });
  const data = sheet.getDataRange().getValues();
  if (data.length === 0 || (data.length === 1 && data[0].length === 0)) {
    return createResponse({ annualNet: 0, availableYears: [] });
  }
  const headers = data[0];
  
  const colIndex = {
    accessCode: headers.indexOf('Access code'),
    year: headers.indexOf('Year'),
    amount: headers.indexOf('Amount')
  };
  
  let annualNet = 0;
  const years = new Set();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIndex.accessCode] == accessCode) {
      const rowYear = parseInt(data[i][colIndex.year]);
      years.add(rowYear);
      if (rowYear === year) {
        annualNet += parseFloat(data[i][colIndex.amount] || 0);
      }
    }
  }
  
  return createResponse({
    annualNet: annualNet,
    availableYears: Array.from(years).sort((a,b) => b - a)
  });
}

function createResponse(data, code = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
