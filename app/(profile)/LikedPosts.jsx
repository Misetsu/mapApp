import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Text,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";
import storage from "@react-native-firebase/storage";
import Icon from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";

const auth = FirebaseAuth();

export default function UserLikedPosts() {
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null); // クリックされた画像の詳細用
  const [modalVisible, setModalVisible] = useState(false); // モーダル表示の制御用
  const [startpage, setstartpage] = useState(0); // クリックされた画像の詳細用
  const [endpage, setendpage] = useState(9); // モーダル表示の制御用
  const [len, setlen] = useState(0);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchLikedPosts = async () => {
      setLoading(true);
      AsyncStorage.clear();
      try {
        const likedPostArray = [];

        // like コレクションからユーザーがいいねしたデータを取得
        const likeSnapshot = await firestore()
          .collection("like")
          .where(userId, "==", userId) // 自分の userId に基づいたいいねを取得
          .get();

        if (likeSnapshot.empty) {
          return;
        }
        setlen(likeSnapshot.size);

        const likedPostPromises = likeSnapshot.docs
          .slice(startpage, endpage)
          .map(async (likeDoc) => {
            const likeData = likeDoc.data();
            const postId = likeData.postId;

            // postId を使って photo コレクションからデータを取得
            const photoSnapshot = await firestore()
              .collection("photo")
              .where("postId", "==", postId) // postId に基づいて photo データを取得
              .get();

            if (!photoSnapshot.empty) {
              const photoData = photoSnapshot.docs[0].data(); // 1つ目の一致したデータを取得
              let photoUri = "";

              // 画像パスが存在する場合、URL を取得
              if (photoData.imagePath) {
                photoUri = await storage()
                  .ref(photoData.imagePath)
                  .getDownloadURL();
              }

              return {
                postId: photoData.postId,
                photoUri: photoUri,
                postTxt: photoData.postTxt, // 投稿テキスト
                spotId: photoData.spotId, // スポットIDも保存
              };
            }
          });

        const likedPostsData = await Promise.all(likedPostPromises);
        setLikedPosts(likedPostsData);
      } catch (error) {
        console.error("いいねした投稿の取得中にエラーが発生しました: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPosts();
  }, [userId, startpage]);

  const handleImagePress = async (post) => {
    try {
      // postId を使って post コレクションからデータを取得
      const postSnapshot = await firestore()
        .collection("post")
        .where("id", "==", post.postId) // 画像の postId を使って投稿を取得
        .get();

      let postDetails = null;
      if (!postSnapshot.empty) {
        // 一致する投稿が見つかった場合、データを取得
        postDetails = postSnapshot.docs[0].data(); // 最初の一致したドキュメントを取得
      }

      // spotId を使って spot コレクションから名前を取得
      const spotSnapshot = await firestore()
        .collection("spot")
        .where("id", "==", post.spotId) // 画像の spotId を使ってスポットを取得
        .get();

      let spotName = null;
      if (!spotSnapshot.empty) {
        // 一致するスポットが見つかった場合、データを取得
        spotName = spotSnapshot.docs[0].data().name; // スポットの名前を取得
      }

      // like のカウントを取得
      const likeSnapShot = await firestore()
        .collection("like")
        .where("postId", "==", post.postId)
        .get();

      let likeCount = 0;
      if (!likeSnapShot.empty) {
        likeCount = likeSnapShot.docs[0].data().count || 0; // デフォルトのカウントを 0 に設定
      }

      setSelectedPost({ ...post, postDetails, spotName, likeCount }); // 画像の情報と投稿の詳細、スポットの名前、いいねの数を保存
      setModalVisible(true); // モーダルを表示
    } catch (error) {
      console.error("投稿データの取得中にエラーが発生しました: ", error);
    }
  };

  const closeModal = () => {
    setModalVisible(false); // モーダルを閉じる
    setSelectedPost(null); // 選択された画像のリセット
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#239D60" />
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
      {likedPosts.length === 0 ? (
        <Text>いいねした投稿がありません。</Text>
      ) : (
        <View style={styles.grid}>
          {likedPosts.map((post) => (
            <TouchableOpacity
              key={post.postId}
              onPress={() => handleImagePress(post)}
              style={styles.postContainer}
            >
              {post.photoUri ? (
                <Image source={{ uri: post.photoUri }} style={styles.image} />
              ) : (
                <Text>画像がありません。</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* モーダルの定義 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPost && (
              <>
                {selectedPost.spotName && (
                  <Text style={styles.subtitle}>{selectedPost.spotName}</Text>
                )}
                {selectedPost.photoUri ? (
                  <Image
                    source={{ uri: selectedPost.photoUri }}
                    style={styles.modalImage}
                  />
                ) : (
                  <Text>画像がありません。</Text>
                )}
                {selectedPost.postDetails &&
                  selectedPost.postDetails.postTxt && (
                    <Text style={styles.postContent}>
                      {selectedPost.postDetails.postTxt}
                    </Text>
                  )}
                {selectedPost.likeCount > 0 && (
                  <Text style={styles.likeCountText}>
                    ❤ {selectedPost.likeCount}
                  </Text>
                )}
              </>
            )}
            <TouchableOpacity style={styles.button} onPress={closeModal}>
              <Text style={styles.buttonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.arrow}>
        {startpage != 0 && (
          <TouchableOpacity
            style={styles.arrowleft}
            onPress={() => paging("left")}
          >
            <Icon name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
        )}
        {endpage < len && (
          <TouchableOpacity
            style={styles.arrowright}
            onPress={() => paging("right")}
          >
            <Icon name="arrow-right" size={24} color="#000" />
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
    marginBottom: 15,
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
