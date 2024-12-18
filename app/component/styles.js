// styles.js
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  radius: {
    width: 50,
    height: 50,
    borderRadius: 50 / 2,
    overflow: "hidden",
    backgroundColor: "rgba(0, 112, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(0, 112, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 20,
    height: 20,
    borderWidth: 3,
    borderColor: "white",
    borderRadius: 20 / 2,
    overflow: "hidden",
    backgroundColor: "#007AFF",
  },
  spot: {
    width: 20,
    height: 20,
    borderWidth: 3,
    borderColor: "white",
    borderRadius: 20 / 20,
    overflow: "hidden",
    backgroundColor: "#c71585",
  },
  container: {
    width: "100%",
    height: "100%",
  },
  map: {
    flex: 1,
  },
  debugContainer: {
    backgroundColor: "#fff",
    opacity: 0.8,
    position: "absolute",
    bottom: 10,
    left: 10,
    padding: 10,
  },
  errorContainer: {
    position: "absolute",
    top: 85,
    left: 0,
    right: 0,
    backgroundColor: "red",
    padding: 10,
  },
  errorText: {
    color: "#fff",
    textAlign: "center",
  },
  markerImage: {
    width: 50,
    height: 50,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
  },
  mapbutton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 10,
  },
  mapbuttonImage: {
    width: 30,
    height: 30,
    alignSelf: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  footer: {
    justifyContent: "center",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F2F5C8",
    width: "100%",
    paddingLeft: 10,
    paddingRight: 10,
  },
  footerbutton: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    width: 70,
    height: 70,
  }, //インデックスバー上の画像
  footerImage: {
    width: 35,
    height: 35,
    alignSelf: "center",
  },//インデックスバー上の画像
  closeImage: {
    width: 30,
    height: 30,
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "#239D60",
    backgroundColor: "#f2f5c8",
    margin:2,
    marginLeft:5,
    marginRight:5,
  },
  mapfixed: {
    position: "absolute",
    top: 125,
    right: 0,
  },
  defaultlocation: {
    position: "absolute",
    top: 185,
    right: 0,
  },
  mapZoom: {
    position: "absolute",
    top: 245,
    right: 0,
  },
  mapZoomout: {
    position: "absolute",
    top: 305,
    right: 0,
  },
  indexContainer: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: 85,
    backgroundColor: "#F2F5C8",
    paddingTop: 5,
    paddingBottom: 5,
    justifyContent: "center",
    display: "flex",
    flexDirection: "row",
  },
  tagContainer: {
    position: "absolute",
    top: 85,
    width: "100%",
    paddingTop: 5,
    paddingBottom: 5,
    justifyContent: "space-between",
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.75)",
  },
  tag: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderRadius: 20,
    borderColor: "#239D60",
    flexDirection: "row",
    gap: 5,
    marginHorizontal: 2,
    backgroundColor: "#F2F5C8",
  },
  selectedTag: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderRadius: 20,
    borderColor: "#239D60",
    flexDirection: "row",
    gap: 5,
    marginHorizontal: 2,
    backgroundColor: "#A3DE83",
  },
  TagButton: {
    width: 20,
    height: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
  },
  userList: {
    display: "flex",
    flexDirection: "column",
  },
  //インデックスバー上の画像
  listProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignSelf: "center",
    marginTop: 5,
  },
  //インデックスバーアイコンの幅
  listProfileNameText: {
    width: "100%",
    fontSize: 12,
    textAlign: "center",
  },
  listProfileSize: {
    margin: 5,
    width: 50,
  },
  listProfileIndexButton: {
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    width: 70,
    height: 70,
  },
  newButtonContainer: {
    alignItems: "center", // 新しいボタンを中央に配置
    bottom: 100,
  },
  roundButton: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 25, // ボタンを丸くするために大きめの値を指定
    width: 50, // ボタンの幅
    height: 50, // ボタンの高さ
    justifyContent: "center", // ボタン内のテキストを中央に配置
    alignItems: "center",
    marginBottom: 10, // ボタン間の余白
  },
  menuText: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    width: 125,
    padding: 8,
    borderRadius: 10,
  },
  menuTextHolder: {
    width: 125,
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center",
  },
  horizontalContainer: {
    justifyContent: "center", // 画像をボタンの垂直方向の中央に揃える
    alignItems: "center", // 画像をボタンの水平方向の中央に揃える
    flexDirection: "row",
    gap: 10,
  },
  buttonText: {
    color: "#fff", // テキストの色
    fontSize: 12,
  },
});

