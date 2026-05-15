import type { Config } from "tailwindcss";

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
                    50: "var(--primary-50)",
                    100: "var(--primary-100)",
                    200: "var(--primary-200)",
                    300: "var(--primary-300)",
                    400: "var(--primary-400)",
                    500: "var(--primary-500)",
                    600: "var(--primary-600)",
                    700: "var(--primary-700)",
                    800: "var(--primary-800)",
                    900: "var(--primary-900)",
                },
                accent: {
                    400: "var(--accent-400)",
                    500: "var(--accent-500)",
                    600: "var(--accent-600)",
                },
                success: {
                    400: "var(--success-400)",
                    500: "var(--success-500)",
                    600: "var(--success-600)",
                },
                warning: {
                    400: "var(--warning-400)",
                    500: "var(--warning-500)",
                    600: "var(--warning-600)",
                },
                error: {
                    400: "var(--error-400)",
                    500: "var(--error-500)",
                    600: "var(--error-600)",
                },
            },
            // Extended Font Family
            fontFamily: {
                sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            // Custom Animations
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'float-slow': 'float-slow 8s ease-in-out infinite',
                'float-fast': 'float 4s ease-in-out infinite',
                'float-subtle': 'float-subtle 4s ease-in-out infinite',
                'shimmer': 'shimmer 1.5s infinite',
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'glow-pulse-accent': 'glow-pulse-accent 2s ease-in-out infinite',
                'slide-up': 'slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-down': 'slide-down-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-in-right': 'slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'scale-in-bounce': 'scale-in-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                'wiggle': 'wiggle 0.3s ease-in-out',
                'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
                'gradient': 'gradient-shift 4s ease infinite',
                'flame': 'flame-flicker 0.5s ease-in-out infinite',
                'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 3s linear infinite',
            },
            // Animation Keyframes
            keyframes: {
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                'float-slow': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-15px)' },
                },
                'float-subtle': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'glow-pulse': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' },
                    '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' },
                },
                'slide-up-fade': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-down-fade': {
                    '0%': { opacity: '0', transform: 'translateY(-20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'wiggle': {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' },
                },
                'bounce-subtle': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                'gradient-shift': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
                'flame-flicker': {
                    '0%, 100%': { transform: 'scaleY(1) scaleX(1)' },
                    '25%': { transform: 'scaleY(1.1) scaleX(0.95)' },
                    '50%': { transform: 'scaleY(0.95) scaleX(1.05)' },
                    '75%': { transform: 'scaleY(1.05) scaleX(0.98)' },
                },
                'pulse-ring': {
                    '0%': { transform: 'scale(0.8)', opacity: '1' },
                    '100%': { transform: 'scale(1.4)', opacity: '0' },
                },
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
                'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
                'in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
                'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            },
            // Extended Transition Duration
            transitionDuration: {
                '400': '400ms',
                '600': '600ms',
            },
        },
    },
    plugins: [],
};

export default config;
