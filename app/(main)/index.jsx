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
  Linking,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import MyModal from "../component/modal";
import { customMapStyle, styles } from "../component/styles";
import Toast from "react-native-simple-toast";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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
  const [selectedTag, setSelectedTag] = useState(null);
  const [mapflag, setmapflag] = useState(true);
  const [indexLoading, setIndexLoading] = useState(true);
  const [enableHighAccuracys, setenableHighAccuracy] = useState(false);
  const [markers, setmarkers] = useState([]);
  const [regionflag, setregionflag] = useState(0);
  const [eventVisible, setEventVisible] = useState(true);
  const [eventBannerUrl, setEventBannerUrl] = useState(null);
  const [eventURL, setEventURL] = useState("");
  const mapRef = useRef(null);

  const now = new Date();

  // 24時間前の時刻を計算
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // ISO形式で出力
  const formattedTime = twentyFourHoursAgo.toISOString();

  const setmodal = (marker) => {
    try {
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        marker.mapLatitude,
        marker.mapLongitude
      );
      if (distance < marker.areaRadius) {
        setPostData([]);
        setSpotId(marker.id);
        setspotName(marker.name);
        setModalVisible(true);
        setPostImage(true);
        handleVisitState(marker.id);
        fetchPostData(marker.id, "timeStamp", "desc", []);
        setmarkers(marker);
      } else {
        setPostData([]);
        setSpotId(marker.id);
        setspotName(marker.name);
        setModalVisible(true);
        setPostImage(false);
        fetchPostData(marker.id, "timeStamp", "desc", []);
        setmarkers(marker);
      }
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  };

  useEffect(() => {
    // 初回起動時にURLを取得
    const subscription = Linking.addEventListener("url", (event) => {
      handleOpenURL(event.url);
    });

    return () => subscription.remove();
  }, []);

  const handleOpenURL = (url) => {
    // URLを解析してクエリパラメータを取得
    const queryParams = new URLSearchParams(url.split("?")[1]);
    const spotIdFromUrl = queryParams.get("spotId");
    const latitude = parseFloat(queryParams.get("latitude"));
    const longitude = parseFloat(queryParams.get("longitude"));
    if (latitude != null && longitude != null) {
      setRegion({
        latitude: latitude,
        longitude: longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
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

  const fetchPostData = async (spotId, sort, sortOptions, PostDatas) => {
    setLoading(true);
    if (chosenUser == null && selectedTag == null) {
      try {
        const postArray = [];

        let tuduki;
        if (PostDatas[0] != undefined) {
          const Postsize = PostDatas.length;
          let postcnt = 0;
          while (Postsize > postcnt) {
            postArray.push(PostDatas[postcnt]);
            postcnt = postcnt + 1;
          }
          if (sort == "timeStamp") {
            tuduki = PostDatas[postcnt - 2].timestamp;
          } else {
            tuduki = PostDatas[postcnt - 2].likeCount;
          }
        }

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

        let querySnapshot;
        if (PostDatas[0] == undefined) {
          querySnapshot = await firestore()
            .collection("post")
            .where("spotId", "==", spotId)
            .orderBy(sort, sortOptions)
            .limit(5)
            .get();
        } else {
          querySnapshot = await firestore()
            .collection("post")
            .where("spotId", "==", spotId)
            .orderBy(sort, sortOptions)
            .startAfter(tuduki)
            .limit(5)
            .get();
        }

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
          const tutorialNum = Math.floor(Math.random() * 10);
          const tutorialQuery = await firestore()
            .collection("tutorial")
            .where("id", "==", "00" + tutorialNum)
            .get();
          let tempObj = {};
          let photoUri = "";

          const url = await storage()
            .ref()
            .child(tutorialQuery.docs[0].data().imagePath)
            .getDownloadURL();
          photoUri = url;

          tempObj[firstKey] = "ro12arSIsugfifCz5BABmvOUZVR2";
          tempObj[secondKey] = "Pocape公式";
          tempObj[thirdKey] =
            "https://firebasestorage.googleapis.com/v0/b/mapapp-96457.appspot.com/o/profile%2Fphoto173431670103632?alt=media&token=1bedc16b-1ffe-4c39-9ba5-95ce6314b693";
          tempObj[forthKey] =
            PostDatas.length / 6 + tutorialQuery.docs[0].data().id;
          tempObj[fifthKey] = tutorialQuery.docs[0].data().postTxt;
          tempObj[sixthKey] = photoUri;
          tempObj[seventhKey] = "0";
          tempObj[eighthKey] = 0;
          tempObj[ninthKey] = false;
          tempObj[tenthKey] = 0;

          postArray.push(tempObj);

          setPostData(postArray);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching documents: ", error);
      }
    } else if (selectedTag == null) {
      try {
        const postArray = [];

        let tuduki;
        if (PostDatas[0] != undefined) {
          const Postsize = PostDatas.length;
          let postcnt = 0;
          while (Postsize > postcnt) {
            postArray.push(PostDatas[postcnt]);
            postcnt = postcnt + 1;
          }
          if (sort == "timeStamp") {
            tuduki = PostDatas[postcnt - 1].timestamp;
          } else {
            tuduki = PostDatas[postcnt - 1].likeCount;
          }
        }

        setEmptyPost(true);

        let querySnapshot;
        if (PostDatas[0] == undefined) {
          querySnapshot = await firestore()
            .collection("post")
            .where("spotId", "==", spotId)
            .where("userId", "==", chosenUser)
            .orderBy(sort, sortOptions)
            .limit(5)
            .get();
        } else {
          querySnapshot = await firestore()
            .collection("post")
            .where("spotId", "==", spotId)
            .where("userId", "==", chosenUser)
            .orderBy(sort, sortOptions)
            .startAfter(tuduki)
            .limit(5)
            .get();
        }

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
          const tutorialNum = Math.floor(Math.random() * 3);
          const tutorialQuery = await firestore()
            .collection("tutorial")
            .where("id", "==", "00" + tutorialNum)
            .get();
          let tempObj = {};
          let photoUri = "";

          const url = await storage()
            .ref()
            .child(tutorialQuery.docs[0].data().imagePath)
            .getDownloadURL();
          photoUri = url;

          tempObj[firstKey] = "ro12arSIsugfifCz5BABmvOUZVR2";
          tempObj[secondKey] = "Pocape公式";
          tempObj[thirdKey] =
            "https://firebasestorage.googleapis.com/v0/b/mapapp-96457.appspot.com/o/profile%2Fphoto173431670103632?alt=media&token=1bedc16b-1ffe-4c39-9ba5-95ce6314b693";
          tempObj[forthKey] =
            PostDatas.length / 6 + tutorialQuery.docs[0].data().id;
          tempObj[fifthKey] = tutorialQuery.docs[0].data().postTxt;
          tempObj[sixthKey] = photoUri;
          tempObj[seventhKey] = "0";
          tempObj[eighthKey] = 0;
          tempObj[ninthKey] = false;
          tempObj[tenthKey] = 0;

          postArray.push(tempObj);

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

        let tuduki;
        if (PostDatas[0] != undefined) {
          const Postsize = PostDatas.length;
          let postcnt = 0;
          while (Postsize > postcnt) {
            postArray.push(PostDatas[postcnt]);
            postcnt = postcnt + 1;
          }
          if (sort == "timeStamp") {
            tuduki = PostDatas[postcnt - 1].timestamp;
          } else {
            tuduki = PostDatas[postcnt - 1].likeCount;
          }
        }

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

        let postSnapshot;
        if (PostDatas[0] == undefined) {
          postSnapshot = await firestore()
            .collection("tagPost")
            .where("spotId", "==", spotId)
            .where("tagId", "==", parseInt(selectedTag))
            .orderBy(sort, sortOptions)
            .limit(5)
            .get();
        } else {
          postSnapshot = await firestore()
            .collection("tagPost")
            .where("spotId", "==", spotId)
            .where("tagId", "==", parseInt(selectedTag))
            .orderBy(sort, sortOptions)
            .startAfter(tuduki)
            .limit(5)
            .get();
        }

        const postIdList = [];

        if (!postSnapshot.empty) {
          postSnapshot.forEach((doc) => {
            const item = doc.data();
            postIdList.push(item.postId);
          });
        }

        const querySnapshot = await firestore()
          .collection("post")
          .where("id", "in", postIdList)
          .orderBy(sort, sortOptions)
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
          const tutorialNum = Math.floor(Math.random() * 3);
          const tutorialQuery = await firestore()
            .collection("tutorial")
            .where("id", "==", "00" + tutorialNum)
            .get();
          let tempObj = {};
          let photoUri = "";

          const url = await storage()
            .ref()
            .child(tutorialQuery.docs[0].data().imagePath)
            .getDownloadURL();
          photoUri = url;

          tempObj[firstKey] = "ro12arSIsugfifCz5BABmvOUZVR2";
          tempObj[secondKey] = "Pocape公式";
          tempObj[thirdKey] =
            "https://firebasestorage.googleapis.com/v0/b/mapapp-96457.appspot.com/o/profile%2Fphoto173431670103632?alt=media&token=1bedc16b-1ffe-4c39-9ba5-95ce6314b693";
          tempObj[forthKey] =
            PostDatas.length / 6 + tutorialQuery.docs[0].data().id;
          tempObj[fifthKey] = tutorialQuery.docs[0].data().postTxt;
          tempObj[sixthKey] = photoUri;
          tempObj[seventhKey] = "0";
          tempObj[eighthKey] = 0;
          tempObj[ninthKey] = false;
          tempObj[tenthKey] = 0;

          postArray.push(tempObj);

          setPostData(postArray);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching documents: ", error);
      }
    }
    setLoading(false);
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
        return require("../image/UnvisitedPin_New.png");
      } else {
        return require("../image/UnvisitedPin.png");
      }
    }
  };

  const setmapfixeds = () => {
    if (mapfixed == true) {
      setregionflag(0);
      setmapfixed(false);
      Toast.show("マップを固定しました");
    } else if (mapfixed == false) {
      setregionflag(1);
      setmapfixed(true);
      Toast.show("マップ固定を解除しました");
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
      Toast.show("現在地はこちらです");
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  // ズームイン関数
  const zoomIn = () => {
    mapRef.current.getCamera().then((camera) => {
      camera.zoom += 0.75;
      mapRef.current.animateCamera(camera, { duration: 400 });
    });
  };

  // ズームアウト関数
  const zoomOut = () => {
    mapRef.current.getCamera().then((camera) => {
      camera.zoom -= 0.75;
      mapRef.current.animateCamera(camera, { duration: 400 });
    });
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
    setIndexLoading(false);
  };

  const fetchEvent = async () => {
    const image = await storage()
      .ref()
      .child("event/PortTower.png")
      .getDownloadURL();

    setEventBannerUrl(image);

    const eventSnapshot = await firestore().collection("event").get();
    const url = eventSnapshot.docs[0].data();

    setEventURL(url.url);
  };

  // アイコンマップを定義
  const handleicons = {
    users: require("./../image/Users.png"),
    star: require("./../image/BorderStar.png"), // 他のアイコンを追加
    close: require("./../image/Close.png"), // 他のアイコンを追加
  };

  const handleIconPress = () => {
    if (iconName === "close") {
      setChosenUser(null);
      setmapflag(true);
      setregions(saveregion);
      fetchAllMarkerCord();
      Toast.show("すべてのピンを表示しています");
      if (indexStatus == "follow") {
        setIconName("users"); // アイコン名を "times" に変更
      } else {
        setIconName("star");
      }
    } else if (indexStatus == "follow") {
      setIndexLoading(true);
      handleChangeIndex();
      setIconName("star"); // アイコン名を "times" に変更
      Toast.show("お気に入り");
    } else {
      setIndexLoading(true);
      handleChangeIndex();
      setIconName("users");
      Toast.show("フォロ―中");
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

    if (spotIdList.length == 0) {
      setmapflag(true);
    } else {
      spotIdList.forEach(async (id) => {
        const querySpot = await firestore()
          .collection("spot")
          .where("id", "==", id)
          .get();

        const item = querySpot.docs[0].data();
        fetchResult.push(item);
      });
      setmapflag(false);
      setsaveregions(regions);
      setregions(null);
      setMarkerCords(fetchResult);
    }
    setIconName("close");
    setChosenUser(userId);

    try {
      // userId を直接使ってユーザー情報を取得
      const userDoc = await firestore().collection("users").doc(userId).get();

      // データが存在するかチェック
      if (userDoc.exists) {
        const userData = userDoc.data();
        const userName = userData.displayName; // 同じドキュメント内の displayName を取得
        Toast.show(userName + "さんが投稿しているピンを表示しています");
      } else {
        // Firestoreにデータがない場合
        Toast.show("ユーザー情報が見つかりません");
      }
    } catch (error) {
      Toast.show("ユーザー情報の取得に失敗しました");
    }
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
      setmapflag(false);
      setMarkerCords([]);
    }

    setSelectedTag(parseInt(tagId));

    try {
      // tagId を直接使ってユーザー情報を取得
      const tagQuery = await firestore()
        .collection("tag")
        .where("tagId", "==", tagId)
        .get();

      // データが存在するかチェック
      if (!tagQuery.empty) {
        // 最初の一致したドキュメントを取得
        const tagDoc = tagQuery.docs[0];
        const tagData = tagDoc.data();
        const tagName = tagData.tagName;
        Toast.show(tagName + "タグの投稿があるピンを表示しています");
      } else {
        // Firestoreにデータがない場合
        Toast.show("タグ情報が見つかりません");
      }
    } catch (error) {
      Toast.show("タグ情報の取得に失敗しました");
    }
  };

  const handleCancelTag = () => {
    setmapflag(true);
    setregions(saveregion);
    setSelectedTag(null);
    fetchAllMarkerCord();

    Toast.show("すべてのピンを表示しています");
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
    if (auth.currentUser != null) {
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
    }
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
          if (regionflag == 0) {
            setRegion({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            });
          }
        } catch (error) {
          setError(`Error updating position: ${error.message}`);
        }
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: enableHighAccuracys,
        timeout: 20000,
        distanceFilter: 5,
        maximumAge: 1000,
      }
    );
    setenableHighAccuracy(true);
    return () => Geolocation.clearWatch(watchId);
  }, [position]);

  useEffect(() => {
    setUser(auth.currentUser);
    fetchIndexBar(indexStatus);
    fetchAllTag();
    fetchEvent();
  }, []);

  useEffect(() => {
    fetchAllMarkerCord();
  }, [regions]);

  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject}>
      <StatusBar barStyle={"dark-content"}></StatusBar>
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
          toolbarEnabled={false} // Androidのボタンを無効化
          ref={mapRef}
          key={`${initialRegion.latitude}-${initialRegion.longitude}`}
          provider={PROVIDER_GOOGLE}
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
              {marker.id == 2 ? (
                <Image
                  source={require("../image/PortTower.png")}
                  style={{ width: 80, height: 80 }}
                  visible={true}
                />
              ) : (
                <Image
                  source={getPinColor(marker)}
                  style={styles.markerImage}
                  visible={true}
                />
              )}
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
                {item.lastPostAt >= formattedTime ? (
                  <Image
                    source={{ uri: item.userIcon }}
                    style={styles.newlistProfileImage}
                  />
                ) : (
                  <Image
                    source={{ uri: item.userIcon }}
                    style={styles.listProfileImage}
                  />
                )}
                <Text style={styles.listProfileNameText} numberOfLines={1}>
                  {item.username}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
        {indexLoading ? (
          <View style={styles.listProfileIndexButton}>
            <ActivityIndicator size="large" color="#239D60" />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.listProfileIndexButton}
            onPress={handleIconPress} // 変更した関数を呼び出す
          >
            <Image source={handleicons[iconName]} style={styles.footerImage} />
          </TouchableOpacity>
        )}
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
                style={
                  selectedTag == item.tagId ? styles.selectedTag : styles.tag
                }
                onPress={() => handleTagChoose(item.tagId)}
              >
                <Image
                  source={require("./../image/Tag.png")}
                  style={styles.TagButton}
                />
                <Text>{item.tagName}</Text>
              </TouchableOpacity>
            );
          }}
        />
        {selectedTag == null ? null : (
          <TouchableOpacity onPress={handleCancelTag}>
            <Image
              source={require("./../image/Close.png")}
              style={styles.closeImage}
            />
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {eventBannerUrl && (
        <SafeAreaView style={styles.eventContainer}>
          <TouchableOpacity
            style={styles.mapbutton}
            onPress={() => {
              setEventVisible(!eventVisible);
            }}
          >
            <Icon name="party-popper" size={30} color="#239D60" />
          </TouchableOpacity>
          {eventVisible && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              style={{ width: width * 0.6, height: (width * 0.6) / 4 }}
            >
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL(eventURL);
                }}
              >
                <Image
                  source={{ uri: eventBannerUrl }}
                  style={{ width: "100%", height: "100%" }}
                />
              </TouchableOpacity>
            </Animated.View>
          )}
        </SafeAreaView>
      )}

      <MyModal
        visible={modalVisible}
        empty={emptyPost}
        postData={postData}
        postImage={postImage}
        spotId={spotId}
        loading={loading}
        onClose={() => setModalVisible(false)}
        spotName={spotName}
        marker={markers}
        fetchPostData={fetchPostData}
      />

      {initialRegion && (
        <View style={styles.toolBar}>
          {mapfixed ? (
            <View style={styles.mapfixed}>
              <TouchableOpacity
                style={styles.mapbutton}
                onPress={() => setmapfixeds()}
              >
                <Image
                  source={require("./../image/MapFixed.png")}
                  style={styles.mapbuttonImage}
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
                  style={styles.mapbuttonImage}
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
                style={styles.mapbuttonImage}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.mapZoom}>
            <TouchableOpacity
              style={styles.mapbutton}
              onPress={zoomIn} // 拡大
            >
              <Image
                source={require("./../image/Plus.png")}
                style={styles.mapbuttonImage}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.mapZoomout}>
            <TouchableOpacity
              style={styles.mapbutton}
              onPress={zoomOut} // 縮小
            >
              <Image
                source={require("./../image/Minus.png")}
                style={styles.mapbuttonImage}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

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
              user
                ? router.push({
                    pathname: "/search",
                  })
                : router.push({
                    pathname: "/loginForm",
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
                source={require("./../image/User.png")}
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
