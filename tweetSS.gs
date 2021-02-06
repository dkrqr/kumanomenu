//人力での入力はgoogle form?にする。
//formは曜日ごとにページを変えて，各ページに3問。長文形式。
//入力を検出できるので，同時に新メニュー判定・tweet・トリガー削除を行う
//各食のメインメニューを1週間分呟いてもよさそう

function todaySS(){
  tweetMenuSS(0);
}
function tomorrowSS(){
  tweetMenuSS(1);
}

/**
 * メニューをSpreadsheetから読み取ってtweetする
 * 毎日8時半に今日，21時半に明日をtweet
 * 
 * @param {Integer} tomorrow 1:tomorrow,0:today
 * @return
 */
function tweetMenuSS(tomorrow) {
  //SSから情報を取得する関数
  var menuArray = getMenufromSS(tomorrow);
  if(menuArray[0][0] == '' && menuArray[0][10] == '' && menuArray[0][20] == ''){
    return 0;
  }
  //よしなに成型する関数
  var stringArray = convertToString(menuArray);
  //日付，昼食とかをつける
  var date = new Date();
  date.setDate(date.getDate() + tomorrow);
  var dateString = Utilities.formatDate(date, "JST", "MM月dd日");
  var asu;
  switch(tomorrow){
    case 0:
      asu = '今日';
      break;
    case 1:
      asu = '明日';
      break;
    case 2:
      asu = '明後日';
      break;
    default:
    　asu = tomorrow + '日後';
      break;
  }
  Logger.log(stringArray);
  stringArray[0] = asu + '('+ dateString +')の #熊野寮食\n[昼食1]\n' + stringArray[0];
  if(stringArray[1] == ''){
    stringArray[1] = '2色メニューなし';
  }
  stringArray[1] = '[昼食2]\n' + stringArray[1];
  stringArray[2] = '[夕食]\n' + stringArray[2];
  //tweet
  var result;
  for(var i=0;i<3;i++){
    result = postLongTweet(stringArray[i],result);
    if(result.getResponseCode() != 200){
      console.log(stringArray[i] + "を送信できませんでした");
      return 1;
    }
  }
  return 0;
}

/**
 * メニューをSpreadsheetから読み取る
 * 
 * @param {Integer} daysAfter 0:today,1:tomorrow,...
 * @return {array} 今日のメニューの配列。SSからとったまま
 */
function getMenufromSS(daysAfter){
  //dateからdataRowを算出
  var date = new Date();
  date.setDate(date.getDate() + daysAfter);
  var thisYear = new Date(date.getFullYear() + '/01/01'); //今年のJan 01 00:00:00 GMT+09:00
  var elapsed = date.getTime() - thisYear.getTime(); //経過時間msec
  var dataRow = Math.floor(elapsed/1000/60/60/24) + 2; //除算で日数-1がでて，スプレッドシート2行目が1/1なので+2
  
  //SSのsheetを開いてdataRowをarrayで取得
  var scriptProperties = PropertiesService.getScriptProperties();
  var book = SpreadsheetApp.openById(scriptProperties.getProperty('sheetId'));
  var sheet = book.getSheetByName(date.getFullYear());
  
  if(!sheet){
    sheet = makeNewSheet(book);
  }
  var range = sheet.getRange(dataRow,2,1,30);
  var data = range.getValues();
  return data;
}

/**
 * よしなに成型する
 * 
 * @param {array} dataArray SSから読み取ったメニューの配列
 * @return {array} 整形後の文字列の配列
 */
function convertToString(dataArray){
  var stringArray = [];
  for(var i = 0; i < 3; i++){
    var string = '';
    for(var j = 0; j < 5; j++){
      if(dataArray[0][i*10+j*2] == ''){
        break;
      }
      if(dataArray[0][i*10+j*2].search(/除去可/) != -1){
        string = string.substr(0,string.length-1);
        string += '（卵入り：除去可）\n';
      }
      else if(dataArray[0][i*10+j*2].search(/除去不可/) != -1){
        string = string.substr(0,string.length-1);
        string += '（卵入り：除去不可）\n';
      }
      else{
        string += dataArray[0][i*10+j*2+1] + dataArray[0][i*10+j*2] + '\n';
      }
    }
    stringArray.push(string);
  }
  return stringArray;
}