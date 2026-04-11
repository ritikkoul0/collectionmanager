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
        bought BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add bought column if it doesn't exist (for existing databases)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='items' AND column_name='bought'
        ) THEN
          ALTER TABLE items ADD COLUMN bought BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
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
  const urlPath = url.split('?')[0];

  try {
    // Get all collections with their items
    if (method === 'GET' && urlPath === '/api/collections') {
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
              bought: item.bought || false,
              createdAt: item.created_at
            })),
            createdAt: collection.created_at
          };
        })
      );
      
      return res.status(200).json(collections);
    }

    // Create a new collection
    if (method === 'POST' && urlPath === '/api/collections') {
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
    if (method === 'PUT' && urlPath.startsWith('/api/collections/')) {
      const id = urlPath.split('/')[3];
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
    if (method === 'DELETE' && urlPath.startsWith('/api/collections/') && !urlPath.includes('/items')) {
      const id = urlPath.split('/')[3];
      
      const result = await pool.query('DELETE FROM collections WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Collection not found' });
      }
      
      return res.status(200).json({ message: 'Collection deleted successfully' });
    }

    // Create a new item
    if (method === 'POST' && urlPath.match(/\/api\/collections\/\d+\/items$/)) {
      const collectionId = urlPath.split('/')[3];
      const { title, image, description, link, price, bought } = req.body;
      
      if (!title || !link) {
        return res.status(400).json({ error: 'Title and link are required' });
      }
      
      const result = await pool.query(
        'INSERT INTO items (collection_id, title, image, description, link, price, bought) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [collectionId, title, image || null, description || null, link, price || null, bought || false]
      );
      
      const item = result.rows[0];
      return res.status(201).json({
        id: item.id.toString(),
        title: item.title,
        image: item.image,
        description: item.description,
        link: item.link,
        price: item.price,
        bought: item.bought || false,
        createdAt: item.created_at
      });
    }

    // Update an item
    if (method === 'PUT' && urlPath.startsWith('/api/items/')) {
      const id = urlPath.split('/')[3];
      const { title, image, description, link, price, bought } = req.body;
      
      // If only bought status is being updated
      if (bought !== undefined && !title && !link) {
        const result = await pool.query(
          'UPDATE items SET bought = $1 WHERE id = $2 RETURNING *',
          [bought, id]
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
          bought: item.bought || false,
          createdAt: item.created_at
        });
      }
      
      // Full item update
      if (!title || !link) {
        return res.status(400).json({ error: 'Title and link are required' });
      }
      
      const result = await pool.query(
        'UPDATE items SET title = $1, image = $2, description = $3, link = $4, price = $5, bought = $6 WHERE id = $7 RETURNING *',
        [title, image || null, description || null, link, price || null, bought !== undefined ? bought : false, id]
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
        bought: item.bought || false,
        createdAt: item.created_at
      });
    }

    // Delete an item
    if (method === 'DELETE' && urlPath.startsWith('/api/items/')) {
      const id = urlPath.split('/')[3];
      
      const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      return res.status(200).json({ message: 'Item deleted successfully' });
    }

    // Route not found
    return res.status(404).json({ error: 'API route not found' });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Made with Bob
