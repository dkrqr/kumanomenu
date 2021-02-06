/**
 * @param {string} triggerId 消したいtriggerのid
 * @return {void}
 */
function deleteTriggerById(triggerId){
  //すべてのトリガーを取得
  var triggers = ScriptApp.getProjectTriggers();
  //idを比較して一致すれば削除
  for(var i=0; i<triggers.length; i++){
    if(triggers[i].getUniqueId() == triggerId){
      ScriptApp.deleteTrigger(triggers[i]);
      return;
    }
  }
  return;
}