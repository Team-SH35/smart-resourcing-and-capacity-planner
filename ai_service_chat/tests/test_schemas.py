"""Tests for Pydantic schema validation."""
from datetime import datetime

import pytest
from pydantic import ValidationError

from app_backend.models.schemas import ChatMessage, ChatResponse


def test_chat_message_accepts_camel_case_alias():
    msg = ChatMessage.model_validate({"message": "Hello", "userId": "u1"})
    assert msg.user_id == "u1"


def test_chat_message_accepts_snake_case():
    msg = ChatMessage(message="Hello", user_id="u1")
    assert msg.user_id == "u1"


def test_chat_message_session_id_defaults_to_none():
    msg = ChatMessage(message="Hello", user_id="u1")
    assert msg.session_id is None


def test_chat_message_session_id_can_be_set():
    msg = ChatMessage.model_validate({"message": "Hi", "userId": "u1", "sessionId": "sess-99"})
    assert msg.session_id == "sess-99"


def test_chat_message_requires_message():
    with pytest.raises(ValidationError):
        ChatMessage(user_id="u1")


def test_chat_message_requires_user_id():
    with pytest.raises(ValidationError):
        ChatMessage(message="Hello")


def test_chat_response_serialises_session_id_as_camel_case():
    resp = ChatResponse(
        id="abc",
        message="Hi",
        response="Hello back",
        timestamp=datetime.utcnow(),
        session_id="s1",
    )
    data = resp.model_dump(by_alias=True)
    assert "sessionId" in data
    assert data["sessionId"] == "s1"


def test_chat_response_proposed_changes_defaults_to_none():
    resp = ChatResponse(
        id="abc",
        message="Hi",
        response="Hello back",
        timestamp=datetime.utcnow(),
    )
    assert resp.proposed_changes is None


def test_chat_response_requires_id():
    with pytest.raises(ValidationError):
        ChatResponse(message="Hi", response="Hello", timestamp=datetime.utcnow())
