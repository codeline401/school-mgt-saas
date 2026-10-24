export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "primary-soft": "var(--primary-soft)",
        sidebar: "var(--sidebar)",
        accent: "var(--accent)",
        success: "var(--success)",
        warning: "var(--warning)",
        "warning-foreground": "var(--warning-foreground)",
        danger: "var(--danger)",
        "text-main": "var(--text-main)",
        muted: "var(--text-muted)",
        border: "var(--border-color)",
        background: "var(--page-background)",
        "badge-paid-bg": "var(--badge-paid-bg)",
        "badge-paid-text": "var(--badge-paid-text)",
        "badge-ajourne-bg": "var(--badge-ajourne-bg)",
        "badge-ajourne-text": "var(--badge-ajourne-text)",
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "'DM Sans'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
