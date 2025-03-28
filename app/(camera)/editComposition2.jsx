import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  Keyboard,
  Image as RNImage,
} from "react-native";
import ViewShot from "react-native-view-shot";
import { useLocalSearchParams, useRouter } from "expo-router";
import storage from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";
import Svg, { Image, ClipPath, Rect } from "react-native-svg";
import RNEXIF from "react-native-exif";
import ImageResizer from "react-native-image-resizer";

const { width } = Dimensions.get("window");
const imageWidth = width * 0.75;
const imageHeight = (imageWidth * 4) / 3;
const auth = FirebaseAuth();

export default function edit() {
  const [text, setText] = useState("");
  const [post, setPost] = useState("");
  const [compositionuri, setCompositionuri] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);
  const [keyboardStatus, setKeyboardStatus] = useState(false);
  const [isLoading, setIsoading] = useState(false);

  const reference = storage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { imageUri, latitude, longitude, spotId, Composition } = params;
  const [tests, settest] = useState(imageUri);
  const [tests2, settest2] = useState(Composition);
  const viewRef = useRef();

  const resizeImage = async (uri, uri2, rotation) => {
    try {
      const newImage = await ImageResizer.createResizedImage(
        uri,
        3000,
        4000,
        "JPEG",
        100,
        0
      );

      const newImage2 = await ImageResizer.createResizedImage(
        uri2,
        4000,
        3000,
        "JPEG",
        100,
        rotation
      );
      settest(newImage.uri); // 新しいURIを返す
      settest2(newImage2.uri); // 新しいURIを返す
    } catch (error) {
      console.error(error);
    }
  };

  const uploadPost = async () => {
    setIsoading(true);
    const currentTime = new Date().toISOString();

    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const imagePath = "photo/" + new Date().getTime().toString() + randomNumber;
    try {
      await reference.ref(imagePath).putFile(compositionuri);
    } catch (error) {
      console.error("Error uploading image:", error);
    }

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
        likecount: 0
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

    handleVisitState(spotId);

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
    //compositionuriが設定されたらアップロードの準備をする関数を呼び出すエフェクト(これがないと非同期でキャプチャする前にアップロードしようとしてフリーズする)
    if (compositionuri != null) {
      //初回実行時には実行sinaiyouni
      uploadPost(); //アップロードする
    }
  }, [compositionuri]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardStatus(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardStatus(false);
      setFocusedInput(null);
    });
    RNEXIF.getExif(imageUri)
      .then((exifData) => {
        if (exifData && exifData.Orientation) {
          const orientationValue = exifData.Orientation;
          if (orientationValue === 1 || orientationValue === 3) {
            RNImage.getSize(
              Composition,
              (width, height) => {
                if (
                  width > height ||
                  (width == 844 && height == 1125) ||
                  (width == 810 && height == 1080)
                ) {
                  resizeImage(imageUri, Composition, 0);
                } else if (height > width) {
                  resizeImage(imageUri, Composition, 90);
                } else {
                }
              },
              (error) => {
                console.error("Failed to get image size:", error);
              }
            );
          } else {
            RNImage.getSize(
              Composition,
              (width, height) => {
                if (
                  width > height ||
                  (width == 844 && height == 1125) ||
                  (width == 810 && height == 1080)
                ) {
                  resizeImage(imageUri, Composition, 0);
                } else if (height > width) {
                  resizeImage(imageUri, Composition, 90);
                } else {
                }
              },
              (error) => {
                console.error("Failed to get image size:", error);
              }
            );
          }
        }
      })
      .catch((error) => console.log("Error getting EXIF data:", error));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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
          <ViewShot
            ref={viewRef}
            options={{ format: "jpg", quality: 1 }}
            style={styles.imageContainer}
          >
            <Svg height="100%" width="100%">
              {/* 画像1の左半分 */}
              <ClipPath id="clipLeft">
                <Rect
                  x="0%"
                  y="0%"
                  width={imageWidth / 2}
                  height={imageHeight}
                  fill="blue"
                />
              </ClipPath>
              <Image
                href={{ uri: tests2 }} // 画像1のURL
                width="300"
                height="400"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#clipLeft)"
                onLoad={(event) => {}}
                onError={(error) => console.log("Error loading image:", error)}
              />

              {/* 画像2の右半分 */}
              <ClipPath id="clipRight">
                <Rect
                  x="50%"
                  y="0%"
                  width={imageWidth / 2}
                  height={imageHeight}
                  fill="blue"
                />
              </ClipPath>
              <Image
                href={{ uri: tests }} // 画像2のURL
                width="300"
                height="400"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#clipRight)"
                resizeMode="cover"
                onLoad={(event) => {}}
                onError={(error) => console.log("Error loading image:", error)}
              />
            </Svg>
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
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: imageWidth,
    height: imageHeight,
    alignItems: "center",
    marginTop: 20,
    marginLeft: "auto",
    marginRight: "auto",
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
});
