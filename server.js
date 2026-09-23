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

async function startServer() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is missing.");
    process.exit(1);
  }

  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('setia_mandi_prod');
    console.log("Connected to MongoDB Atlas.");

    // Read Cloud State
    app.get('/api/state', async (req, res) => {
      try {
        const doc = await db.collection('plant_state').findOne({ _id: 'main_state' });
        res.json(doc ? doc.data : {});
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Save Cloud State
    app.post('/api/state', async (req, res) => {
      try {
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

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
}

startServer();
