import React, { useState, useEffect } from "react";
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

  const reference = storage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { imageUri, latitude, longitude, spotId, point, spotNo } = params;

  const uploadPost = async () => {
    setIsoading(true);

    const currentTime = new Date().toISOString();

    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const imagePath = "photo/" + new Date().getTime().toString() + randomNumber;

    await reference.ref(imagePath).putFile(imageUri);

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
          spotId: maxId,
          userId: auth.currentUser.uid,
        })
        .catch((error) => console.log(error));

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
        spotCreate: spotNo,
        spotPoint: point,
        lastPostAt: currentTime,
      });
    } else {
      const querySpot = await firestore()
        .collection("spot")
        .where("id", "==", parseInt(spotId))
        .get();

      const spotDocId = querySpot.docs[0].ref._documentPath._parts[1];

      console.log(spotDocId);

      await firestore().collection("spot").doc(spotDocId).update({
        lastUpdateAt: currentTime,
      });

      const queryPost = await firestore()
        .collection("post")
        .orderBy("id", "desc")
        .get();

      const maxPostId = queryPost.docs[0].data().id + 1;

      console.log("a");

      await firestore()
        .collection("photo")
        .add({
          imagePath: imagePath,
          postId: maxPostId,
          spotId: parseInt(spotId),
          userId: auth.currentUser.uid,
        })
        .catch((error) => console.log(error));

      await firestore()
        .collection("post")
        .add({
          id: maxPostId,
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
    }

    setIsoading(false);
    router.replace("/");
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

  const handleFocus = (inputName) => {
    setFocusedInput(inputName); // フォーカスされた入力フィールドを設定
  };

  const handleBlur = () => {
    setFocusedInput(null); // フォーカスが外れたらリセット
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
            <Image source={{ uri: imageUri }} style={styles.imageContainer} />
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
            <Pressable onPress={uploadPost} style={styles.uploadButton}>
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
