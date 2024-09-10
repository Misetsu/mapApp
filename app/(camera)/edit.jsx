import React, { useState, useRef } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import storage from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";

const { width } = Dimensions.get("window");
const imageWidth = width * 0.75;
const imageHeight = (imageWidth * 4) / 3;
const auth = FirebaseAuth();

export default function Test() {
  const [text, setText] = useState("");
  const [post, setPost] = useState("");
  const [focusedInput, setFocusedInput] = useState(null); // フォーカスされた入力フィールドを管理

  const reference = storage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { imageUri, latitude, longitude, spotId } = params;

  const uploadPost = async () => {
    if (!auth.currentUser) {
      console.log("User is not logged in.");
      return;
    }

    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const imagePath =
      "photo/image-" + new Date().getTime().toString() + randomNumber;

    await reference.ref(imagePath).putFile(imageUri);

    if (spotId == 0) {
      const querySnapshot = await firestore()
        .collection("spot")
        .orderBy("id", "desc")
        .get();

      if (querySnapshot.docs.length > 0) {
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

        if (queryPost.docs.length > 0) {
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
            })
            .catch((error) => console.log(error));
        } else {
          console.log("No documents found in 'post' collection.");
        }
      } else {
        console.log("No documents found in 'spot' collection.");
      }
    } else {
      await firestore()
        .collection("photo")
        .add({
          imagePath: imagePath,
          spotId: parseInt(spotId),
          userId: auth.currentUser.uid,
        })
        .catch((error) => console.log(error));

      await firestore()
        .collection("post")
        .add({
          postTxt: post,
          spotId: parseInt(spotId),
          userId: auth.currentUser.uid,
        })
        .catch((error) => console.log(error));
    }

    router.replace("/");
  };

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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1 }}>
          <Image source={{ uri: imageUri }} style={styles.imageContainer} />
          {spotId == 0 && focusedInput !== "post" ? (
            <TextInput
              style={focusedInput === "name" ? styles.focusedTextbox : styles.textbox}
              placeholder="場所の名前を入力"
              maxLength={30}
              onFocus={() => handleFocus("name")}
              onBlur={handleBlur}
              onChangeText={setText}
              value={text}
            />
          ) : null}
          {focusedInput !== "name" ? (
            <TextInput
              style={focusedInput === "post" ? styles.focusedTextbox : styles.textbox}
              placeholder="投稿の文章を入力"
              onFocus={() => handleFocus("post")}
              onBlur={handleBlur}
              onChangeText={setPost}
              value={post}
            />
          ) : null}
          <Pressable onPress={uploadPost} style={styles.uploadButton}>
            <Text style={{ color: "white", textAlign: "center", marginTop: 25 }}>
              Upload
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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
  textbox: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 20,
    paddingHorizontal: 10,
    width: width * 0.6,
    marginLeft: 25,
    marginTop: 25,
  },
  focusedTextbox: {
    position: "absolute",
    top: 0, // 画像の上に表示させるため、topを0に設定
    width: width * 0.9, // 画面幅の90%
    left: width * 0.05, // 画面幅の5%の余白を両側に追加
    height: 50,
    backgroundColor: "white", // 背景色を白に設定
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
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
