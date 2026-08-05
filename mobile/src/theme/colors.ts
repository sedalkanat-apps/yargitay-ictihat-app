/**
 * html-export/ referansındaki :root CSS değişkenleriyle birebir eşleşir.
 * chart1-5 ve ring token'ları tasarımda hiçbir yerde fiilen kullanılmadığı için eklenmedi.
 */
export const colors = {
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
} as const;

export type ColorToken = keyof typeof colors;
