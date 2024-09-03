import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { Link, useRouter } from "expo-router";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

const auth = FirebaseAuth();
const router = useRouter();

GoogleSignin.configure({
  webClientId:
    "224298539879-t62hp3sk9t27ecupcds9d8aj29jr9hmm.apps.googleusercontent.com",
});

const LoginScreen = () => {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");

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
        .add({
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName,
        })
        .then()
        .catch((error) => console.log(error));
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
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={userEmail}
        onChangeText={setUserEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="email"
      />

      <TextInput
        style={styles.input}
        value={userPassword}
        onChangeText={setUserPassword}
        secureTextEntry
        placeholder="Password"
      />

      <Button title="LOGIN" style={styles.button} onPress={signInWithEmail} />

      <Button
        title="Googleでサインイン"
        style={styles.button}
        onPress={signInWithGoogle}
      />

      <Link href={{ pathname: "/" }} asChild>
        <Text style={styles.linklabel}>Forgot password?</Text>
      </Link>

      <Text style={styles.noamllabel}>Dont't have an account?</Text>

      <Link href={{ pathname: "/signupForm" }} asChild>
        <Button title="SIGN UP" style={styles.button} />
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    margin: 10,
    fontSize: 20,
    height: 40,
    borderBottomWidth: 2,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  noamllabel: {
    fontSize: 16,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "center",
  },
  linklabel: {
    fontSize: 16,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "center",
    textDecorationLine: "underline",
    color: "#1a0dab",
  },
  button: {
    padding: 8,
    backgroundColor: "black",
  },
  buttonText: {
    color: "white",
  },
});

export default LoginScreen;
