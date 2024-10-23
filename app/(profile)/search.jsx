import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/FontAwesome";
import FirebaseAuth from "@react-native-firebase/auth";
import { ScrollView } from 'react-native';

// Firebaseの認証とルーターを初期化
const auth = FirebaseAuth();
const router = useRouter();

const SearchScreen = () => {
  const [searchText, setSearchText] = useState(""); // 検索テキスト
  const [searchResult, setSearchResult] = useState([]); // 検索結果
  const [following, setFollowing] = useState({}); // フォローしているユーザーの状態
  const [recommendedUsers, setRecommendedUsers] = useState([]); // おすすめユーザーリスト
  const [officialUsers, setOfficialUsers] = useState([]); // 公式ユーザーのリスト

  useEffect(() => {
    fetchFollowingData(); // フォローしているユーザーのデータを取得
    fetchRecommendedUsers(); // おすすめユーザーを取得
    fetchOfficialUsers(); // 公式ユーザーを取得
  }, []);

  // 公式ユーザーを取得
  const fetchOfficialUsers = async () => {
    try {
      const officialUids = ["2tjGBOa6snXpIpxb2drbSvUAmb83", "H0zKYLQyeggzzCYgZM6bUddAItU2"];
      const userSnapshots = await Promise.all(
        officialUids.map(async (uid) => {
          const userSnapshot = await firestore()
            .collection("users")
            .where("uid", "==", uid)
            .get();
          return userSnapshot.docs[0]?.data();
        })
      );
  
      const officialUserData = userSnapshots.filter((user) => user); // 存在するユーザーのみ取得
      setOfficialUsers(officialUserData);
    } catch (error) {
      console.error("Error fetching official user data:", error);
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
  
      const followingList = followSnapshot.docs.map(doc => doc.data().followeeId);
  
      if (followingList.length > 0) {
        let potentialRecommendedUsersSet = new Set();
        let maxRetries = 5; // 最大5回のリトライ
        let retryCount = 0;
  
        // おすすめユーザーが見つかるまで繰り返す
        while (potentialRecommendedUsersSet.size === 0 && retryCount < maxRetries) {
          // ランダムに1人のフォロー中ユーザーを選択
          const randomFolloweeId = followingList[Math.floor(Math.random() * followingList.length)];
  
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
              const isOnlyFollowingFollowers = followeeFollowingSnapshot.docs.every(followeeDoc =>
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
        const randomRecommendedUsers = validRecommendedUsers.sort(() => 0.5 - Math.random()).slice(0, 5);
  
        // おすすめユーザーを設定
        if (randomRecommendedUsers.length > 0) {
          const recommendedUserData = await fetchUserDetails(randomRecommendedUsers);
          setRecommendedUsers(recommendedUserData);
        } else {
          setRecommendedUsers([]); // それでも表示するユーザーがいない場合は空の配列を設定
          console.log("おすすめユーザーはいません"); // コンソールにメッセージを表示
        }
      } else {
        setRecommendedUsers([]); // フォロー中のユーザーがいない場合も空の配列を設定
        console.log("おすすめユーザーはいません"); // コンソールにメッセージを表示
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
      if (following[uid]) {
        // フォロー中の場合
        const followDoc = await firestore()
          .collection("follow")
          .where("followerId", "==", auth.currentUser.uid)
          .where("followeeId", "==", uid)
          .get();

        if (!followDoc.empty) {
          await followDoc.docs[0].ref.delete(); // フォローデータを削除
          setFollowing((prevState) => ({ ...prevState, [uid]: false })); // ステートを更新
        }
      } else {
        // フォローしていない場合
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

       {/* 公式ユーザーの表示 */}
    {officialUsers.length > 0 && (
      <>
      <Text style={styles.sectionTitle}>公式アカウント</Text>
        <ScrollView style={styles.recommendedContainer}>
        
        {officialUsers.map((user) => (
          <UserItem
            key={user.uid}
            user={user}
            isFollowing={following[user.uid]}
            onProfilePress={() => handleProfile(user.uid)}
            onFollowToggle={() => handleFollowToggle(user.uid)}
          />
        ))}
      </ScrollView>
      </>
    )}

      {/* おすすめユーザーの表示 */}
      {searchText === "" && recommendedUsers.length > 0 && (
        <>
        <Text style={styles.sectionTitle}>おすすめユーザー</Text>
          <ScrollView style={styles.recommendedContainer}>
          
          {recommendedUsers.map((user) => (
            <UserItem
              key={user.uid}
              user={user}
              isFollowing={following[user.uid]}
              onProfilePress={() => handleProfile(user.uid)}
              onFollowToggle={() => handleFollowToggle(user.uid)}
            />
          ))}
        </ScrollView>
        </>
      )}

      {/* 検索結果の表示 */}
      {searchResult.length > 0 && searchText !== "" && (
        <View style={styles.resultsContainer}>
          {searchResult.map((result) => {
            const userData = result.data();
            return (
              <UserItem
                key={userData.uid}
                user={userData}
                isFollowing={following[userData.uid]}
                onProfilePress={() => handleProfile(userData.uid)}
                onFollowToggle={() => handleFollowToggle(userData.uid)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

// ユーザーアイテムのためのコンポーネントを分離してクリーンなコードを維持
const UserItem = ({ user, isFollowing, onProfilePress, onFollowToggle }) => (
  <View style={styles.resultBar}>
    <TouchableOpacity onPress={onProfilePress} style={styles.userInfo}>
      <Image source={{ uri: user.photoURL }} style={styles.listProfileImage} />
      <Text style={styles.resultText}>{user.displayName}</Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={onFollowToggle}
      style={[styles.followButton, isFollowing ? styles.followedButton : styles.unfollowedButton]}
    >
      <Text style={styles.buttonText}>{isFollowing ? "フォロー中" : "フォロー"}</Text>
    </TouchableOpacity>
  </View>
);

// スタイルの定義
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa", // 背景色を明るく
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc", // 少し濃いグレーに
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff", // 背景を白にしてシャープに
    marginBottom: 20,
    shadowColor: "#000", // 軽いシャドウを追加
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Androidのシャドウ
  },
  icon: {
    marginRight: 10,
    color: "#668991", // アイコンにテーマカラーを適用
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333", // テキストの色を濃く
  },
  recommendedContainer: {
    marginBottom: 20,
  },
  resultsContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20, // タイトルを少し大きく
    fontWeight: "bold",
    marginBottom: 15,
    color: "#1f2121", // テーマカラーに変更
  },
  resultBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15, // パディングを広めに
    backgroundColor: "#fff", // 各結果の背景を白に
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000", // シャドウを追加
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Android向けのシャドウ
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  listProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 2, // 枠線を追加
    borderColor: "#668991", // 枠線の色をテーマカラーに
  },
  resultText: {
    fontSize: 16,
    color: "#555", // テキストの色を少し淡く
  },
  followButton: {
    backgroundColor: "#668991",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    shadowColor: "#007bff", // ボタンにもシャドウを追加
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600", // ボタンのテキストを太めに
  },
});


export default SearchScreen;
