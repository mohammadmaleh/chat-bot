import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from lib.config import settings

@contextmanager
def get_db_connection():
    conn = psycopg2.connect(settings.database_url)
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def search_products(query: str, limit: int = 5):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            search_query = f"%{query}%"
            cur.execute("""
                SELECT 
                    p.id, p.name, p.brand, p.category, 
                    p.description, p.image_url, p.ean
                FROM products p
                WHERE 
                    p.name ILIKE %s 
                    OR p.brand ILIKE %s 
                    OR p.category ILIKE %s
                    OR p.description ILIKE %s
                LIMIT %s
            """, (search_query, search_query, search_query, search_query, limit))
            return cur.fetchall()

def get_product_prices(product_id: str):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    pr.price, pr.currency, pr.availability, pr.url,
                    pr.scraped_at,
                    s.name as store_name, s.domain as store_domain,
                    s.logo_url as store_logo
                FROM prices pr
                JOIN stores s ON pr.store_id = s.id
                WHERE pr.product_id = %s
                ORDER BY pr.price ASC
            """, (product_id,))
            return cur.fetchall()

def get_cheapest_products(category: str = None, limit: int = 10):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if category:
                cur.execute("""
                    SELECT DISTINCT ON (p.id)
                        p.id, p.name, p.brand, p.category,
                        pr.price, pr.currency,
                        s.name as store_name, s.domain as store_domain
                    FROM products p
                    JOIN prices pr ON p.id = pr.product_id
                    JOIN stores s ON pr.store_id = s.id
                    WHERE p.category ILIKE %s AND pr.availability = true
                    ORDER BY p.id, pr.price ASC
                    LIMIT %s
                """, (f"%{category}%", limit))
            else:
                cur.execute("""
                    SELECT DISTINCT ON (p.id)
                        p.id, p.name, p.brand, p.category,
                        pr.price, pr.currency,
                        s.name as store_name, s.domain as store_domain
                    FROM products p
                    JOIN prices pr ON p.id = pr.product_id
                    JOIN stores s ON pr.store_id = s.id
                    WHERE pr.availability = true
                    ORDER BY p.id, pr.price ASC
                    LIMIT %s
                """, (limit,))
            return cur.fetchall()
