import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker } from "react-native-maps";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { customMapStyle, styles } from "../component/styles";
import Icon from "react-native-vector-icons/FontAwesome5";

const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const auth = FirebaseAuth();

export default function SelectSpot() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { latitude, longitude } = params;
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
  const [initialRegion, setInitialRegion] = useState(null);
  const [Region, setRegion] = useState(null);

  const [spotId, setSpotId] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markerCords, setMarkerCords] = useState([]);

  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };

  const setmodal = (marker) => {
    try {
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        marker.mapLatitude,
        marker.mapLongitude
      );
      if (distance < marker.areaRadius) {
        setSpotId(marker.id);
        router.push({
          pathname: "/camera",
          params: {
            latitude: 0,
            longitude: 0,
            spotId: marker.id,
            point: 0,
            spotNo: 0,
          },
        });
      } else {
        setSpotId(marker.id);
      }
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  };

  function toRadians(degrees) {
    try {
      return (degrees * Math.PI) / 180;
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  }

  // 2点間の距離を計算する関数
  function calculateDistance(lat1, lon1, lat2, lon2) {
    try {
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
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  }

  const getPinColor = (marker) => {
    try {
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        marker.mapLatitude,
        marker.mapLongitude
      );
      return distance < marker.areaRadius
        ? require("../image/pin_orange.png")
        : require("../image/pin_blue.png");
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  };

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

        setMarkerCords(fetchResult);
      } else {
        console.log("empty");
      }
    } catch (error) {
      console.error("Error fetching documents: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    //リアルタイムでユーザーの位置情報を監視し、更新
    const watchId = Geolocation.watchPosition(
      (position) => {
        try {
          setPosition(position.coords);
          if (!initialRegion) {
            setInitialRegion({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            });
            setRegion({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
              flag: 0,
            });
          } else {
            setError("Position or coords is undefined");
          }
        } catch (error) {
          setError(`Error updating position: ${error.message}`);
        }
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        distanceFilter: 5,
        maximumAge: 1000,
      }
    );
    return () => Geolocation.clearWatch(watchId);
  }, [initialRegion]);

  useEffect(() => {
    setUser(auth.currentUser);
    fetchAllMarkerCord();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>読み込み中...</Text>
      </View>
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
          initialRegion={initialRegion}
          region={Region}
          scrollEnabled={true}
          zoomEnabled={true}
          rotateEnabled={true}
          pitchEnabled={true}
        >
          <Marker
            coordinate={{
              latitude: position.latitude,
              longitude: position.longitude,
            }}
            initialRegion={{
              latitude: position.latitude,
              longitude: position.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            }}
          >
            <View style={styles.radius}>
              <View style={styles.marker} />
            </View>
          </Marker>

          {markerCords.map((marker) => (
            <TouchableOpacity style={styles.hitSlop} key={marker.id}>
              <Marker
                coordinate={{
                  latitude: parseFloat(marker.mapLatitude),
                  longitude: parseFloat(marker.mapLongitude),
                }}
                title={marker.name}
                onPress={() => setmodal(marker)}
              >
                <Image
                  source={getPinColor(marker)}
                  style={styles.markerImage} //ピンの色
                />
              </Marker>
            </TouchableOpacity>
          ))}
        </MapView>
      )}
      <View
        style={{
          position: "absolute",
          top: 0,
          width: "100%",
          backgroundColor: "#F2F2F2",
          flexDirection: "row", // 横並びに配置
          justifyContent: "space-between", // 左右にスペースを均等に配置
          alignItems: "center", // 縦方向の中央揃え
          height: 50, // 高さを指定
        }}
      >
        <TouchableOpacity
          onPress={handleBackPress}
          style={{
            width: 50, // 横幅を設定
            height: 50, // 高さを設定
            justifyContent: "center", // 縦中央揃え
            alignItems: "center", // 横中央揃え
          }}
        >
          {/* 右側のアイコンやテキストをここに追加 */}
          <Icon name="angle-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text>投稿したいピンを選択してください</Text>
        <TouchableOpacity
          style={{
            width: 50, // 横幅を設定
            height: 50, // 高さを設定
            justifyContent: "center", // 縦中央揃え
            alignItems: "center", // 横中央揃え
          }}
        />
      </View>
    </SafeAreaView>
  );
}
