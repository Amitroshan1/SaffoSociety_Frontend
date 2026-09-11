import { FORM_CONTROL_CLASS, formControlStyle, formLabelStyle } from './formControls.js';

function normalizeOption(option) {
  if (option === null || option === undefined) {
    return { value: '', label: '' };
  }
  if (typeof option === 'string' || typeof option === 'number') {
    return { value: String(option), label: option === '' ? 'Select' : String(option) };
  }
  return {
    value: option.value ?? '',
    label: option.label ?? option.value ?? 'Select',
  };
}

export default function FormSelect({
  label,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  placeholder = 'Select',
}) {
  const normalized = options.map(normalizeOption).filter((o) => o.value !== '');

  return (
    <label style={formLabelStyle}>
      <span style={{ opacity: 0.8 }}>{label}</span>
      <select
        className={FORM_CONTROL_CLASS}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        style={formControlStyle}
      >
        <option value="">{placeholder}</option>
        {normalized.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
