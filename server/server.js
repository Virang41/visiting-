//  aa requir chh servr maat
const express = require('express');
// cors function lity chh weebsite ni
const cors = require('cors');
const path = require('path')
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();

// Conect to md
connectDB();

// Middium
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',

  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// file in the folder
app.use('/uploads', express.static(path.join(__dirname, 'upload')));

// Road
app.use('/api/auth', require('./routes/auth'));
\
app.use('/api/users', require('./routes/user'));
app.use('/api/visitors', require('./routes/visitor'));
app.use('/api/appointments', require('./routes/appointment'));
// appointmnt mate khoobajh inpotnt ch
app.use('/api/checkins', require('./routes/check'));
app.use('/api/dashboard', require('./routes/dashbord'));
// dashboard show kare tema usr ni dtail sho thai chh
app.get('/api/healt', (req, res) => {
  res.json({ status: 'OK', message: 'Vistors Pass API is run', time: new Date() });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Erro' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health\n`);
});
// important chhe cod emate
