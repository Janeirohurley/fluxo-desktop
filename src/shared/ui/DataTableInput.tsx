import * as React from "react"
import { cn } from "@/shared/lib/cn"


type InputProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
> & {
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    onFocusChange?: (isFocused: boolean) => void;
    debounceMs?: number;
};

const DataTableInput = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type,
            defaultValue = "",
            onValueChange,
            onFocusChange,
            debounceMs = 400,
            onKeyDown,
            ...props
        },
        ref
    ) => {
        const [value, setValue] = React.useState(defaultValue);
        const lastNotifiedValue = React.useRef(defaultValue);

        // Debounce: notifie le parent seulement si la valeur a changé et n'est pas vide
        React.useEffect(() => {
            if ( value === lastNotifiedValue.current) return;

            const timer = setTimeout(() => {
                lastNotifiedValue.current = value;
                onValueChange?.(value);
            }, debounceMs);

            return () => clearTimeout(timer);
        }, [value, debounceMs, onValueChange]);

        return (
            <input
                type={type}
                value={value}
                className={cn(
                    "flex h-10 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 placeholder:text-xs focus:outline-none focus:ring-0.5 focus:ring-blue-400 focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500",
                    className
                )}
                ref={ref}
                onChange={(e) => {
                    setValue(e.target.value);
                }}
                {...props}
                onFocus={(e) => {

                    onFocusChange?.(true);
                    props.onFocus?.(e);
                }}
                onKeyDown={(e) => {
                    e.stopPropagation();
                    onKeyDown?.(e);
                }}
                onBlur={(e) => {

                    onFocusChange?.(false);
                    props.onBlur?.(e);
                }}
            />
        )
    }
)
DataTableInput.displayName = "DataTableInput"

export { DataTableInput }
