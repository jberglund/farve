import { defineConfig } from "vite-plus";

export default defineConfig({
  base: process.env.BASE_URL || "/",
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
});
