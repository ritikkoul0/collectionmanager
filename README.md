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

## Deployment to Vercel

### Prerequisites
- A [Vercel account](https://vercel.com/signup)
- A PostgreSQL database (Neon is recommended)
- Git repository with your code

### Deployment Steps

1. **Install Vercel CLI** (optional, for command-line deployment):
   ```bash
   npm install -g vercel
   ```

2. **Push your code to a Git repository** (GitHub, GitLab, or Bitbucket)

3. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository
   - Configure the project:
     - Framework Preset: Other
     - Build Command: (leave empty)
     - Output Directory: (leave empty)
     - Install Command: `npm install`

4. **Set Environment Variables**:
   In the Vercel project settings, add the following environment variable:
   - `DATABASE_URL`: Your PostgreSQL connection string
     ```
     postgresql://username:password@host/database?sslmode=require
     ```

5. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your application
   - You'll receive a production URL (e.g., `your-app.vercel.app`)

### Alternative: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Add environment variable
vercel env add DATABASE_URL
```

### Post-Deployment

- The database tables will be automatically created on first access
- Test all API endpoints to ensure they work correctly
- Monitor the Vercel dashboard for any errors or issues

### Important Notes

- Never commit your `.env` file or expose your database credentials
- Use the `.env.example` file as a template for required environment variables
- Vercel automatically handles SSL certificates and HTTPS
- The application will scale automatically based on traffic