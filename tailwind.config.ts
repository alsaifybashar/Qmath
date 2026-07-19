import type { Config } from "tailwindcss";

// Legacy scales resolve through CSS primitives so opacity modifiers keep working.
const tealRamp = {
    50: "rgb(var(--brand-50) / <alpha-value>)",
    100: "rgb(var(--brand-100) / <alpha-value>)",
    200: "rgb(var(--brand-200) / <alpha-value>)",
    300: "rgb(var(--brand-300) / <alpha-value>)",
    400: "rgb(var(--brand-400) / <alpha-value>)",
    500: "rgb(var(--brand-500) / <alpha-value>)",
    600: "rgb(var(--brand-600) / <alpha-value>)",
    700: "rgb(var(--brand-700) / <alpha-value>)",
    800: "rgb(var(--brand-800) / <alpha-value>)",
    900: "rgb(var(--brand-900) / <alpha-value>)",
    950: "rgb(var(--brand-950) / <alpha-value>)",
};

const slateBlueRamp = {
    50: "rgb(var(--support-50) / <alpha-value>)",
    100: "rgb(var(--support-100) / <alpha-value>)",
    200: "rgb(var(--support-200) / <alpha-value>)",
    300: "rgb(var(--support-300) / <alpha-value>)",
    400: "rgb(var(--support-400) / <alpha-value>)",
    500: "rgb(var(--support-500) / <alpha-value>)",
    600: "rgb(var(--support-600) / <alpha-value>)",
    700: "rgb(var(--support-700) / <alpha-value>)",
    800: "rgb(var(--support-800) / <alpha-value>)",
    900: "rgb(var(--support-900) / <alpha-value>)",
    950: "rgb(var(--support-950) / <alpha-value>)",
};

const goldRamp = {
    50: "rgb(var(--highlight-50) / <alpha-value>)",
    100: "rgb(var(--highlight-100) / <alpha-value>)",
    200: "rgb(var(--highlight-200) / <alpha-value>)",
    300: "rgb(var(--highlight-300) / <alpha-value>)",
    400: "rgb(var(--highlight-400) / <alpha-value>)",
    500: "rgb(var(--highlight-500) / <alpha-value>)",
    600: "rgb(var(--highlight-600) / <alpha-value>)",
    700: "rgb(var(--highlight-700) / <alpha-value>)",
    800: "rgb(var(--highlight-800) / <alpha-value>)",
    900: "rgb(var(--highlight-900) / <alpha-value>)",
    950: "rgb(var(--highlight-950) / <alpha-value>)",
};

const sandRamp = {
    50: "rgb(var(--warm-50) / <alpha-value>)",
    100: "rgb(var(--warm-100) / <alpha-value>)",
    200: "rgb(var(--warm-200) / <alpha-value>)",
    300: "rgb(var(--warm-300) / <alpha-value>)",
    400: "rgb(var(--warm-400) / <alpha-value>)",
    500: "rgb(var(--warm-500) / <alpha-value>)",
    600: "rgb(var(--warm-600) / <alpha-value>)",
    700: "rgb(var(--warm-700) / <alpha-value>)",
    800: "rgb(var(--warm-800) / <alpha-value>)",
    900: "rgb(var(--warm-900) / <alpha-value>)",
    950: "rgb(var(--warm-950) / <alpha-value>)",
};

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            // Core Colors from CSS Variables
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    50: "rgb(var(--neutral-50) / <alpha-value>)",
                    100: "rgb(var(--neutral-100) / <alpha-value>)",
                    200: "rgb(var(--neutral-200) / <alpha-value>)",
                    300: "rgb(var(--neutral-300) / <alpha-value>)",
                    400: "rgb(var(--neutral-500) / <alpha-value>)",
                    500: "rgb(var(--neutral-700) / <alpha-value>)",
                    600: "rgb(var(--neutral-800) / <alpha-value>)",
                    700: "rgb(var(--neutral-900) / <alpha-value>)",
                    800: "var(--primary-800)",
                    900: "var(--primary-900)",
                },
                accent: {
                    400: "rgb(var(--brand-400) / <alpha-value>)",
                    500: "rgb(var(--brand-500) / <alpha-value>)",
                    600: "rgb(var(--brand-600) / <alpha-value>)",
                },
                success: {
                    400: "rgb(var(--status-success-400) / <alpha-value>)",
                    500: "rgb(var(--status-success-500) / <alpha-value>)",
                    600: "rgb(var(--status-success-600) / <alpha-value>)",
                },
                warning: {
                    400: "rgb(var(--status-warning-400) / <alpha-value>)",
                    500: "rgb(var(--status-warning-500) / <alpha-value>)",
                    600: "rgb(var(--status-warning-600) / <alpha-value>)",
                },
                error: {
                    400: "rgb(var(--status-error-400) / <alpha-value>)",
                    500: "rgb(var(--status-error-500) / <alpha-value>)",
                    600: "rgb(var(--status-error-600) / <alpha-value>)",
                },
                // Raw-scale remap onto the brand palette. green/emerald/red
                // keep Tailwind defaults for pass/fail semantics.
                teal: tealRamp,
                cyan: tealRamp,
                violet: tealRamp,
                fuchsia: tealRamp,
                blue: slateBlueRamp,
                sky: slateBlueRamp,
                indigo: slateBlueRamp,
                purple: slateBlueRamp,
                amber: goldRamp,
                yellow: goldRamp,
                orange: sandRamp,
                gold: goldRamp,
                sand: sandRamp,
            },
            // Extended Font Family
            fontFamily: {
                sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            // Extended Shadows
            boxShadow: {
                'glow': 'var(--shadow-glow)',
                'glow-accent': 'var(--shadow-glow-accent)',
                'glass': 'var(--glass-shadow)',
                'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
                'elevation-2': '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
                'elevation-3': '0 10px 20px rgba(0, 0, 0, 0.1), 0 6px 6px rgba(0, 0, 0, 0.06)',
                'elevation-4': '0 14px 28px rgba(0, 0, 0, 0.12), 0 10px 10px rgba(0, 0, 0, 0.08)',
            },
            // Background Images (Gradients)
            backgroundImage: {
                'gradient-primary': 'var(--gradient-primary)',
                'gradient-hero': 'var(--gradient-hero)',
                'gradient-subtle': 'var(--gradient-subtle)',
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
            // Extended Backdrop Blur
            backdropBlur: {
                xs: '2px',
            },
            // Extended Border Radius
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
            },
            // Extended Transition Timing
            transitionTimingFunction: {
                'out': 'cubic-bezier(0.23, 1, 0.32, 1)',
                'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
                'drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
                'out-expo': 'cubic-bezier(0.23, 1, 0.32, 1)',
                'in-out-expo': 'cubic-bezier(0.77, 0, 0.175, 1)',
                'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            },
            // Extended Transition Duration
            transitionDuration: {
                '120': '120ms',
                '180': '180ms',
                '220': '220ms',
                '280': '280ms',
                '300': '280ms',
                '400': '280ms',
                '500': '280ms',
                '600': '280ms',
                '700': '280ms',
                '1000': '280ms',
            },
        },
    },
    plugins: [],
};

export default config;
