require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const syncDatabase = require('./config/sync');
const exportRoutes = require('./routes/export.routes');
const app = express();
console.log("URL de conexión:", process.env.DATABASE_URL);

// Sincronizar base de datos
syncDatabase();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', exportRoutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));