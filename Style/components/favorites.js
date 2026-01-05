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

  // return list of favorite ids
  function list(){ return load(); }

  // Event delegation for clicks (works for dynamic content)
  document.addEventListener('click', (ev)=>{
    const btn = ev.target.closest && ev.target.closest('.favorite-btn');
    if(!btn) return;
    ev.stopPropagation();
    const id = btn.dataset.nftId || btn.getAttribute('data-nft-id');
    const newState = toggle(id);
    updateButton(btn, newState);
    // After toggling a favorite, navigate the user to the profile favorites section
    try {
      const path = window.location.pathname || '';
      const onProfile = path.endsWith('profile.html') || path.endsWith('/profile.html') || window.location.hash === '#favorites';
      if (onProfile) {
        const favEl = document.getElementById('favoritesList');
        if (favEl) favEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        // navigate to profile and open favorites
        window.location.href = './profile.html#favorites';
      }
    } catch (e) { /* ignore navigation errors */ }
  }, true);

  document.addEventListener('DOMContentLoaded', ()=>{
    refreshButtons();
  });

  // When new NFTs are rendered, refresh
  document.addEventListener('nfts:rendered', (e)=>{
    refreshButtons();
  });

  // expose helpers for other modules
  window.NFTG_Favorites = { isFavorited, toggle, refreshButtons, list };
})();
