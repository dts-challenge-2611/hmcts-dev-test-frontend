import { taskStatusSchema } from '../schemas/task';

import {
  TASK_DESCRIPTION_TOO_LONG,
  TASK_DUE_DATE_INVALID,
  TASK_DUE_DATE_PAST,
  TASK_DUE_DATE_REQUIRED,
  TASK_DUE_TIME_INVALID,
  TASK_STATUS_REQUIRED,
  TASK_TITLE_REQUIRED,
  TASK_TITLE_TOO_LONG,
} from './constants/messageConstants';

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export type DueDateParts = {
  day?: string;
  month?: string;
  year?: string;
  time?: string;
};

export function getTitleValidationErrors(title?: string): string[] {
  if (!title) {
    return [TASK_TITLE_REQUIRED];
  }
  return title.length > 255 ? [TASK_TITLE_TOO_LONG] : [];
}

export function getDescriptionValidationErrors(description?: string): string[] {
  return description && description.length > 2000 ? [TASK_DESCRIPTION_TOO_LONG] : [];
}

export function getStatusValidationErrors(status?: string): string[] {
  return taskStatusSchema.safeParse(status).success ? [] : [TASK_STATUS_REQUIRED];
}

export function getDueDateValidationErrors(parts: DueDateParts): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  const { day, month, year, time } = parts;

  if (!day || !month || !year) {
    errors.dueDate = [TASK_DUE_DATE_REQUIRED];
  } else if (!isRealDate(day, month, year)) {
    errors.dueDate = [TASK_DUE_DATE_INVALID];
  }

  if (!time || !TIME_PATTERN.test(time)) {
    errors.dueTime = [TASK_DUE_TIME_INVALID];
  }

  if (!errors.dueDate && !errors.dueTime && new Date(toLocalDateTime(parts)) < new Date()) {
    errors.dueDate = [TASK_DUE_DATE_PAST];
  }

  return errors;
}

export function toLocalDateTime({ day, month, year, time }: DueDateParts): string {
  const [hours, minutes] = (time ?? '').split(':');
  return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${minutes}:00`;
}

function isRealDate(day: string, month: string, year: string): boolean {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !/^\d{4}$/.test(year)) {
    return false;
  }
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function pad(value = ''): string {
  return value.padStart(2, '0');
}
