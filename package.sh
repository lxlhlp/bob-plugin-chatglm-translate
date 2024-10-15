zip -0 -j  -r ./bob-plugin-chatglm-translate.bobplugin ./src/*


version=$(jq -r .version ./src/info.json)

echo $version

hash=$(shasum -a 256 ./bob-plugin-chatglm-translate.bobplugin | cut -d ' ' -f 1)

timestamp=$(date +%s)

newVersion=$(cat << EOF
{
  "version": "$version",
  "desc": "新增功能",
  "sha256": "$hash",
  "url": "https://github.com/lxlhlp/bob-plugin-chatglm-translate/releases/download/$version/bob-plugin-chatglm-translate.bobplugin",
  "minBobVersion": "1.8.0",
 "timestamp": $timestamp
}
EOF
)

jq --argjson newVersion "$newVersion" '.versions |= [$newVersion] + .' ./appcast.json > temp.json


mv temp.json ./appcast.json
