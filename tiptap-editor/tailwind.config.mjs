// @ts-check
import Config from '../tailwind.config.js'

/** @type {import('tailwindcss').Config} */
export default {
  ...Config,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './packages/**/*.{js,ts,jsx,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/coverage/**',
  ],
}
