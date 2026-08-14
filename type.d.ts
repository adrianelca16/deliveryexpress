export interface User {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    token: string;
    telefono: string;
    foto_perfil: string;
    foto_perfil_url: string;
    verificacion_email: boolean;
    verificacion_telefono: boolean;
    verificacion_identidad: boolean;
}

export interface TabBarIconProps {
    focused: boolean;
    icon: ImageSourcePropType;
    title: string;
}

interface PaymentInfoStripeProps {
    label: string;
    value: string;
    labelStyle?: string;
    valueStyle?: string;
}

interface CustomButtonProps {
    onPress?: () => void;
    title?: string;
    style?: string;
    leftIcon?: React.ReactNode;
    textStyle?: string;
    isLoading?: boolean;
    disabled?: boolean;
}

interface CustomHeaderProps {
    title?: string;
}

interface CustomInputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    label: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
    editable?: boolean;
}

interface ProfileFieldProps {
    label: string;
    value: string;
    icon: ImageSourcePropType;
}

interface CreateUserPrams {
    email: string;
    password: string;
    name: string;
}

interface SignInParams {
    email: string;
    password: string;
}

interface GetMenuParams {
    category: string;
    query: string;
}

interface Role { id: string; nombre: string; descripcion: string; icons: string; };

interface Estado { id: string; nombre: string, descripcion: string };

interface Categoria { id: string; nombre: string, descripcion: string, imagen: string, color?: string, imagen_url?: string };

interface Restaurante {
  id: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  latitud: number;
  longitud: number;
  horario_apertura: string;
  horario_cierre: string;
  calificacion_promedio: number;
  estado: string;
  usuario: string;
  imagen_url: string;
  capacidad: string;
  pagina_web: string;
  telefono: string;
  categoria: Categoria | null;
}

interface Plato {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    imagen: string;
    disponible: boolean;
    restaurante: string;
    imagen_url: string;
    restaurante_nombre: string;
    precio_descuento: number;
    calificacion_promedio?: number;
}

interface MetodosPagos {
    id: string;
    nombre: string;
    descripcion: string;
    icons: string;
}

interface Direccion {
  id: string;
  usuario: string;
  nombre: string;
  direccion_texto: string;
  latitud: number;
  longitud: number;
  es_predeterminada: boolean;
}

interface OrdenDetalle {
    cantidad: number;
    descuento?: number;
    id: string;
    plato: string,
    plato_nombre: string;
    precio_unitario: number;
    subtotal: number;
    plato_imagen: string;
    extras_detalle?: { id: string; nombre: string; precio_adicional: number }[];
}

interface Orden {
  id: string;
  restaurante: string;
  creado_en: string;
  total: number;
  estado: string;
  restaurante_nombre?: string;
  estado_nombre?: string;
  cliente_nombre?: string;
  numero_orden?: number;
  direccion_entrega?: string;
  latitud?: number;
  longitud?: number;
  detalles: OrdenDetalle[];
  restaurante_imagen?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  cliente_foto?: string;
  subtotal?: number;
  iva?: number;
  costo_envio?: number;
  monto_conductor?: number;
  restaurante_latitud?: number;
  restaurante_longitud?: number;
  monto_restaurante?: number;
  preparado_marcado?: boolean;
  conductor_nombre?: string;
  conductor_foto?: string;
  conductor_telefono?: string;
  conductor_latitud?: number;
  conductor_longitud?: number;
  conductor_calificacion?: number;
  conductor_calificacion_count?: number;
  restaurante_calificacion?: number;
  restaurante_calificacion_count?: number;
}

interface Movimiento {
  id: string;
  tipo: string;
  monto: number;
  descripcion: string;
  creado_en: string;
}

interface WalletData {
  id: string;
  saldo: number;
  movimientos: Movimiento[];
  usuario?: string;
  creado_en?: string;
}
