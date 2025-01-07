import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Alert,
  FlatList, // ScrollViewからFlatListに変更z
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { formatInTimeZone } from "date-fns-tz";
import { useRouter } from "expo-router";
const auth = FirebaseAuth();
const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得す

export default function ReplieModal({
  visible,
  items,
  onClose,
  postId,
  navigateProfile,
  parentReplyId,
  loading,
}) {
  const router = useRouter();
  const [newReplyText, setNewReplyText] = useState(""); // 新しい返信内容

  const submitReply = () => {
    if (newReplyText.trim()) {
      onReplySubmit(parentReplyId, newReplyText); // 親返信IDと一緒に返信を送信
      setNewReplyText("");
    }
  };

  const onReplySubmit = async (parentReplyId, newReplyText) => {
    const currentTime = new Date().toISOString();
    if (newReplyText.trim()) {
      if (!auth.currentUser) {
        Alert.alert("エラー", "ログインしてください。");
        return;
      }
      const userId = auth.currentUser.uid;

      try {
        await firestore()
          .collection("replies")
          .add({
            postId: parseInt(postId),
            parentReplyId: parentReplyId,
            userId: userId,
            text: newReplyText,
            timestamp: currentTime,
            hantei: 1,
          });

        Alert.alert("成功", "返信が送信されました。");
        router.back();
      } catch (error) {
        Alert.alert(
          "エラー",
          `返信の送信中にエラーが発生しました: ${error.message}`
        );
        console.error("Error adding reply:", error);
      }
    } else {
      Alert.alert("エラー", "返信を入力してください。");
    }
  };
  const renderReply = ({ item }) => (
    <View
      style={[
        styles.replyContainer,
        item.hantei === 1 && styles.indentedReplyContainer, // hanteiが1なら全体をインデント
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userBar}
          onPress={() => navigateProfile(item.userId)}
        >
          <Image
            source={{ uri: item.userData.photoURL }}
            style={styles.iconImage}
          />
          <Text style={{ alignItems: "flex-end" }}>
            {item.userData.displayName}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.replyText}>{item.text}</Text>
      <Text style={styles.replyTimestamp}>
        {formatInTimeZone(
          new Date(item.timestamp),
          "Asia/Tokyo",
          "yyyy年MM月dd日 HH:mm"
        )}
      </Text>
    </View>
  );
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      style={styles.modal}
    >
      <KeyboardAvoidingView style={styles.centeredView}>
        {loading ? (
          <View style={styles.loadingstyle}>
            <ActivityIndicator size="large" color="#239D60" />
            <Text>読み込み中...</Text>
          </View>
        ) : (
          <View style={styles.postViewCentering}>
            <View style={styles.closeButton}>
              <TouchableOpacity style={styles.button} onPress={onClose}><Image
                source={require("./../image/Close.png")}
                style={styles.actionButton}
              />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items} // ソートされた配列を使用
              renderItem={renderReply}
              keyExtractor={(item) => item.id}
              style={styles.repliesList}
              contentContainerStyle={{ flexGrow: 1 }}
              ListEmptyComponent={
                <Text style={styles.noRepliesText}>まだ返信がありません。</Text>
              }
            />
            <View style={styles.replys}>
              <View style={styles.replyTextinput}>
                <TextInput
                  style={styles.input}
                  value={newReplyText}
                  onChangeText={setNewReplyText}
                  placeholder="返信を入力..."
                />
                <TouchableOpacity style={styles.replyBtn} onPress={submitReply}>
                  <Text>送信</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    justifyContent: "center",
    alignItems: "center",
    height: height,
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  replys: {
    width: "100%",
  },
  input: {
    backgroundColor: "#FAFEFF",
    borderColor: "gray",
    borderWidth: 1,
    padding: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "75%",
  },
  postViewCentering: {
    width: 350,
    padding: 20,
    backgroundColor: "#F2F5C8",
    borderRadius: 20,
    height: height * 0.8,
    flex: 0.7,
  },
  loadingstyle: {
    width: 350,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#F2F5C8",
    borderRadius: 20,
  },
  iconImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userBar: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  replyText: {
    fontSize: 16,
    paddingHorizontal: 10,
  },
  replyBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    justifyContent: "center",
    backgroundColor: "#A3DE83",
  },
  closeButton: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
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
  replyTextinput: {
    justifyContent: "space-between",
    flexDirection: "row", // 横並びに設定
    gap: 10,
  },
  modal: {
    backgroundColor: "#F0E68C",
  },
  replyContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "lightgray",
  },
  indentedReplyContainer: {
    marginLeft: 40, // 4マス分のインデント
  },
  repliesList: {
    height: "80%",
  },
  replyTimestamp: {
    fontSize: 12,
    color: "gray",
  },
});
