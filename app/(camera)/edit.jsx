import {
  View,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
} from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import storage from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";

//画像のサイズを固定
const { width } = Dimensions.get("window");
const imageWidth = width * 0.75; // 画面幅の75%
const imageHeight = (imageWidth * 4) / 3; // 3:4のアスペクト比を維持

export default function test() {
  const [text, setText] = useState(""); // テキスト入力を保持するための状態
  const [post, setPost] = useState("");
  const reference = storage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { imageUri, latitude, longitude, spotId } = params;

  const uploadPhoto = async () => {
    // 写真をstorageに格納
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const imagePath =
      "photo/image-" + new Date().getTime().toString() + randomNumber;
    await reference.ref(imagePath).putFile(imageUri);

    // メイン画面の投稿であれば、現在地のスポットを追加
    if (spotId == 0) {
      const querySnapshot = await firestore()
        .collection("spot")
        .orderBy("id", "desc")
        .get();

      const maxId = querySnapshot.docs[0].data().id + 1;

      firestore().collection("spot").add({
        id: maxId,
        mapLatitude: latitude,
        mapLongitude: longitude,
        name: text,
        areaRadius: 50,
      });

      firestore()
        .collection("photo")
        .add({
          imagePath: imagePath,
          spotId: maxId,
          userId: 1,
        })
        .then()
        .catch((error) => console.log(error));

      firestore()
        .collection("post")
        .add({
          postTxt: post,
          spotId: maxId,
          userId: 1,
        })
        .then()
        .catch((error) => console.log(error));
    } else {
      console.log(imagePath, spotId);
      firestore()
        .collection("photo")
        .add({
          imagePath: imagePath,
          spotId: parseInt(spotId),
          userId: 1,
        })
        .then()
        .catch((error) => console.log(error));

      firestore()
        .collection("post")
        .add({
          postTxt: post,
          spotId: parseInt(spotId),
          userId: 1,
        })
        .then()
        .catch((error) => console.log(error));
    }

    router.replace({ pathname: "/" });
  };

  return (
    <View style={{ flex: 1 }}>
      <Image source={{ uri: imageUri }} style={styles.imageContainer} />
      {spotId == 0 ? (
        <TextInput
          style={styles.textbox}
          placeholder="場所の名前を入力"
          maxLength={30} // 文字数制限を30文字に設定
          onChangeText={setText}
          value={text}
        />
      ) : (
        <></>
      )}
      <TextInput
        style={styles.textbox}
        placeholder="投稿の文章を入力"
        onChangeText={setPost}
        value={post}
      />
      <Pressable onPress={uploadPhoto} style={styles.uploadButton} />
    </View>
  );
}

//スタイル
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
    width: width * 0.6, // 画面幅の50%に設定
    marginLeft: 25, // 左寄せ
    marginTop: 25, // 上部の余白
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
