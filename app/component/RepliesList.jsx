import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Button,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { formatInTimeZone } from "date-fns-tz";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する
const RepliesList = ({ replies, navigateProfile, postId }) => {
  const router = useRouter();
  const [parentReplyId, setParentReplyId] = useState(null); // 親返信ID
  const [newReplyText, setNewReplyText] = useState(""); // 新しい返信内容
  

  const handleReplyPress = (replyId) => {
    setParentReplyId(parentReplyId === replyId ? null : parseInt(replyId)); // 親返信をトグル
  };
  const auth = FirebaseAuth();
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

  const submitReply = () => {
    if (newReplyText.trim()) {
      onReplySubmit(parentReplyId, newReplyText); // 親返信IDと一緒に返信を送信
      setNewReplyText("");
      setParentReplyId(null);
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
          <Text>{item.userData.displayName}</Text>
        </TouchableOpacity>
        <Text style={styles.replyTimestamp}>
          {formatInTimeZone(
            new Date(item.timestamp),
            "Asia/Tokyo",
            "yyyy年MM月dd日 HH:mm"
          )}
        </Text>
      </View>
      <Text style={styles.replyText}>{item.text}</Text>
      {/* 返信ボタン */}
      <TouchableOpacity onPress={() => handleReplyPress(item.parentReplyId)}>
        <Text style={styles.replyButton}>返信</Text>
      </TouchableOpacity>
      {/* 返信入力フィールド */}
      {parentReplyId === item.parentReplyId && (
        <View style={styles.replyInputContainer}>
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
      )}
    </View>
  );

  return (
  <View style={styles.liststyle}>
    <FlatList
      data={replies} // ソートされた配列を使用
      renderItem={renderReply}
      keyExtractor={(item) => item.id}
      style={styles.repliesList}
      contentContainerStyle={{ flexGrow: 1 }}
      ListEmptyComponent={
        <Text style={styles.noRepliesText}>まだ返信がありません。</Text>
      }
    />
    </View>
  );
};

const styles = StyleSheet.create({
  replyContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "lightgray",
    justifyContent: "flex-end", // 下から配置
    
  },
  indentedReplyContainer: {
    marginLeft: 40, // 4マス分のインデント
  
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
  iconImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
    
  },
  repliesList: {
  },
  replyButton: {
    color: "blue",
    padding: 5,
  },
  replyInputContainer: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    paddingTop: 5,
  },
  replyInput: {
    flex: 1,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    padding: 5,
    marginRight: 5,
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderColor: "gray",
    borderWidth: 1,
    padding: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "100%",
    flex: 1,
    
  },
  replyBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    justifyContent: "center",
    backgroundColor: "#A3DE83",
  },
  liststyle:{
    padding: 10,
    marginBottom:"auto",
    flex: 1, // 画面全体を使う
  },
  
});

export default RepliesList;
