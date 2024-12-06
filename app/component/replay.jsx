import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Dimensions,
  StyleSheet,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  FlatList, // ScrollViewからFlatListに変更z
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { formatInTimeZone } from "date-fns-tz";
import firestore, { FieldValue } from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";
import storage from "@react-native-firebase/storage";
import Icon from "react-native-vector-icons/FontAwesome5";
import RepliesList from "./RepliesList"; // RepliesList コンポーネントをインポート
import RNFS from "react-native-fs";
import { PermissionsAndroid, Alert } from "react-native";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import Share from "react-native-share";

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
  const [isLiked, setIsLiked] = useState(false);
  const [allTag, setAllTag] = useState([]);
  const [selectedTag, setSelectedTag] = useState([]);

  const handleBackPress = () => {
    router.back();
  };

  const navigateProfile = (uid) => {
    if (uid == auth.currentUser.uid) {
      router.push({ pathname: "/myPage" });
    } else {
      router.push({
        pathname: "/profile",
        params: {
          uid: uid,
        },
      });
    }
  };

  if (!postId) {
    Alert.alert("エラー", "投稿IDが指定されていません。");
    return null;
  }
  const generateShareMessage = (spotName, spotId) => {
    const baseURL = "http://syuto.s322.xrea.com/";
    const queryParams = new URLSearchParams({
      _gl: "1*siyzma*_gcl_au*MTk4MDUwNjE0Ni4xNzMxOTM2NTY2",
      _ga: "MjAzMzg2MzgzMC4xNzMxOTM2NDM2",
      _ga_J8YE7Q8ZQD: "MTczMjUwMTUyOS42LjEuMTczMjUwMzEzMC41OS4xLjcwODEwODkzOA",
      spotId: spotId,
      latitude: selectedPost.latitude,
      longitude: selectedPost.longitude,
    }).toString();

    return `${spotName}の投稿をチェック！！\n${baseURL}?${queryParams}`;
  };

  const onShare = () => {
    try {
      const result = Share.open({
        message: generateShareMessage(
          selectedPost.spotName,
          selectedPost.postDetails.spotId
        ),
      });
    } catch (warning) {}
  };

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
          let latitude = null;
          let longitude = null;
          if (!spotSnapshot.empty) {
            spotName = spotSnapshot.docs[0].data().name;
            latitude = spotSnapshot.docs[0].data().mapLatitude;
            longitude = spotSnapshot.docs[0].data().mapLongitude;
          }

          const likeSnapShot = await firestore()
            .collection("like")
            .where("postId", "==", parseInt(postId))
            .get();

          const likeData = likeSnapShot.docs[0].data();
          const likeCount = likeData.count;
          let likeFlag = true;
          if (likeData[auth.currentUser.uid] != undefined) {
            likeFlag = true;
          } else {
            likeFlag = false;
          }

          const fetchResult = [];

          const tagSnapshot = await firestore()
            .collection("tagPost")
            .where("postId", "==", parseInt(postId))
            .get();
          if (!tagSnapshot.empty) {
            tagSnapshot.forEach(async (docs) => {
              const item = docs.data();
              fetchResult.push(item.tagId);
            });
          }
          setSelectedTag(fetchResult);

          setIsLiked(likeFlag);
          setSelectedPost({
            ...photoDoc,
            postDetails,
            spotName,
            latitude,
            longitude,
            userDetails,
            likeCount,
            likeFlag,
          });
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
  const saveImageToDevice = async () => {
    try {
      // 書き込み権限をリクエスト
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );

      if (
        !PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        )
      ) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
      }

      if (!photoUri) {
        Alert.alert("エラー", "保存する画像が見つかりません。");
        return;
      }

      const pathname = selectedPost.postDetails.imagePath.split("/");
      // 保存するパスを設定
      const downloadPath =
        RNFS.DownloadDirectoryPath + "/" + pathname[1] + ".jpg";

      // ダウンロード処理
      const result = await RNFS.downloadFile({
        fromUrl: photoUri, // 表示されている画像のURL
        toFile: downloadPath, // 保存先のパス
      }).promise;

      if (result.statusCode === 200) {
        // Androidの場合、メディアスキャンを実行してギャラリーに画像を認識させる
        await CameraRoll.saveAsset(downloadPath, {
          type: "photo",
          album: "Pocape",
        });
        Alert.alert("", `画像が保存されました。`);
      } else {
        Alert.alert("エラー", "画像の保存に失敗しました。");
      }
    } catch (error) {
      console.error("画像保存中にエラーが発生しました: ", error);
      Alert.alert("エラー", "画像保存中に問題が発生しました。");
    }
  };

  const fetchAllTag = async () => {
    try {
      const tagSnapshot = await firestore()
        .collection("tag")
        .orderBy("tagId", "asc")
        .get();
      const fetchResult = [];
      if (!tagSnapshot.empty) {
        tagSnapshot.forEach((docs) => {
          const item = docs.data();
          fetchResult.push(item);
        });
      }
      setAllTag(fetchResult);
    } catch (error) {
      console.error("データ取得中にエラーが発生しました: ", error);
    }
  };

  useEffect(() => {
    fetchAllTag();
    fetchData();
  }, [postId]);

  useEffect(() => {}, [replies]);

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
        console.error("Error adding reply:", error);
      }
    } else {
      Alert.alert("エラー", "返信を入力してください。");
    }
  };

  const handleUnlike = async (postId) => {
    if (selectedPost.likeFlag == false) {
      handleSimpleUnlike(postId);
    } else {
      const querylike = await firestore()
        .collection("like")
        .where("postId", "==", parseInt(postId))
        .get();
      const queryId = querylike.docs[0].ref._documentPath._parts[1];
      await firestore()
        .collection("like")
        .doc(queryId)
        .update({
          count: parseInt(selectedPost.likeCount) - 1,
          [auth.currentUser.uid]: FieldValue.delete(),
        });
      setIsLiked(false);
    }
  };

  const handleLike = async (postId) => {
    if (selectedPost.likeFlag) {
      handleSimpleLike(postId);
    } else {
      const querylike = await firestore()
        .collection("like")
        .where("postId", "==", parseInt(postId))
        .get();
      const queryId = querylike.docs[0].ref._documentPath._parts[1];
      await firestore()
        .collection("like")
        .doc(queryId)
        .update({
          count: parseInt(selectedPost.likeCount) + 1,
          [auth.currentUser.uid]: auth.currentUser.uid,
        });
      setIsLiked(true);
    }
  };

  const handleSimpleUnlike = async (postId) => {
    const querylike = await firestore()
      .collection("like")
      .where("postId", "==", parseInt(postId))
      .get();
    const queryId = querylike.docs[0].ref._documentPath._parts[1];
    await firestore()
      .collection("like")
      .doc(queryId)
      .update({
        count: parseInt(selectedPost.likeCount),
        [auth.currentUser.uid]: FieldValue.delete(),
      });
    setIsLiked(false);
  };

  const handleSimpleLike = async (postId) => {
    const querylike = await firestore()
      .collection("like")
      .where("postId", "==", parseInt(postId))
      .get();
    const queryId = querylike.docs[0].ref._documentPath._parts[1];
    await firestore()
      .collection("like")
      .doc(queryId)
      .update({
        count: parseInt(selectedPost.likeCount),
        [auth.currentUser.uid]: auth.currentUser.uid,
      });
    setIsLiked(true);
  };

  const handleDelete = async () => {
    Alert.alert("確認", "投稿を削除しますか？", [
      {
        text: "キャンセル",
        style: "cancel",
      },
      {
        text: "削除",
        onPress: async () => {
          setLoading(true);
          try {
            let batch = firestore().batch();

            await firestore()
              .collection("post")
              .where("id", "==", parseInt(postId))
              .get()
              .then((snapshot) => {
                snapshot.docs.forEach((doc) => {
                  batch.delete(doc.ref);
                });
              });

            await firestore()
              .collection("photo")
              .where("postId", "==", parseInt(postId))
              .get()
              .then((snapshot) => {
                snapshot.docs.forEach(async (doc) => {
                  batch.delete(doc.ref);
                });
              });

            await firestore()
              .collection("like")
              .where("postId", "==", parseInt(postId))
              .get()
              .then((snapshot) => {
                snapshot.docs.forEach((doc) => {
                  batch.delete(doc.ref);
                });
              });

            await firestore()
              .collection("replies")
              .where("postId", "==", parseInt(postId))
              .get()
              .then((snapshot) => {
                snapshot.docs.forEach((doc) => {
                  batch.delete(doc.ref);
                });
              });

            await firestore()
              .collection("tagPost")
              .where("postId", "==", parseInt(postId))
              .get()
              .then((snapshot) => {
                snapshot.docs.forEach((doc) => {
                  batch.delete(doc.ref);
                });
              });

            await batch.commit();
            // const photoRef = storage().child(
            //   selectedPost.photoDoc.imagePath + ".jpg"
            // );
            // await photoRef.delete();
          } catch (error) {
          } finally {
            setLoading(false);
            router.back();
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // iOSの場合はオフセット調整
      enabled={true}
    >
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <>
          {selectedPost && (
            <>
              <Text style={styles.pagetitle}>{selectedPost.spotName}</Text>
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
                  <Text style={styles.userName}>
                    {selectedPost.userDetails.displayName}
                  </Text>
                </TouchableOpacity>
                {selectedPost.userDetails.uid == auth.currentUser.uid ? (
                  <View style={styles.EditTrashRow}>
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: "/editPost",
                          params: { postId },
                        });
                      }}
                      style={styles.actionButton}
                    >
                      <Icon name="pen" size={25} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleDelete}
                      style={styles.actionButton}
                    >
                      <Icon name="trash" size={25} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <></>
                )}
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

              <View style={styles.LikeCommentRow}>
                {isLiked ? (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={
                      auth.currentUser
                        ? () => handleUnlike(postId)
                        : () => {
                            router.push("/loginForm");
                          }
                    }
                  >
                    <Icon
                      name="heart"
                      size={25}
                      color={selectedPost.likeFlag ? "#f00" : "#f00"}
                    />
                    <Text
                      style={[
                        { color: selectedPost.likeFlag ? "red" : "red" },
                        styles.likeNum,
                      ]}
                    >
                      {selectedPost.likeFlag
                        ? selectedPost.likeCount
                        : selectedPost.likeCount + 1}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={
                      auth.currentUser
                        ? () => handleLike(postId)
                        : () => {
                            router.push("/loginForm");
                          }
                    }
                  >
                    <Icon
                      name="heart"
                      size={25}
                      color={selectedPost.likeFlag ? "#000" : "#000"}
                    />
                    <Text
                      style={[
                        {
                          color: selectedPost.likeFlag ? "black" : "black",
                        },
                        styles.likeNum,
                      ]}
                    >
                      {selectedPost.likeFlag
                        ? selectedPost.likeCount - 1
                        : selectedPost.likeCount}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    router.push({
                      pathname: "/camera",
                      params: {
                        latitude: 0,
                        longitude: 0,
                        spotId: selectedPost.postDetails.spotId,
                        point: 0,
                        spotNo: 0,
                      },
                    });
                  }}
                >
                  <Icon name="map-marked-alt" size={25} color={"#000"} />
                </TouchableOpacity>
                {showImage == "true" ? (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      router.push({
                        pathname: "/cameraComposition",
                        params: {
                          latitude: 0,
                          longitude: 0,
                          spotId: selectedPost.postDetails.spotId,
                          photoUri: encodeURIComponent(photoUri),
                        },
                      });
                    }}
                  >
                    <Icon name="images" size={25} color={"#000"} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.actionButton} />
                )}
                {showImage == "true" ? (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onShare()}
                  >
                    <Icon name="share" size={25} color={"#000"} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.actionButton} />
                )}
                {showImage == "true" ? (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => saveImageToDevice()}
                  >
                    <Icon name="download" size={25} color={"#000"} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.actionButton} />
                )}
              </View>
              <View style={styles.postDetails}>
                <Text style={styles.spotText}>
                  {selectedPost.postDetails.postTxt != ""
                    ? selectedPost.postDetails.postTxt
                    : "詳細がありません"}
                </Text>
                <Text style={styles.postDate}>
                  {formatInTimeZone(
                    new Date(selectedPost.postDetails.timeStamp),
                    "Asia/Tokyo",
                    "yyyy年MM月dd日 HH:mm"
                  )}
                </Text>
              </View>
              <View style={styles.postDetails}>
                <View style={styles.selectedTag}>
                  {selectedTag.length == 0 ? (
                    <></>
                  ) : (
                    <FlatList
                      horizontal={true}
                      data={selectedTag}
                      keyExtractor={(item) => item}
                      showsHorizontalScrollIndicator={false}
                      renderItem={({ item }) => {
                        return (
                          <View style={styles.selectedTagView}>
                            <Icon name="tag" size={16} color={"#239D60"} />
                            <Text>
                              {allTag.find((o) => o.tagId == item).tagName}
                            </Text>
                          </View>
                        );
                      }}
                    />
                  )}
                </View>
                <Text style={styles.displayName}>コメント</Text>
              </View>
              <View style={styles.sky}>
                <FlatList
                  data={replies}
                  renderItem={({ item }) => (
                    <RepliesList
                      replies={[item]}
                      navigateProfile={navigateProfile}
                      postId={postId}
                    />
                  )}
                  keyExtractor={(item, index) => item.id || String(index)} // idが空の場合はインデックスを使用
                  style={styles.repliesList}
                  ListEmptyComponent={
                    <Text style={styles.noRepliesText}>
                      まだ返信がありません。
                    </Text>
                  }
                  scrollEventThrottle={16} // イベントの感度調整
                />
              </View>
              <View style={styles.Back}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBackPress}
                >
                  <Icon name="angle-left" size={24} color="#000" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </>
      )}

      <View style={styles.sendReply}>
        <TextInput
          style={styles.input}
          placeholder="コメントを入力..."
          value={replyText}
          onChangeText={setReplyText}
          multiline
        />
        <TouchableOpacity style={styles.replyBtn} onPress={handleReplySubmit}>
          <Text>送信</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F2F5C8",
    flex: 1,
  },
  centerContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F5C8",
    flex: 1,
  },
  backButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F5C8",
    width: 70,
    height: 70,
    marginTop: 5, // ボタン間にスペースを追加
  },
  Back: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  pagetitle: {
    fontSize: 24,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "300",
    color: "#000000",
  },
  displayName: {
    fontSize: 15,
    textAlign: "left",
    alignItems: "flex-start",
    fontWeight: "300",
  },
  imageContainer: {
    width: ((height * 0.3) / 4) * 3,
    height: height * 0.3,
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
    paddingHorizontal: 10,
  },
  spotText: {
    fontSize: 16,
    color: "#333",
    marginVertical: 5,
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
  noRepliesText: {
    textAlign: "center",
    color: "gray",
    marginTop: 10,
  },
  sendReply: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F2F5C8",
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 10,
    alignItems: "center", // 中央に揃える
    justifyContent: "space-between", // ボタンとテキスト入力を端に揃える
    flex: 1,
  },
  postUserBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  postUser: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start", // 子要素の横幅に合わせる
    padding: 5,
  },
  userName: {
    fontSize: 18,
    color: "#000000",
    justifyContent: "center",
    fontWeight: "300",
  },
  postIconImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postDate: {
    fontSize: 12,
    color: "gray",
  },
  LikeCommentRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "90%",
    margin: 5,
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
  EditTrashRow: {
    display: "flex",
    flexDirection: "row",
    alignSelf: "flex-start", // 子要素の横幅に合わせる
    marginBottom: 10,
  },
  likeNum: {
    marginLeft: 10,
    fontSize: 16,
  },
  sky: {
    height: height * 0.25,
  },
  selectedTagView: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderRadius: 20,
    borderColor: "#239D60",
    flexDirection: "row",
    marginHorizontal: 2,
    backgroundColor: "#f2f5c8",
    gap: 10,
  },
  selectedTag: {
    marginVertical: 10,
  },
  saveButton: {
    backgroundColor: "#4CAF50", // 緑色の背景
    paddingVertical: 12, // 上下のパディング
    paddingHorizontal: 20, // 左右のパディング
    borderRadius: 8, // 角を丸く
    alignItems: "center", // テキストを中央揃え
    justifyContent: "center",
    shadowColor: "#000", // 影の色
    shadowOffset: { width: 0, height: 2 }, // 影の位置
    shadowOpacity: 0.2, // 影の透明度
    shadowRadius: 4, // 影のぼかし半径
    elevation: 5, // Android用の影
  },
  saveButtonText: {
    color: "#FFFFFF", // 白色の文字
    fontSize: 16, // 文字サイズ
    fontWeight: "bold", // 太字
  },
});

export default ReplyScreen;
