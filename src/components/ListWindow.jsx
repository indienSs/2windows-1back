import { useEffect, useRef } from 'react';

export default function ListWindow({ items, hasMore, loading, onLoadMore, children }) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) onLoadMore();
      },
      { root: null, rootMargin: '200px', threshold: 0 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return (
    <div className="list-window">
      <div className="list-body">
        {children}
        <div ref={sentinelRef} className="sentinel" />
        <div className="list-footer">
          {loading ? 'Загрузка…' : hasMore ? 'Прокрутите вниз' : 'Конец списка'}
        </div>
      </div>
    </div>
  );
}
