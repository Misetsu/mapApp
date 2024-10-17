import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Text, ActivityIndicator } from "react-native";
import firestore from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";
import storage from "@react-native-firebase/storage";

const auth = FirebaseAuth();

export default function UserPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser.uid;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const firstKey = "id";
        const secondKey = "photoUri";
        let photoUri = "";
        const PhotoArray = [];

        const querySnapshot = await firestore()
          .collection("photo")
          .where("userId", "==", userId)
          .get();

        const size = querySnapshot.size;

        let cnt = 0;
        while (cnt < size) {
          const Photodesu = querySnapshot.docs[cnt].data();
          if (Photodesu.imagePath) {
            const url = await storage()
              .ref(Photodesu.imagePath)
              .getDownloadURL();
            photoUri = url;
          }
          const tempObj = {
            [firstKey]: Photodesu.id,
            [secondKey]: photoUri,
          };
          PhotoArray.push(tempObj); // ループ内で追加
          cnt++;
        }
        setPosts(PhotoArray);
      } catch (error) {
        console.error("Error fetching posts: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {posts.length === 0 ? (
        <Text>投稿がありません。</Text>
      ) : (
        <View style={styles.grid}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postContainer}>
              {post.photoUri ? (
                <Image source={{ uri: post.photoUri }} style={styles.image} />
              ) : (
                <Text>画像がありません。</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap", // 複数行に画像を並べる
    justifyContent: "space-between", // 画像の間にスペースを均等に配置
  },
  postContainer: {
    width: "30%", // 1行に3つの画像を表示
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 5,
  },
  image: {
    width: "100%",
    height: 100,
    borderRadius: 8,
  },
});
