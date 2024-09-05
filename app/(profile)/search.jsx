import React, { useState } from "react";
import { View, Text, TextInput, Dimensions } from "react-native";
import firestore from "@react-native-firebase/firestore";

const { width, height } = Dimensions.get("window"); //デバイスの幅と高さを取得する
const ASPECT_RATIO = width / height; //アスペクト比

const SearchScreen = () => {
  const [searchText, setSearchText] = useState("");
  const [searchResult, setSearchResult] = useState([]);

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
            return <Text>{result.data().displayName}</Text>;
          })}
        </View>
      )}
    </View>
  );
};

export default SearchScreen;
