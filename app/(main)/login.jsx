import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from 'expo-router';
import auth from '@react-native-firebase/auth';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
      // ログインに成功したらマップ画面に遷移
      navigation.navigate('index');
    } catch (error) {
      console.error('Error logging in:', error);
      Alert.alert('Error logging in:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder='Email'
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder='Password'
      />
      <Button
        title="LOGIN"
        onPress={handleLogin}
        style={styles.button}
      />

      <Text
        style={styles.linklabel}
        onPress={() => navigation.navigate('index')}>
        Forgot password?
      </Text>
      
      <Text
        style={styles.noamllabel}>
        Don't have an account?
      </Text>

      <Button
        title="SIGN UP"
        onPress={() => navigation.navigate('sign_up')}
        style={styles.button}
      />
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
    textAlign: 'center'
  },
  linklabel: {
    fontSize: 16,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: 'center',
    textDecorationLine: 'underline',
    color: '#1a0dab'
  },
  button: {
    marginTop: 10,
  }
});

export default LoginScreen;
