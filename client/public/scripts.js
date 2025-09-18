/* eslint-disable no-undef */
const GANACHE_URL = 'http://localhost:7545';
let web3;
let contract;
let currentAccount;

const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "propertyAddress",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      }
    ],
    "name": "PropertyListed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "PropertySold",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_propertyAddress",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_price",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      }
    ],
    "name": "listProperty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_propertyId",
        "type": "uint256"
      }
    ],
    "name": "buyProperty",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function",
    "payable": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_propertyId",
        "type": "uint256"
      }
    ],
    "name": "getProperty",
    "outputs": [
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "propertyAddress",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isSold",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [],
    "name": "getPropertiesCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  }
];

// Contract address - pastikan ini sesuai dengan yang sudah di-deploy
const CONTRACT_ADDRESS = '0x8FD0726086b0FfEF3E435F1745419833Cc3b406d';

async function initializeWeb3() {
  try {
    if (window.ethereum) {
      // eslint-disable-next-line no-undef
      web3 = new Web3(window.ethereum);
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length === 0) {
        throw new Error('Tidak ada akun yang terhubung');
      }
      
      currentAccount = accounts[0];
      console.log('Connected account:', currentAccount);
      
      // Check network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Current Chain ID:', chainId);
      
      // Handle account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          console.log('Please connect to MetaMask.');
          currentAccount = null;
        } else {
          currentAccount = accounts[0];
          console.log('Account changed to:', currentAccount);
        }
      });
      
    } else {
      // Fallback ke Ganache jika MetaMask tidak tersedia
      console.log('MetaMask not detected, using Ganache');
      web3 = new Web3(new Web3.providers.HttpProvider(GANACHE_URL));
      const accounts = await web3.eth.getAccounts();
      
      if (accounts.length === 0) {
        throw new Error('Tidak ada akun di Ganache');
      }
      
      currentAccount = accounts[0];
    }
    
    return true;
  } catch (error) {
    console.error('Web3 initialization failed:', error);
    throw error;
  }
}

