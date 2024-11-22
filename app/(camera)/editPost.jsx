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
import Icon from "react-native-vector-icons/FontAwesome5";

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
        });
    }
    router.back();
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
                <View style={styles.header}>
                  <TouchableOpacity
                    onPress={handleBackPress}
                    style={styles.iconButton}
                  >
                    <Icon name="angle-left" size={24} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.spotName}>投稿編集</Text>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleSave}
                  >
                    <Icon name="save" size={24} color="#239D60" />
                  </TouchableOpacity>
                </View>
                <View style={styles.contentContainer}>
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: photoUri }} style={styles.image} />
                  </View>

                  <View style={styles.postDetails}>
                    <Text style={styles.spotText}>
                      投稿スポット：{selectedPost.spotName}
                    </Text>
                  </View>

                  <View style={styles.postDetails}>
                    <Text style={styles.spotText}>
                      {selectedPost.postDetails.postTxt != ""
                        ? selectedPost.postDetails.postTxt
                        : "詳細がありません"}
                    </Text>
                  </View>
                  <View style={styles.postDetails}>
                    <Text style={styles.spotText}>タグ：</Text>
                    <View style={styles.selectedTag}>
                      {selectedTag.length == 0 ? (
                        <Text>追加されたタグがありません</Text>
                      ) : (
                        <FlatList
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
                                <Text>
                                  {allTag.find((o) => o.tagId == item).tagName}
                                </Text>
                                <Icon name="times-circle" size={16} />
                              </TouchableOpacity>
                            );
                          }}
                        />
                      )}
                    </View>
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
                </View>
                <TouchableOpacity style={styles.submit} onPress={handleSave}>
                  <Text style={styles.submitText}>保存</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: height,
    backgroundColor: "#F2F5C8",
  },
  centerContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F5C8",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  spotName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  imageContainer: {
    width: ((height * 0.3) / 4) * 3,
    height: height * 0.3,
    marginBottom: 10,
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
  postDetails: {
    padding: 10,
  },
  spotText: {
    fontSize: 16,
    color: "#333",
  },
  input: {
    height: 50,
    backgroundColor: "#FAFAFA",
    borderColor: "gray",
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    width: "100%",
    flex: 1,
  },
  replyBtn: {
    height: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    justifyContent: "center",
    backgroundColor: "#A3DE83",
  },
  repliesList: {},
  replyContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "lightgray",
  },
  replyText: {
    fontSize: 14,
    paddingHorizontal: 10,
  },
  replyTimestamp: {
    fontSize: 12,
    color: "gray",
  },
  noRepliesText: {
    textAlign: "center",
    color: "gray",
    marginTop: 10,
  },
  sendReply: {
    width: "100%",
    backgroundColor: "#F2F5C8",
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 10,
  },
  postUserBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  postUser: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    height: "100%",
  },
  postIconImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  postDate: {
    fontSize: 12,
    color: "gray",
  },
  actionButton: {
    width: 40,
    height: 40,
    padding: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
  },
  likeNum: {
    marginLeft: 10,
    fontSize: 16,
  },
  rowView: {
    flexDirection: "row",
    gap: 15,
  },
  rowSpaceView: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    flexDirection: "row",
    gap: 10,
  },
  selectedTag: {
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
});

export default EditPostScreen;
