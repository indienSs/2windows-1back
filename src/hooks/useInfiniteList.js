import { useCallback, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 20;

export function useInfiniteList(fetchPage, { search, reloadToken }) {
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const inflight = useRef(Promise.resolve());
  const searchRef = useRef(search);
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  useEffect(() => {
    searchRef.current = search;
    setItems([]);
    setOffset(0);
    setHasMore(true);
  }, [search]);

  const run = useCallback(
    (fn) => {
      inflight.current = inflight.current.then(fn, fn);
      return inflight.current;
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    run(async () => {
      const data = await fetchPageRef.current({
        search,
        offset: 0,
        limit: PAGE_SIZE,
      });
      if (cancelled || searchRef.current !== search) return;
      setItems(data.items);
      setOffset(data.items.length);
      setHasMore(data.hasMore);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [search, run]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    setLoading(true);
    run(async () => {
      const cur = searchRef.current;
      const data = await fetchPageRef.current({
        search: cur,
        offset: offset,
        limit: PAGE_SIZE,
      });
      if (searchRef.current !== cur) return;
      setItems((prev) => [...prev, ...data.items]);
      setOffset((o) => o + data.items.length);
      setHasMore(data.hasMore);
      setLoading(false);
    });
  }, [hasMore, loading, offset, run]);

  useEffect(() => {
    if (reloadToken === 0) return;
    run(async () => {
      const cur = searchRef.current;
      const data = await fetchPageRef.current({
        search: cur,
        offset: 0,
        limit: Math.max(PAGE_SIZE, items.length),
      });
      if (searchRef.current !== cur) return;
      setItems(data.items);
      setOffset(data.items.length);
      setHasMore(data.hasMore);
    });
  }, [reloadToken, run]);

  return { items, setItems, hasMore, loading, loadMore };
}
