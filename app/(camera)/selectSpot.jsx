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
          <View style={styles.centerView}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : (
          <View>
            <View style={styles.positionContainer}>
              <Text style={styles.boldText}>
                現在地：
                <Text style={styles.text}>
                  {latitude}
                  {"    "}
                  {longitude}
                </Text>
              </Text>
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
            )}
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
                    <View>
                      <Text style={styles.nameText}>{item.name}</Text>
                      <Text style={styles.positionText}>
                        {item.latitude}
                        {"    "}
                        {item.longitude}
                      </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerView: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  itemContainer: {
    padding: 10,
    paddingBottom: 20,
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#ADADAD",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  distanceText: {
    color: "#7D7D7D",
    fontSize: 12,
  },
  positionText: {
    color: "#9D9D9D",
    fontSize: 10,
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
});
