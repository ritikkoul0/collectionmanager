const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// PostgreSQL connection
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_vM0sRuyX8tgB@ep-small-grass-an91whe3-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Successfully connected to PostgreSQL database');
    release();
  }
});

// Initialize database tables
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        image TEXT,
        description TEXT,
        link TEXT NOT NULL,
        price VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
}

// Initialize database on startup
initDatabase();

// API Routes

// Get all collections with their items
app.get('/api/collections', async (req, res) => {
  try {
    const collectionsResult = await pool.query(
      'SELECT * FROM collections ORDER BY created_at DESC'
    );
    
    const collections = await Promise.all(
      collectionsResult.rows.map(async (collection) => {
        const itemsResult = await pool.query(
          'SELECT * FROM items WHERE collection_id = $1 ORDER BY created_at DESC',
          [collection.id]
        );
        return {
          id: collection.id.toString(),
          name: collection.name,
          description: collection.description,
          items: itemsResult.rows.map(item => ({
            id: item.id.toString(),
            title: item.title,
            image: item.image,
            description: item.description,
            link: item.link,
            price: item.price,
            createdAt: item.created_at
          })),
          createdAt: collection.created_at
        };
      })
    );
    
    res.json(collections);
  } catch (err) {
    console.error('Error fetching collections:', err);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Create a new collection
app.post('/api/collections', async (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Collection name is required' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO collections (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    
    const collection = result.rows[0];
    res.status(201).json({
      id: collection.id.toString(),
      name: collection.name,
      description: collection.description,
      items: [],
      createdAt: collection.created_at
    });
  } catch (err) {
    console.error('Error creating collection:', err);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// Update a collection
app.put('/api/collections/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Collection name is required' });
  }
  
  try {
    const result = await pool.query(
      'UPDATE collections SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    const collection = result.rows[0];
    res.json({
      id: collection.id.toString(),
      name: collection.name,
      description: collection.description,
      createdAt: collection.created_at
    });
  } catch (err) {
    console.error('Error updating collection:', err);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// Delete a collection
app.delete('/api/collections/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM collections WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    res.json({ message: 'Collection deleted successfully' });
  } catch (err) {
    console.error('Error deleting collection:', err);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// Create a new item
app.post('/api/collections/:collectionId/items', async (req, res) => {
  const { collectionId } = req.params;
  const { title, image, description, link, price } = req.body;
  
  if (!title || !link) {
    return res.status(400).json({ error: 'Title and link are required' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO items (collection_id, title, image, description, link, price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [collectionId, title, image || null, description || null, link, price || null]
    );
    
    const item = result.rows[0];
    res.status(201).json({
      id: item.id.toString(),
      title: item.title,
      image: item.image,
      description: item.description,
      link: item.link,
      price: item.price,
      createdAt: item.created_at
    });
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update an item
app.put('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const { title, image, description, link, price } = req.body;
  
  if (!title || !link) {
    return res.status(400).json({ error: 'Title and link are required' });
  }
  
  try {
    const result = await pool.query(
      'UPDATE items SET title = $1, image = $2, description = $3, link = $4, price = $5 WHERE id = $6 RETURNING *',
      [title, image || null, description || null, link, price || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const item = result.rows[0];
    res.json({
      id: item.id.toString(),
      title: item.title,
      image: item.image,
      description: item.description,
      link: item.link,
      price: item.price,
      createdAt: item.created_at
    });
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete an item
app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Made with Bob
