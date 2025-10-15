import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2, Settings } from "lucide-react";

export default function DayHeader({ 
  currentDate, 
  dayPlan, 
  onNavigate, 
  onToday, 
  onCreateDay, 
  onCloseDay,
  onEditTemplate,
  isClosing 
}) {
  const isToday = format(new Date(), "yyyy-MM-dd") === currentDate;
  const dateObj = new Date(currentDate);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('prev')}
            className="rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            onClick={onToday}
            className="rounded-xl"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Сегодня
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('next')}
            className="rounded-xl"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {format(dateObj, "d MMMM", { locale: ru })}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500">{format(dateObj, "EEEE", { locale: ru })}</p>
            {isToday && (
              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                Сегодня
              </Badge>
            )}
            {dayPlan?.status === 'closed' && (
              <Badge variant="outline" className="border-green-500 text-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Завершён
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {dayPlan && dayPlan.status === 'open' && (
          <>
            <Button
              onClick={onEditTemplate}
              variant="outline"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Изменить шаблон
            </Button>
            <Button
              onClick={onCloseDay}
              disabled={isClosing}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Закрыть день
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
