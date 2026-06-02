// google-apps-script-super-admin.js
// 1. Create a Google Sheet named "Super Admin Portfolio"
// 2. Open Extensions > Apps Script
// 3. Paste this code and click Save
// 4. Click "Deploy" > "New Deployment"
// 5. Select "Web App", Set "Execute as: Me", "Who has access: Anyone"
// 6. Deploy and Copy the "Web App URL" into dataService.ts SUPER_ADMIN_GAS_URL

function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // Support both e.parameter (URL/Form) and e.postData (JSON Body)
  let params = e.parameter || {};
  
  if (e.postData && e.postData.contents) {
    try {
      const body = JSON.parse(e.postData.contents);
      params = { ...params, ...body };
    } catch (err) {
      // Not JSON, ignore
    }
  }

  const action = params.action;
  
  if (action === 'saveTenant') {
    return saveTenant(params);
  }

  if (action === 'sendWelcomeEmail') {
    return sendWelcomeEmail(params);
  }
  
  if (action === 'checkTenantAccess') {
    return checkTenantAccess(params.gasUrl);
  }

  if (action === 'getTenantAdmin') {
    return getTenantAdmin(params.gasUrl);
  }
  
  if (action === 'saveFeedback') {
    return saveFeedback(params);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: "Invalid action: " + action }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getTenantAdmin(gasUrl) {
  if (!gasUrl) return createJsonResponse({ error: "URL required" });
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Tenants");
  if (!sheet) return createJsonResponse({ error: "No tenants found" });
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][5] && data[i][5].toString().trim() === gasUrl.trim()) {
      return createJsonResponse({ email: data[i][3] });
    }
  }
  
  return createJsonResponse({ error: "Tenant not found" });
}

