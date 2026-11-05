import { Task, taskListSchema, taskSchema } from '../schemas/task';

import axios, { AxiosInstance } from 'axios';

export interface CreateTaskRequest {
  title: string;
  description: string | null;
  status: string;
  dueDate: string;
}

export class TaskApi {
  private readonly client: AxiosInstance;

  constructor(baseUrl: string = process.env.TASK_API_URL ?? 'http://localhost:4000') {
    this.client = axios.create({ baseURL: baseUrl, timeout: 5000 });
  }

  public async getAllTasks(): Promise<Task[]> {
    const response = await this.client.get('/tasks');
    return taskListSchema.parse(response.data);
  }

  public async getTaskById(id: string): Promise<Task | null> {
    try {
      const response = await this.client.get(`/tasks/${id}`);
      return taskSchema.parse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  public async createTask(request: CreateTaskRequest): Promise<Task> {
    const response = await this.client.post('/tasks', request);
    return taskSchema.parse(response.data);
  }

  public async updateTaskStatus(id: string, status: string): Promise<Task | null> {
    try {
      const response = await this.client.patch(`/tasks/${id}/status`, { status });
      return taskSchema.parse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  public async deleteTask(id: string): Promise<boolean> {
    try {
      await this.client.delete(`/tasks/${id}`);
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }
}
