# Blizzint - Global Ski Resort Mapping Application

**Your express lane to the deepest pow**

An interactive full-stack application that maps ski resorts across North America, Europe, and South America with advanced filtering, spatial queries, and admin management.

## Features

- **Interactive Global Map**: Mapbox-powered map with custom snowflake hexagon markers showing 78 resorts worldwide
- **Smart Filtering**: Filter by country, state/province, pass type, and vertical drop with auto-zoom to filtered regions
- **Mutually Exclusive Filters**: Country and state/province filters automatically reset each other for logical filtering
- **Spatial Queries**: Find resorts within a specific radius using PostGIS spatial queries
- **Resort Details**: Comprehensive information including stats, terrain breakdown, amenities, and contact info
- **JWT Authentication**: Secure user authentication with role-based access control
- **Admin-Only User Management**: Centralized user creation and management (no public registration)
- **Admin Panels**: Separate sortable tables for managing resorts and users with CRUD operations
- **Custom Dark Theme**: Professional navy theme (#000044) with enhanced typography and responsive design
- **Fully Responsive**: Mobile-optimized with collapsible navbar, hidden filter panel on small screens, and touch-friendly controls

## Tech Stack

### Frontend
- React 18
- React Bootstrap 2.10
- react-map-gl 7.1 (Mapbox wrapper)
- React Router v6
- Axios with JWT interceptors
- Hot-reload development with webpack polling

### Backend
- Node.js & Express 4
- Knex.js (migrations & query builder)
- PostgreSQL 16 with PostGIS 3.4
- JWT authentication (jsonwebtoken)
- bcryptjs for password hashing
- Express middleware for auth and admin-only routes

### DevOps
- Docker Compose
- Separate containers for postgres, server, and client

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Mapbox API token (free at https://account.mapbox.com/access-tokens/)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blizzint
```

2. Create a `.env` file in the project root:
```bash
MAPBOX_TOKEN=your_mapbox_token_here
```

3. Start the application with Docker Compose:
```bash
docker-compose up --build
```

This will:
- Start PostgreSQL with PostGIS extension
- Run database migrations and seed data
- Start the backend API server on port 3001
- Start the React frontend on port 3000

4. Open your browser to `http://localhost:3000`

### Default Admin Credentials

- **Email**: admin@blizzint.com
- **Password**: admin123

**Note**: Public user registration is disabled. Only admins can create new users via the User Management page. Login with the admin credentials above to access the user management interface.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/profile` - Get current user profile (requires JWT)

### Resorts
- `GET /api/resorts` - List resorts (supports filters and pagination)
- `GET /api/resorts/search?q=<query>` - Search resorts by name
- `GET /api/resorts/nearby?lat=<lat>&lng=<lng>&radius_miles=<miles>` - Spatial query
- `GET /api/resorts/:idOrSlug` - Get single resort by ID or slug
- `POST /api/resorts` - Create resort (admin only)
- `PUT /api/resorts/:id` - Update resort (admin only)
- `DELETE /api/resorts/:id` - Delete resort (admin only)

### User Management (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user with role assignment
- `PUT /api/users/:id` - Update user (name, email, password, role)
- `DELETE /api/users/:id` - Delete user (cannot delete self)

### Filter Parameters

The `GET /api/resorts` endpoint supports:
- `country` - Filter by country code (US, CA, FR, CH, AT, IT, DE, AD, NO, SE, CL, AR) - mutually exclusive with state_province
- `state_province` - Filter by state/province - mutually exclusive with country
- `pass_type` - Filter by pass type (Epic, Ikon, Indy, None)
- `min_vertical_drop` - Minimum vertical drop in feet
- `sort_by` - Sort field (name, summit_elevation_ft, vertical_drop_ft, trail_count, etc.)
- `sort_order` - Sort direction (asc/desc)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 100)

**Note**: Country and state/province filters are mutually exclusive - selecting one automatically clears the other. The map automatically zooms to fit the filtered resorts.

## UI/UX Design

### Custom Theme
- **Primary Color**: #000044 (dark navy) - used for navbar, buttons, links, and brand elements
- **Navbar**: Custom dark background with semi-bold fonts (600 weight), collapsible hamburger menu with white icon (no border/outline)
- **Typography**: Enhanced font weights (600 for labels, 500 for links) for better hierarchy and readability
- **Icons**: Custom SVG snowflake hexagon markers (#000044 background, white snowflake) for resort locations
- **Responsive**: Bootstrap-based responsive grid with mobile-optimized layouts

### Key Components
- **Login Page**: Centered form with custom branding, tagline "Your express lane to the deepest pow" (no public registration)
- **Map View**: Full-screen Mapbox map showing continental US by default, with interactive resort markers and auto-zoom on filter selection
- **Filter Panel**: Sidebar with streamlined filters (country, state/province, pass type, min vertical drop) - hidden on mobile screens (< 768px width)
- **Resort Popups**: Minimal popups with resort name, location, and "Details" link (no close button or stats)
- **Resort Management**: Sortable table with bold resort names, fixed-width action buttons (70px), and modal forms for CRUD operations
- **User Management**: Admin-only page with sortable user table, role badges (user/admin), and create/edit/delete functionality
- **Resort Detail Page**: Header map (no marker), detailed stats, trail breakdown, amenities, and contact info
- **Admin Navigation**: "Resorts" and "Users" links in navbar (admin only)

## Project Structure

```
blizzint/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── FilterPanel.js   # Filter controls
│   │   │   ├── Header.js        # Navigation bar
│   │   │   ├── ProtectedRoute.js # Route guard
│   │   │   └── ResortMarker.js  # Custom SVG marker
│   │   ├── context/
│   │   │   └── AuthContext.js   # JWT auth state
│   │   ├── pages/               # Route pages
│   │   │   ├── Home.js          # Map view with filters
│   │   │   ├── Login.js         # Login form
│   │   │   ├── ResortDetail.js  # Resort details
│   │   │   ├── Admin.js         # Resort management (admin)
│   │   │   └── UserManagement.js # User management (admin)
│   │   ├── services/
│   │   │   └── api.js           # Axios client
│   │   ├── App.js               # Main app with routing
│   │   ├── App.css              # Global styles
│   │   └── index.js             # React entry point
│   ├── public/
│   │   └── index.html           # HTML template
│   ├── Dockerfile               # Frontend container
│   └── package.json             # Dependencies
├── server/                      # Express backend
│   ├── src/
│   │   ├── config/              # Configuration
│   │   │   ├── database.js      # Knex instance
│   │   │   └── env.js           # Environment variables
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.js          # JWT verification
│   │   │   ├── adminOnly.js     # Admin check
│   │   │   └── errorHandler.js  # Error handling
│   │   ├── routes/              # API routes
│   │   │   ├── index.js         # Route aggregator
│   │   │   ├── auth.routes.js   # Auth endpoints
│   │   │   ├── resorts.routes.js # Resort endpoints
│   │   │   └── users.routes.js  # User management (admin)
│   │   ├── controllers/         # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── resorts.controller.js
│   │   │   └── users.controller.js
│   │   ├── services/            # Business logic
│   │   │   ├── auth.service.js  # Auth logic
│   │   │   ├── resorts.service.js # Resort queries
│   │   │   └── users.service.js # User CRUD operations
│   │   ├── app.js               # Express setup
│   │   └── index.js             # Server entry point
│   ├── db/
│   │   ├── migrations/          # Database migrations
│   │   │   ├── 20260206000001_create_users.js
│   │   │   ├── 20260206000002_enable_postgis.js
│   │   │   └── 20260206000003_create_ski_resorts.js
│   │   ├── seeds/               # Seed data
│   │   │   ├── 001_seed_admin_user.js
│   │   │   └── 002_seed_ski_resorts.js
│   │   └── data/
│   │       └── ski_resorts.json # 78 resorts data
│   ├── Dockerfile               # Backend container
│   ├── knexfile.js              # Knex configuration
│   └── package.json             # Dependencies
├── docker-compose.yml           # Multi-container setup
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## Database Schema

### users
- **id**: Primary key (serial)
- **email**: Unique email address
- **password_hash**: bcrypt hashed password
- **name**: User's full name
- **role**: Enum ('user', 'admin')
- **created_at**, **updated_at**: Timestamps
- JWT-based authentication with 7-day expiration
- Role-based access control for admin features

### ski_resorts
- **id**: Primary key (serial)
- **name**, **slug**: Resort name and URL-friendly identifier
- **state_province**, **country**, **region**: Location data
- **latitude**, **longitude**: Coordinates (decimal)
- **location**: PostGIS geography(Point, 4326) - auto-populated by database trigger
- **summit_elevation_ft**, **base_elevation_ft**, **vertical_drop_ft**: Elevation data
- **trail_count**, **lift_count**, **skiable_acreage**: Resort statistics
- **annual_snowfall_inches**: Average snowfall
- **beginner/intermediate/advanced/expert_trails_pct**: Terrain difficulty percentages
- **night_skiing**, **terrain_parks**, **cross_country**, **snowmaking**: Boolean amenities
- **website**, **phone**: Contact information
- **description**: Text description
- **image_url**: Resort image
- **pass_type**: Season pass affiliation (Epic, Ikon, Indy, None)
- **created_at**, **updated_at**: Timestamps
- GiST spatial index on location for efficient radius queries

## Development

### Running locally without Docker

#### Backend
```bash
cd server
npm install
# Configure .env with database credentials
npm run migrate
npm run seed
npm run dev
```

#### Frontend
```bash
cd client
npm install
# Configure .env with API_URL and MAPBOX_TOKEN
npm start
```

### Database Migrations

```bash
cd server
npm run migrate        # Run all migrations
npm run migrate:rollback  # Rollback last migration
npm run seed          # Seed database
```

## Data

The application includes seed data for **78 ski resorts** across three continents:

### North America (38 resorts)
**United States (33)**
- **Rocky Mountains**: Vail, Aspen, Breckenridge, Telluride, Steamboat (Colorado); Park City, Alta, Deer Valley, Snowbird (Utah); Jackson Hole (Wyoming); Big Sky (Montana); Sun Valley (Idaho)
- **West Coast**: Mammoth Mountain, Heavenly, Palisades Tahoe (California/Nevada)
- **Pacific Northwest**: Mt. Bachelor (Oregon); Alyeska (Alaska)
- **Northeast**: Killington, Stowe, Sugarbush (Vermont); Sunday River (Maine)
- **Midwest**: Granite Peak, Wilmot (Wisconsin); Boyne Mountain, Nub's Nob (Michigan); Lutsen Mountains (Minnesota)
- **Southwest**: Taos (New Mexico); Arizona Snowbowl (Arizona)

**Canada (5)**: Whistler Blackcomb, Revelstoke (British Columbia); Banff Sunshine, Lake Louise (Alberta); Tremblant (Quebec)

### Europe (32 resorts)
- **France (11)**: Chamonix, Val d'Isère, Tignes, Courchevel, Méribel, Val Thorens, Alpe d'Huez, La Plagne, Les Deux Alpes, Avoriaz, Les Arcs
- **Switzerland (6)**: Zermatt, Verbier, Saas-Fee, Engelberg, Andermatt, Davos
- **Austria (6)**: St. Anton, Kitzbühel, Ischgl, Sölden, Lech-Zürs, Saalbach-Hinterglemm
- **Italy (4)**: Cortina d'Ampezzo, Livigno, Cervinia, Madonna di Campiglio
- **Norway (2)**: Hemsedal, Trysil
- **Germany (1)**: Garmisch-Partenkirchen
- **Andorra (1)**: Grandvalira
- **Sweden (1)**: Åre

### South America (8 resorts)
- **Chile (4)**: Valle Nevado, Portillo, La Parva, El Colorado
- **Argentina (4)**: Cerro Catedral, Las Leñas, Chapelco, Cerro Castor (world's southernmost ski resort)

## License

MIT
