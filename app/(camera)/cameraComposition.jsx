import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, Dimensions, Image } from "react-native";
import {
  Stack,
  useFocusEffect,
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  useCameraPermission,
  useCameraDevice,
  Camera,
  useCameraFormat,
} from "react-native-vision-camera";
import * as ImagePicker from "expo-image-picker";
import Reanimated, {
  useAnimatedProps,
  useSharedValue,
  interpolate,
  Extrapolation,
  runOnJS,
  useDerivedValue,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Slider from "@react-native-community/slider"; // スライダー用ライブラリをインポート
import FirebaseAuth from "@react-native-firebase/auth";
import Svg, { ClipPath, Rect } from "react-native-svg";

const auth = FirebaseAuth();
const height = Dimensions.get("window").height;
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isActive, setIsActive] = useState(false);
  const [showSlider, setShowSlider] = useState(false); // スライダーの表示状態を管理するステート
  const format = useCameraFormat(device, [{ photoAspectRatio: 4 / 3 }]);

  const params = useLocalSearchParams();
  const { imageUri, latitude, longitude, spotId, photoUri } = params;
  console.log(photoUri);
  const [tests, settest] = useState(imageUri);

  const zoom = useSharedValue(device?.neutralZoom ?? 1);
  const exposureSlider = useSharedValue(0);

  const zoomOffset = useSharedValue(0);
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      zoomOffset.value = zoom.value;
    })
    .onUpdate((event) => {
      const z = zoomOffset.value * event.scale;
      zoom.value = interpolate(
        z,
        [1, 10],
        [device.minZoom, device.maxZoom],
        Extrapolation.CLAMP
      );
    });

  const animatedProps = useAnimatedProps(
    () => ({
      zoom: zoom.value,
      exposure: exposureSlider.value,
    }),
    [zoom, exposureSlider]
  );

  const focus = useCallback((point) => {
    const c = cameraRef.current;
    if (c == null) return;
    c.focus(point);
  }, []);

  const tapGesture = Gesture.Tap().onEnd(({ x, y }) => {
    runOnJS(focus)({ x, y });
  });

  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => {
        setIsActive(false);
      };
    }, [])
  );

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  const onTakePicturePressed = async () => {
    try {
      if (cameraRef.current == null) {
        console.log("null");
        return;
      }
      const photo = await cameraRef.current.takePhoto();
      console.log(photo);
      router.navigate({
        pathname: "/editComposition",
        params: {
          imageUri: "file://" + photo.path,
          latitude: latitude,
          longitude: longitude,
          spotId: spotId,
          Composition: encodeURIComponent(photoUri),
        },
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  async function pickImage() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      router.navigate({
        pathname: "/editComposition",
        params: {
          imageUri: result.assets[0].uri,
          latitude: latitude,
          longitude: longitude,
          spotId: spotId,
        },
      });
    }
  }
  //exposuer slider
  const exposureValue = useDerivedValue(() => {
    if (device == null) return 0;
    return interpolate(
      exposureSlider.value,
      [
        -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
        10,
      ],
      [device.minExposure, 0, device.maxExposure]
    );
  }, [exposureSlider, device]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.cameraContainer}>
          <GestureDetector gesture={Gesture.Race(pinchGesture, tapGesture)}>
            <ReanimatedCamera
              ref={cameraRef}
              style={styles.camera}
              device={device}
              photo={true}
              format={format}
              isActive={isActive}
              animatedProps={animatedProps}
            />
          </GestureDetector>
          <View style={styles.cameraDisplayContainer}>
            {/* <Svg width="100%" height="100%"> */}
            {/* <ClipPath id="clipLeft">
                <Rect x="0" y="0" width="400" height="400" />
              </ClipPath>
              <ClipPath id="clipRight">
                <Rect x="50%" y="0%" width="400" height="400"></Rect>
              </ClipPath> */}
            <Image
              source={{ uri: photoUri }}
              style={styles.cameraDisplay}
              // preserveAspectRatio="xMidYMid slice"
              // clipPath="url(#clip)"
              // resizeMode="cover"
            />
            {/* </Svg> */}
          </View>
        </View>

        {showSlider && (
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={-10}
              maximumValue={10}
              value={exposureSlider.value}
              onValueChange={(value) => (exposureSlider.value = value)}
            />
          </View>
        )}

        <Pressable
          onPress={onTakePicturePressed}
          style={styles.captureButton}
        />
        <Pressable onPress={pickImage} style={styles.pickImageButton} />
        {/* exposuer exposure */}
        <Pressable
          // ボタンを押したときにスライダーの表示/非表示を切り替え
          onPress={() => setShowSlider(!showSlider)}
          style={styles.exposureButton}
        >
          <Reanimated.Text style={styles.exposureButtonText}>
            {exposureSlider.value.toFixed(1)} {/* スライダーの値を表示 */}
          </Reanimated.Text>
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  cameraContainer: {
    // flex: 0.8,
    width: "100%",
    height: "80%",
    // position: "absolute",
    // left: 0,
    // top: "10%",
    marginLeft: "auto",
    marginRight: "auto",
  },
  camera: {
    flex: 0.8,
    aspectRatio: 3 / 4,
  },
  sliderContainer: {
    position: "absolute",
    bottom: 150,
    left: 20,
    right: 20,
    alignItems: "stretch",
  },
  slider: {
    width: "100%",
    height: 40,
    marginBottom: 20,
  },
  captureButton: {
    position: "absolute",
    alignSelf: "center",
    bottom: 50,
    width: 75,
    height: 75,
    backgroundColor: "white",
    borderRadius: 75,
  },
  pickImageButton: {
    position: "absolute",
    alignSelf: "center",
    bottom: 50,
    left: 40,
    width: 45,
    height: 45,
    backgroundColor: "blue",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  exposureButton: {
    position: "absolute",
    top: 30,
    right: 20,
    width: 50,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  exposureButtonText: {
    color: "white",
    fontSize: 16,
  },
  cameraDisplay: {
    width: "auto",
    height: "100%",
    // objectFit: "cover",
    // objectPosition: "left top",
    // left: 0,
    // top: 0,
  },
  cameraDisplayContainer: {
    position: "absolute",
    // left: "50%",
    backgroundColor: "red",
    width: "100%", // 左半分
    height: "80%",
    overflow: "hidden",
  },
});
