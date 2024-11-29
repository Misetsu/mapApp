import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { formatInTimeZone } from "date-fns-tz";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import ReplieModal from "../component/repliemodal";
const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する
const RepliesList = ({ replies, navigateProfile, postId }) => {
  const router = useRouter();
  const [parentReplyId, setParentReplyId] = useState(null); // 親返信ID
  const [items,setitems] = useState([])
  const [modalVisible,setmodalVisible] = useState(false)
  const [replie, setReplies] = useState([]);
  const [loading,setLoading] = useState(false)
  

  const setRepliesModal = (item) => {
    setitems(item)
    fetchData(item)
    setmodalVisible(true)
  }

  const fetchData = async (item) => {
    setLoading(true)
    try{
    const repliesSnapshot = await firestore()
      .collection("replies")
      .where("postId", "==", parseInt(postId),)
      .where('parentReplyId', '==', parseInt(item.parentReplyId))
      .orderBy("timestamp", "asc")
      .get();

  const repliesData = await Promise.all(
    repliesSnapshot.docs.map(async (doc) => {
      const queryUser = await firestore()
        .collection("users")
        .where("uid", "==", doc.data().userId)
        .get();

      const userData = queryUser.docs[0].data();
      return {
        id: doc.id,
        ...doc.data(),
        userData,
      };
    })
  );
  console.log("AAAAAAAAAAAAAAAAAAAAAAAAA",repliesData)
  setReplies(repliesData);
    }catch(error){
      console.log(error.message);
    }
    setLoading(false)
  }

  const handleReplyPress = (replyId) => {
    setParentReplyId(parentReplyId === replyId ? null : parseInt(replyId)); // 親返信をトグル
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
      {item.hantei === 0 ?
      <TouchableOpacity onPress={() => setRepliesModal(item)}>
        <Text style={styles.replyButton}>返信</Text>
      </TouchableOpacity>
        :<></>}
      {/* 返信入力フィールド */}
      <ReplieModal
        visible={modalVisible}
        items={replie}
        onClose={() => setmodalVisible(false)}
        postId={postId}
        navigateProfile={navigateProfile}
        parentReplyId={item.parentReplyId}
        loading={loading}
      />
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
    marginTop: 10,
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
  sky:{height:600}
});

export default RepliesList;
