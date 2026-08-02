import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))',
  				light: 'hsl(var(--primary-light))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			lilac: {
  				DEFAULT: 'hsl(var(--lilac))',
  				light: 'hsl(var(--lilac-light))'
  			},
  			periwinkle: {
  				DEFAULT: 'hsl(var(--periwinkle))',
  				light: 'hsl(var(--periwinkle-light))'
  			},
  			lavender: 'hsl(var(--lavender))',
  			rose: {
  				DEFAULT: 'hsl(var(--rose))',
  				light: 'hsl(var(--rose-light))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
		},
		borderRadius: {
			lg: 'var(--radius)',
			md: 'calc(var(--radius) - 2px)',
			sm: 'calc(var(--radius) - 4px)'
		},
		fontFamily: {
			sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
			serif: ['Cormorant Garamond', 'Iowan Old Style', 'Georgia', 'serif'],
			script: ['Dancing Script', 'cursive'],
			mono: ['DM Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
			pixel: ['"Press Start 2P"', 'cursive'],
			/* Us Gallery album leaf only — see DESIGN_SYSTEM.md §13 */
			label: ['"Martian Mono"', 'DM Mono', 'ui-monospace', 'monospace'],
			hand: ['"Shantell Sans"', '"Segoe Print"', 'cursive']
		},
		keyframes: {
			'accordion-down': {
				from: { height: '0' },
				to: { height: 'var(--radix-accordion-content-height)' }
			},
			'accordion-up': {
				from: { height: 'var(--radix-accordion-content-height)' },
				to: { height: '0' }
			},
			'float': {
				'0%, 100%': { transform: 'translateY(0)' },
				'50%': { transform: 'translateY(-10px)' }
			},
			'pulse-soft': {
				'0%, 100%': { opacity: '1' },
				'50%': { opacity: '0.7' }
			},
			'sparkle': {
				'0%, 100%': { opacity: '0', transform: 'scale(0) rotate(0deg)' },
				'50%': { opacity: '1', transform: 'scale(1) rotate(180deg)' }
			},
			'twinkle': {
				'0%, 100%': { opacity: '0.3' },
				'50%': { opacity: '1' }
			},
			'gentle-lift': {
				'0%, 100%': { transform: 'translateY(0)', boxShadow: '0 4px 20px -4px hsl(270 35% 82% / 0.35)' },
				'50%': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px -8px hsl(272 50% 55% / 0.20)' }
			},
			// The reader's line crossing the scanner plate ("Explore more", Nº 04).
			'door-scan': {
				'0%': { opacity: '0', transform: 'translateY(0)' },
				'12%, 88%': { opacity: '1' },
				'100%': { opacity: '0', transform: 'translateY(9rem)' }
			}
		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			'float': 'float 3s ease-in-out infinite',
			'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
			'sparkle': 'sparkle 2s ease-in-out infinite',
			'twinkle': 'twinkle 1.5s ease-in-out infinite',
			'gentle-lift': 'gentle-lift 3s ease-in-out infinite',
				'door-scan': 'door-scan 1.6s cubic-bezier(0.45, 0, 0.55, 1) infinite'
		}
	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
