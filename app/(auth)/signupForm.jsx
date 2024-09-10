import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { Link, useRouter } from "expo-router";
import FirebaseAuth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const auth = FirebaseAuth();
const router = useRouter();

const SignupScreen = () => {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userPasswordVal, setUserPasswordVal] = useState("");
  const [userName, setUserName] = useState("");

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
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={userEmail}
        onChangeText={setUserEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="Email"
      />
      <TextInput
        style={styles.input}
        value={userName}
        onChangeText={setUserName}
        placeholder="Username"
      />
      <TextInput
        style={styles.input}
        value={userPassword}
        onChangeText={setUserPassword}
        secureTextEntry
        placeholder="Password"
      />
      <TextInput
        style={styles.input}
        value={userPasswordVal}
        onChangeText={setUserPasswordVal}
        secureTextEntry
        placeholder="Confirm Password"
      />

      <Button title="SIGN UP" style={styles.button} onPress={signUpWithEmail} />

      <Text style={styles.noamllabel}>Have an account?</Text>

      <Link href={{ pathname: "/loginForm" }} asChild>
        <Button title="LOGIN" style={styles.button} />
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
});

export default SignupScreen;
