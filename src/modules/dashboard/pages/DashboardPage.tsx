import { useTranslation } from "react-i18next";
import { useAccessSession } from "@/modules/auth/hooks/useAccessSession";

export function DashboardPage() {
  const { data: session } = useAccessSession();
  const { t } = useTranslation("dashboard");

  if (!session) {
    return null;
  }

  const companyName = session.company?.name ?? t("fallbackCompany");

  return (
    <section className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {t("welcome", { companyName })}
        </h1>
      </div>
    </section>
  );
}
