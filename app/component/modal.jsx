import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { formatInTimeZone } from "date-fns-tz";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore, { FieldValue } from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/FontAwesome5";

const auth = FirebaseAuth();

export default function MyModal({
  visible,
  empty,
  postData = [], // デフォルト値を空の配列に設定
  postImage,
  spotId,
  loading,
  onClose,
}) {
  const router = useRouter();
  const [likes, setLikes] = useState({});

  const [showButtons, setShowButtons] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current; // フェードアニメーションの初期値

  const handleLikePress = (postId) => {
    setLikes((prevLikes) => ({
      ...prevLikes,
      [postId]: !prevLikes[postId],
    }));
  };

  const tempObj1 = {};
  const tempObj2 = {};

  postData.map((post) => {
    if (post) {
      // postが未定義でないことを確認
      tempObj1[post.id] = post.likeFlag; // postIdをidに修正
      tempObj2[post.id] = post.likeCount;
    }
  });

  const handleUnlike = async (postId) => {
    if (likes[postId] == true) {
      handleSimpleLike(postId);
    } else {
      handleLikePress(postId);
      tempObj2[postId] = tempObj2[postId] - 1;
      const querylike = await firestore()
        .collection("like")
        .where("postId", "==", postId)
        .get();
      const queryId = querylike.docs[0].ref._documentPath._parts[1];
      await firestore()
        .collection("like")
        .doc(queryId)
        .update({
          count: tempObj2[postId],
          [auth.currentUser.uid]: FieldValue.delete(),
        });
    }
  };

  const handleSimpleUnlike = async (postId) => {
    handleLikePress(postId);
    const querylike = await firestore()
      .collection("like")
      .where("postId", "==", postId)
      .get();
    const queryId = querylike.docs[0].ref._documentPath._parts[1];
    await firestore()
      .collection("like")
      .doc(queryId)
      .update({
        count: tempObj2[postId],
        [auth.currentUser.uid]: FieldValue.delete(),
      });
  };

  const handleLike = async (postId) => {
    if (likes[postId] == true) {
      handleSimpleUnlike(postId);
    } else {
      handleLikePress(postId);
      tempObj2[postId] = tempObj2[postId] + 1;
      const querylike = await firestore()
        .collection("like")
        .where("postId", "==", postId)
        .get();
      const queryId = querylike.docs[0].ref._documentPath._parts[1];
      await firestore()
        .collection("like")
        .doc(queryId)
        .update({
          count: tempObj2[postId],
          [auth.currentUser.uid]: auth.currentUser.uid,
        });
    }
  };

  const handleSimpleLike = async (postId) => {
    handleLikePress(postId);
    const querylike = await firestore()
      .collection("like")
      .where("postId", "==", postId)
      .get();
    const queryId = querylike.docs[0].ref._documentPath._parts[1];
    await firestore()
      .collection("like")
      .doc(queryId)
      .update({
        count: tempObj2[postId],
        [auth.currentUser.uid]: auth.currentUser.uid,
      });
  };

  // ボタンを表示してフェードイン
  const showAnimatedButtons = () => {
    setShowButtons(true);
    Animated.timing(fadeAnim, {
      toValue: 1, // 完全に表示
      duration: 500, // 0.5秒でフェードイン
      useNativeDriver: true,
    }).start();
  };

  // 新しいボタン1を押したときにボタンをフェードアウトして非表示
  const hideButtons = () => {
    Animated.timing(fadeAnim, {
      toValue: 0, // 完全に非表示
      duration: 500, // 0.5秒でフェードアウト
      useNativeDriver: true,
    }).start(() => {
      setShowButtons(false); // フェードアウト完了後にボタンを非表示
    });
  };

  const navigateProfile = (uid) => {
    router.push({
      pathname: "/profile",
      params: {
        uid: uid,
      },
    });
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalView}>
            {loading ? (
              <View style={styles.postViewCentering}>
                <ActivityIndicator size="large" color="#239D60" />
                <Text>読み込み中...</Text>
              </View>
            ) : !empty && postData.length > 0 ? (
              postData.map((post) => {
                if (!post) return null; // postが未定義の場合はスキップ
                const isLiked = likes[post.id]; // idを使用する
                const flag = tempObj1[post.id];
                const count = tempObj2[post.id];
                return (
                  <View key={post.postId} style={styles.postView}>
                    <TouchableOpacity
                      style={styles.profileBar}
                      onPress={() => {
                        navigateProfile(post.userId);
                      }}
                    >
                      <Image
                        source={{ uri: post.userIcon }}
                        style={styles.userIcon}
                      />
                      <Text style={styles.userName}>{post.username}</Text>
                    </TouchableOpacity>
                    <View style={styles.postDetail}>
                      {postImage ? (
                        <Image
                          source={{ uri: post.photoUri }}
                          style={styles.postImage}
                        />
                      ) : (
                        <Image
                          source={{ uri: post.photoUri }}
                          style={styles.postImage}
                          blurRadius={50}
                        />
                      )}

                      <View style={styles.LikeCommentRow}>
                        {/* いいねボタン */}
                        {postImage ? (
                          <View>
                            {flag ? (
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleUnlike(post.postId, index)}
                              >
                                <Icon
                                  name="heart"
                                  size={25}
                                  color={isLiked ? "#000" : "#f00"}
                                />
                                <Text
                                  style={[{ color: isLiked ? "black" : "red" }, styles.likeNum]}
                                >
                                  {isLiked ? count - 1 : count}
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleLike(post.postId, index)}
                              >
                                <Icon
                                  name="heart"
                                  size={25}
                                  color={isLiked ? "#f00" : "#000"}
                                />
                                <Text
                                  style={[{ color: isLiked ? "red" : "black" }, styles.likeNum]}
                                >
                                  {isLiked ? count + 1 : count}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ) : (
                          <View>
                            {flag ? (
                              <TouchableOpacity style={styles.actionButton}>
                                <Icon
                                  name="heart"
                                  size={25}
                                  color={isLiked ? "#000" : "#f00"}
                                />
                                <Text
                                  style={{ color: isLiked ? "black" : "red" }}
                                >
                                  {isLiked ? count - 1 : count}
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity style={styles.actionButton}>
                                <Icon
                                  name="heart"
                                  size={25}
                                  color={isLiked ? "#f00" : "#000"}
                                />
                                <Text
                                  style={{ color: isLiked ? "red" : "black" }}
                                >
                                  {isLiked ? count + 1 : count}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                        <TouchableOpacity style={styles.actionButton} onPress={() => {
                          router.push({
                            pathname: "/component/replay",
                            params: { postId: post.postId }, // idを使用
                          });
                        }}>
                          <Icon
                            name="comment"
                            size={25}
                            color={isLiked ? "#f00" : "#000"}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}
                          onPress={() => {
                            router.push({
                              pathname: "/cameraComposition",
                              params: {
                                latitude: 0,
                                longitude: 0,
                                spotId: spotId,
                                photoUri: encodeURIComponent(post.photoUri),
                              },
                            });
                          }}>
                          <Icon
                            name="images"
                            size={25}
                            color={isLiked ? "#f00" : "#000"}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}
                          onPress={() => {
                            router.push({
                              pathname: "/camera",
                              params: {
                                latitude: 0,
                                longitude: 0,
                                spotId: spotId,
                                point: 0,
                                spotNo: 0,
                              },
                            });
                          }}>
                          <Icon
                            name="map-marked-alt"
                            size={25}
                            color={isLiked ? "#f00" : "#000"}
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.postText}>
                        <Text>{post.postText}</Text>
                        <Text style={{ fontSize: 10, color: "#4d4d4d" }}>
                          {formatInTimeZone(
                            new Date(post.timestamp),
                            "Asia/Tokyo",
                            "yyyy年MM月dd日 HH:mm"
                          )}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.closeButton}>
                      <TouchableOpacity
                        style={styles.button}
                        onPress={onClose}
                      >
                        <Icon name="times" size={24} color="#000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.postViewCentering}>
                <Text style={styles.userName}>投稿がありません</Text>
                <View style={styles.closeButton}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={onClose}
                  >
                    <Icon name="times" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>
            )}



          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
  },
  modalView: {
    flexDirection: "column",
    width: 350,
    margin: 20,
    marginBottom: 0,
    marginTop: 85,
    alignSelf: "center",
    position: "relative",
  },
  postView: {
    width: "100%",
    padding: 20,
    backgroundColor: "#F2F5C2",
    borderRadius: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  postViewCentering: {
    width: "100%",
    padding: 20,
    alignItems: 'center',      // 横方向の中央揃え
    backgroundColor: "#F2F5C2",
    borderRadius: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  profileBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    alignSelf: 'flex-start', // 子要素の横幅に合わせる
    padding: 5,
    paddingLeft: 0,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  userName: {
    fontSize: 18,
    color: "#000000",
    justifyContent: "center",
    fontWeight: "300",
  },
  postDetail: {
    alignItems: 'center',
  },
  postImage: {
    width: "100%", // 幅を指定
    aspectRatio: 3 / 4, // 高さを3:4の比率に保つ
    resizeMode: 'cover',
    margin: 10,
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  LikeCommentRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: 'space-between',
    width: "90%",
    marginBottom: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    padding: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
  },
  likeNum: {
    marginLeft: 10,
    fontSize: 16,
  },
  postText: {
    justifyContent: "flex-start",
    width: "95%",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  button: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F5C2",
    width: 50,
    height: 50,
    marginBottom: 10, // ボタン間にスペースを追加
  },
});
