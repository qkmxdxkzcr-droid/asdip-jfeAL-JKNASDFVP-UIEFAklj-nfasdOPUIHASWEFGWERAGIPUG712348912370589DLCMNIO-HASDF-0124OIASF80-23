import { useState, useCallback } from 'react';

export function useProjectedPlaceholder() {
  const [projected, setProjected] = useState(null);

  const updateProjection = useCallback((update) => {
    if (!update.destination) {
      setProjected(null);
      return;
    }

    setProjected({
      windowId: update.destination.droppableId,
      index: update.destination.index
    });
  }, []);

  const clearProjection = useCallback(() => {
    setProjected(null);
  }, []);

  return {
    projected,
    updateProjection,
    clearProjection
  };
}
