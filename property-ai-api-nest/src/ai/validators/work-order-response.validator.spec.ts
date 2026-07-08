import { AiServiceException } from '../exceptions/ai-service.exception';
import { WorkOrderResponseValidator } from './work-order-response.validator';

describe('WorkOrderResponseValidator', () => {
  const validator = new WorkOrderResponseValidator();

  it('accepts a well-formed response and trims fields', () => {
    const result = validator.validate({
      title: '  Leaking pipe  ',
      category: 'plumbing',
      priority: 'high',
      summary: '  Needs a plumber.  ',
    });

    expect(result).toEqual({
      title: 'Leaking pipe',
      category: 'plumbing',
      priority: 'high',
      summary: 'Needs a plumber.',
    });
  });

  it('rejects a missing or empty title', () => {
    expect(() =>
      validator.validate({
        title: '',
        category: 'plumbing',
        priority: 'high',
        summary: 'x',
      }),
    ).toThrow(AiServiceException);
  });

  it('rejects a missing or empty summary', () => {
    expect(() =>
      validator.validate({
        title: 'x',
        category: 'plumbing',
        priority: 'high',
        summary: '   ',
      }),
    ).toThrow(AiServiceException);
  });

  it('rejects an unknown category', () => {
    expect(() =>
      validator.validate({
        title: 'x',
        category: 'not-a-category',
        priority: 'high',
        summary: 'x',
      }),
    ).toThrow(AiServiceException);
  });

  it('rejects an unknown priority', () => {
    expect(() =>
      validator.validate({
        title: 'x',
        category: 'plumbing',
        priority: 'not-a-priority',
        summary: 'x',
      }),
    ).toThrow(AiServiceException);
  });

  it('truncates overly long titles and summaries instead of rejecting them', () => {
    const result = validator.validate({
      title: 'a'.repeat(200),
      category: 'general',
      priority: 'low',
      summary: 'b'.repeat(600),
    });

    expect(result.title).toHaveLength(120);
    expect(result.summary).toHaveLength(500);
  });
});
