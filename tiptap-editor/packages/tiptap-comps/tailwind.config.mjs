// @ts-check
import Config from '../tiptap-styles/tailwind.config.mjs'

/** @type {import('tailwindcss').Config} */
export default {
  ...Config,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
}
