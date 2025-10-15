import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, AlertCircle, Sparkles } from "lucide-react";

export default function AutoScheduleDialog({ open, onClose, dayPlan, tasks, currentDate }) {
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  const autoScheduleMutation = useMutation({
    mutationFn: async () => {
      const windows = dayPlan.brackets.filter(b => b.type === 'window');
      const sortedTasks = [...tasks].sort((a, b) => {
        const priorityOrder = { P1: 0, P2: 1, P3: 2, P4: 3 };
        return priorityOrder[a.priority || 'P3'] - priorityOrder[b.priority || 'P3'];
      });

      const scheduled = [];
      const overflow = [];
      
      const remaining = {};
      windows.forEach(w => {
        const [startH, startM] = w.start_time.split(':').map(Number);
        const [endH, endM] = w.end_time.split(':').map(Number);
        const duration = (endH * 60 + endM) - (startH * 60 + startM);
        const targetCapacity = Math.floor(duration * 0.92);
        remaining[w.name] = { duration, targetCapacity, startH, startM, used: 0 };
      });

      for (const task of sortedTasks) {
        let placed = false;
        
        for (const window of windows) {
          const rem = remaining[window.name];
          
          const canFitInTarget = rem.used + task.duration_min <= rem.targetCapacity;
          const canFitWithBuffer = rem.used + task.duration_min <= rem.duration * 1.10;
          
          if (canFitInTarget || (canFitWithBuffer && rem.used < rem.duration * 0.92)) {
            const [startH, startM] = window.start_time.split(':').map(Number);
            const startMinutes = startH * 60 + startM + rem.used;
            const startHour = Math.floor(startMinutes / 60);
            const startMin = startMinutes % 60;
            const endMinutes = startMinutes + task.duration_min;
            const endHour = Math.floor(endMinutes / 60);
            const endMin = endMinutes % 60;

            scheduled.push({
              task_id: task.id,
              task_title: task.title,
              day_plan_id: dayPlan.id,
              day_date: currentDate,
              window_name: window.name,
              start_time: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
              end_time: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
              duration_min: task.duration_min,
              status: "planned",
              project_name: task.project_name,
              color: task.color,
              priority: task.priority
            });

            rem.used += task.duration_min;
            placed = true;
            break;
          }
        }

        if (!placed) {
          overflow.push(task);
        }
      }

      for (const item of scheduled) {
        await base44.entities.ScheduleItem.create(item);
      }

      return { scheduled: scheduled.length, overflow: overflow.length };
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['scheduleItems'] });
      queryClient.invalidateQueries({ queryKey: ['unscheduledTasks'] });
    },
  });

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Автоматическое планирование
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {!result ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Система автоматически распределит задачи по доступным окнам (92-95% заполнения), 
                  учитывая приоритеты и длительность.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Задач к планированию: <Badge variant="outline">{tasks.length}</Badge>
                </p>
                <p className="text-sm text-gray-600">
                  Доступно окон: <Badge variant="outline">
                    {dayPlan.brackets.filter(b => b.type === 'window').length}
                  </Badge>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <Sparkles className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Планирование завершено!
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Запланировано:</span>
                  <Badge className="bg-green-100 text-green-700">{result.scheduled}</Badge>
                </div>
                {result.overflow > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Не поместилось:</span>
                    <Badge variant="destructive">{result.overflow}</Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Отмена
              </Button>
              <Button
                onClick={() => autoScheduleMutation.mutate()}
                disabled={autoScheduleMutation.isPending}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Запланировать
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Готово
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
