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
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import storage from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";
import Icon from "react-native-vector-icons/FontAwesome5";

const { width, height } = Dimensions.get("window");
const imageWidth = width * 0.4;
const imageHeight = (imageWidth * 4) / 3;
const auth = FirebaseAuth();

export default function edit() {
  const [text, setText] = useState("");
  const [post, setPost] = useState("");
  const [focusedInput, setFocusedInput] = useState(null);
  const [keyboardStatus, setKeyboardStatus] = useState(false);
  const [isLoading, setIsoading] = useState(false);
  const [allTag, setAllTag] = useState([]);
  const [selectedTag, setSelectedTag] = useState([]);

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
          timeStamp: currentTime,
        })
        .catch((error) => console.log(error));

      await firestore()
        .collection("post")
        .add({
          id: maxPostId,
          imagePath: imagePath,
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

      for (const tag of selectedTag) {
        await firestore()
          .collection("tagPost")
          .add({
            tagId: parseInt(tag),
            postId: maxPostId,
            spotId: maxId,
          });
      }

      await firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .update({
          spotCreate: parseInt(spotNo),
          spotPoint: parseInt(point),
          lastPostAt: currentTime,
        });

      handleVisitState(maxId);
    } else {
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

      for (const tag of selectedTag) {
        await firestore()
          .collection("tagPost")
          .add({
            tagId: parseInt(tag),
            postId: maxPostId,
            spotId: parseInt(spotId),
          });
      }

      await firestore().collection("users").doc(auth.currentUser.uid).update({
        lastPostAt: currentTime,
      });

      handleVisitState(parseInt(spotId));
    }

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
          <View style={styles.tagContainer}>
            <Text>タグ：</Text>
            {selectedTag.length == 0 ? (
              <Text style={styles.selectedTagContainer}>
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
                      style={styles.selectedTagView}
                      onPress={() => {
                        deleteTag(item);
                      }}
                    >
                      <Text>{allTag.find((o) => o.tagId == item).tagName}</Text>
                      <Icon name="times-circle" size={16} />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
            <View style={styles.tagBorder}></View>
            <Text style={{ fontSize: 12, marginBottom: 10 }}>
              タグを4つまで選択できます
            </Text>
            <FlatList
              style={styles.allTagContainer}
              horizontal={false}
              data={allTag}
              keyExtractor={(item) => item.tagId}
              numColumns={2}
              columnWrapperStyle={{
                justifyContent: "flex-start",
                gap: 10,
                marginBottom: 5,
              }}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={styles.tagView}
                    onPress={() => addTag(item.tagId)}
                  >
                    <Icon name="tag" size={16} />
                    <Text>{item.tagName}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
          <Pressable onPress={uploadPost} style={styles.uploadButton}>
            <Text
              style={{ color: "white", textAlign: "center", marginTop: 25 }}
            >
              Upload
            </Text>
          </Pressable>
        </View>
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
    marginBottom: 5,
    marginLeft: 25,
    textAlign: "left",
    alignItems: "flex-start",
    fontWeight: "300",
  },
  textbox: {
    height: 30,
    borderBottomWidth: 2,
    color: "black",
    fontWeight: "300",
    paddingHorizontal: 10,
    width: "80%",
    marginHorizontal: 25,
    backgroundColor: "#fbfbfb",
  },
  focusedTextbox: {
    position: "absolute",
    width: "80%", // 画面幅の90%
    marginHorizontal: 25,
    height: 30,
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
  tagView: {
    width: width / 3,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
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
  tagContainer: {
    paddingHorizontal: 25,
    marginTop: 20,
  },
  selectedTagContainer: {
    marginTop: 10,
  },
  tagBorder: {
    width: "100%",
    borderBottomWidth: 2,
    marginVertical: 10,
  },
  allTagContainer: {
    height: height * 0.2,
  },
});
