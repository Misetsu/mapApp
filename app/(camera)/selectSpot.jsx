import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する
const ASPECT_RATIO = width / height;
const auth = FirebaseAuth();

export default function SelectSpot() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { latitude, longitude, pointRequired, userPoint } = params;
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
          tempArray.push({
            id: item.id,
            name: item.name,
            latitude: item.mapLatitude,
            longitude: item.mapLongitude,
            distance: distance.toFixed(1),
          });
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

  function fibonacci(num) {
    if (num == 1) return 0;
    if (num == 2) return 1;
    return fibonacci(num - 1) + fibonacci(num - 2);
  }

  const handleAddNewPin = async () => {
    const queryUser = await firestore()
      .collection("users")
      .doc(auth.currentUser.uid)
      .get();

    const userData = queryUser.data();

    const pointRequired = fibonacci(parseInt(userData.spotCreate) + 1);
    const pointLeft = parseInt(userData.spotPoint) - parseInt(pointRequired);
    if (pointRequired <= userData.spotPoint) {
      router.push({
        pathname: "/camera",
        params: {
          latitude: latitude,
          longitude: longitude,
          spotId: 0,
          point: parseInt(pointLeft),
          spotNo: parseInt(userData.spotCreate) + 1,
        },
      });
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSpotList();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pagetitle}>投稿</Text>
      <View>
        {loading ? (
          <View style={styles.centerView}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : (
          <ScrollView style={{ marginBottom: 40 }}>
            <View style={styles.listContainer}>
              <Text style={styles.subtitle}>
                現在地に新しいピンを立てて投稿
              </Text>
              <Text style={styles.subtitle}>
                必要なポイント：{pointRequired}
              </Text>
              <Text style={styles.subtitle}>
                所持しているポイント：{userPoint}
              </Text>
              <TouchableOpacity
                style={styles.itemContainer}
                onPress={handleAddNewPin}
              >
                <View style={{ flexDirection: "row" }}>
                  <Image
                    source={require("../image/UnvisitedPin.png")}
                    style={styles.listImage}
                  />
                  <View>
                    <Text style={styles.nameText}>新規ピン</Text>
                    <Text style={styles.positionText}>
                      {latitude}
                      {"    "}
                      {longitude}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>近くのピンに投稿</Text>

            <FlatList
              style={styles.listContainer}
              scrollEnabled={false}
              data={spotList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={styles.itemContainer}
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
                    <View style={{ flexDirection: "row" }}>
                      <Image
                        source={require("../image/ActionPin.png")}
                        style={styles.listImage}
                      />
                      <View>
                        <Text style={styles.nameText}>{item.name}</Text>
                        <Text style={styles.positionText}>
                          {item.latitude}
                          {"    "}
                          {item.longitude}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.distanceText}>{item.distance}m</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.boldText}>
                  現在地の近くにピンがありません。
                </Text>
              }
            />
          </ScrollView>
        )}
      </View>
      <View style={styles.Back}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Image
            source={require("./../image/Left_arrow.png")}
            style={styles.actionButton}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F2F5C8",
  },
  pagetitle: {
    fontSize: 24,
    height: 30,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "300",
    color: "#000000",
  },
  subtitle: {
    fontSize: 18,
    margin: 10,
    textAlign: "center",
    fontWeight: "600",
    color: "#000000",
    paddingTop: 5,
  },
  centerView: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingBottom: 5,
  },
  itemContainer: {
    padding: 10,
    flexDirection: "row",
    backgroundColor: "#A3DE83",
    justifyContent: "space-between",
    margin: 10, // ボタン間にスペースを追加
    marginLeft: 0,
    marginRight: 0,
  },
  listImage: {
    height: 40,
    width: 40,
    marginRight: 10,
  },
  nameText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  distanceText: {
    color: "#239D60",
    fontSize: 14,
    fontWeight: "600",
  },
  positionText: {
    color: "#239D60",
    fontSize: 12,
    fontWeight: "400",
  },
  positionContainer: {
    alignItems: "center",
    paddingTop: 20,
  },
  boldText: {
    fontWeight: "bold",
  },
  text: {
    fontWeight: "normal",
  },
  pointText: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  actionButton: {
    width: 30,
    height: 30,
    padding: 5,
    margin: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
  },
  backButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F5C8",
    width: 70,
    height: 70,
    marginTop: 3, // ボタン間にスペースを追加
  },
  Back: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});