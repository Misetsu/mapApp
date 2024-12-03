import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/FontAwesome5";
import FirebaseAuth from "@react-native-firebase/auth";
import { ScrollView } from "react-native";

// Firebaseの認証とルーターを初期化
const auth = FirebaseAuth();

export default function SearchScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState(""); // 検索テキスト
  const [searchResult, setSearchResult] = useState([]); // 検索結果
  const [following, setFollowing] = useState({}); // フォローしているユーザーの状態
  const [recommendedUsers, setRecommendedUsers] = useState([]); // おすすめユーザーリスト
  const [officialUsers, setOfficialUsers] = useState([]); // 公式ユーザー
  const [currentUserId, setCurrentUserId] = useState(null);
  

  const handleBackPress = () => {
    if (router) {
      router.back();
    }
  };

  useEffect(() => {
    fetchFollowingData();
    fetchRecommendedUsers();
    fetchOfficialUsers();
    if (auth.currentUser) {
      setCurrentUserId(auth.currentUser.uid); // 現在のユーザーIDを状態に保存
    }
  }, []);

  // 公式ユーザーを取得
  const fetchOfficialUsers = async () => {
    try {
      const officialUids = [
        "2tjGBOa6snXpIpxb2drbSvUAmb83",
        "H0zKYLQyeggzzCYgZM6bUddAItU2",
        "1mfK81yybUe4oCDb2wTJbjOVgEB3",
      ];

      const userDetails = await Promise.all(
        officialUids.map(async (uid) => {
          const userSnapshot = await firestore()
            .collection("users")
            .where("uid", "==", uid)
            .get();
          return userSnapshot.docs[0]?.data();
        })
      );

      setOfficialUsers(userDetails.filter((user) => user));
    } catch (error) {
      console.error("Error fetching official users data:", error);
    }
  };
  // 現在のユーザーがフォローしているユーザーを取得
  const fetchFollowingData = async () => {
    try {
      const followSnapshot = await firestore()
        .collection("follow")
        .where("followerId", "==", auth.currentUser.uid)
        .get();

      const followData = {};
      for (const doc of followSnapshot.docs) {
        followData[doc.data().followeeId] = true; // フォローしているユーザーのIDを取得
      }
      setFollowing(followData);
    } catch (error) {
      console.error("Error fetching following data:", error);
    }
  };

  // おすすめユーザーを取得
  const fetchRecommendedUsers = async () => {
    try {
      // 現在フォロー中のユーザーを取得
      const followSnapshot = await firestore()
        .collection("follow")
        .where("followerId", "==", auth.currentUser.uid)
        .get();

      const followingList = followSnapshot.docs.map(
        (doc) => doc.data().followeeId
      );

      if (followingList.length > 0) {
        let potentialRecommendedUsersSet = new Set();
        let maxRetries = 5; // 最大5回のリトライ
        let retryCount = 0;

        // おすすめユーザーが見つかるまで繰り返す
        while (
          potentialRecommendedUsersSet.size === 0 &&
          retryCount < maxRetries
        ) {
          // ランダムに1人のフォロー中ユーザーを選択
          const randomFolloweeId =
            followingList[Math.floor(Math.random() * followingList.length)];

          // 選択されたフォロー中ユーザーのフォローユーザーを取得
          const followeeFollowSnapshot = await firestore()
            .collection("follow")
            .where("followerId", "==", randomFolloweeId)
            .get();

          for (const followeeDoc of followeeFollowSnapshot.docs) {
            const recommendedUserId = followeeDoc.data().followeeId;

            // フォロワーがいるかを確認
            const followeeFollowersSnapshot = await firestore()
              .collection("follow")
              .where("followerId", "==", recommendedUserId)
              .get();

            // フォロー中のユーザーを取得
            const followeeFollowingSnapshot = await firestore()
              .collection("follow")
              .where("followerId", "==", recommendedUserId)
              .get();

            // フォロワーがいるかつ、現在のユーザーがフォローしていないことを確認
            if (
              followeeFollowersSnapshot.docs.length > 0 && // フォロワーがいる
              recommendedUserId !== auth.currentUser.uid && // 自分自身を除外
              !followingList.includes(recommendedUserId) // フォローしていないユーザー
            ) {
              // フォロー中のユーザーがフォロワーだけでなく、他のユーザーもフォローしているかを確認
              const isOnlyFollowingFollowers =
                followeeFollowingSnapshot.docs.every((followeeDoc) =>
                  followingList.includes(followeeDoc.data().followeeId)
                );

              // もしフォロワーだけをフォローしている場合は除外
              if (!isOnlyFollowingFollowers) {
                potentialRecommendedUsersSet.add(recommendedUserId);
              }
            }
          }

          retryCount++; // リトライカウントを増やす
        }

        // 有効なユーザーをリストに変換してランダムに5人選択
        const validRecommendedUsers = Array.from(potentialRecommendedUsersSet);
        const randomRecommendedUsers = validRecommendedUsers
          .sort(() => 0.5 - Math.random())
          .slice(0, 5);

        // おすすめユーザーを設定
        if (randomRecommendedUsers.length > 0) {
          const recommendedUserData = await fetchUserDetails(
            randomRecommendedUsers
          );
          setRecommendedUsers(recommendedUserData);
        } else {
          setRecommendedUsers([]); // それでも表示するユーザーがいない場合は空の配列を設定
        }
      } else {
        setRecommendedUsers([]); // フォロー中のユーザーがいない場合も空の配列を設定()
      }
    } catch (error) {
      console.error("Error fetching recommended users:", error);
    }
  };

  // Firestoreからユーザーの詳細を取得
  const fetchUserDetails = async (userIds) => {
    try {
      const userDetails = await Promise.all(
        userIds.map(async (uid) => {
          const userSnapshot = await firestore()
            .collection("users")
            .where("uid", "==", uid)
            .get();
          return userSnapshot.docs[0]?.data(); // ユーザーのデータを取得
        })
      );
      return userDetails.filter((user) => user); // 未定義のユーザーをフィルタリング
    } catch (error) {
      console.error("Error fetching user details:", error);
      return [];
    }
  };

  // ユーザーの検索を処理
  const handleSearch = (text) => {
    setSearchText(text); // 検索テキストを更新
    if (text !== "") {
      firestore()
        .collection("users")
        .where("displayName", ">=", text)
        .where("displayName", "<=", text + "\uf8ff") // 検索条件を設定
        .get()
        .then((result) => {
          setSearchResult(result.docs); // 検索結果をステートに設定
        })
        .catch((error) => console.error("Error searching users:", error));
    } else {
      setSearchResult([]); // テキストが空の場合、検索結果をクリア
    }
  };

  // ユーザーのフォロー/フォロー解除を切り替え
