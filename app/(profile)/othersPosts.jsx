import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";
import storage from "@react-native-firebase/storage";
import ImageResizer from "react-native-image-resizer";

const auth = FirebaseAuth();

export default function UserPosts(uid) {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startpage, setstartpage] = useState(0); // クリックされた画像の詳細用
  const [endpage, setendpage] = useState(9); // モーダル表示の制御用
  const [len, setlen] = useState(0);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let vivstedSpot = {};

        if (auth.currentUser != null) {
          const querySnapshot = await firestore()
            .collection("users")
            .doc(auth.currentUser.uid)
            .collection("spot")
            .orderBy("spotId", "asc")
            .get();

          if (!querySnapshot.empty) {
            querySnapshot.forEach((docs) => {
              const item = docs.data();
              vivstedSpot[item.spotId] = item.timeStamp;
            });
          }
        }

        // photo コレクションからデータを取得
        const photoSnapshot = await firestore()
          .collection("photo")
          .where("userId", "==", uid.uid)
          .orderBy("postId", "desc")
          .get();
        if (photoSnapshot.empty) {
          return;
        }

        setlen(photoSnapshot.size);
        // photo の各ドキュメントをループ処理
        const photoPromises = photoSnapshot.docs
          .slice(startpage, endpage)
          .map(async (photoDoc) => {
            const photoData = photoDoc.data();
            let photoUri = "";
            let visited = false;

            // 画像パスが存在する場合、URL を取得
            if (photoData.imagePath) {
              originalUri = await storage()
                .ref(photoData.imagePath)
                .getDownloadURL();
            }

            if (photoData.spotId in vivstedSpot) {
              if (photoData.timeStamp < vivstedSpot[photoData.spotId]) {
                visited = true;
              }
            }
            const resizedImage = await ImageResizer.createResizedImage(
              originalUri, // 元の画像URL
              400,
              300,
              "JPEG", // フォーマット (JPEG / PNG)
              50, // 品質 (0 - 100)
              0 // 回転角度
            );
            photoUri = resizedImage.uri;

            return {
              photoUri: photoUri,
              postId: photoData.postId, // postId も保存
              spotId: photoData.spotId, // spotId も保存
              visited: visited,
            };
          });

        const photos = await Promise.all(photoPromises);
        setPosts(photos);
      } catch (error) {
        console.error("投稿の取得中にエラーが発生しました: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [startpage]);

  const navigateDetailPage = (postId, showImage, myPage) => {
    router.push({
      pathname: "/component/replay",
      params: { postId: postId, showImage: showImage, myPage: myPage },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>読み込み中...</Text>
      </View>
    );
  }

  const paging = (arrow) => {
    let stpage = 0;
    let edpage = 0;
    if (arrow == "left" && startpage - 9 >= 0) {
      stpage = startpage - 9;
      edpage = endpage - 9;
      setstartpage(stpage);
      setendpage(edpage);
    } else if (arrow == "right") {
      stpage = startpage + 9;
      edpage = endpage + 9;
      setstartpage(stpage);
      setendpage(edpage);
    }
  };

  return (
    <View style={styles.container}>
      {posts.length === 0 ? (
        <Text>投稿がありません。</Text>
      ) : (
        <View style={styles.grid}>
          {posts.map((post) => (
            <TouchableOpacity
              key={post.postId}
              onPress={() =>
                navigateDetailPage(post.postId, post.visited, true)
              }
              style={styles.postContainer}
            >
              {post.photoUri ? (
                <View>
                  {post.visited ? (
                    <Image
                      source={{ uri: post.photoUri }}
                      style={styles.image}
                    />
                  ) : (
                    <Image
                      source={{ uri: post.photoUri }}
                      style={styles.image}
                      blurRadius={50}
                    />
                  )}
                </View>
              ) : (
                <Text>画像がありません。</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.arrow}>
        {startpage != 0 && (
          <TouchableOpacity
            style={styles.arrowleft}
            onPress={() => paging("left")}
          >
            <Image
              source={require("./../image/Left_arrow.png")}
              style={styles.actionButton}
            />
          </TouchableOpacity>
        )}
        {endpage < len && (
          <TouchableOpacity
            style={styles.arrowright}
            onPress={() => paging("right")}
          >
            <Image
              source={require("./../image/Right_arrow.png")}
              style={styles.actionButton}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
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
    margin: 5,
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  image: {
    width: "100%",
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // 背景を半透明に
  },
  modalContent: {
    width: "90%",
    padding: 20,
    paddingTop: 15,
    backgroundColor: "#F2F5C2",
    borderRadius: 10,
  },
  modalImage: {
    width: 280,
    height: 280,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd", // 画像に軽い枠を追加
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  postContent: {
    fontSize: 18, // フォントサイズを16から18に変更
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    margin: 10,
    textAlign: "center",
    fontWeight: "600",
    color: "#000000",
  },
  likeCountText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },
  button: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#A3DE83",
    height: 50,
    margin: 10, // ボタン間にスペースを追加
  },
  buttonText: {
    fontSize: 18,
    color: "#000000",
    textAlign: "center",
    fontWeight: "300",
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
  arrow: {
    flexDirection: "row", // 子要素を横並びに配置
  },
  arrowright: {
    marginLeft: "auto", // 左に自動マージンを設定して右寄せ
    alignSelf: "flex-end", // コンテナ内の右側に配置
  },
  arrowleft: {
    marginRight: "auto", // 左に自動マージンを設定して右寄せ
    alignSelf: "flex-start", // コンテナ内の右側に配置
  },
});
