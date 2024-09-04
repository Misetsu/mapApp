import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  Button,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Link, useRouter } from "expo-router";
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker } from "react-native-maps";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import MyModal from "../component/modal";
import { customMapStyle, styles } from "../component/styles";

const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する
const ASPECT_RATIO = width / height; //アスペクト比
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO; //地図の表示範囲

const auth = FirebaseAuth();
const router = useRouter();

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
  const [spotId, setSpotId] = useState(0);
  const [image, setimage] = useState(require("../image/pin_blue.png")); //ピンの色を保存する
  const [user, setUser] = useState(null); //ユーザー情報を保持する

  const YourComponent = () => {
    useEffect(() => {
      // コンポーネントがマウントされたときに実行する処理
      handleMarkerPress(0, 0);
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

  const setmodal = (marker) => {
    const distance = calculateDistance(
      position.latitude,
      position.longitude,
      marker.mapLatitude,
      marker.mapLongitude
    );
    if (distance < marker.areaRadius) {
      //距離が50m以上離れているかのチェック
      setSpotId(marker.id);
      setModalVisible(true);
      fetchPostData(marker.id);
      console.log(postData);
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

  const [loading, setLoading] = useState(true);
  const [postData, setPostData] = useState([]);
  const [emptyPost, setEmptyPost] = useState(true);

  const fetchPostData = async (spotId) => {
    try {
      const postArray = [];
      const friendList = [];

      const queryFollow = await firestore()
        .collection("follow")
        .where("followerId", "==", auth.currentUser.uid)
        .get();

      if (!queryFollow.empty) {
        let cnt = 0;
        while (cnt < queryFollow.size) {
          const followSnapshot = queryFollow.docs[cnt];
          const followData = followSnapshot.data();
          console.log(followData.followeeId);
          friendList.push(followData.followeeId);
          cnt = cnt + 1;
        }
      } else {
        friendList.push("");
      }
      console.log(friendList);
      const querySnapshot = await firestore()
        .collection("post")
        .where("spotId", "==", spotId)
        .where("userId", "in", friendList) // 特定の条件を指定
        .get();
      if (!querySnapshot.empty) {
        const size = querySnapshot.size;
        let cnt = 0;
        while (cnt < size) {
          const documentSnapshot = querySnapshot.docs[cnt]; // 最初のドキュメントを取得
          const postData = documentSnapshot.data();

          let photoUri = "";
          let tempObj = {};
          const firstKey = "username";
          const secondKey = "postText";
          const thirdKey = "photoUri";

          const queryPhoto = await firestore()
            .collection("photo")
            .where("postId", "==", postData.id) // 特定の条件を指定
            .get();
          if (!queryPhoto.empty) {
            const photoSnapshot = queryPhoto.docs[0]; // 最初のドキュメントを取得
            const photoData = photoSnapshot.data();

            if (photoData.imagePath) {
              const url = await storage()
                .ref(photoData.imagePath)
                .getDownloadURL();
              console.log(`${url}`);
              photoUri = url;
            }
          }

          const queryUser = await firestore()
            .collection("users")
            .where("uid", "==", postData.userId)
            .get();
          const userSnapshot = queryUser.docs[0];
          const userData = userSnapshot.data();

          tempObj[firstKey] = userData.displayName;
          tempObj[secondKey] = postData.postTxt;
          tempObj[thirdKey] = photoUri;

          postArray.push(tempObj);

          cnt = cnt + 1;
        }
        let empty = false;

        setPostData(postArray);
        setEmptyPost(empty);
      } else {
        console.log("No documents found with the specified condition");
      }
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }

    console.log(postData);
  };

  const [markerCords, setMarkerCords] = useState([]);

  const getPinColor = (marker) => {
    const distance = calculateDistance(
      position.latitude,
      position.longitude,
      marker.mapLatitude,
      marker.mapLongitude
    );
    return distance < marker.areaRadius
      ? require("../image/pin_orange.png")
      : require("../image/pin_blue.png");
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
      console.log(markerCords);
      setLoading(false);
    }
  };

  const signout = async () => {
    await auth.signOut();
    router.replace({ pathname: "/" });
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
    setUser(auth.currentUser);
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
          initialRegion={{
            //regionは固定
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
              onPress={() => setmodal(marker)}
            >
              <Image
                source={getPinColor(marker)}
                style={styles.markerImage} //ピンの色
              />
            </Marker>
          ))}

          <YourComponent />
        </MapView>
      )}

      <MyModal
        visible={modalVisible}
        empty={emptyPost}
        postData={postData}
        spotId={spotId}
        onClose={() => setModalVisible(false)}
      />

      {user ? (
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
      ) : (
        <Link
          href={{
            pathname: "/loginForm",
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
      )}

      {user ? (
        <View style={styles.loignBtnContainer}>
          <Button title="ログアウト" onPress={signout} />
        </View>
      ) : (
        <View style={styles.loignBtnContainer}>
          <Link href={{ pathname: "/loginForm" }} asChild>
            <Button title="ログイン" />
          </Link>
        </View>
      )}
    </SafeAreaView>
  );
};

export default TrackUserMapView;
