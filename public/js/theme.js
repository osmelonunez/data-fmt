export function initTheme(){
  const root = document.documentElement;
  const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const btnSystem = document.getElementById('themeSystem');
  const btnDark = document.getElementById('themeDark');
  const btnLight = document.getElementById('themeLight');

  function apply(theme){
    localStorage.setItem('theme', theme);
    root.dataset.theme = theme;
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

  systemQuery.addEventListener('change', e => {
    if(localStorage.getItem('theme') === 'system'){
      setDark(e.matches);
    }
  });

  btnSystem?.addEventListener('click', ()=>apply('system'));
  btnDark?.addEventListener('click', ()=>apply('dark'));
  btnLight?.addEventListener('click', ()=>apply('light'));

  const saved = localStorage.getItem('theme') || 'system';
  apply(saved);
}
