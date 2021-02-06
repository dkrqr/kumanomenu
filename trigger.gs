//10分毎にtoday()を実行するトリガーを立てる
//毎週月曜8時台に実行
function buildTenMinTrigger(){
  //長期休暇中などは先週の10分毎トリガーが残ってるかもしれないので消す
  deleteTenMinTrigger();
  
  //propertyが空でなければ，すでにメニューが登録されているのでトリガーを立てない
  var menu = {};
  for(var i=0;i<3;i++){
    //script propertyに記録されているメニューを取得
    menu[i] = getMenuProp(i);
    if(menu[i]){
      return 1;
    }
  }
    
  var tenMinTrigger = ScriptApp.newTrigger("today")
                        .timeBased()
                        .everyMinutes(10)
                        .create();
  //トリガーのidを取得し，scriptPropertiesに記録
  var tenMinId = tenMinTrigger.getUniqueId();
  var scriptProp = PropertiesService.getScriptProperties();
  scriptProp.deleteProperty('tenMinId');
  scriptProp.setProperty('tenMinId',tenMinId);
  return 0;
}

//10分毎トリガーを削除
//today()の最後に実行
function deleteTenMinTrigger(){
  //トリガーscriptPropertiesから10分毎トリガーのidを取得
  var scriptProp = PropertiesService.getScriptProperties();
  var tenMinId = scriptProp.getProperty('tenMinId');
  deleteTriggerById(tenMinId);
  return 0;
}

function deleteTriggerById(triggerId){
  //すべてのトリガーを取得
  var triggers = ScriptApp.getProjectTriggers();
  //idを比較して一致すれば削除
  for(var i=0; i<triggers.length; i++){
    if(triggers[i].getUniqueId() == triggerId){
      ScriptApp.deleteTrigger(triggers[i]);
      return 0;
    }
  }
  return -1;
}