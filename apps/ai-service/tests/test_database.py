"""Tests for database operations."""
import pytest
from lib.database import (
    search_products,
    get_product_prices,
    get_cheapest_products,
    create_conversation,
    save_message,
    get_conversation_history
)

@pytest.mark.asyncio
@pytest.mark.database
async def test_search_products_empty_query(prisma_client):
    """Test search with query that returns no results."""
    results = await search_products("nonexistent_product_xyz_12345", limit=5)
    assert isinstance(results, list)
    assert len(results) == 0

@pytest.mark.asyncio
@pytest.mark.database
async def test_search_products_respects_limit(prisma_client):
    """Test that search respects the limit parameter."""
    results = await search_products("test", limit=3)
    assert len(results) <= 3

@pytest.mark.asyncio
@pytest.mark.database
async def test_search_products_returns_dict(prisma_client):
    """Test that search returns properly formatted dictionaries."""
    results = await search_products("guitar", limit=1)
    
    if len(results) > 0:
        product = results[0]
        # Check required fields
        assert 'id' in product
        assert 'name' in product
        assert 'brand' in product or product['brand'] is None
        assert 'category' in product or product['category'] is None

@pytest.mark.asyncio
@pytest.mark.database
async def test_get_product_prices_invalid_id(prisma_client):
    """Test getting prices for non-existent product."""
    prices = await get_product_prices("invalid_product_id_xyz")
    assert isinstance(prices, list)
    assert len(prices) == 0

@pytest.mark.asyncio
@pytest.mark.database
async def test_get_product_prices_sorting(prisma_client):
    """Test that prices are sorted cheapest first."""
    # This test requires test data with multiple prices
    # For now, just verify the function returns a list
    prices = await get_product_prices("test_id")
    assert isinstance(prices, list)
    
    # If we have multiple prices, verify sorting
    if len(prices) > 1:
        for i in range(len(prices) - 1):
            assert prices[i]['price'] <= prices[i + 1]['price']

@pytest.mark.asyncio
@pytest.mark.database
async def test_get_cheapest_products(prisma_client):
    """Test getting cheapest products."""
    products = await get_cheapest_products(limit=5)
    assert isinstance(products, list)
    assert len(products) <= 5

@pytest.mark.asyncio
@pytest.mark.database
async def test_get_cheapest_products_with_category(prisma_client):
    """Test getting cheapest products filtered by category."""
    products = await get_cheapest_products(category="Electronics", limit=3)
    assert isinstance(products, list)
    assert len(products) <= 3

@pytest.mark.asyncio
@pytest.mark.unit
async def test_create_conversation():
    """Test conversation creation."""
    # This test would need proper setup/teardown
    # For now, just test the structure
    pass

@pytest.mark.asyncio
@pytest.mark.unit
async def test_save_message():
    """Test message saving."""
    # This test would need proper setup/teardown
    pass
