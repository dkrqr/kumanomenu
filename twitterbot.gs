function test(){
  postTweet("test");
}

var twitter = TwitterWebService.getInstance(
  PropertiesService.getScriptProperties().getProperty('ConsumerKey'),
  PropertiesService.getScriptProperties().getProperty('ConsumerSecret')
);

// 認証
function authorize() {
  twitter.authorize();
}

// 認証解除
function reset() {
  twitter.reset();
}

// 認証後のコールバック
function authCallback(request) {
  return twitter.authCallback(request);
}

/**
 * ユーザーのタイムラインを取得
 *
 * @param {string} screenName タイムラインを取得したいuserのscreenname
 * @param {string} sinceId このidのtweet以降のTLを取得(optional)
 * @param {string} maxId このid以前のTLを取得(optional)
 * @return {HTTPResponse} https://api.twitter.com/1.1/statuses/user_timeline.jsonをfetchした結果
 */
function getUserTimeline(screenName, sinceId, maxId) {
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/statuses/user_timeline.json'
                               + '?screen_name=' + screenName
                               + '&trim_user=true'
                               + '&count=200'
                               + (sinceId? ('&since_id=' + sinceId) : ('') )
                               + (maxId? ('&max_id=' + maxId) : (''))
  );
  response = JSON.parse(response);
  //Logger.log(response);
  return response;
}


// あるtweet以降のタイムラインを取得
function getUserTimelineSinceId(screenName,sinceId) {
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/statuses/user_timeline.json'
                               + '?screen_name=' + screenName
                               + '&trim_user=true'
                               + '&since_id=' + sinceId
  );
  response = JSON.parse(response);
  Logger.log(response);
  return response;
}

function modifyContent(content){
  //contentを修正
  var regExp = new RegExp("((https?|ftp):\/\/)?[-_a-zA-Z0-9]+\.[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+","g");
  var urlString = regExp.exec(content);
  var tweetLength = 140;
  while(urlString!=null){
    if(urlString.index <= tweetLength - 12){
      tweetLength+=urlString[0].length-12;
    }
    else if(urlString.index < tweetLength){
      tweetLength=urlString.index;
    }
    urlString = regExp.exec(content);
  }
  content=content.replace(/[死殺]/g,"○");
  content=content.replace(/fuck/gi,"f**k");
  var tweet = [content.substr(0,tweetLength),content.substr(tweetLength)];
  return tweet;
}

// ツイートを投稿
function postTweet(content) {
  content = modifyContent(content)[0];
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/statuses/update.json',
    {
    method: 'post',
    payload: {
      status: content
    },
    muteHttpExceptions:true
  });
  Logger.log(response);
  return response;
}

// リプライを投稿
function postReply(content, status) {
  var inReplyToStatusId;
  if(typeof(status) == "object"){
    status = JSON.parse(status);
    inReplyToStatusId = JSON.stringify(status["id_str"]);
  }
  if(typeof(inReplyToStatusId) == "string"){
    inReplyToStatusId = inReplyToStatusId.substr(1,inReplyToStatusId.length-2);
    Logger.log(inReplyToStatusId);
  }
  
  content = modifyContent(content)[0];
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/statuses/update.json',
    {
    method: 'post',
    payload: {
      in_reply_to_status_id: inReplyToStatusId,
      auto_populate_reply_metadata: "true",
      status: content
    },
    muteHttpExceptions:true
  });
  Logger.log(response);
  Logger.log(typeof(response));
  return response;
}

// 一続きのtweetを投稿
function postLongTweet(originalContent, status) {
  var content = originalContent;
  var tweet;
  while(content != ""){
    var temp = modifyContent(content);
    tweet = temp[0];
    content = temp[1];
    status = postReply(tweet,status);
    if(status.getResponseCode() != 200){
      return status;
    }
  }
  return status;
}


// タイムラインを取得。全ての引数はoption
//sinceId以降，maxId以前のTLを取得。excludeRepliesをtrueにするとリプライが含まれない
function getHomeTimeline(sinceId, maxId, excludeReplies) {
  var service = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/statuses/home_timeline.json'
    + '?count=200'
    + (sinceId ? ('&since_id=' + sinceId) : (''))
    + '&trim_user=true'
    + (maxId ? ('&max_id=' + maxId) : (''))
    + (excludeReplies ? ('&exclude_replies=' + excludeReplies) : (''))
  );
  response = JSON.parse(response);
  Logger.log(response);
  return response;
}

function favorite(id) {
  var service = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/favorites/create.json?id='
    + id
    , {
      method: 'post',
      muteHttpExceptions: true
    });
  response = JSON.parse(response);
  Logger.log(response);
  return response;
}

function undoFavorite(id) {
  var service = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/favorites/destroy.json?id='
    + id
    , {
      method: 'post',
      muteHttpExceptions: true
    });
  response = JSON.parse(response);
  Logger.log(response);
  return response;
}

/**
 * ユーザの所有するリストの一覧を取得
 *
 * @param {string} screenName タイムラインを取得したいuserのscreenname
 * @return {HTTPResponse} https://api.twitter.com/1.1/lists/ownerships.json をfetchした結果
 */
