(function(){
  const KEY = 'nftg_ratings_v1';

  function load(){
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch(e){ return {}; }
  }
  function save(obj){ localStorage.setItem(KEY, JSON.stringify(obj)); }

  function getScores(id){ if(!id) return []; const all = load(); return all[id] || []; }
  function getAverage(id){ const s = getScores(id); if(!s.length) return { avg:0, count:0 }; const sum = s.reduce((a,b)=>a+b,0); return { avg: sum / s.length, count: s.length }; }

  function addRating(id, score){ if(!id || !score) return; const all = load(); all[id] = all[id] || []; all[id].push(score); save(all); const data = getAverage(id); document.dispatchEvent(new CustomEvent('ratings:changed', { detail: { id, avg: data.avg, count: data.count } })); return data; }


  function starSvg(){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path></svg>'; }

  function renderStaticStars(container, id){
    if(!container) return;
   
    if(!container.classList.contains('rating-widget')) container.classList.add('rating-widget');
    const data = getAverage(id);
    container.innerHTML = '';
    const score = Math.round(data.avg);
    for(let i=1;i<=5;i++){
      const s = document.createElement('span'); s.className = 'star' + (i<=score ? ' filled': ''); s.innerHTML = starSvg(); container.appendChild(s);
    }
    const info = document.createElement('span'); info.className = 'rating-info'; info.style.marginLeft='8px'; info.textContent = data.count ? Math.round(data.avg*10)/10 + ' ('+data.count+')' : 'بدون امتیاز'; container.appendChild(info);
  }

  function renderInteractive(container, id){
    if(!container) return;
    container.innerHTML = '';
    const prompt = document.createElement('div'); prompt.className = 'rate-prompt';
    const label = document.createElement('div'); label.textContent = 'امتیاز شما:';
    label.style.marginBottom = '6px';
    prompt.appendChild(label);

    const starsWrap = document.createElement('div');
    starsWrap.setAttribute('role','radiogroup');
    for(let i=1;i<=5;i++){
      const s = document.createElement('button');
      s.className = 'star';
      s.dataset.value = i;
      s.innerHTML = starSvg();
      s.setAttribute('aria-label', i + ' ستاره');
      s.setAttribute('role','radio');
      s.setAttribute('tabindex','0');
      s.addEventListener('mouseenter', ()=> highlight(starsWrap, i));
      s.addEventListener('mouseleave', ()=> highlight(starsWrap, 0));
      s.addEventListener('click', async (e)=>{
        const v = Number(e.currentTarget.dataset.value || 0);
        addRating(id, v);
       
        prompt.innerHTML = '<div class="thankyou">از امتیاز شما متشکریم ✅</div>';
        
        document.dispatchEvent(new CustomEvent('ratings:changed', { detail: { id } }));
      });
      s.addEventListener('keydown', (ev)=>{ if(ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); s.click(); } });
      starsWrap.appendChild(s);
    }
    prompt.appendChild(starsWrap);
    container.appendChild(prompt);

    function highlight(root, upto){ Array.from(root.children).forEach((el,idx)=>{ if(idx < upto) el.classList.add('filled'); else el.classList.remove('filled'); }); }
  }

 
  document.addEventListener('nfts:rendered', ()=>{
    document.querySelectorAll('.rating-widget').forEach(el => {
      const id = el.dataset.nftId || el.getAttribute('data-nft-id');
      renderStaticStars(el, id);
    });
  });

  
  document.addEventListener('ratings:changed', (e)=>{
    const id = e.detail && e.detail.id;
    document.querySelectorAll('.rating-widget').forEach(el => { if(el.dataset.nftId === id) renderStaticStars(el, id); });
    
    const modal = document.getElementById('modalRating'); if(modal && id){ renderStaticStars(modal, id); }
  });

  function openRatingInModal(nft){
    const container = document.getElementById('modalRating');
    if(!container) return;
    
    container.innerHTML = '';
    renderInteractive(container, nft.id || nft);
    
    const modal = document.getElementById('nftModal'); if(modal) modal.classList.remove('hidden');
  }

  
  window.NFTG_Ratings = { addRating, getAverage, openRatingInModal };

  
  document.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll('.rating-widget').forEach(el => {
      const id = el.dataset.nftId || el.getAttribute('data-nft-id');
      renderStaticStars(el, id);
    });
  });
})();
