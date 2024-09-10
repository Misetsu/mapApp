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
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import Icon from "react-native-vector-icons/FontAwesome";
import firestore, {
  deleteField,
  FieldValue,
} from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";

const auth = FirebaseAuth();
const router = useRouter();

const profile = () => {
  const params = useLocalSearchParams();
  const { uid } = params;
  const [photoUri, setPhotoUri] = useState(""); // プロフィール画像のURL
  const [displayName, setDisplayName] = useState(""); // ユーザーの表示名
  const [followerList, setFollowerList] = useState([]);
  const [followList, setFollowList] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const { uid } = params;

    // ユーザーデータを取得するための非同期関数
    const fetchUserData = async () => {
      const queryProfile = await firestore()
        .collection("users")
        .where("uid", "==", uid)
        .get();
      const profileData = queryProfile.docs[0].data();
      setDisplayName(profileData.displayName);
      setPhotoUri(profileData.photoURL);

      // フォロー中取得
      const queryFollow = await firestore()
        .collection("follow")
        .where("followerId", "==", uid)
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

      // フォローワー取得
      const queryFollower = await firestore()
        .collection("follow")
        .where("followeeId", "==", uid)
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

    const fetchFollowStatus = async () => {
      const queryStatus = await firestore()
        .collection("follow")
        .where("followeeId", "==", uid)
        .where("followerId", "==", auth.currentUser.uid)
        .get();
      if (!queryStatus.empty) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }
    };

    const fetchFavStatus = async () => {
      const queryFav = await firestore()
        .collection("star")
        .doc(auth.currentUser.uid)
        .get();
      const favData = queryFav.get(uid);
      console.log(favData);
      if (favData === undefined) {
        setIsFav(false);
      } else {
        setIsFav(true);
      }
    };

    fetchUserData();
    fetchFollowStatus();
    fetchFavStatus();
  }, []);

  const handleFollow = async () => {
    if (isFollowing) {
      const queryStatus = await firestore()
        .collection("follow")
        .where("followeeId", "==", uid)
        .where("followerId", "==", auth.currentUser.uid)
        .get();
      const docId = queryStatus.docs[0].id;
      firestore().collection("follow").doc(docId).delete();
      setIsFollowing(false);
    } else {
      const queryFollow = await firestore()
        .collection("follow")
        .orderBy("id", "desc")
        .get();
      const maxId = queryFollow.docs[0].data().id + 1;
      firestore().collection("follow").add({
        id: maxId,
        followerId: auth.currentUser.uid,
        followeeId: uid,
      });
      setIsFollowing(true);
    }
  };

  const handleFav = async () => {
    if (isFav) {
      firestore()
        .collection("star")
        .doc(auth.currentUser.uid)
        .update({
          [uid]: FieldValue.delete(),
        });
      setIsFav(false);
    } else {
      firestore()
        .collection("star")
        .doc(auth.currentUser.uid)
        .set({
          [uid]: uid,
        });
      setIsFav(true);
    }
  };

  const handleProfile = (uid) => {
    if (uid == auth.currentUser.uid) {
      router.push({ pathname: "/myPage" });
    } else {
      router.push({ pathname: "/profile", params: { uid: uid } });
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileContainer}>
        {/* フォロワーの検索へのボタン */}
        <View style={styles.searchbtn}>
          <Link href={{ pathname: "/search" }} asChild>
            <Button title="SEARCH Follower" />
          </Link>
        </View>

        {/* プロフィール画像を表示するだけ */}
        <View>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder} />
          )}
        </View>

        {/* フォロー、フォロワーを表示 */}
        <View style={styles.FFnum}>
          <TouchableOpacity onPress={handleFollowPress}>
            <Text style={styles.text}>Follow: {followList.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleFollowerPress}>
            <Text style={styles.text}>Follower: {followerList.length}</Text>
          </TouchableOpacity>
        </View>

        {/* フォローボタンを追加 */}
        <View style={styles.actionBar}>
          {isFollowing ? (
            <Button
              title="フォロー解除"
              onPress={handleFollow}
              style={styles.followButton}
            />
          ) : (
            <Button
              title="フォローする"
              onPress={handleFollow}
              style={styles.followButton}
            />
          )}
          {isFav ? (
            <TouchableOpacity onPress={handleFav}>
              <Icon name="star" size={40} color="#f2c530" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleFav}>
              <Icon name="star-o" size={40} color="#000" />
            </TouchableOpacity>
          )}
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

        {/* ユーザーネームを表示するだけ */}
        <Text style={styles.displayName}>USERNAME</Text>
        <Text style={styles.displayText}>{displayName}</Text>
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
  actionBar: {
    marginTop: 10,
    width: "90%",
    display: "flex",
    flexDirection: "row",
    gap: 10,
  },
  followButton: {
    width: "70%",
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
  displayText: {
    borderBottomWidth: 1,
    fontSize: 20,
    marginVertical: 16,
    textAlign: "center",
    width: "90%",
  },
});

export default profile;
