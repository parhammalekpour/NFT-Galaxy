// Shared settings helper: applies saved settings globally (theme tokens) and sets basic UI state
(function(){
  const STORAGE_KEY = 'nftg_settings_v1';

  function loadSettings(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch(e){ return {}; }
  }

  function applyThemeTokens(isDark){
    const root = document.documentElement;
    if(isDark){
      root.classList.remove('theme-light'); root.classList.add('theme-dark');
      root.style.setProperty('--background-color','#0D1117');
      root.style.setProperty('--text-color','#E6EDF3');
      root.style.setProperty('--surface-color','#0f131a');
      root.style.setProperty('--navbar-background','#0b0e12');
      root.style.setProperty('--navbar-border','#1a1f24');
      root.style.setProperty('--card-border','rgba(255,255,255,0.06)');
      root.style.setProperty('--input-bg','#12171f');
      root.style.setProperty('--muted-text','#b0b9c5');
    } else {
      root.classList.remove('theme-dark'); root.classList.add('theme-light');
      root.style.setProperty('--background-color','#ffffff');
      root.style.setProperty('--text-color','#0D1117');
      root.style.setProperty('--surface-color','#ffffff');
      root.style.setProperty('--navbar-background','#ffffff');
      root.style.setProperty('--navbar-border','transparent');
      root.style.setProperty('--card-border','transparent');
      root.style.setProperty('--md-border','rgba(13,17,23,0.04)');
      root.style.setProperty('--input-bg','#ffffff');
      root.style.setProperty('--muted-text','#6c7480');
    }
  }

  function applyAll(){
    const s = loadSettings();
    applyThemeTokens(!!s.darkMode);
    // ensure any switches on the page reflect stored state
    document.querySelectorAll('.md-switch input[type="checkbox"]').forEach(input=>{
      const key = input.dataset.setting;
      if(key && s.hasOwnProperty(key)) input.checked = !!s[key];
      if(input.checked) input.setAttribute('aria-checked','true'); else input.setAttribute('aria-checked','false');
    });
  }

  // run as early as possible
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyAll);
  else applyAll();

  // expose for debugging/tests
  window.NFTG_Settings = { loadSettings, applyThemeTokens, applyAll };
})();
