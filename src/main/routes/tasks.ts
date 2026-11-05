import { TaskApi } from '../api/taskApi';
import { TaskController } from '../controllers/taskController';
import { TaskService } from '../services/taskService';

import { Application } from 'express';

export default function (app: Application): void {
  const controller = new TaskController(new TaskService(new TaskApi()));

  app.get('/', controller.listAllTasks.bind(controller));
  app.get('/tasks/new', controller.showCreate.bind(controller));
  app.post('/tasks', controller.createTask.bind(controller));
  app.get('/tasks/deleted', controller.showTaskDeleted.bind(controller));
  app.get('/tasks/:id/created', controller.showTaskCreated.bind(controller));
  app.get('/tasks/:id/edit', controller.showEditTaskStatus.bind(controller));
  app.post('/tasks/:id/edit', controller.updateTaskStatus.bind(controller));
  app.get('/tasks/:id/status-updated', controller.showTaskStatusUpdated.bind(controller));
  app.get('/tasks/:id/delete', controller.showTaskDelete.bind(controller));
  app.post('/tasks/:id/delete', controller.deleteTask.bind(controller));
}
