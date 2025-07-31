// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export const content = [
    "./src/**/*.{js,jsx,ts,tsx}", // Scans all JavaScript/TypeScript/JSX files in src/
    "./public/index.html", // Also scans your main HTML entry file
];
export const theme = {
    extend: {},
};
export const plugins = [];