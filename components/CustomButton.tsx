import { TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import React from 'react'
import { CustomButtonProps } from '@/type'
import cn from "clsx";
import { useThemeStore } from '@/store/theme.store';

const CustomButton = ({ onPress, title = "Click Me", style, textStyle, leftIcon, isLoading = false }: CustomButtonProps) => {
  const { darkMode } = useThemeStore();

  return (
    <TouchableOpacity
      className={cn(
        'py-3.5 px-6 rounded-2xl self-center flex-row items-center justify-center gap-2',
        darkMode ? 'shadow-lg shadow-black/20' : 'shadow-lg shadow-purple-500/20',
        style || 'bg-primary w-full'
      )}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.85}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <>
          {leftIcon}
          <Text className={cn('text-white font-bold text-base', textStyle)}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}

export default CustomButton
