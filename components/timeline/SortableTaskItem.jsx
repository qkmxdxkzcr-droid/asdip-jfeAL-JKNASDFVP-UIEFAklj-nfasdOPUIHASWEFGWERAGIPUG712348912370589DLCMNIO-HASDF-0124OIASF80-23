import React, { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GripVertical, X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";

export default function SortableTaskItem({ item, onToggle, onDelete, isWindow, priorityColors }) {
  const itemRef = useRef(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: item.id,
    data: {
      type: 'task',
      item
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={false}
      animate={item.status === 'done' ? {
        scale: [1, 1.02, 0.98, 1],
        opacity: 0.6
      } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center justify-between p-3 rounded-xl border cursor-default ${
        isDragging ? 'shadow-xl ring-2 ring-indigo-400' : 'hover:shadow-md'
      }`}
      style={{
        ...style,
        backgroundColor: item.status === 'done' ? `${item.color}08` : `${item.color}15`,
        borderColor: item.status === 'done' ? `${item.color}20` : `${item.color}40`
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
        
        <Checkbox
          checked={item.status === 'done'}
          onCheckedChange={() => {
            onToggle({
              itemId: item.id,
              taskId: item.task_id,
              currentStatus: item.status,
              element: itemRef.current
            });
          }}
          onClick={(e) => e.stopPropagation()}
        />
        
        <div className="w-1 h-12 rounded-full" style={{ backgroundColor: item.color, opacity: item.status === 'done' ? 0.4 : 1 }} />
        
        <div ref={itemRef} className="flex-1">
          <p className={`font-medium text-gray-900 ${item.status === 'done' ? 'line-through' : ''}`}>
            {item.task_title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {isWindow && item.start_time && (
              <span className="text-sm text-gray-500">{item.start_time} — {item.end_time}</span>
            )}
            {item.priority && <Badge className={priorityColors[item.priority]}>{item.priority}</Badge>}
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
            onDelete(item.id); 
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
