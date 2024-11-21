import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  Keyboard,
} from "react-native";
import ViewShot from "react-native-view-shot";
import { useLocalSearchParams, useRouter } from "expo-router";
import storage from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";

const { width } = Dimensions.get("window");
const imageWidth = width * 0.75;
const imageHeight = (imageWidth * 4) / 3;
const auth = FirebaseAuth();

export default function edit() {
  const [text, setText] = useState("");
  const [post, setPost] = useState("");
  const [focusedInput, setFocusedInput] = useState(null);
  const [keyboardStatus, setKeyboardStatus] = useState(false);
  const [isLoading, setIsoading] = useState(false);
  const [compositionuri, setCompositionuri] = useState(null);

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
      })
      .catch((error) => console.log(error));

    await firestore()
      .collection("like")
      .add({
        count: 0,
        postId: maxPostId,
      })
      .catch((error) => console.log(error));

    await firestore().collection("users").doc(auth.currentUser.uid).update({
      lastPostAt: currentTime,
    });

    handleVisitState(parseInt(spotId));

    setIsoading(false);
    router.replace("/");
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

  useEffect(() => {
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

  const Getcompositionuri = async () => {
    //合成写真をキャプチャする関数
    const compositionuri = await viewRef.current.capture(); //viewRefをキャプチャする
    setCompositionuri(compositionuri); //uriを保存
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      {isLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            アップロード中...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1 }}>
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
            </ViewShot>
            {spotId == 0 && focusedInput !== "post" ? (
              <View>
                <Text style={styles.displayName}>場所の名前を入力</Text>
                <TextInput
                  style={
                    focusedInput === "name" && keyboardStatus
                      ? styles.focusedTextbox
                      : styles.textbox
                  }
                  maxLength={30}
                  onFocus={() => handleFocus("name")}
                  onBlur={handleBlur}
                  onChangeText={setText}
                  value={text}
                />
              </View>
            ) : null}
            {focusedInput !== "name" ? (
              <View>
                <Text style={styles.displayName}>投稿の文章を入力</Text>
                <TextInput
                  style={
                    focusedInput === "post" && keyboardStatus
                      ? styles.focusedTextbox
                      : styles.textbox
                  }
                  onFocus={() => handleFocus("post")}
                  onBlur={handleBlur}
                  onChangeText={setPost}
                  value={post}
                />
              </View>
            ) : null}
            <Pressable onPress={Getcompositionuri} style={styles.uploadButton}>
              <Text
                style={{ color: "white", textAlign: "center", marginTop: 25 }}
              >
                Upload
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 25,
    textAlign: "left",
    alignItems: "flex-start",
    fontWeight: "300",
  },
  textbox: {
    height: 40,
    borderBottomWidth: 2,
    color: "black",
    fontWeight: "300",
    paddingHorizontal: 10,
    width: width * 0.6,
    marginLeft: 25,
    backgroundColor: "#fbfbfb",
  },
  focusedTextbox: {
    position: "absolute",
    top: 10, // 画像の上に表示させるため、topを0に設定
    width: width * 0.9, // 画面幅の90%
    marginLeft: 25,
    height: 40,
    borderBottomWidth: 2,
    color: "black",
    fontWeight: "300",
    paddingHorizontal: 10,
    backgroundColor: "#fbfbfb",
    zIndex: 10, // 画像の上に表示するためにzIndexを指定
  },
  uploadButton: {
    position: "absolute",
    alignSelf: "center",
    bottom: 50,
    right: 20,
    width: 75,
    height: 75,
    backgroundColor: "red",
    borderRadius: 75,
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
});
