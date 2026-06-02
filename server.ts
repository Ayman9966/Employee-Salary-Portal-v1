import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes
  app.get("/api/salary-slips", (req, res) => {
    // This will eventually interface with Google Apps Script
    res.json({ slips: [] }); 
  });

  // Server-to-server proxy route for Tenant Registration (CORS-free, safe redirect resolution)
  app.post("/api/register-tenant", async (req, res) => {
    try {
      const payload = req.body || {};
      const superAdminUrl = process.env.VITE_GAS_SUPERADMIN_URL || 'https://script.google.com/macros/s/AKfycbwgaIAX4V4bLMTfoyl_D83sKt2HXw6vqqMftJPEU-aWgeh4Te5oFvoQTUEsX4m2DBrbnQ/exec';

      console.log(`[PROXY] Sending registration for "${payload.companyName}" with email "${payload.email}" to Google Sheets...`);

      // Construct a robust query-string URL to ensure Google's redirection handles payload perfectly
      const targetUrl = new URL(superAdminUrl);
      targetUrl.searchParams.set("action", "saveTenant");
      targetUrl.searchParams.set("companyName", String(payload.companyName || "").trim());
      targetUrl.searchParams.set("whatsapp", String(payload.whatsapp || "").trim());
      targetUrl.searchParams.set("email", String(payload.email || "").trim());
      targetUrl.searchParams.set("companySize", String(payload.companySize || ""));
      targetUrl.searchParams.set("gasUrl", String(payload.gasUrl || "").trim());

      console.log(`[PROXY] Destination URL with params: ${targetUrl.toString()}`);

      // Perform a POST call with both JSON body and search parameters to be bulletproof
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
      console.log(`[PROXY] Google Sheets Web App raw response text:`, text);

      try {
        const data = JSON.parse(text);
        if (data && data.success === false) {
          return res.status(400).json(data);
        }
        return res.json(data);
      } catch {
        // If it returns text rather than JSON, respond with text/success
        if (text.includes('"success":true') || text.includes('success') || response.status === 200) {
          return res.json({ success: true, message: text });
        }
        return res.status(response.status || 500).json({ success: false, error: text || "Invalid response format from script" });
      }
    } catch (err: any) {
      console.error("[PROXY ERROR] Registration failed:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to reach registration script endpoint" });
    }
  });

  // Server-to-server proxy route for checking tenant status
  app.get("/api/check-tenant-status", async (req, res) => {
    try {
      const gasUrl = String(req.query.gasUrl || "").trim();
      if (!gasUrl) {
        return res.json({ blocked: false });
      }
      const superAdminUrl = process.env.VITE_GAS_SUPERADMIN_URL || 'https://script.google.com/macros/s/AKfycbwgaIAX4V4bLMTfoyl_D83sKt2HXw6vqqMftJPEU-aWgeh4Te5oFvoQTUEsX4m2DBrbnQ/exec';
      const targetUrl = `${superAdminUrl}?action=checkTenantAccess&gasUrl=${encodeURIComponent(gasUrl)}`;
      
      console.log(`[PROXY] Checking status for tenant URL: ${gasUrl}`);
      const response = await fetch(targetUrl);
      const data = await response.json();
      
      let blocked = false;
      if (data) {
        const status = data.status ? String(data.status).toLowerCase().trim() : '';
        const allowed = data.allowed;
        console.log(`[PROXY] Tenant status retrieved: allowed=${allowed}, status=${status}`);
        if (allowed === false || status === 'block' || status === 'blocked') {
          blocked = true;
        }
      }
      return res.json({ blocked });
    } catch (err: any) {
      console.error("[PROXY ERROR] Check status failed:", err);
      // Fallback: If superadmin check fails, do not block the active sheet users
      return res.json({ blocked: false });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
