/** @type {import("snowpack").SnowpackUserConfig } */
export default {
  mount: {
    // directory name: 'build directory'
    public: "/",
    src: "/dist",
  },
  plugins: [
    /* ... */
  ],
  routes: [
    /* Enable an SPA Fallback in development: */
    // {"match": "routes", "src": ".*", "dest": "/index.html"},
  ],
  optimize: {
    bundle: true,
    minify: true,
    target: 'es2018',
  },
  packageOptions: {
    /* ... */
  },
  devOptions: {
    port: 4242,
  },
  buildOptions: {
    /* ... */
  },
};
