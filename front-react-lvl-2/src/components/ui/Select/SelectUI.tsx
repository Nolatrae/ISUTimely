import cn from 'clsx'
import Select from 'react-select'

interface Option {
	value: string
	label: string
}

interface Props {
	label: string
	name: string
	error?: string
	setValue: (name: string, value: any) => void
	options: Option[]
	isMulti?: boolean
	closeMenuOnSelect?: boolean
}

export function SelectUI({
	label,
	name,
	error,
	setValue,
	options,
	isMulti = false,
	closeMenuOnSelect = true,
	...props
}: Props) {
	const handleChange = (selectedOption: any) => {
		const selectedValues = isMulti
			? selectedOption.map((option: any) => option.value)
			: selectedOption.value
		setValue(name, selectedValues)
	}

	const customStyles = {
		control: (styles: any) => ({
			...styles,
			width: '100%',
			padding: '0.5rem',
			borderRadius: '0.375rem',
			border: error ? '1px solid #f44336' : '1px solid #d1d5db',
			boxShadow: 'none',
			backgroundColor: 'transparent',
			'&:hover': {
				borderColor: error ? '#f44336' : '#4B5563'
			}
		}),
		menu: (styles: any) => ({
			...styles,
			backgroundColor: 'white',
			boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
			borderRadius: '0.375rem'
		}),
		option: (styles: any, state: any) => ({
			...styles,
			backgroundColor: state.isSelected ? '#4CAF50' : state.isFocused ? '#f0f0f0' : 'transparent',
			color: state.isSelected ? '#fff' : '#333',
			padding: '0.75rem',
			cursor: 'pointer',
			'&:active': {
				backgroundColor: '#4CAF50'
			}
		}),
		multiValue: (styles: any) => ({
			...styles,
			backgroundColor: '#4CAF50',
			color: '#fff',
			borderRadius: '9999px',
			padding: '0.25rem 0.5rem'
		}),
		multiValueLabel: (styles: any) => ({
			...styles,
			color: '#fff',
			fontWeight: '600'
		}),
		multiValueRemove: (styles: any) => ({
			...styles,
			color: '#fff',
			cursor: 'pointer',
			':hover': {
				backgroundColor: '#E64A19',
				color: '#fff'
			}
		})
	}

	return (
		<div className='mb-4'>
			<label>
				<span className='block text-gray-400 font-semibold mb-2'>{label}</span>
				<Select
					options={options}
					isMulti={isMulti}
					closeMenuOnSelect={closeMenuOnSelect}
					className={cn(
						'w-full px-3 py-2 border rounded shadow-sm transition-colors focus:outline-none focus:ring-0 focus:border-gray-500 bg-transparent',
						error ? 'border-red-500' : 'border-border'
					)}
					onChange={handleChange}
					styles={customStyles}
					{...props}
				/>
			</label>
			{error && <p className='text-red-500 text-sm mt-1'>{error}</p>}
		</div>
	)
}
