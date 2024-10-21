// MyModal.js
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Animated,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { formatInTimeZone } from "date-fns-tz";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore, { FieldValue } from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/FontAwesome5";

const auth = FirebaseAuth();
const router = useRouter();

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
    tempObj1[post.postId] = post.likeFlag;
    tempObj2[post.postId] = post.likeCount;
  });

  const handleUnlike = async (postId, index) => {
    if (likes[postId] == true) {
      handleSimpleLike(postId, index);
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

  const handleSimpleUnlike = async (postId, index) => {
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

  const handleLike = async (postId, index) => {
    if (likes[postId] == true) {
      handleSimpleUnlike(postId, index);
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

  const handleSimpleLike = async (postId, index) => {
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

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* ✖ ボタン */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{/* スタイルを設定 */}✖</Text>
          </TouchableOpacity>

          <ScrollView>
            {loading ? (
              <Text>読み込み中...</Text>
            ) : !empty && postData.length > 0 ? (
              postData.map((post, index) => {
                const isLiked = likes[post.postId];
                const flag = tempObj1[post.postId];
                const count = tempObj2[post.postId];
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

                    {/* 日付といいねボタンの表示 */}
                    <View style={styles.dateLikeRow}>
                      <Text>
                        {formatInTimeZone(
                          new Date(post.timestamp),
                          "Asia/Tokyo",
                          "yyyy/MM/dd HH:mm"
                        )}
                      </Text>

                      {/* いいねボタン */}
                      {postImage ? (
                        <View>
                          {flag ? (
                            <TouchableOpacity
                              style={styles.likeButton}
                              onPress={() => handleUnlike(post.postId, index)}
                            >
                              {isLiked ? (
                                <Icon name="heart" size={16} color="#000" />
                              ) : (
                                <Icon name="heart" size={16} color="	#ff0000" />
                              )}
                              <Text
                                style={{ color: isLiked ? "black" : "red" }}
                              >
                                {isLiked ? count - 1 : count}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.likeButton}
                              onPress={() => handleLike(post.postId, index)}
                            >
                              {isLiked ? (
                                <Icon name="heart" size={16} color="#ff0000" />
                              ) : (
                                <Icon name="heart" size={16} color="	#000" />
                              )}
                              <Text
                                style={{ color: isLiked ? "red" : "black" }}
                              >
                                {isLiked ? count + 1 : count}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : (
                        <View>
                          {flag ? (
                            <TouchableOpacity style={styles.likeButton}>
                              {isLiked ? (
                                <Icon name="heart" size={16} color="#000" />
                              ) : (
                                <Icon name="heart" size={16} color="	#ff0000" />
                              )}
                              <Text
                                style={{ color: isLiked ? "black" : "red" }}
                              >
                                {isLiked ? count - 1 : count}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity style={styles.likeButton}>
                              {isLiked ? (
                                <Icon name="heart" size={16} color="#ff0000" />
                              ) : (
                                <Icon name="heart" size={16} color="	#000" />
                              )}
                              <Text
                                style={{ color: isLiked ? "red" : "black" }}
                              >
                                {isLiked ? count + 1 : count}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>

                    <Text>{post.postText}</Text>

                    {postImage ? (
                      <View style={styles.toolView}>
                        {showButtons && (
                          <Animated.View
                            style={[styles.buttonView, { opacity: fadeAnim }]}
                          >
                            <Pressable
                              style={styles.roundButton}
                              onPress={hideButtons}
                            >
                              <Icon name="times" size={25} color="#000" />
                            </Pressable>
                            <Pressable
                              style={styles.roundButton}
                              onPress={() => {
                                router.push({
                                  pathname: "/cameraComposition",
                                  params: {
                                    latitude: 0,
                                    longitude: 0,
                                    spotId: spotId,
                                  },
                                });
                              }}
                            >
                              <Icon name="images" size={25} color="#000" />
                            </Pressable>
                            <Pressable
                              style={styles.roundButton}
                              onPress={() => {
                                router.push({
                                  pathname: "/camera",
                                  params: {
                                    latitude: 0,
                                    longitude: 0,
                                    spotId: spotId,
                                  },
                                });
                              }}
                            >
                              <Icon name="camera" size={25} color="#000" />
                            </Pressable>
                          </Animated.View>
                        )}
                        <Pressable
                          style={styles.roundButton}
                          onPress={showAnimatedButtons}
                        >
                          <Icon name="map-marked-alt" size={25} color="#000" />
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.toolView} />
                    )}
                  </View>
                );
              })
            ) : (
              <Text>投稿がありません</Text>
            )}
          </ScrollView>
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
    flexDirection: "row", // 横方向に要素を配置
    justifyContent: "flex-end", // 右寄せにする
  },
  buttonView: {
    flexDirection: "row", // 横方向に要素を配置
    justifyContent: "flex-end", // 右寄せにする
  },
  postButton: {
    width: 75,
    height: 25,
    backgroundColor: "blue",
    justifyContent: "center", // 垂直方向の中央揃え
    alignItems: "center", // 水平方向の中央揃え
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
    marginLeft: 10, // 日付といいねボタンの間のスペース
  },
  closeButton: {
    position: "absolute", //絶対配置
    top: 10,
    right: 10,
    padding: 10,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  dateLikeRow: {
    flexDirection: "row", //右端に配置
    alignItems: "center",
    marginTop: 10,
  },
  roundButton: {
    backgroundColor: "#007AFF", // ボタンの背景色
    borderRadius: 25, // ボタンを丸くするために大きめの値を指定
    width: 50, // ボタンの幅
    height: 50, // ボタンの高さ
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
    marginBottom: 10, // ボタン間の余白
  },
});

export default MyModal;
