const EDGE_ZONE = 48;
const V_MIN = 120;
const V_MAX = 1200;
const K = 900;

function calculateScrollSpeed(distance) {
  if (distance >= EDGE_ZONE) return 0;
  const normalized = 1 - (distance / EDGE_ZONE);
  return Math.max(V_MIN, Math.min(V_MAX, K * normalized));
}

function getEdgeDirection(element, clientY) {
  const rect = element === document.documentElement 
    ? { top: 0, bottom: window.innerHeight }
    : element.getBoundingClientRect();

  const distanceFromTop = clientY - rect.top;
  const distanceFromBottom = rect.bottom - clientY;

  if (distanceFromTop < EDGE_ZONE && distanceFromTop > 0) {
    return { direction: -1, distance: distanceFromTop };
  }
  
  if (distanceFromBottom < EDGE_ZONE && distanceFromBottom > 0) {
    return { direction: 1, distance: distanceFromBottom };
  }

  return { direction: 0, distance: 0 };
}

function canScroll(element, direction) {
  if (element === document.documentElement) {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.pageYOffset;
    return direction < 0 ? currentScroll > 0 : currentScroll < maxScroll;
  }

  const maxScroll = element.scrollHeight - element.clientHeight;
  const currentScroll = element.scrollTop;
  return direction < 0 ? currentScroll > 0 : currentScroll < maxScroll;
}

function getScrollableAncestors(element) {
  const scrollables = [];
  let current = element;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const isScrollable = 
      (style.overflow === 'auto' || style.overflow === 'scroll' || 
       style.overflowY === 'auto' || style.overflowY === 'scroll') &&
      current.scrollHeight > current.clientHeight;

    if (isScrollable) {
      scrollables.push(current);
    }
    current = current.parentElement;
  }

  scrollables.push(document.documentElement);
  return scrollables;
}

export function createNestedAutoScroller() {
  let rafId = null;
  let lastClientY = null;

  function scroll() {
    if (lastClientY === null) return;

    const element = document.elementFromPoint(window.innerWidth / 2, lastClientY);
    if (!element) return;

    const scrollables = getScrollableAncestors(element);

    for (const el of scrollables) {
      const { direction, distance } = getEdgeDirection(el, lastClientY);
      
      if (direction !== 0 && canScroll(el, direction)) {
        const speed = calculateScrollSpeed(distance);
        const delta = direction * speed / 60;

        if (el === document.documentElement) {
          const newScroll = Math.max(0, Math.min(
            document.documentElement.scrollHeight - window.innerHeight,
            window.pageYOffset + delta
          ));
          window.scrollTo(0, newScroll);
        } else {
          const newScroll = Math.max(0, Math.min(
            el.scrollHeight - el.clientHeight,
            el.scrollTop + delta
          ));
          el.scrollTop = newScroll;
        }

        break;
      }
    }

    rafId = requestAnimationFrame(scroll);
  }

  return {
    start(clientY) {
      lastClientY = clientY;
      if (rafId === null) {
        rafId = requestAnimationFrame(scroll);
      }
    },
    update(clientY) {
      lastClientY = clientY;
    },
    stop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastClientY = null;
    }
  };
}