async function initializeContract() {
  try {
    if (!web3) {
      throw new Error('Web3 belum diinisialisasi');
    }
    
    // Gunakan ABI dan address yang sudah ditentukan
    contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    
    // Test contract connection
    const propertiesCount = await contract.methods.getPropertiesCount().call();
    console.log('Contract connected. Properties count:', propertiesCount);
    
    return true;
  } catch (error) {
    console.error('Contract initialization failed:', error);
    
    // Fallback: try to load from JSON file
    try {
      const response = await fetch('PropertySale.json');
      if (!response.ok) {
        throw new Error('PropertySale.json not found');
      }
      
      const artifact = await response.json();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = artifact.networks[networkId];
      
      if (!deployedNetwork) {
        throw new Error(`Contract not deployed to network ${networkId}`);
      }
      
      contract = new web3.eth.Contract(artifact.abi, deployedNetwork.address);
      console.log('Contract loaded from JSON file');
      return true;
      
    } catch (jsonError) {
      console.error('Failed to load contract from JSON:', jsonError);
      throw new Error('Contract initialization failed. Please check contract deployment.');
    }
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
}

async function renderProperties(filterType = 'all') {
  const container = document.getElementById('properties-list');
  if (!container) return;

  try {
    const response = await fetch('http://localhost:5000/api/properties');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const allProperties = Array.isArray(result.data) ? result.data : [];
    const filtered = filterType === 'all' ? allProperties : allProperties.filter(p => p.type === filterType);

    container.innerHTML = '';
    if (filtered.length === 0) {
      container.innerHTML = '<p>Tidak ada properti ditemukan.</p>';
      return;
    }

    // Get blockchain properties for comparison
    let blockchainProperties = [];
    if (contract) {
      try {
        const count = await contract.methods.getPropertiesCount().call();
        for (let i = 1; i <= count; i++) {
          try {
            const prop = await contract.methods.getProperty(i).call();
            blockchainProperties.push({ id: i, ...prop });
          } catch (e) {
            console.log(`Could not fetch property ${i}:`, e.message);
          }
        }
      } catch (e) {
        console.log('Could not fetch blockchain properties:', e.message);
      }
    }

    filtered.forEach(p => {
      const card = document.createElement('article');
      card.className = 'property-card';
      card.dataset.id = p.id_property;
      
      // Find matching blockchain property
      const blockchainProp = blockchainProperties.find(bp => 
        bp.title === p.title && !bp.isSold
      );
      
      card.innerHTML = `
        <div class="property-image-container">
          <img src="${p.image}" alt="${p.title}" class="property-image">
        </div>
        <div class="property-info">
          <h3>${p.title}</h3>
          <p class="price">${formatPrice(p.price)}</p>
          <p class="eth-price">${p.ethPrice || '-'} ETH</p>
        </div>
      `;
      
      card.addEventListener('click', () => showPropertyDetail(p, allProperties, blockchainProp));
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to fetch properties:", err);
    container.innerHTML = `<p>Gagal memuat properti: ${err.message}</p>`;
  }
}

async function renderTransactions() {
  const tableBody = document.getElementById('transaction-body');
  if (!tableBody) return;

  try {
    const response = await fetch('http://localhost:5000/api/transactions');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const txs = Array.isArray(result.data) ? result.data : [];

    tableBody.innerHTML = '';
    if (txs.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8">Belum ada transaksi</td></tr>';
      return;
    }

    txs.forEach(tx => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${tx.name || '-'}</td>
        <td>${tx.property_title || tx.Property_id}</td>
        <td>${tx.eth_amount} ETH</td>
        <td>${tx.email || '-'}</td>
        <td>${tx.phone || '-'}</td>
        <td>${new Date(tx.created_at).toLocaleString('id-ID')}</td>
        <td><span class="status-${tx.status.toLowerCase()}">${tx.status}</span></td>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to fetch transactions:", err);
    tableBody.innerHTML = `<tr><td colspan="8">Gagal memuat transaksi: ${err.message}</td></tr>`;
  }
}

function showPropertyDetail(property, allProperties, blockchainProperty = null) {
  const detail = document.getElementById('property-detail-section');
  if (!detail) return;
  
  const descriptionElement = detail.querySelector('#property-description');
  descriptionElement.innerHTML = (property.description || 'Tidak ada deskripsi').replace(/\n/g, '<br>');
  
  detail.querySelector('#detail-image').src = property.image;
  detail.querySelector('#detail-image').onerror = function() {
    this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  };
  
  detail.querySelector('#detail-title').textContent = property.title;
  detail.querySelector('#detail-price').textContent =
    `${formatPrice(property.price)} (${property.ethPrice || '-'} ETH)`;
  detail.querySelector('#property-address').textContent = property.address || 'Alamat tidak tersedia';

  const button = detail.querySelector('#buy-button');
  
  // Disable button if property doesn't have ETH price
  if (!property.ethPrice || property.ethPrice <= 0) {
    button.disabled = true;
    button.textContent = 'Harga ETH tidak tersedia';
    button.onclick = null;
    return;
  }
  
  button.disabled = false;
  button.textContent = 'Beli Properti';
  button.onclick = async () => {
    if (!currentAccount) {
      alert('Silakan hubungkan wallet terlebih dahulu');
      return;
    }
    
    if (!contract) {
      alert('Smart contract belum tersedia');
      return;
    }
    
    try {
      button.disabled = true;
      button.textContent = 'Memproses...';
      
      let blockchainId = null;
      
      // Check if property already exists on blockchain
      if (blockchainProperty) {
        blockchainId = blockchainProperty.id;
        console.log('Using existing blockchain property:', blockchainId);
      } else {
        console.log('Listing property on blockchain...');
        const ethPrice = web3.utils.toWei(property.ethPrice.toString(), 'ether');
        
        const gasEstimate = await contract.methods.listProperty(
          property.address || 'Alamat tidak tersedia',
          ethPrice,
          property.title,
          property.description || 'Tidak ada deskripsi'
        ).estimateGas({ from: currentAccount });
        
        const receipt = await contract.methods.listProperty(
          property.address || 'Alamat tidak tersedia',
          ethPrice,
          property.title,
          property.description || 'Tidak ada deskripsi'
        ).send({ 
          from: currentAccount, 
          gas: Math.floor(gasEstimate * 1.2) 
        });

        console.log('Property listed on blockchain:', receipt.transactionHash);
        
        const propertiesCount = await contract.methods.getPropertiesCount().call();
        blockchainId = parseInt(propertiesCount);
      }

      const params = new URLSearchParams({
        id: property.id_property,
        price: property.ethPrice,
        price_rupiah: property.price,
        title: property.title,
        image: property.image,
        blockchain_id: blockchainId
      });
      
      window.location.href = `pembayaran/checkout.html?${params.toString()}`;
      
    } catch (err) {
      console.error('Error processing property:', err);
      let errorMessage = 'Terjadi kesalahan';
      
      if (err.message.includes('User denied')) {
        errorMessage = 'Transaksi dibatalkan oleh pengguna';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage = 'Saldo tidak mencukupi';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(`Gagal: ${errorMessage}`);
    } finally {
      button.disabled = false;
      button.textContent = 'Beli Properti';
    }
  };

  // Show property detail section
  document.getElementById('home-section').hidden = true;
  document.getElementById('transaksi-section').hidden = true;
  detail.hidden = false;
}

function setupEventListeners() {
  // Tab navigation
  document.getElementById('tab-home')?.addEventListener('click', () => {
    document.getElementById('home-section').hidden = false;
    document.getElementById('transaksi-section').hidden = true;
    document.getElementById('property-detail-section').hidden = true;
    renderProperties();
  });

  document.getElementById('tab-transaksi')?.addEventListener('click', () => {
    document.getElementById('transaksi-section').hidden = false;
    document.getElementById('home-section').hidden = true;
    document.getElementById('property-detail-section').hidden = true;
    renderTransactions();
  });

  // tombol back
  document.querySelector('.back-button')?.addEventListener('click', () => {
    document.getElementById('home-section').hidden = false;
    document.getElementById('property-detail-section').hidden = true;
  });

  // Property type filter
  document.getElementById('propertyType')?.addEventListener('change', e => {
    renderProperties(e.target.value);
  });
}

async function initialize() {
  try {
    console.log('Initializing application...');
    
    // Initialize Web3
    await initializeWeb3();
    console.log('Web3 initialized successfully');
    
    // Initialize Contract
    await initializeContract();
    console.log('Contract initialized successfully');
    
    // Setup event listeners
    setupEventListeners();
    console.log('Event listeners setup complete');
    
    // Render initial content
    await renderProperties();
    console.log('Properties rendered');
    
    // Don't auto-render transactions to avoid unnecessary API calls
    console.log('Application initialized successfully');
    
  } catch (error) {
    console.error("App initialization failed:", error);
    
    // Show user-friendly error message
    const container = document.getElementById('properties-list');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <h3>⚠️ Gagal Menginisialisasi Aplikasi</h3>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Pastikan:</strong></p>
          <ul>
            <li>MetaMask terinstal dan terhubung</li>
            <li>Jaringan blockchain berjalan (Ganache)</li>
            <li>Smart contract sudah di-deploy</li>
            <li>Backend API berjalan di localhost:5000</li>
          </ul>
          <button onclick="window.location.reload()" class="retry-button">Coba Lagi</button>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);