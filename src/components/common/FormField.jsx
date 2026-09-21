import { FORM_CONTROL_CLASS, formControlStyle, formLabelStyle } from '@/components/common/formControls.js';

export default function FormField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  textarea = false,
  rows = 3,
  type = 'text',
}) {
  const common = {
    className: FORM_CONTROL_CLASS,
    value: value ?? '',
    onChange: (e) => onChange(e.target.value),
    required,
    disabled,
    style: formControlStyle,
  };

  return (
    <label style={formLabelStyle}>
      <span style={{ opacity: 0.8 }}>{label}</span>
      {textarea ? (
        <textarea rows={rows} {...common} />
      ) : (
        <input type={type} {...common} />
      )}
    </label>
  );
}
