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
            className="border-gray-300 hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={onToday}
            className="border-gray-300 hover:bg-gray-100 bg-gray-100"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Сегодня
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate('next')}
            className="border-gray-300 hover:bg-gray-100"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-black">
            {format(dateObj, "d MMMM", { locale: ru })}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-black">{format(dateObj, "EEEE", { locale: ru })}</p>
            {isToday && (
              <span className="text-black font-medium">Сегодня</span>
            )}
            {dayPlan?.status === 'closed' && (
              <Badge variant="outline" className="border-gray-300 text-black">
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
              className="border-gray-300 text-black hover:bg-gray-100"
            >
              <Settings className="w-4 h-4 mr-2" />
              Изменить шаблон
            </Button>
            <Button
              onClick={onCloseDay}
              disabled={isClosing}
              className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-black"
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
