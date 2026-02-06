(function(){
  const KEY = 'nftg_favorites_v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch(e){ return []; }
  }

  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function getSet() { return new Set(load()); }

  function isFavorited(id){ if(!id) return false; return getSet().has(id); }

  function toggle(id){
    if(!id) return false;
    const s = getSet();
    if(s.has(id)) s.delete(id); else s.add(id);
    save(Array.from(s));
    document.dispatchEvent(new CustomEvent('favorites:changed', { detail: { id, state: s.has(id) } }));
    return s.has(id);
  }

  function updateButton(btn, state){
    if(!btn) return;
    btn.classList.toggle('favorited', !!state);
    btn.setAttribute('aria-pressed', !!state ? 'true' : 'false');
  }

  function refreshButtons(root=document){
    const buttons = root.querySelectorAll('.favorite-btn');
    buttons.forEach(b => {
      const id = b.dataset.nftId || b.getAttribute('data-nft-id');
      updateButton(b, isFavorited(id));
    });
  }

 
  function list(){ return load(); }

  
  document.addEventListener('click', (ev)=>{
    const btn = ev.target.closest && ev.target.closest('.favorite-btn');
    if(!btn) return;
    ev.stopPropagation();
    const id = btn.dataset.nftId || btn.getAttribute('data-nft-id');
    const newState = toggle(id);
    updateButton(btn, newState);
    
    try {
      const path = window.location.pathname || '';
      const onProfile = path.endsWith('profile.html') || path.endsWith('/profile.html') || window.location.hash === '#favorites';
      if (onProfile) {
        const favEl = document.getElementById('favoritesList');
        if (favEl) favEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        
        window.location.href = './profile.html#favorites';
      }
    } catch (e) { }
  }, true);

  document.addEventListener('DOMContentLoaded', ()=>{
    refreshButtons();
  });

 
  document.addEventListener('nfts:rendered', (e)=>{
    refreshButtons();
  });

 
  window.NFTG_Favorites = { isFavorited, toggle, refreshButtons, list };
})();
