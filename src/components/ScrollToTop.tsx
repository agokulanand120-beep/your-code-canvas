import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Marketplace landing page preserves scroll on back-navigation
const PRESERVE_SCROLL_ROUTES = ["/"];

/**
 * Resets scroll on route change.
 *
 * The dealer interface scrolls inside `<main data-scroll-root>` (the window itself
 * never scrolls), so scrolling only `window` left the next page rendered at the
 * previous page's scroll offset. We reset both the window and the inner scroll
 * container, and repeat once on the next frame because lazy routes mount their
 * content after the first paint.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const prevPath = useRef(pathname);

  useLayoutEffect(() => {
    const isSamePath = prevPath.current === pathname;
    prevPath.current = pathname;
    if (isSamePath) return;
    if (PRESERVE_SCROLL_ROUTES.includes(pathname)) return;

    const reset = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document
        .querySelectorAll<HTMLElement>("[data-scroll-root]")
        .forEach((el) => {
          el.scrollTop = 0;
          el.scrollLeft = 0;
        });
    };

    reset();
    const raf1 = requestAnimationFrame(() => {
      reset();
      // Second frame covers lazily-mounted route content that grows the container.
      requestAnimationFrame(reset);
    });

    return () => cancelAnimationFrame(raf1);
  }, [pathname]);

  useEffect(() => {
    // Disable the browser's own scroll restoration — it fights the reset above.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  return null;
};

export default ScrollToTop;
