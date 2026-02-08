# BlizzInt - Global Ski Resort Mapping Application

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
- CloudFront CDN distribution

### Backend
- Node.js & Express 4
- Knex.js (migrations & query builder)
- PostgreSQL 16 with PostGIS 3.4
- JWT authentication (jsonwebtoken)
- bcryptjs for password hashing
- ECS Fargate containers
- Application Load Balancer

### Infrastructure
- **AWS CDK** for infrastructure as code
- **ECS Fargate** for containerized API deployment
- **RDS PostgreSQL** with PostGIS extension
- **S3 + CloudFront** for frontend hosting
- **Route 53** for DNS management
- **ACM** for SSL/TLS certificates
- **Secrets Manager** for secure credential storage
- **CloudWatch** for logging and monitoring

### DevOps
- Docker with multi-stage builds
- GitHub Actions for CI/CD
- Docker Compose for local development

## Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Route 53 (DNS)                           │
│              demo.blizzint.app | api.blizzint.app           │
└───────────────┬─────────────────────────┬───────────────────┘
                │                         │
     ┌──────────▼────────┐      ┌────────▼──────────┐
     │   CloudFront      │      │  Application      │
     │   Distribution    │      │  Load Balancer    │
     │  (Frontend CDN)   │      │   (API HTTPS)     │
     └──────────┬────────┘      └────────┬──────────┘
                │                        │
     ┌──────────▼────────┐      ┌────────▼──────────┐
     │   S3 Bucket       │      │  ECS Fargate      │
     │  (React Build)    │      │  (API Container)  │
     └───────────────────┘      └────────┬──────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  RDS PostgreSQL 16  │
                              │  with PostGIS 3.4   │
                              └─────────────────────┘
```

## Getting Started

### Local Development with Docker

#### Prerequisites

- Docker and Docker Compose
- Mapbox API token (free at https://account.mapbox.com/access-tokens/)

#### Installation

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

- **Email**: admin@blizzint.app
- **Password**: admin123

**Note**: Public user registration is disabled. Only admins can create new users via the User Management page.

## Production Deployment

### Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Node.js 20+** and npm
3. **AWS CDK CLI**: `npm install -g aws-cdk`
4. **Docker** for building container images
5. **Mapbox Token** for map functionality

### Initial Infrastructure Setup

#### 1. Bootstrap CDK (First time only)

```bash
cd infrastructure
npm install
cdk bootstrap aws://ACCOUNT_ID/us-east-1
```

#### 2. Create Required Secrets

Create JWT secret in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name /blizzint/api/jwt-secret \
  --secret-string "your-secure-random-jwt-secret-here" \
  --region us-east-1
```

#### 3. Deploy Infrastructure Stacks

Deploy all stacks:

```bash
cdk deploy --all
```

Or deploy individually:

```bash
cdk deploy BlizzIntDatabaseStack    # Database first
cdk deploy BlizzIntApiStack         # Then API
cdk deploy BlizzIntFrontendStack    # Finally frontend
```

This creates:
- RDS PostgreSQL 16 instance with PostGIS
- ECS Fargate cluster and service
- ECR repository for API images
- Application Load Balancer with HTTPS
- S3 bucket for frontend
- CloudFront distribution
- Route 53 DNS records

#### 4. Build and Deploy API

```bash
# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build for AMD64 architecture (required for ECS)
cd server
docker build --platform linux/amd64 -f Dockerfile.prod -t blizzint-api:latest .

# Tag and push to ECR
docker tag blizzint-api:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/blizzint-api:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/blizzint-api:latest
```

#### 5. Run Database Migrations

Migrations run automatically via ECS task:

