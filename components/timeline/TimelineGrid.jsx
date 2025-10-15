import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, GripVertical, X } from "lucide-react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import TaskCardPreview from "./TaskCardPreview";

export default function TimelineGrid({ dayPlan, scheduleItems, currentDate, dragFreeze, projected, getFrozenItems }) {
  const queryClient = useQueryClient();

  const deleteScheduleItemMutation = useMutation({
    mutationFn: async (itemId) => {
      await base44.entities.ScheduleItem.delete(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleItems'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
    },
  });

  const toggleTaskCompleteMutation = useMutation({
    mutationFn: async ({ itemId, taskId, currentStatus, element }) => {
      const newStatus = currentStatus === 'done' ? 'planned' : 'done';
      
      if (newStatus === 'done') {
        const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
        if (settings.soundEnabled !== false) {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOU6zm86tjHAU+ltryxXcrBSh+zPLaizsKGGS56+mkUhELTKXh8bllHgU3k9n0yHwyBSp+zvLcizUIFm7A8eehUBELTKXh8bllHgU3k9n0yHwyBSp+zvLcizUIFm7A8eehUBELTKXh8bllHgU3k9n0yHwyBQ==');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        }

        if (element) {
          setTimeout(() => {
            const next = element.parentElement?.nextElementSibling?.querySelector('[role="button"]');
            if (next) next.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 600);
        }
      }

      await base44.entities.ScheduleItem.update(itemId, { status: newStatus });
      await base44.entities.Task.update(taskId, { status: newStatus === 'done' ? 'done' : 'todo' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleItems'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
    },
  });

  const getScheduleForWindow = (windowName) => {
    if (dragFreeze) {
      return getFrozenItems(windowName) || [];
    }
    return scheduleItems.filter(s => s.window_name === windowName);
  };

  const calculateDuration = (start, end) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };

  if (!dayPlan?.brackets) return null;

  const priorityColors = {
    P1: "bg-red-100 text-red-700 border-red-300",
    P2: "bg-orange-100 text-orange-700 border-orange-300",
    P3: "bg-blue-100 text-blue-700 border-blue-300",
    P4: "bg-gray-100 text-gray-700 border-gray-300"
  };

  return (
    <div className="space-y-4">
      {dayPlan.brackets.map((bracket, bracketIndex) => {
        const duration = bracket.type === 'window' ? calculateDuration(bracket.start_time, bracket.end_time) : 0;
        const isWindow = bracket.type === 'window';
        const isFlexible = bracket.type === 'flexible';
        const windowSchedule = getScheduleForWindow(bracket.name);
        const usedMinutes = windowSchedule.reduce((sum, s) => sum + s.duration_min, 0);
        const remainingMinutes = duration - usedMinutes;
        const usagePercent = duration > 0 ? (usedMinutes / duration) * 100 : 0;

        // Индикатор вместимости (только для визуала, валидация на drop)
        let capacityColor = 'text-gray-500';
        if (isWindow && !dragFreeze) {
          if (remainingMinutes < 0) capacityColor = 'text-red-600';
          else if (usagePercent >= 90) capacityColor = 'text-orange-600';
          else if (usagePercent >= 70) capacityColor = 'text-yellow-600';
          else capacityColor = 'text-green-600';
        }

        // Проекция плейсхолдера
        const showPlaceholder = dragFreeze && projected && projected.windowId === bracket.name;

        return (
        <Card
          key={bracketIndex}
          className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
            isWindow || isFlexible ? 'border-l-4' : 'bg-gray-50'
          }`}
          style={{
            borderLeftColor: (isWindow || isFlexible) ? bracket.color : undefined,
          }}
        >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bracket.color }} />
                  <div>
                    <CardTitle className="text-lg font-semibold text-black">{bracket.name}</CardTitle>
                    {isWindow && (
                      <div className="flex items-center gap-2 text-sm text-black mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{bracket.start_time} — {bracket.end_time}</span>
                        <Badge variant="outline" className="ml-2 border-gray-300 text-black">{duration} мин</Badge>
                      </div>
                    )}
                    {isFlexible && <p className="text-sm text-black mt-1">Без ограничений по времени</p>}
                  </div>
                </div>
                {isWindow && (
                  <div className="text-right">
                    <p className={`text-sm font-medium ${capacityColor}`}>
                      {usedMinutes} / {duration} мин
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            remainingMinutes < 0 ? 'bg-red-500' :
                            usagePercent >= 90 ? 'bg-orange-500' :
                            usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, usagePercent)}%` }}
                        />
                      </div>
                      <p className={`text-xs ${capacityColor}`}>
                        {remainingMinutes >= 0 ? `${remainingMinutes}м` : `+${Math.abs(remainingMinutes)}м`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            {(isWindow || isFlexible) && (
              <CardContent className="pt-0">
                <Droppable 
                  droppableId={bracket.name}
                  type="WINDOW"
                  direction="vertical"
                  ignoreContainerClipping={false}
                  renderClone={(provided, snapshot, rubric) => {
                    const task = windowSchedule[rubric.source.index];
                    return task ? (
                      <TaskCardPreview 
                        task={task}
                        provided={provided}
                        snapshot={snapshot}
                      />
                    ) : null;
                  }}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        scrollable space-y-2 min-h-[100px] max-h-[600px] overflow-y-auto rounded p-2
                        transition-colors duration-200
                        ${snapshot.isDraggingOver ? 'bg-gray-50 ring-2 ring-gray-300' : ''}
                        ${dragFreeze && !snapshot.isDraggingOver ? 'bg-gray-50' : ''}
                      `}
                      style={{ 
                        overscrollBehavior: 'contain',
                        overflow: 'auto'
                      }}
                    >
                      {windowSchedule.length > 0 ? (
                        windowSchedule.map((item, idx) => {
                          // Вставляем плейсхолдер в нужную позицию
                          const shouldShowPlaceholder = showPlaceholder && projected.index === idx;
                          
                          return (
                            <React.Fragment key={item.id}>
                              {shouldShowPlaceholder && (
                                <div 
                                  className="h-20 bg-indigo-100 border-2 border-dashed border-indigo-300 rounded-xl opacity-50"
                                  style={{ minHeight: '80px' }}
                                />
                              )}
                              {!dragFreeze && (
                                <Draggable draggableId={item.id} index={idx}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`
                                        flex items-center justify-between p-3 rounded border border-gray-300 bg-white
                                        ${snapshot.isDragging ? 'opacity-0' : 'hover:shadow-md'}
                                        ${item.status === 'done' ? 'opacity-60' : ''}
                                      `}
                                      style={{
                                        ...provided.draggableProps.style,
                                        backgroundColor: item.status === 'done' ? `${item.color}08` : `${item.color}15`,
                                        borderColor: item.status === 'done' ? `${item.color}20` : `${item.color}40`,
                                      }}
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <div 
                                          {...provided.dragHandleProps}
                                          className="drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors"
                                          style={{ touchAction: 'none', userSelect: 'none' }}
                                        >
                                          <GripVertical className="w-4 h-4 text-gray-400" />
                                        </div>
                                        
                                        <Checkbox
                                          checked={item.status === 'done'}
                                          onCheckedChange={() => {
                                            toggleTaskCompleteMutation.mutate({
                                              itemId: item.id,
                                              taskId: item.task_id,
                                              currentStatus: item.status,
                                              element: provided.innerRef.current
                                            });
                                          }}
                                        />
                                        
                                        <div 
                                          className="w-1 h-12 rounded-full" 
                                          style={{ 
                                            backgroundColor: item.color, 
                                            opacity: item.status === 'done' ? 0.4 : 1 
                                          }} 
                                        />
                                        
                                        <div className="flex-1">
                                          <p className={`font-medium text-black ${item.status === 'done' ? 'line-through' : ''}`}>
                                            {item.task_title}
                                          </p>
                                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {isWindow && item.start_time && (
                                              <span className="text-sm text-gray-500">
                                                {item.start_time} — {item.end_time}
                                              </span>
                                            )}
                                            {item.priority && (
                                              <Badge className={priorityColors[item.priority]} variant="secondary">
                                                {item.priority}
                                              </Badge>
                                            )}
                                            {item.project_name && (
                                              <span className="text-xs text-gray-500">{item.project_name}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">{item.duration_min} мин</Badge>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            deleteScheduleItemMutation.mutate(item.id); 
                                          }}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              )}
                              {dragFreeze && (
                                <div
                                  className="flex items-center justify-between p-3 rounded-xl border opacity-70"
                                  style={{
                                    backgroundColor: `${item.color}15`,
                                    borderColor: `${item.color}40`,
                                  }}
                                >
                                  {/* Замороженная карточка */}
                                  <div className="flex items-center gap-3 flex-1">
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                    <div className="w-1 h-12 rounded-full" style={{ backgroundColor: item.color }} />
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">{item.task_title}</p>
                                      {isWindow && item.start_time && (
                                        <span className="text-sm text-gray-500">
                                          {item.start_time} — {item.end_time}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant="outline">{item.duration_min} мин</Badge>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <p className="text-sm">Перетащите задачи сюда</p>
                          {isWindow && remainingMinutes > 0 && (
                            <p className="text-xs mt-1">Свободно: {remainingMinutes} мин</p>
                          )}
                        </div>
                      )}
                      
                      {showPlaceholder && projected.index === windowSchedule.length && (
                        <div 
                          className="h-20 bg-indigo-100 border-2 border-dashed border-indigo-300 rounded-xl opacity-50"
                          style={{ minHeight: '80px' }}
                        />
                      )}
                      
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            )}

            {!isWindow && !isFlexible && (
              <CardContent className="pt-0">
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">Фиксированный блок</p>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
