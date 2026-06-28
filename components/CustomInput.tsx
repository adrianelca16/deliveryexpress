import { View, Text, TextInput, TouchableOpacity, Animated as RNAnimated } from 'react-native'
import { CustomInputProps } from '@/type'
import { useState, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '@/store/theme.store'

const CustomInput = ({
  placeholder = 'Enter Text',
  value,
  onChangeText,
  label,
  secureTextEntry = false,
  keyboardType = "default",
  editable,
}: CustomInputProps) => {
  const darkMode = useThemeStore((s) => s.darkMode)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [focused, setFocused] = useState(false)

  return (
    <View className="w-full">
      {label && (
        <Text className={`font-semibold text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          {label}
        </Text>
      )}

      <View
        className={`
          flex-row items-center rounded-xl px-4
          ${darkMode
            ? focused
              ? 'bg-gray-700 border border-blue-500'
              : 'bg-gray-800 border border-gray-700'
            : focused
              ? 'bg-white border border-blue-400'
              : 'bg-white border border-gray-200'
          }
        `}
      >
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          placeholder={placeholder}
          placeholderTextColor={darkMode ? "#6B7280" : "#9CA3AF"}
          className={`flex-1 py-3.5 text-base ${darkMode ? "text-white" : "text-gray-900"}`}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {secureTextEntry && (
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} className="p-1">
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={darkMode ? "#9CA3AF" : "#2563EB"}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default CustomInput
