const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
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

// Initialize database on first request
let dbInitialized = false;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Initialize database on first request
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }

  const { method, url } = req;
  const path = url.split('?')[0];

  try {
    // Get all collections with their items
    if (method === 'GET' && path === '/api/collections') {
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
      
      return res.status(200).json(collections);
    }

    // Create a new collection
    if (method === 'POST' && path === '/api/collections') {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Collection name is required' });
      }
      
      const result = await pool.query(
        'INSERT INTO collections (name, description) VALUES ($1, $2) RETURNING *',
        [name, description || null]
      );
      
      const collection = result.rows[0];
      return res.status(201).json({
        id: collection.id.toString(),
        name: collection.name,
        description: collection.description,
        items: [],
        createdAt: collection.created_at
      });
    }

    // Update a collection
    if (method === 'PUT' && path.startsWith('/api/collections/')) {
      const id = path.split('/')[3];
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Collection name is required' });
      }
      
      const result = await pool.query(
        'UPDATE collections SET name = $1, description = $2 WHERE id = $3 RETURNING *',
        [name, description || null, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Collection not found' });
      }
      
      const collection = result.rows[0];
      return res.status(200).json({
        id: collection.id.toString(),
        name: collection.name,
        description: collection.description,
        createdAt: collection.created_at
      });
    }

    // Delete a collection
    if (method === 'DELETE' && path.startsWith('/api/collections/') && !path.includes('/items')) {
      const id = path.split('/')[3];
      
      const result = await pool.query('DELETE FROM collections WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Collection not found' });
      }
      
      return res.status(200).json({ message: 'Collection deleted successfully' });
    }

    // Create a new item
    if (method === 'POST' && path.match(/\/api\/collections\/\d+\/items$/)) {
      const collectionId = path.split('/')[3];
      const { title, image, description, link, price } = req.body;
      
      if (!title || !link) {
        return res.status(400).json({ error: 'Title and link are required' });
      }
      
      const result = await pool.query(
        'INSERT INTO items (collection_id, title, image, description, link, price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [collectionId, title, image || null, description || null, link, price || null]
      );
      
      const item = result.rows[0];
      return res.status(201).json({
        id: item.id.toString(),
        title: item.title,
        image: item.image,
        description: item.description,
        link: item.link,
        price: item.price,
        createdAt: item.created_at
      });
    }

    // Update an item
    if (method === 'PUT' && path.startsWith('/api/items/')) {
      const id = path.split('/')[3];
      const { title, image, description, link, price } = req.body;
      
      if (!title || !link) {
        return res.status(400).json({ error: 'Title and link are required' });
      }
      
      const result = await pool.query(
        'UPDATE items SET title = $1, image = $2, description = $3, link = $4, price = $5 WHERE id = $6 RETURNING *',
        [title, image || null, description || null, link, price || null, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      const item = result.rows[0];
      return res.status(200).json({
        id: item.id.toString(),
        title: item.title,
        image: item.image,
        description: item.description,
        link: item.link,
        price: item.price,
        createdAt: item.created_at
      });
    }

    // Delete an item
    if (method === 'DELETE' && path.startsWith('/api/items/')) {
      const id = path.split('/')[3];
      
      const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      return res.status(200).json({ message: 'Item deleted successfully' });
    }

    // Route not found
    return res.status(404).json({ error: 'Route not found' });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Made with Bob
