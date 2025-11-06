


import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'node:http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});
app.use(express.json());
app.use(cors());

const { DB_USER, DB_PASS, DB_CLUSTER, DB_NAME = 'FinAIcer' } = process.env;
const encodedPass = encodeURIComponent(DB_PASS);

const MONGO_URI = `mongodb+srv://${DB_USER}:${encodedPass}@${DB_CLUSTER}.mongodb.net/${DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB');
  } catch (err) {
    console.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  }
}
await connectMongo();

// Modelo User
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

// Modelo Transaction
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['ingreso', 'egreso'], required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });
const Transaction = mongoose.model('Transaction', transactionSchema);

// Modelo Report
const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true },
  totalIncome: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  topCategories: [
    {
      category: String,
      amount: Number
    }
  ]
}, { timestamps: true });
const Report = mongoose.model('Report', reportSchema);
// --- RUTAS DE PRUEBA ---
// Login de usuario
app.post('/api/usuarios/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password requeridos' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    if (user.password !== password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    // Opcional: no enviar password en la respuesta
    const { password: _, ...userData } = user.toObject();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    console.log('Usuario creado:', user);
	res.status(201).json(user);
  } catch (err) {
	res.status(400).json({ error: err.message });
  }
});
// Cierre final para evitar error de sintaxis
// ...fin de función POST /users

// Listar usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const users = await User.find();
    console.log('Usuarios:', users);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Borrar todos los usuarios
app.delete('/api/usuarios', async (req, res) => {
  try {
    const result = await User.deleteMany({});
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Borrar usuario por ID
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear transacción
app.post('/api/transacciones', async (req, res) => {
  try {
    if (!req.body.userId) {
      return res.status(400).json({ error: 'userId es requerido para crear la transacción' });
    }
    const tx = new Transaction(req.body);
    await tx.save();
    console.log('Transacción creada:', tx);
    io.emit('nueva-transaccion', tx); // Emitir evento en tiempo real
    res.status(201).json(tx);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar transacciones
app.get('/api/transacciones', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido para listar transacciones' });
    }
    const txs = await Transaction.find({ userId });
    console.log('Transacciones del usuario', userId, txs);
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Borrar todas las transacciones
app.delete('/api/transacciones', async (req, res) => {
  try {
    const result = await Transaction.deleteMany({});
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Borrar transacción por ID
app.delete('/api/transacciones/:id', async (req, res) => {
  try {
    const result = await Transaction.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/reportes', async (req, res) => {
  console.log('POST /reports body:', req.body);
  try {
    const report = new Report(req.body);
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    console.error('Error al guardar reporte:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/reportes', async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta para listar todos los reportes (acceso directo para pruebas)
app.get('/api/reportes/listar', async (req, res) => {
  try {
    const reports = await Report.find();
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Endpoint Gemini Chat ---
import fetch from 'node-fetch';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;

app.post('/gemini-chat', async (req, res) => {
  const { mensaje } = req.body;
  if (!mensaje) {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }
  // Prompt base mejorado para personalidad FinAIcer
  const promptBase = `Eres FinAIcer, una IA de asistencia financiera. Siempre responde presentándote como FinAIcer cuando te pregunten quién eres o tu identidad. Tus respuestas deben ser concisas, amigables y serviciales. Usa formato Markdown (negritas, listas, tablas, etc.) y agrega al menos un emoji relevante en cada respuesta para hacerla más visual y comprensible.`;
  // Combina el prompt base con el mensaje del usuario
  const mensajeFinal = `${promptBase}\nUsuario: ${mensaje}`;
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: mensajeFinal }] }]
      })
    });
    const data = await response.json();
    // Mostrar la respuesta completa para depuración
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
      console.error('Gemini response:', JSON.stringify(data));
      return res.json({ respuesta: 'No hay respuesta.', detalle: data });
    }
    const texto = data.candidates[0].content.parts[0].text;
    res.json({ respuesta: texto, detalle: data });
  } catch (err) {
    res.status(500).json({ error: 'Error comunicando con Gemini: ' + err.message });
  }
});







// --- FIN DE RUTAS ---

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
  console.log('Ejecutando callback de app.listen...');
  try {
    const count = await Report.countDocuments();
    console.log(`Reportes en la base de datos: ${count}`);
  } catch (err) {
    console.error('Error al contar reportes:', err.message);
  }
});

// Middleware de ruta no encontrada (debe ir al final)
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ...existing code...

// Listar transacciones de un usuario
app.get('/api/usuarios/:id/transacciones', async (req, res) => {
  const txs = await Transaction.find({ userId: req.params.id });
  res.json(txs);
});

// 📊 Reporte mensual de ingresos/egresos por usuario (ahora guardado en DB)
app.get('/api/usuarios/:id/reportes/:yyyymm', async (req, res) => {
  try {
    const userId = req.params.id;
    const period = req.params.yyyymm; // Ejemplo: "2025-09"

    // 🔍 Verificar si ya existe
    let existingReport = await Report.findOne({ userId, period });
    if (existingReport) {
      return res.json(existingReport);
    }

    // Calcular rango de fechas
    const [year, month] = period.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    // Totales por tipo
    const totals = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: start, $lt: end }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;


    for (const t of totals) {
      if (t._id === 'ingreso') totalIncome = t.total;
      if (t._id === 'egreso') totalExpenses = t.total;
    }

    const balance = totalIncome - totalExpenses;

    // Top categorías
    const categories = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: start, $lt: end }
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { amount: -1 } },
      { $limit: 5 }
    ]);

    // Guardar reporte
    const report = await Report.create({
      userId,
      period,
      totalIncome,
      totalExpenses,
      balance,
      topCategories: categories.map(c => ({
        category: c._id,
        amount: c.amount
      }))
    });

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generando reporte' });
  }
});
