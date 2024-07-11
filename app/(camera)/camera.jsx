import { useCallback, useEffect, useState, useRef } from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
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
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isActive, setIsActive] = useState(false);
  const format = useCameraFormat(device, [{ photoAspectRatio: 4 / 3 }]);

  const params = useLocalSearchParams();
  const { latitude, longitude, spotId } = params;

  Reanimated.addWhitelistedNativeProps({
    zoom: true,
  });
  const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
  const zoom = useSharedValue(device.neutralZoom);
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
  const animatedProps = useAnimatedProps(() => ({ zoom: zoom.value }), [zoom]);

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
      // setPhoto(photo);
      console.log(photo.path);
      router.navigate({
        pathname: "/edit",
        params: {
          imageUri: "file://" + photo.path,
          latitude: latitude,
          longitude: longitude,
          spotId: spotId,
        },
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  // const uploadPhoto = async () => {
  //   console.log(photo.Path);
  //   router.navigate({
  //     pathname: "/edit",
  //     params: { imageUri: photo.Path },
  //   });
  // };

  async function pickImage() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      // aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      // const randomNumber = Math.floor(Math.random() * 100) + 1;
      // const imagePath =
      //   "photo/image-" + new Date().getTime().toString() + randomNumber;
      // await reference.ref(imagePath).putFile(result.assets[0].uri);
      console.log(result.assets[0].uri);
      router.navigate({
        pathname: "/edit",
        params: {
          imageUri: result.assets[0].uri,
          latitude: latitude,
          longitude: longitude,
          spotId: spotId,
        },
      });
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

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

        {/* {photo && (
          <>
            <Image
              source={{ uri: photo.path }}
              style={StyleSheet.absoluteFill}
            />
            <FontAwesome5
              onPress={() => setPhoto(undefined)}
              name="arrow-left"
              size={25}
              color="red"
              style={{ position: "absolute", top: 50, left: 30 }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                paddingBottom: 50,
                backgroundColor: "rgba(0,0,0,0.40)",
              }}
            >
              <Pressable
                onPress={uploadPhoto}
                style={{
                  position: "absolute",
                  alignSelf: "center",
                  bottom: 50,
                  width: 75,
                  height: 75,
                  backgroundColor: "red",
                  borderRadius: 75,
                }}
              />
            </View>
          </>
        )} */}

        {/* {!photo && ( */}
        <>
          <Pressable
            onPress={onTakePicturePressed}
            style={{
              position: "absolute",
              alignSelf: "center",
              bottom: 50,
              width: 75,
              height: 75,
              backgroundColor: "white",
              borderRadius: 75,
            }}
          ></Pressable>
          <Pressable
            onPress={pickImage}
            style={{
              position: "absolute",
              alignSelf: "center",
              bottom: 50,
              left: 40,
              width: 45,
              height: 45,
              backgroundColor: "black",
              borderRadius: 25,
              justifyContent: "center",
              alignItems: "center",
            }}
          />
        </>
        {/* )} */}
      </View>
    </GestureHandlerRootView>
  );
}

// スタイル
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center", // 垂直方向の中央揃え
    alignItems: "center", // 水平方向の中央揃え
  },
  camera: {
    flex: 0.65,
    aspectRatio: 3 / 4, // アスペクト比を設定する（例: 3:4）
  },
});
