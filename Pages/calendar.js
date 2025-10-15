import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getYear, startOfYear, endOfYear, addYears, subYears } from "date-fns";
import { ru } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');

  const { data: allDayPlans = [] } = useQuery({
    queryKey: ['allDayPlans'],
    queryFn: () => base44.entities.DayPlan.list(),
  });

  const { data: allScheduleItems = [] } = useQuery({
    queryKey: ['allScheduleItems'],
    queryFn: () => base44.entities.ScheduleItem.list(),
  });

  const getDayStats = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayItems = allScheduleItems.filter(s => s.day_date === dateStr);
    const completed = dayItems.filter(s => s.status === 'done').length;
    return { total: dayItems.length, completed };
  };

  const navigateMonth = (direction) => {
    if (direction === 'next') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateYear = (direction) => {
    if (direction === 'next') {
      setCurrentDate(addYears(currentDate, 1));
    } else {
      setCurrentDate(subYears(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));

  const getCompletionColor = (completed, total) => {
    if (total === 0) return 'bg-gray-100';
    const ratio = completed / total;
    if (ratio === 1) return 'bg-green-500';
    if (ratio >= 0.8) return 'bg-green-400';
    if (ratio >= 0.6) return 'bg-yellow-400';
    if (ratio >= 0.4) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Календарь</h1>
            <p className="text-gray-500 mt-1">Обзор выполненных задач</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                onClick={() => setView('month')}
                size="sm"
              >
                Месяц
              </Button>
              <Button
                variant={view === 'year' ? 'default' : 'outline'}
                onClick={() => setView('year')}
                size="sm"
              >
                Год
              </Button>
            </div>
            <Button onClick={goToToday} variant="outline" size="sm">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Сегодня
            </Button>
          </div>
        </div>

        {view === 'month' ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <CardTitle className="text-2xl">
                  {format(currentDate, 'LLLL yyyy', { locale: ru })}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1 }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {days.map((day) => {
                  const stats = getDayStats(day);
                  const colorClass = getCompletionColor(stats.completed, stats.total);
                  const dayStr = format(day, 'yyyy-MM-dd');

                  return (
                    <Link
                      key={day.toISOString()}
                      to={createPageUrl(`Timeline?date=${dayStr}`)}
                      className={`aspect-square p-2 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                        isToday(day) ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
                      } ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}`}
                    >
                      <div className="h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className={`text-sm font-semibold ${isToday(day) ? 'text-indigo-600' : 'text-gray-900'}`}>
                            {format(day, 'd')}
                          </span>
                          {stats.total > 0 && (
                            <div className={`w-2 h-2 rounded-full ${colorClass}`} />
                          )}
                        </div>
                        {stats.total > 0 && (
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-700">
                              {stats.completed}/{stats.total}
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 mt-6 pt-6 border-t">
                <span className="text-sm text-gray-600">Легенда:</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-gray-600">100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-600">80%+</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="text-xs text-gray-600">60%+</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400" />
                  <span className="text-xs text-gray-600">40%+</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-xs text-gray-600">&lt;40%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateYear('prev')}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <CardTitle className="text-2xl">
                  {getYear(currentDate)}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateYear('next')}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {months.map((month) => {
                  const monthDays = eachDayOfInterval({
                    start: startOfMonth(month),
                    end: endOfMonth(month)
                  });
                  
                  let totalTasks = 0;
                  let completedTasks = 0;
                  
                  monthDays.forEach(day => {
                    const stats = getDayStats(day);
                    totalTasks += stats.total;
                    completedTasks += stats.completed;
                  });

                  const colorClass = getCompletionColor(completedTasks, totalTasks);

                  return (
                    <button
                      key={month.toISOString()}
                      onClick={() => {
                        setCurrentDate(month);
                        setView('month');
                      }}
                      className="p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {format(month, 'LLLL', { locale: ru })}
                        </span>
                        {totalTasks > 0 && (
                          <>
                            <div className={`w-4 h-4 rounded-full ${colorClass}`} />
                            <span className="text-sm text-gray-600">
                              {completedTasks}/{totalTasks}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
