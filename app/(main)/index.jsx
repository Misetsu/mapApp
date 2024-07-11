import React, { useState, useEffect, forwardRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  Modal,
  Button,
  Pressable,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker } from "react-native-maps";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";

// import { customMapStyle } from "../component/mapLayout.jsx";

const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する
const ASPECT_RATIO = width / height; //アスペクト比
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO; //地図の表示範囲

const TrackUserMapView = () => {
  const [position, setPosition] = useState({
    //ユーザーの位置情報を保持
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    altitude: 0,
    altitudeAccuracy: 0,
    heading: 0,
    speed: 0,
  });

  const [error, setError] = useState(null); //位置情報取得時に発生するエラーを管理する
  const [initialRegion, setInitialRegion] = useState(null); //地図の初期表示範囲を保持します。

  const [modalVisible, setModalVisible] = useState(false); // モーダルの表示状態を管理するステート
  const [distance, setDistance] = useState(0);
  const [image, setimage] = useState(require("../image/pin_blue.png")); //ピンの色を保存する

  const YourComponent = () => {
    useEffect(() => {
      // コンポーネントがマウントされたときに実行する処理
      handleMarkerPress(34.69891700747491, 135.19364647347652); // 適切な値を渡す

      // 他の初期化処理もここに書くことができます
    }, []);
  };

  const handleMarkerPress = (latitude, longitude) => {
    const distance = calculateDistance(
      position.latitude,
      position.longitude,
      latitude,
      longitude
    );
    setDistance(distance); // 距離を状態として更新
    console.log(image);
    if (distance < 50) {
      //距離が50m以上離れているかのチェック
      setimage(require("../image/pin_orange.png")); //離れていない(近い場合)は緑のピン
    } else {
      setimage(require("../image/pin_blue.png")); //離れている(遠い場合)は青のピン
    }
    console.log(distance);
  };

  const handleMarkerPress2 = () => {
    if (distance < 50) {
      //距離が50m以上離れているかのチェック
      setModalVisible(true);
    } else {
      setModalVisible(false);
    }
  };

  function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  // 2点間の距離を計算する関数
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球の半径（単位: km）
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // 距離をメートルに変換するために1000を掛ける
    return distance;
  }

  const [imageUri, setImageUri] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchImageUri = async () => {
    setLoading(true);
    try {
      const querySnapshot = await firestore()
        .collection("photo")
        .where("spotId", "==", 1) // 特定の条件を指定
        .get();

      if (!querySnapshot.empty) {
        const documentSnapshot = querySnapshot.docs[0]; // 最初のドキュメントを取得
        const data = documentSnapshot.data();
        console.log("Document data:", data);

        if (data.imagePath) {
          const url = await storage().ref(data.imagePath).getDownloadURL();
          setImageUri(url);
        } else {
          console.log("No imagePath field in document");
        }
      } else {
        console.log("No documents found with the specified condition");
      }
    } catch (error) {
      console.error("Error fetching documents: ", error);
    } finally {
      setLoading(false);
    }
  };

  const [markerCords, setMarkerCords] = useState([]);

  const fetchAllMarkerCord = async () => {
    const fetchResult = [];
    setLoading(true);
    try {
      const querySnapshot = await firestore()
        .collection("spot")
        .orderBy("id")
        .get();

      if (!querySnapshot.empty) {
        querySnapshot.forEach((docs) => {
          const item = docs.data();
          fetchResult.push(item);
        });

        // const item = querySnapshot.docs[0].data();
        // fetchResult.push(item);

        setMarkerCords(fetchResult);
      } else {
        console.log("empty");
      }
    } catch (error) {
      console.error("Error fetching documents: ", error);
    } finally {
      console.log(markerCords);
      setLoading(false);
    }
  };

  useEffect(() => {
    //リアルタイムでユーザーの位置情報を監視し、更新
    const watchId = Geolocation.watchPosition(
      (position) => {
        setPosition(position.coords);
        if (!initialRegion) {
          setInitialRegion({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          });
        } else {
          setError("Position or coords is undefined");
        }
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, distanceFilter: 1 }
    );
    return () => Geolocation.clearWatch(watchId);
  }, [initialRegion]);

  useEffect(() => {
    fetchImageUri();
    fetchAllMarkerCord();
  }, []);

  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {initialRegion && (
        <MapView
          key={`${initialRegion.latitude}-${initialRegion.longitude}`}
          style={StyleSheet.absoluteFillObject}
          customMapStyle={customMapStyle}
          region={{
            latitude: position.latitude,
            longitude: position.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
        >
          <Marker
            coordinate={{
              latitude: position.latitude,
              longitude: position.longitude,
            }}
            onPress={() => console.log(typeof markerCords[0].mapLatitude)}
          >
            <View style={styles.radius}>
              <View style={styles.marker} />
            </View>
          </Marker>

          {markerCords.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: parseFloat(marker.mapLatitude),
                longitude: parseFloat(marker.mapLongitude),
              }}
              title={marker.name}
            >
              <Image
                source={image}
                style={styles.markerImage} //ピンの色
              />
            </Marker>
          ))}

          <YourComponent />
        </MapView>
      )}

      <MyModal
        visible={modalVisible}
        imageUri={imageUri}
        onClose={() => setModalVisible(false)}
      />

      <Link
        href={{
          pathname: "/camera",
          params: {
            latitude: position.latitude,
            longitude: position.longitude,
            spotId: 0,
          },
        }}
        asChild
      >
        <Pressable
          style={{
            position: "absolute",
            alignSelf: "center",
            bottom: 50,
            width: 75,
            height: 75,
            backgroundColor: "blue",
            borderRadius: 75,
          }}
        ></Pressable>
      </Link>

      <View style={styles.loignBtnContainer}>
        <Link href={{ pathname: "/loginForm" }} asChild>
          <Button title="ログイン" />
        </Link>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  radius: {
    width: 50,
    height: 50,
    borderRadius: 50 / 2,
    overflow: "hidden",
    backgroundColor: "rgba(0, 112, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 112, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 20,
    height: 20,
    borderWidth: 3,
    borderColor: "white",
    borderRadius: 20 / 2,
    overflow: "hidden",
    backgroundColor: "#007AFF",
  },
  spot: {
    width: 20,
    height: 20,
    borderWidth: 3,
    borderColor: "white",
    borderRadius: 20 / 20,
    overflow: "hidden",
    backgroundColor: "#c71585",
  },
  container: {
    width: "100%",
    height: "100%",
  },
  map: {
    flex: 1,
  },
  debugContainer: {
    backgroundColor: "#fff",
    opacity: 0.8,
    position: "absolute",
    bottom: 10,
    left: 10,
    padding: 10,
  },
  errorContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "red",
    padding: 10,
  },
  errorText: {
    color: "#fff",
    textAlign: "center",
  },
  markerImage: {
    width: 50,
    height: 50,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  loignBtnContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 5,
    padding: 10,
  },
});

