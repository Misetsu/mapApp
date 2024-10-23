// MyModal.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { formatInTimeZone } from "date-fns-tz";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore, { FieldValue } from "@react-native-firebase/firestore";

const auth = FirebaseAuth();

const MyModal = ({
  visible,
  empty,
  postData,
  postImage,
  spotId,
  loading,
  onClose,
}) => {
  const [likes, setLikes] = useState({});
  const [tempObj, setTempObj] = useState({}); // 各投稿のlikeCountを管理

  useEffect(() => {
    const initialLikes = {};
    const initialCounts = {};
    
    postData.forEach((post) => {
      initialLikes[post.postId] = post.likeFlag;
      initialCounts[post.postId] = post.likeCount;
    });
    
    setLikes(initialLikes);
    setTempObj(initialCounts);
  }, [postData]);

  const handleLikePress = (postId) => {
    setLikes((prevLikes) => ({
      ...prevLikes,
      [postId]: !prevLikes[postId],
    }));
  };

  const updateLikeCount = async (postId, countChange) => {
    const userId = auth.currentUser?.uid; // ログイン状態を確認
    if (!userId) {
      console.error("ユーザーがログインしていません。");
      return; // ログインしていない場合は処理を中断
    }
    try {
      const querylike = await firestore()
        .collection("like")
        .where("postId", "==", postId)
        .get();

      if (!querylike.empty) {
        const queryId = querylike.docs[0].ref.id;
        await firestore()
          .collection("like")
          .doc(queryId)
          .update({
            count: FieldValue.increment(countChange), // countをインクリメント
            userId: countChange > 0 ? userId : FieldValue.delete(), // いいね追加の場合はuserIdを設定、削除の場合は削除
          });
      }
    } catch (error) {
      console.error("いいねの更新中にエラーが発生しました: ", error);
    }
  };

  const handleUnlike = async (postId) => {
    if (likes[postId]) {
      handleLikePress(postId);
      setTempObj((prev) => ({ ...prev, [postId]: prev[postId] - 1 })); // local stateのカウントを更新
      await updateLikeCount(postId, -1); // いいねを外す
    }
  };

  const handleLike = async (postId) => {
    if (!likes[postId]) {
      handleLikePress(postId);
      setTempObj((prev) => ({ ...prev, [postId]: prev[postId] + 1 })); // local stateのカウントを更新
      await updateLikeCount(postId, 1); // いいねを追加
    } else {
      handleUnlike(postId); // すでにいいねしている場合は、いいねを外す
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✖</Text>
          </TouchableOpacity>

          <ScrollView>
            {loading ? (
              <Text>読み込み中...</Text>
            ) : !empty && postData.length > 0 ? (
              postData.map((post) => {
                const isLiked = likes[post.postId];
                const count = tempObj[post.postId];
                return (
                  <View key={post.postId}>
                    <Link
                      href={{
                        pathname: "/profile",
                        params: {
                          uid: post.userId,
                        },
                      }}
                      asChild
                    >
                      <TouchableOpacity style={styles.userInfo}>
                        <Image
                          source={{ uri: post.userIcon }}
                          style={styles.userIcon}
                        />
                        <Text>{post.username}</Text>
                      </TouchableOpacity>
                    </Link>
                    {postImage ? (
                      <Image
                        source={{ uri: post.photoUri }}
                        style={{ width: 300, height: 400 }}
                      />
                    ) : (
                      <Image
                        source={{ uri: post.photoUri }}
                        style={{ width: 300, height: 400 }}
                        blurRadius={50}
                      />
                    )}

                    <View style={styles.dateLikeRow}>
                      <Text>
                        {formatInTimeZone(
                          new Date(post.timestamp),
                          "Asia/Tokyo",
                          "yyyy/MM/dd HH:mm"
                        )}
                      </Text>

                      <TouchableOpacity
                        style={styles.likeButton}
                        onPress={() => handleLike(post.postId)}
                      >
                        <Text style={{ color: isLiked ? "red" : "black" }}>
                          {isLiked ? "❤️ " + count : "♡ " + count}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text>{post.postText}</Text>
                  </View>
                );
              })
            ) : (
              <Text>投稿がありません</Text>
            )}
          </ScrollView>

          <View style={styles.toolView}>
            <Link
              href={{
                pathname: "/camera",
                params: {
                  latitude: 0,
                  longitude: 0,
                  spotId: spotId,
                },
              }}
              asChild
            >
              <Pressable style={styles.postButton}>
                <Text style={styles.postButtonText}>投稿</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
  },
  modalView: {
    width: 350,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: "relative",
  },
  toolView: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  postButton: {
    width: 75,
    height: 25,
    backgroundColor: "blue",
    justifyContent: "center",
    alignItems: "center",
  },
  postButtonText: {
    color: "#FFFFFF",
  },
  userIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  userInfo: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
  },
  likeButton: {
    marginLeft: 10,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 10,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#888",
  },
  dateLikeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});

export default MyModal;
