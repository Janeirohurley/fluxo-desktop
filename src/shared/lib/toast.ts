/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/toast.ts
import { toast } from "sonner";

export const notify = {
    success: (msg?: string,args?:any) => toast.success(msg,{...args}),
    error: (msg?: string, args?: any) => toast.error(msg,{...args}),
    info: (msg?: string, args?: any) => toast(msg,{...args}),
    loading: (msg?: string, args?: any) => toast.loading(msg, { ...args }),
    dismiss: (id?: string | number) => toast.dismiss(id),
};
