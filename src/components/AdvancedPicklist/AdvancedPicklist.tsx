import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './AdvancedPicklist.css';

export interface PicklistOption {
  label: string;
  value: string;
}

interface AdvancedPicklistProps {
  fieldLabel: string;
  placeholder?: string;
  options: PicklistOption[];
  value?: string;
  disabled?: boolean;
  onChange?: (detail: { value: string; label: string }) => void;
}

export function AdvancedPicklist({
  fieldLabel,
  placeholder = '',
  options,
  value = '',
  disabled = false,
  onChange,
}: AdvancedPicklistProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    setFilteredOptions(options);
    if (value) {
      const match = options.find((o) => o.value === value);
      setSelectedLabel(match?.label ?? '');
    } else {
      setSelectedLabel('');
    }
  }, [options, value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchKey('');
        setFilteredOptions(options);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, options]);

  useEffect(() => {
    if (isOpen) {
      searchRef.current?.focus();
    }
  }, [isOpen]);

  const openDropdown = () => {
    if (disabled) return;
    setSearchKey('');
    setFilteredOptions(options);
    setIsOpen(true);
  };

  const handleSearch = (key: string) => {
    setSearchKey(key);
    setFilteredOptions(
      options.filter((item) => item.label.toLowerCase().includes(key.toLowerCase())),
    );
  };

  const selectOption = (option: PicklistOption) => {
    setSelectedLabel(option.label);
    setIsOpen(false);
    setSearchKey('');
    setFilteredOptions(options);
    onChange?.({ value: option.value, label: option.label });
  };

  return (
    <div className="advanced-picklist slds-form-element" ref={containerRef}>
      <label className="advanced-picklist__label" htmlFor={`${listboxId}-display`}>
        {fieldLabel}
      </label>
      <div
        className={`advanced-picklist__combobox ${isOpen ? 'advanced-picklist__combobox--open' : ''}`}
      >
        {!isOpen ? (
          <div className="advanced-picklist__control">
            <input
              id={`${listboxId}-display`}
              type="text"
              readOnly
              disabled={disabled}
              placeholder={placeholder}
              value={selectedLabel}
              onClick={openDropdown}
              className="advanced-picklist__input"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-expanded={isOpen}
              role="combobox"
            />
            <span className="advanced-picklist__icon" aria-hidden>
              <ChevronDown size={14} />
            </span>
          </div>
        ) : (
          <input
            ref={searchRef}
            type="search"
            className="advanced-picklist__search"
            value={searchKey}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label={fieldLabel}
            aria-controls={listboxId}
            aria-expanded={isOpen}
            role="combobox"
          />
        )}

        {isOpen && (
          <ul id={listboxId} className="advanced-picklist__dropdown" role="listbox">
            {filteredOptions.length === 0 && (
              <li className="advanced-picklist__option advanced-picklist__option--empty">
                Nenhum resultado
              </li>
            )}
            {filteredOptions.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className="advanced-picklist__option"
                title={option.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOption(option)}
              >
                <span className="advanced-picklist__option-label">{option.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
