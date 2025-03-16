import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-simple-toast";

import { getAuth } from "@react-native-firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  updateDoc,
  where,
} from "@react-native-firebase/firestore";

import UserPosts from "./othersPosts";

const auth = getAuth();
const db = getFirestore();

export default function profile() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { uid } = params;
  const [photoUri, setPhotoUri] = useState(""); // プロフィール画像のURL
  const [displayName, setDisplayName] = useState(""); // ユーザーの表示名
  const [followerList, setFollowerList] = useState([]);
  const [followList, setFollowList] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [isFollowModalVisible, setIsFollowModalVisible] = useState(false); // フォローモーダルの表示状態を管理
  const [isFollowerModalVisible, setIsFollowerModalVisible] = useState(false); // フォロワーモーダルの表示状態を管理
  const [publicStatus, setPublicStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // ローディング状態を追加

  useEffect(() => {
    const { uid } = params;

    // ユーザーデータを取得するための非同期関数
    const fetchUserData = async () => {
      try {
        const queryProfile = await getDocs(
          query(collection(db, "users"), where("uid", "==", uid))
        );
        const profileData = queryProfile.docs[0].data();
        setDisplayName(profileData.displayName);
        setPhotoUri(profileData.photoURL);

        if (profileData.email == undefined) {
          router.replace({ pathname: "/notFoundUser", params: { uid: uid } }); // TODO
        }

        if (profileData.publicStatus == 0) {
          setPublicStatus(true);
        }

        // フォロー中取得
        const queryFollow = await getDocs(
          query(collection(db, "follow"), where("followerId", "==", uid))
        );

        if (!queryFollow.empty) {
          let cnt = 0;
          let followArray = [];
          const firstKey = "uid";
          const secondKey = "displayName";
          const thirdKey = "photoURL";
          while (cnt < queryFollow.size) {
            let tempObj = {};
            const followData = queryFollow.docs[cnt].data();
            const queryUser = await getDocs(
              query(
                collection(db, "users"),
                where("uid", "==", followData.followeeId)
              )
            );
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
        const queryFollower = await getDocs(
          query(collection(db, "follow"), where("followeeId", "==", uid))
        );

        if (!queryFollower.empty) {
          let cnt = 0;
          let followerArray = [];
          const firstKey = "uid";
          const secondKey = "displayName";
          const thirdKey = "photoURL";
          while (cnt < queryFollower.size) {
            let tempObj = {};
            const followerData = queryFollower.docs[cnt].data();
            const queryUser = await getDocs(
              query(
                collection(db, "users"),
                where("uid", "==", followerData.followerId)
              )
            );
            const userData = queryUser.docs[0].data();

            if (userData.uid == auth.currentUser.uid) {
              setPublicStatus(true);
            }

            tempObj[firstKey] = userData.uid;
            tempObj[secondKey] = userData.displayName;
            tempObj[thirdKey] = userData.photoURL;

            followerArray.push(tempObj);

            cnt = cnt + 1;
          }
          setFollowerList(followerArray);
        }
      } catch (error) {
        console.error("データ取得中にエラーが発生しました:", error);
      } finally {
        setIsLoading(false); // データ取得完了
      }
    };

    const fetchFollowStatus = async () => {
      if (auth.currentUser == null) {
        setIsFollowing(false);
      } else {
        const queryStatus = await getDocs(
          query(
            collection(db, "follow"),
            where("followeeId", "==", uid),
            where("followerId", "==", auth.currentUser.uid)
          )
        );
        if (!queryStatus.empty) {
          setIsFollowing(true);
        } else {
          setIsFollowing(false);
        }
      }
    };

    const fetchFavStatus = async () => {
      if (auth.currentUser == null) {
        setIsFav(false);
      } else {
        const queryFav = await getDoc(doc(db, "star", auth.currentUser.uid));
        const favData = queryFav.get(uid);
        if (favData === undefined || !queryFav.exists) {
          setIsFav(false);
        } else {
          setIsFav(true);
        }
      }
    };

    fetchUserData();
    fetchFollowStatus();
    fetchFavStatus();
  }, []);

  const handleFollow = async () => {
    if (auth.currentUser == null) {
      router.push("/loginForm");
    } else {
      if (isFollowing) {
        // フォロー解除の警告を表示
        Alert.alert(
          "確認", // タイトル
          "本当にフォローを外しますか？", // メッセージ
          [
            {
              text: "キャンセル", // キャンセルボタン
              style: "cancel",
            },
            {
              text: "フォロー解除", // 確認ボタン
              onPress: async () => {
                // フォロー解除の処理
                const queryStatus = await getDocs(
                  query(
                    collection(db, "follow"),
                    where("followeeId", "==", uid),
                    where("followerId", "==", auth.currentUser.uid)
                  )
                );
                const docId = queryStatus.docs[0].id;
                await deleteDoc(doc(db, "follow", docId));
                setIsFollowing(false);
                Toast.show("フォロー解除しました");
                if (isFav) {
                  await updateDoc(doc(db, "star", auth.currentUser.uid), {
                    [uid]: deleteField(),
                  });
                  setIsFav(false);
                }
              },
            },
          ]
        );
      } else {
        // フォローする処理
        // フォローする処理
        const queryFollow = await getDocs(
          query(collection(db, "follow"), orderBy("id", "desc"))
        );
        const maxId = queryFollow.docs[0].data().id + 1;
        await addDoc(collection(db, "follow"), {
          id: maxId,
          followerId: auth.currentUser.uid,
          followeeId: uid,
        });
        setIsFollowing(true);
      }
    }
  };

  const handleFav = async () => {
    if (auth.currentUser == null) {
      router.push("/loginForm");
    } else {
      if (isFav) {
        updateDoc(doc(db, "star", auth.currentUser.uid), {
          [uid]: deleteField(),
        });
        setIsFav(false);
        Toast.show("お気に入り解除しました");
      } else {
        updateDoc(doc(db, "star", auth.currentUser.uid), { [uid]: uid });
        setIsFav(true);
        Toast.show("お気に入りしました");
      }
    }
  };

  const handleProfile = (uid) => {
    if (auth.currentUser == null) {
      router.push({ pathname: "/profile", params: { uid: uid } });
    } else {
      if (uid == auth.currentUser.uid) {
        router.push({ pathname: "/myPage" });
      } else {
        router.push({ pathname: "/profile", params: { uid: uid } });
      }
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

  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };

  return (
    <ScrollView style={styles.scrview}>
      {/* 右側のアイコンやテキストをここに追加 */}
      {/*<Icon name="angle-left" size={24} color="#000" />*/}
      <View style={styles.container}>
        <Text style={styles.pagetitle}>プロフィール</Text>
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
            <Text style={styles.FFtext}>フォロー中: {followList.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.FFnum} onPress={handleFollowerPress}>
            <Text style={styles.FFtext}>フォロワー: {followerList.length}</Text>
          </TouchableOpacity>
        </View>

        {/* フォローボタンを追加 */}
        <View style={styles.actionBar}>
          {isFollowing ? (
            <TouchableOpacity style={styles.button} onPress={handleFollow}>
              <Text style={styles.buttonText}>フォロー解除</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleFollow}>
              <Text style={styles.buttonText}>フォロー</Text>
            </TouchableOpacity>
          )}
          {isFav ? (
            <TouchableOpacity onPress={handleFav}>
              <Image
                source={require("./../image/Star.png")}
                style={styles.Star}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleFav}>
              <Image
                source={require("./../image/BorderStar.png")}
                style={styles.Star}
              />
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

        {/* ユーザーネームを表示するだけ */}
        <Text style={styles.displayName}>ユーザー名</Text>
        <TextInput
          value={displayName}
          style={styles.textInput}
          editable={false}
        />
        {isLoading ? null : publicStatus ? (
          <UserPosts uid={uid} />
        ) : (
          <Text style={styles.privateText}>このアカウントは非公開です。</Text>
        )}
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
    paddingHorizontal: 20,
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
  actionBar: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    marginTop: 10,
    marginBottom: 10,
    width: "90%",
    display: "flex",
    flexDirection: "row",
    gap: 20,
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
  Star: {
    width: 50,
    height: 50,
    padding: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
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
  privateText: {
    marginTop: 10,
  },
});
