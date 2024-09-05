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

  const handleSearch = (text) => {
    setSearchText(text);
    if (searchText != "") {
      firestore()
        .collection("users")
        .where("displayName", ">=", searchText)
        .where("displayName", "<=", searchText + "¥uf8ff")
        .get()
        .then((result) => {
          setSearchResult(result.docs);
          console.log(result.docs);
          console.log(searchText);
        });
    }
  };

  return (
    <View>
      <TextInput
        placeholder="検索"
        onChangeText={handleSearch}
        value={searchText}
      />
      {searchResult.length > 0 && searchText != "" && (
        <View>
          {searchResult.map((result) => {
            <Text>{result.data().displayName}</Text>;
          })}
        </View>
      )}
      {searchResult.map((result) => {
        <Text>{result.data().displayName}</Text>;
      })}
    </View>
  );
};

export default MyPageScreen;
