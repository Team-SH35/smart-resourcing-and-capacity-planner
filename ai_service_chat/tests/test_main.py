"""Tests for the FastAPI app setup and root endpoint."""
import pytest
from fastapi.testclient import TestClient

from app_backend.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_root_endpoint_returns_200(client):
    response = client.get("/")
    assert response.status_code == 200


def test_root_endpoint_returns_service_name(client):
    response = client.get("/")
    data = response.json()
    assert "service" in data


def test_root_endpoint_returns_running_status(client):
    response = client.get("/")
    data = response.json()
    assert data["status"] == "running"


def test_root_endpoint_returns_version(client):
    response = client.get("/")
    data = response.json()
    assert "version" in data


def test_cors_header_present_on_response(client):
    response = client.get("/", headers={"Origin": "http://localhost:3000"})
    assert "access-control-allow-origin" in response.headers


def test_unknown_route_returns_404(client):
    response = client.get("/this-does-not-exist")
    assert response.status_code == 404


def test_api_v1_prefix_is_mounted(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
