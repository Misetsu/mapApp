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
    router.back(); // 前の画面に戻る
  };

  const navigation = useNavigation();

  const signout = async () => {
    await auth.signOut();
    router.replace({ pathname: "/" });
  };

  //

  return (
    <ScrollView>
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
        <Text style={styles.pagetitle}>SETTING</Text>

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
  profileContainer: {
    alignItems: "center",
  },
  button: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F2F2",
    height: 50,
    marginTop: 10, // ボタン間にスペースを追加
  },
  closeButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  buttonText: {
    fontSize: 18,
    color: "black",
    textAlign: "center",
    fontWeight: "300",
  },
  pagetitle: {
    fontSize: 30,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "300",
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
  followList: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    margin: 10,
  },
  listProfileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  FFtext: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  FFcontainer: {
    justifyContent: "space-between",
    flexDirection: "row", // 子要素を横並びに配置
    alignItems: "center", // 垂直方向の中央に揃える
    padding: 5, // 全体にパディング
    height: 50,
    marginBottom: 10, // ボタン間にスペースを追加
  },
  SwitchBtn: {},
  FFnum: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // 背景を半透明に
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  textInput: {
    margin: 5,
    marginBottom: 0,
    fontSize: 20,
    height: 40,
    borderBottomWidth: 2,
    marginVertical: 16,
    color: "black",
    fontWeight: "300",
  },
  submit: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "black",
    height: 50,
    marginTop: 10, // ボタン間にスペースを追加
  },
  submitText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f2f2f2",
    textAlign: "center",
  },
  linklabel: {
    fontSize: 16,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "center",
    textDecorationLine: "underline",
    color: "#1a0dab",
    fontWeight: "600",
  },
  backButton: {
    justifyContent: "center",
    alignItems: "center",
    height: 50,
  },
  backButtonText: {
    fontSize: 18,
    color: "black",
    textAlign: "center",
    fontWeight: "300",
  },
  //
  //
  //
  container: {
    flex: 1,
    padding: 20,
  },
  track: {
    width: 300,
    height: 50,
    backgroundColor: "#ddd",
    borderRadius: 25,
    justifyContent: "center",
    padding: 5,
    position: "relative",
  },
  slider: {
    width: 50,
    height: 40,
    backgroundColor: "#ff6347",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  sliderText: {
    color: "#fff",
    fontSize: 20,
  },
  slideBtn: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -75 }],
    color: "#333",
    fontSize: 16,
  },
});
