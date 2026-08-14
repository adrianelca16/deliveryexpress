export const ESTADOS_ORDEN = {
  PAGO_POR_VERIFICAR: 'pago por verificar',
  PENDIENTE: 'pendiente',
  ACEPTADA: 'aceptada',
  PREPARADO: 'preparado',
  ASIGNADA: 'asignada',
  ESPERANDO_ACEPTACION: 'esperando aceptacion',
  EN_CAMINO: 'en camino',
  ENTREGADA: 'entregada',
  CONFIRMACION_ENTREGA: 'confirmación de entrega',
  CANCELADA: 'cancelada',
} as const;

const COLORES_ESTADO: Record<string, { light: string; dark: string }> = {
  'pago por verificar': { light: '#F59E0B', dark: '#FBBF24' },
  'pendiente': { light: '#9CA3AF', dark: '#D1D5DB' },
  'aceptada': { light: '#3B82F6', dark: '#60A5FA' },
  'preparado': { light: '#8B5CF6', dark: '#A78BFA' },
  'asignada': { light: '#F97316', dark: '#FB923C' },
  'esperando aceptacion': { light: '#EAB308', dark: '#FACC15' },
  'en camino': { light: '#14B8A6', dark: '#2DD4BF' },
  'entregada': { light: '#22C55E', dark: '#4ADE80' },
  'confirmación de entrega': { light: '#059669', dark: '#34D399' },
  'cancelada': { light: '#EF4444', dark: '#F87171' },
};

export const TERMINADOS = ['entregada', 'cancelada', 'confirmación de entrega'];

export const colorEstado = (estado: string | undefined, darkMode: boolean): string => {
  if (!estado) return darkMode ? '#D1D5DB' : '#9CA3AF';
  const c = COLORES_ESTADO[estado.toLowerCase()];
  return c ? (darkMode ? c.dark : c.light) : (darkMode ? '#D1D5DB' : '#9CA3AF');
};

export const estadoTerminado = (estado?: string) =>
  estado && TERMINADOS.includes(estado.toLowerCase());
