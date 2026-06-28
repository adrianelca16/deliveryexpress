import { View } from 'react-native';
import { useThemeStore } from '@/store/theme.store';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  style?: any;
}

export default function Card({ children, className = '', style }: CardProps) {
  const { darkMode } = useThemeStore();

  return (
    <View
      className={`
        rounded-2xl p-4
        ${darkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-white border border-blue-100/50'
        }
        ${darkMode
          ? 'shadow-lg shadow-black/20'
          : 'shadow-xl shadow-blue-900/5'
        }
        ${className}
      `}
      style={style}
    >
      {children}
    </View>
  );
}