export { default as BorderStar } from "./../svg/BorderStar.svg";
export { default as Location } from "./../svg/Location.svg";
export { default as MapFixed } from "./../svg/MapFixed.svg";
export { default as MapUnFixed } from "./../svg/MapUnFixed.svg";
export { default as NewPost } from "./../svg/NewPost.svg";
export { default as Search } from "./../svg/Search.svg";
export { default as Setting } from "./../svg/Setting.svg";
export { default as User } from "./../svg/User.svg";
export { default as Uers } from "./../svg/Users.svg";

export const customMapStyle = [
  {
    featureType: "poi.business", // ビジネス（ビル、店舗など）のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.business", // ビジネス（ビル、店舗など）のアイコンを非表示
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.attraction", // 観光スポットのラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.government", // 政府機関のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.medical", // 医療施設のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.park", // 公園のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.place_of_worship", // 宗教施設のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.school", // 学校のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "poi.sports_complex", // スポーツ施設のラベルを非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "road", // 道路の号線表示を非表示
    elementType: "labels",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.locality", // 町、村、区のラベルを非表示
    elementType: "labels.text.fill",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.locality", // 町、村、区のラベルのアウトラインを非表示
    elementType: "labels.text.stroke",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.neighborhood", // 住所（丁目）のラベルを非表示
    elementType: "labels.text.fill",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.neighborhood", // 住所（丁目）のラベルのアウトラインを非表示
    elementType: "labels.text.stroke",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },

  //ここから地図の色
  {
    featureType: "landscape.natural", // 自然地形の色
    elementType: "geometry",
    stylers: [
      {
        color: "#A3DE83",
      },
    ],
  },
  {
    featureType: "landscape.man_made", //地面の色
    elementType: "geometry",
    stylers: [
      {
        color: "#A3DE83",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [
      {
        color: "#90CDFF", // 水の色を青色に変更
      },
    ],
  },
  {
    featureType: "road", //  一般道の色
    elementType: "geometry",
    stylers: [
      {
        color: "#E8E8A6",
      },
    ],
  },
  {
    featureType: "road", // 一般道の枠線
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#239D60",
        weight: 2,
      },
    ],
  },
  {
    featureType: "road.highway", // 高速道路の色
    elementType: "geometry",
    stylers: [
      {
        color: "#E8E8A6",
      },
    ],
  },
  {
    featureType: "road.highway", // 高速道路の枠線の色
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#239D60",
        weight: 2,
      },
    ],
  },
  {
    featureType: "poi.park", // 公園の色
    elementType: "geometry",
    stylers: [
      {
        color: "#F2F5C8",
      },
    ],
  },
  {
    featureType: "transit.line", // 鉄道の色
    elementType: "geometry",
    stylers: [
      {
        color: "#1A73E8",
        weight: 2,
      },
    ],
  },
  {
    featureType: "transit.line", // 鉄道の枠線の太さ
    elementType: "geometry.stroke",
    stylers: [
      {
        color: "#ffffff",
        weight: 2,
      },
    ],
  },
  {
    featureType: "poi.school", // 教育機関の色
    elementType: "geometry",
    stylers: [
      {
        color: "#F2F5C8",
      },
    ],
  },
  {
    // 医療機関の背景色を指定
    featureType: "poi.medical",
    elementType: "geometry",
    stylers: [
      {
        color: "#F2F5C8",
      },
    ],
  },
];
