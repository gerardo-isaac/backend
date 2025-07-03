// Usuario
export interface User {
  id: number;
  name: string;
  email: string;
  password?: string; // Solo para registro/login
  phone_number?: string;
  created_at?: string;
}

// Dispositivo
export interface Device {
  id: number;
  name: string;
  user_id: number;
  api_key: string;
  created_at: string;
  sensors?: Sensor[];
}

// Sensor
export interface Sensor {
  id: number;
  name: string;
  type: 'temperatura' | 'gas' | 'magnetico';
  unit: string;
  threshold: number;
  device_id: number;
  created_at?: string;
  readings?: SensorReading[];
}

// Lectura de Sensor
export interface SensorReading {
  id: number;
  sensor_id: number;
  value: number;
  created_at: string;
  sensor?: Sensor;
}

// Alerta
export interface Alert {
  id: number;
  reading_id: number;
  device_id: number;
  type: string;
  status: 'activa' | 'resuelta' | 'falsa_alarma';
  message: string;
  notified_at: string;
  reading?: SensorReading;
  device?: Device;
}

// Notificación
export interface Notification {
  id: number;
  alert_id: number;
  user_id: number;
  channel: 'email' | 'sms' | 'push' | string;
  status: 'pendiente' | 'enviada' | 'leída';
  created_at: string;
  alert?: Alert;
}

// Configuración
export interface Settings {
  id: number;
  device_id: number;
  notification_method: 'email' | 'sms' | 'push' | string;
  sms_enabled?: boolean;
  created_at?: string;
  device?: Device;
}