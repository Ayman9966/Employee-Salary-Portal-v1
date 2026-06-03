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

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: "Method not allowed. Use GET." });
  }

  try {
    const gasUrl = String(req.query.gasUrl || "").trim();
    if (!gasUrl) {
      return res.status(200).json({ blocked: false });
    }

    const superAdminUrl = process.env.VITE_GAS_SUPERADMIN_URL || 'https://script.google.com/macros/s/AKfycbwgaIAX4V4bLMTfoyl_D83sKt2HXw6vqqMftJPEU-aWgeh4Te5oFvoQTUEsX4m2DBrbnQ/exec';
    const targetUrl = `${superAdminUrl}?action=checkTenantAccess&gasUrl=${encodeURIComponent(gasUrl)}`;

    console.log(`[VERCEL SERVERLESS] Checking tenant access for: ${gasUrl}`);
    const response = await fetch(targetUrl);
    const data = await response.json();

    let blocked = false;
    if (data) {
      const status = data.status ? String(data.status).toLowerCase().trim() : '';
      const allowed = data.allowed;
      console.log(`[VERCEL SERVERLESS] Status retrieved: allowed=${allowed}, status=${status}`);
      if (allowed === false || status === 'block' || status === 'blocked') {
        blocked = true;
      }
    }
    return res.status(200).json({ blocked });
  } catch (err: any) {
    console.warn("[VERCEL SERVERLESS ERROR] Access check failed, allowing by default:", err);
    return res.status(200).json({ blocked: false });
  }
}
