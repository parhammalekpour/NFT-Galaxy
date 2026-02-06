
(function(){
  const KEY = 'nftg_cart_v1';

  function load(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e){ return {}; } }
  function save(obj){ localStorage.setItem(KEY, JSON.stringify(obj)); }

  function getCount(){ const c = load(); return Object.values(c).reduce((s,q)=>s+ (q||0), 0); }


  function keyOf(id){ return String(id); }

  function addToCart(id, qty=1){ if(id === undefined || id === null) return; const cart = load(); const k = keyOf(id); cart[k] = (cart[k] || 0) + qty; save(cart); console.debug('[Cart] add', k, 'qty', qty, 'cart', cart); document.dispatchEvent(new CustomEvent('cart:changed',{detail:{cart}})); }
  function removeFromCart(id){ const cart = load(); const k = keyOf(id); if(cart[k]){ delete cart[k]; save(cart); document.dispatchEvent(new CustomEvent('cart:changed',{detail:{cart}})); } }
  function setQty(id, qty){ const cart = load(); const k = keyOf(id); if(qty <= 0) delete cart[k]; else cart[k] = qty; save(cart); document.dispatchEvent(new CustomEvent('cart:changed',{detail:{cart}})); }
  function clearCart(){ localStorage.removeItem(KEY); document.dispatchEvent(new CustomEvent('cart:changed',{detail:{cart:{}}})); }

  function renderCart(){ const container = document.getElementById('cartItems'); const totalEl = document.getElementById('cartTotal'); if(!container || !totalEl) return; container.innerHTML = ''; const cart = load(); let total = 0; const ids = Object.keys(cart);
    if(!ids.length){ container.innerHTML = '<p style="color:var(--muted-text)">سبد خرید خالی است</p>'; totalEl.textContent = '0'; return; }

 
    const currencySet = new Set();

    ids.forEach(id => {
      const qty = Number(cart[id] || 0);

    
      let nft = null;
      if(typeof loadCreatedNfts === 'function'){
        const created = loadCreatedNfts(); nft = created.find(x => String(x.id) === String(id)) || null;
      }
      if(!nft && typeof getNftDataById === 'function') nft = getNftDataById(id) || null;
      if(!nft) return; 
      console.debug('[Cart] render item', String(id), nft);


      let priceValue = 0;
      if(nft.price !== undefined && nft.currency !== undefined){ priceValue = parseFloat(nft.price) || 0; if(nft.currency) currencySet.add(nft.currency); }
      else if(nft.price !== undefined){ priceValue = parseFloat(String(nft.price)) || 0; }
      else if(typeof nft.price === 'string'){ priceValue = parseFloat(nft.price) || 0; }

      total += priceValue * qty;

      const item = document.createElement('div'); item.className = 'cart-item';
      const img = document.createElement('img'); img.src = nft.image || nft.imageData || '';
      const info = document.createElement('div'); info.className = 'info';
      const name = document.createElement('div'); name.textContent = nft.name || id;
      const meta = document.createElement('div'); meta.style.fontSize='13px'; meta.style.color='var(--muted-text)';
      
      if(nft.price !== undefined && nft.currency) meta.textContent = String(nft.price) + ' ' + String(nft.currency);
      else meta.textContent = nft.price || '';
      info.appendChild(name); info.appendChild(meta);

      const controls = document.createElement('div'); controls.className = 'qty';
      const minus = document.createElement('button'); minus.textContent='-'; minus.onclick = ()=> setQty(id, Math.max(0, (load()[id]||0)-1));
      const num = document.createElement('div'); num.textContent = qty; num.style.minWidth='26px'; num.style.textAlign='center';
      const plus = document.createElement('button'); plus.textContent='+'; plus.onclick = ()=> setQty(id, (load()[id]||0)+1);
      const remove = document.createElement('button'); remove.textContent='حذف'; remove.style.marginLeft='6px'; remove.onclick = ()=> removeFromCart(id);
      controls.appendChild(minus); controls.appendChild(num); controls.appendChild(plus); controls.appendChild(remove);

      item.appendChild(img); item.appendChild(info); item.appendChild(controls);
      container.appendChild(item);
    });

    const currency = currencySet.size === 1 ? Array.from(currencySet)[0] : '';
    totalEl.textContent = total ? (total + (currency ? ' ' + currency : '')) : '0';
  }

  function openCart(){ const modal = document.getElementById('cartModal'); if(!modal) return; modal.classList.remove('hidden'); document.body.style.overflow='hidden'; renderCart(); }
  function closeCart(){ const modal = document.getElementById('cartModal'); if(!modal) return; modal.classList.add('hidden'); document.body.style.overflow=''; }

  async function checkout(){ const cart = load(); const ids = Object.keys(cart); if(!ids.length){ alert('سبد خرید خالی است'); return; }
    
    closeCart();

    if(ids.length > 1){ const okAll = confirm(`عملیات پرداخت برای ${ids.length} آیتم انجام می‌شود و ممکن است برای هر آیتم امضا درخواست شود. ادامه می‌دهید؟`); if(!okAll) return; }

    for(const id of ids){
    
      let nft = null;
      if(typeof loadCreatedNfts === 'function'){
        const created = loadCreatedNfts(); nft = created.find(x => x.id === id) || null;
      }
      if(!nft && typeof getNftDataById === 'function') nft = getNftDataById(id);
      if(!nft) continue;
      try{
       
        if(typeof handleBuyNow === 'function'){
         
          const ok = await handleBuyNow(nft, { openRating: false });
          if(ok) removeFromCart(id);
        }
      }catch(e){ console.error('Checkout item failed', e); }
    }
    renderCart();
  }


  document.addEventListener('cart:add', (e)=>{ const id = e && e.detail && e.detail.id; if(id) addToCart(id, 1); });
  document.addEventListener('cart:changed', ()=>{ const count = getCount(); const el = document.getElementById('cartCount'); if(el) el.textContent = count; renderCart(); });

  document.addEventListener('DOMContentLoaded', ()=>{
    const btn = document.getElementById('cartBtn'); if(btn) btn.addEventListener('click', openCart);
    const modal = document.getElementById('cartModal'); if(modal){ const overlay = modal.querySelector('.cart-modal-overlay'); const close = modal.querySelector('.cart-modal-close'); if(overlay) overlay.addEventListener('click', closeCart); if(close) close.addEventListener('click', closeCart); }
    const clearBtn = document.getElementById('clearCartBtn'); if(clearBtn) clearBtn.addEventListener('click', ()=>{ if(confirm('آیا می‌خواهید سبد خرید خالی شود؟')) clearCart(); });
    const checkoutBtn = document.getElementById('checkoutBtn'); if(checkoutBtn) checkoutBtn.addEventListener('click', checkout);
    
    document.dispatchEvent(new CustomEvent('cart:changed'));
  });

  window.NFTG_Cart = { addToCart, removeFromCart, setQty, clearCart, getCount };
})();
