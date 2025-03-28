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
import { useRouter } from "expo-router";
import firestore, { FieldValue } from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";
import UserPosts from "./UserPosts";
import LikedPosts from "./LikedPosts";
import SwitchWithIcons from "react-native-switch-with-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Alert } from "react-native";
import Toast from 'react-native-simple-toast';

const auth = FirebaseAuth();

export default function myPage() {
  const [photoUri, setPhotoUri] = useState(""); // プロフィール画像のURL
  const [displayName, setDisplayName] = useState(""); // ユーザーの表示名
  const [followerList, setFollowerList] = useState([]);
  const [followList, setFollowList] = useState([]);
  const [isFollowModalVisible, setIsFollowModalVisible] = useState(false); // フォローモーダルの表示状態を管理
  const [isFollowerModalVisible, setIsFollowerModalVisible] = useState(false); // フォロワーモーダルの表示状態を管理
  const [viewMode, setViewMode] = useState("posts"); // 投稿といいねの切り替え
  const [userStatus, setUserStatus] = useState(0);

  const router = useRouter();

  const handleBackPress = () => {
    if (router) {
      router.back();
    }
  };

  useEffect(() => {
    // ユーザーデータを取得するための非同期関数
    const fetchUserData = async () => {
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

        // ユーザーデータを取得するための非同期関数
        const fetchUserData = async () => {
          const queryUser = await firestore()
            .collection("users")
            .doc(auth.currentUser.uid)
            .get();
          const userData = queryUser.data();
          setUserStatus(userData.publicStatus);
        };

        fetchUserData();
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

  const handleStatus = async () => {
    if (userStatus == 1) {
      await firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .update({ publicStatus: 0 });
      setUserStatus(0); // 公開状態に設定
      Toast.show("投稿を公開に設定しました");
    } else {
      await firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .update({ publicStatus: 1 });
      setUserStatus(1); // 非公開状態に設定
      Toast.show("投稿を非公開に設定しました");
    }
  };

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

  const signout = async () => {
    await auth.signOut().then(() => {
      GoogleSignin.revokeAccess();
    });
    router.replace({ pathname: "/" });
    Toast.show("ログアウトしました");
  };

  const toggleDeleteModal = () => {
    Alert.alert("確認", "アカウントを削除しますか？", [
      {
        text: "キャンセル",
        style: "cancel",
      },
      {
        text: "削除",
        onPress: () => {
          handleDelete();
        },
      },
    ]);
  };

  const handleDelete = async () => {
    await deleteSubcollection(auth.currentUser.uid, "spot");

    await firestore().collection("users").doc(auth.currentUser.uid).update({
      email: FieldValue.delete(),
      lastPostAt: FieldValue.delete(),
      publicStatus: FieldValue.delete(),
      spotCreate: FieldValue.delete(),
      spotPoint: FieldValue.delete(),
    });

    await auth.currentUser.delete().then(() => {
      GoogleSignin.revokeAccess();
      router.replace("/");
    });

    Toast.show("アカウントを削除しました");
  };

  const deleteSubcollection = async (parentDocId, subcollectionName) => {
    try {
      const subcollectionRef = firestore()
        .collection("users")
        .doc(parentDocId)
        .collection(subcollectionName);

      const snapshot = await subcollectionRef.get();

      const batch = firestore().batch();
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error("Error deleting subcollection:", error);
    }
  };

  return (
    <ScrollView style={styles.scrview}>
      {/* 右側のアイコンやテキストをここに追加 */}
      {/*<Icon name="angle-left" size={24} color="#000" />*/}
      <View style={styles.container}>
        <Text style={styles.pagetitle}>マイページ</Text>
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
            <Text style={styles.FFtext}>
              フォロー中： {followList.length} 人
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.FFnum} onPress={handleFollowerPress}>
            <Text style={styles.FFtext}>
              フォロワー： {followerList.length} 人
            </Text>
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
              <Text style={styles.subtitle}>フォロー中</Text>
              <ScrollView>
                {followList.map((follow) => {
                  return (
                    <TouchableOpacity
                      key={follow.uid}
                      style={styles.followListuser}
                      onPress={() => {
                        handleProfile(follow.uid);
                      }}
                    >
                      <Image
                        source={{ uri: follow.photoURL }}
                        style={styles.listProfileImage}
                      />
                      <View style={styles.listUsernamecontainer}>
                        <Text style={styles.listUsername} numberOfLines={1}>
                          {follow.displayName}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                style={styles.button}
                onPress={handleCloseFollowModal}
              >
                <Text style={styles.buttonText}>閉じる</Text>
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
              <Text style={styles.subtitle}>フォロワー</Text>
              <ScrollView>
                {followerList.map((follower) => {
                  return (
                    <TouchableOpacity
                      key={follower.uid}
                      style={styles.followListuser}
                      onPress={() => {
                        handleProfile(follower.uid);
                      }}
                    >
                      <Image
                        source={{ uri: follower.photoURL }}
                        style={styles.listProfileImage}
                      />
                      <View style={styles.listUsernamecontainer}>
                        <Text style={styles.listUsername} numberOfLines={1}>
                          {follower.displayName}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                style={styles.button}
                onPress={handleCloseFollowerModal}
              >
                <Text style={styles.buttonText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={styles.displayName}>ユーザー名</Text>
        <TextInput
          value={displayName}
          style={styles.textInput}
          editable={false}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/profileEdit")}
        >
          <Text style={styles.buttonText}>プロフィール編集</Text>
        </TouchableOpacity>
        {/* ユーザーネームを表示し、テキストボックスに入力でユーザーネーム変更*/}

        <View style={styles.ChangeStatus}>
          <Text>投稿を非公開にする：{userStatus ? "非公開" : "公開"}</Text>
          <View style={styles.SwitchBtn}>
            <SwitchWithIcons value={userStatus} onValueChange={handleStatus} />
          </View>
        </View>

        {viewMode === "posts" ? (
          <View style={styles.tabContainer}>
            <Text style={styles.selectedTab}>自分の投稿</Text>
            <TouchableOpacity style={styles.unselectedTab} onPress={toggleView}>
              <Text>いいねした投稿</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tabContainer}>
            <TouchableOpacity style={styles.unselectedTab} onPress={toggleView}>
              <Text>自分の投稿</Text>
            </TouchableOpacity>
            <Text style={styles.selectedTab}>いいねした投稿</Text>
          </View>
        )}

        {viewMode === "posts" ? <UserPosts /> : <LikedPosts />}

        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: "none", width: "50%", marginBottom: 0 },
            ]}
            onPress={signout}
          >
            <Text style={[styles.buttonText, { color: "#FF6666" }]}>
              ログアウト
            </Text>
          </TouchableOpacity>
          {auth.currentUser.uid == "ro12arSIsugfifCz5BABmvOUZVR2" ? null : (
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: "none", width: "50%", marginBottom: 0 },
              ]}
              onPress={toggleDeleteModal}
            >
              <Text style={[styles.buttonText, { color: "#FF6666" }]}>
                アカウント削除
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.Back}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Image
            source={require("./../image/Left_arrow.png")}
            style={styles.actionButton}
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrview: {
    backgroundColor: "#F2F5C8",
  },
  profileContainer: {
    alignItems: "center",
  },
  button: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#A3DE83",
    height: 50,
    margin: 10, // ボタン間にスペースを追加
  },
  buttonText: {
    fontSize: 18,
    color: "#000000",
    textAlign: "center",
    fontWeight: "300",
  },
  pagetitle: {
    fontSize: 24,
    height: 30,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "300",
    color: "#000000",
  },
  subtitle: {
    fontSize: 18,
    margin: 10,
    textAlign: "center",
    fontWeight: "600",
    color: "#000000",
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
  FFtext: {
    fontSize: 16,
    fontWeight: "900",
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
  ChangeStatus: {
    justifyContent: "space-between",
    flexDirection: "row", // 子要素を横並びに配置
    alignItems: "center", // 垂直方向の中央に揃える
    width: "90%", // 横幅を80%に設定（任意）
    alignSelf: "center",
    margin: 10,
    backgroundColor: "#F2F5C8",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)", // 背景を半透明に
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    padding: 20,
    backgroundColor: "#F2F5C8",
    borderRadius: 10,
  },
  listUsernamecontainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  listUsername: {
    fontSize: 18,
    color: "black",
    fontWeight: "300",
  },
  followListuser: {
    display: "flex",
    flexDirection: "row",
    margin: 10,
    width: "100%",
  },
  listProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 30,
  },
  textInput: {
    margin: 5,
    marginTop: 0,
    marginBottom: 0,
    fontSize: 20,
    height: 40,
    borderBottomWidth: 3,
    borderColor: "#239D60",
    marginVertical: 16,
    color: "black",
    fontWeight: "300",
  },
  actionButton: {
    width: 30,
    height: 30,
    padding: 5,
    margin: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
  },
  backButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F5C8",
    width: 70,
    height: 70,
    marginTop: 3, // ボタン間にスペースを追加
  },
  Back: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  tabContainer: {
    width: "100%",
    marginTop: 20,
    flexDirection: "row",
    borderBottomColor: "#A3DE83",
    borderBottomWidth: 5,
  },
  selectedTab: {
    width: "50%",
    paddingTop: 20,
    paddingBottom: 5,
    backgroundColor: "#A3DE83",
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    alignItems: "center",
    textAlign: "center",
  },
  unselectedTab: {
    width: "50%",
    paddingTop: 20,
    paddingBottom: 5,
    backgroundColor: "#BABABA",
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    alignItems: "center",
    textAlign: "center",
  },
  centerdView: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModal: {
    width: "80%",
    height: "20%",
    backgroundColor: "white",
    borderRadius: 20,
  },
  deleteModalText: {
    padding: 20,
  },
  buttonRow: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
  },
  deleteModalButton: {
    borderTopWidth: 2,
    borderTopColor: "grey",
    padding: 20,
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
  },
});
