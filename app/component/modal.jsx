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
        <View>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalView}>
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
  },
  modalView: {
    flexDirection: "column",
    width: 350,
    margin: 20,
    marginBottom: 0,
    marginTop: 85,
    borderRadius: 20,
    alignSelf: "center",
    position: "relative",
  },
  postView: {
    width: "100%",
    padding: 20,
    backgroundColor: "#F2F5C2",
    borderRadius: 10,
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
    width: "95%",
    margin: 10,
    marginTop: 0,
  },
  actionButton: {
    width: 40,
    height: 40,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
    marginLeft: 5,
    marginRight: 5,
  },
  likeNum: {
    marginLeft: 10,
    fontSize: 16,
  },
  postText: {
    justifyContent: "flex-end",
    width: "95%"
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
