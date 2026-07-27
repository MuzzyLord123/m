import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TaskStatus = 'todo' | 'in_progress' | 'paused' | 'in_review' | 'completed' | 'cancelled';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface PlannerTask {
  id: string;
  user_id: string;
  team_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  tags: string[];
  progress: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  parent_task_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  due_date?: string | null;
  start_date?: string | null;
  assigned_to?: string | null;
  tags?: string[];
  estimated_hours?: number | null;
  parent_task_id?: string | null;
}

export function usePlannerTasks() {
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('planner_tasks')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []) as PlannerTask[]);
    } catch (err: any) {
      console.error('Error fetching planner tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = async (input: CreateTaskInput) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('planner_tasks')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description || '',
          status: input.status || 'todo',
          priority: input.priority || 'medium',
          category: input.category || 'general',
          due_date: input.due_date || null,
          start_date: input.start_date || null,
          assigned_to: input.assigned_to || null,
          tags: input.tags || [],
          estimated_hours: input.estimated_hours || null,
          parent_task_id: input.parent_task_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => [data as PlannerTask, ...prev]);
      toast.success('Task created');
      return data;
    } catch (err: any) {
      toast.error('Failed to create task');
      console.error(err);
    }
  };

  const updateTask = async (id: string, updates: Partial<PlannerTask>) => {
    try {
      // Auto-set completed_at when marking complete
      if (updates.status === 'completed' && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
        updates.progress = 100;
      }
      if (updates.status && updates.status !== 'completed') {
        updates.completed_at = null;
      }

      const { error } = await supabase
        .from('planner_tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } as PlannerTask : t));
      toast.success('Task updated');
    } catch (err: any) {
      toast.error('Failed to update task');
      console.error(err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('planner_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted');
    } catch (err: any) {
      toast.error('Failed to delete task');
      console.error(err);
    }
  };

  return { tasks, loading, fetchTasks, createTask, updateTask, deleteTask };
}
