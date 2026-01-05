/* nft-app.js - Consolidated & fixed version */

/* -------------------------
   Helpers (single source)
   ------------------------- */

const STORAGE_KEY_NFTS = 'createdNfts';
const STORAGE_KEY_PROFILE = 'userProfile';
const STORAGE_KEY_WALLET = 'walletAddress';

function shortAddress(addr) {
  if (!addr || typeof addr !== 'string') return '';
  if (addr.length < 10) return addr;
  return addr.substring(0, 6) + '...' + addr.slice(-4);
}

function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/[^a-z0-9\u0600-\u06FF-]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

function safeGet(id) {
  return document.getElementById(id) || null;
}

/* -------------------------
   Wallet connect / UI
   ------------------------- */

const connectButton = safeGet('connectWallet');
const walletDropdown = safeGet('walletDropdown');
const logoutButton = safeGet('logoutWallet');
const walletAddressText = safeGet('walletAddressText');

async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    alert('🦊 Please install MetaMask to connect your wallet!');
    return null;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const walletAddress = accounts && accounts[0];
    if (!walletAddress) throw new Error('No accounts returned');

    const shortAddr = shortAddress(walletAddress);
    if (connectButton) {
      connectButton.textContent = shortAddr;
      connectButton.classList.add('connected');
      connectButton.style.backgroundColor = '#6F42C1';
    }
    if (walletAddressText) walletAddressText.textContent = shortAddr;
    if (walletDropdown) walletDropdown.classList.remove('hidden');

    localStorage.setItem(STORAGE_KEY_WALLET, walletAddress);
    console.log('✅ Wallet connected:', walletAddress);
    return walletAddress;
  } catch (error) {
    console.error('❌ Connection rejected:', error);
    return null;
  }
}

function disconnectWalletUI() {
  localStorage.removeItem(STORAGE_KEY_WALLET);
  if (connectButton) {
    connectButton.textContent = 'Connect Wallet';
    connectButton.classList.remove('connected');
    connectButton.style.backgroundColor = '';
  }
  if (walletAddressText) walletAddressText.textContent = '';
  if (walletDropdown) {
    walletDropdown.classList.add('hidden');
  }
  console.log('🚪 Wallet disconnected.');
}

/* -------------------------
   Sign helpers
   ------------------------- */

async function signCreateMessage(nftData) {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed.');
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const address = accounts[0];

  const message = `
NFT Galxe - Create NFT

Name: ${nftData.name}
Chain: ${nftData.chain}
Price: ${nftData.price} ${nftData.currency}
For sale: ${nftData.forSale ? 'Yes' : 'No'}

By signing, you confirm this listing.
  `.trim();

  // personal_sign expects [message, address]
  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [message, address],
  });

  return { address, signature };
}

async function confirmDeleteWithWallet() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed.');
  }

  const storedWallet = localStorage.getItem(STORAGE_KEY_WALLET);
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const currentAddress = accounts[0];

  if (storedWallet && storedWallet.toLowerCase() !== currentAddress.toLowerCase()) {
    throw new Error('Connected wallet does not match the profile wallet.');
  }

  const addressToUse = storedWallet || currentAddress;

  const message = `
NFT Galxe - Delete Account Confirmation

Wallet: ${addressToUse}

By signing this message, you confirm that you want to delete
your profile, NFTs, and wallet data from this browser (local demo only).
  `.trim();

  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [message, addressToUse],
  });

  return { address: addressToUse, signature };
}

/* -------------------------
   Local storage helpers
   ------------------------- */

function loadCreatedNfts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NFTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCreatedNfts(list) {
  localStorage.setItem(STORAGE_KEY_NFTS, JSON.stringify(list));
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
}

/* -------------------------
   Create NFT page logic
   ------------------------- */

const createForm = safeGet('createNftForm');
const imageInput = safeGet('nftImage');
const previewContainer = safeGet('imagePreview');
const previewImg = safeGet('previewImg');
const statusEl = safeGet('createStatus');
const createdNftList = safeGet('createdNftList');

function setStatus(message, type = '') {
  if (!statusEl) return;
  statusEl.textContent = message || '';
  statusEl.classList.remove('success', 'error');
  if (type) statusEl.classList.add(type);
}

