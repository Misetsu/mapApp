import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function myPage() {
  const router = useRouter();
  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };

  const termsText = `
EkatiihS（以下、「当社」といいます。）は、本モバイルアプリケーション上で提供するサービス（以下、「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。

第1条（個人情報）
「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。

第2条（個人情報の収集方法）
当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、クレジットカード番号、運転免許証番号などの個人情報をお尋ねすることがあります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を,当社の提携先（情報提供元、広告主、広告配信先などを含みます。以下、｢提携先｣といいます。）などから収集することがあります。

第3条（個人情報を収集・利用する目的）
当社が個人情報を収集・利用する目的は、以下のとおりです。

１．当社サービスの提供・運営のため
２．ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）
３．ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため
４．メンテナンス、重要なお知らせなど必要に応じたご連絡のため
５．利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため
６．ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため
７．有料サービスにおいて、ユーザーに利用料金を請求するため
８．上記の利用目的に付随する目的

第4条（位置情報の取扱い）

１．当社は、ユーザーが本サービスをご利用いただく際に、ユーザーの端末から送信される位置情報を取得することがあります。
２．位置情報の取得は、ユーザーが明示的に同意した場合に限り行われます。位置情報は、以下の目的で使用されます。
１．ユーザーに対して場所に基づいたサービスを提供するため
２．特定の位置でのみ利用できるコンテンツや機能の提供のため
３．ユーザーの利便性向上のためのマーケティング・分析のため
３．ユーザーは、端末の設定により、位置情報の取得を無効にすることができます。ただし、位置情報が無効になった場合、一部のサービスや機能が利用できなくなることがあります。
第5条（APIの利用）
１．当社は、本サービスの提供において、外部のAPIを使用してユーザーのデータを処理する場合があります。APIを通じて収集・利用される情報には、以下の目的があります。
１．本サービスの機能を実現するため
２．ユーザーの要求に基づくデータの取得・提供のため
３．提携先とのデータ連携により、ユーザー体験を向上させるため
２．当社が利用するAPIは、ユーザーの個人情報を保護するために十分なセキュリティ対策を講じたものであり、利用目的の範囲内でのみ情報を利用します。

第6条（利用目的の変更）
１．当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。
２．利用目的の変更を行った場合には、変更後の目的について、当社所定の方法により、ユーザーに通知し、または本サービス上に公表するものとします。

第7条（個人情報の第三者提供）
１．当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
１．人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき
２．公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき
３．国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき
４．予め次の事項を告知あるいは公表し、かつ当社が個人情報保護委員会に届出をしたとき
１．利用目的に第三者への提供を含むこと
２．第三者に提供されるデータの項目

３．第三者への提供の手段または方法
４．本人の求めに応じて個人情報の第三者への提供を停止すること
５．本人の求めを受け付ける方法

２．前項の定めにかかわらず、次に掲げる場合には、当該情報の提供先は第三者に該当しないものとします。
１．当社が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合
２．合併その他の事由による事業の承継に伴って個人情報が提供される場合
３．個人情報を特定の者との間で共同して利用する場合であって、その旨並びに共同して利用される個人情報の項目、共同して利用する者の範囲、利用する者の利用目的および当該個人情報の管理について責任を有する者の氏名または名称について、あらかじめ本人に通知し、または本人が容易に知り得る状態に置いた場合

第8条（個人情報の開示）
１．当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。なお、個人情報の開示に際しては、1件あたり1、000円の手数料を申し受けます。
１．本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合
２．当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合
３．その他法令に違反することとなる場合
２．前項の定めにかかわらず、履歴情報および特性情報などの個人情報以外の情報については、原則として開示いたしません。

第9条（個人情報の訂正および削除）
１．ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除（以下、「訂正等」といいます。）を請求することができます。
２．当社は、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。
３．当社は、前項の規定に基づき訂正等を行った場合、または訂正等を行わない旨の決定をしたときは遅滞なく、これをユーザーに通知します。

第10条（個人情報の利用停止等）
１．当社は、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下、「利用停止等」といいます。）を求められた場合には、遅滞なく必要な調査を行います。
２．項の調査結果に基づき、その請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の利用停止等を行います。
３．当社は、前項の規定に基づき利用停止等を行った場合、または利用停止等を行わない旨の決定をしたときは、遅滞なく、これをユーザーに通知します。
４．前2項にかかわらず、利用停止等に多額の費用を有する場合その他利用停止等を行うことが困難な場合であって、ユーザーの権利利益を保護するために必要なこれに代わるべき措置をとれる場合は、この代替策を講じるものとします。

第11条（プライバシーポリシーの変更）
１．本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。
２．当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。

第12条（お問い合わせ窓口）
本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。

チーム名：EkatiihS
Eメールアドレス：ekatiihs@gmail.com

以上


  `;

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.pagetitle}>プライバシーポリシー</Text>
        <Text style={{ fontSize: 16, lineHeight: 24 }}>{termsText}</Text>
        <View style={styles.Back}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Image
              source={require("./../image/Left_arrow.png")}
              style={styles.actionButton}
            />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", // 横並びにする
    alignItems: "center", // 縦方向の中央揃え
    justifyContent: "space-between", // アイコンを左端に配置
    flex: 1,
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
  iconButton: {
    width: 50, // 横幅を設定
    height: 50, // 高さを設定
    justifyContent: "center", // 縦中央揃え
    alignItems: "center", // 横中央揃え
  },

  pagetitle: {
    fontSize: 24,
    height: 30,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "300",
    color: "#000000",
  },
  container: {
    flex: 1,
    padding: 20,
  },
});
