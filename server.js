const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

let db;

async function initDB() {
  if (!MONGO_URI) return console.error("MONGO_URI is missing.");
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db('setia_mandi_prod');
    console.log("Connected to MongoDB Atlas.");
  } catch (err) {
    console.error("Database connection error:", err);
  }
}
initDB();

// Read Cloud State
app.get('/api/state', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "Database initializing..." });
    const doc = await db.collection('plant_state').findOne({ _id: 'main_state' });
    res.json(doc ? doc.data : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Cloud State
app.post('/api/state', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: "Database initializing..." });
    await db.collection('plant_state').updateOne(
      { _id: 'main_state' },
      { $set: { data: req.body, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
