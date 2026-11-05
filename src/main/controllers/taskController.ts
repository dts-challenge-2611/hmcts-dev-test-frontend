import { TaskService } from '../services/taskService';

import { NextFunction, Request, Response } from 'express';

export class TaskController {
  public constructor(private readonly taskService: TaskService) {}

  public async listAllTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tasks = await this.taskService.getAll();
      res.render('tasks/list', { tasks });
    } catch (error) {
      next(error);
    }
  }

  public showCreate(req: Request, res: Response): void {
    res.render('tasks/create-task', this.taskService.getCreateViewModel());
  }

  public async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.taskService.create(req.body);
      if ('redirectUrl' in result) {
        res.redirect(303, result.redirectUrl);
        return;
      }
      res.status(400).render('tasks/create-task', result);
    } catch (error) {
      next(error);
    }
  }

  public async showTaskCreated(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await this.taskService.getById(req.params.id);
      if (!task) {
        next();
        return;
      }
      res.render('tasks/task-created', { task });
    } catch (error) {
      next(error);
    }
  }

  public async showEditTaskStatus(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const model = await this.taskService.getEditStatusViewModel(req.params.id);
      if (!model) {
        next();
        return;
      }
      res.render('tasks/edit-task-status', model);
    } catch (error) {
      next(error);
    }
  }

  public async updateTaskStatus(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.taskService.updateStatus(req.params.id, req.body);
      if (!result) {
        next();
        return;
      }
      if ('redirectUrl' in result) {
        res.redirect(303, result.redirectUrl);
        return;
      }
      res.status(400).render('tasks/edit-task-status', result);
    } catch (error) {
      next(error);
    }
  }

  public async showTaskStatusUpdated(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await this.taskService.getById(req.params.id);
      if (!task) {
        next();
        return;
      }
      res.render('tasks/task-status-updated', { task });
    } catch (error) {
      next(error);
    }
  }

  public async showTaskDelete(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const model = await this.taskService.getDeleteViewModel(req.params.id);
      if (!model) {
        next();
        return;
      }
      res.render('tasks/delete-task', model);
    } catch (error) {
      next(error);
    }
  }

  public async deleteTask(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.taskService.delete(req.params.id);
      if (!result) {
        next();
        return;
      }
      res.redirect(303, result.redirectUrl);
    } catch (error) {
      next(error);
    }
  }

  public showTaskDeleted(req: Request, res: Response): void {
    res.render('tasks/task-deleted');
  }
}
