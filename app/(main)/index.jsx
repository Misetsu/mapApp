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
  const [spotId, setSpotId] = useState(0);  //スポットのIDを管理する
  const [user, setUser] = useState(null); //ユーザー情報を保持する
  const [mapfixed, setmapfixed] = useState(false);  //マップの固定化を管理する

  const setmodal = (marker) => {
    //マーカーがタップされたときのアクション
    try {
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        marker.mapLatitude,
        marker.mapLongitude
      );
      if (distance < marker.areaRadius) {
        //距離がスポットのエリア内かのチェックし、エリア内であればスポットIdのidとモーダルの表示と写真のデータを保存する
        setSpotId(marker.id);
        setModalVisible(true);
        fetchPostData(marker.id);
      } else {
        //範囲外であればモーダルを表示しない
        setModalVisible(false);
      }
    } catch (error) {
      //エラーが起きた時
      console.error("Error fetching documents: ", error);
    }
  };

  function toRadians(degrees) {
    //経緯度の差をラジアンという単位に変換する
    try {
      return (degrees * Math.PI) / 180;
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  }

  // 2点間の距離を計算する関数
  function calculateDistance(lat1, lon1, lat2, lon2) {
    try { //tryでエラーをキャッチする
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
      //エラーをキャッチした場合実行
      console.error("Error fetching documents: ", error);
    }
  }

  const [loading, setLoading] = useState(true); //モーダルのローディング状態を保存する
  const [postData, setPostData] = useState([]); //画像のデータを管理する
  const [emptyPost, setEmptyPost] = useState(true); //投稿があるか確認している

  const fetchPostData = async (spotId) => {
    //投稿の取得を行う非同期関数
    setLoading(true); //ローディング中である
    try {
      const postArray = [];
      const friendList = [];

      setEmptyPost(true);

      
      const queryFollow = await firestore()
        .collection("follow") //followテーブルから
        .where("followerId", "==", auth.currentUser.uid)  //現在ログインいているユーザーのIDとフォローしている人のidが一致するか
        .get();

      if (!queryFollow.empty) { //結果が空で無い場合
        let cnt = 0;    //カウンター
        while (cnt < queryFollow.size) {    //取得したドキュメント数よりも小さい間ループ
          const followSnapshot = queryFollow.docs[cnt]; 
          const followData = followSnapshot.data(); //cnt番地のドキュメントスナップショットを取得する
          friendList.push(followData.followeeId); //ログインしているユーザーがフォローしているユーザーのidをlistに格納
          cnt = cnt + 1;
        }
      } else {
        friendList.push("");  //友達おらん;;
      }
      const querySnapshot = await firestore()
        .collection("post") //postテーブルの
        .where("spotId", "==", spotId)  //タップしたスポットのIDと一致するスポットIDで
        .where("userId", "in", friendList) // userIdがfriendListに入っているIDのいずれかにマッチするアイテム
        .get();   //を取り出す
      if (!querySnapshot.empty) { //取り出した写真が存在するか
        const size = querySnapshot.size;  //ドキュメントの数
        let cnt = 0;  //カウンター
        while (cnt < size) {  //ドキュメントの数だけループ
          const documentSnapshot = querySnapshot.docs[cnt]; // cnt番目のドキュメントを取得
          console.log("documentSnapshot=",documentSnapshot)
          const postData = documentSnapshot.data(); //取得したドキュメントのデータを保存
          console.log("postData=",postData)

          let photoUri = "";  //画像のダウンロードURLが格納される
          let tempObj = {}; //データを格納するのに使う
          const firstKey = "username";  //ユーザー名を表すキー
          const secondKey = "postText"; //投稿のテキストを表す
          const thirdKey = "photoUri";  //写真のURIを表す
          const forthKey = "userIcon";  //ユーザーのアイコンを表す
          const fifthKey = "userId";  //ユーザーのIDを表す
          const sixthKey = "postId";  //投稿のIDを表す

          const queryPhoto = await firestore()
            .collection("photo")  //photoテーブルを参照
            .where("postId", "==", postData.id) // photoテーブルのpostIdとpostdataのidが一致したデータをphotoテーブルから持ってくる
            .get(); //一致したデータをqueryPhotoに格納
          if (!queryPhoto.empty) {  //queryPhotoが空でないかをたしかめる
            const photoSnapshot = queryPhoto.docs[0]; // 最初のドキュメントを取得
            //photoSnapshotのはJSON形式でプロパティには
            //data:ドキュメントに含まれるデータ(ImagePath(ファイルパス)、postId、spotId、userIdが入っている
            //exists：ドキュメントが存在するか(true:存在する、false:存在しない)
            //metadata：ドキュメントの取得情報やキャッシュ情報
            //ref：ドキュメントの参照情報
            console.log("photoSnapshot=",photoSnapshot)
            const photoData = photoSnapshot.data(); //photoSnapshotのdataだけを切り取って格納する
            console.log("photoData=",photoData)

            if (photoData.imagePath) {  //imagePathがあるか確認
              const url = await storage()   //storage() 関数は、Firebase Storage のインスタンスを取得するために使用される関数
                .ref(photoData.imagePath)   //Firebase Storage内のファイルの参照をする
                .getDownloadURL();  //参照したファイルのダウンロードURLを取得する
              photoUri = url; //urlを格納
            }
          }

          const queryUser = await firestore()
            .collection("users")  //usersテーブルから
            .where("uid", "==", postData.userId)  //uidとuserIdが一致したアイテムを
            .get(); //取り出す
          const userSnapshot = queryUser.docs[0];   //ドキュメントの取得
          const userData = userSnapshot.data();     //dataの取得

          tempObj[firstKey] = userData.displayName;
          tempObj[secondKey] = postData.postTxt;
          tempObj[thirdKey] = photoUri;
          tempObj[forthKey] = userData.photoURL;
          tempObj[fifthKey] = postData.userId;
          tempObj[sixthKey] = postData.id;

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

  const [markerCords, setMarkerCords] = useState([]);
  const [photodata, setphotodata] = useState();

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

const [Buttonvisible, setbuttonvisible] = useState(false)

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
            setbuttonvisible(true)
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
          visible="false"
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
              display: Buttonvisible ? "flex":"none"
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
          {/* <Button title="ログアウト" onPress={signout} /> */}
          <Link href={{ pathname: "/myPage" }} asChild>
            <Button title="マイページ" />
          </Link>
        </View>
      ) : (
        <View style={styles.loignBtnContainer}>
          <Link href={{ pathname: "/loginForm" }} asChild>
            <Button title="ログイン" />
          </Link>
        </View>
      )}
      {mapfixed ? (
        <View style={styles.mapfixed}>
          <Button
            title="マップ固定"
            onPress={() =>
              setmapfixeds(
                position.latitude,
                position.longitude,
                LATITUDE_DELTA,
                LONGITUDE_DELTA
              )
            }
          />
        </View>
      ) : (
        <View style={styles.mapfixed}>
          <Button
            title="マップ移動"
            onPress={() =>
              setmapfixeds(
                position.latitude,
                position.longitude,
                LATITUDE_DELTA,
                LONGITUDE_DELTA
              )
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default TrackUserMapView;
