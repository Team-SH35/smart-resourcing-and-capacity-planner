# AI Chat Service

The AI chat service runs automatically as part of the full stack via Docker Compose (see the root README).

## Running the Tests

For running the tests locally you will need to install the Python dependencies on your machine (just for testing — Docker handles everything else).

1. Navigate to the `ai_service_chat` directory
2. Install dependencies (first time only):
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```
3. Run all tests:
   ```bash
   python -m pytest tests/ -v
   ```
   To run a single test file:
   ```bash
   python -m pytest tests/test_get_employees.py -v
   ```
