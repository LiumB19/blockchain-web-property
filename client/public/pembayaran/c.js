document.addEventListener('DOMContentLoaded', async function () {
  const CONTRACT_ADDRESS = '0x8FD0726086b0FfEF3E435F1745419833Cc3b406d';

  const elements = {
    title: document.getElementById('property-title'),
    price: document.getElementById('property-price'),
    eth: document.getElementById('eth-amount'),
    description: document.getElementById('property-description'),
    image: document.getElementById('property-image'),
    walletStatus: document.getElementById('wallet-status-text'),
    networkStatus: document.getElementById('network-status'),
    connectBtn: document.getElementById('connect-wallet'),
    payBtn: document.getElementById('pay-button'),
    txStatus: document.getElementById('transaction-status'),
    backBtn: document.getElementById('back-button'),
    nameInput: document.getElementById('name'),
    emailInput: document.getElementById('email'),
    phoneInput: document.getElementById('phone')
  };

  const state = {
    web3: null,
    contract: null,
    currentAccount: null,
    ethPrice: 0,
    propertyId: null,
    propertyTitle: '',
    blockchainPropertyId: null 
  };

  const CONTRACT_ABI = [{
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
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "properties",
      "outputs": [
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
          "internalType": "address payable",
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
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "propertyIdCounter",
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
        },
        {
          "internalType": "uint256",
          "name": "_newPrice",
          "type": "uint256"
        }
      ],
      "name": "updatePrice",
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
      "name": "getUnsoldProperties",
      "outputs": [
        {
          "components": [
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
              "internalType": "address payable",
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
            },
            {
              "internalType": "string",
              "name": "title",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "description",
              "type": "string"
            }
          ],
          "internalType": "struct PropertySale.Property[]",
          "name": "",
          "type": "tuple[]"
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
    }]; 

 function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  }

  function loadPropertyData() {
    const params = new URLSearchParams(window.location.search);
    state.propertyTitle = decodeURIComponent(params.get('title'));
    state.ethPrice = parseFloat(params.get('price'));
    const priceRupiah = parseInt(params.get('price_rupiah'));
    state.propertyId = parseInt(params.get('id'));
    state.blockchainPropertyId = parseInt(params.get('blockchain_id')) || null; // Get blockchain ID
    const image = decodeURIComponent(params.get('image'));

    elements.title.textContent = state.propertyTitle;
    elements.price.textContent = 'Harga: ' + formatRupiah(priceRupiah);
    elements.eth.textContent = state.ethPrice;
    elements.image.src = image;
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask belum diinstal');
      }

      // Check if Web3 is available
      if (typeof Web3 === 'undefined') {
        throw new Error('Web3 library belum dimuat. Pastkan Web3.js sudah di-include.');
      }

      state.web3 = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      state.currentAccount = accounts[0];

      elements.walletStatus.textContent = `Terhubung (${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)})`;

      // Check network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Current Chain ID:', chainId);
      
      // Accept common Ganache chain IDs
      const validChainIds = ['0x539', '0x1691', '0x5777']; // 1337, 5777, 22119
      if (!validChainIds.includes(chainId)) {
        throw new Error(`Jaringan tidak didukung. Chain ID: ${chainId}. Pastikan terhubung ke Ganache.`);
      }

      // Initialize contract
      state.contract = new state.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      
      // Test contract connection
      try {
        await state.contract.methods.getPropertiesCount().call();
        console.log('Contract connected successfully');
      } catch (contractError) {
        throw new Error('Gagal terhubung ke smart contract. Pastikan contract sudah di-deploy.');
      }

      elements.payBtn.disabled = false;
      elements.txStatus.innerHTML = '<p style="color:green;">Wallet terhubung, siap untuk transaksi.</p>';

    } catch (error) {
      console.error('Connect wallet error:', error);
      elements.txStatus.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    }
  }

  async function ensurePropertyOnBlockchain() {
    try {
      if (state.blockchainPropertyId) {
        try {
          const property = await state.contract.methods.getProperty(state.blockchainPropertyId).call();
          if (property.title && !property.isSold) {
            console.log('Property found on blockchain:', state.blockchainPropertyId);
            return state.blockchainPropertyId;
          }
        } catch (e) {
          console.log('Blockchain property ID invalid, will create new listing');
        }
      }

      console.log('Listing property on blockchain...');
      elements.txStatus.innerHTML = '<p style="color:blue;">Mendaftarkan properti ke blockchain...</p>';

      const priceInWei = state.web3.utils.toWei(state.ethPrice.toString(), 'ether');
      
      const propertyAddress = `Property ${state.propertyId} Address`; 
      const description = `Property ${state.propertyTitle} - Listed for sale`; 

      const listTx = await state.contract.methods.listProperty(
        propertyAddress,
        priceInWei,
        state.propertyTitle,
        description
      ).send({
        from: state.currentAccount,
        gas: 800000
      });

      console.log('Property listed. TX Hash:', listTx.transactionHash);

      const propertyCounter = await state.contract.methods.getPropertiesCount().call();
      state.blockchainPropertyId = parseInt(propertyCounter);

      console.log('New blockchain property ID:', state.blockchainPropertyId);
      elements.txStatus.innerHTML = '<p style="color:green;">Properti berhasil didaftarkan ke blockchain.</p>';

      return state.blockchainPropertyId;

    } catch (error) {
      console.error('Error listing property:', error);
      throw new Error(`Gagal mendaftarkan properti: ${error.message}`);
    }
  }

  async function processPayment() {
    try {
      elements.txStatus.innerHTML = '<p style="color:blue;">Memproses pembayaran...</p>';

      const name = elements.nameInput.value.trim();
      const email = elements.emailInput.value.trim();
      const phone = elements.phoneInput.value.trim();

      // Validation
      if (!name || !email) {
        throw new Error('Nama dan email wajib diisi');
      }

      if (!state.contract || !state.currentAccount) {
        throw new Error('Wallet belum terhubung atau contract tidak tersedia');
      }

      if (!state.ethPrice || state.ethPrice <= 0) {
        throw new Error('Harga ETH tidak valid');
      }

      // Ensure property is on blockchain
      const blockchainId = await ensurePropertyOnBlockchain();

      // Verify property still available
      const property = await state.contract.methods.getProperty(blockchainId).call();
      if (property.isSold) {
        throw new Error('Properti sudah terjual');
      }

      if (property.seller === state.currentAccount) {
        throw new Error('Anda tidak bisa membeli properti sendiri');
      }

      // Verify price matches
      const priceInWei = state.web3.utils.toWei(state.ethPrice.toString(), 'ether');
      if (property.price !== priceInWei) {
        const onChainPriceEth = state.web3.utils.fromWei(property.price, 'ether');
        throw new Error(`Harga tidak sesuai. Harga blockchain: ${onChainPriceEth} ETH, harga frontend: ${state.ethPrice} ETH`);
      }

      // Check balance
      const balance = await state.web3.eth.getBalance(state.currentAccount);
      const balanceEth = parseFloat(state.web3.utils.fromWei(balance, 'ether'));
      if (balanceEth < state.ethPrice + 0.01) { // +0.01 for gas
        throw new Error(`Saldo tidak cukup. Diperlukan: ${state.ethPrice + 0.01} ETH, Saldo: ${balanceEth.toFixed(4)} ETH`);
      }

      console.log('Buying property with ID:', blockchainId);
      elements.txStatus.innerHTML = '<p style="color:blue;">Mengirim transaksi ke blockchain...</p>';

      const gasAmount = await state.contract.methods.buyProperty(blockchainId).estimateGas({
        from: state.currentAccount,
        value: priceInWei
      });

      // Execute purchase
      const tx = await state.contract.methods.buyProperty(blockchainId).send({
        from: state.currentAccount,
        value: priceInWei,
        gas: Math.floor(gasAmount * 1.2)
      });

      console.log('TX HASH:', tx.transactionHash);
      elements.txStatus.innerHTML = '<p style="color:blue;">Transaksi berhasil, menyimpan ke database...</p>';

      try {
        const response = await fetch('http://localhost:5000/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone,
            property_id: state.propertyId,
            blockchain_property_id: blockchainId,
            ethAmount: state.ethPrice,
            txHash: tx.transactionHash,
            user_id: 1
          })
        });

        const json = await response.json();
        if (!response.ok || !json.success) {
          console.error('Backend save failed:', json);
          elements.txStatus.innerHTML += '<p style="color:orange;">Peringatan: Transaksi blockchain berhasil, tapi gagal menyimpan ke database.</p>';
        }
      } catch (backendError) {
        console.error('Backend error:', backendError);
        elements.txStatus.innerHTML += '<p style="color:orange;">Peringatan: Transaksi blockchain berhasil, tapi gagal menyimpan ke database.</p>';
      }

      elements.txStatus.innerHTML = `
        <p style="color:green;"><strong>Pembayaran berhasil!</strong></p>
        <p>Properti telah dibeli dengan sukses.</p>
        <p>TX Hash: <a href="https://etherscan.io/tx/${tx.transactionHash}" target="_blank">${tx.transactionHash}</a></p>
        <p>Mengalihkan ke halaman utama...</p>
      `;

      elements.payBtn.disabled = true;

      setTimeout(() => {
        window.location.href = '../index.html';
      }, 3000);

    } catch (err) {
      console.error('Payment error:', err);
      let errorMessage = 'Terjadi kesalahan saat transaksi';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code === -32603) {
        errorMessage = 'Error internal MetaMask. Coba restart MetaMask atau periksa jaringan.';
      } else if (err.code === 4001) {
        errorMessage = 'Transaksi dibatalkan oleh pengguna.';
      }

      elements.txStatus.innerHTML = `<p style="color:red;">Error: ${errorMessage}</p>`;
    }
  }

  // Event listeners
  elements.connectBtn.addEventListener('click', connectWallet);
  elements.payBtn.addEventListener('click', processPayment);
  elements.backBtn.addEventListener('click', () => window.location.href = '../index.html');

  // Auto-connect if wallet was previously connected
  if (window.ethereum && window.ethereum.selectedAddress) {
    setTimeout(connectWallet, 1000);
  }

  loadPropertyData();
});