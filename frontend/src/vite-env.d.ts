/// <reference types="vite/client" />

declare const process: {
  env: {
    PUBLIC_API_URL: string;
    PUBLIC_REDMINE_URL: string;
    GIT_BRANCH: string;
    GIT_HASH: string;
  };
};
