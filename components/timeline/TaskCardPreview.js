import React from "react";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";

export default function TaskCardPreview({ task, provided, snapshot }) {
  const priorityColors = {
    P1: "bg-red-100 text-red-700 border-red-300",
    P2: "bg-orange-100 text-orange-700 border-orange-300",
    P3: "bg-blue-100 text-blue-700 border-blue-300",
    P4: "bg-gray-100 text-gray-700 border-gray-300"
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="flex items-center justify-between p-3 rounded-xl border-2 shadow-2xl"
      style={{
        ...provided.draggableProps.style,
        backgroundColor: `${task.color}20`,
        borderColor: task.color,
        transform: provided.draggableProps.style?.transform,
        opacity: 0.96,
        scale: 1.02,
        transition: 'all 180ms cubic-bezier(0.2, 0, 0, 1)'
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <GripVertical className="w-4 h-4 text-gray-400" />
        
        <div 
          className="w-1 h-12 rounded-full" 
          style={{ backgroundColor: task.color }} 
        />
        
        <div className="flex-1">
          <p className="font-medium text-gray-900">
            {task.task_title || task.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.start_time && (
              <span className="text-sm text-gray-500">
                {task.start_time} — {task.end_time}
              </span>
            )}
            {task.priority && (
              <Badge className={priorityColors[task.priority]} variant="secondary">
                {task.priority}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <Badge variant="outline">{task.duration_min} мин</Badge>
    </div>
  );
}
