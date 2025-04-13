import { COLORS } from './src/constants/colors.constants.ts'

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: COLORS,
			padding: {
				// layout: '1.2rem',
				layout: '20px',
			},
			transitionTimingFunction: {
				DEFAULT: 'ease-in-out',
			},
			transitionDuration: {
				DEFAULT: '333ms',
			},
		},
	},
	plugins: [],
}
