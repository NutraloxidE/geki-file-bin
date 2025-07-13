import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // 親クラスに 'dark' が含まれている場合にダークモードを有効化
  content: ['./src/**/*.{js,ts,jsx,tsx}'], // コンテンツのパスを指定
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;