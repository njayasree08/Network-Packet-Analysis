from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
import app.models.db_models  # ensure models are registered

from app.routes import devices, connections, topology, traffic, dashboard
from app.network.seed import ensure_interconnected_demo

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_interconnected_demo(db)
    finally:
        db.close()
    yield


# Create all tables (also ensured on startup)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PacketSentinel Network IDS API",
    description="Machine Learning-Based Network Intrusion Detection Using Flow-Based Traffic Analysis",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])
app.include_router(connections.router, prefix="/api/connections", tags=["Connections"])
app.include_router(topology.router, prefix="/api/topology", tags=["Topology"])
app.include_router(traffic.router, prefix="/api/traffic", tags=["Traffic"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

# Optional ML routes: import lazily and skip if heavy dependencies (pandas) are missing
try:
    from app.routes import predict, ml_metrics

    app.include_router(predict.router, prefix="/api", tags=["Predict"])
    app.include_router(ml_metrics.router, prefix="/api/ml", tags=["ML Metrics"])
except Exception as e:
    import logging

    logging.getLogger(__name__).warning("ML routes disabled at startup: %s", e)


@app.get("/")
def root():
    return {"message": "Network IDS API running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
