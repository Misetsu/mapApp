import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
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
  const [spotList, setSpotList] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };

  const fetchSpotList = async () => {
    const querySpot = await firestore().collection("spot").orderBy("id").get();

    const tempArray = [];
    if (!querySpot.empty) {
      querySpot.forEach((docs) => {
        const item = docs.data();
        const distance = calculateDistance(
          latitude,
          longitude,
          item.mapLatitude,
          item.mapLongitude
        );
        if (distance < item.areaRadius) {
          tempArray.push({ id: item.id, name: item.name });
        }
      });

      setSpotList(tempArray);
    }
    setLoading(false);
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

  useEffect(() => {
    setLoading(true);
    fetchSpotList();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
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
      <View>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <FlatList
            data={spotList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  onPress={() => {
                    router.push({
                      pathname: "/camera",
                      params: {
                        latitude: 0,
                        longitude: 0,
                        spotId: item.id,
                        point: 0,
                        spotNo: 0,
                      },
                    });
                  }}
                >
                  <Text>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
