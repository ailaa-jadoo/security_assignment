const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// SQLite database setup
const db = new sqlite3.Database('./data.db');

// Create table
db.run(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  )
`);

// Function to sanitize input data to prevent XSS
function sanitizeInput(input) {
  return input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Routes

// Create item
app.post('/items', (req, res) => {
  const { name, description } = req.body;

  // Sanitize input to prevent XSS
  const sanitizedName = sanitizeInput(name);
  const sanitizedDescription = sanitizeInput(description);

  db.run('INSERT INTO items (name, description) VALUES (?, ?)', [sanitizedName, sanitizedDescription], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    res.status(201).json({ id: this.lastID });
  });
});

// Read items
app.get('/items', (req, res) => {
  db.all('SELECT * FROM items', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    res.json(rows);
  });
});

// Update item
app.put('/items/:id', (req, res) => {
  const itemId = req.params.id;
  const { name, description } = req.body;

  // Sanitize input to prevent XSS
  const sanitizedName = sanitizeInput(name);
  const sanitizedDescription = sanitizeInput(description);

  db.run('UPDATE items SET name=?, description=? WHERE id=?', [sanitizedName, sanitizedDescription, itemId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item updated successfully' });
  });
});

// Delete item
app.delete('/items/:id', (req, res) => {
  const itemId = req.params.id;

  db.run('DELETE FROM items WHERE id=?', [itemId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