function checkTenantAccess(gasUrl) {
  if (!gasUrl) return createJsonResponse({ allowed: false, error: "URL required" });
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Tenants");
  if (!sheet) return createJsonResponse({ allowed: true }); // No tenants yet
  
  const data = sheet.getDataRange().getValues();
  const gasUrlCol = 5;
  const statusCol = 6; 
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][gasUrlCol] && data[i][gasUrlCol].toString().trim() === gasUrl.trim()) {
      const status = data[i][statusCol] ? data[i][statusCol].toString().toLowerCase() : "active";
      return createJsonResponse({ 
        allowed: status !== "blocked",
        status: status
      });
    }
  }
  
  return createJsonResponse({ allowed: true }); 
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveTenant(data) {
  if (!data.email) return createJsonResponse({ success: false, error: "Email required for registration" });
  if (!data.gasUrl) return createJsonResponse({ success: false, error: "Endpoint URL required" });
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Tenants");
  
  if (!sheet) {
    sheet = ss.insertSheet("Tenants");
    sheet.appendRow(["Timestamp", "Company Name", "WhatsApp", "Email", "Company Size", "GAS URL", "Status"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  // Duplicate check
  const existingData = sheet.getDataRange().getValues();
  for (let i = 1; i < existingData.length; i++) {
    const rowEmail = existingData[i][3] ? existingData[i][3].toString().toLowerCase() : "";
    const rowUrl = existingData[i][5] ? existingData[i][5].toString().trim() : "";
    
    // If both match, it's a "re-registration" or "login" via registration form
    if (rowEmail === data.email.toLowerCase() && rowUrl === data.gasUrl.trim()) {
      return createJsonResponse({ success: true, alreadyExists: true });
    }
    
    // URL taken by another email
    if (rowUrl === data.gasUrl.trim()) {
      return createJsonResponse({ success: false, error: "This Endpoint URL is already registered to another email." });
    }
  }
  
  sheet.appendRow([
    new Date(),
    data.companyName,
    data.whatsapp,
    data.email,
    data.companySize,
    data.gasUrl,
    "Active"
  ]);
  
  // Send welcome email on success
  try {
    sendWelcomeEmail(data);
  } catch (err) {
    console.error("Welcome email failed: " + err);
  }
  
  return createJsonResponse({ success: true });
}

function sendWelcomeEmail(data) {
  const email = data.email;
  const companyName = data.companyName;
  const gasUrl = data.gasUrl;
  
  if (!email) return createJsonResponse({ error: "Email required for welcome message" });

  const appUrl = "https://employee-salaryportal.vercel.app";
  
  // Use UTF-8 for encoding string to bytes before base64 transformation
  let encodedUrl = "";
  let encodedOrg = "";
  try {
    encodedUrl = Utilities.base64Encode(gasUrl, Utilities.Charset.UTF_8);
    encodedOrg = Utilities.base64Encode(companyName || "", Utilities.Charset.UTF_8);
  } catch (e) {
    console.error("Base64 encoding failed: " + e);
    encodedUrl = Utilities.base64Encode(gasUrl);
    encodedOrg = Utilities.base64Encode(companyName || "");
  }
  
  const teamSetupLink = `${appUrl}?c=${encodeURIComponent(encodedUrl)}&o=${encodeURIComponent(encodedOrg)}`;
  
  const subject = "You're all set! Welcome to Enterprise Payroll Portal";
  
  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Enterprise Payroll Portal</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#011f4b; padding: 40px 40px 32px; text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <span style="display:inline-block; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.18); border-radius:20px; padding:6px 16px; font-size:11px; font-weight:700; color:rgba(255,255,255,0.85); letter-spacing:0.1em; text-transform:uppercase;">
                      Enterprise Payroll Portal
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin:0 0 10px; color:#ffffff; font-size:26px; font-weight:700; line-height:1.2;">
                      You're all set, ${companyName}!
                    </h1>
                    <p style="margin:0; color:rgba(255,255,255,0.65); font-size:14px; line-height:1.6;">
                      Your payroll portal is live and ready for your team.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ACCENT BAR -->
          <tr>
            <td style="height:4px; background: linear-gradient(90deg, #003d9b 0%, #0ea5e9 50%, #003d9b 100%);"></td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding: 36px 40px;">

              <!-- GREETING -->
              <p style="margin:0 0 28px; font-size:15px; color:#334155; line-height:1.7;">
                Hi <strong>${companyName}</strong>,<br><br>
                Welcome aboard! Your registration was successful and your dedicated payroll portal is now active. Here's everything you need to get started:
              </p>

              <!-- STEPS LABEL -->
              <p style="margin:0 0 16px; font-size:11px; font-weight:700; color:#003d9b; text-transform:uppercase; letter-spacing:0.1em;">
                Next steps
              </p>

              <!-- STEPS TABLE -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td width="44" valign="top" style="padding-bottom:20px;">
                    <div style="width:28px; height:28px; background:#011f4b; color:#ffffff; border-radius:50%; text-align:center; font-size:13px; font-weight:700; line-height:28px;">1</div>
                  </td>
                  <td valign="top" style="padding-bottom:20px;">
                    <p style="margin:0 0 4px; font-size:14px; font-weight:700; color:#1e293b;">Share the portal with your team</p>
                    <p style="margin:0; font-size:13px; color:#64748b; line-height:1.6;">Use the button below to copy your unique access link and distribute it to HR staff or employees directly.</p>
                  </td>
                </tr>
                <tr>
                  <td width="44" valign="top" style="padding-bottom:20px;">
                    <div style="width:28px; height:28px; background:#011f4b; color:#ffffff; border-radius:50%; text-align:center; font-size:13px; font-weight:700; line-height:28px;">2</div>
                  </td>
                  <td valign="top" style="padding-bottom:20px;">
                    <p style="margin:0 0 4px; font-size:14px; font-weight:700; color:#1e293b;">Populate your employee master sheet</p>
                    <p style="margin:0; font-size:13px; color:#64748b; line-height:1.6;">Open your Google Sheet and ensure the <strong>Master</strong> tab is updated with correct Employee IDs and salary data.</p>
                  </td>
                </tr>
                <tr>
                  <td width="44" valign="top">
                    <div style="width:28px; height:28px; background:#011f4b; color:#ffffff; border-radius:50%; text-align:center; font-size:13px; font-weight:700; line-height:28px;">3</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 4px; font-size:14px; font-weight:700; color:#1e293b;">Verify with a test login</p>
                    <p style="margin:0; font-size:13px; color:#64748b; line-height:1.6;">Use a sample Employee ID to confirm the portal is reading data correctly before you roll it out.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faff; border:1px solid #dbeafe; border-radius:12px; margin-bottom:24px;">
                <tr>
                  <td style="padding:28px 32px; text-align:center;">
                    <p style="margin:0 0 20px; font-size:13px; color:#475569; line-height:1.7;">
                      Click below to open your employee-ready portal link. Share this with your HR team to begin onboarding.
                    </p>
                    <a href="${teamSetupLink}"
                       style="display:inline-block; background:#003d9b; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700; padding:14px 36px; border-radius:10px; letter-spacing:0.02em;">
                      Open Employee Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- SECURITY NOTICE -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9; border-radius:10px;">
                <tr>
                  <td width="32" valign="top" style="padding:16px 0 16px 16px; font-size:16px;"></td>
                  <td style="padding:16px 16px 16px 10px;">
                    <p style="margin:0; font-size:12px; color:#64748b; line-height:1.7;">
                      <strong style="color:#334155;">Keep this link private.</strong>
                      It is unique to your organization and encodes your Google Apps Script endpoint. Anyone with this link can access your payroll portal.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="border-top:1px solid #f1f5f9; padding:24px 40px; text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${appUrl}" style="font-size:11px; color:#94a3b8; text-decoration:none; margin:0 10px;">Documentation</a>
                    <a href="${appUrl}" style="font-size:11px; color:#94a3b8; text-decoration:none; margin:0 10px;">Support</a>
                    <a href="${appUrl}" style="font-size:11px; color:#94a3b8; text-decoration:none; margin:0 10px;">Privacy Policy</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:0; font-size:11px; color:#94a3b8; line-height:1.8; letter-spacing:0.04em;">
                      &copy; 2026 Enterprise Payroll Portal &middot; Secured by Enterprise Smart Setup<br/>
                      This email was sent because you registered at employee-salaryportal.vercel.app
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
  
  console.log("Sending email to: " + email);

  try {
    GmailApp.sendEmail(email, subject, "", {
      htmlBody: htmlBody,
      name: "Enterprise Payroll Portal"
    });
    return createJsonResponse({ success: true, message: "Professional welcome email delivered" });
  } catch (err) {
    console.error("GmailApp failed, trying MailApp: " + err);
    try {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        htmlBody: htmlBody
      });
      return createJsonResponse({ success: true });
    } catch (mailErr) {
      console.error("MailApp also failed: " + mailErr);
      return createJsonResponse({ error: "Email delivery failed" });
    }
  }
}

function saveFeedback(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Feedback");
  
  if (!sheet) {
    sheet = ss.insertSheet("Feedback");
    sheet.appendRow(["Timestamp", "Email", "Company Name", "Message", "Language", "User Agent"]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  sheet.appendRow([
    data.timestamp || new Date(),
    data.email || "Anonymous",
    data.companyName || "Unknown",
    data.feedback || data.message || "",
    data.lang || "",
    data.userAgent || ""
  ]);
  
  return createJsonResponse({ success: true, message: "Feedback saved successfully" });
}