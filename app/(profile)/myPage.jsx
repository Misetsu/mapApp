import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  Button,
  Pressable,
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
  const signout = async () => {
    await auth.signOut();
    router.replace({ pathname: "/" });
  };

  return (
    <View>
      <Text>{auth.currentUser.displayName}</Text>
      <Button title="ログアウト" onPress={signout} />
      <Link href={{ pathname: "/search" }} asChild>
        <Button title="検索" />
      </Link>
    </View>
  );
};

export default MyPageScreen;
