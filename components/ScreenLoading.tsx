import { images } from '@/constants'
import { Animated, View } from 'react-native'
import { useThemeStore } from '@/store/theme.store'

export default function ScreenLoading() {
  const darkMode = useThemeStore((s) => s.darkMode)
  return (
    <View className={`flex-1 items-center justify-center ${darkMode ? "bg-gray-900" : "bg-white"}`}>
      <Animated.Image
        source={images.carga}
        style={{ width: 200, height: 200 }}
        resizeMode="contain"
      />
    </View>
  )
}