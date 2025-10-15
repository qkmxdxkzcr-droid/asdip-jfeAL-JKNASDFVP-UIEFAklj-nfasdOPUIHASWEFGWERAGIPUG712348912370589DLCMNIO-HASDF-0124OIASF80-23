import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, GripVertical } from "lucide-react";
import { Droppable, Draggable } from "@hello-pangea/dnd";

import QuickAddTaskDialog from "./QuickAddTaskDialog";
import AutoScheduleDialog from "./AutoScheduleDialog";

export default function TaskList({ unscheduledTasks, dayPlan, currentDate }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAutoSchedule, setShowAutoSchedule] = useState(false);

  const priorityColors = {
    P1: "bg-red-100 text-red-700",
    P2: "bg-orange-100 text-orange-700",
    P3: "bg-blue-100 text-blue-700",
    P4: "bg-gray-100 text-gray-700"
  };

  return (
    <>
      <Card className="sticky top-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Незапланированные</CardTitle>
            <Badge variant="outline">{unscheduledTasks.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setShowAddDialog(true)}
              variant="outline"
              className="w-full justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить задачу
            </Button>
            {dayPlan && unscheduledTasks.length > 0 && (
              <Button
                onClick={() => setShowAutoSchedule(true)}
                className="w-full justify-start bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Авто-план
              </Button>
            )}
          </div>

          <Droppable droppableId="unscheduled-tasks">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 max-h-[600px] overflow-y-auto p-2 rounded-lg transition-colors ${
                  snapshot.isDraggingOver ? 'bg-indigo-50' : ''
                }`}
              >
                {unscheduledTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Все задачи запланированы</p>
                  </div>
                ) : (
                  unscheduledTasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-3 rounded-xl border border-gray-200 transition-all duration-200 ${
                            snapshot.isDragging ? 'shadow-xl ring-2 ring-indigo-400 scale-105' : 'hover:shadow-sm hover:border-gray-300'
                          }`}
                          style={{ 
                            backgroundColor: task.color ? `${task.color}10` : undefined,
                            ...provided.draggableProps.style
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing mt-1 p-1 hover:bg-gray-100 rounded">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>
                            
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">{task.title}</p>
                              {task.project_name && (
                                <p className="text-xs text-gray-500 mt-1">{task.project_name}</p>
                              )}
                            </div>
                            
                            {task.priority && (
                              <Badge className={priorityColors[task.priority]} variant="secondary">
                                {task.priority}
                              </Badge>
                            )}
                          </div>
                          {task.duration_min && (
                            <p className="text-xs text-gray-500 mt-2 ml-9">{task.duration_min} мин</p>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </CardContent>
      </Card>

      <QuickAddTaskDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />

      <AutoScheduleDialog
        open={showAutoSchedule}
        onClose={() => setShowAutoSchedule(false)}
        dayPlan={dayPlan}
        tasks={unscheduledTasks}
        currentDate={currentDate}
      />
    </>
  );
}
