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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/FontAwesome5";

const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する
const ASPECT_RATIO = width / height;

export default function SelectSpot() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { latitude, longitude, pointRequired, userPoint, newFlag } = params;
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
          <View>
            <View
              style={styles.listContainer}>
              <Text style={styles.subtitle}>現在地に新しいピンを立てて投稿</Text>
              <TouchableOpacity
                style={styles.itemContainer}
                onPress={() => {
                  router.push({
                    pathname: "/camera",
                    params: {
                      latitude: 0,
                      longitude: 0,
                      point: 0,
                      spotNo: 0,
                    },
                  });
                }}
              >
                <View style={{ flexDirection: 'row' }}>
                  <Image
                    source={require('../image/UnvisitedPin.png')}
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

            {newFlag == "true" ? (
              <View style={styles.pointText}>
                <Text>
                  {"新しいピンを作るに必要なポイント："}
                  <Text style={styles.boldText}>{pointRequired}</Text>
                </Text>
                <Text>
                  {"現在所持しているポイント："}
                  <Text style={styles.boldText}>{userPoint}</Text>
                </Text>
                <Text>以下に既存ピンに投稿することができます。</Text>
              </View>
            ) : (
              <></>
            )}<Text style={styles.subtitle}>近くのピンに投稿</Text>

            <FlatList
              style={styles.listContainer}
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
                    <View style={{ flexDirection: 'row' }}>
                      <Image
                        source={require('../image/ActionPin.png')}
                        style={styles.listImage}
                      />
                      <View>
                        <Text style={styles.nameText}>{item.name}</Text>
                        <Text style={styles.positionText}>
                          {item.latitude}
                          {"    "}
                          {item.longitude}
                        </Text></View>
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
          </View>
        )}
      </View>
      <View style={styles.Back}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="angle-left" size={24} color="#000" />
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
    fontSize: 30,
    textAlign: "center",
    fontWeight: "300",
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
    fontWeight: "600"
  },
  positionText: {
    color: "#239D60",
    fontSize: 12,
    fontWeight: "400"
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
  backButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F5C8",
    width: 70,
    height: 70,
    marginTop: 5, // ボタン間にスペースを追加
  },
  Back: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