function getUserLists(screenName) {
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/lists/ownerships.json'
                               + '?count=1000'
                               + (screenName? ('&screen_name=' + screenName) : ('') )
  );
  response = JSON.parse(response);
  Logger.log(response);
  return response;
}

/**
 * リストのツイートを取得
 *
 * @param {string} listId 取得したいリストのid
 * @param {string} sinceId このidのtweet以降のTLを取得(optional)
 * @param {string} maxId このid以前のTLを取得(optional)
 * @param {boolean} includeRts falseにするとRTを含まない(optional)
 * @return {HTTPResponse} https://api.twitter.com/1.1/lists/statuses.json をfetchした結果
 */
function getTweetsInLists(listId, sinceId, maxId, includeRts) {
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/lists/statuses.json'
                               + '?list_id=' + listId
                               + (sinceId? ('&since_id=' + sinceId) : ('') )
                               + (maxId? ('&max_id=' + maxId) : ('') )
                               + (includeRts? ('&inclue_rts=' + includeRts) : ('') )
  );
  response = JSON.parse(response);
  return response;
}

/**
 * リストのメンバーを複数追加
 *
 * @param {string} listId 取得したいリストのid
 * @param {string[]} screenNames メンバーに追加したいユーザのscreenname
 * @return {HTTPResponse} https://api.twitter.com/1.1/lists/members/create_all.json をfetchした結果
 */
function addListMember(listId,screenNames) {
  var screenNameList = '';
  for(var i=0;i<screenNames.length;i++){
    screenNameList += screenNames[i] + ',';
  }
  screenNameList = screenNameList.substring(0, screenNameList.length - 1);
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/lists/members/create_all.json',
    {
    method: 'post',
    payload: {
      list_id: listId,
      screen_name: screenNameList
    },
    muteHttpExceptions:true
  });
  Logger.log("addListMember:%s",screenNameList);
  return response;
}

/**
 * ユーザのフォロワーを200件取得
 * 
 * @param {string} screenName フォロワーを取得したいユーザのscreenName(optional)
 * @param {string} cursor returnの"next_cursor_str"を入れると次の200件が取得できる(optional)
 * @param {Boolean} skipStatus trueにするとuser objectsにstatusが含まれなくなる(optional)
 * @return {HTTPResponse} https://api.twitter.com/1.1/followers/list.json をfetchした結果
 */
function getFollower(screenName,cursor,skipStatus) {
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/followers/list.json'
                               + '?count=200'
                               + (screenName? ('&screen_name=' + screenName) : ('') )
                               + (cursor? ('&cursor=' + cursor) : ('') )
                               + '&skip_status=' + (skipStatus? ('true') : ('false'))
  );
  response = JSON.parse(response);
  //Logger.log(response);
  return response;
}

/**
 * ユーザのフォロワーの情報の一部を全件取得
 * 
 * @param {string} screenName フォロワーを取得したいユーザのscreenName。省略した場合は自分自身(optional)
 * @param {Boolean} skipStatus trueにするとuser objectsにstatusが含まれなくなる(optional)
 * @return {Object} result {count: , users: [{screen_name: , id_str: , name: }]}
 * @return {string} result.count - フォロワーの数
 * @return {string} result.users - フォロワーに関する情報の配列
 * @return {string} result.users[i].screen_name - フォロワーのscreenname
 * @return {string} result.users[i].id_str - フォロワーのid
 * @return {string} result.users[i].name - フォロワーの名前
 */
function getFollowerAll(screenName, skipStatus) {
  var cursor = "-1";
  var response;
  var screenNameList = {count: 0,users: []};
  do{
    response = getFollower(screenName, cursor, skipStatus);
    cursor = response.next_cursor_str;
    for(var i = 0;i < response.users.length; i++){
      screenNameList.users.push({screen_name: response.users[i].screen_name, id_str: response.users[i].id_str, name: response.users[i].name});
      screenNameList.count ++;
    }
  }while(cursor != "0");
  //Logger.log(screenNameList);
  return screenNameList;
}

/**
 * tweetを検索
 * 
 * @param {string} searchWords 検索のクエリ
 * @param {string} from ユーザのscreen name(from:hoge)(optional)
 * @param {string} until この日までのtweetを検索。7日前まで(optional)(YYYY-MM-DD)
 * @return {HTTPResponse} https://api.twitter.com/1.1/statuses/home_timeline.json をfetchした結果
 */
function searchTweet(searchWords, from, until){
  searchWords = encodeURI(searchWords);
  if(from){
    searchWords = "from%3A" + from + "%20" + searchWords
  }
  var service  = twitter.getService();
  var response = service.fetch('https://api.twitter.com/1.1/search/tweets.json'
                               + '?q=' + searchWords
                               + '&result_type=recent'
                               + '&count=100'
                               + (until ? ('&until=' + until) : ('') )
  );
  response = JSON.parse(response);
  Logger.log(response);
//  Logger.log(response.statuses[0]["user"]["id_str"]);
  return response;
}