import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Save, Trash2 } from "lucide-react";

export default function ProjectDialog({ open, onClose, project, colorPalette }) {
  const [formData, setFormData] = useState({
    name: "",
    color: colorPalette[0],
    default_duration_min: 30,
    priority_default: "P3",
    split_policy: "none",
    min_chunk: 15,
    max_chunks: 3,
    carry_over: "next_day"
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (project) {
      setFormData(project);
    } else {
      setFormData({
        name: "",
        color: colorPalette[0],
        default_duration_min: 30,
        priority_default: "P3",
        split_policy: "none",
        min_chunk: 15,
        max_chunks: 3,
        carry_over: "next_day"
      });
    }
  }, [project, colorPalette]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (project) {
        return await base44.entities.Project.update(project.id, formData);
      } else {
        return await base44.entities.Project.create(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Project.delete(project.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? "Редактировать проект" : "Создать проект"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название проекта</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Немецкий, Математика, Хобби..."
            />
          </div>

          <div className="space-y-2">
            <Label>Цвет проекта</Label>
            <div className="flex gap-2 flex-wrap">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-xl transition-all duration-200 ${
                    formData.color === color ? 'ring-4 ring-indigo-300 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Длительность по умолчанию (мин)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.default_duration_min}
                onChange={(e) => setFormData({ ...formData, default_duration_min: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет по умолчанию</Label>
              <Select
                value={formData.priority_default}
                onValueChange={(value) => setFormData({ ...formData, priority_default: value })}
              >
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

          <div className="space-y-2">
            <Label htmlFor="carry">Политика переноса</Label>
            <Select
              value={formData.carry_over}
              onValueChange={(value) => setFormData({ ...formData, carry_over: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Отключён</SelectItem>
                <SelectItem value="next_window_same_day">В следующее окно (тот же день)</SelectItem>
                <SelectItem value="next_day">На следующий день</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="split">Разрешить разбивку задач</Label>
              <Switch
                id="split"
                checked={formData.split_policy === 'allow_split'}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, split_policy: checked ? 'allow_split' : 'none' })
                }
              />
            </div>

            {formData.split_policy === 'allow_split' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minChunk">Мин. размер куска (мин)</Label>
                  <Input
                    id="minChunk"
                    type="number"
                    value={formData.min_chunk}
                    onChange={(e) => setFormData({ ...formData, min_chunk: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxChunks">Макс. кол-во кусков</Label>
                  <Input
                    id="maxChunks"
                    type="number"
                    value={formData.max_chunks}
                    onChange={(e) => setFormData({ ...formData, max_chunks: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {project && (
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!formData.name || saveMutation.isPending}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
