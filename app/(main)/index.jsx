import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

const App = () => {
  const [showButtons, setShowButtons] = useState(false); // ボタン表示状態
  const fadeAnim = useRef(new Animated.Value(0)).current; // フェードアニメーションの初期値

  // ボタンを表示してフェードイン
  const showAnimatedButtons = () => {
    setShowButtons(true);
    Animated.timing(fadeAnim, {
      toValue: 1, // 完全に表示
      duration: 500, // 0.5秒でフェードイン
      useNativeDriver: true,
    }).start();
  };

  // 新しいボタン1を押したときにボタンをフェードアウトして非表示
  const hideButtons = () => {
    Animated.timing(fadeAnim, {
      toValue: 0, // 完全に非表示
      duration: 500, // 0.5秒でフェードアウト
      useNativeDriver: true,
    }).start(() => {
      setShowButtons(false); // フェードアウト完了後にボタンを非表示
    });
  };

  return (
    <View style={styles.container}>
      {/* 新しいボタンを表示 */}
      {showButtons && (
        <Animated.View style={[styles.newButtonContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.roundButton} onPress={hideButtons}>
            <Text style={styles.buttonText}>新しいボタン 1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundButton} onPress={() => {}}>
            <Text style={styles.buttonText}>新しいボタン 2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundButton} onPress={() => {}}>
            <Text style={styles.buttonText}>新しいボタン 3</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* 最初のボタン */}
      <View style={styles.bottomButton}>
        <TouchableOpacity style={styles.roundButton} onPress={showAnimatedButtons}>
          <Text style={styles.buttonText}>最初のボタン</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end', // 最初のボタンを画面下部に配置
  },
  bottomButton: {
    marginBottom: 20, // 画面下部に余白を追加
    alignItems: 'center',
  },
  newButtonContainer: {
    alignItems: 'center', // 新しいボタンを中央に配置
  },
  roundButton: {
    backgroundColor: '#007AFF', // ボタンの背景色
    borderRadius: 50,           // ボタンを丸くするために大きめの値を指定
    width: 100,                 // ボタンの幅
    height: 100,                // ボタンの高さ
    justifyContent: 'center',   // ボタン内のテキストを中央に配置
    alignItems: 'center',
    marginBottom: 10,           // ボタン間の余白
  },
  buttonText: {
    color: '#fff',              // テキストの色
    fontSize: 16,
  },
});

export default App;
