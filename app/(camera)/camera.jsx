import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
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

const width = Dimensions.get("window"); //デバイスのウィンドウサイズ取得
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);  //アニメーションのプロパティを持つカメラ

export default function CameraScreen() {  //カメラを表示するためのコンポーネント
  const cameraRef = useRef(null);   
  const device = useCameraDevice("back"); //バックカメラのデバイス情報
  const { hasPermission, requestPermission } = useCameraPermission(); //カメラの使用権限に関する情報を取得します。
  const [isActive, setIsActive] = useState(false);  //カメラがアクティブかどうか
  const [showSlider, setShowSlider] = useState(false); // スライダーの表示状態を管理するステート
  const format = useCameraFormat(device, [{ photoAspectRatio: 4 / 3 }]); //アスペクト比を4/3にする

  const params = useLocalSearchParams();  //index.jsxから渡された値をまとめて受け取る
  const { latitude, longitude, spotId } = params; //送った値を分割する
  console.log(spotId);

  const zoom = useSharedValue(device?.neutralZoom ?? 1);  //deviceが存在すればそのニュートラルズームを、なければ1をデフォルトにする
  const exposureSlider = useSharedValue(0); //リアルタイムで更新やアニメーションをサポートする
  //SharedValueには
  //_animationはアニメーションが存在するか
  //_isReanimatedSharedValueはReanimatedの機能を使用しているか
  //_valueはSharedValueの現在の値が入っている
  //modifyはSharedValueの値を変更するためのメソッド
  //removeListenerはリスナーを削除するためのメソッド
  //valueはharedValueの公開プロパティで、外部からアクセス可能な現在の値
  const zoomOffset = useSharedValue(0); //ユーザーがズームを調整できるように
  const pinchGesture = Gesture.Pinch()  //ピンチジェスチャー(つまむ動作)を捉えるために使用される
    .onBegin(() => {  //ピンチジェスチャー(つまむ動作)が開始されたら実行する
      zoomOffset.value = zoom.value;  //ズームレベルを基準にする
    })
    .onUpdate((event) => {  //ジェスチャーが更新されるたびに実行される
      const z = zoomOffset.value * event.scale; //基準にスケールの変化を掛けて現在のズームレベルを計算する
      zoom.value = interpolate( //zの受け取る範囲の設定などを行える関数
        z,  //計算された現在のズームレベルを
        [1, 10],  //1～10の範囲内で
        [device.minZoom, device.maxZoom], //範囲を設定して、
        Extrapolation.CLAMP //その範囲を超えないようにしている
      );
    });

  const animatedProps = useAnimatedProps( //アニメーションを行うためのカスタムフック
    () => ({
      zoom: zoom.value,
      exposure: exposureSlider.value,
    }),
    [zoom, exposureSlider]  //ここの値が変更されるたびこのカスタムフックが実行される
  );

  const focus = useCallback((point) => {  //focusは特定のポイントに焦点を合わせる関数
    const c = cameraRef.current;    //カメラのコンポーネントが使われているかの確認
    if (c == null) return;       //cがnull(カメラが存在しない、初期化されていない場合)であれば処理を中断
    c.focus(point);   //focusを呼び出し、pointに焦点を当てる
  }, []);

  const tapGesture = Gesture.Tap().onEnd(({ x, y }) => {  //タップした位置(x座標、y座標)を受け取る
    runOnJS(focus)({ x, y }); //タップした位置に焦点を当てる
    console.log(exposureSlider)
  });

  useFocusEffect(   //画面がフォーカスされたら実行
    useCallback(() => {
      setIsActive(true);  //コンポーネントをアクティブ状態に
      return () => {
        setIsActive(false); //フォーカスが外れれアクティブ状態ではなくする
      };
    }, [])
  );

  useEffect(() => { //コンポーネントがマウントされたときやhasPermissionが変更されたときに実行される
    if (!hasPermission) { //カメラやマイクのアクセス権限がない場合に実行される
      requestPermission();  //権限がない場合に呼び出される関数
    }
  }, [hasPermission]);

  const onTakePicturePressed = async () => {  //写真を撮るボタンが押されたときの関数
    try {
      if (cameraRef.current == null) {  //カメラが初期化されていない場合
        console.log("null");
        return;   //以降の処理を中断する
      }
      const photo = await cameraRef.current.takePhoto();  //写真を撮る
      console.log(photo);
      router.navigate({ //写真を撮影したときに
        pathname: "/edit",  //edit.jsx
        params: {
          imageUri: "file://" + photo.path, //撮影した写真のパス
          latitude: latitude, //緯度
          longitude: longitude, //経度
          spotId: spotId, //スポットid
        },  //の情報を送る
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  async function pickImage() {  //画像選択の関数
    let result = await ImagePicker.launchImageLibraryAsync({    //画像選択の結果を格納する変数と画像や動画を選択するためのAPIであるImagePicker
      mediaTypes: ImagePicker.MediaTypeOptions.Images,  //選択できるのを画像だけにするオプション
      allowsEditing: false, //画像の編集を許可しない
      quality: 1, //画像の品質(1は最高品質)
    });

    if (!result.canceled) { //ユーザーが画像の選択をキャンセルしなかった場合
      router.navigate({
        pathname: "/edit",  //edit.jsxに
        params: {
          imageUri: result.assets[0].uri,   //選択画像のuri
          latitude: latitude, //緯度
          longitude: longitude, //経度
          spotId: spotId, //スポットID
        },  //を送る
      });
    }
  }
  //exposuer slider
  const exposureValue = useDerivedValue(() => { //exposureSlider, deviceが変更されたときに再計算される関数とその結果を格納する定数
    if (device == null) return 0;
    return interpolate(
      exposureSlider.value,   //写真の明るさを調整する関数
      [
        -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
        10,
      ],    //調整できる明るさの範囲を-10～10までにする
      [device.minExposure, 0, device.maxExposure] //スライダーや他のUI要素においてここで設定した値を上回ることも下回ることもできない
    );
    
  }, [exposureSlider, device]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}/*タッチイベントのハンドリング、タッチイベントをコントロールする*/>
      <View style={styles.container}/*アプリのメインコンテナ*/>
        <Stack.Screen options={{ headerShown: false }} /*ヘッダーを削除*//>

        <View style={styles.cameraContainer}/*カメラ表示用のコンテナ*/>
          <GestureDetector gesture={Gesture.Race(pinchGesture, tapGesture)}/*ピンチジェスチャー(つまむ動作)とタップジェスチャーを検出するためのコンポーネント */>
            <ReanimatedCamera
              ref={cameraRef} /*カメラの参照*/
              style={styles.camera} //カメラのスタイル
              device={device} //使用するカメラのデバイス
              photo={true}  //写真撮影を有効にする
              format={format} //カメラのフォーマット
              isActive={isActive} //カメラのアクティブ状態
              animatedProps={animatedProps} //アニメーションのプロパティ
            />
          </GestureDetector>
        </View>
        {showSlider && (  //スライダー(明るさ調整)が有効なら実行
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider} //スライダーのスタイル
              minimumValue={-10}  //スライダーの最小値
              maximumValue={10} //スライダーの最大値
              value={exposureSlider.value}  //現在の明るさのスライダー値を設定
              onValueChange={(value) => (exposureSlider.value = value)} //スライダーが変更されたときにexposureSliderが変更される
            />
          </View>
        )}

        <Pressable  //タッチイベントを処理するコンポーネント(撮影ボタン)
          onPress={onTakePicturePressed}  //撮影ボタンを押すとonTakePicturePressedが実行される
          style={styles.captureButton}
        />
        <Pressable onPress={pickImage} style={styles.pickImageButton} /*画像選択画面*//>  
        {/* exposuer exposure */}
        <Pressable
          // ボタンを押したときにスライダーの表示/非表示を切り替え
          onPress={() => setShowSlider(!showSlider) /*スライダー表示イベント*/}
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

//こっからスタイル

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  cameraContainer: {
    // height: "auto",
    width: "auto",
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
});
