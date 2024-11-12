import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { useFocusEffect, router, useLocalSearchParams } from "expo-router";
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
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Icon from "react-native-vector-icons/Entypo";
import { TouchableOpacity } from "react-native";

const width = Dimensions.get("window").width;
const height = (width / 3) * 4;
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

export default function CameraScreen() {
  const cameraRef = useRef(null);
  // const device = useCameraDevice("back");
  const [cameraPosition, setCameraPosition] = useState("back");
  const device = useCameraDevice(cameraPosition);

  const { hasPermission, requestPermission } = useCameraPermission();
  const [isCrosshair, setIsCrosshair] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [showSlider, setShowSlider] = useState(false); // スライダーの表示状態を管理するステート
  const format = useCameraFormat(device, [{ photoAspectRatio: 4 / 3 }]);

  const params = useLocalSearchParams();
  const { latitude, longitude, spotId, point, spotNo } = params;

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
        return;
      }
      const photo = await cameraRef.current.takePhoto();
      router.navigate({
        pathname: "/edit",
        params: {
          imageUri: "file://" + photo.path,
          latitude: latitude,
          longitude: longitude,
          spotId: spotId,
          point: point,
          spotNo: spotNo,
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
        pathname: "/edit",
        params: {
          imageUri: result.assets[0].uri,
          latitude: latitude,
          longitude: longitude,
          spotId: spotId,
          point: point,
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

  const toggleGrid = () => {
    setIsCrosshair(!isCrosshair); // 十字線とグリッドを切り替え
  };

  const toggleCamera = () => {
    setCameraPosition((prev) => (prev === "back" ? "front" : "back")); //カメラ切り替え
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
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
          {/* 十字線または3x3グリッド */}
          <View style={styles.crosshairContainer}>
            {isCrosshair ? (
              // 十字線
              <>
                <View style={styles.verticalLine} />
                <View style={styles.horizontalLine} />
              </>
            ) : (
              // 3x3グリッド
              <>
                <View style={styles.verticalLine2} />
                <View style={styles.verticalLine3} />
                <View style={styles.horizontalLine2} />
                <View style={styles.horizontalLine3} />
              </>
            )}
          </View>
          {showSlider && (
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={-10}
                maximumValue={10}
                minimumTrackTintColor="white"
                maximumTrackTintColor="#ababab"
                thumbTintColor="white"
                value={exposureSlider.value}
                onValueChange={(value) => (exposureSlider.value = value)}
              />
            </View>
          )}
        </View>

        <Pressable
          onPress={onTakePicturePressed}
          style={styles.captureButton}
        />
        {/* 十字線切り替えボタン */}
        <TouchableOpacity style={styles.switchButton} onPress={toggleGrid}>
          <FontAwesome5
            name={isCrosshair ? "th-large" : "th"}
            size={35}
            color="#FFF"
          />
        </TouchableOpacity>
        {/* カメラ切り替えボタン */}
        <TouchableOpacity
          style={styles.switchCameraButton}
          onPress={toggleCamera}
        >
          <FontAwesome5 name="sync" size={24} color="#FFF" />
        </TouchableOpacity>

        <Pressable
          onPress={onTakePicturePressed}
          style={styles.captureButton}
        />
        <Pressable
          // ボタンを押したときにスライダーの表示/非表示を切り替え
          onPress={() => setShowSlider(!showSlider)}
          style={styles.exposureButton}
        >
          <Icon name="light-up" size={24} color="#FFF" />
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    alignItems: "center",
    backgroundColor: "black",
  },
  cameraContainer: {
    height: height,
    width: width,
    marginLeft: "auto",
    marginRight: "auto",
    backgroundColor: "black",
  },
  camera: {
    // flex: 0.8,
    aspectRatio: 3 / 4,
  },
  sliderContainer: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    alignItems: "stretch",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 5,
    borderRadius: 15,
  },
  slider: {
    width: "100%",
    height: 20,
    color: "white",
  },
  captureButton: {
    position: "absolute",
    alignSelf: "center",
    bottom: 40,
    width: 75,
    height: 75,
    backgroundColor: "white",
    borderRadius: 75,
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
  crosshairContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  verticalLine: {
    position: "absolute",
    left: "50%",
    width: 0.5,
    height: "100%",
    backgroundColor: "white",
  },
  verticalLine2: {
    position: "absolute",
    left: "66.66%",
    width: 0.5,
    height: "100%",
    backgroundColor: "white",
  },
  verticalLine3: {
    position: "absolute",
    left: "33.33 %",
    width: 0.5,
    height: "100%",
    backgroundColor: "white",
  },
  horizontalLine: {
    position: "absolute",
    top: "50%",
    width: "100%",
    height: 0.5,
    backgroundColor: "white",
  },
  horizontalLine2: {
    position: "absolute",
    top: "66.66%",
    width: "100%",
    height: 0.5,
    backgroundColor: "white",
  },
  horizontalLine3: {
    position: "absolute",
    top: "33.33%",
    width: "100%",
    height: 0.5,
    backgroundColor: "white",
  },
  switchButton: {
    position: "absolute",
    bottom: 45,
    left: 60,
    width: 50,
    height: 50,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
  },
  switchCameraButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
});
