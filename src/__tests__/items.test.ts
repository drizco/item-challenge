import { beforeEach, describe, expect, it } from 'vitest';
import { CreateItemRequest, ExamItem } from '../types/item';
import { createItemHandler, getItemHandler } from '../handlers/items';
import { NOT_FOUND_ERROR, REQUEST_VALIDATION_FAILED_ERROR } from '../constants';

const itemData = {
  subject: 'AP Biology',
  itemType: 'multiple-choice',
  difficulty: 3,
  content: {
    question: 'What is photosynthesis?',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    explanation: 'Photosynthesis is the process...',
  },
  metadata: {
    author: 'test-author',
    status: 'draft',
    tags: ['biology', 'photosynthesis'],
  },
  securityLevel: 'standard',
};

function buildItem(overrides: Partial<CreateItemRequest> = {}) {
  return {
    ...itemData,
    ...overrides,
    content: {
      ...itemData.content,
      ...(overrides.content ?? {}),
    },
    metadata: {
      ...itemData.metadata,
      ...(overrides.metadata ?? {}),
    },
  };
}

describe('Items', () => {
  describe('createItemHandler', () => {
    describe('success', () => {
      it('should create a valid multiple-choice item', async () => {
        const item = buildItem();
        const result = await createItemHandler(item);

        expect(result.statusCode).toBe(201);
        expect(result.body).toHaveProperty('id');
        expect(result.body).toMatchObject(item);
      });

      it('should create a valid free-response item', async () => {
        const item = buildItem({
          itemType: 'free-response',
          content: { ...itemData.content, options: undefined },
        });
        const result = await createItemHandler(item);

        expect(result.statusCode).toBe(201);
        expect(result.body).toHaveProperty('id');
        expect(result.body).toMatchObject(item);
      });

      it('should create a valid essay item', async () => {
        const item = buildItem({
          itemType: 'essay',
          content: { ...itemData.content, options: undefined },
        });
        const result = await createItemHandler(item);

        expect(result.statusCode).toBe(201);
        expect(result.body).toHaveProperty('id');
        expect(result.body).toMatchObject(item);
      });

      it('should set created, lastModified, and version', async () => {
        const item = buildItem();
        const result = await createItemHandler(item);

        expect(result.body).toHaveProperty('metadata');
        if ('metadata' in result.body) {
          expect(result.body.metadata).toHaveProperty('created');
          expect(result.body.metadata).toHaveProperty('lastModified');
          expect(result.body.metadata).toHaveProperty('version');
        }
      });
    });

    describe('failure', () => {
      it('should return 400 when required fields are missing', async () => {
        const { itemType, ...item } = buildItem();
        const result = await createItemHandler(item);

        expect(result.statusCode).toBe(400);
        expect(result.body).toHaveProperty(
          'error',
          REQUEST_VALIDATION_FAILED_ERROR
        );
      });

      it('should return 400 for an invalid itemType', async () => {
        const item = buildItem({ itemType: 'fake-type' });
        const result = await createItemHandler(item);

        expect(result.statusCode).toBe(400);
        expect(result.body).toHaveProperty(
          'error',
          REQUEST_VALIDATION_FAILED_ERROR
        );
      });

      it('should return 400 for an out of range difficulty', async () => {
        const item = buildItem({ difficulty: 10 });
        const result = await createItemHandler(item);

        expect(result.statusCode).toBe(400);
        expect(result.body).toHaveProperty(
          'error',
          REQUEST_VALIDATION_FAILED_ERROR
        );
      });

      it('should return 400 for a multiple-choice item without options', async () => {
        const item = buildItem({
          content: { ...itemData.content, options: undefined },
        });
        const result = await createItemHandler(item);

        expect(result.statusCode).toBe(400);
        expect(result.body).toHaveProperty(
          'error',
          REQUEST_VALIDATION_FAILED_ERROR
        );
      });

      it('should return 400 for a multiple-choice item with only one option', async () => {
        const item = buildItem({
          content: { ...itemData.content, options: ['A'] },
        });
        const result = await createItemHandler(item);

        expect(result.statusCode).toBe(400);
        expect(result.body).toHaveProperty(
          'error',
          REQUEST_VALIDATION_FAILED_ERROR
        );
      });

      it('should return 400 for empty strings', async () => {
        const item = buildItem({
          subject: '',
        });
        const result = await createItemHandler(item);

        expect(result.statusCode).toBe(400);
        expect(result.body).toHaveProperty(
          'error',
          REQUEST_VALIDATION_FAILED_ERROR
        );
      });

      it('should return 400 for invalid securityLevel', async () => {
        const item = buildItem({
          securityLevel: 'fake-security',
        });
        const result = await createItemHandler(item);

        expect(result.statusCode).toBe(400);
        expect(result.body).toHaveProperty(
          'error',
          REQUEST_VALIDATION_FAILED_ERROR
        );
      });

      it('should return 400 for invalid status', async () => {
        const item = buildItem({
          metadata: { ...itemData.metadata, status: 'fake-status' },
        });
        const result = await createItemHandler(item);

        expect(result.statusCode).toBe(400);
        expect(result.body).toHaveProperty(
          'error',
          REQUEST_VALIDATION_FAILED_ERROR
        );
      });
    });
  });

  describe('getItemHandler', () => {
    describe('success', () => {
      let item = buildItem();
      let itemId: ExamItem['id'];

      beforeEach(async () => {
        const { body } = await createItemHandler(item);
        if ('id' in body) {
          itemId = body.id;
        }
      });

      it('should get an item by id', async () => {
        const result = await getItemHandler(itemId);

        expect(result.body).toMatchObject({ id: itemId, ...item });
      });
    });

    describe('failure', () => {
      it('should return 404 if not found', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        const result = await getItemHandler(nonExistentId);

        expect(result.statusCode).toBe(404);
        expect(result.body).toHaveProperty('error', NOT_FOUND_ERROR);
      });

      it('should return 400 if not a valid id', async () => {
        const badId = 'bad-id';
        const result = await getItemHandler(badId);

        expect(result.statusCode).toBe(400);
        expect(result.body).toHaveProperty(
          'error',
          REQUEST_VALIDATION_FAILED_ERROR
        );
      });
    });
  });
});
