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
     {"match": "routes", "src": ".*", "dest": "/index.html"},
  ],
  optimize: {
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
