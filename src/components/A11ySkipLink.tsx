import React from 'react';
export default function A11ySkipLink(){
  return <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-black text-white px-3 py-1 rounded">Skip to content</a>;
}
