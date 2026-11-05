import { TaskApi } from '../../main/api/taskApi';
import { app } from '../../main/app';
import { Task } from '../../main/schemas/task';

import request from 'supertest';

jest.mock('../../main/api/taskApi');

const api = jest.mocked(TaskApi.prototype);

const id = '11111111-1111-4111-8111-111111111111';

const task: Task = {
  id,
  title: 'Review bundle',
  description: 'Check exhibits',
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

describe('Task routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /', () => {
    it('lists tasks', async () => {
      api.getAllTasks.mockResolvedValue([task]);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.text).toContain('Review bundle');
      expect(res.text).toContain('1 March 2099 at 10am');
    });

    it('shows message when there are no tasks', async () => {
      api.getAllTasks.mockResolvedValue([]);

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.text).toContain('You have no tasks');
    });

    it('shows error page when backend fails', async () => {
      api.getAllTasks.mockRejectedValue(new Error('backend down'));

      const res = await request(app).get('/');

      expect(res.status).toBe(500);
    });
  });

  describe('create', () => {
    it('GET /tasks/new shows the form', async () => {
      const res = await request(app).get('/tasks/new');

      expect(res.status).toBe(200);
      expect(res.text).toContain('Create a task');
    });

    it('POST /tasks with invalid form shows errors and does not call backend', async () => {
      const res = await request(app)
        .post('/tasks')
        .type('form')
        .send({ ...validForm, title: '' });

      expect(res.status).toBe(400);
      expect(res.text).toContain('There is a problem');
      expect(res.text).toContain('Enter a title');
      expect(api.createTask).not.toHaveBeenCalled();
    });

    it('POST /tasks with valid form creates task and redirects', async () => {
      api.createTask.mockResolvedValue(task);

      const res = await request(app).post('/tasks').type('form').send(validForm);

      expect(res.status).toBe(303);
      expect(res.headers.location).toBe(`/tasks/${id}/created`);
    });

    it('GET /tasks/:id/created shows confirmation', async () => {
      api.getTaskById.mockResolvedValue(task);

      const res = await request(app).get(`/tasks/${id}/created`);

      expect(res.status).toBe(200);
      expect(res.text).toContain('Task created');
    });
  });

  describe('edit status', () => {
    it('GET /tasks/:id/edit shows task', async () => {
      api.getTaskById.mockResolvedValue(task);

      const res = await request(app).get(`/tasks/${id}/edit`);

      expect(res.status).toBe(200);
      expect(res.text).toContain('Update task status');
      expect(res.text).toContain('Check exhibits');
    });

    it('GET /tasks/:id/edit returns 404 for malformed id', async () => {
      const res = await request(app).get('/tasks/not-a-uuid/edit');

      expect(res.status).toBe(404);
      expect(api.getTaskById).not.toHaveBeenCalled();
    });

    it('GET /tasks/:id/edit returns 404 when task does not exist', async () => {
      api.getTaskById.mockResolvedValue(null);

      const res = await request(app).get(`/tasks/${id}/edit`);

      expect(res.status).toBe(404);
    });

    it('POST /tasks/:id/edit updates status and redirects', async () => {
      api.getTaskById.mockResolvedValue(task);
      api.updateTaskStatus.mockResolvedValue({ ...task, status: 'DONE' });

      const res = await request(app).post(`/tasks/${id}/edit`).type('form').send({ status: 'DONE' });

      expect(res.status).toBe(303);
      expect(res.headers.location).toBe(`/tasks/${id}/status-updated`);
      expect(api.updateTaskStatus).toHaveBeenCalledWith(id, 'DONE');
    });
  });

  describe('delete', () => {
    it('GET /tasks/:id/delete asks for confirmation', async () => {
      api.getTaskById.mockResolvedValue(task);

      const res = await request(app).get(`/tasks/${id}/delete`);

      expect(res.status).toBe(200);
      expect(res.text).toContain('Are you sure you want to delete this task?');
    });

    it('POST /tasks/:id/delete deletes task and redirects', async () => {
      api.deleteTask.mockResolvedValue(true);

      const res = await request(app).post(`/tasks/${id}/delete`);

      expect(res.status).toBe(303);
      expect(res.headers.location).toBe('/tasks/deleted');
      expect(api.deleteTask).toHaveBeenCalledWith(id);
    });

    it('GET /tasks/deleted shows confirmation', async () => {
      const res = await request(app).get('/tasks/deleted');

      expect(res.status).toBe(200);
      expect(res.text).toContain('Task deleted');
    });
  });
});
