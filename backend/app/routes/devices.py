from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.schemas import DeviceCreate, DeviceUpdate, DeviceOut
from app.network import devices as device_service

router = APIRouter()


@router.post("", response_model=DeviceOut, status_code=201)
def create_device(data: DeviceCreate, db: Session = Depends(get_db)):
    return device_service.create_device(db, data)


@router.get("", response_model=List[DeviceOut])
def list_devices(topology_id: Optional[str] = None, db: Session = Depends(get_db)):
    return device_service.get_all_devices(db, topology_id)


@router.get("/{device_id}", response_model=DeviceOut)
def get_device(device_id: str, db: Session = Depends(get_db)):
    dev = device_service.get_device(db, device_id)
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")
    return dev


@router.put("/{device_id}", response_model=DeviceOut)
def update_device(device_id: str, data: DeviceUpdate, db: Session = Depends(get_db)):
    dev = device_service.update_device(db, device_id, data)
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")
    return dev


@router.delete("/{device_id}")
def delete_device(device_id: str, db: Session = Depends(get_db)):
    ok = device_service.delete_device(db, device_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"message": "Device deleted", "id": device_id}
