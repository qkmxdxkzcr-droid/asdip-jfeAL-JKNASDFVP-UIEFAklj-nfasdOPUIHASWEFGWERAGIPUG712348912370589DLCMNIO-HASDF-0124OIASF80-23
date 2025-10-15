import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderKanban, Clock, ArrowUpCircle, Eye, CheckCircle2, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ProjectDialog from "../components/projects/ProjectDialog";

const COLOR_PALETTE = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", 
  "#EC4899", "#14B8A6", "#F97316", "#06B6D4", "#6366F1",
  "#84CC16", "#A855F7"
];

export default function ProjectsAndTasks() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list("-created_date"),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: scheduleItems = [] } = useQuery({
    queryKey: ['allScheduleItems'],
    queryFn: () => base44.entities.ScheduleItem.list(),
  });

  const unscheduledTasks = tasks.filter(task => {
    const scheduledTaskIds = new Set(scheduleItems.map(s => s.task_id));
    return !scheduledTaskIds.has(task.id) && task.status === 'todo';
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }) => {
      await base44.entities.Task.update(taskId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
    },
  });

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowDialog(true);
  };

  const handleClose = () => {
    setEditingProject(null);
    setShowDialog(false);
  };

  const getProjectStats = (projectId) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const completed = projectTasks.filter(t => t.status === 'done').length;
    return { total: projectTasks.length, completed };
  };

  const toggleTaskStatus = (task) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: { status: task.status === 'done' ? 'todo' : 'done' }
    });
  };

  const priorityColors = {
    P1: "bg-red-100 text-red-700",
    P2: "bg-orange-100 text-orange-700",
    P3: "bg-blue-100 text-blue-700",
    P4: "bg-gray-100 text-gray-700"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Проекты и планы</h1>
            <p className="text-gray-500 mt-1">Управление проектами и незапланированными задачами</p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Создать проект
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-6">
              {projects.map((project) => {
                const stats = getProjectStats(project.id);
                return (
                  <Card
                    key={project.id}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 border-t-4"
                    style={{ borderTopColor: project.color }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: `${project.color}20` }}
                          >
                            <FolderKanban
                              className="w-6 h-6"
                              style={{ color: project.color }}
                            />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{project.name}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {project.priority_default}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Длительность:</span>
                        </div>
                        <Badge variant="secondary">
                          {project.default_duration_min} мин
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Перенос:</span>
                        <Badge variant="outline">
                          {project.carry_over === 'next_day' ? 'На след. день' : 
                           project.carry_over === 'next_window_same_day' ? 'В след. окно' : 'Отключён'}
                        </Badge>
                      </div>

                      {project.split_policy === 'allow_split' && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <ArrowUpCircle className="w-4 h-4" />
                          <span>Можно разбивать: {project.min_chunk}–{project.max_chunks} частей</span>
                        </div>
                      )}

                      <div className="pt-3 border-t">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Задачи:</span>
                          <span className="font-medium">{stats.completed} / {stats.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                              backgroundColor: project.color
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link to={createPageUrl(`ProjectDetail?id=${project.id}`)} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            Задачи
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => handleEdit(project)}
                        >
                          Настройки
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {projects.length === 0 && !isLoading && (
                <div className="col-span-2 flex flex-col items-center justify-center py-20">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                    <FolderKanban className="w-12 h-12 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Нет проектов</h3>
                  <p className="text-gray-500 mb-6">Создайте первый проект для организации задач</p>
                  <Button
                    onClick={() => setShowDialog(true)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Создать проект
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Незапланированные</CardTitle>
                  <Badge variant="outline">{unscheduledTasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {unscheduledTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Все задачи запланированы</p>
                  </div>
                ) : (
                  unscheduledTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                      style={{ backgroundColor: task.color ? `${task.color}10` : undefined }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <button
                            onClick={() => toggleTaskStatus(task)}
                            className="mt-0.5"
                          >
                            {task.status === 'done' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          <div className="flex-1">
                            <p className={`font-medium text-sm text-gray-900 ${task.status === 'done' ? 'line-through' : ''}`}>
                              {task.title}
                            </p>
                            {task.project_name && (
                              <p className="text-xs text-gray-500 mt-1">{task.project_name}</p>
                            )}
                          </div>
                        </div>
                        {task.priority && (
                          <Badge className={priorityColors[task.priority]} variant="secondary">
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                      {task.duration_min && (
                        <p className="text-xs text-gray-500 mt-2">{task.duration_min} мин</p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <ProjectDialog
          open={showDialog}
          onClose={handleClose}
          project={editingProject}
          colorPalette={COLOR_PALETTE}
        />
      </div>
    </div>
  );
}
