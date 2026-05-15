export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      animation: {
        pulse_slow: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        bounce_slow: "bounce 1.5s infinite",
        spin_slow: "spin 3s linear infinite",
      },
    },
  },
  plugins: [],
};
