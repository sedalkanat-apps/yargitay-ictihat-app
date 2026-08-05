/**
 * Bu dosyadaki isimler src/theme/*.ts ile aynı olmalıdır — tek kaynak ilkesi
 * NativeWind (className) ve TypeScript (style/JS) tarafında paralel yürür.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#081321',
        foreground: '#F4F7FB',
        primary: { DEFAULT: '#35B9C9', foreground: '#06151D' },
        secondary: { DEFAULT: '#172A3D', foreground: '#E4EDF5' },
        accent: { DEFAULT: '#D7AE58', foreground: '#1C1608' },
        muted: { DEFAULT: '#102235', foreground: '#A9B9C8' },
        card: { DEFAULT: '#0E1D2D', foreground: '#F4F7FB' },
        border: '#294057',
        input: '#13263A',
        destructive: { DEFAULT: '#EF6C6C', foreground: '#240A0A' },
        success: { DEFAULT: '#51C58B', foreground: '#061A10' },
      },
      fontFamily: {
        heading: ['Manrope_700Bold'],
        body: ['SourceSans3_400Regular'],
        'body-semibold': ['SourceSans3_600SemiBold'],
        'body-bold': ['SourceSans3_700Bold'],
      },
      fontSize: {
        '2xs': '10px',
        display: '28px',
      },
      borderRadius: {
        DEFAULT: '12px',
        theme: '12px',
      },
    },
  },
  plugins: [],
};
