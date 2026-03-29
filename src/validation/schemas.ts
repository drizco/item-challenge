import * as z from 'zod';
import {
  MIN_OPTIONS_LENGTH,
  REQUEST_VALIDATION_FAILED_ERROR,
} from '../constants';

// enums
export const ItemTypeEnum = z.enum([
  'multiple-choice',
  'free-response',
  'essay',
]);

export const StatusEnum = z.enum(['draft', 'review', 'approved', 'archived']);

export const SecurityLevelEnum = z.enum([
  'standard',
  'secure',
  'highly-secure',
]);

// schemas
export const IdParamSchema = z.string().uuid();

const BaseFields = {
  subject: z.string().min(1),
  itemType: ItemTypeEnum,
  difficulty: z.number().int().min(1).max(5),
  securityLevel: SecurityLevelEnum,
};

const ContentSchema = z.strictObject({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
});

const MetadataSchema = z.strictObject({
  author: z.string().min(1),
  status: StatusEnum,
  tags: z.array(z.string().min(1)),
});

export const CreateItemRequestSchema = z
  .strictObject({
    ...BaseFields,
    content: ContentSchema,
    metadata: MetadataSchema,
  })
  .refine(
    itemRequest =>
      // options are required for multiple choice and must have a min length
      itemRequest.itemType === 'multiple-choice'
        ? itemRequest.content.options &&
          itemRequest.content.options.length >= MIN_OPTIONS_LENGTH
        : true,
    {
      message: `multiple-choice items require at least ${MIN_OPTIONS_LENGTH} options`,
      path: ['content', 'options'],
    }
  );

export const UpdateItemRequestSchema = z
  .strictObject({
    ...BaseFields,
    content: ContentSchema.partial().optional(),
    metadata: MetadataSchema.partial().optional(),
  })
  .partial();

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
