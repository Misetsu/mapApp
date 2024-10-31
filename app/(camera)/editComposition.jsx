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
  console.log("imageuri=", imageUri);
  console.log("Composition=", Composition);

  const [orientation, setOrientation] = useState("");

  const resizeImage = async (uri, uri2, rotation) => {
    try {
      const newImage = await ImageResizer.createResizedImage(
        uri,
        4000,
        3000,
        "JPEG",
        100,
        0
      );

      const newImage2 = await ImageResizer.createResizedImage(
        uri2,
        3000,
        4000,
        "JPEG",
        100,
        rotation
      );
      console.log("リサイズされた画像のURI:", newImage.uri);
      settest(newImage.uri); // 新しいURIを返す
      console.log("リサイズされた画像のURI:", newImage2.uri);
      settest2(newImage2.uri); // 新しいURIを返す
    } catch (error) {
      console.error(error);
    }
  };

  const uploadPost = async () => {
    setIsoading(true);
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const imagePath =
      "photo/image-" + new Date().getTime().toString() + randomNumber;
    console.log(compositionuri);
    try {
      await reference.ref(imagePath).putFile(compositionuri);
      console.log("Image uploaded successfully.");
    } catch (error) {
      console.error("Error uploading image:", error);
    }

    if (spotId == 0) {
      const querySnapshot = await firestore()
        .collection("spot")
        .orderBy("id", "desc")
        .get();

      const maxId = querySnapshot.docs[0].data().id + 1;

      await firestore().collection("spot").add({
        id: maxId,
        mapLatitude: latitude,
        mapLongitude: longitude,
        name: text,
        areaRadius: 50,
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
          spotId: maxId,
          userId: auth.currentUser.uid,
        })
        .catch((error) => console.log(error));

      const currentTime = new Date().toISOString();

      await firestore()
        .collection("post")
        .add({
          id: maxPostId,
          postTxt: post,
          spotId: maxId,
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
    } else {
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
        })
        .catch((error) => console.log(error));

      const currentTime = new Date().toISOString();

      await firestore()
        .collection("post")
        .add({
          id: maxPostId,
          postTxt: post,
          spotId: parseInt(spotId),
          userId: auth.currentUser.uid,
          timeStamp: currentTime,
        })
        .then()
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
    }

    setIsoading(false);
    router.replace("/");
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
          console.log(orientationValue);
          if (orientationValue === 1 || orientationValue === 3) {
            RNImage.getSize(
              Composition,
              (width, height) => {
                console.log(width);
                if (
                  width > height ||
                  (width == 844 && height == 1125) ||
                  (width == 810 && height == 1080)
                ) {
                  console.log("This is a landscape (横向き) image.");
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
                console.log(width, height);
                if (
                  width > height ||
                  (width == 844 && height == 1125) ||
                  (width == 810 && height == 1080)
                ) {
                  console.log("This is a landscape (横向き) image.");
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
                onLoad={(event) => {
                  console.log("画像１＝", tests);
                }}
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
                onLoad={(event) => {
                  console.log("画像２＝", tests2);
                }}
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
