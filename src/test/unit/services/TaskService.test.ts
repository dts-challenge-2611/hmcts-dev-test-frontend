import { TaskApi } from '../../../main/api/taskApi';
import { Task } from '../../../main/schemas/task';
import { TaskService } from '../../../main/services/taskService';
import {
  TASK_DUE_DATE_REQUIRED,
  TASK_STATUS_REQUIRED,
  TASK_TITLE_REQUIRED,
} from '../../../main/utils/constants/messageConstants';

const id = '11111111-1111-4111-8111-111111111111';

const task: Task = {
  id,
  title: 'Review bundle',
  description: null,
  status: 'TODO',
  dueDate: '2099-03-01T10:00:00',
  createdAt: '2026-11-04T10:00:00Z',
};

const validForm = {
  title: 'Review bundle',
  description: '',
  status: 'TODO',
  dueDay: '1',
  dueMonth: '3',
  dueYear: '2099',
  dueTime: '10:00',
};

describe('TaskService', () => {
  let api: {
    getAllTasks: jest.Mock;
    getTaskById: jest.Mock;
    createTask: jest.Mock;
    updateTaskStatus: jest.Mock;
    deleteTask: jest.Mock;
  };
  let service: TaskService;

  beforeEach(() => {
    api = {
      getAllTasks: jest.fn(),
      getTaskById: jest.fn(),
      createTask: jest.fn(),
      updateTaskStatus: jest.fn(),
      deleteTask: jest.fn(),
    };
    service = new TaskService(api as unknown as TaskApi);
  });

  describe('getAllTasks', () => {
    it('maps tasks to list items with status tag and GOV.UK formatted date', async () => {
      api.getAllTasks.mockResolvedValue([{ ...task, status: 'IN_PROGRESS' }]);

      expect(await service.getAll()).toEqual([
        {
          id,
          title: 'Review bundle',
          description: null,
          status: { text: 'In progress', classes: 'govuk-tag--blue' },
          statusValue: 'IN_PROGRESS',
          dueDate: '1 March 2099 at 10am',
        },
      ]);
    });

    it('shows minutes only when they are not zero', async () => {
      api.getAllTasks.mockResolvedValue([{ ...task, dueDate: '2099-03-01T14:30:00' }]);

      const [item] = await service.getAll();

      expect(item.dueDate).toBe('1 March 2099 at 2:30pm');
    });
  });

  describe('getById', () => {
    it('returns null for malformed id without calling the API', async () => {
      expect(await service.getById('not-a-uuid')).toBeNull();
      expect(api.getTaskById).not.toHaveBeenCalled();
    });

    it('returns null when the task does not exist', async () => {
      api.getTaskById.mockResolvedValue(null);

      expect(await service.getById(id)).toBeNull();
    });

    it('returns the mapped task when it exists', async () => {
      api.getTaskById.mockResolvedValue(task);

      expect(await service.getById(id)).toMatchObject({ id, title: 'Review bundle' });
    });
  });

  describe('create', () => {
    it('builds an empty page with "To do" selected', () => {
      expect(service.getCreateViewModel()).toMatchObject({ status: 'TODO', pageTitle: 'Create a task' });
    });

    it('returns errors and does not call API when form is invalid', async () => {
      const result = await service.create({ ...validForm, title: '   ' });

      expect(result).toMatchObject({
        pageTitle: 'Error: Create a task',
        errors: { title: [TASK_TITLE_REQUIRED] },
      });
      expect(api.createTask).not.toHaveBeenCalled();
    });

    it('links due date error in summary to day box', async () => {
      const result = await service.create({ ...validForm, dueDay: '' });

      expect(result).toMatchObject({
        errorSummary: [{ text: TASK_DUE_DATE_REQUIRED, href: '#dueDay' }],
      });
    });

    it('keeps the submitted values when showing errors', async () => {
      const result = await service.create({ ...validForm, title: '' });

      expect(result).toMatchObject({ dueDay: '1', dueMonth: '3', dueYear: '2099', dueTime: '10:00' });
    });

    it('trims input, sends due date as ISO and returns redirect', async () => {
      api.createTask.mockResolvedValue(task);

      const result = await service.create({ ...validForm, title: '  Review bundle  ' });

      expect(api.createTask).toHaveBeenCalledWith({
        title: 'Review bundle',
        description: null,
        status: 'TODO',
        dueDate: '2099-03-01T10:00:00',
      });
      expect(result).toEqual({ redirectUrl: `/tasks/${id}/created` });
    });
  });

  describe('edit status', () => {
    beforeEach(() => {
      api.getTaskById.mockResolvedValue(task);
    });

    it('pre-selects the current status', async () => {
      expect(await service.getEditStatusViewModel(id)).toMatchObject({ status: 'TODO', task: { id } });
    });

    it('returns null when task does not exist', async () => {
      api.getTaskById.mockResolvedValue(null);

      expect(await service.getEditStatusViewModel(id)).toBeNull();
      expect(await service.updateStatus(id, { status: 'DONE' })).toBeNull();
    });

    it('returns error and does not update when status is invalid', async () => {
      const result = await service.updateStatus(id, { status: 'FINISHED' });

      expect(result).toMatchObject({ errors: { status: [TASK_STATUS_REQUIRED] } });
      expect(api.updateTaskStatus).not.toHaveBeenCalled();
    });

    it('updates status and returns redirect', async () => {
      api.updateTaskStatus.mockResolvedValue({ ...task, status: 'DONE' });

      const result = await service.updateStatus(id, { status: 'DONE' });

      expect(api.updateTaskStatus).toHaveBeenCalledWith(id, 'DONE');
      expect(result).toEqual({ redirectUrl: `/tasks/${id}/status-updated` });
    });
  });

  describe('deleteTask', () => {
    it('builds confirmation page for existing task', async () => {
      api.getTaskById.mockResolvedValue(task);

      expect(await service.getDeleteViewModel(id)).toMatchObject({ task: { id } });
    });

    it('returns null for a malformed id without calling API', async () => {
      expect(await service.delete('not-a-uuid')).toBeNull();
      expect(api.deleteTask).not.toHaveBeenCalled();
    });

    it('returns null when task was already deleted', async () => {
      api.deleteTask.mockResolvedValue(false);

      expect(await service.delete(id)).toBeNull();
    });

    it('deletes task and returns redirect', async () => {
      api.deleteTask.mockResolvedValue(true);

      expect(await service.delete(id)).toEqual({ redirectUrl: '/tasks/deleted' });
      expect(api.deleteTask).toHaveBeenCalledWith(id);
    });
  });
});
