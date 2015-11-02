## 说明
>canvas刮奖组件

## 使用
```html
<div id="lotteryArea"></div>
```

```js
new scratchLottery(ElementID, {
    lottery : '一等奖\niPhone6 一部\n恭喜您获奖',
    mask : 'images/mask.png',
    text : {
        //font : 'Arial',
        margin: [.2,.2]
    },
    //scratchType : 'point',
    openPct : 40,
    onscratch : drawPercent,
    onopen : openLottery
});
```


### 默认参数说明
```
Options = {
    lottery : '谢谢参与\n分享到微博再来一次',// 必须，奖项背景，刮出后显示的东西，可以是文字（支持换行）、图片
    mask : '#ccc',          // 必须，遮罩层，可以是颜色值、图片
    width : 0,          // 宽度，若为0，则匹配box宽度
    height : 0,         // 高度，若为0，则匹配box高度

    lotteryCanvas : null,   // 背景Canvas对象，为空则自动创建
    lotteryType : null,     // 背景选项（text|image），默认自动检测lottery，可强制指定
    text : {                // 字体样式，lotteryType为text启用
        bgColor : '#fff',           // 背景色
        font : 'Microsoft YaHei',   // 字体
        style : 'Bold',             // 第一行文字样式，（font-style|font-variant|font-weight）
        size : 0,                   // 第一行文字大小，为0则自动计算
        color : '#f60',             // 第一行文字颜色
        styleOther : '',            // 其他文字样式
        sizeOther : 0,              // 其他文字大小，为0则自动计算
        colorOther : '#666',        // 其他文字颜色
        margin :[.15,.1],           // 区域四周留白，[上下,左右]（单位%）
        space : 0,                  // 文字行间距，为0则自动计算
        align : 'center'            // 对齐方式（left|right|center）
    },
    useImageSize : false,   // 跟随图片大小，lotteryType为image启用

    maskCanvas : null,      // 遮罩Canvas对象，为空则自动创建
    maskType : null,        // 遮罩选项（color|image），默认自动检测mask，可强制指定

    scratchType : 'line',   // 刮擦类型，（line|point）
    scratchWidth : 0,       // 刮擦画笔宽度，为0则自动计算
    openPct : 50,           // 刮开百分比，回调onopen
    onscratch : null,       // 刮擦回调，参数（擦除面积百分比）
    onopen : null           // 刮擦完毕回调，参数（擦除面积百分比）
};
```