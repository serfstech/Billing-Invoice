const express = require('express');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static('.'));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

const express = require("express");
const bodyParser = require("body-parser");

app.use(bodyParser.json());

app.get("/api/suppliers", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM suppliers");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/suppliers", async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    await db.query(
      "INSERT INTO suppliers (name, email, phone) VALUES (?, ?, ?)",
      [name, email, phone]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
