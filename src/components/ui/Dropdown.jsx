import { useState, useEffect, useRef, forwardRef } from 'react'
import styles from './Dropdown.module.css'

const Dropdown = forwardRef(function Dropdown(
    { options = [], value, onChange, id }, 
    ref
) {

    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef(null)

    // Merge forwarded ref with internal ref
    useEffect(() => {
        if (!ref) return
        if (typeof ref === 'function') ref(wrapperRef.current)
        else ref.current = wrapperRef.current
    }, [ref])

    // Expose Dropdown method for agent to call
    useEffect(() => {
        if (!wrapperRef.current) return

        wrapperRef.current.dropdown = (optionValue) => {
            setIsOpen(true)
            setTimeout(() => {
                onChange(optionValue)
                setIsOpen(false)
            }, 600)
        }
    }, [onChange])

    // Close on outside click
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [])

    const selectedLabel = options.find((o) => o.value === value)?.label || value

    return (
        <div
            id={id}
            ref={wrapperRef}
            className={styles.wrapper}
        >
            {/* Trigger */}
            <button
                type="button"
                className={`${styles.trigger} dropdownTrigger ${isOpen ? styles.triggerOpen : ''}`}
                id={`${id}-trigger`}
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span>{selectedLabel}</span>

                <svg
                    className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {/* Options */}
            {isOpen && (
                <ul
                    className={styles.optionsList}
                    role="listbox"
                >
                    {options.map((option) => (
                        <li
                            key={option.value}
                            id={`${id}-option-${option.value.toLowerCase().split(' ')[0]}`}
                            role="option"
                            aria-selected={option.value === value}
                            className={`${styles.option} ${option.value === value ? styles.optionSelected : ''}`}
                            onClick={() => {
                                onChange(option.value)
                                setIsOpen(false)
                            }}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
})

export default Dropdown