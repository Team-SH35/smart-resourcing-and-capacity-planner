"""Tests for ResourceManagementAgent logic."""
from unittest.mock import MagicMock, patch

import pytest

from app_backend.agents.graph import ResourceManagementAgent, create_agent


def make_agent():
    """Create an agent with a mocked LLM so no API key is needed."""
    with patch("app_backend.agents.graph.ChatOpenAI"):
        return ResourceManagementAgent(tools=[])


def test_create_agent_returns_resource_management_agent():
    with patch("app_backend.agents.graph.ChatOpenAI"):
        agent = create_agent(tools=[])
    assert isinstance(agent, ResourceManagementAgent)


def test_agent_stores_tools():
    with patch("app_backend.agents.graph.ChatOpenAI"):
        with patch("app_backend.agents.graph.ToolNode"):
            mock_tool = MagicMock()
            mock_tool.name = "get_employees"
            agent = ResourceManagementAgent(tools=[mock_tool])
    assert mock_tool in agent.tools


def test_should_continue_returns_end_when_no_tool_calls():
    agent = make_agent()
    last_msg = MagicMock()
    last_msg.tool_calls = []
    state = {"messages": [last_msg]}
    assert agent._should_continue(state) == "end"


def test_should_continue_returns_tools_for_read_tool():
    agent = make_agent()
    last_msg = MagicMock()
    last_msg.tool_calls = [{"name": "get_employees", "id": "1", "args": {}}]
    state = {"messages": [last_msg]}
    assert agent._should_continue(state) == "tools"


def test_should_continue_returns_write_tools_for_create():
    agent = make_agent()
    last_msg = MagicMock()
    last_msg.tool_calls = [{"name": "create_forecast_entry", "id": "1", "args": {}}]
    state = {"messages": [last_msg]}
    assert agent._should_continue(state) == "write_tools"


def test_should_continue_returns_write_tools_for_update():
    agent = make_agent()
    last_msg = MagicMock()
    last_msg.tool_calls = [{"name": "update_forecast_entry", "id": "1", "args": {}}]
    state = {"messages": [last_msg]}
    assert agent._should_continue(state) == "write_tools"


def test_should_continue_returns_write_tools_for_delete():
    agent = make_agent()
    last_msg = MagicMock()
    last_msg.tool_calls = [{"name": "delete_forecast_entry", "id": "1", "args": {}}]
    state = {"messages": [last_msg]}
    assert agent._should_continue(state) == "write_tools"


def test_get_system_prompt_is_non_empty():
    agent = make_agent()
    prompt = agent.get_system_prompt()
    assert len(prompt) > 0


def test_get_system_prompt_mentions_key_tools():
    agent = make_agent()
    prompt = agent.get_system_prompt()
    assert "get_employees" in prompt
    assert "create_forecast_entry" in prompt
    assert "get_understaffed_projects" in prompt


def test_get_system_prompt_mentions_guardrails():
    agent = make_agent()
    prompt = agent.get_system_prompt()
    assert "20 working days" in prompt


def test_get_system_prompt_mentions_over_allocation():
    agent = make_agent()
    prompt = agent.get_system_prompt()
    assert "Over-allocation" in prompt


def test_get_system_prompt_mentions_month_name_format():
    agent = make_agent()
    prompt = agent.get_system_prompt()
    assert "month names" in prompt.lower() or "march" in prompt.lower()


def test_get_system_prompt_restricts_scope():
    agent = make_agent()
    prompt = agent.get_system_prompt()
    assert "SCOPE" in prompt


def test_get_system_prompt_instructs_refusal_of_off_topic():
    agent = make_agent()
    prompt = agent.get_system_prompt()
    assert "outside this scope" in prompt or "refuse" in prompt.lower()
