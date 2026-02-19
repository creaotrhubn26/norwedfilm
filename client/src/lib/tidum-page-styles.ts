export const TIDUM_TOKENS = {
  colorBgMain: "hsl(var(--background))",
  colorBgSection: "hsl(var(--muted))",
  colorPrimary: "hsl(var(--primary))",
  colorBorder: "hsl(var(--border))",
  colors: {
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    primary: "hsl(var(--primary))",
    muted: "hsl(var(--muted))",
    border: "hsl(var(--border))",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },
  radius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
  },
} as const;

export const tidumPageStyles = `
  :root {
    --tidum-bg: hsl(var(--background));
    --tidum-fg: hsl(var(--foreground));
    --tidum-primary: hsl(var(--primary));
    --tidum-muted: hsl(var(--muted));
    --tidum-border: hsl(var(--border));
  }

  .tidum-page {
    background: var(--tidum-bg);
    color: var(--tidum-fg);
    font-family: inherit;
  }

  @keyframes tidum-cinematic-pan {
    0% {
      transform: scale(var(--tidum-pan-scale-start, 1.02)) translateX(var(--tidum-pan-x-start, -1.5%));
    }
    100% {
      transform: scale(var(--tidum-pan-scale-end, 1.12)) translateX(var(--tidum-pan-x-end, 1.5%));
    }
  }

  @keyframes tidum-cinematic-reveal {
    0% { opacity: 0; transform: translateY(var(--tidum-reveal-y, 14px)) scale(var(--tidum-reveal-scale-start, 1.03)); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes tidum-soft-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(calc(var(--tidum-float-y, 8px) * -1)); }
  }
`;
