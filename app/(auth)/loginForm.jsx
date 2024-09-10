import React, { useState } from "react";
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
    const user = await GoogleSignin.signIn();
    const idToken = user.idToken;

    if (idToken === null) {
      return;
    }

    const credential = FirebaseAuth.GoogleAuthProvider.credential(idToken);
    await auth.signInWithCredential(credential);

    const querySnapshot = await firestore()
      .collection("users")
      .where("uid", "==", auth.currentUser.uid)
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

      <Text style={styles.noamllabel}>Don't have an account?</Text>

      <Link href={{ pathname: "/signupForm" }} asChild>
        <Button title="SIGN UP" style={styles.button} />
      </Link>

      {/* ホームに戻るボタンを追加 */}
      <View style={styles.homeButtonContainer}>
        <Button
          title="ホームに戻る"
          onPress={() => router.push("/")}
          color="#841584"
        />
      </View>
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
  homeButtonContainer: {
    marginTop: 20,
    padding: 8,
  },
  buttonText: {
    color: "white",
  },
});

export default LoginScreen;
