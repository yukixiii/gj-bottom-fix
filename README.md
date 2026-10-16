# gj Bottom Fix

Obsidian の Vim モードで `j` を `gj`（表示行単位の移動）に割り当てているとき、**最終行で `j` を押すとノートの先頭に飛んでしまう**問題を直すプラグインです。

## 再現条件

- `.obsidian.vimrc` に `nmap j gj` がある
- リスト行で Insert モードに入り、Normal モードに戻る
- 空の最終行で `j` を押す → カーソルが 1 行目に飛ぶ

## 原因

Vim の `gj` は Obsidian の CodeMirror アダプタの `findPosV` で次の表示行を求めます。

1. 下に行がないとき、`findPosV` は `hitSide` を立てます。ただしこの判定は文字位置 (`ch`) とピクセル値（目標の横位置）を比べています。
2. Insert モードから戻ると、目標の横位置がリスト行の上で計算し直されます。リストマーカーの字下げがあるので 0 より大きくなり、空行（`ch` = 0）と食い違って `hitSide` が立ちます。
3. Vim は `coordsChar` で位置を求め直します。空の最終行では `posAtCoords` が `null` を返し、アダプタはこれを位置 `0` として扱うので、カーソルが先頭に飛びます。

## 修正内容

`CodeMirrorAdapter.prototype.findPosV` をラップします。行単位の移動で `hitSide` が立ったときは、カーソルを元の位置にとどめます。本来の Vim と同じ動作です。プラグインを無効にすると元の関数に戻ります。

## ビルド

```sh
npm install
npm run build
```

`main.js` と `manifest.json` を `<vault>/.obsidian/plugins/gj-bottom-fix/` にコピーして有効化します。
