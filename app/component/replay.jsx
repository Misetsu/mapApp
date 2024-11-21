import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Dimensions,
  StyleSheet,
  Text,
  Alert,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  FlatList, // ScrollViewからFlatListに変更z
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { formatInTimeZone } from "date-fns-tz";
import firestore from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";
import storage from "@react-native-firebase/storage";
import Icon from "react-native-vector-icons/FontAwesome5";
import RepliesList from "./RepliesList"; // RepliesList コンポーネントをインポート

const auth = FirebaseAuth();
const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する

const ReplyScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { postId, showImage } = params;
  const [replyText, setReplyText] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
 
  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    setIsScrolling(contentOffset.y > 0); // スクロール位置が0以上なら非表示
  };

  const handleBackPress = () => {
    router.back();
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

          const userSnapshot = await firestore()
            .collection("users")
            .where("uid", "==", postDetails.userId)
            .get();

          let userDetails = null;
          if (!userSnapshot.empty) {
            userDetails = userSnapshot.docs[0].data();
          }

          const spotSnapshot = await firestore()
            .collection("spot")
            .where("id", "==", photoDoc.spotId)
            .get();

          let spotName = null;
          if (!spotSnapshot.empty) {
            spotName = spotSnapshot.docs[0].data().name;
          }

          setSelectedPost({ ...photoDoc, postDetails, spotName, userDetails });
        }
      } else {
        setPhotoUri(null);
      }

      const repliesSnapshot = await firestore()
        .collection("replies")
        .where("postId", "==", parseInt(postId))
        .orderBy("parentReplyId", "asc") // parentReplyIdでソート
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

  useEffect(() => {
    console.log("Replies Data:", replies);
  }, [replies]);
  

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
            hantei: 0,
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // iOSの場合はオフセット調整
    >
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
                  <TouchableOpacity
                    style={styles.iconButton}
                  ></TouchableOpacity>
                </View>
                <View style={styles.contentContainer}>
                  <View style={styles.postUserBar}>
                    <TouchableOpacity
                      style={styles.postUser}
                      onPress={() => {
                        navigateProfile(selectedPost.userDetails.uid);
                      }}
                    >
                      <Image
                        source={{ uri: selectedPost.userDetails.photoURL }}
                        style={styles.postIconImage}
                      />
                      <Text style={{ fontSize: 16 }}>
                        {selectedPost.userDetails.displayName}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.postDate}>
                      {formatInTimeZone(
                        new Date(selectedPost.postDetails.timeStamp),
                        "Asia/Tokyo",
                        "yyyy年MM月dd日 HH:mm"
                      )}
                    </Text>
                  </View>
                  {showImage == "true" ? (
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: photoUri }} style={styles.image} />
                    </View>
                  ) : (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: photoUri }}
                        style={styles.image}
                        blurRadius={50}
                      />
                    </View>
                  )}
                  <View style={styles.postDetails}>
                    <Text style={styles.spotText}>
                      {selectedPost.postDetails.postTxt != ""
                        ? selectedPost.postDetails.postTxt
                        : "詳細がありません"}
                    </Text>
                  </View>
                <View style={styles.sky}>
                  <FlatList
                    data={replies}
                    renderItem={({ item }) => (
                      <RepliesList
                        replies={[item]}
                        navigateProfile={navigateProfile}
                        postId={postId}
                        style={styles.test}
                      />
                    )}
                    keyExtractor={(item, index) => item.id || String(index)} // idが空の場合はインデックスを使用
                    style={styles.repliesList}
                    

                    ListEmptyComponent={
                      <Text style={styles.noRepliesText}>
                        まだ返信がありません。
                      </Text>
                    }
                    onScroll={handleScroll} // スクロールイベントを監視
                    scrollEventThrottle={16} // イベントの感度調整
                  />
                  </View>
                </View>
              </>
            )}
          </>
        )}
      
      {/* </ScrollView> */}
      {/* スクロール中で非表示 */}
      {!isScrolling && (
        <View style={styles.sendReply}>
          <TextInput
            style={styles.input}
            placeholder="返信を入力..."
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <TouchableOpacity style={styles.replyBtn} onPress={handleReplySubmit}>
            <Text style={styles.replyBtnText}>送信</Text>
          </TouchableOpacity>
        </View>
      )}

      
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    height: height - 60,
    backgroundColor: "#F2F5C8",
    flex: 1,
    marginBottom: "auto"
  },
  centerContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F5C8",
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  spotName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  imageContainer: {
    width: ((height * 0.3) / 4) * 3,
    height: height * 0.3,
    marginBottom: 10,
    overflow: "hidden",
    alignSelf: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    aspectRatio: 3 / 4, // 高さを3:4の比率に保つ
    resizeMode: "cover",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  postDetails: {
    padding: 10,
  },
  spotText: {
    fontSize: 16,
    color: "#333",
  },
  input: {
    height: 50,
    backgroundColor: "#FAFAFA",
    borderColor: "gray",
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    width: "80%", // 少し小さくしてボタンと並べる
    flex: 1,
  },
  replyBtn: {
    height: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    justifyContent: "center",
    backgroundColor: "#A3DE83",
  },
  repliesList: {},
  replyContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "lightgray",
    marginBottom: "auto",
    backgroundColor: "white",
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
  sendReply: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F2F5C8",
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 10,
    alignItems: 'center', // 中央に揃える
    justifyContent: 'space-between', // ボタンとテキスト入力を端に揃える
    flex: 1,
  },
  postUserBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  postUser: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    height: "100%",
  },
  postIconImage: {
    width: 36,
    height: 36,
    borderRadius: 18,

  },
  postDate: {
    fontSize: 12,
    color: "gray",
  },
  test:{
    backgroundColor: "white",
    adding: 10,
    marginBottom:"auto",
    height: ((height * 0.3) / 4) * 3,
    flex: 1, // 画面全体を使う
  },
  sky:{
    height:300
  }
});

export default ReplyScreen;
