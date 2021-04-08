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
 * @param {Integer} daysAfter 1:tomorrow,0:today
 * @return {array} tweet内容
 */
function tweetMenuSS(daysAfter) {
  //SSから情報を取得する関数
  var menuData = getMenufromSS(daysAfter);
  if(menuData.lunch1[0] == '' && menuData.lunch2[0] == '' && menu.dinner[0] == ''){
    return;
  }
  //よしなに成型する関数
  var stringArray = convertToString(menuData);
  //日付，昼食とかをつける
  var date = new Date();
  date.setDate(date.getDate() + daysAfter);
  var dateString = Utilities.formatDate(date, "JST", "MM月dd日");
  var asu;
  switch(daysAfter){
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
    　asu = daysAfter + '日後';
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
      return stringArray;
    }
  }
  return stringArray;
}

/**
 * メニューをSpreadsheetから読み取る
 * 
 * @param {Integer} daysAfter 0:today,1:tomorrow,...
 * @return {object} {unixtime:Number,lunch1:[],lunch1New:[],lunch2:[],lunch2New:[],dinner:[],dinnerNew:[]};
 */
function getMenufromSS(daysAfter){
  //dateからdataRowを算出
  var date = new Date(new Date().toDateString());
  date.setDate(date.getDate() + daysAfter);
  Logger.log(date);
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
  var range = sheet.getRange(dataRow,1,1,31);
  var menuArray = range.getValues();
  Logger.log(menuArray);
  var data = {unixtime:0,lunch1:[],lunch1New:[],lunch2:[],lunch2New:[],dinner:[],dinnerNew:[]};
  data.unixtime = date.valueOf();
  for(var i=0;i<5;i++){
    data.lunch1.push(menuArray[0][i*2+1]);
    data.lunch2.push(menuArray[0][i*2+11]);
    data.dinner.push(menuArray[0][i*2+21]);
    data.lunch1New.push(menuArray[0][i*2+2]=='🈟');
    data.lunch2New.push(menuArray[0][i*2+12]=='🈟');
    data.dinnerNew.push(menuArray[0][i*2+22]=='🈟');
  }
  Logger.log(data);
  return data;
}

/**
 * よしなに成型する
 * 
 * @param {object} data {unixtime:Number,lunch1:[],lunch1New:[],lunch2:[],lunch2New:[],dinner:[],dinnerNew:[]};
 * @return {array} 整形後の文字列の配列 0:lunch1,1:lunch2,2:dinner
 */
function convertToString(data){
  var stringArray = [];
  var string = '';
  for(var j = 0; j < 5; j++){
    if(data.lunch1[j] == ''){
      break;
    }
    if(data.lunch1[j].search(/除去可/) != -1){
      string = string.substr(0,string.length-1);
      string += '（卵入り：除去可）\n';
    }
    else if(data.lunch1[j].search(/除去不可/) != -1){
      string = string.substr(0,string.length-1);
      string += '（卵入り：除去不可）\n';
    }
    else{
      string += (data.lunch1New[j])?'🈟':'';
      string += data.lunch1[j] + '\n';
    }
  }
  stringArray.push(string);
  string = '';
  for(var j = 0; j < 5; j++){
    if(data.lunch2[j] == ''){
      break;
    }
    if(data.lunch2[j].search(/除去可/) != -1){
      string = string.substr(0,string.length-1);
      string += '（卵入り：除去可）\n';
    }
    else if(data.lunch2[j].search(/除去不可/) != -1){
      string = string.substr(0,string.length-1);
      string += '（卵入り：除去不可）\n';
    }
    else{
      string += (data.lunch2New[j])?'🈟':'';
      string += data.lunch2[j] + '\n';
    }
  }
  stringArray.push(string);
  string = '';
  for(var j = 0; j < 5; j++){
    if(data.dinner[j] == ''){
      break;
    }
    if(data.dinner[j].search(/除去可/) != -1){
      string = string.substr(0,string.length-1);
      string += '（卵入り：除去可）\n';
    }
    else if(data.dinner[j].search(/除去不可/) != -1){
      string = string.substr(0,string.length-1);
      string += '（卵入り：除去不可）\n';
    }
    else{
      string += (data.dinnerNew[j])?'🈟':'';
      string += data.dinner[j] + '\n';
    }
  }
  stringArray.push(string);
  string = '';
  
  return stringArray;
}

/**
 * 1週間分のメニューをつぶやく
 * 
 * @param {array} menuData {unixtime:(msec),lunch1:[(string)],lunch2:[(string)],dinner:[(string)]}
 * @return {array} [{unixtime:(msec),lunch1:[(string)],lunch2:[(string)],dinner:[(string)]}]
 */
function tweetWeekMenu(menuData){
  var result = '';
  var content = '今週のメニュー\n';
  for(var i=0;i<menuData.length;i++){
    var date = new Date(menuData[i].unixtime);
    content += Utilities.formatDate(date,'JST','MM月dd日');
    switch(date.getDay()){
      case 0: content += '(日)'; break;
      case 1: content += '(月)'; break;
      case 2: content += '(火)'; break;
      case 3: content += '(水)'; break;
      case 4: content += '(木)'; break;
      case 5: content += '(金)'; break;
      case 6: content += '(土)'; break;
      default: break;
    }
    content += '\n[昼食1] ' + ((menuData[i].lunch1 == null)?'なし':menuData[i].lunch1[0]) + 
               '\n[昼食2] ' + ((menuData[i].lunch2 == null)?'なし':menuData[i].lunch2[0]) +
               '\n[夕食] '  + ((menuData[i].dinner == null)?'なし':menuData[i].dinner[0]);
    result = postLongTweet(content,result);
    if(result.getResponseCode() != 200){
      console.log(content + "を送信できませんでした");
      return 1;
    }
    content = '';
  }
}