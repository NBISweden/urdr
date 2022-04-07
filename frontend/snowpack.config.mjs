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
    {
      match: 'routes',
      src: '.*',
      dest: '/index.html',
    },
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
