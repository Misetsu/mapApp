import React, { useState } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";
import { Link, useRouter } from "expo-router";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/FontAwesome5";
import CheckBox from '@react-native-community/checkbox';

const auth = FirebaseAuth();

export default function SignupScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userPasswordVal, setUserPasswordVal] = useState("");
  const [userName, setUserName] = useState("");
  const [isChecked, setIsChecked] = useState(false);

  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };

  const navigateLogin = () => {
    router.push("/loginForm");
  };


  const signUpWithEmail = async () => {
    try {
      await auth.createUserWithEmailAndPassword(userEmail, userPassword);

      const credential = await auth.signInWithEmailAndPassword(
        userEmail,
        userPassword
      );

      const update = {
        displayName: userName,
      };

      await auth.currentUser.updateProfile(update);

      firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .set({
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName,
          email: auth.currentUser.email,
          lastPostAt: "0", // TODO
          publicStatus: 0, // TODO
          spotCreate: 0,
          spotPoint: 0,
          photoURL:
            "https://firebasestorage.googleapis.com/v0/b/mapapp-96457.appspot.com/o/profile%2Fphoto17256005513463?alt=media&token=847894f6-3cb5-46c5-833e-91e30bc3ede8",
        })
        .then()
        .catch((error) => console.log(error));

      firestore().collection("star").doc(auth.currentUser.uid).set({});

      router.replace({ pathname: "/" });
    } catch (error) {
      console.error("Error signing up:", error);
    }
  };

  return (
    <ScrollView style={styles.scrview}>
      <View style={styles.container}>
        <Text style={styles.pagetitle}>アカウント作成</Text>

        <Text style={styles.displayName}>メールアドレス</Text>
        <TextInput
          style={styles.textInput}
          value={userEmail}
          onChangeText={setUserEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="メールアドレス"
        />
        <Text style={styles.noamllabel}>有効なメールアドレスを入力してください</Text>
        <Text style={styles.displayName}>ユーザー名</Text>
        <TextInput
          style={styles.textInput}
          value={userName}
          onChangeText={setUserName}
          placeholder="ユーザー名"
        />
        <Text style={styles.noamllabel}>ユーザー名{"(名前)"}を入力してください</Text>
        <Text style={styles.displayName}>パスワード</Text>
        <TextInput
          style={styles.textInput}
          value={userPassword}
          onChangeText={setUserPassword}
          secureTextEntry
          placeholder="パスワード"
        />
        <Text style={styles.noamllabel}>半角英数8文字以上で入力してください</Text>
        <Text style={styles.displayName}>確認用パスワード</Text>
        <TextInput
          style={styles.textInput}
          value={userPasswordVal}
          onChangeText={setUserPasswordVal}
          secureTextEntry
          placeholder="確認用パスワード"
        />
        <Text style={styles.noamllabel}>もう一度同じパスワードを入力してください</Text>

        <View style={styles.checkboxContainer}>
          <CheckBox
            value={isChecked}
            onValueChange={setIsChecked}
            tintColors={{ true: '#239D60', false: '#239D60' }} // チェックボックスの色
            style={styles.checkbox} // サイズ変更用のスタイル
          /><Text style={styles.noamllabel}>利用規約、プライバシーポリシー{"\n"}をすべて読み、同意します
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.submit, !isChecked && styles.disabledButton]}
          onPress={signUpWithEmail}
          disabled={!isChecked}>
          <Text style={styles.submitText}>アカウント作成</Text>
        </TouchableOpacity>

        <Text style={styles.noamllabel}>━  アカウントをお持ちの方はこちら  ━</Text>

        <TouchableOpacity style={styles.button} onPress={navigateLogin}>
          <Text style={styles.buttonText}>ログイン</Text>
        </TouchableOpacity>

        <View style={styles.Back}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Icon name="angle-left" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  scrview: {
    flex:1,
    backgroundColor: "#F2F5C8",
  },
  pagetitle: {
    fontSize: 30,
    height: 70,
    marginTop: 0,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // 中央揃え
    margin: 10,
  },
  checkbox: {
    width: 30, // サイズを少し大きく
    height: 30,
    padding: 10,
    marginRight: 10,
  },
  disabledButton: {
    backgroundColor: 'gray',
  },
});
