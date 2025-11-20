const connectButton = document.getElementById('connectWallet');
const walletDropdown = document.getElementById('walletDropdown');
const logoutButton = document.getElementById('logoutWallet');
const walletAddressText = document.getElementById('walletAddressText');

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('🦊 Please install MetaMask to connect your wallet!');
        return;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const walletAddress = accounts[0];
        const shortAddress = walletAddress.substring(0, 6) + '...' + walletAddress.slice(-4);

        connectButton.textContent = shortAddress;
        connectButton.classList.add('connected');
        connectButton.style.backgroundColor = '#6F42C1';

       walletAddressText.textContent = shortAddress; 

        walletDropdown.classList.add('show');

        localStorage.setItem('walletAddress', walletAddress);

        console.log('✅ Wallet connected:', walletAddress);
    } catch (error) {
        console.error('❌ Connection rejected:', error);
    }
}

connectButton.addEventListener('click', (e) => {
    if (connectButton.classList.contains('connected')) {
        e.stopPropagation();
        walletDropdown.classList.toggle('hidden');
    } else {
        connectWallet();
    }
});

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('walletAddress');

    connectButton.textContent = 'Connect Wallet';
    connectButton.classList.remove('connected');
    connectButton.style.backgroundColor = '';
    walletDropdown.classList.add('hidden');

    console.log('🚪 Wallet disconnected.');
});

window.addEventListener('DOMContentLoaded', () => {
    const savedAddress = localStorage.getItem('walletAddress');

    if (savedAddress) {
        const shortAddress = savedAddress.substring(0, 6) + '...' + savedAddress.slice(-4);

        connectButton.textContent = shortAddress;
        connectButton.classList.add('connected');
        connectButton.style.backgroundColor = '#6F42C1';

        walletAddressText.textContent = savedAddress;
    }
});

window.addEventListener('click', (event) => {
    if (!event.target.closest('.wallet-menu')) {
        walletDropdown.classList.add('hidden');
    }
});

// === Create NFT Page Logic ===

// Elements
const createForm = document.getElementById('createNftForm');
const imageInput = document.getElementById('nftImage');
const previewContainer = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const statusEl = document.getElementById('createStatus');
const createdNftList = document.getElementById('createdNftList');

// ---------- Image Preview ----------
if (imageInput) {
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
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
      const placeholder = previewContainer.querySelector('.image-preview-placeholder');
      if (placeholder) placeholder.style.display = 'none';

      previewImg.src = e.target.result;
      previewImg.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
}

function resetPreview() {
  const placeholder = previewContainer.querySelector('.image-preview-placeholder');
  if (placeholder) placeholder.style.display = 'block';
  previewImg.src = '';
  previewImg.style.display = 'none';
}

// ---------- Helper: Status text ----------
function setStatus(message, type = '') {
  if (!statusEl) return;
  statusEl.textContent = message || '';
  statusEl.classList.remove('success', 'error');
  if (type) statusEl.classList.add(type);
}

// ---------- Local Storage Helpers ----------
const STORAGE_KEY = 'createdNfts';

function loadCreatedNfts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCreatedNfts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ---------- Render created NFTs ----------
function renderCreatedNfts() {
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
    priceEl.textContent = `${nft.price} ${nft.currency}`;

    const descEl = document.createElement('p');
    descEl.className = 'created-nft-meta';
    descEl.textContent = nft.description;

    card.appendChild(img);
    card.appendChild(nameEl);
    card.appendChild(metaEl);
    card.appendChild(priceEl);
    card.appendChild(descEl);

    createdNftList.appendChild(card);
  });
}

function shortAddress(addr) {
  if (!addr || addr.length < 10) return addr || '';
  return addr.substring(0, 6) + '...' + addr.slice(-4);
}

// ---------- Wallet Sign Helper ----------
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

  const from = address;
  const params = [message, from];

  // Depending on wallet, this may be "personal_sign" or "eth_sign"
  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: params,
  });

  return { address, signature };
}

// ---------- Form Submit ----------
if (createForm) {
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    const file = imageInput.files[0];
    if (!file) {
      setStatus('Please upload an image for your NFT.', 'error');
      return;
    }

    const name = document.getElementById('nftName').value.trim();
    const description = document.getElementById('nftDescription').value.trim();
    const chain = document.getElementById('nftChain').value;
    const price = document.getElementById('nftPrice').value;
    const currency = document.getElementById('nftCurrency').value;
    const forSale = document.getElementById('putForSale').checked;

    if (!name || !description || !chain || !price) {
      setStatus('Please fill in all required fields.', 'error');
      return;
    }

    // Check if any wallet is (or can be) connected
    if (typeof window.ethereum === 'undefined') {
      setStatus('MetaMask not found. Please install it and connect your wallet.', 'error');
      return;
    }

    setStatus('Preparing NFT and requesting wallet signature...', '');

    try {
      // Read image as Base64
      const imageData = await fileToBase64(file);

      // Prepare NFT data
      const nftDraft = {
        name,
        description,
        chain,
        price,
        currency,
        forSale,
        imageData,
      };

      // Ask wallet to sign
      const { address } = await signCreateMessage(nftDraft);

      // Save to local storage
      const existing = loadCreatedNfts();
      existing.push({
        ...nftDraft,
        creator: address,
        createdAt: Date.now(),
      });
      saveCreatedNfts(existing);

      // Re-render list
      renderCreatedNfts();

      // Reset form
      createForm.reset();
      imageInput.value = '';
      resetPreview();

      setStatus('✅ NFT created and signed successfully (local demo).', 'success');
    } catch (err) {
      console.error(err);
      setStatus('Signature cancelled or failed. NFT was not created.', 'error');
    }
  });
}

