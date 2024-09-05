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
  Modal,
  ScrollView,
  TouchableOpacity
} from "react-native";
import { Link } from "expo-router";
import Geolocation from "@react-native-community/geolocation";
import MapView, { Marker } from "react-native-maps";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";

//import { customMapStyle } from "../component/mapLayout.jsx";


const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する
const ASPECT_RATIO = width / height; //アスペクト比
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO; //地図の表示範囲

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
  const [mapfixed,setmapfixed] = useState(false);


  

  useEffect(() => {
      // コンポーネントがマウントされたときに実行する処理
      handleMarkerPress(0, 0);
    }, []);
  

  const handleMarkerPress = (latitude, longitude) => {
    try{
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
  }catch (error) {console.error("Error fetching documents: ", error);}
  };

  const setmodal = (marker) => {
    try{
    const distance = calculateDistance(
      position.latitude,
      position.longitude,
      marker.mapLatitude,
      marker.mapLongitude
    );
    if (distance < marker.areaRadius) {
      //距離が50m以上離れているかのチェック
      fetchImageUri(marker.id);
      fetchTextData(marker.id);
      setSpotId(marker.id);
      setModalVisible(true);
    } else {
      setModalVisible(false);
    }
  }catch (error) {console.error("Error fetching documents: ", error);}
  };

  function toRadians(degrees) {
    try{
    return (degrees * Math.PI) / 180;
  }catch (error) {console.error("Error fetching documents: ", error);}
  }

  function closemodal(){
    try {
    setImageUri("")
    setModalVisible(false)
  }catch (error) {console.error("Error fetching documents: ", error);}
  }

  // 2点間の距離を計算する関数
  function calculateDistance(lat1, lon1, lat2, lon2) {
    try{
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
  }catch (error) {console.error("Error fetching documents: ", error);}
  }

  const [imageUri, setImageUri] = useState("");
  const [textData, setTextData] = useState("");
  const [loading, setLoading] = useState(true);

  const [spotImageList, setspotImageList] = useState([]);
  const fetchImageUri = async (spotid) => {
    try {
      const imagelist = []
      setspotImageList(imagelist)
      setLoading(true);
      const querySnapshot = await firestore()
        .collection("photo")
        .where("spotId", "==", spotid) // 特定の条件を指定
        .get();

      if (!querySnapshot.empty) {
        const size = querySnapshot.size;
        let cnt = 0;
        while (cnt < size) {
          const documentSnapshot = querySnapshot.docs[cnt]; // 最初のドキュメントを取得
          const data = documentSnapshot.data();
          console.log("Document data:", data.imagePath);

          if (data.imagePath) {
            const url = await storage().ref(data.imagePath).getDownloadURL();
            console.log(`awawawawaawaw-----${url}`);
            imagelist.push(url);
            cnt = cnt + 1;
          } else {
            console.log("No imagePath field in document");
          }
          setspotImageList(imagelist);
        }
      } else {
        setImageUri("");
        console.log("No documents found with the specified condition");
      }
    } catch (error) {
      console.error("Error fetching documents: ", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTextData = async (spotId) => {
    try {
      const querySnapshot = await firestore()
        .collection("post")
        .where("spotId", "==", spotId) // 特定の条件を指定
        .get();

      if (!querySnapshot.empty) {
        const documentSnapshot = querySnapshot.docs[0]; // 最初のドキュメントを取得
        const data = documentSnapshot.data();
        console.log("Document data:", data);

        if (data) {
          setTextData(data);
        } else {
          console.log("No textData field in document");
        }
      } else {
        setTextData("");
        console.log("No documents found with the specified condition");
      }
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  };

  const [markerCords, setMarkerCords] = useState([]);
  const [photodata, setphotodata] = useState();

  const getPinColor = (marker) => {
    try{
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

  const setmapfixeds = (latitude,longitude,LATITUDE_DELTA,LONGITUDE_DELTA) => {
    if(mapfixed == true){
      setmapfixed(false);
        setInitialRegion({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
        console.log(initialRegion);
    }
    else
    {
      setmapfixed(true);
    }
  }
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

        // const item = querySnapshot.docs[0].data();
        // fetchResult.push(item);

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
      { enableHighAccuracy: true, timeout: 10000, distanceFilter: 1 }
    );
    return () => Geolocation.clearWatch(watchId);
  }, [initialRegion]);

  useEffect(() => {
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
            initialRegion={
              {
                latitude: position.latitude,
                longitude: position.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
              }
            }
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
        imageUri={spotImageList[0]}
        textData={textData}
        spotImageList={spotImageList}
        spotId={spotId}
        onClose={() => setModalVisible(false)}
      />

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

      <View style={styles.loignBtnContainer}>
        <Link href={{ pathname: "/loginForm" }} asChild>
          <Button title="ログイン" />
        </Link>
      </View>
      <View style={styles.mapfixed}>
          <Button title="マップ動かす"
          onPress={() => setmapfixeds(position.latitude,
            position.longitude,
            LATITUDE_DELTA,
            LONGITUDE_DELTA)}/>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  radius: {
    width: 50,
    height: 50,
    borderRadius: 50 / 2,
    overflow: "hidden",
    backgroundColor: "rgba(0, 112, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 112, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 20,
    height: 20,
    borderWidth: 3,
    borderColor: "white",
    borderRadius: 20 / 2,
    overflow: "hidden",
    backgroundColor: "#007AFF",
  },
  spot: {
    width: 20,
    height: 20,
    borderWidth: 3,
    borderColor: "white",
    borderRadius: 20 / 20,
    overflow: "hidden",
    backgroundColor: "#c71585",
  },
  container: {
    width: "100%",
    height: "100%",
  },
  map: {
    flex: 1,
  },
  debugContainer: {
    backgroundColor: "#fff",
    opacity: 0.8,
    position: "absolute",
    bottom: 10,
    left: 10,
    padding: 10,
  },
  errorContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "red",
    padding: 10,
  },
  errorText: {
    color: "#fff",
    textAlign: "center",
  },
  markerImage: {
    width: 50,
    height: 50,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  loignBtnContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 5,
    padding: 10,
  },
  mapfixed:{
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 5,
    padding: 10,
  }
});

const MyModal = ({ visible, imageUri, textData,spotImageList,onClose }) => {
  return (
    
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={{ backgroundColor: "white", padding: 20 }}>
        <ScrollView>
        {spotImageList.map((imageUri) => (
  <React.Fragment key={imageUri}>
    <Text>{textData.userId}</Text>
    {imageUri ? (
      <Image
        source={{ uri: imageUri }}
        style={{ width: 300, height: 400 }}
      />
    ) : (
      <Text>投稿がありません</Text>
    )}
  </React.Fragment>
))}
{imageUri ? (
<></>
    ) : (
      <Text>投稿がありません</Text>
    )}
          </ScrollView>
          <TouchableOpacity onPress={onClose}>
            <Text>{textData.postTxt}</Text>
            <Text>Close</Text>
          </TouchableOpacity>
          <Link
            href={{
              pathname: "/camera",
              params: {
                latitude: 0,
                longitude: 0,
                spotId: textData.spotId,
              },
            }}
            asChild
          >
            <Pressable
              style={{
                position: "absolute",
                // alignSelf: "center",
                bottom: 5,
                right: 20,
                width: 75,
                height: 45,
                backgroundColor: "blue",
              }}
            ></Pressable>
          </Link>
        </View>
      </View>
      
    </Modal>
  );
};

const customMapStyle = [
  {
    featureType: "poi.business", // ビジネス（ビル、店舗など）のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.business", // ビジネス（ビル、店舗など）のアイコンを非表示
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.attraction", // 観光スポットのラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.government", // 政府機関のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.medical", // 医療施設のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.park", // 公園のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.place_of_worship", // 宗教施設のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.school", // 学校のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.sports_complex", // スポーツ施設のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "road", // 道路の号線表示を非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.locality", // 町、村、区のラベルを非表示
    elementType: "labels.text.fill",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.locality", // 町、村、区のラベルのアウトラインを非表示
    elementType: "labels.text.stroke",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.neighborhood", // 住所（丁目）のラベルを非表示
    elementType: "labels.text.fill",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.neighborhood", // 住所（丁目）のラベルのアウトラインを非表示
    elementType: "labels.text.stroke",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },

  //ここから地図の色
  {
    featureType: "landscape.natural", // 自然地形の色
    elementType: "geometry",
    stylers: [
      {
        color: "#66bb66",
      },
    ],
  },
  {
    featureType: "landscape.man_made", //地面の色
    elementType: "geometry",
    stylers: [
      {
        color: "#e0ffe0",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [
      {
        color: "#6699ff", // 水の色を青色に変更
      },
    ],
  },
  {
    featureType: "road", //  一般道の色
    elementType: "geometry",
    stylers: [
      {
        color: "#404040",
      },
    ],
  },
  {
    featureType: "road", // 一般道の枠線
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#fcfcfc",
        weight: 1,
      },
    ],
  },
  {
    featureType: "road.highway", // 高速道路の色
    elementType: "geometry",
    stylers: [
      {
        color: "#808080",
      },
    ],
  },
  {
    featureType: "road.highway", // 高速道路の枠線の色
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#fcfcfc",
        weight: 1,
      },
    ],
  },
  {
    featureType: "poi.park", // 公園の色
    elementType: "geometry",
    stylers: [
      {
        color: "#99dd66",
      },
    ],
  },
  {
    featureType: "transit.line", // 鉄道の色
    elementType: "geometry",
    stylers: [
      {
        color: "#33ccff",
      },
    ],
  },
  {
    featureType: "transit.line", // 鉄道の枠線の太さ
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#ffffff",
        weight: 1,
      },
    ],
  },
  {
    featureType: "poi.school", // 教育機関の色
    elementType: "geometry",
    stylers: [
      {
        color: "#ffeecc",
      },
    ],
  },
  {
    // 医療機関の背景色を指定（例: 薄いピンク色）
    featureType: "poi.medical",
    elementType: "geometry",
    stylers: [
      {
        color: "#ffdddd",
      },
    ],
  },
];

export default TrackUserMapView;
