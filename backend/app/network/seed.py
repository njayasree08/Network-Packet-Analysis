"""Seed demo interconnected topology when the database has no devices."""
from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from app.models.db_models import Connection, Device, Topology
from app.network.reference_topology import REF_DEVICES, REF_EDGES, REF_TOPOLOGY_NAME


def ensure_interconnected_demo(db: Session) -> bool:
    """Create reference topology if empty. Returns True if seed ran."""
    if db.query(Device).count() > 0:
        return False

    topo = Topology(
        id=str(uuid.uuid4()),
        name=REF_TOPOLOGY_NAME,
        description="Pre-connected lab network aligned with the ML training dataset.",
    )
    db.add(topo)
    db.flush()

    ref_to_id: dict[str, str] = {}
    for spec in REF_DEVICES:
        dev_id = str(uuid.uuid4())
        ref_to_id[spec["ref_id"]] = dev_id
        db.add(
            Device(
                id=dev_id,
                name=spec["name"],
                device_type=spec["device_type"],
                ip_address=spec.get("ip_address", ""),
                subnet_mask=spec.get("subnet_mask", "255.255.255.0"),
                gateway=spec.get("gateway", ""),
                services=spec.get("services", []),
                ports=spec.get("ports", []),
                interfaces=spec.get("interfaces", ["eth0"]),
                pos_x=spec.get("pos_x", 100.0),
                pos_y=spec.get("pos_y", 100.0),
                topology_id=topo.id,
                extra_config={"ref_id": spec["ref_id"]},
            )
        )

    for src_ref, dst_ref in REF_EDGES:
        db.add(
            Connection(
                id=str(uuid.uuid4()),
                source_id=ref_to_id[src_ref],
                destination_id=ref_to_id[dst_ref],
                source_interface="eth0",
                destination_interface="eth0",
                link_type="ethernet",
                bandwidth=1000,
                status="active",
                topology_id=topo.id,
            )
        )

    db.commit()
    return True
