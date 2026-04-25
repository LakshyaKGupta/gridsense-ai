# EV Charging Optimization Backend

Production-ready backend for AI-powered EV charging optimization platform.

## Features

- **Authentication**: JWT-based auth with role-based access (admin/operator)
- **Demand Prediction**: ML-powered demand forecasting with caching
- **Optimization Engine**: Linear programming for peak load minimization
- **Location Intelligence**: AI recommendations for new charging stations
- **Simulation Engine**: Synthetic EV behavior generation
- **Explainable AI**: All predictions include confidence scores and reasoning

## Tech Stack

- **FastAPI**: High-performance async web framework
- **PostgreSQL**: Robust relational database
- **SQLAlchemy**: ORM for database operations
- **Redis**: Caching layer
- **OR-Tools**: Linear programming optimization
- **Scikit-learn**: Machine learning for predictions
- **Pydantic**: Data validation and serialization

## Quick Start

1. **Clone and setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **Run the API:**
   ```bash
   uvicorn main:app --reload
   ```

4. **Access API docs:**
   - http://localhost:8000/docs (Swagger UI)
   - http://localhost:8000/redoc (ReDoc)

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Core Features
- `GET /demand/{zone_id}` - Demand prediction
- `GET /optimize/{zone_id}` - Charging optimization
- `GET /locations/recommend` - Station location recommendations
- `GET /simulate/run` - EV behavior simulation

## Architecture

```
app/
├── models/          # SQLAlchemy models
├── schemas/         # Pydantic schemas
├── services/        # Business logic
├── routes/          # API endpoints
├── utils/           # Utilities (auth, cache)
└── database.py      # DB connection
```

## Environment Variables

```bash
DATABASE_URL=postgresql://user:password@localhost/ev_charging
REDIS_HOST=localhost
SECRET_KEY=your-secret-key
```

## Production Deployment

1. **Build Docker image:**
   ```bash
   docker build -t ev-charging-api .
   ```

2. **Deploy with docker-compose:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Testing

```bash
pytest tests/
```

## License

MIT License