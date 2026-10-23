import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import { router } from "expo-router";

const slides = [
  {
    title: "Food intelligence",
    headline: "See your food with",
    accent: "clinical clarity.",
    body: "Recognize macros and portions. Make every meal more informed.",
    quote: "Let food be thy medicine and medicine be thy food.",
    author: "Hippocrates",
  },
  {
    title: "Metabolic alignment",
    headline: "Nutrition for your",
    accent: "unique physiology.",
    body: "Daily targets shaped by your metabolism, activity, and goals.",
    quote: "…you are either feeding disease or fighting it.",
    author: "Heather Morgan, MS, NMM",
  },
  {
    title: "Sustainable habits",
    headline: "Lasting health,",
    accent: "one plate at a time.",
    body: "Build balanced habits and see your progress, without the guesswork.",
    quote: "Small disciplines repeated with consistency every day…",
    author: "John C. Maxwell",
  },
];

export default function Welcome() {
  const { width, height } = useWindowDimensions();
  const compact = height < 760;
  const pager = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const activeRef = useRef(0);
  const lastSlide = activeSlide === slides.length - 1;

  useEffect(() => {
    pager.current?.scrollTo({ x: activeRef.current * width, animated: false });
  }, [width]);

  function goToSlide(index) {
    activeRef.current = index;
    setActiveSlide(index);
    pager.current?.scrollTo({ x: index * width, animated: true });
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8F3F2]" edges={["bottom"]}>
      <Image
        source={require("../assets/top_down_view_gourmet_healthy_grilled_chicken_breast_salad_bowl_with_ripe.png")}
        resizeMode="cover"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: height * 0.56,
        }}
        accessible={false}
      />
      <View
        className="flex-1 overflow-hidden rounded-t-[40px] bg-[#F8F3F2]"
        style={{ marginTop: height * 0.49 }}
      >
        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          onMomentumScrollEnd={(event) => {
            const index = Math.max(
              0,
              Math.min(
                slides.length - 1,
                Math.round(event.nativeEvent.contentOffset.x / width),
              ),
            );
            activeRef.current = index;
            setActiveSlide(index);
          }}
        >
          {slides.map((slide, index) => (
            <View
              key={slide.title}
              style={{
                width,
                paddingVertical: compact ? 10 : 18,
              }}
              accessibilityElementsHidden={activeSlide !== index}
              importantForAccessibility={
                activeSlide === index ? "auto" : "no-hide-descendants"
              }
            >
              <View
                className="w-full items-center self-center px-6"
                style={{
                  flex: 1,
                  maxWidth: 440,
                  justifyContent: "center",
                  gap: compact ? 10 : 14,
                }}
              >
                <Text
                  accessibilityRole="header"
                  style={{
                    fontFamily: "Manrope_700Bold",
                    fontWeight: "normal",
                    fontSize: compact ? 23 : 27,
                    lineHeight: compact ? 29 : 34,
                    letterSpacing: -0.5,
                    includeFontPadding: false,
                    textAlign: "center",
                    color: "#302820",
                  }}
                >
                  {slide.headline}
                  {"\n"}
                  <Text
                    style={{ color: "#9A4B27", fontFamily: "Manrope_700Bold" }}
                  >
                    {slide.accent}
                  </Text>
                </Text>
                <Text
                  style={{
                    fontFamily: "Manrope_400Regular",
                    fontSize: compact ? 13 : 15,
                    lineHeight: compact ? 19 : 23,
                    includeFontPadding: false,
                    textAlign: "center",
                    color: "#51463F",
                    maxWidth: 350,
                  }}
                >
                  {slide.body}
                </Text>
                <View
                  style={{
                    alignItems: "center",
                    maxWidth: 340,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Manrope_500Medium",
                      fontSize: compact ? 11 : 13,
                      lineHeight: compact ? 16 : 20,
                      includeFontPadding: false,
                      textAlign: "center",
                      color: "#78505A",
                    }}
                  >
                    “{slide.quote}”
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Manrope_600SemiBold",
                      fontSize: compact ? 10 : 11,
                      lineHeight: 16,
                      includeFontPadding: false,
                      textAlign: "center",
                      color: "#8A5A66",
                      marginTop: 4,
                    }}
                  >
                    — {slide.author}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View
          className="w-full max-w-lg self-center px-8"
          style={{ paddingBottom: compact ? 2 : 8 }}
        >
          <View
            className="flex-row items-center justify-center"
            accessibilityLabel={`Slide ${activeSlide + 1} of ${slides.length}`}
          >
            {slides.map((slide, index) => (
              <Pressable
                key={slide.title}
                onPress={() => goToSlide(index)}
                accessibilityRole="button"
                accessibilityLabel={`Go to slide ${index + 1}: ${slide.title}`}
                accessibilityState={{ selected: index === activeSlide }}
                style={{
                  minWidth: 36,
                  minHeight: compact ? 28 : 36,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: index === activeSlide ? 22 : 6,
                    height: 6,
                    borderRadius: 4,
                    backgroundColor:
                      index === activeSlide ? "#9A4B27" : "#D9CBC0",
                  }}
                />
              </Pressable>
            ))}
          </View>
          <Button
            mode="contained"
            onPress={() =>
              lastSlide
                ? router.push("/(auth)/register")
                : goToSlide(activeSlide + 1)
            }
            buttonColor="#9A4B27"
            textColor="#FFFFFF"
            style={{ borderRadius: 28 }}
            contentStyle={{ minHeight: compact ? 48 : 56 }}
            labelStyle={{
              fontFamily: "Manrope_700Bold",
              fontSize: 16,
              letterSpacing: 0.5,
            }}
          >
            {lastSlide ? "Let's Get Started" : "Continue"}
          </Button>
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            accessibilityRole="link"
            accessibilityLabel="Already have an account? Sign in"
            className="items-center justify-center px-2"
            style={{ minHeight: compact ? 36 : 44 }}
          >
            <Text
              style={{
                fontFamily: "Manrope_400Regular",
                fontSize: 12,
                lineHeight: 20,
                textAlign: "center",
                color: "#665B55",
              }}
            >
              Already have an account?{" "}
              <Text
                style={{
                  fontFamily: "Manrope_600SemiBold",
                  color: "#8A5A66",
                  textDecorationLine: "underline",
                }}
              >
                Sign In
              </Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
