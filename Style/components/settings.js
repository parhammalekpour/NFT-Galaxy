
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
    // if user hasn't chosen a theme, respect OS preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = (s.hasOwnProperty('darkMode')) ? !!s.darkMode : prefersDark;
    applyThemeTokens(isDark);
    
    document.querySelectorAll('.md-switch input[type="checkbox"]').forEach(input=>{
      const key = input.dataset.setting;
      if(key && s.hasOwnProperty(key)) input.checked = !!s[key];
      if(input.checked) input.setAttribute('aria-checked','true'); else input.setAttribute('aria-checked','false');
    });
  }

 
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyAll);
  else applyAll();

  // Listen for storage changes from other tabs/windows and apply them live
  window.addEventListener('storage', function(e){
    try{
      if(!e.key) return;
      if(e.key !== STORAGE_KEY) return;
      const newSettings = JSON.parse(e.newValue || '{}');
      // update theme tokens
      applyThemeTokens(!!newSettings.darkMode);
      // update any switches on the current page
      document.querySelectorAll('.md-switch input[type="checkbox"]').forEach(input=>{
        const key = input.dataset.setting;
        if(key && newSettings.hasOwnProperty(key)) input.checked = !!newSettings[key];
        input.setAttribute('aria-checked', input.checked ? 'true' : 'false');
      });
    }catch(err){ /* ignore malformed storage payloads */ }
  });

  
  window.NFTG_Settings = { loadSettings, applyThemeTokens, applyAll };
})();

// Settings switches: persist in localStorage, apply immediately
(function(){
  const STORAGE_KEY = 'nftg_settings_v1';

  function loadSettings(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch(e){ return {}; }
  }

  function saveSettings(obj){ localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); }

  function showToast(msg){
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(()=> t.classList.remove('show'), 2200);
  }

  function applySetting(key, value){
    // immediate actions for demo
    if(key === 'notifications'){
      showToast(value ? '✅ اعلان‌ها فعال شد' : '🔕 اعلان‌ها غیرفعال شد');
    }
    if(key === 'autoPlay'){
      showToast(value ? '▶️ پخش خودکار فعال شد' : '⏸️ پخش خودکار غیرفعال شد');
    }
    if(key === 'darkMode'){
      // delegate to global theme applier so tokens are consistent across pages
      if(window.NFTG_Settings && typeof window.NFTG_Settings.applyThemeTokens === 'function'){
        window.NFTG_Settings.applyThemeTokens(!!value);
      }
      showToast(value ? '🌙 حالت تیره فعال شد' : '🌤️ حالت روشن فعال شد');
    }
  }

  // initialize inputs
  const settings = loadSettings();
  document.querySelectorAll('.md-switch input[type="checkbox"]').forEach(input=>{
    const key = input.dataset.setting;
    // set initial checked state from storage
    if(key && settings.hasOwnProperty(key)){
      input.checked = !!settings[key];
    }
    input.setAttribute('aria-checked', input.checked ? 'true' : 'false');

    input.addEventListener('change', e=>{
      const val = !!input.checked;
      input.setAttribute('aria-checked', val ? 'true' : 'false');
      if(key){
        settings[key] = val; saveSettings(settings); applySetting(key, val);
      }
    });
  });

  // apply any initial settings after load
  Object.keys(settings).forEach(k => applySetting(k, settings[k]));
  // ensure global theme tokens are applied as well
  if(window.NFTG_Settings && typeof window.NFTG_Settings.applyThemeTokens === 'function'){
    window.NFTG_Settings.applyThemeTokens(!!settings.darkMode);
  }
})();
