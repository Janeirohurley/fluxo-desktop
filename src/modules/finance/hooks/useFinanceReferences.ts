import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAccountingAccount,
  createPaymentMethod,
  createTransactionType,
  deleteAccountingAccount,
  deletePaymentMethod,
  deleteTransactionType,
  updateAccountingAccount,
  updatePaymentMethod,
  updateTransactionType,
} from "@/modules/finance/api/finance.api";
import { financeQueryKeys } from "@/modules/finance/hooks/useFinance";
import {
  type CreateAccountingAccountPayload,
  type CreatePaymentMethodPayload,
  type CreateTransactionTypePayload,
  type UpdateAccountingAccountPayload,
  type UpdatePaymentMethodPayload,
  type UpdateTransactionTypePayload,
} from "@/modules/finance/types/finance.types";

function useFinanceInvalidation() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: financeQueryKeys.root }),
      queryClient.invalidateQueries({ queryKey: ["overview"] }),
    ]);
  };
}

export function useCreatePaymentMethod() {
  const invalidate = useFinanceInvalidation();

  return useMutation({
    mutationFn: (payload: CreatePaymentMethodPayload) => createPaymentMethod(payload),
    onSuccess: invalidate,
  });
}

export function useUpdatePaymentMethod() {
  const invalidate = useFinanceInvalidation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePaymentMethodPayload }) =>
      updatePaymentMethod(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeletePaymentMethod() {
  const invalidate = useFinanceInvalidation();

  return useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
    onSuccess: invalidate,
  });
}

export function useCreateTransactionType() {
  const invalidate = useFinanceInvalidation();

  return useMutation({
    mutationFn: (payload: CreateTransactionTypePayload) => createTransactionType(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTransactionType() {
  const invalidate = useFinanceInvalidation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTransactionTypePayload }) =>
      updateTransactionType(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTransactionType() {
  const invalidate = useFinanceInvalidation();

  return useMutation({
    mutationFn: (id: string) => deleteTransactionType(id),
    onSuccess: invalidate,
  });
}

export function useCreateAccountingAccount() {
  const invalidate = useFinanceInvalidation();

  return useMutation({
    mutationFn: (payload: CreateAccountingAccountPayload) => createAccountingAccount(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateAccountingAccount() {
  const invalidate = useFinanceInvalidation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAccountingAccountPayload }) =>
      updateAccountingAccount(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteAccountingAccount() {
  const invalidate = useFinanceInvalidation();

  return useMutation({
    mutationFn: (id: string) => deleteAccountingAccount(id),
    onSuccess: invalidate,
  });
}
