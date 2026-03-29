import * as z from "zod";

// constants
const MIN_OPTIONS_LENGTH = 2;
export const REQUEST_VALIDATION_FAILED_ERROR = "Request validation failed";

// enums
export const ItemTypeEnum = z.enum([
  "multiple-choice",
  "free-response",
  "essay",
]);

export const StatusEnum = z.enum(["draft", "review", "approved", "archived"]);

export const SecurityLevelEnum = z.enum([
  "standard",
  "secure",
  "highly-secure",
]);

// schemas
export const CreateItemRequestSchema = z
  .strictObject({
    subject: z.string().min(1),
    itemType: ItemTypeEnum,
    difficulty: z.number().int().min(1).max(5),
    content: z.strictObject({
      question: z.string().min(1),

      options: z.array(z.string().min(1)).optional(),
      correctAnswer: z.string().min(1),
      explanation: z.string().min(1),
    }),
    metadata: z.strictObject({
      author: z.string().min(1),
      status: StatusEnum,
      tags: z.array(z.string().min(1)),
    }),
    securityLevel: SecurityLevelEnum,
  })
  // options are required for multiple choice and must have a min length
  .refine(
    (itemRequest) =>
      itemRequest.itemType === "multiple-choice"
        ? itemRequest.content.options &&
          itemRequest.content.options.length >= MIN_OPTIONS_LENGTH
        : true,
    {
      message: `multiple-choice items require at least ${MIN_OPTIONS_LENGTH} options`,
      path: ["content", "options"],
    },
  );

// helpers
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (result.success) {
    return result;
  }

  return {
    ...result,
    error: {
      statusCode: 400,
      body: {
        error: REQUEST_VALIDATION_FAILED_ERROR,
        details: result.error.issues,
      },
    },
  };
}
