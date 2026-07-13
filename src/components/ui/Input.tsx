import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-bold text-stone-500 tracking-wide mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-xl">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={clsx(
              'block w-full rounded-xl border border-stone-200 py-2.5 text-xs transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none placeholder-stone-400 text-stone-850 bg-white hover:border-stone-300',
              leftIcon ? 'pl-10' : 'pl-4',
              rightIcon ? 'pr-10' : 'pr-4',
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-stone-200',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-bold text-stone-500 tracking-wide mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-xl">
          <select
            ref={ref}
            className={clsx(
              'block w-full rounded-xl border border-stone-200 py-2.5 px-4 text-xs transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none bg-white hover:border-stone-300 appearance-none cursor-pointer',
              !props.value || props.value === '' ? 'text-stone-400' : 'text-stone-850',
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-stone-200',
              className
            )}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
              paddingRight: '36px'
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-stone-850">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-bold text-stone-500 tracking-wide mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'block w-full rounded-xl border border-stone-200 py-2.5 px-4 text-xs transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none bg-white text-stone-850 hover:border-stone-300',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-stone-200',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
