# 💎 Enterprise Payroll System - Employee Salary Portal

A professional, mobile-first payroll management system built for transparency and efficiency. This platform allows employees to securely access their monthly payslips, track their annual earnings, and view detailed breakdowns of their compensation packages.

## 🚀 Key Features

### 👤 Employee Dashboard
- **Secure Authentication:** Access protected by unique employee access codes.
- **Annual Summary:** Real-time calculation of annual net pay and earnings trends.
- **Payment History:** Chronological list of all processed payslips with quick status indicators.

### 📄 Comprehensive Payslips
- **Detailed Breakdowns:** Full transparency on all earnings (Basic, HRA, Transport, etc.) and deductions (Tax, Insurance, etc.).
- **Dynamic Headers:** Supports custom earnings (`ER_`) and deductions (`DE_`) defined directly in the spreadsheet headers.
- **Official Status:** Real-time visibility into whether a payslip is "Processed" or "Under Review".
- **Professional Formatting:** Clean, printable layouts with mobile-optimized typography.

### 📊 Powerful Spreadsheet Backend
- **Google Sheets Integration:** No complex database setups required; manage everything via a familiar spreadsheet interface.
- **Automatic Calculations:** Built-in validation to ensure "Net Pay" matches the sum of earnings and deductions.
- **Conditional Formatting:** Visual alerts for incorrect date formats, status changes, and calculation mismatches.
- **Automated Setup:** One-click initialization script to create the entire sheet structure and mockup data.

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS (Modern UI/UX)
- **Animations:** Framer Motion
- **Backend:** Google Apps Script (Serverless API)
- **Database:** Google Sheets

## ⚙️ Installation & Setup

### 1. Spreadsheet Initialization (Backend)
1. Create a new Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Copy the content of `google-apps-script.js` and `google-apps-script-setup.js` into your Apps Script project.
4. Save the project and refresh the Google Sheet.
5. A new menu **🚀 Enterprise Payroll** will appear. Click **Initialize System**.
6. **Deploy** your script as a **Web App**:
   - Execute as: `Me`
   - Who has access: `Anyone`
7. Copy the generated **Web App URL**.

### 2. Frontend Configuration
1. In the Apps Script URL generated above, ensure your frontend is calling this endpoint.
2. If using the provided dashboard, ensure the API URL is correctly set in your environment variables or service configuration.

## 📁 Spreadsheet Structure

### MasterData Sheet
Defines the employee directory.
- **Access Code:** Used for employee login.
- **Employee ID:** Internal corporate ID.
- **Employee Name:** Full name displayed on the portal.
- **Joining Date:** Automated date validation.

### Pay slip Sheet
The primary transaction ledger.
- **Column Prefixes:**
  - `ER_`: Any header starting with this (e.g., `ER_Bonus`) is treated as an Addition.
  - `DE_`: Any header starting with this (e.g., `DE_Tax`) is treated as a Deduction.
- **Amount Validation:** The row turns orange if `Amount != (Total ER - Total DE)`.
- **Status Highlighting:** "Under Review" rows are highlighted in yellow for easy spotting.

### Explanation Sheet
Contains comprehensive documentation and first steps for administrators, generated automatically during setup.

## 📱 Mobile Access
This app is designed to be added to the mobile home screen:
- **iOS:** Open in Safari > Share > **Add to Home Screen**.
- **Android:** Open in Chrome > Menu > **Add to Home Screen**.
- **Auto-Login:** Support for `?ref=[AccessCode]` in the URL for seamless, one-tap access.

## 🔒 Security & Best Practices
- **Data Isolation:** Employees can only see records associated with their unique access code.
- **Immutable Fields:** Critical fields like dates and amounts are validated before being fetched by the frontend.
- **No Private Keys:** Uses the Apps Script `doGet` interface to proxy data without exposing sheet credentials.

---
*© 2026 Enterprise Payroll Solutions | Built with focus on precision and usability.*
