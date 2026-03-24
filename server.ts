import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import cors from "cors";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, query, where, getDocs, limit } from 'firebase/firestore';
import fs from 'fs';
import crypto from 'crypto';

const __filename = import.meta.url ? fileURLToPath(import.meta.url) : '';
const __dirname = __filename ? path.dirname(__filename) : '';

export async function createServer() {
  console.log("Starting server initialization...");
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", firebase: !!db });
  });

  // Load Firebase config
  let firebaseConfig;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    console.log(`Checking for config at: ${configPath}`);
    if (fs.existsSync(configPath)) {
      console.log("Found firebase-applet-config.json, loading...");
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
      console.log("firebase-applet-config.json not found, using environment variables.");
      // Fallback to env vars for Netlify
      firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
        appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
        firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID
      };
    }
  } catch (e) {
    console.error("Error loading firebase config:", e);
  }

  if (!firebaseConfig || !firebaseConfig.apiKey) {
    console.error("CRITICAL: Firebase configuration is missing or incomplete!");
  }

  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp, firebaseConfig?.firestoreDatabaseId);

  // Webhook to receive emails (e.g., from Cloudflare Email Routing)
  app.get("/api/webhook/email", (req, res) => {
    res.send("<h1>🚀 Webhook está ONLINE e aguardando e-mails!</h1><p>Use o método POST para enviar dados.</p>");
  });

  app.post("/api/webhook/email", async (req, res) => {
    console.log("POST /api/webhook/email hit! Body:", JSON.stringify(req.body));
    
    try {
      const { from, to, subject, body, secret } = req.body || {};

      if (secret !== "story_webhook_secret_2026") {
        console.log("Invalid secret received");
        return res.status(401).json({ success: false, error: "Secret inválido" });
      }

      // Respond success to the client
      res.json({ success: true, message: "Recebido" });

      // Continue processing in background
      (async () => {
        try {
          // Log attempt immediately to Firestore
          await addDoc(collection(db, "webhook_logs"), {
            timestamp: serverTimestamp(),
            from: from || "N/A",
            to: to || "N/A",
            subject: subject || "N/A",
            success: true,
            type: "test_manual"
          });

          if (!to) return;

          // Extract email if it's in "Name <email@domain.com>" format
          const extractEmail = (str: string) => {
            if (!str) return "";
            const match = str.match(/<([^>]+)>/);
            return match ? match[1] : str;
          };

          const targetEmail = extractEmail(to).toLowerCase().trim();
          console.log("Normalized Target Email:", targetEmail);

          // Find the user who owns this alias using direct document lookup
          // We now use the aliasEmail as the document ID for efficiency and security
          const aliasDocRef = doc(db, "aliases", targetEmail);
          let aliasSnap = await getDoc(aliasDocRef);
          let userId: string | null = null;
          
          if (aliasSnap.exists()) {
            userId = aliasSnap.data().userId;
          } else {
            // Fallback for legacy aliases created with random UUIDs
            console.log(`Alias ${targetEmail} not found by ID, trying fallback query...`);
            const q = query(collection(db, "aliases"), where("aliasEmail", "==", targetEmail), limit(1));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              userId = qSnap.docs[0].data().userId;
            }
          }

          if (!userId) {
            console.log(`No alias found for ${targetEmail}`);
            // Log failure
            await addDoc(collection(db, "webhook_logs"), {
              timestamp: serverTimestamp(),
              from,
              to: targetEmail,
              success: false,
              error: "Alias not found"
            });
            return;
          }

          const messageId = crypto.randomUUID();
          await addDoc(collection(db, "messages"), {
            id: messageId,
            userId,
            aliasEmail: targetEmail,
            from,
            subject: subject || "(Sem Assunto)",
            body,
            createdAt: serverTimestamp(),
            secret: "story_webhook_secret_2026"
          });

          // Log success
          await addDoc(collection(db, "webhook_logs"), {
            timestamp: serverTimestamp(),
            from,
            to: targetEmail,
            userId,
            success: true
          });

          console.log("Message saved successfully for user:", userId);
        } catch (bgError) {
          console.error("Background webhook error:", bgError);
        }
      })();
    } catch (error: any) {
      console.error("Webhook error:", error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  });

  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global error handler:", err);
    res.status(500).json({ success: false, error: "Internal Server Error", details: err.message });
  });

  // Vite middleware for development (Skip on Netlify)
  if (!process.env.NETLIFY) {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
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
  }

  return app;
}

// For local development and Cloud Run
if (process.env.NODE_ENV !== "production" || !process.env.NETLIFY) {
  createServer().then(app => {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}
