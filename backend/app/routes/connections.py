from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.schemas import ConnectionCreate, ConnectionUpdate, ConnectionOut
from app.network import connections as conn_service

router = APIRouter()


@router.post("", response_model=ConnectionOut, status_code=201)
def create_connection(data: ConnectionCreate, db: Session = Depends(get_db)):
    # Validate that both devices exist
    from app.network.devices import get_device
    if not get_device(db, data.source_id):
        raise HTTPException(status_code=404, detail="Source device not found")
    if not get_device(db, data.destination_id):
        raise HTTPException(status_code=404, detail="Destination device not found")
    return conn_service.create_connection(db, data)


@router.get("", response_model=List[ConnectionOut])
def list_connections(topology_id: Optional[str] = None, db: Session = Depends(get_db)):
    return conn_service.get_all_connections(db, topology_id)


@router.get("/{conn_id}", response_model=ConnectionOut)
def get_connection(conn_id: str, db: Session = Depends(get_db)):
    conn = conn_service.get_connection(db, conn_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    return conn


@router.put("/{conn_id}", response_model=ConnectionOut)
def update_connection(conn_id: str, data: ConnectionUpdate, db: Session = Depends(get_db)):
    conn = conn_service.update_connection(db, conn_id, data)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    return conn


@router.delete("/{conn_id}")
def delete_connection(conn_id: str, db: Session = Depends(get_db)):
    ok = conn_service.delete_connection(db, conn_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"message": "Connection deleted", "id": conn_id}


@router.get("/path/{source_id}/{destination_id}")
def get_path(source_id: str, destination_id: str, db: Session = Depends(get_db)):
    path = conn_service.get_path_between(db, source_id, destination_id)
    return {"path": path}
