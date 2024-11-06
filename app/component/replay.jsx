import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Dimensions,
  Alert,
  Image,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { formatInTimeZone } from "date-fns-tz";
import firestore from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";
import storage from "@react-native-firebase/storage";
import Icon from "react-native-vector-icons/FontAwesome5";

const auth = FirebaseAuth();

const ReplyScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { postId } = params;
  const [replyText, setReplyText] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };

  const navigateProfile = (uid) => {
    router.push({
      pathname: "/profile",
      params: {
        uid: uid,
      },
    });
  };

  if (!postId) {
    Alert.alert("エラー", "投稿IDが指定されていません。");
    return null;
  }

  const fetchData = async () => {
    try {
      const photoQuerySnapshot = await firestore()
        .collection("photo")
        .where("postId", "==", parseInt(postId))
        .get();

      if (!photoQuerySnapshot.empty) {
        const photoDoc = photoQuerySnapshot.docs[0].data();
        if (photoDoc.imagePath) {
          const url = await storage().ref(photoDoc.imagePath).getDownloadURL();
          setPhotoUri(url);

          const postSnapshot = await firestore()
            .collection("post")
            .where("id", "==", photoDoc.postId)
            .get();

          let postDetails = null;
          if (!postSnapshot.empty) {
            postDetails = postSnapshot.docs[0].data();
          }

          const spotSnapshot = await firestore()
            .collection("spot")
            .where("id", "==", photoDoc.spotId)
            .get();

          let spotName = null;
          if (!spotSnapshot.empty) {
            spotName = spotSnapshot.docs[0].data().name;
          }

          setSelectedPost({ ...photoDoc, postDetails, spotName });
        }
      } else {
        setPhotoUri(null);
      }

      const repliesSnapshot = await firestore()
        .collection("replies")
        .where("postId", "==", parseInt(postId))
        .orderBy("timestamp", "asc")
        .get();

      const repliesData = await Promise.all(
        repliesSnapshot.docs.map(async (doc) => {
          const queryUser = await firestore()
            .collection("users")
            .where("uid", "==", doc.data().userId)
            .get();
          const userData = queryUser.docs[0].data();
          return {
            id: doc.id,
            ...doc.data(),
            userData,
          };
        })
      );
      setReplies(repliesData);
    } catch (error) {
      console.error("データ取得中にエラーが発生しました: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [postId]);

  const handleReplySubmit = async () => {
    const currentTime = new Date().toISOString();

    if (replyText.trim()) {
      if (!auth.currentUser) {
        Alert.alert("エラー", "ログインしてください。");
        return;
      }
      const userId = auth.currentUser.uid;

      const querySnapshot = await firestore()
        .collection("replies")
        .orderBy("parentReplyId", "desc")
        .get();

      const maxId = querySnapshot.empty
        ? 1
        : querySnapshot.docs[0].data().parentReplyId + 1;

      try {
        await firestore()
          .collection("replies")
          .add({
            postId: parseInt(postId),
            parentReplyId: maxId,
            userId: userId,
            text: replyText,
            timestamp: currentTime,
          });

        setReplyText("");
        Alert.alert("成功", "返信が送信されました。");
        fetchData();
        router.back();
      } catch (error) {
        Alert.alert(
          "エラー",
          `返信の送信中にエラーが発生しました: ${error.message}`
        );
        console.error("Error adding reply:", error);
      }
    } else {
      Alert.alert("エラー", "返信を入力してください。");
    }
  };

  const renderReply = ({ item }) => (
    <View style={styles.replyContainer}>
      {console.log(item)}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userBar}
          onPress={() => {
            navigateProfile(item.userId);
          }}
        >
          <Image
            source={{ uri: item.userData.photoURL }}
            style={styles.iconImage}
          />
          <Text>{item.userData.displayName}</Text>
        </TouchableOpacity>
        <Text style={styles.replyTimestamp}>
          {formatInTimeZone(
            new Date(item.timestamp),
            "Asia/Tokyo",
            "yyyy年MM月dd日 HH:mm"
          )}
        </Text>
      </View>
      <Text style={styles.replyText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <>
          {selectedPost && (
            <>
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={handleBackPress}
                  style={styles.iconButton}
                >
                  <Icon name="angle-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.spotName}>{selectedPost.spotName}</Text>
                <TouchableOpacity style={styles.iconButton}></TouchableOpacity>
              </View>
              <View style={styles.contentContainer}>
                {photoUri && (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </View>
                )}
                <View style={styles.postDetails}>
                  <Text style={styles.spotText}>
                    投稿詳細：{" "}
                    {selectedPost.postDetails
                      ? selectedPost.postDetails.postTxt
                      : "詳細がありません"}
                  </Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="返信を入力..."
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                />

                <Button title="送信" onPress={handleReplySubmit} />

                <FlatList
                  data={replies}
                  renderItem={renderReply}
                  keyExtractor={(item) => item.id}
                  style={styles.repliesList}
                  ListEmptyComponent={
                    <Text style={styles.noRepliesText}>
                      まだ返信がありません。
                    </Text>
                  }
                />
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row", // 横並びにする
    alignItems: "center", // 縦方向の中央揃え
    justifyContent: "space-between", // アイコンを左端に配置
  },
  iconButton: {
    width: 50, // 横幅を設定
    height: 50, // 高さを設定
    justifyContent: "center", // 縦中央揃え
    alignItems: "center", // 横中央揃え
  },
  userBar: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  iconImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  spotName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  imageContainer: {
    width: 225,
    height: 300,
    marginBottom: 10,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    overflow: "hidden",
    alignSelf: "center",
  },
  image: {
    width: 225,
    height: 300,
  },
  postDetails: {
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    marginBottom: 10,
  },
  spotText: {
    fontSize: 16,
    color: "#333",
  },
  input: {
    height: 80,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
    borderRadius: 5,
  },
  repliesList: {
    marginTop: 20,
  },
  replyContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "lightgray",
  },
  replyText: {
    fontSize: 14,
    paddingHorizontal: 10,
  },
  replyTimestamp: {
    fontSize: 12,
    color: "gray",
  },
  noRepliesText: {
    textAlign: "center",
    color: "gray",
    marginTop: 10,
  },
});

export default ReplyScreen;
