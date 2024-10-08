import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Link, useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/FontAwesome";
import FirebaseAuth from "@react-native-firebase/auth";

const auth = FirebaseAuth();
const router = useRouter();

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

  const handleProfile = (uid) => {
    if (uid == auth.currentUser.uid) {
      router.push({ pathname: "/myPage" });
    } else {
      router.push({ pathname: "/profile", params: { uid: uid } });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#000" style={styles.icon} />
        <TextInput
          style={[styles.input, { fontSize: 25 }]}
          placeholder="検索"
          onChangeText={handleSearch}
          value={searchText}
        />
      </View>
      {searchResult.length > 0 && searchText !== "" && (
        <View style={styles.resultsContainer}>
          {searchResult.map((result) => {
            return (
              <TouchableOpacity
                key={result.data().uid}
                style={styles.resultBar}
                onPress={() => {
                  handleProfile(result.data().uid);
                }}
              >
                <Image
                  source={{ uri: result.data().photoURL }}
                  style={styles.listProfileImage}
                />
                <Text style={styles.resultText}>
                  {result.data().displayName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

// スタイルオブジェクトを定義
const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultBar: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    marginVertical: 5,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  resultText: {
    fontSize: 20,
  },
  listProfileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});

export default SearchScreen;
