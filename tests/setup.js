global.fetch = () =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ faqs: [], elections: [] }),
  });

global.caches = {
  match: () => Promise.resolve(null),
  open: () => Promise.resolve({
    put: () => {},
    match: () => {}
  })
};
