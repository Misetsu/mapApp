import React, { useState, useEffect, useRef } from "react";
import {
  FlatList,
  SafeAreaView,
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker } from "react-native-maps";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import MyModal from "../component/modal";
import { customMapStyle, styles } from "../component/styles";
import Icon from "react-native-vector-icons/FontAwesome5";

const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

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
  const [Region, setRegion] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [spotId, setSpotId] = useState(0);
  const [postImage, setPostImage] = useState(false);
  const [user, setUser] = useState(null);
  const [mapfixed, setmapfixed] = useState(false);
  const [postButtonVisible, setPostButtonVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postData, setPostData] = useState([]);
  const [emptyPost, setEmptyPost] = useState(true);
  const [markerCords, setMarkerCords] = useState([]);
  const [indexStatus, setIndexStatus] = useState("follow");
  const [userList, setUserList] = useState([]);
  const [showButtons, setShowButtons] = useState(false); // ボタン表示状態
  const fadeAnim = useRef(new Animated.Value(0)).current; // フェードアニメーションの初期値
  const [iconName, setIconName] = useState("user-friends"); // 初期アイコン名

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
        setModalVisible(true);
        setPostImage(true);
        fetchPostData(marker.id);
      } else {
        setSpotId(marker.id);
        setModalVisible(true);
        setPostImage(false);
        fetchPostData(marker.id);
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
        .orderBy("timeStamp", "desc")
        .limit(10)
        .get();

      if (!querySnapshot.empty) {
        const size = querySnapshot.size;
        let cnt = 0;
        const firstKey = "userId";
        const secondKey = "username";
        const thirdKey = "userIcon";
        const forthKey = "postId";
        const fifthKey = "postText";
        const sixthKey = "photoUri";
        const seventhKey = "timestamp";
        const eighthKey = "likeCount";
        const ninthKey = "likeFlag";

        while (cnt < size) {
          const documentSnapshot = querySnapshot.docs[cnt]; // 最初のドキュメントを取得
          const postData = documentSnapshot.data();

          let photoUri = "";
          let tempObj = {};

          const queryUser = await firestore()
            .collection("users")
            .where("uid", "==", postData.userId)
            .get();
          const userSnapshot = queryUser.docs[0];
          const userData = userSnapshot.data();

          if (userData.publicStatus == 0) {
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

            const queryLike = await firestore()
              .collection("like")
              .where("postId", "==", postData.id)
              .get();

            const likeSnapshot = queryLike.docs[0];
            const likeData = likeSnapshot.data();
            let likeFlag;
            if (likeData[auth.currentUser.uid] !== undefined) {
              likeFlag = true;
            } else {
              likeFlag = false;
            }

            tempObj[firstKey] = postData.userId;
            tempObj[secondKey] = userData.displayName;
            tempObj[thirdKey] = userData.photoURL;
            tempObj[forthKey] = postData.id;
            tempObj[fifthKey] = postData.postTxt;
            tempObj[sixthKey] = photoUri;
            tempObj[seventhKey] = postData.timeStamp;
            tempObj[eighthKey] = likeData.count;
            tempObj[ninthKey] = likeFlag;

            postArray.push(tempObj);
            setEmptyPost(false);
          } else if (friendList.includes(userData.uid)) {
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

            const queryLike = await firestore()
              .collection("like")
              .where("postId", "==", postData.id)
              .get();

            const likeSnapshot = queryLike.docs[0];
            const likeData = likeSnapshot.data();
            let likeFlag;
            if (likeData[auth.currentUser.uid] !== undefined) {
              likeFlag = true;
            } else {
              likeFlag = false;
            }

            tempObj[firstKey] = postData.userId;
            tempObj[secondKey] = userData.displayName;
            tempObj[thirdKey] = userData.photoURL;
            tempObj[forthKey] = postData.id;
            tempObj[fifthKey] = postData.postTxt;
            tempObj[sixthKey] = photoUri;
            tempObj[seventhKey] = postData.timeStamp;
            tempObj[eighthKey] = likeData.count;
            tempObj[ninthKey] = likeFlag;

            postArray.push(tempObj);
            setEmptyPost(false);
          }

          cnt = cnt + 1;
        }
        setPostData(postArray);
        setLoading(false);
      } else {
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

  const setmapfixeds = () => {
    if (mapfixed == true) {
      setmapfixed(false);
    } else {
      setmapfixed(true);
    }
  };

  const defaultlocation = (
    latitude,
    longitude,
    LATITUDE_DELTA,
    LONGITUDE_DELTA
  ) => {
    try {
      if (Region.flag == 0) {
        setRegion({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
          flag: 1,
        });
      } else {
        setRegion({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
          flag: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
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

  const fetchIndexBar = async (status) => {
    const tempList = [];
    const firstKey = "userId";
    const secondKey = "username";
    const thirdKey = "userIcon";
    const forthKey = "lastPostAt";
    if (status == "follow") {
      try {
        const queryFollow = await firestore()
          .collection("follow")
          .where("followerId", "==", auth.currentUser.uid)
          .get();

        if (!queryFollow.empty) {
          let cnt = 0;
          while (cnt < queryFollow.size) {
            let tempObj = {};
            const followSnapshot = queryFollow.docs[cnt];
            const followData = followSnapshot.data();

            const queryUser = await firestore()
              .collection("users")
              .where("uid", "==", followData.followeeId)
              .get();
            const userSnapshot = queryUser.docs[0];
            const userData = userSnapshot.data();

            if (!(userData.lastPostAt == "0")) {
              tempObj[firstKey] = userData.uid;
              tempObj[secondKey] = userData.displayName;
              tempObj[thirdKey] = userData.photoURL;
              tempObj[forthKey] = userData.lastPostAt;

              tempList.push(tempObj);
            }

            cnt = cnt + 1;
          }
        }
      } catch (error) {
        console.log("Error fetching documents: ", error);
      }
    } else if (status == "star") {
      try {
        const queryFav = await firestore()
          .collection("star")
          .doc(auth.currentUser.uid)
          .get();

        const starList = [];
        for (const [key, value] of Object.entries(queryFav.data())) {
          if (key == value) {
            starList.push(value);
          }
        }
        if (!(starList.length == 0)) {
          let cnt = 0;
          while (cnt < starList.length) {
            let tempObj = {};

            const queryUser = await firestore()
              .collection("users")
              .where("uid", "==", starList[cnt])
              .get();
            const userSnapshot = queryUser.docs[0];
            const userData = userSnapshot.data();

            if (!(userData.lastPostAt == "0")) {
              tempObj[firstKey] = userData.uid;
              tempObj[secondKey] = userData.displayName;
              tempObj[thirdKey] = userData.photoURL;
              tempObj[forthKey] = userData.lastPostAt;

              tempList.push(tempObj);
            }

            cnt = cnt + 1;
          }
        }
      } catch (error) {
        console.log("Error fetching documents: ", error);
      }
    }

    tempList.sort((a, b) => {
      if (b.lastPostAt < a.lastPostAt) {
        return -1;
      }
      if (b.lastPostAt > a.lastPostAt) {
        return 1;
      }
      return 0;
    });

    setUserList(tempList);
  };

  const handleIconPress = () => {
    if (iconName === "times") {
      fetchAllMarkerCord();
      setIconName("user-friends"); // アイコン名を元に戻す
    } else if (indexStatus == "follow") {
      handleChangeIndex();
      setIconName("user-friends"); // アイコン名を "times" に変更
    } else {
      handleChangeIndex();
      setIconName("star");
    }
  };

  const handleUserChoose = async (userId) => {
    const queryPost = await firestore()
      .collection("post")
      .where("userId", "==", userId)
      .orderBy("timeStamp", "desc")
      .get();

    const tempList = [];

    if (!queryPost.empty) {
      let cnt = 0;
      while (cnt < queryPost.size) {
        const postSnapshot = queryPost.docs[cnt];
        const postData = postSnapshot.data();

        tempList.push(postData.spotId);

        cnt = cnt + 1;
      }
    }

    const spotIdList = [...new Set(tempList)];

    const fetchResult = [];
    const querySpot = await firestore()
      .collection("spot")
      .where("id", "in", spotIdList)
      .get();

    if (!querySpot.empty) {
      querySpot.forEach((docs) => {
        const item = docs.data();
        fetchResult.push(item);
      });
      setMarkerCords(fetchResult);
    }
    setIconName("times");
  };

  const handleChangeIndex = () => {
    let status = "";
    if (indexStatus == "follow") {
      status = "star";
      setIndexStatus("star");
      setIconName("star");
    } else {
      status = "follow";
      setIndexStatus("follow");
      setIconName("user-friends");
    }
    fetchIndexBar(status);
  };

  // ボタンを表示してフェードイン
  const showAnimatedButtons = () => {
    setShowButtons(true);
    Animated.timing(fadeAnim, {
      toValue: 1, // 完全に表示
      duration: 500, // 0.5秒でフェードイン
      useNativeDriver: true,
    }).start();
  };

  // 新しいボタン1を押したときにボタンをフェードアウトして非表示
  const hideButtons = () => {
    Animated.timing(fadeAnim, {
      toValue: 0, // 完全に非表示
      duration: 500, // 0.5秒でフェードアウト
      useNativeDriver: true,
    }).start(() => {
      setShowButtons(false); // フェードアウト完了後にボタンを非表示
    });
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
            setRegion({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
              flag: 0,
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
    fetchIndexBar(indexStatus);
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
          region={Region}
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
        </MapView>
      )}
      {/* タスクバーアイコン */}
      <SafeAreaView style={styles.indexContainer}>
        <FlatList
          horizontal={true}
          data={userList}
          keyExtractor={(item) => item.userId}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                style={styles.listProfileSize}
                onPress={() => handleUserChoose(item.userId)}
              >
                <Image
                  source={{ uri: item.userIcon }}
                  style={styles.listProfileImage}
                />
                <Text style={styles.listProfileNameText}>{item.username}</Text>
              </TouchableOpacity>
            );
          }}
        />
        <TouchableOpacity
          style={styles.listProfileIndexButton}
          onPress={handleIconPress} // 変更した関数を呼び出す
        >
          <Icon name={iconName} size={30} color="#000"></Icon>
        </TouchableOpacity>
      </SafeAreaView>

      <MyModal
        visible={modalVisible}
        empty={emptyPost}
        postData={postData}
        postImage={postImage}
        spotId={spotId}
        loading={loading}
        onClose={() => setModalVisible(false)}
      />

      {/* 新しいボタンを表示 */}
      {showButtons && (
        <Animated.View
          style={[styles.newButtonContainer, { opacity: fadeAnim }]}
        >
          <TouchableOpacity style={styles.roundButton} onPress={hideButtons}>
            <Icon name="times" size={25} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundButton} onPress={() => {}}>
            <Icon name="map-marked-alt" size={25} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.roundButton}
            onPress={() => {
              router.push({
                pathname: "/camera",
                params: {
                  latitude: position.latitude,
                  longitude: position.longitude,
                  spotId: 0,
                },
              });
            }}
          >
            <Icon name="map-marker-alt" size={25} color="#000" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {user ? (
        <Pressable
          style={{
            position: "absolute",
            alignSelf: "center",
            justifyContent: "center", // ボタン内のテキストを中央に配置
            alignItems: "center",
            bottom: 30,
            width: 70,
            height: 70,
            backgroundColor: "blue",
            borderRadius: 35,
            display: postButtonVisible ? "flex" : "none",
          }}
          onPress={showAnimatedButtons}
        >
          <Icon name="camera" size={30} color="#000" />
        </Pressable>
      ) : (
        <Pressable
          style={{
            position: "absolute",
            alignSelf: "center",
            justifyContent: "center", // ボタン内のテキストを中央に配置
            alignItems: "center",
            bottom: 30,
            width: 70,
            height: 70,
            backgroundColor: "blue",
            borderRadius: 35,
            display: postButtonVisible ? "flex" : "none",
          }}
          onPress={() => {
            router.push({ pathname: "/loginForm" });
          }}
        >
          <Icon name="camera" size={30} color="#000" />
        </Pressable>
      )}

      {user ? (
        <View style={styles.loignBtnContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              router.push("/myPage");
            }}
          >
            <Icon name="user-alt" size={24} color="#000" />
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
            <Icon name="user-alt" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      )}
      {mapfixed ? (
        <View style={styles.mapfixed}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setmapfixeds()}
          >
            <Icon name="arrows-alt" size={24} color="#28b6b8" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mapfixed}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setmapfixeds()}
          >
            <Icon name="arrows-alt" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.defaultlocation}>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            defaultlocation(
              position.latitude,
              position.longitude,
              LATITUDE_DELTA,
              LONGITUDE_DELTA
            )
          }
        >
          <Icon name="crosshairs" size={24} color="#3333ff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TrackUserMapView;
