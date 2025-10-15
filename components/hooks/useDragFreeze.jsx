import { useState, useCallback, useRef } from 'react';

export function useDragFreeze() {
  const [dragFreeze, setDragFreeze] = useState(false);
  const frozenItemsRef = useRef({});

  const freezeStart = useCallback((start) => {
    setDragFreeze(true);
    frozenItemsRef.current = {};
  }, []);

  const freezeEnd = useCallback(() => {
    setDragFreeze(false);
    frozenItemsRef.current = {};
  }, []);

  const saveFrozenItems = useCallback((windowId, items) => {
    if (dragFreeze) return;
    frozenItemsRef.current[windowId] = items.slice();
  }, [dragFreeze]);

  const getFrozenItems = useCallback((windowId) => {
    return frozenItemsRef.current[windowId] || null;
  }, []);

  return {
    dragFreeze,
    freezeStart,
    freezeEnd,
    saveFrozenItems,
    getFrozenItems
  };
}
