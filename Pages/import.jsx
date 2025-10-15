import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";

export default function Import() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const parseTasks = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const tasks = [];
    let currentProject = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Проверка на заголовок проекта: "Проект: Название #P2 @30m"
      const projectMatch = trimmedLine.match(/^Проект:\s*(.+?)(?:\s+#(P[1-4]))?(?:\s+@(\d+)m)?$/i);
      if (projectMatch) {
        const [, name, priority, duration] = projectMatch;
        currentProject = {
          name: name.trim(),
          priority: priority || "P3",
          duration: duration ? parseInt(duration) : 30
        };
        continue;
      }

      // Проверка на задачу
      const taskMatch = trimmedLine.match(/^(.+?)(?:\s+@(\d+)(?:m|ч|мин))?(?:\s+#(P[1-4]))?$/i);
      if (taskMatch) {
        const [, title, duration, priority] = taskMatch;
        const project = projects.find(p => 
          currentProject && p.name.toLowerCase() === currentProject.name.toLowerCase()
        );

        tasks.push({
          title: title.trim(),
          project_id: project?.id || null,
          project_name: project?.name || currentProject?.name || null,
          duration_min: duration ? parseInt(duration) : 
                       project?.default_duration_min || currentProject?.duration || 30,
          priority: priority || project?.priority_default || currentProject?.priority || "P3",
          color: project?.color || "#4F46E5",
          status: "todo"
        });
      }
    }

    return tasks;
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const tasks = parseTasks(text);
      if (tasks.length === 0) {
        throw new Error("Не удалось распознать задачи");
      }

      await base44.entities.Task.bulkCreate(tasks);
      return { count: tasks.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unscheduledTasks'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      setResult({ success: true, count: data.count });
      setText("");
    },
    onError: (error) => {
      setResult({ success: false, error: error.message });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Импорт задач</h1>
          <p className="text-gray-500 mt-1">Быстрое добавление задач списком</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Формат импорта</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <p><strong>Проект:</strong> <code>Проект: Название #P2 @30m</code></p>
                    <p><strong>Задача:</strong> <code>Название задачи @60m #P1</code></p>
                    <p className="text-xs text-gray-500">
                      @30m / @2ч — длительность | #P1–P4 — приоритет
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm space-y-1">
                <div>Проект: Немецкий #P2 @30m</div>
                <div className="text-gray-600">Слова немецкий</div>
                <div className="text-gray-600">Грамматика @45m</div>
                <div className="mt-2">Проект: Математика #P1 @60m</div>
                <div className="text-gray-600">Решить задачи</div>
                <div className="mt-2 text-gray-600">Вебинар по программированию @2ч #P3</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Вставьте список задач</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Проект: Название #P2 @30m
Задача 1
Задача 2 @45m
..."
                className="min-h-[300px] font-mono"
              />

              <Button
                onClick={() => importMutation.mutate()}
                disabled={!text || importMutation.isPending}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Upload className="w-5 h-5 mr-2" />
                Импортировать задачи
              </Button>

              {result && (
                <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                  {result.success ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Успешно импортировано задач: <Badge>{result.count}</Badge>
                      </AlertDescription>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {result.error}
                      </AlertDescription>
                    </>
                  )}
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
