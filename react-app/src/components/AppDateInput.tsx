import React, { useRef } from 'react';
import { formatAppDate } from '../utils/helpers';
import { CalendarIcon } from '../icons';

interface AppDateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
    className?: string;
    placeholder?: string;
    readOnly?: boolean;
}

export const AppDateInput: React.FC<AppDateInputProps> = ({
    value,
    onChange,
    className = '',
    placeholder = '',
    disabled,
    required,
    max,
    min,
    id,
    readOnly,
    style,
    ...props
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const systemFormat = localStorage.getItem('dateFormat') || 'DD/MM/YYYY';

    const displayPlaceholder = placeholder || systemFormat.toLowerCase();
    
    // format the current YYYY-MM-DD value into the display format
    const displayValue = value ? formatAppDate(value) : '';

    const handleContainerClick = () => {
        if (disabled || readOnly) return;
        // Focus and trigger picker
        if (inputRef.current) {
            inputRef.current.focus();
            try {
                // Modern browsers support showPicker()
                if (typeof inputRef.current.showPicker === 'function') {
                    inputRef.current.showPicker();
                } else {
                    inputRef.current.click();
                }
            } catch (e) {
                inputRef.current.click();
            }
        }
    };

    const baseClass = className.includes('input-field') || className.includes('table-input') || className.includes('ops-inputs') || className.includes('date-input-hidden')
        ? '' 
        : 'input-field';

    const wrapperClass = `app-date-input-wrapper ${baseClass} ${disabled ? 'disabled' : ''} ${readOnly ? 'readonly' : ''} ${className}`;

    return (
        <div 
            className={wrapperClass}
            onClick={handleContainerClick}
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                cursor: (disabled || readOnly) ? 'not-allowed' : 'pointer',
                ...style
            }}
        >
            <input
                ref={inputRef}
                type={readOnly ? 'text' : 'date'}
                id={id}
                value={value || ''}
                onChange={onChange}
                disabled={disabled}
                readOnly={readOnly}
                required={required}
                max={max}
                min={min}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: (disabled || readOnly) ? 'not-allowed' : 'pointer',
                    zIndex: (disabled || readOnly) ? -1 : 1, // Only active if clickable
                }}
                {...props}
            />
            <div 
                className={`app-date-input-display-inner ${readOnly ? 'input-readonly' : ''}`}
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pointerEvents: 'none', // Allow clicks to pass through to the hidden input
                    color: value ? 'inherit' : '#a0aec0',
                    userSelect: 'none',
                    background: 'transparent',
                    border: 'none',
                    padding: 0
                }}
            >
                <span>{displayValue || displayPlaceholder}</span>
                {!readOnly && (
                    <span style={{ color: '#a0aec0', display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                        <CalendarIcon size={16} />
                    </span>
                )}
            </div>
        </div>
    );
};

export default AppDateInput;
