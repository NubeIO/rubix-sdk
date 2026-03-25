/**
 * Task API - CRUD operations for core.task nodes
 */

import type { CreateTaskInput, UpdateTaskInput } from '../types/task.types';

interface TaskAPIConfig {
  orgId: string;
  deviceId: string;
  baseUrl: string;
  token?: string;
}

export class TaskAPI {
  private orgId: string;
  private deviceId: string;
  private baseUrl: string;
  private token?: string;

  constructor(config: TaskAPIConfig) {
    this.orgId = config.orgId;
    this.deviceId = config.deviceId;
    this.baseUrl = config.baseUrl;
    this.token = config.token;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private buildUrl(path: string) {
    return `${this.baseUrl}${path}`;
  }

  async createTask(input: CreateTaskInput) {
    const url = this.buildUrl(`/${this.orgId}/${this.deviceId}/nodes`);
    const payload = {
      name: input.name,
      type: 'core.task',
      parentId: input.parentId,
      settings: input.settings || {},
    };

    console.log('[TaskAPI] Creating task:', payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create task: ${error}`);
    }

    return response.json();
  }

  async updateTask(taskId: string, input: UpdateTaskInput) {
    const url = this.buildUrl(`/${this.orgId}/${this.deviceId}/nodes/${taskId}`);
    const payload: Record<string, unknown> = {};

    if (input.name !== undefined) {
      payload.name = input.name;
    }
    if (input.settings !== undefined) {
      payload.settings = input.settings;
    }

    console.log('[TaskAPI] Updating task:', taskId, payload);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update task: ${error}`);
    }

    return response.json();
  }

  async deleteTask(taskId: string) {
    const url = this.buildUrl(`/${this.orgId}/${this.deviceId}/nodes/${taskId}`);

    console.log('[TaskAPI] Deleting task:', taskId);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete task: ${error}`);
    }
  }
}
