import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Save, Plus, X, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const BRACKET_COLORS = [
  { name: "Фиолетовый", value: "#8B5CF6" },
  { name: "Индиго", value: "#4F46E5" },
  { name: "Синий", value: "#3B82F6" },
  { name: "Зелёный", value: "#10B981" },
  { name: "Изумрудный", value: "#14B8A6" },
  { name: "Оранжевый", value: "#F97316" },
  { name: "Розовый", value: "#EC4899" },
  { name: "Красный", value: "#EF4444" }
];

export default function EditDayTemplateDialog({ open, onClose, dayPlan }) {
  const [brackets, setBrackets] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (dayPlan?.brackets) {
      setBrackets([...dayPlan.brackets]);
    }
  }, [dayPlan]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(brackets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setBrackets(items);
  };

  const addBracket = () => {
    setBrackets([
      ...brackets,
      {
        type: "window",
        name: "Новый блок",
        start_time: "09:00",
        end_time: "10:00",
        color: "#4F46E5"
      }
    ]);
  };

  const updateBracket = (index, field, value) => {
    const newBrackets = [...brackets];
    newBrackets[index] = { ...newBrackets[index], [field]: value };
    setBrackets(newBrackets);
  };

  const removeBracket = (index) => {
    setBrackets(brackets.filter((_, i) => i !== index));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const bracketsWithDuration = brackets.map(b => {
        if (b.type === 'window') {
          const [startH, startM] = b.start_time.split(':').map(Number);
          const [endH, endM] = b.end_time.split(':').map(Number);
          const duration_min = (endH * 60 + endM) - (startH * 60 + startM);
          return { ...b, duration_min };
        }
        return b;
      });

      return await base44.entities.DayPlan.update(dayPlan.id, {
        brackets: bracketsWithDuration
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dayPlan'] });
      onClose();
    },
  });

  if (!dayPlan) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать структуру дня</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Перетаскивайте блоки для изменения порядка
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBracket}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить блок
            </Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="day-brackets">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {brackets.map((bracket, index) => (
                    <Draggable key={index} draggableId={`bracket-${index}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-4 border rounded-xl space-y-3 bg-gray-50 transition-shadow ${
                            snapshot.isDragging ? 'shadow-xl' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-5 h-5 text-gray-400" />
                              </div>
                              <Badge variant={bracket.type === 'fixed' ? 'default' : bracket.type === 'flexible' ? 'secondary' : 'outline'}>
                                {bracket.type === 'fixed' ? 'Фиксированный' : bracket.type === 'flexible' ? 'Гибкий' : 'Окно'}
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBracket(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Тип блока</Label>
                              <Select
                                value={bracket.type}
                                onValueChange={(value) => updateBracket(index, 'type', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">Фиксированный</SelectItem>
                                  <SelectItem value="window">Окно</SelectItem>
                                  <SelectItem value="flexible">Гибкий</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Название</Label>
                              <Input
                                value={bracket.name}
                                onChange={(e) => updateBracket(index, 'name', e.target.value)}
                                placeholder="Название блока"
                              />
                            </div>

                            {bracket.type !== 'flexible' && (
                              <>
                                <div className="space-y-2">
                                  <Label>Начало</Label>
                                  <Input
                                    type="time"
                                    value={bracket.start_time}
                                    onChange={(e) => updateBracket(index, 'start_time', e.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Окончание</Label>
                                  <Input
                                    type="time"
                                    value={bracket.end_time}
                                    onChange={(e) => updateBracket(index, 'end_time', e.target.value)}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Цвет</Label>
                            <div className="flex gap-2 flex-wrap">
                              {BRACKET_COLORS.map((color) => (
                                <button
                                  key={color.value}
                                  type="button"
                                  onClick={() => updateBracket(index, 'color', color.value)}
                                  className={`w-8 h-8 rounded-lg transition-all duration-200 ${
                                    bracket.color === color.value ? 'ring-2 ring-indigo-500 scale-110' : 'hover:scale-110'
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Сохранить изменения
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
