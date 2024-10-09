/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {  backgroundImage: {
      'custom-gradient': 'linear-gradient(319deg, #663dff 0%, #aa00ff 37%, #cc4499 100%)',
    },},
  },
  plugins: [function({ addUtilities }) {
    addUtilities({
      '.no-scrollbar': {
        '-ms-overflow-style': 'none',  /* Internet Explorer 10+ */
        'scrollbar-width': 'none',     /* Firefox */
      },
      '.no-scrollbar::-webkit-scrollbar': {
        'display': 'none',             /* Safari and Chrome */
      },
    });
  },],
}