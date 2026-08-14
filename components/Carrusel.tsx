import { images, API_URL } from "@/constants";
import { useState, useRef, useEffect } from "react";
import { View, ScrollView, Image, TouchableOpacity, LayoutChangeEvent } from "react-native";
import { useAuthStore } from "@/store/auth.store";
import axios from "axios";

const fallbackSlides = [
  { imagen_url: images.banner_1 },
  { imagen_url: images.banner_2 },
  { imagen_url: images.banner_3 },
];

export default function Carrusel() {
  const [slides, setSlides] = useState<{ imagen_url: string | number }[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const token = useAuthStore((s) => s.user?.token);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/gestion/imagenes-index/activas/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.length > 0) {
          setSlides(res.data.map((i: any) => ({ imagen_url: i.imagen_url })));
          return;
        }
      } catch {}
      setSlides(fallbackSlides);
    })();
  }, []);

  useEffect(() => {
    if (slides.length === 0 || width === 0) return;
    const interval = setInterval(() => {
      const next = (activeIndex + 1) % slides.length;
      scrollTo(next);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex, width, slides.length]);

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

  if (slides.length === 0) return null;

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
                    source={typeof slide.imagen_url === 'string' ? { uri: slide.imagen_url } : slide.imagen_url}
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
