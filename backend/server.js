require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const yaml = require("js-yaml");

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

function sanitizeYaml(raw){
  // Normaliza saltos y tabs
  let text = raw.replace(/\r\n?/g, '\n').replace(/\t/g, '  ');
  const lines = text.split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length){
    let ln = lines[i];
    ln = ln.replace(/[ \t]+$/,'');                         // quita espacios al final
    ln = ln.replace(/^(\s*[^:\n]+:)(\S)/, (_, a, b) => a+' '+b); // espacio tras ':'
    ln = ln.replace(/^(\s*)-\s+/, '$1- ');                 // "-   x" -> "- x"
    out.push(ln);

    // Reindent hijos de items de lista
    const m = ln.match(/^(\s*)-\s+\S/);
    if (m){
      const base = m[1].length;
      const childIndent = base + 2;
      let j = i + 1;
      while (j < lines.length){
        let nxt = lines[j];
        if (!nxt.trim()){ out.push(nxt.replace(/[ \t]+$/,'')); j++; continue; }
        const isItem = nxt.match(/^(\s*)-\s+\S/);
        const curInd = (nxt.match(/^(\s*)/) || ['',''])[1].length;
        if ((isItem && curInd <= base) || (!isItem && curInd <= base)) break;

        if (/^\s*[^:\n]+:/.test(nxt)){                    // clave bajo el item
          const trimmed = nxt.trimStart();
          nxt = ' '.repeat(childIndent) + trimmed;
          nxt = nxt.replace(/^(\s*[^:\n]+:)(\S)/, (_, a, b) => a+' '+b);
        }
        out.push(nxt.replace(/[ \t]+$/,''));
        j++;
      }
      i = j;
      continue;
    }
    i++;
  }
  return out.join('\n');
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
    console.error("Error in /run:", e);
    res.status(400).json({ error: e.message || "process error" });
  }
});

// Arranque
const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
