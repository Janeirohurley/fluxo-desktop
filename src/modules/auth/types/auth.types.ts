export type AccessModuleName = "assets" | "finance" | "employees" | "payroll" | string;

export type AccessSession = {
  keyId: string;
  keyPrefix: string;
  label: string | null;
  expiresAt: string | null;
  company: {
    id: string;
    slug: string;
    name: string;
  } | null;
  plan: {
    id: string;
    code: string;
    name: string;
    description: string | null;
  };
  modules: AccessModuleName[];
};

type AccessSessionDto = {
  key_id: string;
  key_prefix: string;
  label: string | null;
  expires_at: string | null;
  company: {
    id: string;
    slug: string;
    name: string;
  } | null;
  plan: {
    id: string;
    code: string;
    name: string;
    description: string | null;
  };
  modules: AccessModuleName[];
};

export type AccessSessionApiResponse = {
  data: AccessSessionDto | null;
};

export function mapAccessSession(dto: AccessSessionDto): AccessSession {
  return {
    keyId: dto.key_id,
    keyPrefix: dto.key_prefix,
    label: dto.label,
    expiresAt: dto.expires_at,
    company: dto.company,
    plan: dto.plan,
    modules: dto.modules,
  };
}