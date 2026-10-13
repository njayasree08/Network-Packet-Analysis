import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.db_models import Connection
from app.schemas.schemas import ConnectionCreate, ConnectionUpdate


def create_connection(db: Session, data: ConnectionCreate) -> Connection:
    conn = Connection(
        id=str(uuid.uuid4()),
        source_id=data.source_id,
        destination_id=data.destination_id,
        source_interface=data.source_interface or "eth0",
        destination_interface=data.destination_interface or "eth0",
        link_type=data.link_type or "ethernet",
        bandwidth=data.bandwidth or 1000,
        status=data.status or "active",
        topology_id=data.topology_id,
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


def get_connection(db: Session, conn_id: str) -> Optional[Connection]:
    return db.query(Connection).filter(Connection.id == conn_id).first()


def get_all_connections(db: Session, topology_id: Optional[str] = None) -> List[Connection]:
    q = db.query(Connection)
    if topology_id:
        q = q.filter(Connection.topology_id == topology_id)
    return q.all()


def update_connection(db: Session, conn_id: str, data: ConnectionUpdate) -> Optional[Connection]:
    conn = get_connection(db, conn_id)
    if not conn:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(conn, field, value)
    db.commit()
    db.refresh(conn)
    return conn


def delete_connection(db: Session, conn_id: str) -> bool:
    conn = get_connection(db, conn_id)
    if not conn:
        return False
    db.delete(conn)
    db.commit()
    return True


def _connection_graph(db: Session):
    from app.models.db_models import Connection as C
    from app.network.graph import build_adjacency

    all_conns = db.query(C).all()
    edges = [(c.source_id, c.destination_id) for c in all_conns]
    return build_adjacency(edges)


def is_connected(db: Session, source_id: str, destination_id: str) -> bool:
    from app.network.graph import is_reachable

    if source_id == destination_id:
        return False
    return is_reachable(_connection_graph(db), source_id, destination_id)


def get_path_between(db: Session, source_id: str, destination_id: str) -> List[str]:
    """BFS path through links; empty list if devices are not interconnected."""
    from app.network.graph import find_path

    path = find_path(_connection_graph(db), source_id, destination_id)
    return path or []
