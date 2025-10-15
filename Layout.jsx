import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Calendar, 
  FolderKanban, 
  LayoutTemplate, 
  Upload, 
  BarChart3,
  CalendarDays,
  LogOut,
  Settings
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Таймлайн",
    url: createPageUrl("Timeline"),
    icon: Calendar,
  },
  {
    title: "Проекты и планы",
    url: createPageUrl("ProjectsAndTasks"),
    icon: FolderKanban,
  },
  {
    title: "Календарь",
    url: createPageUrl("Calendar"),
    icon: CalendarDays,
  },
  {
    title: "Шаблоны",
    url: createPageUrl("Templates"),
    icon: LayoutTemplate,
  },
  {
    title: "Импорт",
    url: createPageUrl("Import"),
    icon: Upload,
  },
  {
    title: "Статистика",
    url: createPageUrl("Statistics"),
    icon: BarChart3,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SidebarProvider>
        <div className="min-h-screen flex w-full bg-white">
          <Sidebar className="border-r border-gray-200 bg-white">
            <SidebarHeader className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-black text-lg">Скобки</h2>
                    <p className="text-xs text-black">Планировщик дней</p>
                  </div>
                </div>
                <Link to={createPageUrl("Settings")}>
                  <Button variant="ghost" size="icon" className="hover:bg-gray-100 border border-gray-300 rounded">
                    <Settings className="w-4 h-4 text-gray-600" />
                  </Button>
                </Link>
              </div>
            </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-black uppercase tracking-wider px-3 py-2 mb-2">
                Навигация
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-gray-100 transition-all duration-200 ${
                          location.pathname === item.url
                            ? 'bg-gray-100 text-purple-600 underline'
                            : 'text-black hover:text-purple-600'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-4">
            <Button
              variant="ghost"
              onClick={() => base44.auth.logout()}
              className="w-full justify-start gap-3 text-black hover:text-black hover:bg-gray-100 border border-gray-300 rounded"
            >
              <LogOut className="w-4 h-4" />
              Выход
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded transition-colors duration-200" />
              <h1 className="text-xl font-bold text-black">Скобки</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
