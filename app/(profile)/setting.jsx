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
      <View style={styles.container}>
        <Text style={styles.pagetitle}>設定</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/userPolicy")}
        >
          <Text style={styles.buttonText}>利用規約</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/privacyPolicy")}
        >
          <Text style={styles.buttonText}>プライバシーポリシー</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/myPage")}
        >
          <Text style={styles.buttonText}>ヘルプ</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.Back}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="angle-left" size={24} color="#000" />
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
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F5C8",
    width: 70,
    height: 70,
    marginTop: 5, // ボタン間にスペースを追加
  },
  backButtonText: {
    fontSize: 18,
    color: "black",
    textAlign: "center",
    fontWeight: "300",
  },
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
