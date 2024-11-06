import React, { useState, useRef, useEffect } from "react";
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
        <View style={styles.modalView}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.postView}>
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
                    <View style={styles.profileBar}>
                      <TouchableOpacity
                        style={styles.userInfo}
                        onPress={() => {
                          navigateProfile(post.userId);
                        }}
                      >
                        <Image
                          source={{ uri: post.userIcon }}
                          style={styles.userIcon}
                        />
                        <Text>{post.username}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeButtonText}>
                          {/* スタイルを設定 */}✖
                        </Text>
                      </TouchableOpacity>
                    </View>
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
                      {/* いいねボタン */}
                      {postImage ? (
                        <View>
                          {flag ? (
                            <TouchableOpacity
                              style={styles.likeButton}
                              onPress={() => handleUnlike(post.postId, index)}
                            >
                              <Icon
                                name="heart"
                                size={16}
                                color={isLiked ? "#000" : "#f00"}
                              />
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
                              <Icon
                                name="heart"
                                size={16}
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
                      ) : (
                        <View>
                          {flag ? (
                            <TouchableOpacity style={styles.likeButton}>
                              <Icon
                                name="heart"
                                size={16}
                                color={isLiked ? "#000" : "#f00"}
                              />
                              <Text
                                style={{ color: isLiked ? "black" : "red" }}
                              >
                                {isLiked ? count - 1 : count}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity style={styles.likeButton}>
                              <Icon
                                name="heart"
                                size={16}
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

                      <Text style={{ fontSize: 10, color: "#4d4d4d" }}>
                        {formatInTimeZone(
                          new Date(post.timestamp),
                          "Asia/Tokyo",
                          "yyyy年MM月dd日 HH:mm"
                        )}
                      </Text>
                    </View>

                    <Text>{post.postText}</Text>

                    {/* postTextと返信の間の区切り線 */}

                    <View style={styles.divider} />

                    {/* 返信リストの表示 */}
                    <View style={styles.replyContainer}>
                      {post.reply && post.reply.length > 0 ? (
                        post.reply.map((reply, index) => (
                          <View key={index}>
                            <View style={styles.commentRow}>
                              <Image
                                source={{ uri: reply.userIcon }}
                                style={styles.listProfileImage}
                              />
                              <Text>{reply.username}</Text>
                            </View>
                            <Text style={styles.replyText}>
                              {reply.replyText}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text>返信がありません</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.replyButton}
                      onPress={() => {
                        router.push({
                          pathname: "/component/replay",
                          params: { postId: post.postId }, // idを使用
                        });
                      }}
                    >
                      <Text style={styles.replyButtonText}>返信</Text>
                    </TouchableOpacity>

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
                                    photoUri: encodeURIComponent(post.photoUri),
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
                                    point: 0,
                                    spotNo: 0,
                                  },
                                });
                              }}
                            >
                              <Icon
                                name="map-marked-alt"
                                size={25}
                                color="#000"
                              />
                            </Pressable>
                          </Animated.View>
                        )}
                        <Pressable
                          style={styles.roundButton}
                          onPress={showAnimatedButtons}
                        >
                          <Icon name="camera" size={25} color="#000" />
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.toolView} />
                    )}
                  </View>
                );
              })
            ) : (
              <View>
                <Text>投稿がありません</Text>
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
                                point: 0,
                                spotNo: 0,
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
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
  },
  modalView: {
    width: 350,
    margin: 20,
    marginBottom: 0,
    marginTop: 90,
    borderRadius: 20,
    alignSelf: "center",
    position: "relative",
  },
  toolView: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  buttonView: {
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
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
    gap: 5,
  },
  closeButtonText: {
    fontSize: 24,
  },
  replyButton: {
    marginVertical: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    padding: 10,
  },
  replyButtonText: {
    color: "#FFFFFF",
  },
  dateLikeRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  // 追加: postTextと返信リストの間に区切り線を入れるためのスタイル
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0", // 薄いグレーの線
    marginVertical: 10,
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
  profileBar: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  postView: {
    width: "100%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  listProfileImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignSelf: "center",
  },
  commentRow: {
    display: "flex",
    flexDirection: "row",
  },
});
