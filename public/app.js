const out = document.getElementById("out");
const fileInput = document.getElementById("file");
const fileNameEl = document.getElementById("fileName");
const downloadBtn = document.getElementById("download");
const copyBtn = document.getElementById("copy");
const clearResultBtn = document.getElementById("clearResult");
const shareBtn = document.getElementById("share");

const pillJson = document.querySelector('.type-pill.json');
const pillYaml = document.querySelector('.type-pill.yaml');

function setTypeIndicator(type){
  pillJson?.classList.remove('active');
  pillYaml?.classList.remove('active');
  if(type === 'json') pillJson?.classList.add('active');
  if(type === 'yaml') pillYaml?.classList.add('active');
}


// Estado del tipo de dato actual
let currentType = 'json';

function setType(t){
  currentType = t;
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
    try { const j = JSON.parse(text); out.textContent = "Error: " + (j.error || text); }
    catch { out.textContent = `HTTP ${r.status}: ${text}`; }
    setResultEnabled(false);
    return false;
  }
  out.textContent = text;
  setResultEnabled(Boolean(text.trim()));
  return true;
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
    await handleResponse(r);
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

  // Try JSON pretty locally
  try {
    const parsed = JSON.parse(raw);
    out.textContent = JSON.stringify(parsed, null, 2);
    setResultEnabled(true);
    setTypeIndicator("json");
    updateButtons();
    return;
  } catch {}

  // Fallback: treat as YAML via backend
  try {
    setLoading(true);
    const r = await fetch(`/run?type=yaml`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: raw
    });
    const ok = await handleResponse(r);
    setTypeIndicator(ok ? "yaml" : "json");
  } catch (e) {
    out.textContent = "⚠️ Invalid data";
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
  let baseName = "result.json";
  if (fileInput.files.length > 0) {
    const original = fileInput.files[0].name;
    const withoutExt = original.replace(/\.[^/.]+$/, "");
    const ext = original.includes(".") ? original.split(".").pop() : "json";
    baseName = `format_${withoutExt}.${ext}`;
  }
  const blob = new Blob([txt], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = baseName;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showBadge(downloadBtn, "Saved", "saved-badge");
};

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


// ===== Theme control =====
(function(){
  const root = document.documentElement;
  const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const btnSystem = document.getElementById('themeSystem');
  const btnDark = document.getElementById('themeDark');
  const btnLight = document.getElementById('themeLight');

  function apply(theme){
    localStorage.setItem('theme', theme);
    root.dataset.theme = theme; // optional hook
    if(theme === 'system'){
      setDark(systemQuery.matches);
    }else if(theme === 'dark'){
      setDark(true);
    }else{
      setDark(false);
    }
    updatePressed(theme);
  }

  function setDark(on){
    root.classList.toggle('dark', !!on);
  }

  function updatePressed(theme){
    [btnSystem, btnDark, btnLight].forEach(b=> b && b.setAttribute('aria-pressed','false'));
    const map = {system:btnSystem, dark:btnDark, light:btnLight};
    if(map[theme]) map[theme].setAttribute('aria-pressed','true');
  }

  // listen to system changes when on system mode
  systemQuery.addEventListener('change', e => {
    if(localStorage.getItem('theme') === 'system'){
      setDark(e.matches);
    }
  });

  // wire buttons
  btnSystem?.addEventListener('click', ()=>apply('system'));
  btnDark?.addEventListener('click', ()=>apply('dark'));
  btnLight?.addEventListener('click', ()=>apply('light'));

  // initial
  const saved = localStorage.getItem('theme') || 'system';
  apply(saved);
})();

// ===== Share link via backend =====
(function(){
  const btnShare = document.getElementById('share');
  const out = document.getElementById('out');

  // API siempre en el mismo origen/puerto que la UI
  const API = '';

  btnShare?.addEventListener('click', async () => {
    try{
      const res = await fetch(`${API}/share`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ data: out.textContent })
      });
      if(!res.ok) throw new Error('share failed');
      const { id } = await res.json();
      const url = `${location.origin}${location.pathname}#id=${id}`;
      await navigator.clipboard.writeText(url);
    
      // Mostrar badge en el botón
      btnShare.classList.add('show-badge');
      setTimeout(()=> btnShare.classList.remove('show-badge'), 1200);
    }catch(e){
      console.error(e);
    }
  });

  // Cargar por id si existe en el hash
  window.addEventListener('DOMContentLoaded', async ()=>{
    const m = location.hash.match(/#id=([\w-]+)/);
    if(!m) return;
    try{
      const res = await fetch(`${API}/share/${m[1]}`);
      if(!res.ok) return;
      const { data } = await res.json();
      out.textContent = data || '';
      setResultEnabled(!!data?.trim?.());
    }catch(e){ 
      console.error(e); 
    }
  });
})();


// ===== Type toggle wiring =====
document.getElementById('typeJson')?.addEventListener('click', ()=> setType('json'));
document.getElementById('typeYaml')?.addEventListener('click', ()=> setType('yaml'));

// Initial type
setType('json');
