import { INTERNAL_SERVER_ERROR, NOT_FOUND_ERROR } from '../constants';
import { createStorage } from '../storage';
import {
  CreateItemRequestSchema,
  IdParamSchema,
  UpdateItemRequestSchema,
  validateRequest,
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

export async function getItemHandler(itemId: unknown) {
  try {
    const validationResult = validateRequest(IdParamSchema, itemId);
    if (validationResult.error) {
      return validationResult.error;
    }

    const item = await storage.getItem(validationResult.data);
    if (item) {
      return { statusCode: 200, body: item };
    }
    return { statusCode: 404, body: { error: NOT_FOUND_ERROR } };
  } catch (error) {
    return { statusCode: 500, body: { error: INTERNAL_SERVER_ERROR } };
  }
}

export async function updateItemHandler(itemId: unknown, itemUpdates: unknown) {
  try {
    const idValidationResult = validateRequest(IdParamSchema, itemId);
    if (idValidationResult.error) {
      return idValidationResult.error;
    }
    const itemValidationResult = validateRequest(
      UpdateItemRequestSchema,
      itemUpdates
    );
    if (itemValidationResult.error) {
      return itemValidationResult.error;
    }

    const item = await storage.updateItem(
      idValidationResult.data,
      itemValidationResult.data
    );
    if (item) {
      return { statusCode: 200, body: item };
    }
    return { statusCode: 404, body: { error: NOT_FOUND_ERROR } };
  } catch (error) {
    return { statusCode: 500, body: { error: INTERNAL_SERVER_ERROR } };
  }
}
