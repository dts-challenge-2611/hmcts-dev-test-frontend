import { TaskApi } from '../api/taskApi';
import { Task, TaskStatus } from '../schemas/task';
import { CREATE_PAGE_TITLE, DELETE_PAGE_TITLE, EDIT_STATUS_PAGE_TITLE } from '../utils/constants/messageConstants';
import { toErrorSummary } from '../utils/errorSummary';
import {
  getDescriptionValidationErrors,
  getDueDateValidationErrors,
  getStatusValidationErrors,
  getTitleValidationErrors,
  toLocalDateTime,
} from '../utils/taskValidation';

import { z } from 'zod';

const STATUS_LABELS: Record<TaskStatus, { text: string; classes: string }> = {
  TODO: { text: 'To do', classes: 'govuk-tag--grey' },
  IN_PROGRESS: { text: 'In progress', classes: 'govuk-tag--blue' },
  DONE: { text: 'Done', classes: 'govuk-tag--green' },
};

export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  status: { text: string; classes: string };
  statusValue: TaskStatus;
  dueDate: string;
}

type PageFields = {
  errors?: Record<string, string[]>;
  errorSummary?: { text: string; href: string }[];
  pagePath: string;
  pageTitle: string;
};

type RedirectResult = { redirectUrl: string };

export type AddTaskForm = {
  title?: string;
  description?: string;
  status?: string;
  dueDay?: string;
  dueMonth?: string;
  dueYear?: string;
  dueTime?: string;
};

export type AddTaskPageModel = AddTaskForm & PageFields;

export type EditTaskStatusForm = { status?: string };

export type EditTaskStatusPageModel = EditTaskStatusForm & PageFields & { task: TaskListItem };

export type DeleteTaskPageModel = PageFields & { task: TaskListItem };

export class TaskService {
  public constructor(private readonly api: TaskApi = new TaskApi()) {}

  public async getAll(): Promise<TaskListItem[]> {
    const tasks = await this.api.getAllTasks();
    return tasks.map(toListItem);
  }

  public async getById(id: string): Promise<TaskListItem | null> {
    if (!isValidId(id)) {
      return null;
    }
    const task = await this.api.getTaskById(id);
    return task === null ? null : toListItem(task);
  }

  /**
   * Builds empty create-task page, "To do" selected by default
   */
  public getCreateViewModel(form: AddTaskForm = { status: 'TODO' }): AddTaskPageModel {
    return { ...form, pagePath: '/tasks/new', pageTitle: CREATE_PAGE_TITLE };
  }

  /**
   * Validates form, then creates the task and returns where to redirect.
   * Returns the page model with errors if the form is invalid.
   */
  public async create(form: AddTaskForm): Promise<AddTaskPageModel | RedirectResult> {
    const trimmed = trimAll(form);

    const errors = validateCreateForm(trimmed);
    if (errors) {
      return {
        ...trimmed,
        errors,
        errorSummary: toErrorSummary(errors),
        pagePath: '/tasks/new',
        pageTitle: `Error: ${CREATE_PAGE_TITLE}`,
      };
    }

    const created = await this.api.createTask({
      title: trimmed.title as string,
      description: trimmed.description || null,
      status: trimmed.status as string,
      dueDate: toLocalDateTime({
        day: trimmed.dueDay,
        month: trimmed.dueMonth,
        year: trimmed.dueYear,
        time: trimmed.dueTime,
      }),
    });

    return { redirectUrl: `/tasks/${created.id}/created` };
  }

  /**
   * Builds edit page with the current status selected, or null if the task does not exist.
   */
  public async getEditStatusViewModel(id: string): Promise<EditTaskStatusPageModel | null> {
    const task = await this.getById(id);
    if (!task) {
      return null;
    }
    return { status: task.statusValue, task, pagePath: `/tasks/${id}/edit`, pageTitle: EDIT_STATUS_PAGE_TITLE };
  }

  /**
   * Validates the chosen status, updates the task and returns where to redirect.
   * Returns null if the task does not exist.
   */
  public async updateStatus(
    id: string,
    form: EditTaskStatusForm
  ): Promise<EditTaskStatusPageModel | RedirectResult | null> {
    const task = await this.getById(id);
    if (!task) {
      return null;
    }

    const status = form.status?.trim();
    const statusErrors = getStatusValidationErrors(status);
    if (statusErrors.length > 0) {
      const errors = { status: statusErrors };
      return {
        status,
        task,
        errors,
        errorSummary: toErrorSummary(errors),
        pagePath: `/tasks/${id}/edit`,
        pageTitle: `Error: ${EDIT_STATUS_PAGE_TITLE}`,
      };
    }

    const updated = await this.api.updateTaskStatus(id, status as string);
    return updated ? { redirectUrl: `/tasks/${id}/status-updated` } : null;
  }

  /**
   * Builds delete confirmation page, or null if the task does not exist.
   */
  public async getDeleteViewModel(id: string): Promise<DeleteTaskPageModel | null> {
    const task = await this.getById(id);
    if (!task) {
      return null;
    }
    return { task, pagePath: `/tasks/${id}/delete`, pageTitle: DELETE_PAGE_TITLE };
  }

  /**
   * Deletes task and returns where to redirect, or null if the task does not exist.
   */
  public async delete(id: string): Promise<RedirectResult | null> {
    if (!isValidId(id)) {
      return null;
    }
    const deleted = await this.api.deleteTask(id);
    return deleted ? { redirectUrl: '/tasks/deleted' } : null;
  }
}

function validateCreateForm(form: AddTaskForm): Record<string, string[]> | undefined {
  const errors: Record<string, string[]> = {};

  const titleErrors = getTitleValidationErrors(form.title);
  if (titleErrors.length > 0) {
    errors.title = titleErrors;
  }

  const descriptionErrors = getDescriptionValidationErrors(form.description);
  if (descriptionErrors.length > 0) {
    errors.description = descriptionErrors;
  }

  const statusErrors = getStatusValidationErrors(form.status);
  if (statusErrors.length > 0) {
    errors.status = statusErrors;
  }

  Object.assign(
    errors,
    getDueDateValidationErrors({
      day: form.dueDay,
      month: form.dueMonth,
      year: form.dueYear,
      time: form.dueTime,
    })
  );

  return Object.keys(errors).length > 0 ? errors : undefined;
}

function isValidId(id: string): boolean {
  return z.uuid().safeParse(id).success;
}

function trimAll(form: AddTaskForm): AddTaskForm {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
  ) as AddTaskForm;
}

function toListItem(task: Task): TaskListItem {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: STATUS_LABELS[task.status],
    statusValue: task.status,
    dueDate: formatDueDate(task.dueDate),
  };
}

function formatDueDate(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const hours = date.getHours() % 12 || 12;
  const minutes = date.getMinutes();
  const suffix = date.getHours() < 12 ? 'am' : 'pm';
  const time = minutes === 0 ? `${hours}${suffix}` : `${hours}:${String(minutes).padStart(2, '0')}${suffix}`;
  return `${day} at ${time}`;
}
