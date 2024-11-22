import React, { useState, useEffect } from "react";
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
  Linking,
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
import queryString from "query-string";

const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const auth = FirebaseAuth();

export default function TrackUserMapView() {
  const router = useRouter();
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
  const [regions, setregions] = useState(null);
  const [saveregion, setsaveregions] = useState(null);
  const [Region, setRegion] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [spotId, setSpotId] = useState(0);
  const [spotName, setspotName] = useState(null);
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
  const [iconName, setIconName] = useState("users"); // 初期アイコン名
  const [chosenUser, setChosenUser] = useState(null);
  const [allTag, setAllTag] = useState([]);
  const [selectedTag, setSelectedTag] = useState(false);
  const [mapflag, setmapflag] = useState(true);

  const setURLmodal = (spotId) => {
    setSpotId(spotId);
    setspotName(spotId);
    setPostImage(false);
    handleVisitState(spotId);
    fetchPostData(spotId);
    setModalVisible(true);
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
        setmapflag(true);
        setSpotId(marker.id);
        setspotName(marker.name);
        setModalVisible(true);
        setPostImage(true);
        handleVisitState(marker.id);
        fetchPostData(marker.id);
      } else {
        setmapflag(false);
        setSpotId(marker.id);
        setspotName(marker.name);
        setModalVisible(true);
        setPostImage(false);
        fetchPostData(marker.id);
      }
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  };

  useEffect(() => {
    // 初回起動時にURLを取得
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("A");
      handleOpenURL(event.url);
    });

    return () => subscription.remove();
  }, []);

  const handleOpenURL = (url) => {
    // URLを解析してクエリパラメータを取得
    const queryParams = new URLSearchParams(url.split("?")[1]);
    const spotIdFromUrl = queryParams.get("spotId");
    console.log(spotIdFromUrl);
    if (spotIdFromUrl != null) {
      setURLmodal(parseInt(spotIdFromUrl));
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
    if (chosenUser == null) {
      try {
        const postArray = [];
        const friendList = [];

        setEmptyPost(true);

        if (auth.currentUser != null) {
          friendList.push(auth.currentUser.uid);

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
          }
        }

        const querySnapshot = await firestore()
          .collection("post")
          .where("spotId", "==", spotId)
          .orderBy("timeStamp", "desc")
          .limit(5)
          .get();
        console.log(querySnapshot.empty);
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
          const tenthKey = "replyCount";

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
                    .ref()
                    .child(photoData.imagePath)
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
              if (auth.currentUser != null) {
                if (likeData[auth.currentUser.uid] !== undefined) {
                  likeFlag = true;
                } else {
                  likeFlag = false;
                }
              }

              const queryReply = await firestore()
                .collection("replies")
                .where("postId", "==", postData.id)
                .get();

              const replyCount = queryReply.empty ? 0 : queryReply.size;

              tempObj[firstKey] = postData.userId;
              tempObj[secondKey] = userData.displayName;
              tempObj[thirdKey] = userData.photoURL;
              tempObj[forthKey] = postData.id;
              tempObj[fifthKey] = postData.postTxt;
              tempObj[sixthKey] = photoUri;
              tempObj[seventhKey] = postData.timeStamp;
              tempObj[eighthKey] = likeData.count;
              tempObj[ninthKey] = likeFlag;
              tempObj[tenthKey] = replyCount;

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
                    .ref()
                    .child(photoData.imagePath)
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

              const queryReply = await firestore()
                .collection("replies")
                .where("postId", "==", postData.id)
                .get();

              const replyCount = queryReply.empty ? 0 : queryReply.size;

              tempObj[firstKey] = postData.userId;
              tempObj[secondKey] = userData.displayName;
              tempObj[thirdKey] = userData.photoURL;
              tempObj[forthKey] = postData.id;
              tempObj[fifthKey] = postData.postTxt;
              tempObj[sixthKey] = photoUri;
              tempObj[seventhKey] = postData.timeStamp;
              tempObj[eighthKey] = likeData.count;
              tempObj[ninthKey] = likeFlag;
              tempObj[tenthKey] = replyCount;

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
    } else {
      try {
        const postArray = [];

        setEmptyPost(true);

        const querySnapshot = await firestore()
          .collection("post")
          .where("spotId", "==", spotId)
          .where("userId", "==", chosenUser)
          .orderBy("timeStamp", "desc")
          .limit(5)
          .get();

        const queryUser = await firestore()
          .collection("users")
          .where("uid", "==", chosenUser)
          .get();
        const userSnapshot = queryUser.docs[0];
        const userData = userSnapshot.data();

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
          const tenthKey = "replyCount";

          while (cnt < size) {
            const documentSnapshot = querySnapshot.docs[cnt]; // 最初のドキュメントを取得
            const postData = documentSnapshot.data();

            let photoUri = "";
            let tempObj = {};

            const queryPhoto = await firestore()
              .collection("photo")
              .where("postId", "==", postData.id) // 特定の条件を指定
              .get();
            if (!queryPhoto.empty) {
              const photoSnapshot = queryPhoto.docs[0]; // 最初のドキュメントを取得
              const photoData = photoSnapshot.data();

              if (photoData.imagePath) {
                const url = await storage()
                  .ref()
                  .child(photoData.imagePath)
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

            const queryReply = await firestore()
              .collection("replies")
              .where("postId", "==", postData.id)
              .get();

            const replyCount = queryReply.empty ? 0 : queryReply.size;

            tempObj[firstKey] = postData.userId;
            tempObj[secondKey] = userData.displayName;
            tempObj[thirdKey] = userData.photoURL;
            tempObj[forthKey] = postData.id;
            tempObj[fifthKey] = postData.postTxt;
            tempObj[sixthKey] = photoUri;
            tempObj[seventhKey] = postData.timeStamp;
            tempObj[eighthKey] = likeData.count;
            tempObj[ninthKey] = likeFlag;
            tempObj[tenthKey] = replyCount;

            postArray.push(tempObj);
            setEmptyPost(false);

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
    }
  };

  const getPinColor = (marker) => {
    const distance = calculateDistance(
      position.latitude,
      position.longitude,
      marker.mapLatitude,
      marker.mapLongitude
    );

    if (distance < marker.areaRadius) {
      if (marker.visited < marker.lastUpdateAt) {
        return require("../image/ActionPin_New.png");
      } else {
        return require("../image/ActionPin.png");
      }
    } else if (marker.visited == "") {
      if (marker.lastUpdateAt == "") {
        return require("../image/UnvisitedPin.png");
      } else {
        return require("../image/UnvisitedPin_New.png");
      }
    } else {
      if (marker.visited < marker.lastUpdateAt) {
        return require("../image/VisitedPin_New.png");
      } else {
        return require("../image/VisitedPin.png");
      }
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
        setregions({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      } else {
        setRegion({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
          flag: 0,
        });
        setregions({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const fetchAllMarkerCord = async () => {
    if (!modalVisible) {
      let vivstedSpot = {};

      if (auth.currentUser != null) {
        const querySnapshot = await firestore()
          .collection("users")
          .doc(auth.currentUser.uid)
          .collection("spot")
          .orderBy("spotId", "asc")
          .get();

        if (!querySnapshot.empty) {
          querySnapshot.forEach((docs) => {
            const item = docs.data();
            vivstedSpot[item.spotId] = item.timeStamp;
          });
        }
      }

      const fetchResult = [];

      try {
        const querySnapshot = await firestore()
          .collection("spot")
          .orderBy("id")
          .get();
        if (!querySnapshot.empty) {
          querySnapshot.forEach((docs) => {
            const item = docs.data();
            if (item.id in vivstedSpot) {
              item.visited = vivstedSpot[item.id];
            } else {
              item.visited = "";
            }
            if (regions != null) {
              if (
                item.mapLatitude >=
                  regions.latitude - regions.latitudeDelta / 2 &&
                item.mapLatitude <=
                  regions.latitude + regions.latitudeDelta / 2 &&
                item.mapLongitude >=
                  regions.longitude - regions.longitudeDelta / 2 &&
                item.mapLongitude <=
                  regions.longitude + regions.longitudeDelta / 2
              ) {
                fetchResult.push(item);
              }
            }
          });
          if (regions != null && mapflag) {
            setMarkerCords(fetchResult);
          }
        }
      } catch (error) {
        console.error("Error fetching documentssss: ", error);
      } finally {
        setChosenUser(null);
        setLoading(false);
      }
    }
  };
  const onRegionChangeComplete = (newRegion) => {
    if (mapflag) {
      setregions(newRegion); // 新しい表示領域を状態に設定
    }
    setsaveregions(newRegion);
    // 現在の表示領域をコンソールに出力
    fetchAllMarkerCord();
  };

  const fetchIndexBar = async (status) => {
    const tempList = [];
    if (auth.currentUser != null) {
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
              if (
                !(userData.lastPostAt == "0") &&
                !(userData.lastPostAt == undefined)
              ) {
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

              if (
                !(userData.lastPostAt == "0") &&
                !(userData.lastPostAt == undefined)
              ) {
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

// アイコンマップを定義
const handleicons = {
  users: require('./../image/Users.png'),
  star: require('./../image/BorderStar.png'), // 他のアイコンを追加
  close: require('./../image/Close.png'), // 他のアイコンを追加
};

  const handleIconPress = () => {
    if (iconName === "times") {
      setmapflag(true);
      setregions(saveregion);
      fetchAllMarkerCord();
      if (indexStatus == "follow") {
        setIconName("users"); // アイコン名を "times" に変更
      } else {
        setIconName("star");
      }
    } else if (indexStatus == "follow") {
      handleChangeIndex();
      setIconName("star"); // アイコン名を "times" に変更
    } else {
      handleChangeIndex();
      setIconName("users");
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
        setmapflag(false);
        setsaveregions(regions);
        setregions(null);
      });
      setMarkerCords(fetchResult);
    } else {
      setmapflag(true);
    }
    setIconName("close");
    setChosenUser(userId);
  };

  const handleTagChoose = async (tagId) => {
    const tempList = [];
    const tagSnapshot = await firestore()
      .collection("tagPost")
      .where("tagId", "==", parseInt(tagId))
      .get();

    if (!tagSnapshot.empty) {
      tagSnapshot.forEach((doc) => {
        const item = doc.data();
        tempList.push(item.spotId);
      });

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
          setmapflag(false);
          setsaveregions(regions);
          setregions(null);
        });
        setMarkerCords(fetchResult);
      }
    } else {
      setmapflag(true);
      setMarkerCords([]);
    }

    setSelectedTag(true);
  };

  const handleCancelTag = () => {
    setmapflag(true);
    setregions(saveregion);
    setSelectedTag(false);
    fetchAllMarkerCord();
  };

  const handleChangeIndex = () => {
    let status = "";
    if (indexStatus == "follow") {
      status = "star";
      setIndexStatus("star");
      setIconName("user-friends");
    } else {
      status = "follow";
      setIndexStatus("follow");
      setIconName("star");
    }
    fetchIndexBar(status);
  };

  const handleVisitState = async (spotId) => {
    if (auth.currentUser != null) {
      const querySnapshot = await firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .collection("spot")
        .where("spotId", "==", parseInt(spotId))
        .get();

      const currentTime = new Date().toISOString();

      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].ref._documentPath._parts[3];
        await firestore()
          .collection("users")
          .doc(auth.currentUser.uid)
          .collection("spot")
          .doc(docId)
          .update({
            timeStamp: currentTime,
          });
      } else {
        await firestore()
          .collection("users")
          .doc(auth.currentUser.uid)
          .collection("spot")
          .add({
            spotId: parseInt(spotId),
            timeStamp: currentTime,
          });
        const queryUser = await firestore()
          .collection("users")
          .doc(auth.currentUser.uid)
          .get();
        const spotPoint = queryUser.data().spotPoint + 1;

        await firestore().collection("users").doc(auth.currentUser.uid).update({
          spotPoint: spotPoint,
        });
      }
    }
  };

  function fibonacci(num) {
    if (num == 1) return 0;
    if (num == 2) return 1;
    return fibonacci(num - 1) + fibonacci(num - 2);
  }

  const handlePost = async () => {
    const queryUser = await firestore()
      .collection("users")
      .doc(auth.currentUser.uid)
      .get();

    const userData = queryUser.data();

    const pointRequired = fibonacci(parseInt(userData.spotCreate) + 1);

    router.push({
      pathname: "/selectSpot",
      params: {
        latitude: position.latitude,
        longitude: position.longitude,
        pointRequired: pointRequired,
        userPoint: userData.spotPoint,
      },
    });
  };

  const fetchAllTag = async () => {
    const fetchResult = [];
    const tagSnapshot = await firestore()
      .collection("tag")
      .orderBy("tagId")
      .get();
    if (!tagSnapshot.empty) {
      tagSnapshot.forEach((doc) => {
        const item = doc.data();
        fetchResult.push(item);
      });
    }
    setAllTag(fetchResult);
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
            setregions({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            });
            setPostButtonVisible(true);
            fetchAllMarkerCord();
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
    fetchIndexBar(indexStatus);
    fetchAllTag();
  }, []);

  useEffect(() => {
    fetchAllMarkerCord();
  }, [regions]);

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
          style={[
            StyleSheet.absoluteFillObject,
            { marginTop: 85, marginBottom: 70 },
          ]}
          customMapStyle={customMapStyle}
          initialRegion={initialRegion}
          region={Region}
          scrollEnabled={mapfixed}
          zoomEnabled={mapfixed}
          rotateEnabled={mapfixed}
          pitchEnabled={mapfixed}
          onRegionChangeComplete={onRegionChangeComplete}
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
                visible={true}
              />
            </Marker>
          ))}
        </MapView>
      )}
      {/* タスクバーアイコン */}
      <SafeAreaView style={styles.indexContainer}>
        <FlatList
          style={{ marginLeft: 15 }}
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
          <Image source={handleicons[iconName]} style={styles.footerImage} />
        </TouchableOpacity>
      </SafeAreaView>

      <SafeAreaView style={styles.tagContainer}>
        <FlatList
          horizontal={true}
          data={allTag}
          keyExtractor={(item) => item.tagId}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                style={styles.tag}
                onPress={() => handleTagChoose(item.tagId)}
              >
                <Icon name="tag" size={18} color={"#239D60"} />
                <Text>{item.tagName}</Text>
              </TouchableOpacity>
            );
          }}
        />
        {selectedTag ? (
          <TouchableOpacity onPress={handleCancelTag}>
            <Icon name="times-circle" size={30} />
          </TouchableOpacity>
        ) : (
          <></>
        )}
      </SafeAreaView>

      <MyModal
        visible={modalVisible}
        empty={emptyPost}
        postData={postData}
        postImage={postImage}
        spotId={spotId}
        loading={loading}
        onClose={() => setModalVisible(false)}
        spotName={spotName}
      />

      {mapfixed ? (
        <View style={styles.mapfixed}>
          <TouchableOpacity
            style={styles.mapbutton}
            onPress={() => setmapfixeds()}
          >
            <Image
              source={require("./../image/MapFixed.png")}
              style={styles.footerImage}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mapfixed}>
          <TouchableOpacity
            style={styles.mapbutton}
            onPress={() => setmapfixeds()}
          >
            <Image
              source={require("./../image/MapUnFixed.png")}
              style={styles.footerImage}
            />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.defaultlocation}>
        <TouchableOpacity
          style={styles.mapbutton}
          onPress={() =>
            defaultlocation(
              position.latitude,
              position.longitude,
              LATITUDE_DELTA,
              LONGITUDE_DELTA
            )
          }
        >
          <Image
            source={require("./../image/Location.png")}
            style={styles.footerImage}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        {user ? (
          <View style={styles.postbutton}>
            <Pressable
              style={styles.footerbutton}
              onPress={() => {
                if (postButtonVisible) {
                  handlePost();
                }
              }}
            >
              <Image
                source={require("./../image/NewPost.png")}
                style={styles.footerImage}
              />
              <Text style={styles.listProfileNameText}>投稿</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <Pressable
              style={styles.footerbutton}
              onPress={() => {
                router.push({ pathname: "/loginForm" });
              }}
            >
              <Image
                source={require("./../image/NewPost.png")}
                style={styles.footerImage}
              />
              <Text style={styles.listProfileNameText}>投稿</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.searchButton}>
          <TouchableOpacity
            style={styles.footerbutton}
            onPress={() => {
              router.push({
                pathname: "/search",
              });
            }}
          >
            <Image
              source={require("./../image/Search.png")}
              style={styles.footerImage}
            />
            <Text style={styles.listProfileNameText}>検索</Text>
          </TouchableOpacity>
        </View>
        {user ? (
          <View style={styles.loignBtnContainer}>
            <TouchableOpacity
              style={styles.footerbutton}
              onPress={() => {
                router.push("/myPage");
              }}
            >
              <Image
                source={require("./../image/User.png")}
                style={styles.footerImage}
              />
              <Text style={styles.listProfileNameText}>マイページ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loignBtnContainer}>
            <TouchableOpacity
              style={styles.footerbutton}
              onPress={() => {
                router.push("/loginForm");
              }}
            >
              <Image
                source={require("./../image/Search.png")}
                style={styles.footerImage}
              />
              <Text style={styles.listProfileNameText}>ログイン</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.settingButton}>
          <TouchableOpacity
            onPress={() => router.push("/setting")}
            style={styles.footerbutton}
          >
            <Image
              source={require("./../image/Setting.png")}
              style={styles.footerImage}
            />
            <Text style={styles.listProfileNameText}>設定</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