function resetPreview() {
  if (!previewContainer || !previewImg) return;
  const placeholder = previewContainer.querySelector('.image-preview-placeholder');
  if (placeholder) placeholder.style.display = 'block';
  previewImg.src = '';
  previewImg.style.display = 'none';
}

if (imageInput) {
  imageInput.addEventListener('change', () => {
    const file = imageInput.files && imageInput.files[0];
    if (!file) {
      resetPreview();
      return;
    }

    if (!file.type.startsWith('image/')) {
      setStatus('Please upload a valid image file.', 'error');
      imageInput.value = '';
      resetPreview();
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const placeholder = previewContainer ? previewContainer.querySelector('.image-preview-placeholder') : null;
      if (placeholder) placeholder.style.display = 'none';
      if (previewImg) {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderCreatedNfts() {
  if (!createdNftList) return;
  const nfts = loadCreatedNfts();
  createdNftList.innerHTML = '';

  if (!nfts.length) {
    const empty = document.createElement('p');
    empty.textContent = 'You have not created any NFTs yet.';
    empty.style.fontSize = '13px';
    empty.style.color = '#b0b9c5';
    createdNftList.appendChild(empty);
    return;
  }

  nfts.forEach(nft => {
    const card = document.createElement('article');
    card.className = 'created-nft-card';
    if (nft.id) card.setAttribute('data-nft-id', nft.id);

    const favBtn = document.createElement('button');
    favBtn.className = 'favorite-btn';
    favBtn.setAttribute('aria-pressed', 'false');
    favBtn.setAttribute('title', 'علاقه‌مندی');
    if (nft.id) favBtn.dataset.nftId = nft.id;
    favBtn.innerHTML = ` <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.8 7.6a5.4 5.4 0 0 0-7.6 0L12 8.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-4.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6z"></path></svg>`;
    card.appendChild(favBtn);

    const img = document.createElement('img');
    img.src = nft.imageData;
    img.alt = nft.name || 'NFT Image';

    const nameEl = document.createElement('h4');
    nameEl.className = 'created-nft-name';
    nameEl.textContent = nft.name;

    const metaEl = document.createElement('p');
    metaEl.className = 'created-nft-meta';
    metaEl.textContent = `${nft.chain} • ${nft.forSale ? 'For sale' : 'Not for sale'} • Creator: ${shortAddress(nft.creator)}`;

    const priceEl = document.createElement('span');
    priceEl.className = 'created-nft-price';
    priceEl.textContent = `${nft.price} ${nft.currency || ''}`;

    const descEl = document.createElement('p');
    descEl.className = 'created-nft-meta';
    descEl.textContent = nft.description || '';

    card.appendChild(img);
    card.appendChild(nameEl);
    card.appendChild(metaEl);
    card.appendChild(priceEl);
    card.appendChild(descEl);

    createdNftList.appendChild(card);
  });
  // notify other components that NFTs were (re)rendered
  document.dispatchEvent(new Event('nfts:rendered'));
}

if (createForm) {
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    const file = imageInput && imageInput.files && imageInput.files[0];
    if (!file) {
      setStatus('Please upload an image for your NFT.', 'error');
      return;
    }

    const name = (safeGet('nftName') && safeGet('nftName').value.trim()) || '';
    const description = (safeGet('nftDescription') && safeGet('nftDescription').value.trim()) || '';
    const chain = (safeGet('nftChain') && safeGet('nftChain').value) || '';
    const price = (safeGet('nftPrice') && safeGet('nftPrice').value) || '';
    const currency = (safeGet('nftCurrency') && safeGet('nftCurrency').value) || '';
    const forSale = (safeGet('putForSale') && safeGet('putForSale').checked) || false;

    if (!name || !description || !chain || !price) {
      setStatus('Please fill in all required fields.', 'error');
      return;
    }

    if (typeof window.ethereum === 'undefined') {
      setStatus('MetaMask not found. Please install it and connect your wallet.', 'error');
      return;
    }

    setStatus('Preparing NFT and requesting wallet signature...', '');

    try {
      const imageData = await fileToBase64(file);

      const nftDraft = {
        name,
        description,
        chain,
        price,
        currency,
        forSale,
        imageData,
      };

      const { address } = await signCreateMessage(nftDraft);

      const existing = loadCreatedNfts();
      const id = `${slugify(name)}-${Date.now() % 1000000}`;
      existing.push({
        id,
        ...nftDraft,
        creator: address,
        createdAt: Date.now(),
      });
      saveCreatedNfts(existing);

      renderCreatedNfts();

      createForm.reset();
      if (imageInput) imageInput.value = '';
      resetPreview();

      setStatus('✅ NFT created and signed successfully (local demo).', 'success');
    } catch (err) {
      console.error(err);
      setStatus('Signature cancelled or failed. NFT was not created.', 'error');
    }
  });
}

/* -------------------------
   Profile logic
   ------------------------- */

function setProfileStatus(message, type = '') {
  const profileStatusEl = safeGet('profileStatus');
  if (!profileStatusEl) return;
  profileStatusEl.textContent = message || '';
  profileStatusEl.classList.remove('success', 'error');
  if (type) profileStatusEl.classList.add(type);
}

function updateAvatar(profile) {
  const avatarImg = safeGet('avatarImg');
  const avatarInitials = safeGet('avatarInitials');
  if (!avatarImg || !avatarInitials) return;

  if (profile && profile.avatarData) {
    avatarImg.src = profile.avatarData;
    avatarImg.style.display = 'block';
    avatarInitials.style.display = 'none';
  } else {
    avatarImg.src = '';
    avatarImg.style.display = 'none';

    const name = profile && profile.name ? profile.name.trim() : '';
    const initials = name
      ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
      : 'NG';
    avatarInitials.textContent = initials;
    avatarInitials.style.display = 'block';
  }
}

function updateWalletInProfile() {
  const profileWalletAddressEl = safeGet('profileWalletAddress');
  if (!profileWalletAddressEl) return;
  const storedWallet = localStorage.getItem(STORAGE_KEY_WALLET);
  profileWalletAddressEl.textContent = storedWallet ? shortAddress(storedWallet) : 'Not connected';
}

function getNftsForSale() {
  const nfts = loadCreatedNfts();
  return nfts.filter(nft => nft.forSale === true);
}

function renderNftsForSale() {
  const profileNftList = safeGet('profileNftList');
  if (!profileNftList) return;

  const nfts = getNftsForSale();
  profileNftList.innerHTML = '';

  if (!nfts.length) {
    const empty = document.createElement('p');
    empty.className = 'profile-nft-empty';
    empty.textContent = 'You don\'t have any NFTs listed for sale yet.';
    profileNftList.appendChild(empty);
    return;
  }

  nfts.forEach(nft => {
    const card = document.createElement('article');
    card.className = 'profile-nft-card';

    const img = document.createElement('img');
    img.src = nft.imageData;
    img.alt = nft.name || 'NFT Image';

    const nameEl = document.createElement('h4');
    nameEl.className = 'profile-nft-name';
    nameEl.textContent = nft.name || 'Untitled NFT';

    const metaEl = document.createElement('p');
    metaEl.className = 'profile-nft-meta';
    metaEl.textContent = `${nft.chain} • Creator: ${shortAddress(nft.creator)}`;

    const priceEl = document.createElement('span');
    priceEl.className = 'profile-nft-price';
    priceEl.textContent = `${nft.price} ${nft.currency || ''}`;

    const descEl = document.createElement('p');
    descEl.className = 'profile-nft-meta';
    descEl.textContent = nft.description || '';

    card.appendChild(img);
    card.appendChild(nameEl);
    card.appendChild(metaEl);
    card.appendChild(priceEl);
    card.appendChild(descEl);

    profileNftList.appendChild(card);
  });
}

/* -------------------------
   Marketplace logic
   ------------------------- */

const marketplaceGrid = safeGet('marketplaceGrid');
const emptyState = safeGet('emptyState');
const nftCountEl = safeGet('nftCount');
const searchInput = safeGet('searchInput');
const applyFiltersBtn = safeGet('applyFilters');
const clearFiltersBtn = safeGet('clearFilters');
const sortBySelect = safeGet('sortBy');

const nftModal = safeGet('nftModal');
const modalOverlay = nftModal ? nftModal.querySelector('.nft-modal-overlay') : null;
const modalClose = nftModal ? nftModal.querySelector('.nft-modal-close') : null;
const modalImage = safeGet('modalImage');
const modalContent = nftModal ? nftModal.querySelector('.nft-modal-content') : null;
const modalName = safeGet('modalName');
const modalCreator = safeGet('modalCreator');
const modalChain = safeGet('modalChain');
const modalDescription = safeGet('modalDescription');
const modalPrice = safeGet('modalPrice');
const buyNowBtn = safeGet('buyNowBtn');

function getActiveFilters() {
  const statusFilters = Array.from(
    document.querySelectorAll('input[name="status"]:checked')
  ).map(el => el.value);

  const chainFilters = Array.from(
    document.querySelectorAll('input[name="chain"]:checked')
  ).map(el => el.value);

  const minPrice = parseFloat((safeGet('minPrice') && safeGet('minPrice').value) || '') || 0;
  const maxPriceValue = (safeGet('maxPrice') && safeGet('maxPrice').value) || '';
  const maxPrice = maxPriceValue === '' ? Infinity : parseFloat(maxPriceValue);

  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const sortBy = sortBySelect ? sortBySelect.value : 'newest';

  return {
    statusFilters,
    chainFilters,
    minPrice,
    maxPrice,
    searchQuery,
    sortBy
  };
}

function filterAndSortNfts(nfts) {
  const filters = getActiveFilters();

  let filtered = nfts.filter(nft => {
    // Status filter
    if (filters.statusFilters.length > 0) {
      if (filters.statusFilters.includes('forSale') && !nft.forSale) return false;
      if (filters.statusFilters.includes('notForSale') && nft.forSale) return false;
    }

    // Chain filter
    if (filters.chainFilters.length > 0) {
      if (!filters.chainFilters.includes(nft.chain)) return false;
    }

    const priceValue = parseFloat(nft.price) || 0;
    if (priceValue < filters.minPrice || priceValue > filters.maxPrice) {
      return false;
    }

    // Search filter
    if (filters.searchQuery) {
      const nameMatch = (nft.name || '').toLowerCase().includes(filters.searchQuery);
      const creatorMatch = (nft.creator || '').toLowerCase().includes(filters.searchQuery);
      const descMatch = (nft.description || '').toLowerCase().includes(filters.searchQuery);
      if (!nameMatch && !creatorMatch && !descMatch) return false;
    }

    return true;
  });

  switch (filters.sortBy) {
    case 'newest':
      filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      break;
    case 'oldest':
      filtered.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      break;
    case 'price-low':
      filtered.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
      break;
    case 'price-high':
      filtered.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
      break;
  }

  return filtered;
}

function loadAllNfts() {
  return loadCreatedNfts();
}

function renderNfts() {
  if (!marketplaceGrid) return;
  const allNfts = loadAllNfts();
  const filtered = filterAndSortNfts(allNfts);

  marketplaceGrid.innerHTML = '';

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (nftCountEl) nftCountEl.textContent = 'هیچ NFT یافت نشد';
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (nftCountEl) nftCountEl.textContent = `${filtered.length} NFT یافت شد`;

  filtered.forEach((nft) => {
    const card = document.createElement('article');
    card.className = 'marketplace-card';
    if (nft.id) card.setAttribute('data-nft-id', nft.id);

    // favorite button
    const favBtn = document.createElement('button');
    favBtn.className = 'favorite-btn';
    favBtn.setAttribute('aria-pressed', 'false');
    favBtn.setAttribute('title', 'علاقه‌مندی');
    if (nft.id) favBtn.dataset.nftId = nft.id;
    favBtn.innerHTML = ` <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.8 7.6a5.4 5.4 0 0 0-7.6 0L12 8.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-4.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6z"></path></svg>`;
    card.appendChild(favBtn);

    const imageDiv = document.createElement('div');
    imageDiv.className = 'marketplace-card-image';
    const img = document.createElement('img');
    img.src = nft.imageData;
    img.alt = nft.name || '';
    imageDiv.appendChild(img);

    const nameEl = document.createElement('h3');
    nameEl.className = 'marketplace-card-name';
    nameEl.textContent = nft.name || '';

    const creatorEl = document.createElement('p');
    creatorEl.className = 'marketplace-card-creator';
    creatorEl.textContent = `سازنده: ${shortAddress(nft.creator)}`;

    const footer = document.createElement('div');
    footer.className = 'marketplace-card-footer';

    const priceEl = document.createElement('span');
    priceEl.className = 'marketplace-card-price';
    priceEl.textContent = `${nft.price} ${nft.currency || ''}`;

    footer.appendChild(priceEl);
    // Note: per-user request we do NOT show rating or an add-to-cart button on the card.
    // Ratings are shown in the modal only; add-to-cart is available from the modal to avoid confusion.

    card.appendChild(imageDiv);
    card.appendChild(nameEl);
    card.appendChild(creatorEl);
    card.appendChild(footer);

    card.addEventListener('click', () => openNftModal(nft));

    marketplaceGrid.appendChild(card);
  });
  // notify other components that NFTs were (re)rendered
  document.dispatchEvent(new Event('nfts:rendered'));
}

// Helper to find NFT data by id from created list or the static DOM
function getNftDataById(id) {
  if (!id && id !== 0) return null;
  // normalize id to string for reliable comparisons
  const idStr = String(id);

  // prefer created NFTs (local objects)
  const created = loadCreatedNfts();
  const found = created.find(n => String(n.id) === idStr);
  if (found) {
    return {
      id: found.id,
      name: found.name || 'Untitled NFT',
      image: found.imageData || '',
      // expose price and currency separately so other components can parse
      price: found.price !== undefined ? String(found.price) : undefined,
      currency: found.currency || undefined,
      creator: shortAddress(found.creator || ''),
      chain: found.chain || ''
    };
  }

  // try to extract from an element with matching data-nft-id
  try {
    // prefer an exact attribute match - use querySelector for performance
    const escaped = idStr.replace(/"/g, '\\"');
    const el = document.querySelector(`[data-nft-id="${escaped}"]`);
    if (el) {
      const img = el.querySelector('img');
      // try multiple name/price selectors for various card types
      const nameEl = el.querySelector('h3, h4, .created-nft-name, .profile-nft-name');
      const priceEl = el.querySelector('.nft-price, .marketplace-card-price, .created-nft-price, .profile-nft-price');
      const creatorEl = el.querySelector('p');
      const name = nameEl ? nameEl.textContent.trim() : '';
      const priceText = priceEl ? priceEl.textContent.trim() : '';
      return { id: idStr, name, image: img ? img.src : '', price: priceText, creator: creatorEl ? creatorEl.textContent.trim() : '' };
    }
  } catch (e) {
    // fallback to scanning all elements (older browsers)
    const candidates = Array.from(document.querySelectorAll('[data-nft-id]'));
    const el = candidates.find(e => (e.getAttribute('data-nft-id') || '') === idStr);
    if (el) {
      const img = el.querySelector('img');
      const name = el.querySelector('h3') ? el.querySelector('h3').textContent : '';
      const price = el.querySelector('.nft-price') ? el.querySelector('.nft-price').textContent : '';
      const creator = el.querySelector('p') ? el.querySelector('p').textContent : '';
      return { id: idStr, name, image: img ? img.src : '', price, creator };
    }
  }

  return null;
}

function renderFavorites() {
  const favEl = safeGet('favoritesList');
  if (!favEl) return;
  const ids = (window.NFTG_Favorites && window.NFTG_Favorites.list && Array.isArray(window.NFTG_Favorites.list())) ? window.NFTG_Favorites.list() : [];
  favEl.innerHTML = '';

  if (!ids || !ids.length) {
    const empty = document.createElement('p');
    empty.className = 'profile-nft-empty';
    empty.textContent = 'شما هنوز هیچ آیتمی را به علاقه‌مندی‌ها اضافه نکرده‌اید.';
    favEl.appendChild(empty);
    return;
  }

  ids.forEach(id => {
    const nft = getNftDataById(id);
    const card = document.createElement('article');
    card.className = 'profile-nft-card';
    card.setAttribute('data-nft-id', id);

    const favBtn = document.createElement('button');
    favBtn.className = 'favorite-btn';
    favBtn.setAttribute('aria-pressed', 'true');
    favBtn.setAttribute('title', 'علاقه‌مندی');
    favBtn.dataset.nftId = id;
    favBtn.innerHTML = ` <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.8 7.6a5.4 5.4 0 0 0-7.6 0L12 8.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-4.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6z"></path></svg>`;

    if (nft && nft.image) {
      const img = document.createElement('img');
      img.src = nft.image;
      img.alt = nft.name || '';
      card.appendChild(img);
    }

    const nameEl = document.createElement('h4');
    nameEl.className = 'profile-nft-name';
    nameEl.textContent = nft ? nft.name || id : id;

    const metaEl = document.createElement('p');
    metaEl.className = 'profile-nft-meta';
    metaEl.textContent = nft && nft.creator ? nft.creator : '';

    const priceEl = document.createElement('span');
    priceEl.className = 'profile-nft-price';
    priceEl.textContent = nft && nft.price ? nft.price : '';

    card.appendChild(favBtn);
    card.appendChild(nameEl);
    card.appendChild(metaEl);
    card.appendChild(priceEl);

    favEl.appendChild(card);
  });

  // ensure favorite buttons are updated to reflect current state
  if (window.NFTG_Favorites && window.NFTG_Favorites.refreshButtons) {
    window.NFTG_Favorites.refreshButtons(favEl);
  }
}

// Update favorites view when favorites change or NFTs are re-rendered
document.addEventListener('favorites:changed', renderFavorites);
document.addEventListener('nfts:rendered', renderFavorites);

let _nftModalResizeHandler = null;

function openNftModal(nft) {
  if (!nftModal) return;
  // clear any prior inline sizing when opening a new NFT
  if (modalContent) modalContent.style.maxWidth = '';
  if (modalImage) {
    modalImage.style.maxWidth = '';
    modalImage.style.maxHeight = '';
    // set the image src, then compute sizing when image is loaded
    modalImage.onload = function() {
      try {
        const imgW = modalImage.naturalWidth || modalImage.width || 0;
        const imgH = modalImage.naturalHeight || modalImage.height || 0;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const maxModalWidth = Math.max(560, vw - 40); // ensure some minimum modal width
        const infoColMin = 340; // minimum space reserved for the info column
        // show image up to ~62% of viewport width but not wider than natural width
        const imageDisplayWidth = Math.min(imgW || Math.floor(vw * 0.62), Math.floor(vw * 0.62));
        const desiredModalWidth = Math.min(vw - 40, imageDisplayWidth + infoColMin);
        if (modalContent) modalContent.style.maxWidth = desiredModalWidth + 'px';
        modalImage.style.maxWidth = Math.min(imageDisplayWidth, Math.max(160, desiredModalWidth - infoColMin)) + 'px';
        modalImage.style.maxHeight = Math.floor(vh * 0.78) + 'px';
      } catch (e) { console.error('Failed to size modal image', e); }
    };
    modalImage.src = nft.imageData;
  }
  if (modalName) modalName.textContent = nft.name;
  if (modalCreator) modalCreator.textContent = shortAddress(nft.creator);
  if (modalChain) modalChain.textContent = nft.chain;
  if (modalDescription) modalDescription.textContent = nft.description || 'بدون توضیحات';
  if (modalPrice) modalPrice.textContent = `${nft.price} ${nft.currency || ''}`;

  if (buyNowBtn) {
    // ensure buy button uses the same base button styling so it matches add-to-cart
    buyNowBtn.classList.add('md-btn', 'md-square', 'modal-buy-btn');
    buyNowBtn.onclick = () => handleBuyNow(nft);
    // add-to-cart in modal as well (avoid duplicate button)
    if (buyNowBtn.parentNode){
      let modalAdd = buyNowBtn.parentNode.querySelector('.modal-add-cart-btn');
      if (!modalAdd) {
        modalAdd = document.createElement('button');
        modalAdd.className = 'md-btn md-square modal-add-cart-btn';
        // slightly larger gap between Buy Now and Add to Cart per design request
        modalAdd.style.marginLeft = '16px';
        modalAdd.textContent = 'افزودن به سبد';
        buyNowBtn.parentNode.insertBefore(modalAdd, buyNowBtn.nextSibling);
      }
      // always update handler so it references the currently opened NFT
      modalAdd.onclick = (ev) => { ev.stopPropagation(); document.dispatchEvent(new CustomEvent('cart:add', { detail: { id: nft.id } })); };
    }
  }

  nftModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  // add a resize handler so modal adapts when viewport changes
  if (_nftModalResizeHandler) window.removeEventListener('resize', _nftModalResizeHandler);
  _nftModalResizeHandler = () => {
    if (!modalImage || !modalImage.naturalWidth) return;
    // trigger the same logic as onload to recompute sizing
    try {
      const imgW = modalImage.naturalWidth || modalImage.width || 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const infoColMin = 340;
      const imageDisplayWidth = Math.min(imgW, Math.floor(vw * 0.62));
      const desiredModalWidth = Math.min(vw - 40, imageDisplayWidth + infoColMin);
      if (modalContent) modalContent.style.maxWidth = desiredModalWidth + 'px';
      modalImage.style.maxWidth = Math.min(imageDisplayWidth, Math.max(160, desiredModalWidth - infoColMin)) + 'px';
      modalImage.style.maxHeight = Math.floor(vh * 0.78) + 'px';
    } catch (e) { /* ignore */ }
  };
  window.addEventListener('resize', _nftModalResizeHandler);
  // Ensure the modal rating area reflects the currently opened NFT
  try { document.dispatchEvent(new CustomEvent('ratings:changed', { detail: { id: nft.id } })); } catch(e) { console.error('Failed to request rating render for modal', e); }
}

function closeNftModal() {
  if (!nftModal) return;
  nftModal.classList.add('hidden');
  document.body.style.overflow = '';
  // reset any inline sizing and remove resize handler
  if (modalContent) modalContent.style.maxWidth = '';
  if (modalImage) {
    modalImage.style.maxWidth = '';
    modalImage.style.maxHeight = '';
    modalImage.onload = null;
  }
  if (_nftModalResizeHandler) {
    window.removeEventListener('resize', _nftModalResizeHandler);
    _nftModalResizeHandler = null;
  }
}

if (modalClose) modalClose.addEventListener('click', closeNftModal);
if (modalOverlay) modalOverlay.addEventListener('click', closeNftModal);

async function handleBuyNow(nft, opts = {}) {
  if (typeof window.ethereum === 'undefined') {
    alert('لطفاً MetaMask را نصب کنید تا بتوانید خرید کنید.');
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const buyer = accounts[0];

    const message = `
NFT Galxe - خرید NFT

نام: ${nft.name}
قیمت: ${nft.price} ${nft.currency}
بلاک‌چین: ${nft.chain}
خریدار: ${buyer}

با امضای این پیام، شما تأیید می‌کنید که این NFT را خریداری می‌کنید (دمو).
    `.trim();

    await window.ethereum.request({
      method: 'personal_sign',
      params: [message, buyer],
    });

    alert('✅ خرید با موفقیت انجام شد! (دمو - هیچ تراکنش واقعی انجام نشده)');
    closeNftModal();
    // Open rating prompt after a short delay so user can rate the purchase (1-5 stars)
    // Only open it when allowed by opts (batch checkout will set openRating: false)
    if (opts.openRating !== false) {
      setTimeout(() => {
        try { if (window.NFTG_Ratings && typeof window.NFTG_Ratings.openRatingInModal === 'function') {
          window.NFTG_Ratings.openRatingInModal(nft.id || nft);
        } } catch(e) { console.error('Failed to open rating UI', e); }
      }, 300);
    }
    return true;
  } catch (err) {
    console.error(err);
    alert('❌ خرید لغو شد یا با خطا مواجه شد.');
    return false;
  }
}

/* -------------------------
   UI behavior / events
   ------------------------- */

if (connectButton) {
  connectButton.addEventListener('click', (e) => {
    // If already connected, toggle menu; otherwise try to connect
    if (connectButton.classList.contains('connected')) {
      e.stopPropagation();
      if (walletDropdown) walletDropdown.classList.toggle('hidden');
    } else {
      connectWallet();
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    disconnectWalletUI();
  });
}

// Close wallet dropdown when clicking outside (use a forgiving selector)
window.addEventListener('click', (event) => {
  const isInside = event.target.closest && (event.target.closest('.wallet-menu') || event.target.closest('#walletDropdown'));
  if (!isInside) {
    if (walletDropdown) walletDropdown.classList.add('hidden');
  }
});

/* -------------------------
   Single DOMContentLoaded init
   ------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // Wallet state restore
  const savedAddress = localStorage.getItem(STORAGE_KEY_WALLET);
  if (savedAddress && connectButton) {
    connectButton.textContent = shortAddress(savedAddress);
    connectButton.classList.add('connected');
    connectButton.style.backgroundColor = '#6F42C1';
    if (walletAddressText) walletAddressText.textContent = shortAddress(savedAddress);
    if (walletDropdown) walletDropdown.classList.add('hidden');
  }

  // Create page
  renderCreatedNfts();

  // Profile page init
  const existingProfile = loadProfile();
  const profileNameInput = safeGet('profileName');
  const profileAboutInput = safeGet('profileAbout');
  const profileImageInput = safeGet('profileImage');
  const deleteAccountBtn = safeGet('deleteAccountBtn');

  if (existingProfile) {
    if (profileNameInput) profileNameInput.value = existingProfile.name || '';
    if (profileAboutInput) profileAboutInput.value = existingProfile.about || '';
    updateAvatar(existingProfile);
  } else {
    updateAvatar(null);
  }

  updateWalletInProfile();
  renderNftsForSale();
  // Render favorites panel
  renderFavorites();

  // If user navigated with #favorites, scroll to the favorites section
  if (window.location && window.location.hash === '#favorites') {
    const favEl = document.getElementById('favoritesList');
    if (favEl) setTimeout(() => favEl.scrollIntoView({ behavior: 'smooth' }), 80);
  }

  if (profileImageInput) {
    profileImageInput.addEventListener('change', async () => {
      const file = profileImageInput.files && profileImageInput.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setProfileStatus('Please upload a valid image file for your avatar.', 'error');
        profileImageInput.value = '';
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        const currentProfile = loadProfile() || {};
        const updatedProfile = {
          ...currentProfile,
          avatarData: base64,
          name: profileNameInput ? profileNameInput.value.trim() : currentProfile.name || '',
          about: profileAboutInput ? profileAboutInput.value.trim() : currentProfile.about || '',
          updatedAt: Date.now(),
        };
        saveProfile(updatedProfile);
        updateAvatar(updatedProfile);
        setProfileStatus('Profile picture updated.', 'success');
      } catch (err) {
        console.error(err);
        setProfileStatus('Failed to update profile picture.', 'error');
      }
    });
  }

  // Save profile form
  const profileForm = safeGet('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = profileNameInput ? profileNameInput.value.trim() : '';
      const about = profileAboutInput ? profileAboutInput.value.trim() : '';
      const current = loadProfile() || {};
      const profileData = {
        ...current,
        name,
        about,
        avatarData: current.avatarData || null,
        updatedAt: Date.now(),
      };
      saveProfile(profileData);
      updateAvatar(profileData);
      setProfileStatus('✅ Profile saved successfully.', 'success');
    });
  }

  // Delete account
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
      const sure = window.confirm('Are you sure you want to delete your profile and locally stored NFTs? This cannot be undone (local demo only).');
      if (!sure) return;

      setProfileStatus('Requesting wallet confirmation to delete account...', '');

      try {
        await confirmDeleteWithWallet();

        localStorage.removeItem(STORAGE_KEY_PROFILE);
        localStorage.removeItem(STORAGE_KEY_NFTS);
        localStorage.removeItem(STORAGE_KEY_WALLET);

        if (profileNameInput) profileNameInput.value = '';
        if (profileAboutInput) profileAboutInput.value = '';
        updateAvatar(null);

        updateWalletInProfile();
        renderNftsForSale();

        if (connectButton) {
          connectButton.textContent = 'Connect Wallet';
          connectButton.classList.remove('connected');
          connectButton.style.backgroundColor = '';
        }

        setProfileStatus('✅ Account deleted from this browser (local demo).', 'success');
      } catch (err) {
        console.error(err);
        if (err.message && err.message.includes('does not match the profile wallet')) {
          setProfileStatus('The connected wallet does not match the profile wallet. Account not deleted.', 'error');
        } else if (err.code === 4001) {
          setProfileStatus('Wallet confirmation rejected. Account not deleted.', 'error');
        } else {
          setProfileStatus('Wallet confirmation failed. Account not deleted.', 'error');
        }
      }
    });
  }

  // Marketplace init & events
  renderNfts();

  if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', renderNfts);

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      document.querySelectorAll('input[name="status"]').forEach(el => el.checked = el.value === 'forSale');
      document.querySelectorAll('input[name="chain"]').forEach(el => el.checked = true);
      const minEl = safeGet('minPrice'); if (minEl) minEl.value = '';
      const maxEl = safeGet('maxPrice'); if (maxEl) maxEl.value = '';
      if (searchInput) searchInput.value = '';
      if (sortBySelect) sortBySelect.value = 'newest';
      renderNfts();
    });
  }

  if (sortBySelect) sortBySelect.addEventListener('change', renderNfts);
  if (searchInput) searchInput.addEventListener('input', renderNfts);
});
