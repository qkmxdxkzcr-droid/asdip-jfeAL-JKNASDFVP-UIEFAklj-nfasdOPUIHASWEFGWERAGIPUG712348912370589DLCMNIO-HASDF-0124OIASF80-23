import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, CheckCircle2, Clock, TrendingUp } from "lucide-react";

export default function Statistics() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: scheduleItems = [] } = useQuery({
    queryKey: ['allScheduleItems'],
    queryFn: () => base44.entities.ScheduleItem.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const completedTasks = tasks.filter(t => t.status === 'done');
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length * 100).toFixed(1) : 0;
  const totalPlannedTime = scheduleItems.reduce((sum, s) => sum + (s.duration_min || 0), 0);
  const completedTime = scheduleItems.filter(s => s.status === 'done').reduce((sum, s) => sum + (s.duration_min || 0), 0);

  const projectStats = projects.map(project => {
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const completed = projectTasks.filter(t => t.status === 'done').length;
    return {
      ...project,
      total: projectTasks.length,
      completed,
      rate: projectTasks.length > 0 ? (completed / projectTasks.length * 100).toFixed(1) : 0
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Статистика</h1>
          <p className="text-gray-500 mt-1">Анализ продуктивности и выполнения задач</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Всего задач</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{tasks.length}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {completedTasks.length} завершено
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Выполнение</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{completionRate}%</p>
                  <p className="text-sm text-gray-500 mt-1">Процент завершения</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Запланировано</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{Math.floor(totalPlannedTime / 60)}ч</p>
                  <p className="text-sm text-gray-500 mt-1">{totalPlannedTime % 60} минут</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Выполнено</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{Math.floor(completedTime / 60)}ч</p>
                  <p className="text-sm text-gray-500 mt-1">{completedTime % 60} минут</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Статистика по проектам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectStats.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {project.completed} / {project.total}
                      </span>
                      <Badge variant="outline">{project.rate}%</Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${project.rate}%`,
                        backgroundColor: project.color
                      }}
                    />
                  </div>
                </div>
              ))}

              {projectStats.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Нет данных по проектам</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
