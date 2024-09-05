import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Link, useRouter } from "expo-router";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";

const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する
const ASPECT_RATIO = width / height; //アスペクト比

const auth = FirebaseAuth();
const router = useRouter();

const MyPageScreen = () => {
  const [searchText, setSearchText] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const userList = [];

  const search = async () => {
    const queryUser = await firestore()
      .collection("users")
      .where("displayName", "==", searchText)
      .get();

    if (!queryUser.empty) {
      let cnt = 0;
      while (cnt < queryUser.size) {
        const userSnapshot = queryUser.docs[cnt];
        const userData = userSnapshot.data();
        userList.push(userData.displayName);
        cnt = cnt + 1;
      }
    } else {
      userList.push("");
    }
    console.log(userList);
    setSearchResult(userList);
  };

  return (
    <View>
      <TextInput
        placeholder="検索"
        onChangeText={setSearchText}
        value={searchText}
      />
      <Button onPress={search} title="検索" />
      {searchResult.map((result) => {
        <Text>{result}</Text>;
      })}
    </View>
  );
};

export default MyPageScreen;
