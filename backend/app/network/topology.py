import uuid
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from app.models.db_models import Topology, Device, Connection
from app.schemas.schemas import TopologyCreate


def create_topology(db: Session, data: TopologyCreate) -> Topology:
    topo = Topology(
        id=str(uuid.uuid4()),
        name=data.name,
        description=data.description or "",
    )
    db.add(topo)
    db.commit()
    db.refresh(topo)
    return topo


def get_topology(db: Session, topo_id: str) -> Optional[Topology]:
    return (
        db.query(Topology)
        .options(joinedload(Topology.devices), joinedload(Topology.connections))
        .filter(Topology.id == topo_id)
        .first()
    )


def get_all_topologies(db: Session) -> List[Topology]:
    return db.query(Topology).all()


def delete_topology(db: Session, topo_id: str) -> bool:
    topo = db.query(Topology).filter(Topology.id == topo_id).first()
    if not topo:
        return False
    db.delete(topo)
    db.commit()
    return True


def save_topology_snapshot(db: Session, name: str, devices: list, connections: list) -> Topology:
    """Create a topology from a full snapshot payload."""
    topo = Topology(id=str(uuid.uuid4()), name=name, description="Saved snapshot")
    db.add(topo)
    db.flush()

    for d in devices:
        dev = Device(
            id=d.get("id", str(uuid.uuid4())),
            name=d.get("name", "Device"),
            device_type=d.get("device_type", "pc"),
            ip_address=d.get("ip_address", ""),
            mac_address=d.get("mac_address", ""),
            subnet_mask=d.get("subnet_mask", "255.255.255.0"),
            gateway=d.get("gateway", ""),
            services=d.get("services", []),
            ports=d.get("ports", []),
            interfaces=d.get("interfaces", ["eth0"]),
            pos_x=d.get("pos_x", 100.0),
            pos_y=d.get("pos_y", 100.0),
            topology_id=topo.id,
            extra_config=d.get("extra_config", {}),
        )
        db.add(dev)

    for c in connections:
        conn = Connection(
            id=c.get("id", str(uuid.uuid4())),
            source_id=c.get("source_id"),
            destination_id=c.get("destination_id"),
            source_interface=c.get("source_interface", "eth0"),
            destination_interface=c.get("destination_interface", "eth0"),
            link_type=c.get("link_type", "ethernet"),
            bandwidth=c.get("bandwidth", 1000),
            status=c.get("status", "active"),
            topology_id=topo.id,
        )
        db.add(conn)

    db.commit()
    db.refresh(topo)
    return topo
