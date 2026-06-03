# 💎 AirSlip - Bilingual Workforce Payslip Engine

AirSlip is a professional, mobile-first, and highly optimized Employee Salary Portal and Enterprise Payroll Control Console. It enables modern organizations to operate a fully transparent, highly responsive, and secure payroll distribution system directly on top of **Google Sheets** using a serverless **Google Apps Script (GAS)** Web App backend, bypassing the need for complex, heavy SQL databases.

Employees can securely access monthly payslips, inspect year-to-date earnings trends, and download bilingual breakdowns. At the same time, administrators can manage files, review staff metrics, issue payslips through our elegant portal, and instantly onboard new employees using AirSlip's **Zero-Environment Auto-Onboarding**.

---

## 🚀 Key Modules & Capabilities

### 📱 Progressive Web App (PWA) & Borderless Mobile Experience
- **Native OS Feel:** Installable directly to iOS & Android home screens with zero browser margins.
- **Offline Resiliency:** Automatic local cache storage policies for seamless network transitions.
- **Integrated Install Flow:** Context-aware mobile setup guide inside the app for seamless PWA installations across Safari and Chrome.

### 👤 Employee & Workforce Portal
- **Zero-Friction Access:** Fully secure authentication utilizing individual corporate Employee Access Codes.
- **Dynamic Year-To-Date (YTD) Analytics:** Direct calculations on total earnings, deductions, and tax withholdings with visual metrics.
- **Bilingual Payslip Layouts:** Mobile-optimized, print-ready, bilingual breakdowns (English & Arabic) showing precise calculations.

### 💼 Administrator Control Hub
- **Zero-Environment Auto-Onboarding:** Generate secure `?invite=` URLs that instantly configure the workspace on any employee's phone for 60 seconds.
- **Employee Directory Management:** Create, update, or remove personnel profiles right from the portal or directly inside Google Sheets.
- **Payslip Ledger Distribution:** Add, modify, or delete monthly payslip entries with a real-time validation engine.
- **Bulk Data Migration:** Seamless JSON imports/exports for fast onboarding of organizations.

### 📊 Backend & Google Sheets Integration
- **Serverless API Proxy:** Vercel serverless functions (`/api/*`) securely map to Google Apps Script endpoints to bypass CORS issues and secure deployment.
- **Zero-Infrastructure Setup:** Runs entirely inside lightweight, secure Google Sheets rows.
- **Dynamic Headers Support:** Create custom columns in your ledger prepended with `ER_` (Earnings) or `DE_` (Deductions); AirSlip's parser dynamically creates categories on the fly.

---

## 🛠️ Tech Stack & Architecture

- **Client Application:** React 18 (Vite, TypeScript 5)
- **Fluid Layouts & Styling:** Tailwind CSS
- **Micro-interactions:** Framer Motion (`motion/react`)
- **API Translation:** Vercel Serverless Functions (`/api/*`)
- **Backend Infrastructure:** Google Apps Script Serverless Endpoint
- **Data Store:** Google Sheets (Fully isolated tenant sheets)

---

## ⚙️ Step-by-Step Backend Deployment Guide

Setting up your AirSlip deployment is extremely straightforward and takes less than 5 minutes.

