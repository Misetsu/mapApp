// MyModal.js
import React, { useState } from "react";
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
import { Link } from "expo-router";
import { formatInTimeZone } from "date-fns-tz";

const MyModal = ({
  visible,
  empty,
  postData,
  postImage,
  spotId,
  loading,
  onClose,
}) => {
  const [likes, setLikes] = useState({});

  const handleLikePress = (postId) => {
    setLikes((prevLikes) => ({
      ...prevLikes,
      [postId]: !prevLikes[postId],
    }));
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
          {/* ✖ ボタン */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{/* スタイルを設定 */}✖</Text>
          </TouchableOpacity>

          <ScrollView>
            {loading ? (
              <Text>読み込み中...</Text>
            ) : !empty && postData.length > 0 ? (
              postData.map((post) => {
                const isLiked = likes[post.postId];
                return (
                  <View key={post.postId}>
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

                    {/* 日付といいねボタンの表示 */}
                    <View style={styles.dateLikeRow}>
                      <Text>
                        {formatInTimeZone(
                          new Date(post.timestamp),
                          "Asia/Tokyo",
                          "yyyy/MM/dd HH:mm"
                        )}
                      </Text>

                      {/* いいねボタン */}
                      <TouchableOpacity
                        style={styles.likeButton}
                        onPress={() =>
                          handleLikePress(post.postId)
                        } /* ポストIDごとにボタンが押されたか保存　*/
                      >
                        <Text style={{ color: isLiked ? "red" : "black" }}>
                          {/* isLikedでtrue,falseで色変換 */}
                          {isLiked
                            ? "❤️ " + post.likeCount
                            : "♡ " + post.likeCount}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text>{post.postText}</Text>
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
    flexDirection: "row", // 横方向に要素を配置
    justifyContent: "flex-end", // 右寄せにする
  },
  postButton: {
    width: 75,
    height: 25,
    backgroundColor: "blue",
    justifyContent: "center", // 垂直方向の中央揃え
    alignItems: "center", // 水平方向の中央揃え
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
    marginLeft: 10, // 日付といいねボタンの間のスペース
  },
  closeButton: {
    position: "absolute", //絶対配置
    top: 10,
    right: 10,
    padding: 10,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  dateLikeRow: {
    flexDirection: "row", //右端に配置
    alignItems: "center",
    marginTop: 10,
  },
});

export default MyModal;
