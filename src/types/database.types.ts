
export type UserRole = 'manager' | 'performer';

export type TaskStatus =
  | 'new'
  | 'in_progress'
  | 'review'
  | 'accepted'
  | 'rework';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface ConstructionObject {
  id: string;
  name: string;
  address: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  object_id: string;
  assignee_id: string;
  author_id: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface TaskStatusHistory {
  id: string;
  task_id: string;
  from_status: TaskStatus | null;
  to_status: TaskStatus;
  changed_by: string;
  comment: string | null;
  created_at: string;
}

export interface CreateObjectDto {
  name: string;
  address: string;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  object_id: string;
  assignee_id: string;
}

export interface TransitionTaskDto {
  task_id: string;
  status: TaskStatus;
  comment?: string;
}
