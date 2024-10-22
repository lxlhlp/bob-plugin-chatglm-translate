/**
 * 由于各大服务商的语言代码都不大一样，
 * 所以我定义了一份 Bob 专用的语言代码，以便 Bob 主程序和插件之间互传语种。
 * Bob 语言代码列表 https://ripperhe.gitee.io/bob/#/plugin/addtion/language
 *
 * 转换的代码建议以下面的方式实现，
 * `xxx` 代表服务商特有的语言代码，请替换为真实的，
 * 具体支持的语种数量请根据实际情况而定。
 *
 * Bob 语言代码转服务商语言代码(以为 'zh-Hans' 为例): var lang = langMap.get('zh-Hans');
 * 服务商语言代码转 Bob 语言代码: var standardLang = langMapReverse.get('xxx');
 */

var items = [
  ["auto", "中文简体"],
  ["zh-Hans", "中文简体"],
  ["zh-Hant", "中文繁体"],
  ["yue", "粤语"],
  ["wyw", "文言文"],
  ["pysx", "拼音缩写"],
  ["en", "英语"],
  ["ja", "日语"],
  ["ko", "韩语"],
  ["fr", "法语"],
  ["de", "德语"],
  ["es", "西班牙语"],
  ["it", "意大利语"],
  ["ru", "俄语"],
  ["pt", "葡萄牙语"],
  ["nl", "荷兰语"],
  ["pl", "波兰语"],
  ["ar", "阿拉伯语"],
];

var langMap = {};

items.forEach(([code, name]) => {
  langMap[code] = name;
});

var langMapReverse = new Map(
  items.map(([standardLang, lang]) => [lang, standardLang])
);

function supportLanguages() {
  return items.map(([standardLang, lang]) => standardLang);
}

function translate(query, completion) {
  resTxt = "";
  $http.streamRequest({
    method: "POST",
    url: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    header: {
      Authorization: $option.APIkey,
      "Content-Type": "application/json",
    },
    body: initReqBody(query),
    streamHandler: function (stream) {
      var txt = stream.text;

      var lines = txt.split("\n");

      lines.forEach(function (text) {
        text = text.slice(6);
        // $log.info(text);

        if (text == "[DONE]") {
          query.onCompletion({
            result: {
              toParagraphs: [resTxt],
            },
          });
          return;
        } else if (text.startsWith("{")) {
          var obj = JSON.parse(text);

          resTxt = resTxt + obj.choices[0].delta.content;
          translateResult = {
            toParagraphs: [resTxt],
          };
          query.onStream({ result: translateResult });
        }
      });
    },
    handler: function (resp) {
      var data = resp.data;
    },
  });
}

function initReqBody(query) {
  var prompt = $option.prompt;
  var web_search = $option.web_search;
  var content = query["text"];
  if (prompt == "") {
    prompt =
      "你是一个翻译专家 : 专注于" +
      langMap[query.detectFrom] +
      "到" +
      langMap[query.detectTo] +
      "的翻译，请确保翻译结果的准确性和专业性，同时，请确保翻译结果的翻译质量，不要出现翻译错误，翻译时能够完美确保翻译结果的准确性和专业性，同时符合" +
      langMap[query.detectTo] +
      "的表达和语法习惯。" +
      "你拥有如下能力:" +
      langMap[query.detectFrom] +
      "到" +
      langMap[query.detectTo] +
      "的专业翻译能力，理解并保持原意，熟悉" +
      langMap[query.detectTo] +
      "表达习惯。" +
      "翻译时,请按照如下步骤: " +
      "1. 仔细阅读并理原文内容" +
      "2. 务必确保准确性和专业性" +
      "3. 校对翻译文本，确保符合" +
      langMap[query.detectTo] +
      "表达习惯,并加以语法润色。" +
      "4. 请只输出最终翻译文本。";
  } else {
    prompt = prompt
      .replace("原文语言", langMap[query.detectFrom])
      .replace("目标语言", langMap[query.detectTo]);
  }

  return {
    model: $option.model,
    stream: true,
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: content,
      },
    ],
    tools: [
      {
        type: "web_search",
        web_search: {
          enable: web_search,
        },
      },
    ],
  };
}
