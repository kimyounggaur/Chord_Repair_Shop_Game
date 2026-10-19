import { defineConfig } from 'vitest/config';
export default defineConfig({test:{include:['tests/unit/**/*.test.{ts,tsx}','tests/integration/**/*.test.{ts,tsx}','tests/audio/**/*.test.{ts,tsx}']},build:{target:'es2022'},server:{port:5486,strictPort:true},preview:{port:4486,strictPort:true}});
