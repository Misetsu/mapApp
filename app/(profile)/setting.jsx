import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import FirebaseAuth from "@react-native-firebase/auth";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useNavigation } from "@react-navigation/native";

const auth = FirebaseAuth();

export default function myPage() {
  const router = useRouter();

  const handleBackPress = () => {
    if (router) {
      router.back();
    }
  };

  const navigation = useNavigation();

  const signout = async () => {
    await auth.signOut();
    router.replace({ pathname: "/" });
  };

  //

  return (
    <ScrollView style={styles.scrview}>
      <TouchableOpacity
        onPress={handleBackPress}
        style={{
          width: 50, // 横幅を設定
          height: 50, // 高さを設定
          justifyContent: "center", // 縦中央揃え
          alignItems: "center", // 横中央揃え
        }}
      >
        {/* 右側のアイコンやテキストをここに追加 */}
        <Icon name="angle-left" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.pagetitle}>設定</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/userPolicy")}
        >
          <Text style={styles.buttonText}>USER POLICY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/privacyPolicy")}
        >
          <Text style={styles.buttonText}>PRIVACY POLICY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/myPage")}
        >
          <Text style={styles.buttonText}>HELP</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrview: {
    backgroundColor: "#F2F5C8",
  },
  profileContainer: {
    alignItems: "center",
  },
  button: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#A3DE83",
    height: 50,
    margin: 10, // ボタン間にスペースを追加
  },
  buttonText: {
    fontSize: 18,
    color: "#000000",
    textAlign: "center",
    fontWeight: "300",
  },
  pagetitle: {
    fontSize: 30,
    height: 70,
    marginTop: 0,
    textAlign: "center",
    fontWeight: "300",
    color: "#000000",
  },
  subtitle: {
    fontSize: 18,
    margin: 10,
    textAlign: "center",
    fontWeight: "600",
    color: "#000000",
  },
  displayName: {
    fontSize: 15,
    marginTop: 10,
    marginLeft: 10,
    textAlign: "left",
    alignItems: "flex-start",
    fontWeight: "300",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ccc",
  },
  FFtext: {
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  FFcontainer: {
    flexDirection: "row", // 子要素を横並びに配置
    justifyContent: "space-between", // 子要素間にスペースを空ける
    alignItems: "center", // 垂直方向の中央に揃える
    width: "80%", // 横幅を80%に設定（任意）
    padding: 5, // 全体にパディング
  },
  FFnum: {
    padding: 10,
  },
  ChangeStatus: {
    justifyContent: "space-between",
    flexDirection: "row", // 子要素を横並びに配置
    alignItems: "center", // 垂直方向の中央に揃える
    width: "90%", // 横幅を80%に設定（任意）
    alignSelf: "center",
    margin: 10,
    backgroundColor: "#F2F5C8",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // 背景を半透明に
  },
  modalContent: {
    width: "90%",
    padding: 20,
    paddingTop: 15,
    backgroundColor: "#F2F5C2",
    borderRadius: 10,
  },
  listUsernamecontainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  listUsername: {
    fontSize: 18,
    color: "black",
    fontWeight: "300",
  },
  followListuser: {
    display: "flex",
    flexDirection: "row",
    margin: 10,
    width: "100%",
  },
  listProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 30,
  },
  textInput: {
    margin: 5,
    marginTop: 0,
    marginBottom: 0,
    fontSize: 20,
    height: 40,
    borderBottomWidth: 3,
    borderColor: "#239D60",
    marginVertical: 16,
    color: "black",
    fontWeight: "300",
  },
  backButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F5C8",
    width: 70,
    height: 70,
    marginTop: 5, // ボタン間にスペースを追加
  },
  Back: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
