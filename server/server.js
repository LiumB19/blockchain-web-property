const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;

const multer = require('multer');

// Konfigurasi penyimpanan
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Hanya file gambar yang diperbolehkan'));
    } else {
      cb(null, true);
    }
  }
});

// ======== Middleware ========
app.use(cors({
  origin: ['http://localhost:8081', 'http://192.168.1.11:8081'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======== Database Connection ========
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'property',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ======== API ROUTES ========

// === Get All Properties ===
app.get('/api/properties', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM property');

    const properties = rows.map(p => ({
      ...p,
      image: p.image?.startsWith('http')
        ? p.image
        : `${req.protocol}://${req.get('host')}/uploads/${p.image}`
    }));

    res.json({ success: true, data: properties });
  } catch (err) {
    console.error('Error fetching properties:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching properties', error: err.message });
  }
});

// === Upload Image ===
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Gambar tidak ditemukan' });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  res.status(201).json({
    success: true,
    message: 'Gambar berhasil di-upload',
    url: fileUrl,
    filename: req.file.filename
  });
});

// === Get All Transactions ===
app.get('/api/transactions', async (req, res) => {
  try {
    const [transactions] = await pool.query(`
      SELECT t.*, p.title AS property_title, p.image AS property_image
      FROM transaksi t
      LEFT JOIN property p ON t.Property_id = p.id_property
      ORDER BY t.Id_transaksi DESC
    `);

    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (err) {
    console.error('Error fetching transactions:', err.message);
    res.status(500).json({ success: false, message: 'Gagal mengambil data transaksi' });
  }
});

// === Add New Transaction ===
app.post('/api/transactions', async (req, res) => {
  try {
    const { name, email, phone, property_id, ethAmount, txHash, user_id } = req.body;

    const required = ['name', 'email', 'property_id', 'ethAmount', 'txHash'];
    const missing = required.filter(field => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: 'Field berikut wajib diisi', missing });
    }

    const [result] = await pool.query(`INSERT INTO transaksi SET ?`, {
      User_id: user_id,
      Property_id: property_id,
      name,
      email,
      phone: phone || null,
      eth_amount: ethAmount,
      tx_hash: txHash,
      status: 'Completed',
      created_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil disimpan',
      transactionId: result.insertId
    });
  } catch (err) {
    console.error('Error saving transaction:', err.message);
    res.status(500).json({ success: false, message: 'Gagal menyimpan transaksi', error: err.message });
  }
});

// === Register User ===
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah digunakan' });
    }

    await pool.query('INSERT INTO users SET ?', {
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({ success: true, message: 'Registrasi berhasil' });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, message: 'Gagal registrasi' });
  }
});

// === Login User ===
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email dan password wajib diisi' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Email tidak ditemukan' });
    }

    const user = rows[0];

    if (!user.Password || typeof user.Password !== 'string') {
      return res.status(500).json({ success: false, error: 'Password hash tidak valid' });
    }
    
    const isMatch = await bcrypt.compare(password, user.Password); 
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Password salah' });
    }

    res.json({ success: true, message: 'Login berhasil', user });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, error: 'Gagal login' });
  }
});

// ======== Global Error Handler ========
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ======== Start Server ========
async function startServer() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Gagal koneksi ke database:', err.message);
    process.exit(1);
  }
}

startServer();
