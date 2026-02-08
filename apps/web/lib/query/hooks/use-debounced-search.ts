import { useState, useEffect } from 'react';
import { useSearchProducts } from './use-products';

export function useDebouncedSearch(initialQuery = '', delay = 500) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  const searchResult = useSearchProducts(
    { q: debouncedQuery },
    debouncedQuery.length >= 2 // Only search if 2+ characters
  );

  return {
    query,
    setQuery,
    debouncedQuery,
    ...searchResult,
  };
}