```bash
# Get private subnets and security group
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=VPC_ID" \
  --query 'Subnets[?MapPublicIpOnLaunch==`false`].SubnetId' --output text | tr '\t' ',')

# Run migration task
aws ecs run-task \
  --cluster blizzint-api-cluster \
  --task-definition TASK_DEFINITION_ARN \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[SG_ID],assignPublicIp=DISABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "blizzint-api",
      "command": ["node_modules/.bin/knex", "migrate:latest", "--env", "production"]
    }]
  }'

# Run seeds
aws ecs run-task \
  --cluster blizzint-api-cluster \
  --task-definition TASK_DEFINITION_ARN \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[SG_ID],assignPublicIp=DISABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "blizzint-api",
      "command": ["node_modules/.bin/knex", "seed:run", "--env", "production"]
    }]
  }'
```

#### 6. Deploy Frontend

```bash
cd client

# Build with production environment variables
REACT_APP_API_URL=https://api.blizzint.app \
REACT_APP_MAPBOX_TOKEN=your_mapbox_token \
npm install && npm run build

# Deploy to S3
aws s3 sync build/ s3://BUCKET_NAME/ --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html" --exclude "asset-manifest.json"

# Upload HTML with no-cache headers
aws s3 cp build/index.html s3://BUCKET_NAME/index.html \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/*"
```

#### 7. Update ECS Service

Force the ECS service to deploy the new image:

```bash
aws ecs update-service \
  --cluster blizzint-api-cluster \
  --service SERVICE_NAME \
  --force-new-deployment
```

### Current Production Configuration

**Deployed Resources:**

- **Frontend**
  - URL: https://demo.blizzint.app
  - S3 Bucket: `blizzint-frontend-620743043986`
  - CloudFront Distribution: `E1KKQCRZ1A7HRJ`

- **API**
  - URL: https://api.blizzint.app
  - ECS Cluster: `blizzint-api-cluster`
  - ECR Repository: `620743043986.dkr.ecr.us-east-1.amazonaws.com/blizzint-api`

- **Database**
  - RDS PostgreSQL 16 with PostGIS 3.4
  - Instance: t3.micro
  - Storage: 20GB GP3 (auto-scaling to 100GB)
  - Private subnet (not publicly accessible)

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

### Health Check
- `GET /health` - API health status

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
│   ├── Dockerfile               # Development container
│   ├── Dockerfile.prod          # Production build (future)
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
│   ├── Dockerfile               # Development container
│   ├── Dockerfile.prod          # Production container
│   ├── knexfile.js              # Knex configuration
│   └── package.json             # Dependencies
├── infrastructure/              # AWS CDK infrastructure
│   ├── bin/
│   │   └── app.ts               # CDK app entry point
│   ├── lib/
│   │   ├── database-stack.ts    # RDS PostgreSQL stack
│   │   ├── api-stack.ts         # ECS Fargate API stack
│   │   └── frontend-stack.ts    # S3/CloudFront stack
│   ├── cdk.json                 # CDK configuration
│   └── package.json             # CDK dependencies
├── .github/
│   └── workflows/
│       ├── deploy-api.yml       # API deployment pipeline
│       └── deploy-frontend.yml  # Frontend deployment pipeline
├── docker-compose.yml           # Local development setup
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

### ski_resorts
- **id**: Primary key (serial)
- **name**, **slug**: Resort name and URL-friendly identifier
- **state_province**, **country**, **region**: Location data
- **latitude**, **longitude**: Coordinates (decimal)
- **location**: PostGIS geography(Point, 4326) - auto-populated by trigger
- **summit_elevation_ft**, **base_elevation_ft**, **vertical_drop_ft**: Elevation data
- **trail_count**, **lift_count**, **skiable_acreage**: Resort statistics
- **annual_snowfall_inches**: Average snowfall
- **beginner/intermediate/advanced/expert_trails_pct**: Terrain percentages
- **night_skiing**, **terrain_parks**, **cross_country**, **snowmaking**: Amenities
- **website**, **phone**: Contact information
- **description**: Text description
- **image_url**: Resort image
- **pass_type**: Season pass affiliation (Epic, Ikon, Indy, None)
- **created_at**, **updated_at**: Timestamps
- GiST spatial index on location for efficient radius queries

## Database Migrations

### Running Locally

