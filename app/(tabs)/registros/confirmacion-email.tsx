import { View, Text, TouchableOpacity, TextInput } from "react-native";
import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { API_URL } from "@/constants";
import CustomInput from "@/components/CustomInput";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import axios from "axios";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import PopupMessage from "@/components/PopupMessage";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import CustomButton from "@/components/CustomButton";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function ConfirmacionEmail() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const token = useAuthStore((state) => state.user?.token);
  const { darkMode } = useThemeStore();

  const [email, setEmail] = useState(user?.email || "");
  const [editandoEmail, setEditandoEmail] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(TextInput | null)[]>([]);

  const [cooldown, setCooldown] = useState(0);
  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
    setPopup({ visible: true, message, icon });
    setTimeout(() => setPopup((prev) => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (text: string, index: number) => {
    if (/^[0-9]?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      if (text && index < 5) inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleEnviarCodigo = async () => {
    if (!email) return showPopup("Por favor ingresa tu correo electrónico", "warning");
    if (cooldown > 0) return;

    try {
      const payload = { metodo: "email" };
      await axios.post(`${API_URL}/api/user/usuario/enviar-codigo/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showPopup("Código enviado a tu correo electrónico", "check-circle");
      setCooldown(300);
    } catch (err) {
      console.error(err);
      showPopup("Error al enviar el código. Intenta más tarde", "warning");
    }
  };

  const handleSubmit = async () => {
    const code = otp.join("");
    if (code.length < 6) return showPopup("Por favor ingresa los 6 dígitos del código", "warning");

    try {
      const payload = { metodo: "email", codigo: code };
      await axios.post(`${API_URL}/api/user/usuario/verificar-codigo/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showPopup("Correo verificado correctamente", "check-circle");
      router.replace("/(tabs)/registros/confirmacion-registro");
    } catch (err) {
      console.error(err);
      showPopup("Error al verificar el código", "warning");
    }
  };

  const handleGuardarEmail = async () => {
    if (!email) return showPopup("Ingresa un correo válido", "warning");

    try {
      const resp = await axios.patch(
        `${API_URL}/api/user/usuario/${user?.id}/`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (resp.status === 200) {
        showPopup("Correo actualizado correctamente", "check-circle");
        setUser({ email });
        setEditandoEmail(false);
      }
    } catch (err) {
      console.error("Error al actualizar correo:", err);
      showPopup("Error al actualizar correo", "error-outline");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <ScreenWrapper>
      <Header title="Verificar Email" showBack />

      <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} className="px-4">
        <Text className={`text-base mx-2 mt-3 font-semibold text-center mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Enviaremos un código a tu correo para confirmar la verificación.
        </Text>

        <Card className="mb-4"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
        >
          <CustomInput
            placeholder="Tu correo electrónico"
            value={email}
            label="Correo electrónico"
            editable={editandoEmail}
            onChangeText={setEmail}
          />

          <TouchableOpacity
            onPress={editandoEmail ? handleGuardarEmail : () => setEditandoEmail(true)}
            className="self-end mt-2"
          >
            <Text className="text-primary font-semibold">
              {editandoEmail ? "Guardar correo" : "Editar correo"}
            </Text>
          </TouchableOpacity>
        </Card>

        <CustomButton
          title={cooldown > 0 ? `Reintentar en ${formatTime(cooldown)}` : "Enviar Código"}
          onPress={handleEnviarCodigo}
          disabled={cooldown > 0}
          style={cooldown > 0 ? 'bg-gray-400' : 'bg-secondary'}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} className="px-4 mt-6">
        <Card className=""
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
        >
          <Text className={`text-center text-lg font-bold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Ingresa el código
          </Text>
          <View className="flex-row justify-center gap-3">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputs.current[index] = ref; }}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                className={`w-12 h-14 rounded-2xl text-center text-xl font-bold border-2 ${
                  darkMode
                    ? 'bg-gray-800 text-gray-100 border-gray-700'
                    : 'bg-white text-gray-800 border-purple-100'
                }`}
              />
            ))}
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(400).springify()} className="px-4 mt-6">
        <CustomButton
          title="Confirmar Código"
          onPress={handleSubmit}
          style="bg-primary"
        />
      </Animated.View>

      {cooldown === 0 && (
        <Animated.View entering={FadeInDown.delay(500).duration(400).springify()} className="mt-4">
          <TouchableOpacity onPress={handleEnviarCodigo}>
            <Text className="text-center text-primary font-semibold text-lg">
              ¿No recibiste el código? Reenviar
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </ScreenWrapper>
  );
}