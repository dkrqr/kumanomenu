//10分毎にtoday()を実行するトリガーを立てる
//毎週日曜0時台に実行
function buildTenMinTriggerSS(){
  //長期休暇中などは先週の10分毎トリガーが残ってるかもしれないので消す
  deleteTenMinTriggerSS();
  
  var tenMinTrigger = ScriptApp.newTrigger("writeSpreadSheet")
                        .timeBased()
                        .everyMinutes(10)
                        .create();
  //トリガーのidを取得し，scriptPropertiesに記録
  var tenMinId = tenMinTrigger.getUniqueId();
  var scriptProp = PropertiesService.getScriptProperties();
  scriptProp.deleteProperty('tenMinIdSS');
  scriptProp.setProperty('tenMinIdSS',tenMinId);
  return;
}

//10分毎トリガーを削除
//today()の最後に実行
function deleteTenMinTriggerSS(){
  //トリガーscriptPropertiesから10分毎トリガーのidを取得
  var scriptProp = PropertiesService.getScriptProperties();
  var tenMinId = scriptProp.getProperty('tenMinIdSS');
  deleteTriggerById(tenMinId);
  return;
}


function buildTriggerForForm(){
  var scriptProp = PropertiesService.getScriptProperties();
  var formId = scriptProp.getProperty('formId');
  ScriptApp.newTrigger('writeSpreadSheetFromFrom')
  .forForm(formId)
  .onFormSubmit()
  .create();
  return;
}