import React, { ChangeEvent, useState } from 'react'

interface SearchablePopoverProps {
  options: string[]
  placeholder: string
  onOptionClick: (option: string) => void
  triggerIcon: React.ReactNode
}

const SearchablePopover: React.FC<SearchablePopoverProps> = ({
  options,
  placeholder,
  onOptionClick,
  triggerIcon,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const handleClose = () => {
    setSearchTerm('')
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        className="p-1 bg-gray-200 rounded-full text-xs"
        onClick={() => setIsOpen(!isOpen)} // Toggle the dropdown visibility
      >
        {triggerIcon}
      </button>

      {isOpen && (
        <div className="absolute bg-white border border-gray-300 p-2 shadow-lg flex flex-col max-h-72 overflow-y-auto sm:w-60 md:w-80 lg:w-96">
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            className="p-2 border border-gray-300 rounded mb-2 w-full"
          />
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <button
                key={idx}
                className="p-2 hover:bg-gray-100 text-left w-full"
                onClick={() => {
                  onOptionClick(option)
                  handleClose()
                }}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="p-2 text-gray-500 text-center">Нет совпадений</div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchablePopover
