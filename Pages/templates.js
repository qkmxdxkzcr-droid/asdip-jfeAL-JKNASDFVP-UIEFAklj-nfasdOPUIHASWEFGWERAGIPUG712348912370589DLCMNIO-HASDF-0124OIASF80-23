import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutTemplate, Clock } from "lucide-react";

import TemplateDialog from "../components/templates/TemplateDialog";

export default function Templates() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.PlanTemplate.list("-created_date"),
  });

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowDialog(true);
  };

  const handleClose = () => {
    setEditingTemplate(null);
    setShowDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Шаблоны дней</h1>
            <p className="text-gray-500 mt-1">Создавайте и редактируйте структуру дня</p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Создать шаблон
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => handleEdit(template)}
            >
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <LayoutTemplate className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {template.brackets?.length || 0} блоков
                      </p>
                    </div>
                  </div>
                  <Badge variant={template.active ? "default" : "secondary"}>
                    {template.active ? "Активен" : "Неактивен"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {template.brackets?.slice(0, 5).map((bracket, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 rounded-lg"
                      style={{ 
                        backgroundColor: `${bracket.color}15`,
                        borderLeft: `3px solid ${bracket.color}`
                      }}
                    >
                      <Badge variant="outline" className="text-xs">
                        {bracket.type === 'fixed' ? 'Фикс' : 'Окно'}
                      </Badge>
                      <span className="flex-1 text-sm font-medium">{bracket.name}</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{bracket.start_time}–{bracket.end_time}</span>
                      </div>
                    </div>
                  ))}
                  {template.brackets?.length > 5 && (
                    <p className="text-xs text-center text-gray-400 pt-2">
                      и ещё {template.brackets.length - 5} блоков...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
              <LayoutTemplate className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Нет шаблонов</h3>
            <p className="text-gray-500 mb-6">Создайте первый шаблон дня</p>
            <Button
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Создать шаблон
            </Button>
          </div>
        )}

        <TemplateDialog
          open={showDialog}
          onClose={handleClose}
          template={editingTemplate}
        />
      </div>
    </div>
  );
}
