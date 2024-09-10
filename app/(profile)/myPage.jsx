import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Modal,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Link, useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import FirebaseAuth from "@react-native-firebase/auth";
import * as ImagePicker from "expo-image-picker";

const auth = FirebaseAuth();
const router = useRouter();
const reference = storage();

const myPage = () => {
  const [user, setUser] = useState(null); // 現在のユーザー情報を保持
  const [photoUri, setPhotoUri] = useState(""); // プロフィール画像のURL
  const [displayName, setDisplayName] = useState("KENTA"); // ユーザーの表示名
  const [displayEmail, setDisplayEmail] = useState("kobe@denshi.jp"); // ユーザーの表示名
  const [editable, setEditable] = useState(false);
  const [followerList, setFollowerList] = useState([]);
  const [followList, setFollowList] = useState([]);

  useEffect(() => {
    // ユーザーデータを取得するための非同期関数
    const fetchUserData = async () => {
      setUser(auth.currentUser);
      setDisplayEmail(auth.currentUser.email);
      setDisplayName(auth.currentUser.displayName);
      setPhotoUri(auth.currentUser.photoURL);

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

      // フォロワー取得
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

  const handleProfile = (uid) => {
    router.push({ pathname: "/profile", params: { uid: uid } });
  };

  const [isFollowModalVisible, setIsFollowModalVisible] = useState(false); // フォローモーダルの表示状態を管理
  const [isFollowerModalVisible, setIsFollowerModalVisible] = useState(false); // フォロワーモーダルの表示状態を管理

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

  const navigateHome = () => {
    router.push("/index");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileContainer}>
        {/* フォロワーの検索へのボタン */}
        <View style={styles.searchbtn}>
          <Link href={{ pathname: "/search" }} asChild>
            <Button title="SEARCH Follower" />
          </Link>
        </View>

        {/* プロフィール画像がある場合に表示し、ない場合はプレースホルダーを表示。画像タップでライブラリを開く*/}
        <TouchableOpacity onPress={handlePickImage}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder} />
          )}
        </TouchableOpacity>

        {/* フォロー、フォロワーを表示 */}
        <View style={styles.FFnum}>
          <TouchableOpacity onPress={handleFollowPress}>
            <Text style={styles.text}>Follow: {followList.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleFollowerPress}>
            <Text style={styles.text}>Follower: {followerList.length}</Text>
          </TouchableOpacity>
        </View>

        {/* フォローモーダル */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isFollowModalVisible}
          onRequestClose={handleCloseFollowModal} // Androidの戻るボタンで閉じるために必要
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text>Follow</Text>
              {followList.map((follow) => {
                return (
                  <TouchableOpacity
                    key={follow.uid}
                    style={styles.followList}
                    onPress={() => {
                      handleProfile(follow.uid);
                    }}
                  >
                    <Image
                      source={{ uri: follow.photoURL }}
                      style={styles.listProfileImage}
                    />
                    <Text>{follow.displayName}</Text>
                  </TouchableOpacity>
                );
              })}
              <Button title="閉じる" onPress={handleCloseFollowModal} />
            </View>
          </View>
        </Modal>

        {/* フォロワーモーダル */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isFollowerModalVisible}
          onRequestClose={handleCloseFollowerModal} // Androidの戻るボタンで閉じるために必要
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text>Follower</Text>
              {followerList.map((follower) => {
                return (
                  <TouchableOpacity
                    key={follower.uid}
                    style={styles.followList}
                    onPress={() => {
                      handleProfile(follower.uid);
                    }}
                  >
                    <Image
                      source={{ uri: follower.photoURL }}
                      style={styles.listProfileImage}
                    />
                    <Text>{follower.displayName}</Text>
                  </TouchableOpacity>
                );
              })}
              <Button title="閉じる" onPress={handleCloseFollowerModal} />
            </View>
          </View>
        </Modal>

        {/* プロフィール情報の表示 */}
        {editable ? (
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
          />
        ) : (
          <Text style={styles.displayName}>{displayName}</Text>
        )}
        <Text style={styles.displayEmail}>{displayEmail}</Text>

        {/* 編集モードか通常モードでボタンの表示を切り替える */}
        {editable ? (
          <Button title="保存" onPress={handleSave} />
        ) : (
          <Button title="編集" onPress={handleEdit} />
        )}

        {/* サインアウトボタン */}
        <View style={styles.signoutBtn}>
          <Button title="Sign out" onPress={signout} />
        </View>

        {/* ホームに戻るボタンを追加 */}
      <View style={styles.homeButtonContainer}>
        <Button
          title="ホームに戻る"
          onPress={() => router.push("/")}
          color="#841584"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  profileContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: "gray",
  },
  profileImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "gray",
  },
  FFnum: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  text: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  displayName: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  displayEmail: {
    fontSize: 16,
    color: "gray",
  },
  input: {
    borderColor: "gray",
    borderWidth: 1,
    padding: 8,
    borderRadius: 4,
    marginVertical: 10,
    width: 200,
  },
  signoutBtn: {
    marginTop: 20,
  },
  homeBtn: {
    marginTop: 20,
  },
  searchbtn: {
    marginVertical: 20,
  },
  followList: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  listProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
});

export default myPage;
