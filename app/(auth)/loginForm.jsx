import React, { useState } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

const auth = FirebaseAuth();

GoogleSignin.configure({
  webClientId:
    "224298539879-t62hp3sk9t27ecupcds9d8aj29jr9hmm.apps.googleusercontent.com",
});

export default function LoginScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");

  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };

  const navigateSignup = () => {
    router.push("/signupForm");
  };

  const signInWithGoogle = async () => {
    // Google のログイン画面を表示して認証用の ID トークンを取得する
    try {
      const user = await GoogleSignin.signIn();
      const idToken = user.idToken;
      if (idToken === null) {
        return;
      }

      // 取得した認証情報 (ID トークン) を元にサインインする
      const credential = FirebaseAuth.GoogleAuthProvider.credential(idToken);
      await auth.signInWithCredential(credential);

      const querySnapshot = await firestore()
        .collection("users")
        .where("uid", "==", auth.currentUser.uid) // 特定の条件を指定
        .get();

      if (querySnapshot.empty) {
        router.push({
          pathname: "/signupFormGoogle",
          params: {
            uid: auth.currentUser.uid,
            displayName: auth.currentUser.displayName,
            photoURL: auth.currentUser.photoURL,
          },
        });
      } else {
        router.replace({ pathname: "/" });
      }
    } catch (error) {
      Alert.alert("ログインに失敗しました。", error.code);
    }
  };

  const signInWithEmail = async () => {
    try {
      if (userEmail != "" && userPassword != "") {
        await auth
          .signInWithEmailAndPassword(userEmail, userPassword)
          .then(() => {
            router.replace({ pathname: "/" });
          })
          .catch((error) => {
            console.log(error);
            Alert.alert(
              "ログインに失敗しました。",
              "入力内容を再確認してください。"
            );
          });
      } else {
        Alert.alert("ログインに失敗しました。", "入力してください。");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleChangePassword = async () => {
    const userSnapshot = await firestore()
      .collection("users")
      .where("email", "==", userEmail)
      .get();

    if (!userSnapshot.empty) {
      auth
        .sendPasswordResetEmail(userEmail)
        .then(() => {
          alert(
            "パスワードを変更するメールを入力されたメールアドレスに送信しました。"
          );
        })
        .catch((error) => {
          alert(error);
        });
    } else {
      alert("入力されたメールアドレスが登録されていません。");
    }
  };

  return (
    <ScrollView style={styles.scrview}>
      <View style={styles.container}>
        <Text style={styles.pagetitle}>ログイン</Text>
        <Text style={styles.displayName}>メールアドレス</Text>
        <TextInput
          style={styles.textInput}
          value={userEmail}
          onChangeText={setUserEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="メールアドレス"
        />

        <Text style={styles.displayName}>パスワード</Text>
        <TextInput
          style={styles.textInput}
          value={userPassword}
          onChangeText={setUserPassword}
          secureTextEntry
          placeholder="パスワード"
        />

        <TouchableOpacity style={styles.submit} onPress={signInWithEmail}>
          <Text style={styles.submitText}>ログイン</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.Googlebutton}
          onPress={signInWithGoogle}
        >
          <Image
            source={require("./../image/android_light_rd_SI.png")}
            style={styles.imageButton}
          />
        </TouchableOpacity>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <TouchableOpacity onPress={handleChangePassword}>
            <Text style={styles.linklabel}>パスワードを忘れた場合</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.noamllabel}>━━━ はじめての方はこちら ━━━</Text>

        <TouchableOpacity style={styles.button} onPress={navigateSignup}>
          <Text style={styles.buttonText}>新規アカウント作成</Text>
        </TouchableOpacity>
        <View style={styles.Back}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Image
              source={require("./../image/Left.png")}
              style={styles.actionButton}
            />
          </TouchableOpacity>
        </View>
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
  pagetitle: {
    fontSize: 24,
    height: 30,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "300",
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
  noamllabel: {
    fontSize: 15,
    margin: 10,
    textAlign: "center",
    fontWeight: "600",
    color: "#239D60",
  },
  linklabel: {
    fontSize: 15,
    margin: 10,
    width: "70%",
    textAlign: "center",
    textDecorationLine: "underline",
    color: "#1a0dab",
    fontWeight: "600",
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
  Googlebutton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F5C8",
    height: 50,
    margin: 10,
  },
  submit: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#239D60",
    height: 50,
    margin: 10, // ボタン間にスペースを追加
  },
  submitText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f2f2f2",
    textAlign: "center",
  },
  imageButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    height: 50, // 画像のサイズを指定
    width: 300,
    resizeMode: "contain", // 画像のリサイズ方法を指定
  },
  actionButton: {
    width: 30,
    height: 30,
    padding: 5,
    margin: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
  },
  backButton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    width: 70,
    height: 70,
    marginTop: 3, // ボタン間にスペースを追加
  },
  Back: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
