import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Modal,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Link, useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import FirebaseAuth from "@react-native-firebase/auth";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/FontAwesome5";
import {Animated, PanResponder } from 'react-native';

const auth = FirebaseAuth();
const router = useRouter();
const reference = storage();

const SlideButton = ({ onComplete, slideBtn }) => {
  const [slideAnim] = useState(new Animated.Value(0)); // スライド位置のアニメーション値

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (e, gestureState) => {
      const { dx } = gestureState;

      // 左右の制限を設定（ボタンの幅を考慮）
      if (dx >= 0 && dx <= 250) {
        slideAnim.setValue(dx);
      } else if (dx < 0) {
        slideAnim.setValue(0); // 左にスライドしたときは元の位置に戻す
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      const { dx } = gestureState;

      if (dx >= 250) {
        // スライドが成功した場合のアクション（右から左へのスライド）
        onComplete();
      } else if (dx <= -250) {
        // スライドが成功した場合のアクション（左から右へのスライド）
        onComplete();
      } else {
        // スライドが不十分の場合、元に戻す
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  return (
    <View style={styles.track}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.slider, { transform: [{ translateX: slideAnim }] }]}
      >
      </Animated.View>
      <Text style={styles.slideBtn}>{slideBtn}</Text>
    </View>
  );
};

const myPage = () => {
  const [user, setUser] = useState(null); // 現在のユーザー情報を保持
  const [photoUri, setPhotoUri] = useState(""); // プロフィール画像のURL
  const [displayName, setDisplayName] = useState(""); // ユーザーの表示名
  const [displayEmail, setDisplayEmail] = useState(""); // ユーザーの表示名
  const [userStatus, setUserStatus] = useState(0);
  const [editable, setEditable] = useState(false);
  const [followerList, setFollowerList] = useState([]);
  const [followList, setFollowList] = useState([]);
  const [isFollowModalVisible, setIsFollowModalVisible] = useState(false); // フォローモーダルの表示状態を管理
  const [isFollowerModalVisible, setIsFollowerModalVisible] = useState(false); // フォロワーモーダルの表示状態を管理

  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };

  useEffect(() => {
    // ユーザーデータを取得するための非同期関数
    const fetchUserData = async () => {
      setUser(auth.currentUser);
      setDisplayEmail(auth.currentUser.email);
      setDisplayName(auth.currentUser.displayName);
      setPhotoUri(auth.currentUser.photoURL);
      const queryUser = await firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .get();
      const userData = queryUser.data();
      setUserStatus(userData.publicStatus);

      // フォロー中取得
      const queryFollow = await firestore()
        .collection("follow")
        .where("followerId", "==", auth.currentUser.uid)
        .get();

      if (!queryFollow.empty) {
        let cnt = 0;
        let followArray = [];
        const firstKey = "uid";
        const secondKey = "displayName";
        const thirdKey = "photoURL";
        while (cnt < queryFollow.size) {
          let tempObj = {};
          const followData = queryFollow.docs[cnt].data();
          const queryUser = await firestore()
            .collection("users")
            .where("uid", "==", followData.followeeId)
            .get();
          const userData = queryUser.docs[0].data();

          tempObj[firstKey] = userData.uid;
          tempObj[secondKey] = userData.displayName;
          tempObj[thirdKey] = userData.photoURL;

          followArray.push(tempObj);

          cnt = cnt + 1;
        }
        setFollowList(followArray);
      }

      // フォロー中取得
      const queryFollower = await firestore()
        .collection("follow")
        .where("followeeId", "==", auth.currentUser.uid)
        .get();

      if (!queryFollower.empty) {
        let cnt = 0;
        let followerArray = [];
        const firstKey = "uid";
        const secondKey = "displayName";
        const thirdKey = "photoURL";
        while (cnt < queryFollower.size) {
          let tempObj = {};
          const followerData = queryFollower.docs[cnt].data();
          const queryUser = await firestore()
            .collection("users")
            .where("uid", "==", followerData.followerId)
            .get();
          const userData = queryUser.docs[0].data();

          tempObj[firstKey] = userData.uid;
          tempObj[secondKey] = userData.displayName;
          tempObj[thirdKey] = userData.photoURL;

          followerArray.push(tempObj);

          cnt = cnt + 1;
        }
        setFollowerList(followerArray);
      }
    };

    fetchUserData();
  }, []);

  const handleEdit = () => {
    setEditable(true);
  };

  // ユーザーの表示名を保存する関数
  const handleSave = async () => {
    if (user) {
      await firestore().collection("users").doc(user.uid).update({
        displayName: displayName,
      });
      await auth.currentUser.updateProfile({ displayName: displayName });
      setEditable(false); // 編集モードを終了
    }
  };

  // 画像ピッカーを開いて画像を選択する関数
  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const { uri } = result.assets[0];
      const photoUri = await uploadPhoto(uri); // 画像をアップロードし、URLを取得
      setPhotoUri(photoUri);
    }
  };

  // 画像をアップロードする関数
  const uploadPhoto = async (uri) => {
    const uploadUri = uri;
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const imagePath =
      "profile/photo" + new Date().getTime().toString() + randomNumber;
    await reference.ref(imagePath).putFile(uploadUri);

    const url = await reference.ref(imagePath).getDownloadURL();

    await firestore()
      .collection("users")
      .doc(auth.currentUser.uid)
      .update({ photoURL: url });

    const update = {
      photoURL: url,
    };
    await auth.currentUser.updateProfile(update);

    return url;
  };

  const handleStatus = async () => {
    if (userStatus == 1) {
      await firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .update({ publicStatus: 0 });
      setUserStatus(0); // 公開状態に設定
    } else {
      await firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .update({ publicStatus: 1 });
      setUserStatus(1); // 非公開状態に設定
    }
  };
  

  // const [userStatus, setUserStatus] = useState(0); // userStatusの状態

  // const handleStatus = () => {
  //   // userStatusを切り替える
  //   setUserStatus(prevStatus => (prevStatus === 0 ? 1 : 0));
  // };

  const handleProfile = (uid) => {
    if (uid == auth.currentUser.uid) {
      router.push({ pathname: "/myPage" });
    } else {
      router.push({ pathname: "/profile", params: { uid: uid } });
    }
  };

  const handleFollowPress = () => {
    // Followテキストが押されたときにフォローモーダルを表示
    setIsFollowModalVisible(true);
  };

  const handleFollowerPress = () => {
    // Followerテキストが押されたときにフォロワーモーダルを表示
    setIsFollowerModalVisible(true);
  };

  const handleCloseFollowModal = () => {
    // フォローモーダルを閉じる
    setIsFollowModalVisible(false);
  };

  const handleCloseFollowerModal = () => {
    // フォロワーモーダルを閉じる
    setIsFollowerModalVisible(false);
  };

  const signout = async () => {
    await auth.signOut();
    router.replace({ pathname: "/" });
  };
  
  //

  return (
    <ScrollView>
      <TouchableOpacity 
          onPress={() => router.push({ pathname: '/myPage' })}
          style={{
          width: 50,   // 横幅を設定
          height: 50,  // 高さを設定
          justifyContent: 'center', // 縦中央揃え
          alignItems: 'center', // 横中央揃え
        }}>
        {/* 右側のアイコンやテキストをここに追加 */}
        <Icon name="angle-left" size={24} color="#000" />
      </TouchableOpacity>
      <View style={{ 
      flexDirection: 'row', // 横並びに配置
      justifyContent: 'space-between', // 左右にスペースを均等に配置
      alignItems: 'center', // 縦方向の中央揃え
      padding: 10, // パディングを追加
      height: 50 // 高さを指定
    }}>

    </View>
    
      <View style={styles.container}>

        {editable ? (
          <TouchableOpacity style={styles.submit} onPress={handleSave}>
            <Text style={styles.submitText}>SAVE</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={() => router.push("/profileEdit")}>
            <Text style={styles.buttonText}>EDIT</Text>
          </TouchableOpacity>
        )}

<View style={styles.container}>
      {userStatus === 0 ? (
        <SlideButton
          onComplete={handleStatus}
          slideBtn="Public to Private"
        />
      ) : (
        <SlideButton
          onComplete={handleStatus}
          slideBtn="Private to Public"
        />
      )}
    </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: '#FF6666' }]} onPress={signout}>
        <Text style={styles.buttonText}>LOGOUT</Text>
      </TouchableOpacity>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  profileContainer: {
    alignItems: "center",
  },
  button: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F2F2",
    height: 50,
    marginBottom: 10, // ボタン間にスペースを追加
  },
  closeButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  buttonText: {
    fontSize: 18,
    color: "black",
    textAlign: "center",
    fontWeight: "300",
  },
  pagetitle: {
    fontSize: 30,
    margin: 10,
    textAlign: "center",
    fontWeight: "300",
  },
  displayName: {
    fontSize: 15,
    marginTop: 10,
    marginLeft: 10,
    textAlign: "left",
    alignItems: "flex-start",
    fontWeight: "300",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ccc",
  },
  followList: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    margin: 10,
  },
  listProfileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  FFtext: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  FFcontainer: {
    flexDirection: "row", // 子要素を横並びに配置
    justifyContent: "space-between", // 子要素間にスペースを空ける
    alignItems: "center", // 垂直方向の中央に揃える
    width: "80%", // 横幅を80%に設定（任意）
    padding: 5, // 全体にパディング
  },
  FFnum: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // 背景を半透明に
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  textInput: {
    margin: 10,
    marginTop: 0,
    fontSize: 20,
    height: 40,
    borderBottomWidth: 2,
    marginVertical: 16,
    color: "black",
    fontWeight: "300",
  },
  submit: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    height: 50,
    marginBottom: 10,
  },
  submitText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f2f2f2",
    textAlign: "center",
  },
  linklabel: {
    fontSize: 16,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "center",
    textDecorationLine: "underline",
    color: "#1a0dab",
    fontWeight: "600",
  },
  backButton: {
    justifyContent: "center",
    alignItems: "center",
    height: 50,
  },
  backButtonText: {
    fontSize: 18,
    color: "black",
    textAlign: "center",
    fontWeight: "300",
  },
  // 
  //
  //
  container: {
    flex: 1,
    padding: 20,
  },
  track: {
    width: 300,
    height: 50,
    backgroundColor: '#ddd',
    borderRadius: 25,
    justifyContent: 'center',
    padding: 5,
    position: 'relative',
  },
  slider: {
    width: 50,
    height: 40,
    backgroundColor: '#ff6347',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  sliderText: {
    color: '#fff',
    fontSize: 20,
  },
  slideBtn: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -75 }],
    color: '#333',
    fontSize: 16,
  },
});

export default myPage;