const handleFollowToggle = async (uid) => {
  try {
    // 自分自身をフォローすることを防ぐ条件
    if (uid === auth.currentUser.uid) {
      Alert.alert("エラー", "自分自身をフォローすることはできません。");
      return;
    }

    if (following[uid]) {
      // フォロー解除の確認ダイアログを表示
      Alert.alert(
        "確認", // タイトル
        "本当にフォローを外しますか？", // メッセージ
        [
          {
            text: "キャンセル", // キャンセルボタン
            style: "cancel",
          },
          {
            text: "フォローを解除", // 確認ボタン
            onPress: async () => {
              // フォロー解除の処理
              const followDoc = await firestore()
                .collection("follow")
                .where("followerId", "==", auth.currentUser.uid)
                .where("followeeId", "==", uid)
                .get();

              if (!followDoc.empty) {
                await followDoc.docs[0].ref.delete(); // フォローデータを削除
                setFollowing((prevState) => ({ ...prevState, [uid]: false })); // ステートを更新
              }
            },
          },
        ]
      );
    } else {
      // フォローする処理
      await firestore().collection("follow").add({
        followerId: auth.currentUser.uid,
        followeeId: uid,
      });
      setFollowing((prevState) => ({ ...prevState, [uid]: true })); // ステートを更新
    }
  } catch (error) {
    console.error("Error toggling follow state:", error);
  }
};

  // プロフィール画面に遷移
  const handleProfile = (uid) => {
    router.push({
      pathname: uid === auth.currentUser.uid ? "/myPage" : "/profile",
      params: { uid: uid },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.Back}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Icon name="angle-left" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        {/* 検索バーのUI */}
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#000" style={styles.icon} />
          <TextInput
            style={[styles.input, { fontSize: 18 }]}
            placeholder="検索"
            onChangeText={handleSearch}
            value={searchText}
          />
        </View>
      </View>
      
      {officialUsers.length > 0 && (
        <View style={styles.recommendedContainer}>
          <Text style={styles.sectionTitle}>おすすめ公式ユーザー</Text>
          {officialUsers.map((user) => (
            <UserItem
              key={user.uid}
              user={user}
              isFollowing={following[user.uid]}
              onProfilePress={() => handleProfile(user.uid)}
              onFollowToggle={() => handleFollowToggle(user.uid)}
              currentUserId={auth.currentUser.uid} // 現在のユーザーIDを渡す
            />
          ))}
        </View>
      )}

      {/* おすすめユーザーの表示 */}
      {searchText === "" && recommendedUsers.length > 0 && (
        <View style={styles.recommendedContainer}>
          <Text style={styles.sectionTitle}>おすすめユーザー</Text>
          <ScrollView>
          {recommendedUsers.map((user) => (
            <UserItem
              key={user.uid}
              user={user}
              isFollowing={following[user.uid]}
              onProfilePress={() => handleProfile(user.uid)}
              onFollowToggle={() => handleFollowToggle(user.uid)}
              currentUserId={auth.currentUser.uid} // 現在のユーザーIDを渡す
            />
          ))}
          </ScrollView>
        </View>
      )}

      {/* 検索結果の表示 */}
      {searchResult.length > 0 && searchText !== "" && (
        <View style={styles.resultsContainer}>
          <ScrollView>
          {searchResult.map((result) => {
            const userData = result.data();
            return (
              <UserItem
                key={userData.uid}
                user={userData}
                isFollowing={following[userData.uid]}
                onProfilePress={() => handleProfile(userData.uid)}
                onFollowToggle={() => handleFollowToggle(userData.uid)}
                currentUserId={auth.currentUser.uid} // 現在のユーザーIDを渡す
              />
            );
          })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ユーザーアイテムのためのコンポーネントを分離してクリーンなコードを維持
const UserItem = ({ user, isFollowing, onProfilePress, onFollowToggle, currentUserId }) => (
  <View style={styles.resultBar}>
    <TouchableOpacity onPress={onProfilePress} style={styles.userInfo}>
      <Image source={{ uri: user.photoURL }} style={styles.listProfileImage} />
      <Text style={styles.resultText}>{user.displayName}</Text>
    </TouchableOpacity>
    {user.uid !== currentUserId && ( // 自分自身のユーザーIDと一致する場合はボタンを非表示
      <TouchableOpacity
        onPress={onFollowToggle}
        style={[
          styles.followButton,
          isFollowing ? styles.followedButton : styles.unfollowedButton,
        ]}
      >
        <Text style={styles.buttonText}>
          {isFollowing ? "フォロー中" : "フォロー"}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

// スタイルの定義
const styles = StyleSheet.create({
  // コンテナ全体のスタイル
  container: {
    flex: 1, // コンテナを全画面に拡張
    backgroundColor: "#e6e6b3", // 背景色をライトグレーに
    paddingHorizontal: 20, // 左右のパディング
  },
  // ヘッダー部分のスタイル（検索バーや戻るボタンなど）
  header: {
    flexDirection: "row", // 横並び
    justifyContent: "space-between", // 左右にスペースを均等に配置
    alignItems: "center", // アイテムを中央に配置
    marginTop: 20, // 上の余白
    marginBottom: 10, // 下の余白
  },
  // 検索バーのスタイル
  searchBar: {
    flexDirection: "row", // アイコンと入力を横並びに配置
    alignItems: "center", // アイコンとテキストを縦に中央揃え
    backgroundColor: "#fff", // 背景色は白
    borderColor: "#ddd", // 枠線の色
    borderWidth: 1, // 枠線の太さ
    borderRadius: 25, // 丸みを帯びた角
    padding: 10, // 内側の余白
    shadowColor: "#000", // シャドウの色
    shadowOffset: { width: 0, height: 1 }, // シャドウの位置
    shadowOpacity: 0.1, // シャドウの透明度
    shadowRadius: 5, // シャドウのぼかし具合
    elevation: 2, // Android用のシャドウ
    flex: 1, // 検索バーが横幅いっぱいに広がるように
  },
  // アイコンのスタイル
  icon: {
    marginRight: 10, // 右側の余白
    color: "#555", // アイコンの色
  },
  // 入力フィールドのスタイル
  input: {
    flex: 1, // 入力フィールドが横幅いっぱいに広がるように
    fontSize: 16, // フォントサイズ
    color: "#333", // テキストの色
  },
  // おすすめユーザーのコンテナのスタイル
  recommendedContainer: {
    marginBottom: 0, // 下の余白
  },
  // 検索結果のコンテナのスタイル
  resultsContainer: {
    marginTop: 20, // 上の余白
  },
  // セクションタイトルのスタイル
  sectionTitle: {
    fontSize: 18, // フォントサイズ
    fontWeight: "bold", // 太字
    color: "#333", // 色
    marginBottom: 10, // 下の余白
  },
  // 検索結果バーのスタイル
  resultBar: {
    flexDirection: "row", // 横並び
    justifyContent: "space-between", // 左右にスペースを均等に配置
    alignItems: "center", // アイテムを中央に配置
    backgroundColor: "#ffffe0", // 背景色（薄い黄色）
    borderRadius: 10, // 丸みを帯びた角
    padding: 15, // 内側の余白
    marginBottom: 10, // 下の余白
    shadowColor: "#000", // シャドウの色
    shadowOffset: { width: 0, height: 2 }, // シャドウの位置
    shadowOpacity: 0.1, // シャドウの透明度
    shadowRadius: 5, // シャドウのぼかし具合
    elevation: 2, // Android用のシャドウ
  },
  // ユーザー情報を表示する部分のスタイル
  userInfo: {
    flexDirection: "row", // 横並び
    alignItems: "center", // アイテムを中央に配置
  },
  // プロフィール画像のスタイル
  listProfileImage: {
    width: 50, // 幅
    height: 50, // 高さ
    borderRadius: 25, // 丸い形にするための半径
    marginRight: 15, // 右側の余白
    backgroundColor: "#dbdbdb", // 背景色（デフォルトのグレー）
  },
  // 結果テキストのスタイル
  resultText: {
    fontSize: 16, // フォントサイズ
    fontWeight: "500", // 太さ（普通）
    color: "#333", // 色
  },

  // フォローボタンのスタイル
  followButton: {
    paddingVertical: 8, // 上下の余白
    paddingHorizontal: 20, // 左右の余白
    borderRadius: 20, // 丸い角
    alignItems: "center", // アイテムを中央に配置
    justifyContent: "center", // アイテムを中央に配置
  },
  // フォロー中ボタンのスタイル
  followedButton: {
    backgroundColor: "#91db9b", // フォロー中ボタンの色
  },
  // フォローボタンのスタイル
  unfollowedButton: {
    backgroundColor: "#65996c", // フォローボタンの色
  },
  // ボタンテキストのスタイル
  buttonText: {
    fontSize: 14,  // フォントサイズ
    color: "#fff", // 文字色
  },
  // 戻るボタンのスタイル（位置）
  Back: {
    position: "absolute", // 絶対位置
    left: 10, // 左からの位置
    top: 10, // 上からの位置
  },
  // 戻るボタンのスタイル（デザイン）
  backButton: {
    justifyContent: "center", // 中央に配置
    alignItems: "center", // 中央に配置
    width: 40, // 幅
    height: 40, // 高さ
    borderRadius: 20, // 丸い形にする
    backgroundColor: "#fff", // 背景色（白）
    shadowColor: "#000", // シャドウの色
    shadowOffset: { width: 0, height: 2 }, // シャドウの位置
    shadowOpacity: 0.1, // シャドウの透明度
    shadowRadius: 5, // シャドウのぼかし具合
    elevation: 2, // Android用のシャドウ
  },
});
