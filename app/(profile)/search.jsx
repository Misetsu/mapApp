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
import messaging from "@react-native-firebase/messaging";

// Firebaseの認証とルーターを初期化
const auth = FirebaseAuth();

export default function SearchScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState(""); // 検索テキスト
  const [searchResult, setSearchResult] = useState([]); // 検索結果
  const [following, setFollowing] = useState({}); // フォローしているユーザーの状態
  const [recommendedUsers, setRecommendedUsers] = useState([]); // おすすめユーザーリスト
  const [officialUser, setOfficialUser] = useState(null); // 公式ユーザー

  useEffect(() => {
    fetchFollowingData(); // フォローしているユーザーのデータを取得
    fetchRecommendedUsers(); // おすすめユーザーを取得
    fetchOfficialUser(); // 公式ユーザーを取得
  }, []);

  // 公式ユーザーを取得
  const fetchOfficialUser = async () => {
    try {
      const officialUid = "2tjGBOa6snXpIpxb2drbSvUAmb83";
      const userSnapshot = await firestore()
        .collection("users")
        .where("uid", "==", officialUid)
        .get();
      const officialUserData = userSnapshot.docs[0]?.data();
      setOfficialUser(officialUserData);
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
      const followSnapshot = await firestore()
        .collection("follow")
        .where("followerId", "==", auth.currentUser.uid)
        .get();

      const followingList = followSnapshot.docs.map(
        (doc) => doc.data().followeeId
      );

      if (followingList.length > 0) {
        let potentialRecommendedUsersSet = new Set();
        let maxRetries = 5;
        let retryCount = 0;

        while (
          potentialRecommendedUsersSet.size === 0 &&
          retryCount < maxRetries
        ) {
          const randomFolloweeId =
            followingList[Math.floor(Math.random() * followingList.length)];

          const followeeFollowSnapshot = await firestore()
            .collection("follow")
            .where("followerId", "==", randomFolloweeId)
            .get();

          for (const followeeDoc of followeeFollowSnapshot.docs) {
            const recommendedUserId = followeeDoc.data().followeeId;

            const followeeFollowersSnapshot = await firestore()
              .collection("follow")
              .where("followerId", "==", recommendedUserId)
              .get();

            const followeeFollowingSnapshot = await firestore()
              .collection("follow")
              .where("followerId", "==", recommendedUserId)
              .get();

            if (
              followeeFollowersSnapshot.docs.length > 0 &&
              recommendedUserId !== auth.currentUser.uid &&
              !followingList.includes(recommendedUserId)
            ) {
              const isOnlyFollowingFollowers =
                followeeFollowingSnapshot.docs.every((followeeDoc) =>
                  followingList.includes(followeeDoc.data().followeeId)
                );

              if (!isOnlyFollowingFollowers) {
                potentialRecommendedUsersSet.add(recommendedUserId);
              }
            }
          }

          retryCount++;
        }

        const validRecommendedUsers = Array.from(potentialRecommendedUsersSet);
        const randomRecommendedUsers = validRecommendedUsers
          .sort(() => 0.5 - Math.random())
          .slice(0, 5);

        if (randomRecommendedUsers.length > 0) {
          const recommendedUserData = await fetchUserDetails(
            randomRecommendedUsers
          );
          setRecommendedUsers(recommendedUserData);
        } else {
          setRecommendedUsers([]);
        }
      } else {
        setRecommendedUsers([]);
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
          return userSnapshot.docs[0]?.data();
        })
      );
      return userDetails.filter((user) => user);
    } catch (error) {
      console.error("Error fetching user details:", error);
      return [];
    }
  };

  // ユーザーの検索を処理
  const handleSearch = (text) => {
    setSearchText(text);
    if (text !== "") {
      firestore()
        .collection("users")
        .where("displayName", ">=", text)
        .where("displayName", "<=", text + "\uf8ff")
        .get()
        .then((result) => {
          setSearchResult(result.docs);
        })
        .catch((error) => console.error("Error searching users:", error));
    } else {
      setSearchResult([]);
    }
  };

  // ユーザーのフォロー/フォロー解除を切り替え
  const handleFollowToggle = async (uid) => {
    try {
      if (following[uid]) {
        const followDoc = await firestore()
          .collection("follow")
          .where("followerId", "==", auth.currentUser.uid)
          .where("followeeId", "==", uid)
          .get();

        if (!followDoc.empty) {
          await followDoc.docs[0].ref.delete();
          setFollowing((prevState) => ({ ...prevState, [uid]: false }));
        }
      } else {
        await firestore().collection("follow").add({
          followerId: auth.currentUser.uid,
          followeeId: uid,
        });
        setFollowing((prevState) => ({ ...prevState, [uid]: true }));

        // フォローされたユーザーに通知を送信
        const userSnapshot = await firestore().collection("users").doc(uid).get();
        const userData = userSnapshot.data();
        if (userData && userData.notificationToken) {
          const message = {
            notification: {
              title: "フォローされました",
              body: `${auth.currentUser.displayName} さんがあなたをフォローしました！`,
            },
            token: userData.notificationToken,
          };
          await messaging().sendMessage(message);
        }
      }
    } catch (error) {
      console.error("Error toggling follow state or sending notification:", error);
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
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#000" style={styles.icon} />
        <TextInput
          style={[styles.input, { fontSize: 18 }]}
          placeholder="検索"
          onChangeText={handleSearch}
          value={searchText}
        />
      </View>

      {officialUser && (
        <View style={styles.recommendedContainer}>
          <Text style={styles.sectionTitle}>おすすめ公式ユーザー</Text>
          <UserItem
            key={officialUser.uid}
            user={officialUser}
            isFollowing={following[officialUser.uid]}
            onProfilePress={() => handleProfile(officialUser.uid)}
            onFollowToggle={() => handleFollowToggle(officialUser.uid)}
          />
        </View>
      )}

      {searchText === "" && recommendedUsers.length > 0 && (
        <View style={styles.recommendedContainer}>
          <Text style={styles.sectionTitle}>おすすめユーザー</Text>
          {recommendedUsers.map((user) => (
            <UserItem
              key={user.uid}
              user={user}
              isFollowing={following[user.uid]}
              onProfilePress={() => handleProfile(user.uid)}
              onFollowToggle={() => handleFollowToggle(user.uid)}
            />
          ))}
        </View>
      )}

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
}

// ユーザーアイテムのためのコンポーネントを分離してクリーンなコードを維持
const UserItem = ({ user, isFollowing, onProfilePress, onFollowToggle }) => (
  <View style={styles.resultBar}>
    <TouchableOpacity onPress={onProfilePress} style={styles.userInfo}>
      <Image source={{ uri: user.photoURL }} style={styles.listProfileImage} />
      <Text style={styles.resultText}>{user.displayName}</Text>
    </TouchableOpacity>
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
  </View>
);

const styles = StyleSheet.create({
  // スタイル設定
  container: {
    flex: 1,
    padding: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    padding: 5,
    marginBottom: 20,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
  },
  recommendedContainer: {
    marginBottom: 20,
  },
  resultsContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
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
  },
  resultText: {
    fontSize: 16,
  },
  followButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
  },
  followedButton: {
    backgroundColor: "#4CAF50",
  },
  unfollowedButton: {
    backgroundColor: "#007bff",
  },
});
