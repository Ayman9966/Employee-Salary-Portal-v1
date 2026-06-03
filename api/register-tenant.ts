import dotenv from "dotenv";

dotenv.config();

export default async function handler(req: any, res: any) {
  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    return res.status(200).end();
  }

  // Set standard CORS headers for other requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  try {
    const payload = req.body || {};
    const superAdminUrl = process.env.VITE_GAS_SUPERADMIN_URL || 'https://script.google.com/macros/s/AKfycbwgaIAX4V4bLMTfoyl_D83sKt2HXw6vqqMftJPEU-aWgeh4Te5oFvoQTUEsX4m2DBrbnQ/exec';

    console.log(`[VERCEL SERVERLESS] Sending registration for "${payload.companyName}"...`);

    // Build URL with params
    const targetUrl = new URL(superAdminUrl);
    targetUrl.searchParams.set("action", "saveTenant");
    targetUrl.searchParams.set("companyName", String(payload.companyName || "").trim());
    targetUrl.searchParams.set("whatsapp", String(payload.whatsapp || "").trim());
    targetUrl.searchParams.set("email", String(payload.email || "").trim());
    targetUrl.searchParams.set("companySize", String(payload.companySize || ""));
    targetUrl.searchParams.set("gasUrl", String(payload.gasUrl || "").trim());

    const response = await fetch(targetUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "saveTenant",
        companyName: String(payload.companyName || "").trim(),
        whatsapp: String(payload.whatsapp || "").trim(),
        email: String(payload.email || "").trim(),
        companySize: String(payload.companySize || ""),
        gasUrl: String(payload.gasUrl || "").trim()
      })
    });

    const text = await response.text();
    console.log(`[VERCEL SERVERLESS] Response text:`, text);

    try {
      const data = JSON.parse(text);
      if (data && data.success === false) {
        return res.status(400).json(data);
      }
      return res.status(200).json(data);
    } catch {
      if (text.includes('"success":true') || text.includes('success') || response.status === 200) {
        return res.status(200).json({ success: true, message: text });
      }
      return res.status(response.status || 500).json({ success: false, error: text || "Invalid response format from Apps Script" });
    }
  } catch (err: any) {
    console.error("[VERCEL SERVERLESS ERROR]:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to reach registration endpoint" });
  }
}
