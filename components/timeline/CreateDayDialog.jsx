import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";

export default function CreateDayDialog({ open, onClose, currentDate }) {
  const [templateId, setTemplateId] = useState("");
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.PlanTemplate.filter({ active: true }),
  });

  const createDayMutation = useMutation({
    mutationFn: async () => {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error("Шаблон не найден");

      const bracketsWithDuration = template.brackets.map(b => {
        if (b.type === 'window') {
          const [startH, startM] = b.start_time.split(':').map(Number);
          const [endH, endM] = b.end_time.split(':').map(Number);
          const duration_min = (endH * 60 + endM) - (startH * 60 + startM);
          return { ...b, duration_min };
        }
        return b;
      });

      bracketsWithDuration.push({
        type: "flexible",
        name: "Гибкие задачи",
        color: "#6366F1",
        lock: "soft"
      });

      return await base44.entities.DayPlan.create({
        date: currentDate,
        template_id: template.id,
        template_name: template.name,
        status: "open",
        brackets: bracketsWithDuration
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dayPlan'] });
      setTemplateId("");
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать план дня</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template">Выберите шаблон</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите шаблон дня" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {templates.length === 0 && (
            <p className="text-sm text-gray-500">
              Сначала создайте шаблон дня в разделе "Шаблоны"
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={() => createDayMutation.mutate()}
            disabled={!templateId || createDayMutation.isPending}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
