import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";

export default function QuickAddTaskDialog({ open, onClose }) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [duration, setDuration] = useState("");
  const [priority, setPriority] = useState("P3");
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const project = projects.find(p => p.id === projectId);
      const finalDuration = duration || project?.default_duration_min || 30;
      
      return await base44.entities.Task.create({
        title,
        project_id: projectId || null,
        project_name: project?.name || null,
        duration_min: parseInt(finalDuration),
        priority: priority || project?.priority_default || "P3",
        color: project?.color || "#4F46E5",
        status: "todo"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unscheduledTasks'] });
      setTitle("");
      setProjectId("");
      setDuration("");
      setPriority("P3");
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить задачу</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название задачи</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Что нужно сделать?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Проект (необязательно)</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите проект" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Длительность (мин)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1">P1 (Высокий)</SelectItem>
                  <SelectItem value="P2">P2 (Средний)</SelectItem>
                  <SelectItem value="P3">P3 (Обычный)</SelectItem>
                  <SelectItem value="P4">P4 (Низкий)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={() => createTaskMutation.mutate()}
            disabled={!title || createTaskMutation.isPending}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
