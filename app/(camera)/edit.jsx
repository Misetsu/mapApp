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
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import storage from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";
import Icon from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
const imageWidth = width * 0.4;
const imageHeight = (imageWidth * 4) / 3;
const auth = FirebaseAuth();

export default function edit() {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // ローカルストレージから設定を確認
    const checkAlertSetting = async () => {
      const alertSetting = await AsyncStorage.getItem("showWarning");
      if (alertSetting === null || alertSetting === "true") {
        setShowAlert(true);
      }
    };
    checkAlertSetting();
  }, []);

  const handleAlert = async () => {
    // アラート表示
    Alert.alert(
      "投稿に関する注意事項",
      `- 投稿は自己責任で行ってください。\n- 他人が不快になる内容や、法令・権利を侵害する内容は禁止です。\n- 人物が映る写真は、事前に本人の了承を得てください。\n- 投稿内容は管理者確認後に掲載される場合があります。\n管理者が不適切と判断した場合、投稿は掲載されない場合があります。`,
      [
        {
          text: "今後表示しない",
          onPress: async () => {
            await AsyncStorage.setItem("showWarning", "false");
            setShowAlert(false);
          },
        },
        {
          text: "OK",
          onPress: async () => {
            await AsyncStorage.setItem("showWarning", "true");
            setShowAlert(false);
          },
        },
      ],
      { cancelable: false }
    );
  };

  useEffect(() => {
    if (showAlert) {
      handleAlert();
    }
  }, [showAlert]);

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

  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };
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
          style={styles.container}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            アップロード中...
          </Text>
        </View>
      ) : (
        <View
          style={styles.container}>
          <Text style={styles.pagetitle}>場所名</Text>
          <Image source={{ uri: imageUri }} style={styles.imageContainer} />
          {spotId == 0 && focusedInput !== "post" ? (
            <View>
              <Text style={styles.displayName}>場所の名前</Text>
              <TextInput
                style={styles.textInput}
                maxLength={30}
                onFocus={() => handleFocus("name")}
                onBlur={handleBlur}
                onChangeText={setText}
                value={text}
                placeholder="場所の名前"
              />
              <Text style={styles.noamllabel}>
                場所{"(ピン)"}の名前を入力してください
              </Text>
            </View>
          ) : null}
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
          <View style={styles.tagContainer}>
            <Text style={styles.displayName}>タグ</Text>
            {selectedTag.length == 0 ? (
              <Text style={[styles.selectedTagContainer, { paddingTop: 10, paddingBottom: 4, }]}>
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
                      <Icon name="tag" size={16} color={"#239D60"} />
                      <Text>{allTag.find((o) => o.tagId == item).tagName}</Text>
                      <Icon name="times-circle" size={16} />
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
                    <Icon name="tag" size={16} color={"#239D60"} />
                    <Text>{item.tagName}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
          <Pressable onPress={uploadPost} style={styles.submit}>
            <Text style={styles.submitText}>
              アップロード
            </Text>
          </Pressable>

          <View style={styles.Back}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Icon name="angle-left" size={24} color="#000" />
            </TouchableOpacity>
          </View>
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
  pagetitle: {
    fontSize: 30,
    height: 50,
    marginTop: 0,
    textAlign: "center",
    fontWeight: "300",
    color: "#000000",
  },
  imageContainer: {
    width: imageWidth,
    height: imageHeight,
    alignSelf: "center",
    marginTop: 5,
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
  tagView: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderRadius: 20,
    borderColor: "#239D60",
    flexDirection: "row",
    gap: 5,
    marginHorizontal: 2,
    backgroundColor: "#f2f5c8",
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
    height: height * 0.2,
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
});
