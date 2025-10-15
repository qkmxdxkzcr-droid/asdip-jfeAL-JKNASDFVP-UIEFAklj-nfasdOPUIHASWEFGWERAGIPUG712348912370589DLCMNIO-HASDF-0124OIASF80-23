import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Trash2 } from 'lucide-react';

export default function TemplateDialog({ isOpen, onClose, onSave, template = null }) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    tasks: template?.tasks || [{ name: '', duration: 30 }]
  });

  const handleTaskChange = (index, field, value) => {
    const newTasks = [...formData.tasks];
    newTasks[index][field] = value;
    setFormData({ ...formData, tasks: newTasks });
  };

  const addTask = () => {
    setFormData({
      ...formData,
      tasks: [...formData.tasks, { name: '', duration: 30 }]
    });
  };

  const removeTask = (index) => {
    const newTasks = formData.tasks.filter((_, i) => i !== index);
    setFormData({ ...formData, tasks: newTasks });
  };

  const handleSave = () => {
    const validTasks = formData.tasks.filter(task => task.name.trim());
    onSave({
      ...formData,
      tasks: validTasks
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {template ? 'Редактировать шаблон' : 'Создать шаблон дня'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Название шаблона</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Например: Рабочий день"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Краткое описание шаблона"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Задачи</Label>
              <Button onClick={addTask} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Добавить задачу
              </Button>
            </div>

            {formData.tasks.map((task, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Название задачи</Label>
                  <Input
                    value={task.name}
                    onChange={(e) => handleTaskChange(index, 'name', e.target.value)}
                    placeholder="Введите название задачи"
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Label>Длительность (мин)</Label>
                  <Input
                    type="number"
                    value={task.duration}
                    onChange={(e) => handleTaskChange(index, 'duration', parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTask(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim()}>
              {template ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
