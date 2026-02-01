// @ts-check
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Config from '../../tailwind.config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('tailwindcss').Config} */
export default {
  ...Config,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
}
