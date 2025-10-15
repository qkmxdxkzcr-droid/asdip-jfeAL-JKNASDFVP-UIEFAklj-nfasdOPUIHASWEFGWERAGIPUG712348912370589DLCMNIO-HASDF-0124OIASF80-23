import React, { useState, useCallback, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { format, addDays, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus } from "lucide-react"; // Added this import
import { DragDropContext } from "@hello-pangea/dnd";
import { toast } from "sonner";

import DayHeader from "../components/timeline/DayHeader.jsx";
import TimelineGrid from "../components/timeline/TimelineGrid.jsx";
import CreateDayDialog from "../components/timeline/CreateDayDialog.jsx";
import TaskList from "../components/timeline/TaskList.jsx";
import EditDayTemplateDialog from "../components/timeline/EditDayTemplateDialog.jsx";
import { useDragFreeze } from "../components/hooks/useDragFreeze.jsx"; // Path corrected
import { useProjectedPlaceholder } from "../components/hooks/useProjectedPlaceholder.jsx"; // Path corrected
import { createNestedAutoScroller } from "../components/utils/autoScrollNested.jsx"; // Path corrected

export default function Timeline() {
  const [currentDate, setCurrentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const queryClient = useQueryClient();
  
  const { dragFreeze, freezeStart, freezeEnd, saveFrozenItems, getFrozenItems } = useDragFreeze();
  const { projected, updateProjection, clearProjection } = useProjectedPlaceholder();
  const autoScrollerRef = useRef(null);

  useEffect(() => {
    autoScrollerRef.current = createNestedAutoScroller();
    return () => {
      if (autoScrollerRef.current) {
        autoScrollerRef.current.stop();
      }
    };
  }, []);

  const { data: dayPlan } = useQuery({
    queryKey: ['dayPlan', currentDate],
    queryFn: async () => {
      const plans = await base44.entities.DayPlan.filter({ date: currentDate });
      return plans[0] || null;
    },
  });

  const { data: scheduleItems = [] } = useQuery({
    queryKey: ['scheduleItems', currentDate],
    queryFn: async () => {
      if (!dayPlan) return [];
      return await base44.entities.ScheduleItem.filter({ 
        day_date: currentDate 
      });
    },
    enabled: !!dayPlan,
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => base44.entities.Task.filter({ status: "todo" }, "-priority"),
  });

  // Сохраняем замороженные снимки для каждого окна
  useEffect(() => {
    if (!dragFreeze && dayPlan) {
      dayPlan.brackets.forEach(bracket => {
        const windowItems = scheduleItems.filter(s => s.window_name === bracket.name);
        saveFrozenItems(bracket.name, windowItems);
      });
      saveFrozenItems('unscheduled-tasks', unscheduledTasks);
    }
  }, [scheduleItems, allTasks, dayPlan, dragFreeze, saveFrozenItems]);

  const unscheduledTasks = allTasks.filter(task => {
    const scheduledTaskIds = new Set(scheduleItems.map(s => s.task_id));
    return !scheduledTaskIds.has(task.id);
  });

  const createScheduleItemMutation = useMutation({
    mutationFn: async (newItem) => {
      await base44.entities.ScheduleItem.create(newItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleItems'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
    },
  });

  const updateScheduleItemMutation = useMutation({
    mutationFn: async ({ itemId, updates }) => {
      await base44.entities.ScheduleItem.update(itemId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleItems'] });
    },
  });

  const deleteScheduleItemMutation = useMutation({
    mutationFn: async (itemId) => {
      await base44.entities.ScheduleItem.delete(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleItems'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
    },
  });

  const calculateTimeSlot = (window, usedMinutes, durationMin) => {
    const [startH, startM] = window.start_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM + usedMinutes;
    const endMinutes = startMinutes + durationMin;
    
    const newStartH = Math.floor(startMinutes / 60);
    const newStartM = startMinutes % 60;
    const newEndH = Math.floor(endMinutes / 60);
    const newEndM = endMinutes % 60;
    
    return {
      start_time: `${String(newStartH).padStart(2, '0')}:${String(newStartM).padStart(2, '0')}`,
      end_time: `${String(newEndH).padStart(2, '0')}:${String(newEndM).padStart(2, '0')}`
    };
  };

  const calculateDuration = (start, end) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };

  const handleBeforeDragStart = useCallback((start) => {
    freezeStart(start);
  }, [freezeStart]);

  const handleDragStart = useCallback((start) => {
    if (autoScrollerRef.current) {
      // Начинаем автоскролл с начальной позиции
      autoScrollerRef.current.start(window.innerHeight / 2);
    }
  }, []);

  const handleDragUpdate = useCallback((update) => {
    updateProjection(update);
    
    // Обновляем позицию для автоскролла
    if (autoScrollerRef.current && update.source) {
      const clientY = window.innerHeight / 2; // Можно получить из event если доступно
      autoScrollerRef.current.update(clientY);
    }
  }, [updateProjection]);

  const handleDragEnd = useCallback(async (result) => {
    // Останавливаем автоскролл
    if (autoScrollerRef.current) {
      autoScrollerRef.current.stop();
    }

    freezeEnd();
    clearProjection();

    if (!result.destination) {
      return;
    }

    const { source, destination, draggableId } = result;

    // Из незапланированных в окно
    if (source.droppableId === 'unscheduled-tasks') {
      const windowName = destination.droppableId;
      const window = dayPlan.brackets.find(b => b.name === windowName);
      
      if (!window) return;

      const task = allTasks.find(t => t.id === draggableId);
      if (!task) return;

      // Гибкое окно - без времени
      if (window.type === 'flexible') {
        await createScheduleItemMutation.mutateAsync({
          task_id: task.id,
          task_title: task.title,
          day_plan_id: dayPlan.id,
          day_date: currentDate,
          window_name: windowName,
          start_time: null,
          end_time: null,
          duration_min: task.duration_min,
          status: "planned",
          project_name: task.project_name,
          color: task.color,
          priority: task.priority
        });
        return;
      }

      if (window.type !== 'window') return;

      // Валидация вместимости
      const windowSchedule = scheduleItems.filter(s => s.window_name === windowName);
      const usedTime = windowSchedule.reduce((sum, s) => sum + s.duration_min, 0);
      const windowDuration = calculateDuration(window.start_time, window.end_time);
      const remaining = windowDuration - usedTime;
      const fits = remaining + 3 >= task.duration_min; // ε = 3 мин

      if (!fits) {
        toast.error(`Не помещается в окне "${windowName}". Остаток: ${remaining} мин`);
        return;
      }

      const timeSlot = calculateTimeSlot(window, usedTime, task.duration_min);
      
      await createScheduleItemMutation.mutateAsync({
        task_id: task.id,
        task_title: task.title,
        day_plan_id: dayPlan.id,
        day_date: currentDate,
        window_name: windowName,
        ...timeSlot,
        duration_min: task.duration_min,
        status: "planned",
        project_name: task.project_name,
        color: task.color,
        priority: task.priority
      });
      return;
    }

    // Перемещение между окнами или внутри окна
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceWindow = dayPlan.brackets.find(b => b.name === source.droppableId);
    const destWindow = dayPlan.brackets.find(b => b.name === destination.droppableId);
    
    if (!destWindow) return;

    const itemToMove = scheduleItems.find(s => s.id === draggableId);
    if (!itemToMove) return;

    // Перемещение в гибкое окно
    if (destWindow.type === 'flexible') {
      await updateScheduleItemMutation.mutateAsync({
        itemId: itemToMove.id,
        updates: {
          window_name: destination.droppableId,
          start_time: null,
          end_time: null
        }
      });

      // Пересчёт исходного окна если было обычное
      if (sourceWindow && sourceWindow.type === 'window') {
        const sourceSchedule = scheduleItems.filter(
          s => s.window_name === source.droppableId && s.id !== draggableId
        );
        
        let accumulatedTime = 0;
        for (const item of sourceSchedule) {
          const timeSlot = calculateTimeSlot(sourceWindow, accumulatedTime, item.duration_min);
          await updateScheduleItemMutation.mutateAsync({
            itemId: item.id,
            updates: timeSlot
          });
          accumulatedTime += item.duration_min;
        }
      }
      return;
    }

    // Перемещение в обычное окно
    if (destWindow.type === 'window') {
      if (source.droppableId === destination.droppableId) {
        // Переупорядочивание внутри одного окна
        const windowSchedule = scheduleItems.filter(s => s.window_name === source.droppableId);
        const reordered = Array.from(windowSchedule);
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);

        let accumulatedTime = 0;
        for (const item of reordered) {
          const timeSlot = calculateTimeSlot(sourceWindow, accumulatedTime, item.duration_min);
          await updateScheduleItemMutation.mutateAsync({
            itemId: item.id,
            updates: timeSlot
          });
          accumulatedTime += item.duration_min;
        }
      } else {
        // Перемещение между окнами - валидация вместимости
        const destSchedule = scheduleItems.filter(s => s.window_name === destination.droppableId);
        const destUsedTime = destSchedule.reduce((sum, s) => sum + s.duration_min, 0);
        const destDuration = calculateDuration(destWindow.start_time, destWindow.end_time);
        const remaining = destDuration - destUsedTime;
        const fits = remaining + 3 >= itemToMove.duration_min;

        if (!fits) {
          toast.error(`Не помещается в окне "${destWindow.name}". Остаток: ${remaining} мин`);
          return;
        }

        const timeSlot = calculateTimeSlot(destWindow, destUsedTime, itemToMove.duration_min);
        
        await updateScheduleItemMutation.mutateAsync({
          itemId: itemToMove.id,
          updates: {
            window_name: destination.droppableId,
            ...timeSlot
          }
        });

        // Пересчёт исходного окна
        if (sourceWindow && sourceWindow.type === 'window') {
          const sourceSchedule = scheduleItems.filter(
            s => s.window_name === source.droppableId && s.id !== draggableId
          );
          
          let accumulatedTime = 0;
          for (const item of sourceSchedule) {
            const timeSlot = calculateTimeSlot(sourceWindow, accumulatedTime, item.duration_min);
            await updateScheduleItemMutation.mutateAsync({
              itemId: item.id,
              updates: timeSlot
            });
            accumulatedTime += item.duration_min;
          }
        }
      }
    }
  }, [dayPlan, scheduleItems, allTasks, currentDate, freezeEnd, clearProjection, createScheduleItemMutation, updateScheduleItemMutation, calculateTimeSlot, calculateDuration]);

  const closeDayMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.DayPlan.update(dayPlan.id, { status: "closed" });
      
      const incompleteTasks = scheduleItems.filter(s => s.status !== "done");
      if (incompleteTasks.length > 0) {
        for (const item of incompleteTasks) {
          const task = await base44.entities.Task.get(item.task_id);
          if (task && task.status !== 'done') {
            await base44.entities.Task.update(task.id, { status: 'todo' });
          }
          await base44.entities.ScheduleItem.delete(item.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dayPlan'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleItems'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
    },
  });

  const goToToday = () => {
    setCurrentDate(format(new Date(), "yyyy-MM-dd"));
  };

  const navigateDay = (direction) => {
    const newDate = direction === 'next' 
      ? addDays(new Date(currentDate), 1)
      : subDays(new Date(currentDate), 1);
    setCurrentDate(format(newDate, "yyyy-MM-dd"));
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <DragDropContext
          onBeforeDragStart={handleBeforeDragStart}
          onDragStart={handleDragStart}
          onDragUpdate={handleDragUpdate}
          onDragEnd={handleDragEnd}
        >
          <DayHeader
            currentDate={currentDate}
            dayPlan={dayPlan}
            onNavigate={navigateDay}
            onToday={goToToday}
            onCreateDay={() => setShowCreateDialog(true)}
            onCloseDay={() => closeDayMutation.mutate()}
            onEditTemplate={() => setShowEditTemplate(true)}
            isClosing={closeDayMutation.isPending}
          />

        {!dayPlan ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border border-gray-300 rounded flex items-center justify-center mb-6">
              <Plus className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Нет плана на этот день</h3>
            <p className="text-black mb-6">Создайте план дня на основе шаблона</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-black rounded px-6 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Создать план дня
            </Button>
          </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TimelineGrid
                  dayPlan={dayPlan}
                  scheduleItems={scheduleItems}
                  currentDate={currentDate}
                  dragFreeze={dragFreeze}
                  projected={projected}
                  getFrozenItems={getFrozenItems}
                />
              </div>
              <div>
                <TaskList
                  unscheduledTasks={unscheduledTasks}
                  dayPlan={dayPlan}
                  currentDate={currentDate}
                  dragFreeze={dragFreeze}
                  getFrozenItems={getFrozenItems}
                />
              </div>
            </div>
          )}

          <CreateDayDialog
            open={showCreateDialog}
            onClose={() => setShowCreateDialog(false)}
            currentDate={currentDate}
          />

          <EditDayTemplateDialog
            open={showEditTemplate}
            onClose={() => setShowEditTemplate(false)}
            dayPlan={dayPlan}
          />
        </DragDropContext>
      </div>
    </div>
  );
}
