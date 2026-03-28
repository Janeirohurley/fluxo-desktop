interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { track: 'w-8 h-4', thumb: 'w-3 h-3 left-0.5 top-0.5', translate: 'peer-checked:translate-x-4', gap: 'gap-2', text: 'text-xs' },
  md: { track: 'w-11 h-6', thumb: 'w-4 h-4 left-1 top-1', translate: 'peer-checked:translate-x-5', gap: 'gap-3', text: 'text-sm' },
  lg: { track: 'w-14 h-7', thumb: 'w-5 h-5 left-1 top-1', translate: 'peer-checked:translate-x-7', gap: 'gap-3', text: 'text-base' }
};

export function Toggle({ checked, onChange, label, disabled, size = 'md' }: ToggleProps) {
  const { track, thumb, translate, gap, text } = sizes[size];

  return (
    <label className={`flex items-center ${gap} cursor-pointer`}>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={`
          ${track} rounded-full transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          peer-checked:bg-blue-600 bg-gray-300 dark:bg-gray-600
        `} />
        <div className={`
          absolute ${thumb} bg-white rounded-full transition-transform
          ${translate}
        `} />
      </div>
      {label && (
        <span className={`${text} ${disabled ? 'opacity-50' : 'text-gray-700 dark:text-gray-300'}`}>
          {label}
        </span>
      )}
    </label>
  );
}
