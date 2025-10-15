import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Pencil, Trash2, CheckCircle2, Circle, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProjectDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: "", duration_min: "", priority: "" });
  const [showNewTask, setShowNewTask] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return await base44.entities.Project.get(projectId);
    },
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['projectTasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return await base44.entities.Task.filter({ project_id: projectId }, "-created_date");
    },
    enabled: !!projectId,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      await base44.entities.Task.create({
        ...taskData,
        project_id: projectId,
        project_name: project.name,
        color: project.color,
        status: "todo"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      setNewTask({ title: "", duration_min: "", priority: "" });
      setShowNewTask(false);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }) => {
      await base44.entities.Task.update(taskId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      await base44.entities.Task.delete(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
    },
  });

  const toggleTaskStatus = (task) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: { status: task.status === 'done' ? 'todo' : 'done' }
    });
  };

  const statusIcons = {
    todo: <Circle className="w-5 h-5 text-gray-400" />,
    done: <CheckCircle2 className="w-5 h-5 text-green-500" />
  };

  const priorityColors = {
    P1: "bg-red-100 text-red-700",
    P2: "bg-orange-100 text-orange-700",
    P3: "bg-blue-100 text-blue-700",
    P4: "bg-gray-100 text-gray-700"
  };

  if (!project) {
    return <div className="p-8">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Projects"))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${project.color}20` }}
            >
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: project.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-500">Задачи проекта</p>
            </div>
          </div>
          <Button
            onClick={() => setShowNewTask(!showNewTask)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Добавить задачу
          </Button>
        </div>

        {showNewTask && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Новая задача</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Название задачи"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="md:col-span-2"
                />
                <Input
                  type="number"
                  placeholder={`Длительность (по умолч. ${project.default_duration_min})`}
                  value={newTask.duration_min}
                  onChange={(e) => setNewTask({ ...newTask, duration_min: e.target.value })}
                />
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Приоритет (по умолч. ${project.priority_default})`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P1">P1 (Высокий)</SelectItem>
                    <SelectItem value="P2">P2 (Средний)</SelectItem>
                    <SelectItem value="P3">P3 (Обычный)</SelectItem>
                    <SelectItem value="P4">P4 (Низкий)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2 md:col-span-2">
                  <Button
                    onClick={() => createTaskMutation.mutate({
                      title: newTask.title,
                      duration_min: parseInt(newTask.duration_min) || project.default_duration_min,
                      priority: newTask.priority || project.priority_default
                    })}
                    disabled={!newTask.title}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Создать
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewTask(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {editingTask?.id === task.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      className="md:col-span-2"
                    />
                    <Input
                      type="number"
                      value={editingTask.duration_min}
                      onChange={(e) => setEditingTask({ ...editingTask, duration_min: e.target.value })}
                    />
                    <Select
                      value={editingTask.priority}
                      onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P1">P1</SelectItem>
                        <SelectItem value="P2">P2</SelectItem>
                        <SelectItem value="P3">P3</SelectItem>
                        <SelectItem value="P4">P4</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 md:col-span-2">
                      <Button
                        size="sm"
                        onClick={() => updateTaskMutation.mutate({
                          taskId: editingTask.id,
                          updates: {
                            title: editingTask.title,
                            duration_min: parseInt(editingTask.duration_min),
                            priority: editingTask.priority
                          }
                        })}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Сохранить
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingTask(null)}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleTaskStatus(task)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        {statusIcons[task.status]}
                      </button>
                      <div className="flex-1">
                        <p className={`font-medium ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {task.duration_min} мин
                          </Badge>
                          <Badge className={priorityColors[task.priority]} variant="secondary">
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingTask(task)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Удалить задачу?')) {
                            deleteTaskMutation.mutate(task.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">Нет задач в этом проекте</p>
              <p className="text-sm mt-2">Добавьте первую задачу</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
