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

          console.log("userData=",userData)  

          tempObj[firstKey] = userData.displayName;   //ユーザーネームを格納
          tempObj[secondKey] = postData.postTxt;    //投稿のテキスト
          tempObj[thirdKey] = photoUri;             //ダウンロードurl保存
          tempObj[forthKey] = userData.photoURL;    //ユーザーアイコンの画像
          tempObj[fifthKey] = postData.userId;      //ユーザーIdの格納
          tempObj[sixthKey] = postData.id;          //投稿のIdを格納

          postArray.push(tempObj);    //postArray配列に投稿データ追加

          cnt = cnt + 1;            //追加
        }
        let empty = false;        //投稿データが空でない事を表す

        setPostData(postArray);   //投稿データをステートに保存
        setEmptyPost(empty);      //投稿データの有無をステートに保存
        setLoading(false);        //ローディング状況を更新
      } else {
        //投稿データが空の場合
        console.log("No documents found with the specified condition");
        setLoading(false);  //ローディング状況を更新
      }
    } catch (error) {
      //エラーキャッチ
      console.error("Error fetching documents: ", error);
    }
  };

  const [markerCords, setMarkerCords] = useState([]); //スポットの情報を格納

  const getPinColor = (marker) => {
    //スポットの色を指定する関数
    try {
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        marker.mapLatitude,
        marker.mapLongitude
      );  //現在地とスポットの距離を測定
      return distance < marker.areaRadius //距離がそのスポットの範囲に
        ? require("../image/pin_orange.png")  //入っていればオレンジ
        : require("../image/pin_blue.png");   //入っていなければ青に変換
    } catch (error) {
      //エラーをキャッチ
      console.error("Error fetching documents: ", error);
    }
  };

  const setmapfixeds = (  //マップの移動を許可するか
    latitude,
    longitude,
    LATITUDE_DELTA,
    LONGITUDE_DELTA
  ) => {
    if (mapfixed == true) {
      //マップの移動ができる状態であれば
      setmapfixed(false); //固定化して
      setInitialRegion({    //現在地にマップの表示を戻す
        latitude: latitude,
        longitude: longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    } else {
      setmapfixed(true);  //マップの移動を許可する
    }
  };

  const fetchAllMarkerCord = async () => {
    const fetchResult = [];   //取得したドキュメントのデータを格納する場所
    setLoading(true);   //ローディング状態である
    try {
      const querySnapshot = await firestore()
        .collection("spot")   //spotテーブルから
        .orderBy("id")      //idの昇順でスポットを取り出す
        .get();

      if (!querySnapshot.empty) {   //取得したデータが存在するかの確認
        querySnapshot.forEach((docs) => {   //querySnapshotのドキュメントを一行ずつ取得、取得したドキュメントはdocsに入る
          const item = docs.data();     //docs(取得したドキュメント一行)のデータを取り出す(JSON形式のドキュメント)
          fetchResult.push(item);     //配列に追加
        });
        console.log("fetchResult=",fetchResult)

        setMarkerCords(fetchResult);    //取得したすべてのデータをステートに保存
      } else {
        //存在しない
        console.log("empty");
      }
    } catch (error) {
      //エラーのキャッチ
      console.error("Error fetching documents: ", error);
    } finally {
      //必ず実行される
      setLoading(false);  //ローディング状況更新
    }
  };

const [Buttonvisible, setbuttonvisible] = useState(false)   //撮影画面に飛ぶボタンを見えなくする

  useEffect(() => {
    //リアルタイムでユーザーの位置情報を監視し、更新
    const watchId = Geolocation.watchPosition(  //ユーザーの位置情報の監視を始める
      (position) => {   //位置情報が更新されるたびに呼び出されるコールバック
        try {
          console.log("position=",position)
          //positionはJSON方式になっており、
          //coords：座標情報
          //coordsには　accuracy：位置情報の精度、altitude：高度、heading：進行方向、latitude：緯度、longitude：経度、speed：ユーザーの移動速度
          //extras：追加情報
          //extrasには　maxCn0：GPS 信号の品質を示す指標、meanCn0：GPSの品質、satellites：GPSの衛星数
          //mocked：模擬データのフラグ　falseは実際の位置情報を表す。trueは模擬データとなる
          //timestamp：位置情報を取得した時間をミリ秒単位で示す
          setPosition(position.coords); //positionステートに座標情報を登録
          if (!initialRegion) {   //位置情報を始めて取得したタイミングで実行
            setInitialRegion({      //地図の初期位置の設定
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            });
            setbuttonvisible(true)    //地図の表示をしたら撮影ボタンも表示する
          } else {
            //エラーの表示
            setError("Position or coords is undefined");
          }
        } catch (error) {
          //エラーの表示
          setError(`Error updating position: ${error.message}`);
        }
      },
      (err) => {
        //エラーの表示
        setError(err.message);
      },
      // { enableHighAccuracy: true, timeout: 10000, distanceFilter: 1 }
      {
        enableHighAccuracy: false,  //高精度な位置情報の取得をするか(true:高精度、false:精度を下げる、速い)
        timeout: 20000, //位置情報取得のタイムアウト
        distanceFilter: 5,  //位置情報の更新を何メートルおきに行うか
        maximumAge: 1000,   //取得できる位置情報の最大年齢
      }
    );
    return () => Geolocation.clearWatch(watchId); //位置情報の監視を終了する
  }, [initialRegion]);    //initialRegionが変更されるたびにこのuseEffectが再実行されます

  useEffect(() => {
    console.log("auth.currentUser=",auth.currentUser)   
    setUser(auth.currentUser);    //ログインしているユーザーの取得
    fetchAllMarkerCord();
  }, []);

  return (  //画面に表示される内容
    <SafeAreaView style={StyleSheet.absoluteFillObject} /*ステータスバーなどを考慮したビュー*/>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }} /* flex1で利用可能なスペースを全て埋めるビュー、justifyContent: "center", alignItems: "center"ですべて中央へ */>
        <Text style={{ fontSize: 18, fontWeight: "bold" }} /* ローディングテキスト */>読み込み中...</Text >
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {initialRegion && (   //initialRegion が存在する場合のみ実行
        <MapView
          key={`${initialRegion.latitude}-${initialRegion.longitude}`}  //地図上の位置が変更されたときに再描画するためのkey
          style={StyleSheet.absoluteFillObject} //地図が画面全体を埋めるようにする
          customMapStyle={customMapStyle} //地図の外観変更
          initialRegion={initialRegion} //地図の初期位置を設定
          region={initialRegion}  //地図の表示領域
          scrollEnabled={mapfixed}  //地図のスクロールの有効化、無効化
          zoomEnabled={mapfixed}  //地図の拡大有効化無効化
          rotateEnabled={mapfixed}  //地図の回転有効化、無効化
          pitchEnabled={mapfixed} //地図の傾き有効化、無効化
        >
          <Marker //現在地のピン
            coordinate={{ //ピンの位置
              latitude: position.latitude,
              longitude: position.longitude,
            }}  
            initialRegion={{  //ピンの初期表示領域
              latitude: position.latitude,
              longitude: position.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            }}
          >
            <View style={styles.radius} /*マーカーの周りの円 */>
              <View style={styles.marker} /*マーカーの表示*//>
            </View>
          </Marker>

          {markerCords.map((marker) => (  //スポットの情報を使う、配列の各要素ごとに行う
            <Marker
              key={marker.id} //スポットごとに識別するためのkey
              coordinate={{   //マーカーの位置を設定
                latitude: parseFloat(marker.mapLatitude),   //parseFloatで数値に変換する
                longitude: parseFloat(marker.mapLongitude),
              }}
              title={marker.name} //マーカーをタップしたときに表示される情報
              onPress={() => setmodal(marker)}    //マーカーがクリックされたときのイベント
            >
              <Image
                source={getPinColor(marker)}  //現在マーカーの色を取得して反映する
                style={styles.markerImage} //ピンの色
              />
            </Marker>
          ))}
        </MapView>
      )}

      <MyModal  //モーダルの表示
        visible={modalVisible}  //モーダルが表示されるかどうか
        empty={emptyPost} //投稿データが空でないかの確認
        postData={postData} //モーダルに表示する投稿データ
        spotId={spotId} //スポットのID
        loading={loading} //ローディング中であるかどうか
        onClose={() => setModalVisible(false)}  //モーダルを閉じるときの動き
      />

      {user ? (   //ユーザーが存在するかの確認
        <Link //カメラ画面に遷移するためのリンク
          href={{ //cameraに飛ばす。現在の経緯度スポットIDをリンクに含める
            pathname: "/camera",
            params: {
              latitude: position.latitude,
              longitude: position.longitude,
              spotId: 0,
            },
          }}
          asChild //Linkをコンポーネントとして使用する
          visible="false" //リンクの可視性
        >
          <Pressable  //カメラ画面に遷移するボタン
            style={{
              position: "absolute",
              alignSelf: "center",
              bottom: 50,
              width: 75,
              height: 75,
              backgroundColor: "blue",
              borderRadius: 75,
              display: Buttonvisible ? "flex":"none"  //BUttonvisibleがtrue:falseで表示を扱う
            }}
          ></Pressable>
        </Link>
      ) : (//userが存在しない場合の処理
        <Link
          href={{
            pathname: "/loginForm", //リンク先をログインフォームに変更している
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

      {user ? ( //ログイン状態であれば
        <View style={styles.loignBtnContainer}>
          {/* <Button title="ログアウト" onPress={signout} /> */}
          <Link href={{ pathname: "/myPage" }} asChild/* リンク先をマイページ画面へ */> 
            <Button title="マイページ" />
          </Link>
        </View>
      ) : ( //ログインしていなかったら
        <View style={styles.loignBtnContainer}>
          <Link href={{ pathname: "/loginForm" }} asChild/*リンク先をログイン画面へ */>
            <Button title="ログイン" />
          </Link>
        </View>
      )}
      {mapfixed ? ( //マップが移動可能なら
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
      ) : ( //マップが移動不可なら
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
