import { z } from "zod";

const uuidSchema = z.string().uuid();

export const fapiChatSchema = z.object({
  sessionId: uuidSchema,
  message: z.string().min(2).max(4000)
});

export const fapiSessionResetSchema = z.object({
  sessionId: uuidSchema
});

const fapiRuleBaseSchema = z.object({
  tipo: z.enum(["geral", "agencia", "edital"]),
  agenciaId: uuidSchema.nullable().optional(),
  editalId: uuidSchema.nullable().optional(),
  descricao: z.string().min(10).max(3000),
  ativa: z.boolean().optional().default(true)
});

export const createFapiRuleSchema = fapiRuleBaseSchema
  .superRefine((value, ctx) => {
    if (value.tipo === "geral" && (value.agenciaId || value.editalId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Regra geral nao pode ter vinculos de agencia ou edital."
      });
    }

    if (value.tipo === "agencia" && (!value.agenciaId || value.editalId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Regra por agencia exige agenciaId e nao permite editalId."
      });
    }

    if (value.tipo === "edital" && !value.editalId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Regra por edital exige editalId."
      });
    }
  });

export const updateFapiRuleSchema = fapiRuleBaseSchema.partial().superRefine((value, ctx) => {
  if (!value.tipo && !value.descricao && value.ativa === undefined && !value.agenciaId && !value.editalId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe ao menos um campo para atualizar."
    });
  }

  if (value.tipo === "geral" && (value.agenciaId || value.editalId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Regra geral nao pode ter vinculos de agencia ou edital."
    });
  }

  if (value.tipo === "agencia" && value.editalId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Regra por agencia nao permite editalId."
    });
  }
});

export const fapiWritingSchema = z.object({
  briefing: z.string().min(20).max(6000),
  agencyId: uuidSchema.nullable().optional(),
  editalId: uuidSchema.nullable().optional()
});

export const fapiWritingChatSchema = z.object({
  sessionId: uuidSchema,
  message: z.string().min(2).max(4000)
});