const MyModal = ({ visible, imageUri, onClose }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={{ backgroundColor: "white", padding: 20 }}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: 300, height: 400 }}
            />
          ) : (
            <ActivityIndicator size="large" color="#0000ff" />
          )}
          <TouchableOpacity onPress={onClose}>
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const customMapStyle = [
  {
    featureType: "poi.business", // ビジネス（ビル、店舗など）のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.business", // ビジネス（ビル、店舗など）のアイコンを非表示
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.attraction", // 観光スポットのラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.government", // 政府機関のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.medical", // 医療施設のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.park", // 公園のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.place_of_worship", // 宗教施設のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.school", // 学校のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.sports_complex", // スポーツ施設のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "road", // 道路の号線表示を非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.locality", // 町、村、区のラベルを非表示
    elementType: "labels.text.fill",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.locality", // 町、村、区のラベルのアウトラインを非表示
    elementType: "labels.text.stroke",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.neighborhood", // 住所（丁目）のラベルを非表示
    elementType: "labels.text.fill",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.neighborhood", // 住所（丁目）のラベルのアウトラインを非表示
    elementType: "labels.text.stroke",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },

  //ここから地図の色
  {
    featureType: "landscape.natural", // 自然地形の色
    elementType: "geometry",
    stylers: [
      {
        color: "#66bb66",
      },
    ],
  },
  {
    featureType: "landscape.man_made", //地面の色
    elementType: "geometry",
    stylers: [
      {
        color: "#e0ffe0",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [
      {
        color: "#6699ff", // 水の色を青色に変更
      },
    ],
  },
  {
    featureType: "road", //  一般道の色
    elementType: "geometry",
    stylers: [
      {
        color: "#404040",
      },
    ],
  },
  {
    featureType: "road", // 一般道の枠線
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#fcfcfc",
        weight: 1,
      },
    ],
  },
  {
    featureType: "road.highway", // 高速道路の色
    elementType: "geometry",
    stylers: [
      {
        color: "#808080",
      },
    ],
  },
  {
    featureType: "road.highway", // 高速道路の枠線の色
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#fcfcfc",
        weight: 1,
      },
    ],
  },
  {
    featureType: "poi.park", // 公園の色
    elementType: "geometry",
    stylers: [
      {
        color: "#99dd66",
      },
    ],
  },
  {
    featureType: "transit.line", // 鉄道の色
    elementType: "geometry",
    stylers: [
      {
        color: "#33ccff",
      },
    ],
  },
  {
    featureType: "transit.line", // 鉄道の枠線の太さ
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#ffffff",
        weight: 1,
      },
    ],
  },
  {
    featureType: "poi.school", // 教育機関の色
    elementType: "geometry",
    stylers: [
      {
        color: "#ffeecc",
      },
    ],
  },
  {
    // 医療機関の背景色を指定（例: 薄いピンク色）
    featureType: "poi.medical",
    elementType: "geometry",
    stylers: [
      {
        color: "#ffdddd",
      },
    ],
  },
];

export default TrackUserMapView;
