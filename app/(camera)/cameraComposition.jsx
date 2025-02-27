import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  Modal,
  Text,
  FlatList,
} from "react-native";
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
import Slider from "@react-native-community/slider";
import { TouchableOpacity } from "react-native";

const width = Dimensions.get("window").width;
const wholeHeight = Dimensions.get("window").height;
const height = (width / 3) * 4;
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

export default function CameraScreen() {
  const flatListRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(null); // 選択されたアイテムのインデックスを管理
  const data = [
    {
      key: "top",
      icon: require("./../image/top.png"),
      onPress: () => handleTopPress(),
    },
    {
      key: "bottom",
      icon: require("./../image/bottom.png"),
      onPress: () => handleBottomPress(),
    },
    {
      key: "left",
      icon: require("./../image/left.png"),
      onPress: () => handleLeftPress(),
    },
    {
      key: "right",
      icon: require("./../image/right.png"),
      onPress: () => handleRightPress(),
    },
    {
      key: "top1",
      icon: require("./../image/topTop.png"),
      onPress: () => handleTopFirstQuarterPress(),
    },
    {
      key: "top2",
      icon: require("./../image/topBottom.png"),
      onPress: () => handleTopSecondQuarterPress(),
    },
    {
      key: "top3",
      icon: require("./../image/bottomTop.png"),
      onPress: () => handleTopThirdQuarterPress(),
    },
    {
      key: "top4",
      icon: require("./../image/bottomBottom.png"),
      onPress: () => handleTopFourthQuarterPress(),
    },
    {
      key: "left1",
      icon: require("./../image/leftLeft.png"),
      onPress: () => handleLeftFirstQuarterPress(),
    },
    {
      key: "left2",
      icon: require("./../image/leftRight.png"),
      onPress: () => handleLeftSecondQuarterPress(),
    },
    {
      key: "right3",
      icon: require("./../image/rightLeft.png"),
      onPress: () => handleRightThirdQuarterPress(),
    },
    {
      key: "right4",
      icon: require("./../image/rightRight.png"),
      onPress: () => handleRightFourthQuarterPress(),
    },
  ];

  const cameraRef = useRef(null);
  const [cameraPosition, setCameraPosition] = useState("back");
  const device = useCameraDevice(cameraPosition);
  const [isModalVisible, setIsModalVisible] = useState(false); //modalの制御
  const { hasPermission, requestPermission } = useCameraPermission();

  const [topLeftDisplay, setTopLeftDisplay] = useState(true);
  const [bottomLeftDisplay, setBottomLeftDisplay] = useState(true);
  const [topRightDisplay, setTopRightDisplay] = useState(false);
  const [bottomRightDisplay, setBottomRightDisplay] = useState(false);
  const [LeftFirstQuarterDisplay, setLeftFirstQuarterDisplay] = useState(false);
  const [LeftSecondQuarterDisplay, setLeftSecondQuarterDisplay] =
    useState(false);
  const [RightThirdQuarterDisplay, setRightThirdQuarterDisplay] =
    useState(false);
  const [RightFourthQuarterDisplay, setRightFourthQuarterDisplay] =
    useState(false);
  const [TopFirstQuarterDisplay, setTopFirstQuarterDisplay] = useState(false);
  const [TopSecondQuarterDisplay, setTopSecondQuarterDisplay] = useState(false);
  const [TopThirdQuarterDisplay, setTopThirdQuarterDisplay] = useState(false);
  const [TopFourthQuarterDisplay, setTopFourthQuarterDisplay] = useState(false);

  const [isCrosshair, setIsCrosshair] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [showSlider, setShowSlider] = useState(false); // スライダーの表示状態を管理するステート
  const [key, setKey] = useState(0); // 強制リロード用のキー

  const format = useCameraFormat(device, [{ photoAspectRatio: 4 / 3 }]);

  const params = useLocalSearchParams();
  const { latitude, longitude, spotId, photoUri, postId } = params;

  const zoom = useSharedValue(device?.neutralZoom ?? 1);
  const exposureSlider = useSharedValue(0);

  const zoomOffset = useSharedValue(0);
  const [focusPoint, setFocusPoint] = useState(null);
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      zoomOffset.value = zoom.value; // 現在のズーム値を保持
    })
    .onUpdate((event) => {
      const newZoom = zoomOffset.value * event.scale;
      zoom.value = interpolate(
        newZoom,
        [1, 5], // ここでズーム範囲を設定。1を最低、5を最大に調整するなど。
        [device.minZoom, device.maxZoom],
        Extrapolation.CLAMP // デバイスの最小・最大ズーム値を超えないようにする
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
    setFocusPoint(point); // タップ位置を状態に保存
    setTimeout(() => setFocusPoint(null), 1000); // 1秒後にフォーカスポイントを消す
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
    const initializeCamera = async () => {
      if (!hasPermission) {
        await requestPermission();
      }

      // カメラ権限が付与され、デバイスが利用可能になったときに再レンダリング
      if (hasPermission && device) {
        setKey((prevKey) => prevKey + 1);
      }
    };

    initializeCamera();
  }, [hasPermission, device]);

  const onTakePicturePressed = async () => {
    try {
      if (cameraRef.current == null) {
        return;
      }
      const photo = await cameraRef.current.takePhoto();
      router.navigate({
        pathname: "/editComposition",
        params: {
          imageUri: "file://" + photo.path,
          latitude: latitude,
          longitude: longitude,
          spotId: spotId,
          Composition: encodeURIComponent(photoUri),
          topRightdirection: topRightDisplay,
          topLeftdirection: topLeftDisplay,
          bottomRightdirection: bottomRightDisplay,
          bottomLeftdirection: bottomLeftDisplay,
          leftFirstdirection: LeftFirstQuarterDisplay,
          leftSeconddirection: LeftSecondQuarterDisplay,
          rightThirddirection: RightThirdQuarterDisplay,
          rightFourthdirection: RightFourthQuarterDisplay,
          topFirstdirection: TopFirstQuarterDisplay,
          topSeconddirection: TopSecondQuarterDisplay,
          topThirddirection: TopThirdQuarterDisplay,
          topFourthdirection: TopFourthQuarterDisplay,
          postId: postId,
        },
      });
    } catch (error) {
      console.log(error.message);
    }
  };

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

  const toggleDisplay = (position) => {
    switch (position) {
      case "topLeft":
        setTopLeftDisplay(!topLeftDisplay);
        break;
      case "bottomLeft":
        setBottomLeftDisplay(!bottomLeftDisplay);
        break;
      case "topRight":
        setTopRightDisplay(!topRightDisplay);
        break;
      case "bottomRight":
        setBottomRightDisplay(!bottomRightDisplay);
        break;
      default:
        break;
    }
  };
  // 左側のボタンを押した時の処理
  const handleTopPress = () => {
    setTopLeftDisplay(true);
    setTopRightDisplay(true);
    setBottomLeftDisplay(false);
    setBottomRightDisplay(false);
    setLeftFirstQuarterDisplay(false);
    setLeftSecondQuarterDisplay(false);
    setRightThirdQuarterDisplay(false);
    setRightFourthQuarterDisplay(false);
    setTopFirstQuarterDisplay(false);
    setTopSecondQuarterDisplay(false);
    setTopThirdQuarterDisplay(false);
    setTopFourthQuarterDisplay(false);
  };

  const handleBottomPress = () => {
    setTopLeftDisplay(false);
    setTopRightDisplay(false);
    setBottomLeftDisplay(true);
    setBottomRightDisplay(true);
    setLeftFirstQuarterDisplay(false);
    setLeftSecondQuarterDisplay(false);
    setRightThirdQuarterDisplay(false);
    setRightFourthQuarterDisplay(false);
    setTopFirstQuarterDisplay(false);
    setTopSecondQuarterDisplay(false);
    setTopThirdQuarterDisplay(false);
    setTopFourthQuarterDisplay(false);
  };

  const handleLeftPress = () => {
    setTopLeftDisplay(true);
    setTopRightDisplay(false);
    setBottomLeftDisplay(true);
    setBottomRightDisplay(false);
    setLeftFirstQuarterDisplay(false);
    setLeftSecondQuarterDisplay(false);
    setRightThirdQuarterDisplay(false);
    setRightFourthQuarterDisplay(false);
    setTopFirstQuarterDisplay(false);
    setTopSecondQuarterDisplay(false);
    setTopThirdQuarterDisplay(false);
    setTopFourthQuarterDisplay(false);
  };

  const handleRightPress = () => {
    setTopLeftDisplay(false);
    setTopRightDisplay(true);
    setBottomLeftDisplay(false);
    setBottomRightDisplay(true);
    setLeftFirstQuarterDisplay(false);
    setLeftSecondQuarterDisplay(false);
    setRightThirdQuarterDisplay(false);
    setRightFourthQuarterDisplay(false);
    setTopFirstQuarterDisplay(false);
    setTopSecondQuarterDisplay(false);
    setTopThirdQuarterDisplay(false);
    setTopFourthQuarterDisplay(false);
  };

  const handleLeftFirstQuarterPress = () => {
    setTopLeftDisplay(false);
    setTopRightDisplay(false);
    setBottomLeftDisplay(false);
    setBottomRightDisplay(false);
    setLeftFirstQuarterDisplay(true);
    setLeftSecondQuarterDisplay(false);
    setRightThirdQuarterDisplay(false);
    setRightFourthQuarterDisplay(false);
    setTopFirstQuarterDisplay(false);
    setTopSecondQuarterDisplay(false);
    setTopThirdQuarterDisplay(false);
    setTopFourthQuarterDisplay(false);
  };

  const handleLeftSecondQuarterPress = () => {
    setTopLeftDisplay(false);
    setTopRightDisplay(false);
    setBottomLeftDisplay(false);
    setBottomRightDisplay(false);
    setLeftFirstQuarterDisplay(false);
    setLeftSecondQuarterDisplay(true);
    setRightThirdQuarterDisplay(false);
    setRightFourthQuarterDisplay(false);
    setTopFirstQuarterDisplay(false);
    setTopSecondQuarterDisplay(false);
    setTopThirdQuarterDisplay(false);
    setTopFourthQuarterDisplay(false);
  };

  const handleRightThirdQuarterPress = () => {
    setTopLeftDisplay(false);
    setTopRightDisplay(false);
    setBottomLeftDisplay(false);
    setBottomRightDisplay(false);
    setLeftFirstQuarterDisplay(false);
    setLeftSecondQuarterDisplay(false);
    setRightThirdQuarterDisplay(true);
    setRightFourthQuarterDisplay(false);
    setTopFirstQuarterDisplay(false);
    setTopSecondQuarterDisplay(false);
    setTopThirdQuarterDisplay(false);
    setTopFourthQuarterDisplay(false);
  };

  const handleRightFourthQuarterPress = () => {
    setTopLeftDisplay(false);
    setTopRightDisplay(false);
    setBottomLeftDisplay(false);
    setBottomRightDisplay(false);
    setLeftFirstQuarterDisplay(false);
    setLeftSecondQuarterDisplay(false);
    setRightThirdQuarterDisplay(false);
    setRightFourthQuarterDisplay(true);
    setTopFirstQuarterDisplay(false);
    setTopSecondQuarterDisplay(false);
    setTopThirdQuarterDisplay(false);
    setTopFourthQuarterDisplay(false);
  };

  const handleTopFirstQuarterPress = () => {
    setTopLeftDisplay(false);
    setTopRightDisplay(false);
    setBottomLeftDisplay(false);
    setBottomRightDisplay(false);
    setLeftFirstQuarterDisplay(false);
    setLeftSecondQuarterDisplay(false);
    setRightThirdQuarterDisplay(false);
    setRightFourthQuarterDisplay(false);
    setTopFirstQuarterDisplay(true);
    setTopSecondQuarterDisplay(false);
    setTopThirdQuarterDisplay(false);
    setTopFourthQuarterDisplay(false);
  };

  const handleTopSecondQuarterPress = () => {
    setTopLeftDisplay(false);
    setTopRightDisplay(false);
    setBottomLeftDisplay(false);
    setBottomRightDisplay(false);
    setLeftFirstQuarterDisplay(false);
    setLeftSecondQuarterDisplay(false);
    setRightThirdQuarterDisplay(false);
    setRightFourthQuarterDisplay(false);
    setTopFirstQuarterDisplay(false);
    setTopSecondQuarterDisplay(true);
    setTopThirdQuarterDisplay(false);
    setTopFourthQuarterDisplay(false);
  };

  const handleTopThirdQuarterPress = () => {
    setTopLeftDisplay(false);
    setTopRightDisplay(false);
    setBottomLeftDisplay(false);
    setBottomRightDisplay(false);
    setLeftFirstQuarterDisplay(false);
    setLeftSecondQuarterDisplay(false);
    setRightThirdQuarterDisplay(false);
    setRightFourthQuarterDisplay(false);
    setTopFirstQuarterDisplay(false);
    setTopSecondQuarterDisplay(false);
    setTopThirdQuarterDisplay(true);
    setTopFourthQuarterDisplay(false);
  };

  const handleTopFourthQuarterPress = () => {
    setTopLeftDisplay(false);
    setTopRightDisplay(false);
    setBottomLeftDisplay(false);
    setBottomRightDisplay(false);
    setLeftFirstQuarterDisplay(false);
    setLeftSecondQuarterDisplay(false);
    setRightThirdQuarterDisplay(false);
    setRightFourthQuarterDisplay(false);
    setTopFirstQuarterDisplay(false);
    setTopSecondQuarterDisplay(false);
    setTopThirdQuarterDisplay(false);
    setTopFourthQuarterDisplay(true);
  };

  const toggleGrid = () => {
    setIsCrosshair(!isCrosshair); // 十字線とグリッドを切り替え
  };

  const toggleCamera = () => {
    setCameraPosition((prev) => (prev === "back" ? "front" : "back"));
  };

  const toggleModalVisibility = () => {
    setIsModalVisible((prev) => !prev); //modalの表示状況の制御
  };

  const handlePress = (index) => {
    setSelectedIndex(index); // アイテムを選択したときに選択されたインデックスを更新
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
    // 選択したアイテムのonPressを呼び出す
    if (data[index].onPress) {
      data[index].onPress();
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.cameraContainer}>
          <GestureDetector gesture={Gesture.Race(pinchGesture, tapGesture)}>
            <ReanimatedCamera
              key={key}
              ref={cameraRef}
              style={styles.camera}
              device={device}
              photo={true}
              format={format}
              isActive={isActive}
              animatedProps={animatedProps}
              outputOrientation={"preview"}
            />
          </GestureDetector>
          {/* 左上 */}
          {topLeftDisplay && (
            <View style={styles.modalButtonTopLeft}>
              <Image source={{ uri: photoUri }} style={styles.topLeftDisplay} />
            </View>
          )}
          {/* 左下 */}
          {bottomLeftDisplay && (
            <View style={styles.modalButtonBottomLeft}>
              <Image
                source={{ uri: photoUri }}
                style={styles.bottomLeftDisplay}
              />
            </View>
          )}
          {/* 右上 */}
          {topRightDisplay && (
            <View style={styles.modalButtonTopRight}>
              <Image
                source={{ uri: photoUri }}
                style={styles.topRightDisplay}
              />
            </View>
          )}
          {/* 右下 */}
          {bottomRightDisplay && (
            <View style={styles.modalButtonBottomRight}>
              <Image
                source={{ uri: photoUri }}
                style={styles.bottomRightDisplay}
              />
            </View>
          )}
          {/* 左左 */}
          {LeftFirstQuarterDisplay && (
            <View style={styles.modalButtonLeftFirstQuarter}>
              <Image
                source={{ uri: photoUri }}
                style={styles.LeftFirstQuarterDisplay}
              />
            </View>
          )}
          {/* 左右 */}
          {LeftSecondQuarterDisplay && (
            <View style={styles.modalButtonLeftSecondQuarter}>
              <Image
                source={{ uri: photoUri }}
                style={styles.LeftSecondQuarterDisplay}
              />
            </View>
          )}
          {/* 右左 */}
          {RightThirdQuarterDisplay && (
            <View style={styles.modalButtonRightThirdQuarter}>
              <Image
                source={{ uri: photoUri }}
                style={styles.RightThirdQuarterDisplay}
              />
            </View>
          )}
          {/* 右右 */}
          {RightFourthQuarterDisplay && (
            <View style={styles.modalButtonRightFourthQuarter}>
              <Image
                source={{ uri: photoUri }}
                style={styles.RightFourthQuarterDisplay}
              />
            </View>
          )}
          {/* 上上 */}
          {TopFirstQuarterDisplay && (
            <View style={styles.modalButtonTopFirstQuarter}>
              <Image
                source={{ uri: photoUri }}
                style={styles.TopFirstQuarterDisplay}
              />
            </View>
          )}
          {/* 上下 */}
          {TopSecondQuarterDisplay && (
            <View style={styles.modalButtonTopSecondQuarter}>
              <Image
                source={{ uri: photoUri }}
                style={styles.TopSecondQuarterDisplay}
              />
            </View>
          )}
          {/* 下上 */}
          {TopThirdQuarterDisplay && (
            <View style={styles.modalButtonTopThirdQuarter}>
              <Image
                source={{ uri: photoUri }}
                style={styles.TopThirdQuarterDisplay}
              />
            </View>
          )}
          {/* 下下 */}
          {TopFourthQuarterDisplay && (
            <View style={styles.modalButtonTopFourthQuarter}>
              <Image
                source={{ uri: photoUri }}
                style={styles.TopFourthQuarterDisplay}
              />
            </View>
          )}
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
            <View style={styles.verticalSliderContainer}>
              <Text style={styles.sliderLabelText}>-</Text>
              <Slider
                style={styles.verticalSlider}
                minimumValue={-10}
                maximumValue={10}
                minimumTrackTintColor="white"
                maximumTrackTintColor="#ababab"
                thumbTintColor="yellow"
                value={exposureSlider.value}
                onValueChange={(value) => (exposureSlider.value = value)}
              />
              <Text style={styles.sliderLabelText}>+</Text>
            </View>
          )}
          {focusPoint && (
            <View
              style={{
                position: "absolute",
                left: focusPoint.x - 25,
                top: focusPoint.y - 25,
                width: 50,
                height: 50,
                borderWidth: 2,
                borderColor: "white",
                borderRadius: 25,
              }}
            />
          )}
        </View>

        <View style={styles.chooseHarfDisplayContainer}>
          <FlatList
            ref={flatListRef}
            data={data}
            horizontal
            keyExtractor={(item) => item.key}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => handlePress(index)}
                style={[
                  styles.chooseDisplayButton,
                  selectedIndex === index && styles.selectedButton, // 選択されたアイテムに背景色を適用
                ]}
              >
                <Image source={item.icon} style={styles.image} />
                {/* <FontAwesome5 name={item.icon} size={30} color="#FFF" /> */}
              </TouchableOpacity>
            )}
            contentContainerStyle={{
              alignItems: "center",
              paddingHorizontal: "50%",
            }}
            showsHorizontalScrollIndicator={false}
          />
        </View>
        {/* 詳細選択ボタンの追加 */}
        <TouchableOpacity
          onPress={toggleModalVisibility}
          style={styles.colonButton}
        >
          <Image
            source={require("./../image/CameraMenu.png")}
            style={styles.CameraMenu}
          />
        </TouchableOpacity>

        {/* 十字線切り替えボタン */}
        <TouchableOpacity style={styles.switchButton} onPress={toggleGrid}>
          <Image
            source={
              isCrosshair
                ? require("./../image/Grigline3.png")
                : require("./../image/Grigline2.png")
            }
            style={styles.CameraButton}
          />
        </TouchableOpacity>
        {/* カメラ切り替えボタン */}
        <TouchableOpacity
          style={styles.switchCameraButton}
          onPress={toggleCamera}
        >
          <Image
            source={require("./../image/Camerachange.png")}
            style={styles.CameraButton}
          />
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
          <Image
            source={require("./../image/Brightness.png")}
            style={styles.Brightness}
          />
        </Pressable>
      </View>
      <Modal animationType="fade" transparent={true} visible={isModalVisible}>
        <View style={styles.modalOverlay}>
          {/* カメラコンテナ */}
          <View style={styles.modalCameraContainer}>
            {/* 十字線 */}
            <View style={styles.crosshairContainer}>
              <View style={styles.verticalLine} />
              <View style={styles.horizontalLine} />
            </View>

            {/* 左上、左下、右上、右下のボタン */}
            <TouchableOpacity
              style={[styles.modalButtonTopLeft]}
              onPress={() => toggleDisplay("topLeft")}
            />
            <TouchableOpacity
              style={[styles.modalButtonTopRight]}
              onPress={() => toggleDisplay("topRight")}
            />
            <TouchableOpacity
              style={[styles.modalButtonBottomLeft]}
              onPress={() => toggleDisplay("bottomLeft")}
            />
            <TouchableOpacity
              style={[styles.modalButtonBottomRight]}
              onPress={() => toggleDisplay("bottomRight")}
            />
          </View>
          <TouchableOpacity
            onPress={toggleModalVisibility}
            style={styles.modalColonButton}
          >
            <Image
              source={require("./../image/Close.png")}
              style={styles.actionButton}
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
    backgroundColor: "black",
  },
  cameraContainer: {
    width: "100%",
    height: height,
    marginLeft: "auto",
    marginRight: "auto",
    backgroundColor: "black",
  },
  camera: {
    // flex: 0.75,
    aspectRatio: 3 / 4,
  },
  //スライダー関連
  sliderLabels: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 15, // スライダーの左右に余白を追加
  },
  sliderLabelText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    transform: [{ rotate: "-90deg" }],
  },
  verticalSliderContainer: {
    backgroundColor: "rgba(0,0,0,0.4)",
    position: "absolute",
    right: "-25%", // 画面の右端に配置
    top: "47.5%", // 縦方向の中央付近に配置
    width: height * 0.5, // 高さを調整
    height: 30,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    transform: [{ rotate: "-90deg" }], // 縦に回転させる
  },
  verticalSlider: {
    width: "90%",
    height: 100,
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
    top: 20,
    right: 20,
    width: 50,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  colonButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  exposureButtonText: {
    color: "white",
    fontSize: 16,
  },
  chooseHarfDisplayContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    position: "absolute",
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    height: 50,
    bottom: wholeHeight * 0.22,
    width: "100%",
  },
  chooseDisplayButton: {
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    width: 50,
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
    left: 40,
    borderRadius: 35,
  },
  switchCameraButton: {
    position: "absolute",
    bottom: 45,
    right: 40,
    borderRadius: 35,
  },
  modalOverlay: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)", // モーダル全体の背景を暗くする
  },
  modalCameraContainer: {
    width: "100%", // カメラコンテナと同じ幅
    height: height, // カメラコンテナと同じ高さ
    marginLeft: "auto",
    marginRight: "auto",
  },
  modalColonButton: {
    position: "absolute",
    top: 20, // colonButtonと同じ位置に合わせる
    right: 20, // colonButtonと同じ位置に合わせる
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
  },
  actionButton: {
    width: 40,
    height: 40,
    padding: 5,
    margin: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
  },
  selectedButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)", // 選択されたアイテムの背景色（薄灰色）
  },
  modalButtonTopLeft: {
    position: "absolute",
    width: "50%",
    height: "50%",
    overflow: "hidden",
  },
  modalButtonTopRight: {
    position: "absolute",
    width: "50%",
    height: "50%",
    overflow: "hidden",
    left: "50%",
  },
  modalButtonBottomLeft: {
    position: "absolute",
    width: "50%",
    height: "50%",
    overflow: "hidden",
    top: "50%",
  },
  modalButtonBottomRight: {
    position: "absolute",
    width: "50%",
    height: "50%",
    overflow: "hidden",
    top: "50%",
    left: "50%",
  },
  modalButtonLeftFirstQuarter: {
    position: "absolute",
    width: "25%",
    height: "100%",
    overflow: "hidden",
  },
  modalButtonLeftSecondQuarter: {
    position: "absolute",
    width: "25%",
    height: "100%",
    overflow: "hidden",
    left: "25%",
  },
  modalButtonRightThirdQuarter: {
    position: "absolute",
    width: "25%",
    height: "100%",
    overflow: "hidden",
    left: "50%",
  },
  modalButtonRightFourthQuarter: {
    position: "absolute",
    width: "25%",
    height: "100%",
    overflow: "hidden",
    left: "75%",
  },
  modalButtonTopFirstQuarter: {
    position: "absolute",
    width: "100%",
    height: "25%",
    overflow: "hidden",
  },
  modalButtonTopSecondQuarter: {
    position: "absolute",
    width: "100%",
    height: "25%",
    overflow: "hidden",
    top: "25%",
  },
  modalButtonTopThirdQuarter: {
    position: "absolute",
    width: "100%",
    height: "25%",
    overflow: "hidden",
    top: "50%",
  },
  modalButtonTopFourthQuarter: {
    position: "absolute",
    width: "100%",
    height: "25%",
    overflow: "hidden",
    top: "75%",
  },
  topLeftDisplay: {
    width: width,
    height: height,
  },
  topRightDisplay: {
    width: width,
    height: height,
    transform: [{ translateX: -width / 2 }],
  },
  bottomLeftDisplay: {
    width: width,
    height: height,
    transform: [{ translateY: -height / 2 }],
  },
  bottomRightDisplay: {
    width: width,
    height: height,
    transform: [{ translateX: -width / 2 }, { translateY: -height / 2 }],
  },
  LeftFirstQuarterDisplay: {
    width: width,
    height: height,
  },
  LeftSecondQuarterDisplay: {
    width: width,
    height: height,
    transform: [{ translateX: -width / 4 }],
  },
  RightThirdQuarterDisplay: {
    width: width,
    height: height,
    transform: [{ translateX: -width / 2 }],
  },
  RightFourthQuarterDisplay: {
    width: width,
    height: height,
    transform: [{ translateX: (-width / 4) * 3 }],
  },
  TopFirstQuarterDisplay: {
    width: width,
    height: height,
  },
  TopSecondQuarterDisplay: {
    width: width,
    height: height,
    transform: [{ translateY: -height / 4 }],
  },
  TopThirdQuarterDisplay: {
    width: width,
    height: height,
    transform: [{ translateY: -height / 2 }],
  },
  TopFourthQuarterDisplay: {
    width: width,
    height: height,
    transform: [{ translateY: (-height / 4) * 3 }],
  },
  CameraButton: {
    width: 60,
    height: 60,
  },
  Brightness: {
    width: 40,
    height: 40,
  },
  CameraMenu: {
    width: 40,
    height: 40,
  },
  image: {
    width: 40,
    height: 40,
    alignSelf: "center",
  },
});