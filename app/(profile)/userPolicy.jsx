import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";

export default function myPage() {
  const router = useRouter();
  const handleBackPress = () => {
    router.back(); // 前の画面に戻る
  };

  const termsText = `
この利用規約（以下、「本規約」といいます。）は、EkatiihS（以下、「当社」といいます。）が提供するサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下、「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。

第1条（適用）
１．本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。
２．当社は本サービスに関し、本規約のほか、ご利用にあたってのルール等、各種の定め（以下、「個別規定」といいます。）をすることがあります。これら個別規定はその名称のいかんに関わらず、本規約の一部を構成するものとします。
３．本規約の規定が前条の個別規定の規定と矛盾する場合には、個別規定において特段の定めなき限り、個別規定の規定が優先されるものとします。

第2条（利用登録）
１．本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
２．当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
１．利用登録の申請に際して虚偽の事項を届け出た場合
２．本規約に違反したことがある者からの申請である場合
３．その他、当社が利用登録を相当でないと判断した場合

第3条（ユーザーIDおよびパスワードの管理）
１．ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。
２．ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。当社は、ユーザーIDとパスワードの組み合わせが登録情報と一致してログインされた場合には、そのユーザーIDを登録しているユーザー自身による利用とみなします。
３．ユーザーID及びパスワードが第三者によって使用されたことによって生じた損害は、当社に故意又は重大な過失がある場合を除き、当社は一切の責任を負わないものとします。

第4条（投稿写真の取り扱い）
１．投稿された写真の著作権は、投稿者自身に帰属します。ただし、当サービスは投稿された写真を利用して宣伝やプロモーションを行う権利を有します。
２．投稿された写真の内容については、投稿者自身が責任を負うものとし、当サービスは一切の責任を負いません。第三者との間で紛争やトラブルが発生した場合、投稿者が自己の責任において対応するものとします。
３．著作権や肖像権、プライバシー権等の他者の権利を侵害する行為、または法律に反する行為は禁止されています。
４．公序良俗に反する写真の投稿は、事前の通知なく削除する場合があります。


第5条（位置情報の取り扱い）
１．本サービスでは、ユーザーが許可した場合に限り、ユーザーの位置情報を取得および利用することがあります。
２．位置情報は、以下の目的に使用されます。
本サービスにおける位置ベースの機能提供（例: 近隣スポットの表示、位置に関連したコンテンツの表示など）。
ユーザーの利便性を向上させるための機能改善。
３．取得した位置情報は、第三者へ提供されることはありません。ただし、以下の場合はこの限りではありません。
１．法令に基づく場合。
２．人の生命、身体または財産の保護のために必要がある場合であって、ユーザーの同意を得ることが困難である場合。
４．位置情報の取得は、ユーザーがデバイスの設定でいつでも無効にすることができますが、その場合、一部の機能が利用できなくなる可能性があります。

第6条（APIの使用）
１．本サービスは、外部のAPIサービス（以下「外部API」といいます）を利用しており、これに関連するサービスの提供にあたり、外部APIプロバイダの提供するサービスに依存することがあります。
２．当社は、外部APIの提供者が提供するサービス内容、機能、可用性、及びその変更・停止について一切の責任を負いません。
３．外部APIの利用に際しては、ユーザーは各外部API提供者の利用規約及びプライバシーポリシーに従うものとし、外部APIの利用によって生じた損害について、当社は一切責任を負わないものとします。
４．外部APIを通じて取得されたデータの利用は、サービス提供上必要な範囲に限られ、ユーザーの同意がない限り第三者へ提供されることはありません。
５．当社は、外部APIに起因する障害やエラーにより、本サービスの一部が提供できない場合、これに伴う一切の損害について責任を負わないものとします。


第7条（利用料金および支払方法）
１．ユーザーは、本サービスの有料部分の対価として、当社が別途定め、本ウェブサイトに表示する利用料金を、当社が指定する方法により支払うものとします。
２．ユーザーが利用料金の支払を遅滞した場合には、ユーザーは有料コンテンツの使用が停止されます。

第8条（禁止事項）
１．ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
法令または公序良俗に違反する行為
２．犯罪行為に関連する行為
３．本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為
４．当社、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為
５．本サービスによって得られた情報を商業的に利用する行為
６．当社のサービスの運営を妨害するおそれのある行為
７．不正アクセスをし、またはこれを試みる行為
８．他のユーザーに関する個人情報等を収集または蓄積する行為
９．不正な目的を持って本サービスを利用する行為
１０．本サービスの他のユーザーまたはその他の第三者に不利益、損害、不快感を与える行為
１１．他のユーザーに成りすます行為
１２．当社が許諾しない本サービス上での宣伝、広告、勧誘、または営業行為
１３．面識のない異性との出会いを目的とした行為
１４．当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為
１５．その他、当社が不適切と判断する行為

第9条（本サービスの提供の停止等）
１．当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
１．本サービスにかかるコンピュータシステムの保守点検または更新を行う場合
２．地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合
３．コンピュータまたは通信回線等が事故により停止した場合
４．その他、当社が本サービスの提供が困難と判断した場合

２．当社は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。

第10条（利用制限および登録抹消）
１．当社は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
１．本規約のいずれかの条項に違反した場合
２．登録事項に虚偽の事実があることが判明した場合
３．料金等の支払債務の不履行があった場合
４．当社からの連絡に対し、一定期間返答がない場合
５．本サービスについて、最終の利用から一定期間利用がない場合
６．その他、当社が本サービスの利用を適当でないと判断した場合
２．当社は、本条に基づき当社が行った行為によりユーザーに生じた損害について、一切の責任を負いません。

第11条（退会）
ユーザーは、当社の定める退会手続により、本サービスから退会できるものとします。

第12条（保証の否認および免責事項）
１．当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
２．当社は、本サービスに起因してユーザーに生じたあらゆる損害について、当社の故意又は重過失による場合を除き、一切の責任を負いません。ただし、本サービスに関する当社とユーザーとの間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
３．前項ただし書に定める場合であっても、当社は、当社の過失（重過失を除きます。）による債務不履行または不法行為によりユーザーに生じた損害のうち特別な事情から生じた損害（当社またはユーザーが損害発生につき予見し、または予見し得た場合を含みます。）について一切の責任を負いません。また、当社の過失（重過失を除きます。）による債務不履行または不法行為によりユーザーに生じた損害の賠償は、ユーザーから当該損害が発生した月に受領した利用料の額を上限とします。
４．当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。

第13条（サービス内容の変更等）
当社は、ユーザーへの事前の告知をもって、本サービスの内容を変更、追加または廃止することがあり、ユーザーはこれを承諾するものとします。

第14条（利用規約の変更）
１．当社は以下の場合には、ユーザーの個別の同意を要せず、本規約を変更することができるものとします。
１．本規約の変更がユーザーの一般の利益に適合するとき。
２．本規約の変更が本サービス利用契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他の変更に係る事情に照らして合理的なものであるとき。
２．当社はユーザーに対し、前項による本規約の変更にあたり、事前に、本規約を変更する旨及び変更後の本規約の内容並びにその効力発生時期を通知します。

第15条（個人情報の取扱い）
当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。

第16条（通知または連絡）
ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は,ユーザーから,当社が別途定める方式に従った変更届け出がない限り,現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い,これらは,発信時にユーザーへ到達したものとみなします。

第17条（権利義務の譲渡の禁止）
ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。

第18条（準拠法・裁判管轄）
１．本規約の解釈にあたっては、日本法を準拠法とします。
２．本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
以上


  `;

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.pagetitle}>利用規約</Text>
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