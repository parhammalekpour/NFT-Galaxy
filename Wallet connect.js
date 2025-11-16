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
