import {
  View,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
} from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import storage from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import FirebaseAuth from "@react-native-firebase/auth";

//画像のサイズを固定
const { width } = Dimensions.get("window"); //画面サイズを取得
const imageWidth = width * 0.75; // 画面幅の75%
const imageHeight = (imageWidth * 4) / 3; // 3:4のアスペクト比を維持
const auth = FirebaseAuth();

export default function test() {
  const [text, setText] = useState(""); // テキスト入力を保持するための状態
  const [post, setPost] = useState(""); //場所の名前を保持する

  const reference = storage();    //storage()関数を呼び出して、Firebaseストレージのインスタンスを取得
  //storage()関数はFirebaseのストレージサービスにアクセスするための関数
  const router = useRouter();     //ルーターにアクセスするための変数
  const params = useLocalSearchParams();  //別のページから送られた値が入る。
  const { imageUri, latitude, longitude, spotId } = params; //別ページから送られた値が入る。

  const uploadPost = async () => {
    // 写真をstorageに格納
    const randomNumber = Math.floor(Math.random() * 100) + 1;   //1～100の数字をランダムに生成する
    const imagePath =
      "photo/image-" + new Date().getTime().toString() + randomNumber;  //現在の時間とさっきのランダムな数字を合わせて画像ファイルを作成
    await reference.ref(imagePath).putFile(imageUri);//ファイルをアップロード
    console.log(auth.currentUser.uid);

    // メイン画面の投稿であれば、現在地のスポットを追加
    if (spotId == 0) {  //スポットidが0であれば
      const querySnapshot = await firestore()
        .collection("spot") //spotテーブルから
        .orderBy("id", "desc")  //idを降順に並び替えて
        .get(); //取り出す

      const maxId = querySnapshot.docs[0].data().id + 1;  //降順に並び替えて取得したスポットidの0番地目、つまり一番でけぇスポットidのプラス１を取得

      firestore().collection("spot").add({  //新しいスポットの追加
        id: maxId,  //idをさっき作成したでけぇidにプラス1した値にする
        mapLatitude: latitude,  //緯度
        mapLongitude: longitude,  //経度
        name: text, //テキスト
        areaRadius: 50, //範囲
      });

      const queryPost = await firestore()
        .collection("post")   //postテーブルから
        .orderBy("id", "desc")  //idを降順に
        .get();

      const maxPostId = queryPost.docs[0].data().id + 1;  //最新投稿のidを作成

      firestore()
        .collection("photo")  //photoテーブルに追加
        .add({
          imagePath: imagePath, //画像パス
          postId: maxPostId,  //さっきのid
          spotId: maxId,  //新しく作成したスポット
          userId: auth.currentUser.uid, //投稿ユーザー
        })
        .then() //追加終了合図
        .catch((error) => console.log(error));  //エラー

      firestore()
        .collection("post") //postテーブルに追加
        .add({
          id: maxId,  //さっきと同じid
          postTxt: post,  //投稿内容
          spotId: maxId,  //最新スポット
          userId: auth.currentUser.uid, //ユーザーid
        })
        .then() //終了合図
        .catch((error) => console.log(error));  //エラー
    } else {  //spotidが0でない(既存スポットへの投稿)
      console.log(imagePath, spotId);
      firestore()
        .collection("photo")  //photoテーブルに追加
        .add({
          imagePath: imagePath, //イメージパス
          spotId: parseInt(spotId), //int型に変換して受け取ったスポットid
          userId: auth.currentUser.uid, //ユーザーid
        })
        .then() //終了合図
        .catch((error) => console.log(error));  //エラー

      firestore()
        .collection("post") //postテーブルに追加
        .add({
          postTxt: post,  //投稿
          spotId: parseInt(spotId), //スポットid
          userId: auth.currentUser.uid, //ユーザーid
        })
        .then() //おわり
        .catch((error) => console.log(error));    //えら
    }

    router.replace({ pathname: "/" });  //routerのreplace メソッドにを使うと戻るボタンを押したときにこのページに戻ってくることはなくなる
                                        // "/"はホーム画面を表す
  };

  return (
    <View style={{ flex: 1 }} /*すべての親コンポーネント*/>
      <Image source={{ uri: imageUri }} style={styles.imageContainer} /*さっき撮影された画像を表示*//>
      {spotId == 0 ? (  //スポットidが0(新規スポットへ投稿)なら
        <TextInput
          style={styles.textbox}  
          placeholder="場所の名前を入力"  //スポットの名前を入力させる
          maxLength={30} // 文字数制限を30文字に設定
          onChangeText={setText}
          value={text}
        />
      ) : (
        <></>
      )}
      <TextInput
        style={styles.textbox}
        placeholder="投稿の文章を入力"  //投稿の文章
        onChangeText={setPost}
        value={post}
      />
      <Pressable onPress={uploadPost} style={styles.uploadButton}/*投稿をアップロードする */ />
    </View>
  );
}

//スタイル
const styles = StyleSheet.create({
  imageContainer: {
    width: imageWidth,
    height: imageHeight,
    alignSelf: "center",
    marginTop: 20,
  },
  textbox: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 20,
    paddingHorizontal: 10,
    width: width * 0.6, // 画面幅の50%に設定
    marginLeft: 25, // 左寄せ
    marginTop: 25, // 上部の余白
  },
  uploadButton: {
    position: "absolute",
    alignSelf: "center",
    bottom: 50,
    right: 20,
    width: 75,
    height: 75,
    backgroundColor: "red",
    borderRadius: 75,
  },
});
