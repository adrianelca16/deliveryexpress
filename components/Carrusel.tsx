import { images } from "@/constants";
import { useState, useRef, useEffect } from "react";
import { View, ScrollView, Image, TouchableOpacity, LayoutChangeEvent } from "react-native";

const slides = [
  { image: images.banner_1 },
  { image: images.banner_2 },
  { image: images.banner_3 },
];

export default function Carrusel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (width || 1));
    if (i !== activeIndex) setActiveIndex(i);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const scrollTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setActiveIndex(i);
  };

  useEffect(() => {
    if (width === 0) return;
    const interval = setInterval(() => {
      const next = (activeIndex + 1) % slides.length;
      scrollTo(next);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex, width]);

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <>
            <View className="overflow-hidden rounded-2xl">
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={{ height: 160 }}
              >
                {slides.map((slide, i) => (
                  <Image
                    key={i}
                    source={typeof slide.image === 'string' ? { uri: slide.image } : slide.image}
                    style={{ width, height: 160 }}
                    resizeMode="contain"
                  />
                ))}
              </ScrollView>
            </View>
          <View className="flex-row items-center justify-center w-full gap-1.5 mt-2">
            {slides.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => scrollTo(i)}
              >
                <View
                  className={`${i === activeIndex ? 'w-3 h-3 bg-blue-600' : 'w-2 h-2 bg-gray-300'}`}
                  style={{ borderRadius: 99 }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
