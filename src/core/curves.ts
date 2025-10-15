export interface CurveData {
  time: string
  cort: number
  dopa: number
  sero: number
  sleep: number
}

export function buildCurves(): CurveData[] {
  // Генерируем данные для кривых дня (24 часа)
  const curves: CurveData[] = []
  
  for (let hour = 0; hour < 24; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`
    
    // Кортизол (пик утром, спад вечером)
    const cort = Math.max(0, 100 - (hour - 6) * 8 + Math.sin((hour - 6) * Math.PI / 12) * 20)
    
    // Дофамин (стабильный уровень с небольшими колебаниями)
    const dopa = 70 + Math.sin(hour * Math.PI / 6) * 15
    
    // Серотонин (пик днем, спад вечером)
    const sero = Math.max(0, 80 - Math.abs(hour - 14) * 3 + Math.sin((hour - 8) * Math.PI / 8) * 10)
    
    // Сонливость (низкая днем, высокая ночью)
    const sleep = hour >= 22 || hour <= 6 ? 90 : Math.max(0, 20 - Math.abs(hour - 14) * 2)
    
    curves.push({
      time,
      cort: Math.round(cort),
      dopa: Math.round(dopa),
      sero: Math.round(sero),
      sleep: Math.round(sleep)
    })
  }
  
  return curves
}
