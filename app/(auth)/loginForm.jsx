import React, { useState } from "react";
import { ScrollView, View, TouchableOpacity, Text, TextInput, Image, Button, StyleSheet } from "react-native";
import { Link, useRouter } from "expo-router";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useNavigation } from '@react-navigation/native';

const auth = FirebaseAuth();
const router = useRouter();

GoogleSignin.configure({
  webClientId:
    "224298539879-t62hp3sk9t27ecupcds9d8aj29jr9hmm.apps.googleusercontent.com",
});

const LoginScreen = () => {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");

  
  const navigation = useNavigation();

  const handleBackPress = () => {
    navigation.goBack(); // 前の画面に戻る
  };

  const signInWithGoogle = async () => {
    // Google のログイン画面を表示して認証用の ID トークンを取得する
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
      firestore()
        .collection("users")
        .doc(auth.currentUser.uid)
        .set({
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName,
          photoURL: auth.currentUser.photoURL,
        })
        .then()
        .catch((error) => console.log(error));

      firestore().collection("star").doc(auth.currentUser.uid).set({});
    }

    router.replace({ pathname: "/" });
  };

  const signInWithEmail = async () => {
    const credential = await auth.signInWithEmailAndPassword(
      userEmail,
      userPassword
    );

    router.replace({ pathname: "/" });
  };

  return (
    <ScrollView>
    <View style={styles.container}>
      <Text style={styles.pagetitle}>LOGIN</Text>
      <Text style={styles.displayName}>Email</Text>
      <TextInput
        style={styles.textInput}
        value={userEmail}
        onChangeText={setUserEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="email"
      />

      <Text style={styles.displayName}>Password</Text>
      <TextInput
        style={styles.textInput}
        value={userPassword}
        onChangeText={setUserPassword}
        secureTextEntry
        placeholder="Password"
      />

      <TouchableOpacity style={styles.submit} onPress={signInWithEmail}>
        <Text style={styles.submitText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.buttonCenter}>
        <TouchableOpacity style={styles.Googlebutton} onPress={signInWithGoogle}>
          <Image source={require('./../image/android_neutral_sq_SI.png')} style={styles.imageButton} />
        </TouchableOpacity>
      </View>

      <Link href={{ pathname: "/" }} asChild>
        <Text style={styles.linklabel}>Forgot password?</Text>
      </Link>

      <Text style={styles.noamllabel}>Don't have an account?</Text>



      <Link href={{ pathname: "/signupForm" }} asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>SIGN UP</Text>
        </TouchableOpacity>
      </Link>
      
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Text style={styles.backButtonText}>{'<'} Back</Text>
      </TouchableOpacity>

    </View></ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  pagetitle: {
    fontSize: 30,
    textAlign: 'center',
    fontWeight: '300',
  },
  displayName: {
    fontSize: 15,
    marginTop: 20,
    marginLeft: 10,
    textAlign: "left",
    alignItems: 'flex-start',
    fontWeight: '300',
  },
  textInput: {
    margin: 10,
    marginTop: 0,
    fontSize: 20,
    height: 40,
    borderBottomWidth: 2,
    marginVertical: 16,
    color: "black",
    fontWeight: '300',
  },
  noamllabel: {
    fontSize: 16,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "center",
    fontWeight: '300',
  },
  linklabel: {
    fontSize: 16,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "center",
    textDecorationLine: "underline",
    color: "#1a0dab",
    fontWeight: '600',
  },
  button: {
    justifyContent: 'center', // 画像をボタンの垂直方向の中央に揃える
    alignItems: 'center',     // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F2F2",
    height: 50,
    marginBottom: 10, // ボタン間にスペースを追加
  },
  buttonCenter: {
    flex: 1,
    justifyContent: 'center', // 垂直方向の中央揃え
    alignItems: 'center',     // 水平方向の中央揃え
  },
  Googlebutton: {
    justifyContent: 'center', // 画像をボタンの垂直方向の中央に揃える
    alignItems: 'center',     // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "#F2F2F2",
    height: 'auto',
    padding: 4,
    width: '65%',
    borderRadius: 5,
    justifyContent: 'center', // 垂直方向の中央揃え
    marginBottom: 10, // ボタン間にスペースを追加
  },
  submit: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',  
    height: 50,
    marginBottom: 10,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f2f2f2',
    textAlign: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: 'black',
    textAlign: 'center',
    fontWeight: '300',
  },
  imageButton: {
    height: 45,  // 画像のサイズを指定
    resizeMode: 'contain',  // 画像のリサイズ方法を指定
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
  },
  backButtonText: {
    fontSize: 18,
    color: 'black',
    textAlign: 'center',
    fontWeight: '300',
  },
});

export default LoginScreen;
