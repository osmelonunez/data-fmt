import { initTheme } from './theme.js';
import { initShare } from './share.js';
import { initAutoResize } from './autoResize.js';

initTheme();

const out = document.getElementById("out");
const fileInput = document.getElementById("file");
const fileNameEl = document.getElementById("fileName");
const downloadBtn = document.getElementById("download");
const copyBtn = document.getElementById("copy");
const clearResultBtn = document.getElementById("clearResult");
const shareBtn = document.getElementById("share");

const pillJson = document.querySelector('.type-pill.json');
const pillYaml = document.querySelector('.type-pill.yaml');

function setTypeIndicator(type){ setType(type); }
// ===== Detección del tipo en el textarea =====
function looksLikeYaml(s) {
  const hasDocMarker = /^\s*---\s*$/m.test(s);
  const hasKeyColon = /^\s*[^#\-\s][\w\-".']+\s*:\s+/m.test(s);
  const hasListDash = /^\s*-\s+\S+/m.test(s);
  const hasBlockScalar = /:\s*[>|]/m.test(s);
  const hasAnchors = /[*&][\w-]+/.test(s);
  return hasDocMarker || hasKeyColon || hasListDash || hasBlockScalar || hasAnchors;
}



function detectType(raw) {
  const s = raw?.trim?.() ?? "";
  if (!s) return null;

  // JSON objeto estricto: empieza con {, termina con }, y contiene al menos "clave": valor
  const jsonObjectCandidate =
    s.startsWith("{") &&
    s.endsWith("}") &&
    /"\s*[A-Za-z0-9_\-]+"\s*:/.test(s);

  if (jsonObjectCandidate) {
    try { JSON.parse(s); return "json"; } catch {}
  }

  // Si no cumple las reglas de JSON objeto, probamos YAML
  if (looksLikeYaml(s)) return "yaml";

  // Sin tipo claro
  return null;
}


// Estado del tipo de dato actual
let currentType = null;

function setType(t){
  currentType = t;
  // pastillas visuales
  pillJson?.classList.remove('active');
  pillYaml?.classList.remove('active');
  if (t === 'json') pillJson?.classList.add('active');
  if (t === 'yaml') pillYaml?.classList.add('active');
  // ARIA state
  document.getElementById('typeJson')?.setAttribute('aria-pressed', String(t==='json'));
  document.getElementById('typeYaml')?.setAttribute('aria-pressed', String(t==='yaml'));
}
// Estado del archivo original subido
let originalRaw = "";
let originalName = "";

// limpiar al cargar (sin borrar el resultado si hay #id=)
window.addEventListener("DOMContentLoaded", () => {
  const txt = document.getElementById("text");
  if (txt) txt.value = "";

  const hasShareId = /#id=([\w-]+)/.test(location.hash);
  if (!hasShareId) {
    out.textContent = "";
    setResultEnabled(false);
  }
});

// Habilitar/Deshabilitar botones de resultado
function setResultEnabled(enabled) {
  copyBtn.disabled = !enabled;
  downloadBtn.disabled = !enabled;
  shareBtn.disabled = !enabled;
  if (clearResultBtn) clearResultBtn.disabled = !enabled;
}

function pretty(jsonText) {
  try { return JSON.stringify(JSON.parse(jsonText), null, 2); }
  catch { return jsonText; }
}

async function handleResponse(r) {
  const text = await r.text();
  if (!r.ok) {
    let err;
    try { const j = JSON.parse(text); err = j.error || text; }
    catch { err = `HTTP ${r.status}: ${text}`; }
    return { ok: false, err };
  }
  out.textContent = text;
  setResultEnabled(Boolean(text.trim()));
  return { ok: true };
}

// Autoformateo al elegir archivo (sin filtro)
fileInput?.addEventListener("change", async (e) => {
  const f = e.target.files[0];

  // reset UI
  const txt = document.getElementById("text");
  if (txt) txt.value = "";
  out.textContent = "";
  fileNameEl.textContent = f ? f.name : "No file selected";
  originalRaw = "";
  originalName = "";
  setResultEnabled(false);
  if (!f) return;

  // 1) Detecta tipo ANTES de construir la URL
  if (/\.ya?ml$/i.test(f.name)) setTypeIndicator("yaml");
  else if (/\.json$/i.test(f.name)) setTypeIndicator("json");
  else setTypeIndicator("json"); // fallback

  // 2) Envía al backend con el type correcto
  const fd = new FormData();
  fd.append("file", f);

  setLoading(true);
  try {
    const url = `/run?type=${currentType}`; // ← ya actualizado por setTypeIndicator
    const r = await fetch(url, { method: "POST", body: fd });
    const { ok, err } = await handleResponse(r);
    if (!ok) {
      out.textContent = `Error: ${err || "Invalid data"}`;
      setResultEnabled(false);
    }
  } finally {
    setLoading(false);
  }
});

// Clear input: limpia textarea + Result + cache + type indicator
document.getElementById("clear").onclick = () => {
  const txt = document.getElementById("text");
  if (txt) txt.value = "";
  out.textContent = "";
  fileInput.value = "";
  fileNameEl.textContent = "No file selected";
  originalRaw = "";
  originalName = "";
  setResultEnabled(false);
  updateButtons();
  // reset type pills
  pillJson?.classList.remove("active");
  pillYaml?.classList.remove("active");
};

// Clear Result: limpia Result + cache de archivo + type indicator
clearResultBtn.onclick = () => {
  setType(null);
  out.textContent = "";
  fileNameEl.textContent = "No file selected";
  fileInput.value = "";
  originalRaw = "";
  originalName = "";
  setResultEnabled(false);
  updateButtons();
  // reset type pills
  pillJson?.classList.remove("active");
  pillYaml?.classList.remove("active");
};

// Al escribir en el textarea, formatear automáticamente y mostrar en Result
const textArea = document.getElementById("text");

textArea.addEventListener("input", async () => {
  fileInput.value = "";
  fileNameEl.textContent = "No file selected";
  originalRaw = "";
  originalName = "";

  const raw = textArea.value.trim();
  if (!raw) {
    out.textContent = "";
    setResultEnabled(false);
    updateButtons();
    pillJson?.classList.remove("active");
    pillYaml?.classList.remove("active");
    return;
  }

  // Detección del tipo y activación de pastillas + estado
  const guess = detectType(raw);
  if (guess) setType(guess);

  setLoading(true);
  setResultEnabled(true);
  updateButtons();

  try {
    // Primer intento con el tipo actual
    const r1 = await fetch(`/run?type=${currentType}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: raw
    });
    const { ok: ok1, err: err1 } = await handleResponse(r1);

    if (!ok1) {
      const alt = currentType === "json" ? "yaml" : "json";
      const r2 = await fetch(`/run?type=${alt}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: raw
      });
      const { ok: ok2, err: err2 } = await handleResponse(r2);
      if (ok2) setType(alt);
      if (!ok2) {

        out.textContent = `Error: ${err1 || err2 || "Invalid data"}`;

        setResultEnabled(false);
      }
    }
  } catch (e) {
    out.textContent = `Error: ${e.message || "Invalid data"}`;
    setResultEnabled(false);
  } finally {
    setLoading(false);
    updateButtons();
  }
});