// Helper: file -> base64 string
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

// ---------- On load ----------
document.addEventListener('DOMContentLoaded', () => {
  renderCreatedNfts();
});

// profile.js

// profile.js

// ----- Storage keys -----
const PROFILE_STORAGE_KEY = 'userProfile';
const NFT_STORAGE_KEY = 'createdNfts';
const WALLET_STORAGE_KEY = 'walletAddress';

// ---------- Small helpers ----------

function setProfileStatus(message, type = '') {
  const profileStatusEl = document.getElementById('profileStatus');
  if (!profileStatusEl) return;
  profileStatusEl.textContent = message || '';
  profileStatusEl.classList.remove('success', 'error');
  if (type) profileStatusEl.classList.add(type);
}

function shortAddress(addr) {
  if (!addr || addr.length < 10) return addr || '';
  return addr.substring(0, 6) + '...' + addr.slice(-4);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

// ---------- Local storage helpers ----------

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

function loadCreatedNfts() {
  try {
    const raw = localStorage.getItem(NFT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getNftsForSale() {
  const nfts = loadCreatedNfts();
  return nfts.filter(nft => nft.forSale === true);
}

// ---------- UI: avatar, wallet, NFTs ----------

function updateAvatar(profile) {
  const avatarImg = document.getElementById('avatarImg');
  const avatarInitials = document.getElementById('avatarInitials');
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
  const profileWalletAddressEl = document.getElementById('profileWalletAddress');
  if (!profileWalletAddressEl) return;

  const storedWallet = localStorage.getItem(WALLET_STORAGE_KEY);
  profileWalletAddressEl.textContent = storedWallet || 'Not connected';
}

function renderNftsForSale() {
  const profileNftList = document.getElementById('profileNftList');
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
    priceEl.textContent = `${nft.price} ${nft.currency}`;

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

// ---------- Wallet-sign helper for delete ----------

async function confirmDeleteWithWallet() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed.');
  }

  // Prefer the address you already stored (so the message matches the shown address)
  const storedWallet = localStorage.getItem(WALLET_STORAGE_KEY);

  // Ask MetaMask for accounts (ensures connection and gives us a real address)
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const currentAddress = accounts[0];

  // If we have a stored wallet, make sure the signing account matches it
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

  const params = [message, addressToUse];

  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params,
  });

  return { address: addressToUse, signature };
}

// ---------- Init after DOM ready ----------

document.addEventListener('DOMContentLoaded', () => {
  const profileForm = document.getElementById('profileForm');
  const profileNameInput = document.getElementById('profileName');
  const profileAboutInput = document.getElementById('profileAbout');
  const profileImageInput = document.getElementById('profileImage');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  const connectButton = document.getElementById('connectWallet');

  // 1. Load profile on page load
  const existingProfile = loadProfile();
  if (existingProfile) {
    if (profileNameInput) profileNameInput.value = existingProfile.name || '';
    if (profileAboutInput) profileAboutInput.value = existingProfile.about || '';
    updateAvatar(existingProfile);
  } else {
    updateAvatar(null);
  }

  // 2. Wallet + NFTs on page load
  updateWalletInProfile();
  renderNftsForSale();

  // ----- Avatar upload -----
  if (profileImageInput) {
    profileImageInput.addEventListener('change', async () => {
      const file = profileImageInput.files[0];
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

  // ----- Save profile (name + about) -----
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

  // ----- Delete account (this is the important part) -----
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
      // Optional browser-level confirmation
      const sure = window.confirm(
        'Are you sure you want to delete your profile and locally stored NFTs? This cannot be undone (local demo only).'
      );
      if (!sure) return;

      setProfileStatus('Requesting wallet confirmation to delete account...', '');

      try {
        // 1. Ask wallet to sign confirmation message
        await confirmDeleteWithWallet();

        // 2. If signature succeeds, remove local data
        localStorage.removeItem(PROFILE_STORAGE_KEY);
        localStorage.removeItem(NFT_STORAGE_KEY);
        localStorage.removeItem(WALLET_STORAGE_KEY);

        // 3. Reset profile fields
        if (profileNameInput) profileNameInput.value = '';
        if (profileAboutInput) profileAboutInput.value = '';
        updateAvatar(null);

        // 4. Reset wallet display in profile
        updateWalletInProfile();

        // 5. Reset NFTs list (will show empty state)
        renderNftsForSale();

        // 6. Reset wallet button in navbar (visual reset)
        if (connectButton) {
          connectButton.textContent = 'Connect Wallet';
          connectButton.classList.remove('connected');
          connectButton.style.backgroundColor = '';
        }

        setProfileStatus('✅ Account deleted from this browser (local demo).', 'success');
      } catch (err) {
        console.error(err);

        // If MetaMask was closed / user rejected / mismatch, show proper message
        if (err.message && err.message.includes('does not match the profile wallet')) {
          setProfileStatus(
            'The connected wallet does not match the profile wallet. Account not deleted.',
            'error'
          );
        } else if (err.code === 4001) {
          // 4001 is commonly "user rejected request" in MetaMask
          setProfileStatus('Wallet confirmation rejected. Account not deleted.', 'error');
        } else {
          setProfileStatus('Wallet confirmation failed. Account not deleted.', 'error');
        }
      }
    });
  }
});
