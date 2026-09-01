const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let db;

async function initDB() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is missing.");
    return;
  }
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db('setia_mandi_prod');
    console.log("Connected to MongoDB Atlas.");

    const staffCount = await db.collection('staff').countDocuments();
    if (staffCount === 0) {
      await db.collection('staff').insertMany([
        { name: 'Ramesh Kumar', username: 'ramesh', password: '1234', role: 'staff', blocked: false },
        { name: 'Chirag Setia', username: 'admin', password: '1234', role: 'admin', blocked: false }
      ]);
    }
  } catch (err) {
    console.error("Database connection error:", err);
  }
}
initDB();

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const cleanU = (username || '').trim().toLowerCase();

  if (cleanU === 'admin' && password === 'Csetia@1122') {
    return res.json({ success: true, role: 'admin', user: { name: 'Master Admin', username: 'admin' } });
  }

  try {
    const staff = await db.collection('staff').findOne({ username: cleanU, password: password });
    if (staff) {
      if (staff.blocked) return res.status(403).json({ error: 'Staff account blocked.' });
      return res.json({ success: true, role: 'staff', user: staff });
    }
    return res.status(401).json({ error: 'Invalid credentials.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/state', async (req, res) => {
  try {
    const [staffUsers, agreements, inwards, dispatches] = await Promise.all([
      db.collection('staff').find().toArray(),
      db.collection('agreements').find().toArray(),
      db.collection('inwards').find().toArray(),
      db.collection('dispatches').find().toArray()
    ]);
    res.json({ staffUsers, agreements, inwards, dispatches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agreements', async (req, res) => {
  const result = await db.collection('agreements').insertOne(req.body);
  res.json(result);
});

app.post('/api/inwards', async (req, res) => {
  const result = await db.collection('inwards').insertOne(req.body);
  res.json(result);
});

app.post('/api/dispatches', async (req, res) => {
  const result = await db.collection('dispatches').insertOne(req.body);
  res.json(result);
});

app.post('/api/staff', async (req, res) => {
  const result = await db.collection('staff').insertOne(req.body);
  res.json(result);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
