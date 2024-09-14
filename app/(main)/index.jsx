import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  Button,
  Pressable,
  TouchableOpacity,
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
  const [spotId, setSpotId] = useState(0);
  const [user, setUser] = useState(null); //ユーザー情報を保持する
  const [mapfixed, setmapfixed] = useState(false);
  const [postButtonVisible, setPostButtonVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postData, setPostData] = useState([]);
  const [emptyPost, setEmptyPost] = useState(true);
  const [markerCords, setMarkerCords] = useState([]);

  const setmodal = (marker) => {
    try {
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
      } else {
        setModalVisible(false);
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

  const fetchPostData = async (spotId) => {
    setLoading(true);
    try {
      const postArray = [];
      const friendList = [];

      setEmptyPost(true);

      const queryFollow = await firestore()
        .collection("follow")
        .where("followerId", "==", auth.currentUser.uid)
        .get();

      if (!queryFollow.empty) {
        let cnt = 0;
        while (cnt < queryFollow.size) {
          const followSnapshot = queryFollow.docs[cnt];
          const followData = followSnapshot.data();
          friendList.push(followData.followeeId);
          cnt = cnt + 1;
        }
      } else {
        friendList.push("");
      }
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
          const firstKey = "userId";
          const secondKey = "username";
          const thirdKey = "userIcon";
          const forthKey = "postId";
          const fifthKey = "postText";
          const sixthKey = "photoUri";
          const seventhKey = "timestamp";

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
              photoUri = url;
            }
          }

          const queryUser = await firestore()
            .collection("users")
            .where("uid", "==", postData.userId)
            .get();
          const userSnapshot = queryUser.docs[0];
          const userData = userSnapshot.data();

          tempObj[firstKey] = postData.userId;
          tempObj[secondKey] = userData.displayName;
          tempObj[thirdKey] = userData.photoURL;
          tempObj[forthKey] = postData.id;
          tempObj[fifthKey] = postData.postTxt;
          tempObj[sixthKey] = photoUri;
          tempObj[seventhKey] = postData.timeStamp;

          postArray.push(tempObj);

          cnt = cnt + 1;
        }
        let empty = false;

        setPostData(postArray);
        setEmptyPost(empty);
        setLoading(false);
      } else {
        console.log("No documents found with the specified condition");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  };

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

  const setmapfixeds = (
    latitude,
    longitude,
    LATITUDE_DELTA,
    LONGITUDE_DELTA
  ) => {
    if (mapfixed == true) {
      setmapfixed(false);
      setInitialRegion({
        latitude: latitude,
        longitude: longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    } else {
      setmapfixed(true);
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
            setPostButtonVisible(false);
            setInitialRegion({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            });
            setPostButtonVisible(true);
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
      // { enableHighAccuracy: true, timeout: 10000, distanceFilter: 1 }
      {
        enableHighAccuracy: false,
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
    <SafeAreaView style={StyleSheet.absoluteFillObject}>
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
          region={initialRegion}
          scrollEnabled={mapfixed}
          zoomEnabled={mapfixed}
          rotateEnabled={mapfixed}
          pitchEnabled={mapfixed}
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

      <MyModal
        visible={modalVisible}
        empty={emptyPost}
        postData={postData}
        spotId={spotId}
        loading={loading}
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
              display: postButtonVisible ? "flex" : "none",
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
              display: postButtonVisible ? "flex" : "none",
            }}
          ></Pressable>
        </Link>
      )}

      {user ? (
        <View style={styles.loignBtnContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              router.push("/myPage");
            }}
          >
            <Text>MY PAGE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.loignBtnContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              router.push("/loginForm");
            }}
          >
            <Text>LOGIN</Text>
          </TouchableOpacity>
        </View>
      )}
      {mapfixed ? (
        <View style={styles.mapfixed}>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              setmapfixeds(
                position.latitude,
                position.longitude,
                LATITUDE_DELTA,
                LONGITUDE_DELTA
              )
            }
          >
            <Text>FIX MAP</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mapfixed}>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              setmapfixeds(
                position.latitude,
                position.longitude,
                LATITUDE_DELTA,
                LONGITUDE_DELTA
              )
            }
          >
            <Text>MOVE MAP</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default TrackUserMapView;
