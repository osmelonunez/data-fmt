export function initShare(outEl, setResultEnabled){
  const btnShare = document.getElementById('share');
  const API = '';

  btnShare?.addEventListener('click', async () => {
    try{
      const res = await fetch(`${API}/share`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ data: outEl.textContent })
      });
      if(!res.ok) throw new Error('share failed');
      const { id } = await res.json();
      const url = `${location.origin}${location.pathname}#id=${id}`;
      await navigator.clipboard.writeText(url);
      btnShare.classList.add('show-badge');
      setTimeout(()=> btnShare.classList.remove('show-badge'), 1200);
    }catch(e){
      console.error(e);
    }
  });

  window.addEventListener('DOMContentLoaded', async ()=>{
    const m = location.hash.match(/#id=([\w-]+)/);
    if(!m) return;
    try{
      const res = await fetch(`${API}/share/${m[1]}`);
      if(!res.ok) return;
      const { data } = await res.json();
      outEl.textContent = data || '';
      setResultEnabled(!!data?.trim?.());
    }catch(e){
      console.error(e);
    }
  });
}
