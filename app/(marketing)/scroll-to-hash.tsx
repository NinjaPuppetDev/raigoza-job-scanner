'use client';

import { useEffect } from 'react';

export function ScrollToHash() {
  useEffect(() => {
    function scrollToHash() {
      if (window.location.hash) {
        const el = document.querySelector(window.location.hash);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    scrollToHash(); // handle initial load with a hash already in the URL
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);

  return null;
}