// Badge temporal para Copy/Download
function showBadge(btn, text, className = "badge") {
  const temp = document.createElement("div");
  temp.textContent = text;
  Object.assign(temp.style, {
    position: "absolute", top: "-22px", right: "0",
    background: "var(--primary)", color: "#fff",
    fontSize: "12px", padding: "2px 6px", borderRadius: "6px",
    opacity: "0", transform: "translateY(-4px)",
    transition: "opacity .2s ease, transform .2s ease",
    pointerEvents: "none", zIndex: "10",
  });
  btn.style.position = "relative";
  btn.appendChild(temp);
  requestAnimationFrame(() => { temp.style.opacity = "1"; temp.style.transform = "translateY(0)"; });
  setTimeout(() => {
    temp.style.opacity = "0";
    temp.style.transform = "translateY(-4px)";
    setTimeout(() => temp.remove(), 200);
  }, 1200);
}

// Download

downloadBtn.onclick = () => {
  if (downloadBtn.disabled) return;
  const txt = out.textContent || "";
  if (!txt.trim()) return;

  // Determinar tipo: preferir currentType, si no, detectar por contenido mostrado
  let t = currentType;
  if (!t) {
    const guess = detectType(txt);
    t = guess || 'json';
  }

  // Nombre base
  let base = "result";
  if (fileInput.files.length > 0) {
    const original = fileInput.files[0].name;
    base = original.replace(/\.[^/.]+$/, "") || "result";
  } else if (originalName) {
    base = originalName.replace(/\.[^/.]+$/, "") || "result";
  }

  // Extensión y MIME por tipo
  const ext = t === 'yaml' ? 'yaml' : 'json';
  const mime = t === 'yaml' ? 'text/yaml' : 'application/json';
  const fileName = `${base}.${ext}`;

  const blob = new Blob([txt], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showBadge(downloadBtn, "Saved", "saved-badge");
};
;

// Copy
copyBtn.onclick = () => {
  if (copyBtn.disabled) return;
  const txt = out.textContent || "";
  if (!txt.trim()) return;
  navigator.clipboard.writeText(txt)
    .then(() => showBadge(copyBtn, "Copied", "copied-badge"))
    .catch(() => console.error("Copy failed"));
};

// Spinner simple
function setLoading(is){ document.body.classList.toggle('loading', !!is); }

// Habilitar/deshabilitar botones de “Clear input” según haya algo que limpiar
function updateButtons() {
  const clearBtn = document.getElementById("clear");
  const txt = document.getElementById("text").value.trim();
  const hasFile = fileInput.files.length > 0;
  clearBtn.disabled = !(txt || hasFile);
}

// Estado inicial
updateButtons();
setResultEnabled(false);

initShare(out, setResultEnabled);
initAutoResize();

// ===== Type toggle wiring =====
document.getElementById('typeJson')?.addEventListener('click', ()=> setType('json'));
document.getElementById('typeYaml')?.addEventListener('click', ()=> setType('yaml'));
