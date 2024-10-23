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
import LikedPosts from "./LikedPosts";
import Icon from "react-native-vector-icons/FontAwesome5";

const auth = FirebaseAuth();
const router = useRouter();

const MyPage = () => {
  const [user, setUser] = useState(null); // 現在のユーザー情報を保持
  const [photoUri, setPhotoUri] = useState(""); // プロフィール画像のURL
  const [displayName, setDisplayName] = useState(""); // ユーザーの表示名
  const [followerList, setFollowerList] = useState([]);
  const [followList, setFollowList] = useState([]);
  const [isFollowModalVisible, setIsFollowModalVisible] = useState(false); // フォローモーダルの表示状態を管理
  const [isFollowerModalVisible, setIsFollowerModalVisible] = useState(false); // フォロワーモーダルの表示状態を管理
  const [viewMode, setViewMode] = useState("posts"); // 投稿といいねの切り替え

  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };

  useEffect(() => {
    // ユーザーデータを取得するための非同期関数
    const fetchUserData = async () => {
      setUser(auth.currentUser);
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

  const toggleView = () => {
    // 自分の投稿といいねを切り替える
    setViewMode(viewMode === "posts" ? "liked" : "posts");
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
          {/* 戻るボタン */}
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
          {/* 設定ボタン */}
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

        {/* 投稿といいねの表示切り替えボタン */}
        <TouchableOpacity style={styles.toggleButton} onPress={toggleView}>
          <Text style={styles.toggleButtonText}>
            {viewMode === "posts" ? "Show Liked Posts" : "Show My Posts"}
          </Text>
        </TouchableOpacity>

        {/* 表示内容を切り替え */}
        {viewMode === "posts" ? <UserPosts /> : <LikedPosts />}
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    height: 50,
    marginBottom: 10, // ボタン間にスペースを追加
  },
  closeButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    height: 50,
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
  pagetitle: {
    fontSize: 30,
    margin: 10,
    textAlign: "center",
    fontWeight: "300",
  },
  FFcontainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "80%",
    padding: 5,
  },
  FFtext: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  FFnum: {
    padding: 10,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginVertical: 20,
  },
  toggleButtonText: {
    color: "#000",
    fontSize: 16,
  },
});

export default MyPage;
