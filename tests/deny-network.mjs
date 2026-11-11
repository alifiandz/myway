// Preloaded only by test:isolated. Tests must explicitly supply mock transports.
globalThis.fetch = async () => { throw new Error('Unexpected network request in isolated tests'); };
