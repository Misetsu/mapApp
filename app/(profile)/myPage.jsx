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
import UserPosts from "./UserPosts";
import Icon from "react-native-vector-icons/FontAwesome5";

const auth = FirebaseAuth();
const router = useRouter();

const myPage = () => {
  const [user, setUser] = useState(null); // 現在のユーザー情報を保持
  const [photoUri, setPhotoUri] = useState(""); // プロフィール画像のURL
  const [displayName, setDisplayName] = useState(""); // ユーザーの表示名
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
      setDisplayName(auth.currentUser.displayName);
      setPhotoUri(auth.currentUser.photoURL);

      // フォロー取得
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

  return (
    <ScrollView>
      <View
        style={{
          flexDirection: "row", // 横並びに配置
          justifyContent: "space-between", // 左右にスペースを均等に配置
          alignItems: "center", // 縦方向の中央揃え
          padding: 10, // パディングを追加
          height: 50, // 高さを指定
        }}
      >
        <TouchableOpacity
          onPress={handleBackPress}
          style={{
            width: 50, // 横幅を設定
            height: 50, // 高さを設定
            justifyContent: "center", // 縦中央揃え
            alignItems: "center", // 横中央揃え
          }}
        >
          {/* 右側のアイコンやテキストをここに追加 */}
          <Icon name="angle-left" size={24} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/setting")}
          style={{
            width: 50, // 横幅を設定
            height: 50, // 高さを設定
            justifyContent: "center", // 縦中央揃え
            alignItems: "center", // 横中央揃え
          }}
        >
          {/* 左側のアイコンやテキストをここに追加 */}
          <Icon name="cog" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {/* フォロワーの検索へのボタン */}
        <Link href={{ pathname: "/search" }} asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>SEARCH</Text>
          </TouchableOpacity>
        </Link>

        <Text style={styles.pagetitle}>MY PAGE</Text>
        <View style={styles.profileContainer}>
          {/* プロフィール画像がある場合に表示し、ない場合はプレースホルダーを表示。画像タップでライブラリを開く*/}
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder} />
          )}
        </View>

        {/* フォロー、フォロワーを表示 */}
        <View style={styles.FFcontainer}>
          <TouchableOpacity style={styles.FFnum} onPress={handleFollowPress}>
            <Text style={styles.FFtext}>Follow: {followList.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.FFnum} onPress={handleFollowerPress}>
            <Text style={styles.FFtext}>Follower: {followerList.length}</Text>
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
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseFollowModal}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseFollowerModal}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ユーザーネームを表示し、テキストボックスに入力でユーザーネーム変更*/}
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          style={styles.textInput}
          editable={false}
        />
      </View>

      <UserPosts />
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
});

export default myPage;
