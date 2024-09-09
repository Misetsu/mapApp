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

      console.log(auth.currentUser.photoURL);

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
          console.log(tempObj.uid);

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
                  // <Link
                  //   href={{
                  //     pathname: "/profile",
                  //     params: {
                  //       uid: follow,
                  //     },
                  //   }}
                  //   asChild
                  // >
                  <TouchableOpacity
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
                  // </Link>
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
                  <Link
                    href={{
                      pathname: "/profile",
                      params: {
                        uid: follower.uid,
                      },
                    }}
                    asChild
                  >
                    <TouchableOpacity style={styles.followList}>
                      <Image
                        source={{ uri: follower.photoURL }}
                        style={styles.listProfileImage}
                      />
                      <Text>{follower.displayName}</Text>
                    </TouchableOpacity>
                  </Link>
                );
              })}
              <Button title="閉じる" onPress={handleCloseFollowerModal} />
            </View>
          </View>
        </Modal>
        {/* ユーザーネームを表示し、テキストボックスに入力でユーザーネーム変更*/}
        <Text style={styles.displayName}>USERNAME</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.textInput}
          editable={editable}
        />
        {/* メールアドレスを表示し、テキストボックスに入力でメールアドレス変更*/}
        <Text style={styles.displayName}>Email</Text>
        <TextInput
          value={displayEmail}
          onChangeText={setDisplayEmail}
          style={styles.textInput}
          editable={false}
        />

        <Link href={{ pathname: "/" }} asChild>
          <Text style={styles.linklabel}>Change password?</Text>
        </Link>

        {editable ? (
          <Button title="Save" onPress={handleSave} />
        ) : (
          <Button title="Edit" onPress={handleEdit} />
        )}
        <Button title="Logout" onPress={signout} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileContainer: {
    alignItems: "center",
  },
  searchbtn: {
    alignSelf: "center",
    marginBottom: 16,
    backgroundColor: "#fff",
    width: "90%",
    backgroundColor: "#fff",
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
    gap: 8,
    margin: 8,
  },
  listProfileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
  FFnum: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginTop: 15,
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
  displayName: {
    fontSize: 15,
    marginTop: 20,
    textAlign: "left",
    width: "90%",
  },
  textInput: {
    borderBottomWidth: 1,
    width: "90%",
    textAlign: "center",
    marginVertical: 16,
    fontSize: 20,
  },
  linklabel: {
    fontSize: 16,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "center",
    textDecorationLine: "underline",
    color: "#1a0dab",
  },
});

export default myPage;
