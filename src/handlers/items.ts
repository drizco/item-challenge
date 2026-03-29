import { INTERNAL_SERVER_ERROR } from '../constants';
import { createStorage } from '../storage';
import {
  CreateItemRequestSchema,
  validateRequest
} from '../validation/schemas';

const storage = createStorage();

export async function createItemHandler(item: unknown) {
  try {
    const validationResult = validateRequest(CreateItemRequestSchema, item);
    if (validationResult.error) {
      return validationResult.error;
    }

    const newItem = await storage.createItem(validationResult.data);
    return { statusCode: 201, body: newItem };
  } catch (error) {
    return { statusCode: 500, body: { error: INTERNAL_SERVER_ERROR } };
  }
}
