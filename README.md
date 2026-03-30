# Collections App

A modern collections management application with a black and white color scheme and PostgreSQL database backend.

## Features

- Create and manage multiple collections
- Add items to collections with images, descriptions, links, and prices
- Black and white minimalist design
- PostgreSQL database for persistent storage
- RESTful API backend

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Configuration

The application is pre-configured to connect to your Neon PostgreSQL database:
- Database URL is already set in `server.js`
- Tables will be automatically created on first run

### 3. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

### Collections
- `GET /api/collections` - Get all collections with items
- `POST /api/collections` - Create a new collection
- `PUT /api/collections/:id` - Update a collection
- `DELETE /api/collections/:id` - Delete a collection

### Items
- `POST /api/collections/:collectionId/items` - Create a new item
- `PUT /api/items/:id` - Update an item
- `DELETE /api/items/:id` - Delete an item

## Database Schema

### Collections Table
- `id` - Serial primary key
- `name` - Collection name (required)
- `description` - Collection description (optional)
- `created_at` - Timestamp

### Items Table
- `id` - Serial primary key
- `collection_id` - Foreign key to collections
- `title` - Item title (required)
- `image` - Image URL (optional)
- `description` - Item description (optional)
- `link` - Product link (required)
- `price` - Price (optional)
- `created_at` - Timestamp

## Color Scheme

The application uses a black and white color palette:
- Background: White (#ffffff)
- Surface: Light gray (#f5f5f5)
- Text: Black (#000000)
- Secondary text: Gray (#666666)
- Borders: Light gray (#cccccc)

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: PostgreSQL (Neon)
- Additional: CORS for API access