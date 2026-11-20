// The comparison runs the original checkpoint; the continuing run uses the current engine.
window.PizzaMode = (() => {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  return { sample: hash.get('mode') === 'sample' || (hash.has('event') && !hash.has('mode')) };
})();
