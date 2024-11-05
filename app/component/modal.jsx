import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router"; 
import { formatInTimeZone } from "date-fns-tz";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore, { FieldValue } from "@react-native-firebase/firestore";

const auth = FirebaseAuth();

const MyModal = ({
  visible,
  empty,
  postData = [], // デフォルト値を空の配列に設定
  postImage,
  spotId,
  loading,
  onClose,
}) => {
  const router = useRouter(); 
  const [likes, setLikes] = useState({});
  const [reply, setReply] = useState([]);

  const handleLikePress = (postId) => {
    setLikes((prevLikes) => ({
      ...prevLikes,
      [postId]: !prevLikes[postId],
    }));
  };

  // useEffect(() => {
    // postData.map(async(post) => {
    //   const queryReplay = await firestore()
    //   .collection("replies")
    //   .where("postId", "==", post.postId)
    //   .limit(2)
    //   .get();
    // })
    // if (!queryReplay.empty) {
    //   const size = queryReplay.size
    //   let cnt = 0
    //   let tempArray = []
    //   const firstKey = "userId";
    //   const secondKey = "username";
    //   const thirdKey = "userIcon";
    //   const forthKey = "postId";
    //   const fifthKey = "replyId";
    //   const sixthKey = "replyText";

    //   while (cnt < size) {
    //     const replaySnapshot = queryReplay.docs[cnt]
    //     const replayData = replaySnapshot.data()

    //     let tempObj = {};

    //     const queryUser = await firestore()
    //       .collection("users")
    //       .where("uid", "==", postData.userId)
    //       .get();
    //     const userSnapshot = queryUser.docs[0];
    //     const userData = userSnapshot.data();
    //   }
    // }
    // const replaypostget = async(postid) =>{
    //   console.log("X")
    //   const queryReplay = await firestore()
    //   .collection("replies")
    //   .where("postId", "==", postid)
    //   .get();
  
    // const replaySnapshot = queryReplay.docs[0];
    // const replayData = replaySnapshot.data();
    // console.log("AAAA",replayData)
  
    // }
    // replaypostget(postData.id)
  // },[])

  
  const tempObj1 = {};
  const tempObj2 = {};

  postData.map((post) => {
    if (post) { // postが未定義でないことを確認
      tempObj1[post.id] = post.likeFlag; // postIdをidに修正
      tempObj2[post.id] = post.likeCount;
    }
  });

  const handleUnlike = async (postId) => {
    if (likes[postId] == true) {
      handleSimpleLike(postId);
    } else {
      handleLikePress(postId);
      tempObj2[postId] = tempObj2[postId] - 1;
      const querylike = await firestore()
        .collection("like")
        .where("postId", "==", postId)
        .get();
      const queryId = querylike.docs[0].ref._documentPath._parts[1];
      await firestore()
        .collection("like")
        .doc(queryId)
        .update({
          count: tempObj2[postId],
          [auth.currentUser.uid]: FieldValue.delete(),
        });
    }
  };

  const handleSimpleUnlike = async (postId) => {
    handleLikePress(postId);
    const querylike = await firestore()
      .collection("like")
      .where("postId", "==", postId)
      .get();
    const queryId = querylike.docs[0].ref._documentPath._parts[1];
    await firestore()
      .collection("like")
      .doc(queryId)
      .update({
        count: tempObj2[postId],
        [auth.currentUser.uid]: FieldValue.delete(),
      });
  };

  const handleLike = async (postId) => {
    if (likes[postId] == true) {
      handleSimpleUnlike(postId);
    } else {
      handleLikePress(postId);
      tempObj2[postId] = tempObj2[postId] + 1;
      const querylike = await firestore()
        .collection("like")
        .where("postId", "==", postId)
        .get();
      const queryId = querylike.docs[0].ref._documentPath._parts[1];
      await firestore()
        .collection("like")
        .doc(queryId)
        .update({
          count: tempObj2[postId],
          [auth.currentUser.uid]: auth.currentUser.uid,
        });
    }
  };

  const handleSimpleLike = async (postId) => {
    handleLikePress(postId);
    const querylike = await firestore()
      .collection("like")
      .where("postId", "==", postId)
      .get();
    const queryId = querylike.docs[0].ref._documentPath._parts[1];
    await firestore()
      .collection("like")
      .doc(queryId)
      .update({
        count: tempObj2[postId],
        [auth.currentUser.uid]: auth.currentUser.uid,
      });
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✖</Text>
          </TouchableOpacity>

          <ScrollView>
            {loading ? (
              <Text>読み込み中...</Text>
            ) : !empty && postData.length > 0 ? (
              postData.map((post) => {
                if (!post) return null; // postが未定義の場合はスキップ
                const isLiked = likes[post.id]; // idを使用する
                const flag = tempObj1[post.id];
                const count = tempObj2[post.id];
                return (
                  <View key={post.id}>
                    <Link
                      href={{
                        pathname: "/profile",
                        params: {
                          uid: post.userId,
                        },
                      }}
                      asChild
                    >
                      <TouchableOpacity style={styles.userInfo}>
                        <Image
                          source={{ uri: post.userIcon }}
                          style={styles.userIcon}
                        />
                        <Text>{post.username}</Text>
                      </TouchableOpacity>
                    </Link>
                    {postImage ? (
                      <Image
                        source={{ uri: post.photoUri }}
                        style={{ width: 300, height: 400 }}
                      />
                    ) : (
                      <Image
                        source={{ uri: post.photoUri }}
                        style={{ width: 300, height: 400 }}
                        blurRadius={50}
                      />
                    )}

                    <View style={styles.dateLikeRow}>
                      <Text>
                        {formatInTimeZone(
                          new Date(post.timestamp),
                          "Asia/Tokyo",
                          "yyyy/MM/dd HH:mm"
                        )}
                      </Text>

                      {flag ? (
                        <TouchableOpacity
                          style={styles.likeButton}
                          onPress={() => handleUnlike(post.id)}
                        >
                          <Text style={{ color: isLiked ? "black" : "red" }}>
                            {isLiked ? "♡ " + (count - 1) : "❤️ " + count}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.likeButton}
                          onPress={() => handleLike(post.id)}
                        >
                          <Text style={{ color: isLiked ? "red" : "black" }}>
                            {isLiked ? "❤️ " + (count + 1) : "♡ " + count}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text>{post.postText}</Text>

                    {/* postTextと返信の間の区切り線 */}
                    
                    <View style={styles.divider} />
                    
                    {/* 返信リストの表示 */}
                    <View style={styles.replyContainer}>
                      {post.reply && post.reply.length > 0 ? (
                        post.reply.map((reply, index) => (
                          <Text key={index} style={styles.replyText}>
                            {reply.replyText}
                          </Text>
                        ))
                      ) : (
                        <Text>返信がありません</Text>
                      )}
                    </View>

                    <TouchableOpacity style={styles.replyButton} onPress={() => {
                      router.push({
                        pathname: "/component/replay",
                        params: { postId: post.postId }, // idを使用
                      });
                    }}>
                      <Text style={styles.replyButtonText}>返信</Text>
                    </TouchableOpacity>

                    
                  </View>
                );
              })
            ) : (
              <Text>投稿がありません</Text>
            )}
          </ScrollView>

          <View style={styles.toolView}>
            <Link
              href={{
                pathname: "/camera",
                params: {
                  latitude: 0,
                  longitude: 0,
                  spotId: spotId,
                },
              }}
              asChild
            >
              <Pressable style={styles.postButton}>
                <Text style={styles.postButtonText}>投稿</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
  },
  modalView: {
    width: 350,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: "relative",
  },
  toolView: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  postButton: {
    width: 75,
    height: 25,
    backgroundColor: "blue",
    justifyContent: "center",
    alignItems: "center",
  },
  postButtonText: {
    color: "#FFFFFF",
  },
  userIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  userInfo: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
  },
  likeButton: {
    marginLeft: 10,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  closeButtonText: {
    fontSize: 24,
  },
  replyButton: {
    marginVertical: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    padding: 10,
  },
  replyButtonText: {
    color: "#FFFFFF",
  },
  dateLikeRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  // 追加: postTextと返信リストの間に区切り線を入れるためのスタイル
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0", // 薄いグレーの線
    marginVertical: 10,
  },
});


export default MyModal; 