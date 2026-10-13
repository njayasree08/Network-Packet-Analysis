from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any
from pydantic import BaseModel
from app.database import get_db
from app.schemas.schemas import TopologyCreate, TopologyOut
from app.network import topology as topo_service

router = APIRouter()


class TopologySnapshot(BaseModel):
    name: str
    devices: List[Any] = []
    connections: List[Any] = []


@router.post("", response_model=TopologyOut, status_code=201)
def create_topology(data: TopologyCreate, db: Session = Depends(get_db)):
    return topo_service.create_topology(db, data)


@router.get("", response_model=List[TopologyOut])
def list_topologies(db: Session = Depends(get_db)):
    return topo_service.get_all_topologies(db)


@router.get("/{topo_id}", response_model=TopologyOut)
def get_topology(topo_id: str, db: Session = Depends(get_db)):
    topo = topo_service.get_topology(db, topo_id)
    if not topo:
        raise HTTPException(status_code=404, detail="Topology not found")
    return topo


@router.post("/save", response_model=TopologyOut, status_code=201)
def save_snapshot(data: TopologySnapshot, db: Session = Depends(get_db)):
    topo = topo_service.save_topology_snapshot(db, data.name, data.devices, data.connections)
    return topo_service.get_topology(db, topo.id)


@router.delete("/{topo_id}")
def delete_topology(topo_id: str, db: Session = Depends(get_db)):
    ok = topo_service.delete_topology(db, topo_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Topology not found")
    return {"message": "Topology deleted", "id": topo_id}
