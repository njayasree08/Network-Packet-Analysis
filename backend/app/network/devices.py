import uuid
import random
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.db_models import Device
from app.schemas.schemas import DeviceCreate, DeviceUpdate


def _random_mac():
    return ":".join([f"{random.randint(0,255):02x}" for _ in range(6)])


def create_device(db: Session, data: DeviceCreate) -> Device:
    mac = data.mac_address if data.mac_address else _random_mac()
    device = Device(
        id=str(uuid.uuid4()),
        name=data.name,
        device_type=data.device_type,
        ip_address=data.ip_address or "",
        mac_address=mac,
        subnet_mask=data.subnet_mask or "255.255.255.0",
        gateway=data.gateway or "",
        services=data.services or [],
        ports=data.ports or [],
        interfaces=data.interfaces or ["eth0"],
        pos_x=data.pos_x or 100.0,
        pos_y=data.pos_y or 100.0,
        topology_id=data.topology_id,
        extra_config=data.extra_config or {},
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


def get_device(db: Session, device_id: str) -> Optional[Device]:
    return db.query(Device).filter(Device.id == device_id).first()


def get_all_devices(db: Session, topology_id: Optional[str] = None) -> List[Device]:
    q = db.query(Device)
    if topology_id:
        q = q.filter(Device.topology_id == topology_id)
    return q.all()


def update_device(db: Session, device_id: str, data: DeviceUpdate) -> Optional[Device]:
    device = get_device(db, device_id)
    if not device:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(device, field, value)
    db.commit()
    db.refresh(device)
    return device


def delete_device(db: Session, device_id: str) -> bool:
    device = get_device(db, device_id)
    if not device:
        return False
    db.delete(device)
    db.commit()
    return True
