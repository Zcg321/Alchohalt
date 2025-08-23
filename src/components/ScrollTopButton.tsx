import React, { useEffect, useState } from 'react';

/** ScrollTopButton shows a floating button when page is scrolled down, allowing quick return to top. */
export default function ScrollTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 200);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      aria-label="Back to top"
      className="fixed bottom-4 right-4 p-2 rounded-full bg-blue-600 text-white shadow-lg"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  );
}
