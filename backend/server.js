require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const yaml = require("js-yaml");
const sanitizeYaml = require("./sanitizeYaml");

const app = express();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

// Static UI
app.use(express.static(path.join(__dirname, "..", "public")));

// Parsers (JSON primero, luego texto plano para otros)
app.use(express.json({ limit: "5mb" }));
app.use(express.text({ type: ["text/*", "application/x-ndjson"], limit: "5mb" }));

// CORS
app.use(cors());

// Health
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Endpoints de Share
const shareRoutes = require("./share.endpoints");
shareRoutes(app);

// Ejecutar jq
function runJq(input, filter = ".") {
  return new Promise((resolve, reject) => {
    const p = spawn("jq", [filter]);
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(err || `jq exited ${code}`))));
    p.stdin.end(input);
  });
}

// API principal
app.post("/run", upload.single("file"), async (req, res) => {
  try {
    let type = "json";
    if (req.query.type === "yaml") type = "yaml";
    if (req.file?.originalname && /\.ya?ml$/i.test(req.file.originalname)) type = "yaml";

    const filter = req.query.filter || ".";
    console.log(`Run request type=${type}, filter=${filter}`);
    const body = req.file ? req.file.buffer.toString("utf8") : (req.body || "");
    if (!body.trim()) return res.status(400).json({ error: "empty body" });

    let obj;
    if (type === "yaml") {
      try {
        obj = yaml.load(body);
      } catch {
        const fixed = sanitizeYaml(body);   // ← intento de auto-arreglo
        obj = yaml.load(fixed);
      }
    } else {
      obj = JSON.parse(body);
    }

    const jqOut = await runJq(JSON.stringify(obj), filter);
    const outObj = JSON.parse(jqOut);
    const outText = (type === "yaml")
      ? yaml.dump(outObj, { lineWidth: 120 })
      : JSON.stringify(outObj, null, 2);

    res.type("text/plain").send(outText);
  } catch (e) {

    let msg = e.message || "process error";
    if (e?.reason && typeof e?.mark?.line === "number" && typeof e?.mark?.column === "number") {
      msg = `${e.reason} at line ${e.mark.line + 1}, column ${e.mark.column + 1}`;
      console.error(`Error in /run: ${msg}`);
    } else {
      console.error("Error in /run:", e.message || e);
    }
    res.status(400).json({ error: msg });

  }
});

// Arranque
const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
