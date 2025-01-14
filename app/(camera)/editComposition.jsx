import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  Keyboard,
  FlatList,
  TouchableOpacity,
  Modal,
} from "react-native";
import ViewShot from "react-native-view-shot";
import { useLocalSearchParams, useRouter } from "expo-router";
import storage from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";
import Toast from "react-native-simple-toast";

const { width, height } = Dimensions.get("window");
const imageWidth = width * 0.4;
const imageHeight = (imageWidth * 4) / 3;
const auth = FirebaseAuth();

export default function edit() {
  const [post, setPost] = useState("");
  const [focusedInput, setFocusedInput] = useState(null);
  const [keyboardStatus, setKeyboardStatus] = useState(false);
  const [isLoading, setIsoading] = useState(false);
  const [compositionuri, setCompositionuri] = useState(null);
  const [allTag, setAllTag] = useState([]);
  const [selectedTag, setSelectedTag] = useState([]);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);

  const reference = storage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const viewRef = useRef();
  const {
    imageUri,
    latitude,
    longitude,
    spotId,
    Composition,
    topRightdirection,
    topLeftdirection,
    bottomRightdirection,
    bottomLeftdirection,
    leftFirstdirection,
    leftSeconddirection,
    rightThirddirection,
    rightFourthdirection,
    topFirstdirection,
    topSeconddirection,
    topThirddirection,
    topFourthdirection,
    postId,
  } = params;

  const uploadPost = async () => {
    setIsoading(true);

    const currentTime = new Date().toISOString();

    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const imagePath = "photo/" + new Date().getTime().toString() + randomNumber;
    await reference.ref(imagePath).putFile(compositionuri);

    const querySpot = await firestore()
      .collection("spot")
      .where("id", "==", parseInt(spotId))
      .get();

    const spotDocId = querySpot.docs[0].ref._documentPath._parts[1];

    await firestore().collection("spot").doc(spotDocId).update({
      lastUpdateAt: currentTime,
    });

    const queryPost = await firestore()
      .collection("post")
      .orderBy("id", "desc")
      .get();

    const maxPostId = queryPost.docs[0].data().id + 1;

    await firestore()
      .collection("photo")
      .add({
        imagePath: imagePath,
        postId: maxPostId,
        spotId: parseInt(spotId),
        userId: auth.currentUser.uid,
        timeStamp: currentTime,
        originalpostId: parseInt(postId),
      })
      .catch((error) => console.log(error));

    await firestore()
      .collection("post")
      .add({
        id: maxPostId,
        imagePath: imagePath,
        postTxt: post,
        spotId: parseInt(spotId),
        userId: auth.currentUser.uid,
        timeStamp: currentTime,
        likecount: 0,
      })
      .catch((error) => console.log(error));

    await firestore()
      .collection("like")
      .add({
        count: 0,
        postId: maxPostId,
      })
      .catch((error) => console.log(error));

    for (const tag of selectedTag) {
      await firestore()
        .collection("tagPost")
        .add({
          tagId: parseInt(tag),
          postId: maxPostId,
          spotId: maxId,
          timeStamp: currentTime,
        });
    }

    await firestore().collection("users").doc(auth.currentUser.uid).update({
      lastPostAt: currentTime,
    });

    handleVisitState(parseInt(spotId));

    setIsoading(false);
    router.navigate("/");

    Toast.show("投稿しました");
  };

  const handleVisitState = async (spotId) => {
    const querySnapshot = await firestore()
      .collection("users")
      .doc(auth.currentUser.uid)
      .collection("spot")
      .where("spotId", "==", spotId)
      .get();

    const currentTime = new Date().toISOString();

    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].ref._documentPath._parts[3];
      await firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .collection("spot")
        .doc(docId)
        .update({
          timeStamp: currentTime,
        });
    } else {
      await firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .collection("spot")
        .add({
          spotId: spotId,
          timeStamp: currentTime,
        });
      const queryUser = await firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .get();
      const spotPoint = queryUser.data().spotPoint + 1;

      await firestore().collection("users").doc(auth.currentUser.uid).update({
        spotPoint: spotPoint,
      });
    }
  };

  const fetchAllTag = async () => {
    const tagSnapshot = await firestore()
      .collection("tag")
      .orderBy("tagId")
      .get();
    const fetchResult = [];
    tagSnapshot.forEach((doc) => {
      const item = doc.data();
      fetchResult.push(item);
    });
    setAllTag(fetchResult);
  };

  useEffect(() => {
    fetchAllTag();
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardStatus(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardStatus(false);
      setFocusedInput(null);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    //compositionuriが設定されたらアップロードの準備をする関数を呼び出すエフェクト(これがないと非同期でキャプチャする前にアップロードしようとしてフリーズする)
    if (compositionuri != null) {
      //初回実行時には実行sinaiyouni
      uploadPost(); //アップロードする
    }
  }, [compositionuri]);

  const handleFocus = (inputName) => {
    setFocusedInput(inputName); // フォーカスされた入力フィールドを設定
  };

  const handleBlur = () => {
    setFocusedInput(null); // フォーカスが外れたらリセット
  };

  const addTag = (tagId) => {
    if (selectedTag.includes(tagId)) {
      deleteTag(tagId);
    } else {
      if (selectedTag.length <= 4) {
        setSelectedTag((tag) => [...tag, tagId]);
      }
    }
  };

  const deleteTag = (tagId) => {
    setSelectedTag((tag) => tag.filter((item) => item !== tagId));
  };

  const Getcompositionuri = async () => {
    //合成写真をキャプチャする関数
    const compositionuri = await viewRef.current.capture(); //viewRefをキャプチャする
    setCompositionuri(compositionuri); //uriを保存
  };

  const handleAddTagPress = () => {
    // Followerテキストが押されたときにフォロワーモーダルを表示
    setIsTagModalVisible(true);
  };

  const handleCloseTagModal = () => {
    // フォローモーダルを閉じる
    setIsTagModalVisible(false);
  };

  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      {isLoading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#F2F5C8",
          }}
        >
          <ActivityIndicator size="large" color="#239D60" />
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            アップロード中...
          </Text>
        </View>
      ) : (
        <View style={styles.container}>
          <ViewShot
            ref={viewRef}
            options={{ format: "jpg", quality: 1 }}
            style={styles.imageContainer}
          >
            <Image source={{ uri: imageUri }} style={styles.fullImage} />
            {/* 左上 */}
            {topLeftdirection == "true" && (
              <View style={styles.modalButtonTopLeft}>
                <Image
                  source={{ uri: Composition }}
                  style={styles.topLeftDisplay}
                />
              </View>
            )}
            {/* 左下 */}
            {bottomLeftdirection == "true" && (
              <View style={styles.modalButtonBottomLeft}>
                <Image
                  source={{ uri: Composition }}
                  style={styles.bottomLeftDisplay}
                />
              </View>
            )}
            {/* 右上 */}
            {topRightdirection == "true" && (
              <View style={styles.modalButtonTopRight}>
                <Image
                  source={{ uri: Composition }}
                  style={styles.topRightDisplay}
                />
              </View>
            )}
            {/* 右下 */}
            {bottomRightdirection == "true" && (
              <View style={styles.modalButtonBottomRight}>
                <Image
                  source={{ uri: Composition }}
                  style={styles.bottomRightDisplay}
                />
              </View>
            )}
            {/* 左左 */}
            {leftFirstdirection == "true" && (
              <View style={styles.modalButtonLeftFirstQuarter}>
                <Image
                  source={{ uri: Composition }}
                  style={styles.LeftFirstQuarterDisplay}
                />
              </View>
            )}
            {/* 左右 */}
            {leftSeconddirection == "true" && (
              <View style={styles.modalButtonLeftSecondQuarter}>
                <Image
                  source={{ uri: Composition }}
                  style={styles.LeftSecondQuarterDisplay}
                />
              </View>
            )}
            {/* 右左 */}
            {rightThirddirection == "true" && (
              <View style={styles.modalButtonRightThirdQuarter}>
                <Image
                  source={{ uri: Composition }}
                  style={styles.RightThirdQuarterDisplay}
                />
              </View>
            )}
            {/* 右右 */}
            {rightFourthdirection == "true" && (
              <View style={styles.modalButtonRightFourthQuarter}>
                <Image
                  source={{ uri: Composition }}
                  style={styles.RightFourthQuarterDisplay}
                />
              </View>
            )}
            {/* 上上 */}
            {topFirstdirection == "true" && (
              <View style={styles.modalButtonTopFirstQuarter}>
                <Image
                  source={{ uri: Composition }}
                  style={styles.TopFirstQuarterDisplay}
                />
              </View>
            )}
            {/* 上下 */}
            {topSeconddirection == "true" && (
              <View style={styles.modalButtonTopSecondQuarter}>
                <Image
                  source={{ uri: Composition }}
                  style={styles.TopSecondQuarterDisplay}
                />
              </View>
            )}
            {/* 下上 */}
            {topThirddirection == "true" && (
              <View style={styles.modalButtonTopThirdQuarter}>
                <Image
                  source={{ uri: Composition }}
                  style={styles.TopThirdQuarterDisplay}
                />
              </View>
            )}
            {/* 下下 */}
            {topFourthdirection == "true" && (
              <View style={styles.modalButtonTopFourthQuarter}>
                <Image
                  source={{ uri: Composition }}
                  style={styles.TopFourthQuarterDisplay}
                />
              </View>
            )}
          </ViewShot>
          {focusedInput !== "name" ? (
            <View>
              <Text style={styles.displayName}>投稿のコメント</Text>
              <TextInput
                style={styles.textInput}
                onFocus={() => handleFocus("post")}
                onBlur={handleBlur}
                onChangeText={setPost}
                value={post}
                placeholder="コメント"
              />
              <Text style={styles.noamllabel}>
                写真にコメントをつけて投稿できます
              </Text>
            </View>
          ) : null}
          <View>
            <View style={styles.rowContainer}>
              <Text style={styles.displayName}>タグ</Text>
              <TouchableOpacity
                style={[styles.addTag]}
                onPress={handleAddTagPress}
              >
                <Text>+</Text>
              </TouchableOpacity>
            </View>
            {selectedTag.length == 0 ? (
              <Text
                style={[
                  styles.selectedTagContainer,
                  { paddingTop: 10, paddingBottom: 4 },
                ]}
              >
                追加されたタグがありません
              </Text>
            ) : (
              <FlatList
                style={styles.selectedTagContainer}
                horizontal={true}
                data={selectedTag}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => {
                  return (
                    <TouchableOpacity style={styles.tagView}>
                      <Image
                        source={require("./../image/Tag.png")}
                        style={styles.TagButton}
                      />
                      <Text>{allTag.find((o) => o.tagId == item).tagName}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
            <View style={styles.tagBorder}></View>
          </View>
          <Pressable onPress={Getcompositionuri} style={styles.submit}>
            <Text style={styles.submitText}>アップロード</Text>
          </Pressable>

          <View style={styles.Back}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <Image
                source={require("./../image/Left_arrow.png")}
                style={styles.actionButton}
              />
            </TouchableOpacity>
          </View>
          <Modal
            animationType="fade"
            transparent={true}
            visible={isTagModalVisible}
            onRequestClose={handleCloseTagModal}
          >
            <View style={styles.overlayModal}>
              <View style={styles.modalContainer}>
                <Text>タグ</Text>
                {selectedTag.length == 0 ? (
                  <Text
                    style={[
                      styles.selectedTagContainer,
                      { paddingTop: 10, paddingBottom: 4 },
                    ]}
                  >
                    追加されたタグがありません
                  </Text>
                ) : (
                  <FlatList
                    style={styles.selectedTagContainer}
                    horizontal={true}
                    data={selectedTag}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => {
                      return (
                        <TouchableOpacity
                          style={styles.tagView}
                          onPress={() => {
                            deleteTag(item);
                          }}
                        >
                          <Image
                            source={require("./../image/Tag.png")}
                            style={styles.TagButton}
                          />
                          <Text>
                            {allTag.find((o) => o.tagId == item).tagName}
                          </Text>
                          <Image
                            source={require("./../image/Close.png")}
                            style={styles.TagButton}
                          />
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
                <View style={styles.tagBorder}></View>
                <Text style={styles.noamllabel}>
                  タグを４つまで選択できます
                </Text>
                <FlatList
                  style={styles.allTagContainer}
                  horizontal={false}
                  data={allTag}
                  keyExtractor={(item) => item.tagId}
                  numColumns={2}
                  columnWrapperStyle={{
                    justifyContent: "flex-start",
                    gap: 5,
                    margin: 5,
                  }}
                  renderItem={({ item }) => {
                    return (
                      <TouchableOpacity
                        style={styles.tagView}
                        onPress={() => addTag(item.tagId)}
                      >
                        <Image
                          source={require("./../image/Tag.png")}
                          style={styles.TagButton}
                        />
                        <Text>{item.tagName}</Text>
                      </TouchableOpacity>
                    );
                  }}
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleCloseTagModal}
                >
                  <Text style={styles.buttonText}>閉じる</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F2F5C8",
    padding: 20,
    flex: 1,
  },
  imageContainer: {
    width: imageWidth,
    height: imageHeight,
    alignSelf: "center",
    marginTop: 20,
  },
  fullImage: {
    width: imageWidth,
    height: imageHeight,
  },
  displayName: {
    fontSize: 15,
    marginTop: 10,
    marginLeft: 10,
    textAlign: "left",
    alignItems: "flex-start",
    fontWeight: "300",
  },
  textInput: {
    margin: 5,
    marginTop: 0,
    marginBottom: 0,
    fontSize: 20,
    height: 40,
    borderBottomWidth: 3,
    borderColor: "#239D60",
    marginVertical: 16,
    color: "black",
    fontWeight: "300",
  },
  submit: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#239D60",
    height: 50,
    margin: 10, // ボタン間にスペースを追加
  },
  submitText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f2f2f2",
    textAlign: "center",
  },
  noamllabel: {
    fontSize: 15,
    margin: 5,
    fontWeight: "600",
    color: "#239D60",
    textAlign: "center",
  },
  TagButton: {
    width: 20,
    height: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
  },
  modalButtonTopLeft: {
    position: "absolute",
    width: "50%",
    height: "50%",
    overflow: "hidden",
  },
  modalButtonTopRight: {
    position: "absolute",
    width: "50%",
    height: "50%",
    overflow: "hidden",
    left: "50%",
  },
  modalButtonBottomLeft: {
    position: "absolute",
    width: "50%",
    height: "50%",
    overflow: "hidden",
    top: "50%",
  },
  modalButtonBottomRight: {
    position: "absolute",
    width: "50%",
    height: "50%",
    overflow: "hidden",
    top: "50%",
    left: "50%",
  },
  modalButtonLeftFirstQuarter: {
    position: "absolute",
    width: "25%",
    height: "100%",
    overflow: "hidden",
  },
  modalButtonLeftSecondQuarter: {
    position: "absolute",
    width: "25%",
    height: "100%",
    overflow: "hidden",
    left: "25%",
  },
  modalButtonRightThirdQuarter: {
    position: "absolute",
    width: "25%",
    height: "100%",
    overflow: "hidden",
    left: "50%",
  },
  modalButtonRightFourthQuarter: {
    position: "absolute",
    width: "25%",
    height: "100%",
    overflow: "hidden",
    left: "75%",
  },
  modalButtonTopFirstQuarter: {
    position: "absolute",
    width: "100%",
    height: "25%",
    overflow: "hidden",
  },
  modalButtonTopSecondQuarter: {
    position: "absolute",
    width: "100%",
    height: "25%",
    overflow: "hidden",
    top: "25%",
  },
  modalButtonTopThirdQuarter: {
    position: "absolute",
    width: "100%",
    height: "25%",
    overflow: "hidden",
    top: "50%",
  },
  modalButtonTopFourthQuarter: {
    position: "absolute",
    width: "100%",
    height: "25%",
    overflow: "hidden",
    top: "75%",
  },
  topLeftDisplay: {
    width: imageWidth,
    height: imageHeight,
  },
  topRightDisplay: {
    width: imageWidth,
    height: imageHeight,
    transform: [{ translateX: -imageWidth / 2 }],
  },
  bottomLeftDisplay: {
    width: imageWidth,
    height: imageHeight,
    transform: [{ translateY: -imageHeight / 2 }],
  },
  bottomRightDisplay: {
    width: imageWidth,
    height: imageHeight,
    transform: [
      { translateX: -imageWidth / 2 },
      { translateY: -imageHeight / 2 },
    ],
  },
  LeftFirstQuarterDisplay: {
    width: imageWidth,
    height: imageHeight,
  },
  LeftSecondQuarterDisplay: {
    width: imageWidth,
    height: imageHeight,
    transform: [{ translateX: -imageWidth / 4 }],
  },
  RightThirdQuarterDisplay: {
    width: imageWidth,
    height: imageHeight,
    transform: [{ translateX: -imageWidth / 2 }],
  },
  RightFourthQuarterDisplay: {
    width: imageWidth,
    height: imageHeight,
    transform: [{ translateX: (-imageWidth / 4) * 3 }],
  },
  TopFirstQuarterDisplay: {
    width: imageWidth,
    height: imageHeight,
  },
  TopSecondQuarterDisplay: {
    width: imageWidth,
    height: imageHeight,
    transform: [{ translateY: -imageHeight / 4 }],
  },
  TopThirdQuarterDisplay: {
    width: imageWidth,
    height: imageHeight,
    transform: [{ translateY: -imageHeight / 2 }],
  },
  TopFourthQuarterDisplay: {
    width: imageWidth,
    height: imageHeight,
    transform: [{ translateY: (-imageHeight / 4) * 3 }],
  },
  tagView: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderRadius: 20,
    borderColor: "#239D60",
    flexDirection: "row",
    gap: 5,
    marginHorizontal: 2,
    backgroundColor: "#F2F5C8",
  },
  selectedTagView: {
    marginHorizontal: 2,
    width: width / 3.5,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  selectedTagContainer: {
    margin: 5,
  },
  tagBorder: {
    margin: 5,
    marginTop: 0,
    marginBottom: 0,
    borderBottomWidth: 3,
    borderColor: "#239D60",
    marginVertical: 16,
  },
  allTagContainer: {
    // height: height * 0.4,
  },
  actionButton: {
    width: 30,
    height: 30,
    padding: 5,
    margin: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
  },
  backButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    width: 70,
    height: 70,
    marginTop: 3, // ボタン間にスペースを追加
  },
  Back: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  overlayModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#F2F5C8",
    padding: 15,
  },
  button: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#A3DE83",
    height: 50,
  },
  buttonText: {
    fontSize: 18,
    color: "#000000",
    textAlign: "center",
    fontWeight: "300",
  },
  rowContainer: {
    justifyContent: "flex-start",
    gap: 5,
  },
  addTag: {
    width: "10%",
    borderWidth: 2,
    borderRadius: 15,
    borderColor: "#239D60",
    backgroundColor: "#F2F5C8",
    justifyContent: "center",
    alignItems: "center",
  },
});
