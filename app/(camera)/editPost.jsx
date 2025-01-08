import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Dimensions,
  StyleSheet,
  Text,
  Alert,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  FlatList, // ScrollViewからFlatListに変更
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import firestore, { FieldValue } from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";
import storage from "@react-native-firebase/storage";
import Toast from 'react-native-simple-toast';

const auth = FirebaseAuth();
const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する

const EditPostScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { postId } = params;
  const [photoUri, setPhotoUri] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [allTag, setAllTag] = useState([]);
  const [selectedTag, setSelectedTag] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleBackPress = () => {
    router.back();
  };

  if (!postId) {
    Alert.alert("エラー", "投稿IDが指定されていません。");
    return null;
  }

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

          const spotSnapshot = await firestore()
            .collection("spot")
            .where("id", "==", photoDoc.spotId)
            .get();

          let spotName = null;
          if (!spotSnapshot.empty) {
            spotName = spotSnapshot.docs[0].data().name;
          }

          setSelectedPost({
            ...photoDoc,
            postDetails,
            spotName,
          });
        }
      } else {
        setPhotoUri(null);
      }
    } catch (error) {
      console.error("データ取得中にエラーが発生しました: ", error);
    } finally {
      setLoading(false);
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

  const fetchSelectedTag = async () => {
    const fetchResult = [];
    try {
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
    } catch (error) {
      console.error("データ取得中にエラーが発生しました: ", error);
    }
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

  const fetchTag = async () => {
    await fetchSelectedTag();
    await fetchAllTag();
  };

  const handleSave = async () => {
    let batch = firestore().batch();

    await firestore()
      .collection("tagPost")
      .where("postId", "==", parseInt(postId))
      .get()
      .then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        return batch.commit();
      });

    for (const tag of selectedTag) {
      await firestore()
        .collection("tagPost")
        .add({
          tagId: parseInt(tag),
          postId: parseInt(postId),
          spotId: parseInt(selectedPost.postDetails.spotId),
          timeStamp: selectedPost.postDetails.timeStamp,
        });
    }
    router.back();
    Toast.show("編集内容を保存しました");
  };

  useEffect(() => {
    fetchData();
    fetchTag();
  }, []);

  return (
    <View>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : (
          <>
            {selectedPost && (
              <>
                <Text style={styles.pagetitle}>投稿編集</Text>

                <View style={styles.contentContainer}>
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: photoUri }} style={styles.image} />
                  </View>

                  <View style={styles.postDetails}>
                    <Text style={styles.displayName}>
                      投稿スポット：{selectedPost.spotName}
                    </Text>
                  </View>

                  <View style={styles.postDetails}>
                    <Text style={styles.displayName}>
                      {selectedPost.postDetails.postTxt != ""
                        ? selectedPost.postDetails.postTxt
                        : "詳細がありません"}
                    </Text>
                  </View>
                  <View style={styles.postDetails}>
                    <Text style={styles.displayName}>タグ</Text>
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
                              style={styles.selectedTagView}
                              onPress={() => {
                                deleteTag(item);
                              }}
                            ><Image
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
                        gap: 10,
                        marginBottom: 5,
                      }}
                      renderItem={({ item }) => {
                        return (
                          <TouchableOpacity
                            style={styles.tagView}
                            onPress={() => addTag(item.tagId)}
                          ><Image
                              source={require("./../image/Tag.png")}
                              style={styles.TagButton}
                            />
                            <Text>{item.tagName}</Text>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                </View>
                <TouchableOpacity style={styles.submit} onPress={handleSave}>
                  <Text style={styles.submitText}>保存</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}<View style={styles.Back}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Image
              source={require("./../image/Left_arrow.png")}
              style={styles.actionButton}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    height: height,
    backgroundColor: "#F2F5C8",
  },
  pagetitle: {
    fontSize: 24,
    height: 30,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "300",
    color: "#000000",
  },
  noamllabel: {
    fontSize: 15,
    margin: 5,
    fontWeight: "600",
    color: "#239D60",
    textAlign: "center",
  },
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F5C8",
  },
  contentContainer: {
    paddingTop: 10,
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
  displayName: {
    fontSize: 15,
    marginTop: 10,
    marginLeft: 10,
    textAlign: "left",
    alignItems: "flex-start",
    fontWeight: "300",
  },
  selectedTagContainer: {
    margin: 5,
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
    gap: 10,
  },
  selectedTagView: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderRadius: 20,
    borderColor: "#239D60",
    flexDirection: "row",
    gap: 5,
    marginHorizontal: 2,
    backgroundColor: "#F2F5C8",
    gap: 10,
  },
  tagBorder: {
    margin: 5,
    marginTop: 0,
    marginBottom: 0,
    borderBottomWidth: 3,
    borderColor: "#239D60",
    marginVertical: 16,
  },
  TagButton: {
    width: 20,
    height: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
  },
  allTagContainer: {
    marginTop: 5,
    height: height * 0.2,
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
});

export default EditPostScreen;
