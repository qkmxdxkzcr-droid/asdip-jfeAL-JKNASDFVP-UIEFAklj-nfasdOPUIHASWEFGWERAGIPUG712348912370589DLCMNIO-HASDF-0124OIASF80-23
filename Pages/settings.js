import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Palette, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PRESET_THEMES = [
  { 
    name: 'Индиго', 
    primary: '#4F46E5',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#F9FAFB'
  },
  { 
    name: 'Фиолетовый', 
    primary: '#8B5CF6',
    secondary: '#EC4899',
    accent: '#F97316',
    background: '#F9FAFB'
  },
  { 
    name: 'Изумрудный', 
    primary: '#10B981',
    secondary: '#14B8A6',
    accent: '#F59E0B',
    background: '#F0FDF4'
  },
  { 
    name: 'Синий', 
    primary: '#3B82F6',
    secondary: '#06B6D4',
    accent: '#F59E0B',
    background: '#F0F9FF'
  },
  { 
    name: 'Розовый', 
    primary: '#EC4899',
    secondary: '#F472B6',
    accent: '#A855F7',
    background: '#FDF2F8'
  },
  { 
    name: 'Тёмный', 
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#F59E0B',
    background: '#1F2937',
    isDark: true
  }
];

export default function Settings() {
  const [settings, setSettings] = useState({
    theme: 'light',
    soundEnabled: true,
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    accentColor: '#F59E0B',
    backgroundColor: '#F9FAFB'
  });

  useEffect(() => {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
    applyTheme(newSettings);
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primaryColor);
    root.style.setProperty('--secondary', theme.secondaryColor);
    root.style.setProperty('--accent', theme.accentColor);
    root.style.setProperty('--background', theme.backgroundColor);
    
    if (theme.theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  const applyPreset = (preset) => {
    const newSettings = {
      ...settings,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
      backgroundColor: preset.background,
      theme: preset.isDark ? 'dark' : 'light'
    };
    saveSettings(newSettings);
  };

  const updateColor = (field, value) => {
    const newSettings = { ...settings, [field]: value };
    saveSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Настройки</h1>
          <p className="text-gray-500 mt-1">Персонализация приложения</p>
        </div>

        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance">Оформление</TabsTrigger>
            <TabsTrigger value="colors">Кастомизация</TabsTrigger>
            <TabsTrigger value="sound">Звук</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Готовые темы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {PRESET_THEMES.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                        settings.primaryColor === preset.primary 
                          ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ 
                        background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)` 
                      }}
                    >
                      <div className="aspect-square rounded-lg bg-white/90 backdrop-blur-sm p-3 mb-2">
                        <div className="space-y-1.5">
                          <div className="h-2 rounded" style={{ backgroundColor: preset.primary, opacity: 0.8 }} />
                          <div className="h-2 rounded" style={{ backgroundColor: preset.secondary, opacity: 0.6 }} />
                          <div className="h-1.5 rounded" style={{ backgroundColor: preset.accent, opacity: 0.5 }} />
                        </div>
                      </div>
                      <p className="text-white font-medium text-sm">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {settings.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  Режим отображения
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme-toggle">Тёмная тема</Label>
                  <Switch
                    id="theme-toggle"
                    checked={settings.theme === 'dark'}
                    onCheckedChange={(checked) => 
                      saveSettings({ ...settings, theme: checked ? 'dark' : 'light' })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Кастомизация цветов</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <Label htmlFor="primary">Основной цвет</Label>
                      <p className="text-sm text-gray-500 mt-1">Используется для кнопок и акцентов</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        id="primary"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => updateColor('primaryColor', e.target.value)}
                        className="w-20 h-12 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => updateColor('primaryColor', e.target.value)}
                        className="w-28"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <Label htmlFor="secondary">Вторичный цвет</Label>
                      <p className="text-sm text-gray-500 mt-1">Используется для второстепенных элементов</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        id="secondary"
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => updateColor('secondaryColor', e.target.value)}
                        className="w-20 h-12 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) => updateColor('secondaryColor', e.target.value)}
                        className="w-28"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <Label htmlFor="accent">Акцентный цвет</Label>
                      <p className="text-sm text-gray-500 mt-1">Используется для выделения важных элементов</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        id="accent"
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => updateColor('accentColor', e.target.value)}
                        className="w-20 h-12 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={settings.accentColor}
                        onChange={(e) => updateColor('accentColor', e.target.value)}
                        className="w-28"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <Label htmlFor="background">Цвет фона</Label>
                      <p className="text-sm text-gray-500 mt-1">Основной цвет фона приложения</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        id="background"
                        type="color"
                        value={settings.backgroundColor}
                        onChange={(e) => updateColor('backgroundColor', e.target.value)}
                        className="w-20 h-12 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={settings.backgroundColor}
                        onChange={(e) => updateColor('backgroundColor', e.target.value)}
                        className="w-28"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => applyPreset(PRESET_THEMES[0])}
                    className="w-full"
                  >
                    Сбросить до значений по умолчанию
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sound" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  Звуковые эффекты
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sound-toggle">Звук завершения задачи</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Воспроизводить звуковой сигнал при отметке задачи как выполненной
                    </p>
                  </div>
                  <Switch
                    id="sound-toggle"
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => 
                      saveSettings({ ...settings, soundEnabled: checked })
                    }
                  />
                </div>

                {settings.soundEnabled && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOU6zm86tjHAU+ltryxXcrBSh+zPLaizsKGGS56+mkUhELTKXh8bllHgU3k9n0yHwyBSp+zvLcizUIFm7A8eehUBELTKXh8bllHgU3k9n0yHwyBSp+zvLcizUIFm7A8eehUBELTKXh8bllHgU3k9n0yHwyBQ==');
                        audio.volume = 0.3;
                        audio.play();
                      }}
                    >
                      Прослушать звук
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
