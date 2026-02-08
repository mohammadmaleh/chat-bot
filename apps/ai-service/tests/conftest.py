"""Pytest configuration and fixtures."""
import pytest
import pytest_asyncio
from prisma import Prisma
import os

# Set test environment variables
os.environ['DATABASE_URL'] = os.getenv('TEST_DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/chatbot_test?schema=public')
os.environ['REDIS_URL'] = 'redis://localhost:6379/1'  # Use DB 1 for tests
os.environ['ENABLE_REDIS_CACHE'] = 'false'  # Disable cache in tests

@pytest_asyncio.fixture
async def prisma_client():
    """Provide isolated Prisma client for tests."""
    client = Prisma()
    await client.connect()
    yield client
    await client.disconnect()

@pytest.fixture
def mock_groq_response():
    """Mock Groq API response."""
    return {
        "choices": [{
            "message": {
                "content": "This is a test AI response about products."
            }
        }]
    }

@pytest.fixture
def sample_product_data():
    """Sample product data for testing."""
    return {
        'name': 'Test Guitar',
        'brand': 'Fender',
        'category': 'Musical Instruments',
        'description': 'A test electric guitar',
        'imageUrl': 'https://example.com/guitar.jpg',
        'ean': 'TEST123456'
    }

@pytest.fixture
def sample_store_data():
    """Sample store data for testing."""
    return {
        'name': 'Test Store',
        'domain': 'teststore.com',
        'country': 'DE',
        'active': True
    }
