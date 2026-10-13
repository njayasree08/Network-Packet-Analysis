from sqlalchemy import Column, String, Float, Integer, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Device(Base):
    __tablename__ = "devices"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    device_type = Column(String, nullable=False)  # pc, server, router, switch, firewall, laptop
    ip_address = Column(String, default="")
    mac_address = Column(String, default="")
    subnet_mask = Column(String, default="255.255.255.0")
    gateway = Column(String, default="")
    services = Column(JSON, default=list)
    ports = Column(JSON, default=list)
    interfaces = Column(JSON, default=list)
    pos_x = Column(Float, default=100.0)
    pos_y = Column(Float, default=100.0)
    topology_id = Column(String, ForeignKey("topologies.id"), nullable=True)
    extra_config = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    topology = relationship("Topology", back_populates="devices")
    src_connections = relationship("Connection", foreign_keys="Connection.source_id", back_populates="source_device")
    dst_connections = relationship("Connection", foreign_keys="Connection.destination_id", back_populates="destination_device")


class Connection(Base):
    __tablename__ = "connections"

    id = Column(String, primary_key=True, default=gen_uuid)
    source_id = Column(String, ForeignKey("devices.id"), nullable=False)
    destination_id = Column(String, ForeignKey("devices.id"), nullable=False)
    source_interface = Column(String, default="eth0")
    destination_interface = Column(String, default="eth0")
    link_type = Column(String, default="ethernet")  # ethernet, fiber, wireless
    bandwidth = Column(Integer, default=1000)  # Mbps
    status = Column(String, default="active")  # active, inactive, error
    topology_id = Column(String, ForeignKey("topologies.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    source_device = relationship("Device", foreign_keys=[source_id], back_populates="src_connections")
    destination_device = relationship("Device", foreign_keys=[destination_id], back_populates="dst_connections")
    topology = relationship("Topology", back_populates="connections")


class Topology(Base):
    __tablename__ = "topologies"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    devices = relationship("Device", back_populates="topology", cascade="all, delete-orphan")
    connections = relationship("Connection", back_populates="topology", cascade="all, delete-orphan")


class TrafficFlow(Base):
    __tablename__ = "traffic_flows"

    id = Column(String, primary_key=True, default=gen_uuid)
    flow_id = Column(String, unique=True, nullable=False)
    source_device_id = Column(String, ForeignKey("devices.id"), nullable=False)
    destination_device_id = Column(String, ForeignKey("devices.id"), nullable=False)
    source_ip = Column(String, default="")
    destination_ip = Column(String, default="")
    source_port = Column(Integer, default=0)
    destination_port = Column(Integer, default=80)
    protocol = Column(String, default="TCP")
    packet_count = Column(Integer, default=100)
    packet_size = Column(Integer, default=512)
    traffic_scenario = Column(String, default="normal")
    features = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String, primary_key=True, default=gen_uuid)
    flow_id = Column(String, nullable=False)
    source_device_id = Column(String, ForeignKey("devices.id"), nullable=True)
    destination_device_id = Column(String, ForeignKey("devices.id"), nullable=True)
    source_name = Column(String, default="")
    destination_name = Column(String, default="")
    source_ip = Column(String, default="")
    destination_ip = Column(String, default="")
    source_port = Column(Integer, default=0)
    destination_port = Column(Integer, default=80)
    protocol = Column(String, default="TCP")
    prediction = Column(String, nullable=False)
    confidence = Column(Float, default=0.0)
    probabilities = Column(JSON, default=dict)
    features_used = Column(JSON, default=dict)
    traffic_scenario = Column(String, default="normal")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