```bash
cd server
npm run migrate        # Run all migrations
npm run migrate:rollback  # Rollback last migration
npm run seed          # Seed database
```

### Production Migrations

Migrations in production are run via one-off ECS tasks that execute within the VPC. This ensures secure database access without exposing the database publicly.

## Data Coverage

The application includes seed data for **78 ski resorts** across three continents:

### North America (38 resorts)
**United States (33)**: Vail, Aspen, Breckenridge, Telluride, Park City, Jackson Hole, Mammoth, and more
**Canada (5)**: Whistler Blackcomb, Revelstoke, Banff Sunshine, Lake Louise, Tremblant

### Europe (32 resorts)
**France (11)**: Chamonix, Val d'Isère, Courchevel, and more
**Switzerland (6)**: Zermatt, Verbier, Saas-Fee, and more
**Austria (6)**: St. Anton, Kitzbühel, Ischgl, and more
**Italy (4)**: Cortina d'Ampezzo, Livigno, Cervinia, Madonna di Campiglio

### South America (8 resorts)
**Chile (4)**: Valle Nevado, Portillo, La Parva, El Colorado
**Argentina (4)**: Cerro Catedral, Las Leñas, Chapelco, Cerro Castor

## Monitoring and Logs

### CloudWatch Logs

View API logs:
```bash
aws logs tail /ecs/blizzint-api --follow --region us-east-1
```

### Performance Monitoring

- **ECS Container Insights**: Enabled for cluster metrics
- **RDS Performance Insights**: Enabled for database performance
- **CloudFront Monitoring**: Request/error metrics
- **ALB Access Logs**: Load balancer metrics

### Health Checks

- API Health: https://api.blizzint.app/health
- ECS Task Health: Configured with curl health checks every 30s
- ALB Target Health: Monitors `/health` endpoint

## Cost Optimization

Current production configuration estimated at ~$30-50/month:

- **RDS**: t3.micro instance ($15-20/month)
- **ECS Fargate**: 256 CPU, 512MB RAM, 1-4 tasks ($10-15/month)
- **S3 + CloudFront**: Standard storage with price class 100 ($5-10/month)
- **Data Transfer**: Minimal for low-medium traffic ($5/month)

Auto-scaling configured:
- Min tasks: 1
- Max tasks: 4
- Scale-up threshold: 70% CPU utilization

## Troubleshooting

### API Issues

Check ECS service status:
```bash
aws ecs describe-services \
  --cluster blizzint-api-cluster \
  --services SERVICE_NAME
```

View recent logs:
```bash
aws logs tail /ecs/blizzint-api --since 10m
```

### Frontend Issues

Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation \
  --distribution-id E1KKQCRZ1A7HRJ \
  --paths "/*"
```

Check S3 bucket contents:
```bash
aws s3 ls s3://blizzint-frontend-620743043986/
```

### Database Issues

Check RDS instance status:
```bash
aws rds describe-db-instances \
  --db-instance-identifier DB_INSTANCE_ID
```

Verify security group rules allow ECS tasks to connect on port 5432.

## Security

- **HTTPS Only**: All traffic encrypted with ACM certificates
- **Private Database**: RDS in private subnet, not publicly accessible
- **JWT Authentication**: 7-day token expiration
- **Role-Based Access**: Admin-only endpoints protected
- **Password Hashing**: bcrypt with salt rounds
- **Secrets Management**: AWS Secrets Manager for credentials
- **Security Groups**: Least-privilege network access
- **S3 Bucket**: Block public access, CloudFront OAI only

## CI/CD Pipeline

GitHub Actions workflows automatically deploy on push to `main`:

- **API Deployment**: Triggers on changes to `server/**`
  - Builds Docker image for AMD64
  - Pushes to ECR
  - Forces ECS service redeployment

- **Frontend Deployment**: Triggers on changes to `client/**`
  - Builds React app with production env vars
  - Syncs to S3
  - Invalidates CloudFront cache

## License

MIT
