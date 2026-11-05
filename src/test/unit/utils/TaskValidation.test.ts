import {
  TASK_DESCRIPTION_TOO_LONG,
  TASK_DUE_DATE_INVALID,
  TASK_DUE_DATE_PAST,
  TASK_DUE_DATE_REQUIRED,
  TASK_DUE_TIME_INVALID,
  TASK_STATUS_REQUIRED,
  TASK_TITLE_REQUIRED,
  TASK_TITLE_TOO_LONG,
} from '../../../main/utils/constants/messageConstants';
import {
  getDescriptionValidationErrors,
  getDueDateValidationErrors,
  getStatusValidationErrors,
  getTitleValidationErrors,
  toLocalDateTime,
} from '../../../main/utils/taskValidation';

describe('taskValidation', () => {
  describe('getTitleValidationErrors', () => {
    it('requires a title', () => {
      expect(getTitleValidationErrors(undefined)).toEqual([TASK_TITLE_REQUIRED]);
      expect(getTitleValidationErrors('')).toEqual([TASK_TITLE_REQUIRED]);
    });

    it('rejects title longer than 255 characters', () => {
      expect(getTitleValidationErrors('a'.repeat(256))).toEqual([TASK_TITLE_TOO_LONG]);
    });

    it('accepts title of exactly 255 characters', () => {
      expect(getTitleValidationErrors('a'.repeat(255))).toEqual([]);
    });
  });

  describe('getDescriptionValidationErrors', () => {
    it('allows empty description', () => {
      expect(getDescriptionValidationErrors('')).toEqual([]);
      expect(getDescriptionValidationErrors(undefined)).toEqual([]);
    });

    it('rejects description longer than 2000 characters', () => {
      expect(getDescriptionValidationErrors('a'.repeat(2001))).toEqual([TASK_DESCRIPTION_TOO_LONG]);
    });
  });

  describe('getStatusValidationErrors', () => {
    it.each(['TODO', 'IN_PROGRESS', 'DONE'])('accepts %s', status => {
      expect(getStatusValidationErrors(status)).toEqual([]);
    });

    it.each([undefined, '', 'FINISHED'])('rejects %p', status => {
      expect(getStatusValidationErrors(status)).toEqual([TASK_STATUS_REQUIRED]);
    });
  });

  describe('getDueDateValidationErrors', () => {
    const valid = { day: '1', month: '3', year: '2099', time: '10:00' };

    it('accepts real date and time in the future', () => {
      expect(getDueDateValidationErrors(valid)).toEqual({});
    });

    it('requires every part of the date', () => {
      expect(getDueDateValidationErrors({ ...valid, month: '' })).toEqual({ dueDate: [TASK_DUE_DATE_REQUIRED] });
    });

    it('rejects date that does not exist', () => {
      expect(getDueDateValidationErrors({ ...valid, day: '31', month: '2' })).toEqual({
        dueDate: [TASK_DUE_DATE_INVALID],
      });
    });

    it('rejects year that is not four digits', () => {
      expect(getDueDateValidationErrors({ ...valid, year: '99' })).toEqual({ dueDate: [TASK_DUE_DATE_INVALID] });
    });

    it.each(['', '25:00', '10:60', '10am'])('rejects the time %p', time => {
      expect(getDueDateValidationErrors({ ...valid, time })).toEqual({ dueTime: [TASK_DUE_TIME_INVALID] });
    });

    it('rejects date in the past', () => {
      expect(getDueDateValidationErrors({ ...valid, year: '2000' })).toEqual({ dueDate: [TASK_DUE_DATE_PAST] });
    });
  });

  describe('toLocalDateTime', () => {
    it('pads single digits into an ISO local date-time', () => {
      expect(toLocalDateTime({ day: '1', month: '3', year: '2099', time: '9:05' })).toBe('2099-03-01T09:05:00');
    });
  });
});