### Step 1: Create a Google Sheet
1. Navigate to [Google Sheets](https://sheets.google.com) and create a brand-new blank spreadsheet.
2. Provide a clean name for your sheet (e.g., `AirSlip Payroll Sheets Ledger`).

### Step 2: Bind the Apps Script Backend
1. In your new Google Sheet, click **Extensions** in the top menu, then select **Apps Script**.
2. Rename the default file from `Code.gs` to `google-apps-script.gs` and copy the complete contents of `google-apps-script.js` from this project into it.
3. Click the **➕ Add a file** icon inside Apps Script, create a new script named `google-apps-script-setup`, and copy the contents of `google-apps-script-setup.js` into it.
4. (Optional) Create a third script file named `google-apps-script-super-admin` and copy `google-apps-script-super-admin.js` into it if you would like advanced administrative functions.
5. Save your Apps Script project by clicking the Disk Icon (**Save Project**).

### Step 3: Initialize the Sheet Structures
1. Refresh your Google Sheet browser tab.
2. A new option will appear in your top-level Excel menu: **🚀 Enterprise Payroll** (or **🚀 AirSlip Portal**).
3. Click **Initialize System**. (If Google prompts you for authorization permissions, grant them; this is required for the script to create tabs and mock test inputs for you).
4. The script will automatically generate three pre-configured tabs:
   - **`MasterData`:** The workforce employee list.
   - **`Pay slip`:** The historical transaction database.
   - **`Explanation`:** Quick developer specifications and guides.

### Step 4: Deploy as a Serverless Web App
1. In your Apps Script editor, click the blue **Deploy** button in the top-right corner, and choose **New deployment**.
2. Click the gear icon alongside **Select type** and choose **Web app**.
3. Set the configuration exactly as follows:
   - **Description:** `AirSlip Core API Endpoint v2.0`
   - **Execute as:** `Me (your-email@gmail.com)`
   - **Who has access:** `Anyone` (Crucial: This enables the browser to make secure requests without requiring your employees to sign in to Google Cloud).
4. Click **Deploy**.
5. Copy the generated **Web App URL** (it always starts with `https://script.google.com/macros/s/...`).

---

## 💻 Step-by-Step Frontend Integration Guide

Once you have your Apps Script Web App URL, connecting the portal is simple:

1. Launch the AirSlip application in your browser.
2. On the welcoming onboarding stage, click **Sign In / Admin Login** in the top navigation or **Sign In to Existing Portal**.
3. Paste the copied **Google Apps Script URL** in the form field.
4. **To Login as Employee:** Choose the **Staff Portal** tab, type your matching Access Code defined in the `MasterData` tab (e.g. `E001`), and click **Connect**.
5. **To Login as Administrator:** Choose the **Admin Console** tab, enter your administrative email address and password defined in your script setup, and connect.

*Note: All connected portal endpoints and session values are securely saved locally inside your browser's Cache/LocalStorage rules.*

---

## 📁 Google Sheet Column Structures & Layout

To ensure seamless integration with the parser, columns must match the following parameters:

### Sheet 1: `MasterData` (Workforce Registry)
Rows in this sheet define valid employees authorized to request records:

| Column Header | Format / Type | Purpose |
| :--- | :--- | :--- |
| **Access Code** | `Plain Text (e.g. E1024)` | Employee primary login code (Case-sensitive) |
| **Employee ID** | `Plain Text (e.g. AS-421)` | Formal corporate company ID |
| **Employee Name**|`Plain Text (e.g. Sarah Connor)`| Name displayed on the dashboard |
| **Job Title** | `Plain Text (e.g. Senior Dev)`| Employee role description |
| **Department** | `Plain Text (e.g. Technology)`| Staff organization group |
| **joining Date** | `Date (YYYY-MM-DD)` | Hiring baseline sheet field |

### Sheet 2: `Pay slip` (Primary Payroll Ledger)
This sheet contains monthly transactions containing base payouts, deductions, and metadata:

- **Metadata Fields:**
  - `Access Code`: Matches employee code from MasterData.
  - `Month`: Fully spelled month name (e.g. `January`, `February`).
  - `Year`: Calender year number (e.g. `2026`).
  - `Status`: Current state (`Processed`, `Under Review`, or `On Hold`).
  - `Basic Salary`: Base contractual payout.
  - `Net Pay`: The total payout resulting from additions minus subtractions.
- **Dynamic Field Prefixes:**
  - **`ER_` (Earnings):** Anything beginning with `ER_` (e.g., `ER_Bonus`, `ER_Overtime`) is rendered dynamically as additions on payslips.
  - **`DE_` (Deductions):** Anything beginning with `DE_` (e.g., `DE_Tax`, `DE_Health Insurance`) is rendered dynamically as deductions on payslips.

---

## 🔒 Security Principles & Core Controls

1. **Information Isolation:** Employees cannot scan or access other individuals' profiles. The Apps Script backend only yields rows corresponding to a verified, single `accessCode`.
2. **Strict Payload Integrity:** Critical fields (net amounts, withholdings, dates) are computed at the spreadsheet boundary and double-checked by the client before layout rendering.
3. **No Database Keys Shared:** Google Spreadsheet IDs or GCP IAM account tokens are handled securely on Google's script cloud, preventing Client-Side inspection exploits.

---
*© 2026 AirSlip | Automated Bilingual HR Distribution & Verification Platform. Built with care and absolute clarity.*
