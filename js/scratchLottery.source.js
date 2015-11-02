/*!
 * HTML5刮奖组件
 * @license 766.com
 * Created:2014-4-18
 * Update:2014-4-24
 * Author:mudoo
 * Support:https://github.com/artwl/Lottery
 */
function scratchLottery(id, options) {
	if(!this.supported()) throw new Error('您的浏览器不支持HTML5，请使用Firefox、Chrome、IE9+等新版本浏览器');

	this.boxID = id;
	this.box = document.getElementById(this.boxID);
	if(!this.box) throw new Error('容器对象不存在');

	var defaultOptions = {
		lottery : '谢谢参与\n分享到微博再来一次',// 必须，奖项背景，刮出后显示的东西，可以是文字（支持换行）、图片
		mask : '#ccc',			// 必须，遮罩层，可以是颜色值、图片
		width : 0,			// 宽度，若为0，则匹配box宽度
		height : 0,			// 高度，若为0，则匹配box高度

		lotteryCanvas : null,	// 背景Canvas对象，为空则自动创建
		lotteryType : null,		// 背景选项（text|image），默认自动检测lottery，可强制指定
		text : {				// 字体样式，lotteryType为text启用
			bgColor : '#fff',			// 背景色
			font : 'Microsoft YaHei',	// 字体
			style : 'Bold',				// 第一行文字样式，（font-style|font-variant|font-weight）
			size : 0,					// 第一行文字大小，为0则自动计算
			color : '#f60',				// 第一行文字颜色
			styleOther : '',			// 其他文字样式
			sizeOther : 0,				// 其他文字大小，为0则自动计算
			colorOther : '#666',		// 其他文字颜色
			margin :[.15,.1],			// 区域四周留白，[上下,左右]（单位%）
			space : 0,					// 文字行间距，为0则自动计算
			align : 'center'			// 对齐方式（left|right|center）
		},
		useImageSize : false,	// 跟随图片大小，lotteryType为image启用

		maskCanvas : null,		// 遮罩Canvas对象，为空则自动创建
		maskType : null,		// 遮罩选项（color|image），默认自动检测mask，可强制指定

		scratchType : 'line',	// 刮擦类型，（line|point）
		scratchWidth : 0,		// 刮擦画笔宽度，为0则自动计算
		openPct : 50,			// 刮开百分比，回调onopen
		onscratch : null,		// 刮擦回调，参数（擦除面积百分比）
		onopen : null			// 刮擦完毕回调，参数（擦除面积百分比）
	};

	this.opts = this.extend(defaultOptions, options);
	if(!this.opts.lotteryType) this.opts.lotteryType = this.checkType(this.opts.lottery);
	if(!this.opts.maskType) this.opts.maskType = this.checkType(this.opts.mask, 1);
	if(!this.opts.width || !this.opts.height) {
		this.opts.width = this.box.offsetWidth;
		this.opts.height = this.box.offsetHeight;
		this.useBoxSize = true;
	}

	this.lotteryCanvas = null;
	this.lotteryCtx = null;
	this.maskCanvas = null;
	this.maskCtx = null;
	this.startDraw = false;
	this.openCalled = false;
	this.onopenBak = this.opts.onopen;
	this.marginPX = [Math.round(this.opts.height*this.opts.text.margin[0]), Math.round(this.opts.width*this.opts.text.margin[1])];

	this.originalWidth = this.opts.width;
	this.originalHeight = this.opts.height;
	this.scalePct = [1, 1];

	this.lastCall = new Date().getTime();

	this.device = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));
	this.isAndroid = navigator.userAgent.match(/Android/i);
	this.drawCall = this.opts.scratchType=='point' ? this.drawPoint : this.drawLine;

/*
	console.info('opts: ');
	console.log(parseObject(this.opts));
*/
	this.getScratchWidth();
	this.build();
}

scratchLottery.prototype = {
	extend : function(obj, source) {
		for(var t in source) {
			if(typeof source[t]=='object' && obj[t]!=undefined && !source[t].length) {
				obj[t] = this.extend(obj[t], source[t]);
			}else{
				obj[t] = source[t];
			}
		}
		return obj;
	},
	supported : function() {
		var canvas = document.createElement('canvas');
		return (canvas.getContext && canvas.getContext('2d'));
	},
	parseTextStyle : function() {
		if(this.opts.lotteryType!='text') return;
		console.info('parseFontStyle');

		// format lottery text
		this.opts.lottery = this.opts.lottery
			.replace(/^\n+|\n+$/g, '')
			.replace(/\n+/g, '\n')
			.split('\n');

		if(!this.opts.text.space) this.opts.text.space=Math.round(this.opts.height/20);

		// get size in style
		if(this.opts.text.size>0 || this.opts.text.sizeOther>0) {
			if(this.opts.text.size>0 && this.opts.text.sizeOther==0) this.opts.text.sizeOther = Math.round(this.opts.text.size);
		}

		var cfg = this.opts.text,
			txtLine = this.opts.lottery.length,
			testSize = 10,
			txtWidth = [],
			maxLine = 0,
			maxWidth = 0,
			area = [this.opts.height-this.marginPX[0]*2, this.opts.width-this.marginPX[1]*2],
			fistPct = 1.8,
			sizePct,
			size;

		console.log('marginPX: '+ this.marginPX);
		console.log('area: '+ area);

		// calculate size
		for(var i=0; i<txtLine; i++) {
			if(i==0) {
				this.lotteryCtx.font = [cfg.style, (testSize*fistPct)+'px', cfg.font].join(' ').trim();
			}else if(i==1) {
				this.lotteryCtx.font = [cfg.style, testSize+'px', cfg.font].join(' ').trim();
			}
			var width = this.lotteryCtx.measureText(this.opts.lottery[i]).width;
			if(width>maxWidth) {
				maxWidth = width;
				maxLine = i;
			}
			txtWidth.push(width);
			console.log(i +': '+ width +' : '+ this.opts.lottery[i]);
		}

		sizePct = Math.min(
			(area[0]-cfg.space*(txtLine-1))/(testSize*fistPct+testSize*(txtLine-1)),
			area[1]/maxWidth
		);
		size = [testSize*fistPct*sizePct, testSize*sizePct];

/*
		if(maxLine>0) {
			size = [testSize*fistPct*sizePct, testSize*sizePct];
		}else{
			size = [testSize*fistPct*sizePct, testSize*sizePct];
		}
*/


		this.opts.text.size = Math.max(Math.round(size[0]), 16);
		this.opts.text.sizeOther = Math.max(Math.round(size[1]), 12);
		console.log('sizePct: '+ sizePct);
		console.log('size: '+ size);
	},
	getScratchWidth : function() {
		if(this.opts.scratchWidth>0 && this.originalWidth==this.opts.width) return;
		this.opts.scratchWidth = Math.round(this.opts.width/(this.opts.scratchType=='line'?30:20));
		this.opts.scratchWidth = Math.max(this.opts.scratchWidth, (this.opts.scratchType=='line'?8:10));
		this.opts.scratchWidth = Math.min(this.opts.scratchWidth, (this.opts.scratchType=='line'?15:30));
		console.info('getScratchWidth:'+ this.opts.scratchWidth +' | '+ this.opts.scratchType);
	},
	checkType : function(str, t) {
		if(!str || str=='') {
			throw new Error('背景或遮罩参数无效');
		}
		var ext = str.substring(str.length-5);
		//console.log(/^http:\/\/|\.[a-z]{3,4}$/i.test(ext));
		return /^http:\/\/|\.[a-z]{3,4}$/i.test(ext) ? 'image' : (t ? 'color' : 'text');
	},
	getXY : function(e) {
		var docEle = document.documentElement,
			clientRect = this.box.getBoundingClientRect();
		var x = (this.device ? e.touches[0].clientX : e.clientX)-clientRect.left-docEle.clientLeft;
		var y = (this.device ? e.touches[0].clientY : e.clientY)-clientRect.top-docEle.clientTop;

		return {"x":x/this.scalePct[0], "y":y/this.scalePct[1]};
	},
	createElement : function(tagName, attributes) {
		var ele = document.createElement(tagName);
		console.info('createElement: '+ tagName);
		for(var key in attributes) {
			ele.setAttribute(key, attributes[key]);
		}
		return ele;
	},
	getTransparentPercent : function(ctx, width, height) {
		var imgData = ctx.getImageData(0, 0, width, height), pixles = imgData.data, transPixs = [];
		for(var i = 0, j = pixles.length; i<j; i += 4) {
			var a = pixles[i+3];
			if(a<128) {
				transPixs.push(i);
			}
		}
		return (transPixs.length/(pixles.length/4)*100).toFixed(2);
	},
	resizeCanvas : function(canvas, width, height) {
		canvas.width = width;
		canvas.height = height;
		canvas.getContext('2d').clearRect(0, 0, width, height);
	},
	callback : function() {
		var t = new Date().getTime();
		if(t-this.lastCall<200) return;
		console.log(this.lastCall +'-'+ t +'='+(t-this.lastCall));
		this.lastCall = t;
		//var pct = this.getTransparentPercent(this.maskCtx, this.opts.width, this.opts.height);
		var pct = this.getTransparentPercent(this.maskCtx, this.originalWidth, this.originalHeight);
		if(!this.openCalled && pct>this.opts.openPct) {
			this.openCalled = true;
			this.resizeCanvas(this.maskCanvas, this.opts.width, this.opts.height);
			if(this.opts.onopen) {
				this.opts.onopen.call(null, pct);
				this.opts.onopen = null;
			}
			pct = 100;
		}
		if(this.opts.onscratch) this.opts.onscratch.call(null, pct);
	},
	drawPoint : function(x, y) {
		this.maskCtx.beginPath();
		var radgrad = this.maskCtx.createRadialGradient(x, y, 0, x, y, this.opts.scratchWidth);
		radgrad.addColorStop(0, 'rgba(0,0,0,0.9)');
		radgrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
		this.maskCtx.fillStyle = radgrad;
		this.maskCtx.arc(x, y, this.opts.scratchWidth, 0, Math.PI*2, true);
		this.maskCtx.fill();

		if(this.isAndroid) {
			this.maskCanvas.style.marginRight = this.maskCanvas.style.marginRight=='0px' ? '1px' : '0px';
		}

		if(this.opts.openPct>0 || this.opts.onscratch || this.opts.onopen) {
			this.callback();
		}
	},
	drawLine : function(x, y) {
		this.maskCtx.strokeStyle = '#fff';
		this.maskCtx.lineWidth = this.opts.scratchWidth;
		if(!this.startDraw) {
			console.log('startDraw');
			this.maskCtx.beginPath();
			this.maskCtx.moveTo(x, y);
			this.startDraw = true;
		}else{
			this.maskCtx.lineTo(x, y);
			this.maskCtx.stroke();
		}

		if(this.isAndroid) {
			this.maskCanvas.style.marginRight = this.maskCanvas.style.marginRight=='0px' ? '1px' : '0px';
		}

		if(this.opts.openPct>0 || this.opts.onscratch || this.opts.onopen) {
			this.callback();
		}
	},
	bindEvent : function() {
		console.info('bindEvent');
		var _this = this;
		var clickEvtName = this.device ? 'touchstart' : 'mousedown';
		var moveEvtName = this.device ? 'touchmove' : 'mousemove';

		console.log('clickEvtName: '+ clickEvtName);
		console.log('moveEvtName: '+ moveEvtName);
		console.log(document.addEventListener);
		if(!this.device) {
			var isMouseDown = false;
			document.addEventListener('mouseup', function(e) {
				isMouseDown = false;
				_this.startDraw = false;
			}, false);
		} else {
			document.addEventListener("touchmove", function(e) {
				if(isMouseDown) {
					e.preventDefault();
					e.stopPropagation();
				}
			}, false);
			document.addEventListener('touchend', function(e) {
				isMouseDown = false;
				_this.startDraw = false;
			}, false);
		}
		this.maskCanvas.addEventListener(clickEvtName, function(e) {
			if(_this.openCalled==true) return false;
			console.info(clickEvtName +' event');
			isMouseDown = true;
			var point = _this.getXY(e);
			console.log('point: '+ [point.x,point.y]);
			_this.drawCall(point.x, point.y);
		}, false);

		this.maskCanvas.addEventListener(moveEvtName, function(e) {
			if(_this.openCalled==true) {
				isMouseDown = false;
				_this.startDraw = false;
				return false;
			}
			if(!_this.device && !isMouseDown) {
				return false;
			}
			var point = _this.getXY(e);
			_this.drawCall(point.x, point.y);
		}, false);

		if(this.useBoxSize) {
			window.addEventListener('resize', function(){
				var width = _this.box.offsetWidth;
				var height = _this.box.offsetHeight;
				_this.resize(width, height);
			})
		}
	},
	build : function() {
		console.info('build');
		this.lotteryCanvas = this.opts.lotteryCanvas || this.createElement('canvas', {
			style : 'position:absolute;left:0;top:0;'
		});
		this.maskCanvas = this.opts.maskCanvas || this.createElement('canvas', {
			style : 'position:absolute;left:0;top:0;'
		});

		this.box.appendChild(this.lotteryCanvas);
		this.box.appendChild(this.maskCanvas);
		this.bindEvent();

		this.lotteryCtx = this.lotteryCanvas.getContext('2d');
		this.maskCtx = this.maskCanvas.getContext('2d');

		this.parseTextStyle();

		//this.drawLottery();
		this.drawMask();
	},
	drawLottery : function() {
		console.info('drawLottery: '+ this.opts.lotteryType);
		if(this.opts.lotteryType=='image') {
			var image = new Image(), _this = this;
			image.onload = function() {
				if(_this.opts.useImageSize){
					_this.opts.width = this.width;
					_this.opts.height = this.height;
				}
				_this.resizeCanvas(_this.lotteryCanvas, _this.opts.width, _this.opts.height);
				_this.lotteryCtx.drawImage(this, 0, 0, _this.opts.width, _this.opts.height);
				//_this.drawMask();
			};
			image.onerror = function() {
				throw new Error('背景图片加载失败：'+ _this.opts.lottery);
			};
			image.src = this.opts.lottery;
			console.log('load image: '+ this.opts.lottery);
		} else if(this.opts.lotteryType=='text') {
			var cfg = this.opts.text,
				text = this.opts.lottery,
				line = text.length,
				style = [cfg.style, cfg.size+'px', cfg.font].join(' ').trim(),
				styleOther = [cfg.styleOther, cfg.sizeOther+'px', cfg.font].join(' ').trim(),
				txtHeight = (cfg.size+cfg.space*Math.max(line-1, 0)+cfg.sizeOther*Math.max(line-1, 0)),
				point = [
					cfg.align=='left' ? this.marginPX[1] :
						(cfg.align=='right' ? this.opts.width-this.marginPX[1] : this.opts.width/2),
					(this.opts.height-txtHeight)/2+cfg.size-Math.round(txtHeight/10)-Math.round(cfg.size/20)
				];

			/*
			console.log('text-height: '+ (cfg.size+cfg.space*Math.max(line-1, 0)+cfg.sizeOther*Math.max(line-1, 0)));
			console.log('height: '+ this.opts.height);
			console.log('margin: '+ this.marginPX[0]);
			console.log('space: '+ cfg.space);
			console.log('line: '+ line);
			console.log('style: '+ style);
			console.log('styleOther: '+ styleOther);
			console.log('point: '+ point);
			*/

			this.resizeCanvas(this.lotteryCanvas, this.opts.width, this.opts.height);
			this.lotteryCtx.save();
			this.lotteryCtx.fillStyle = cfg.bgColor;
			this.lotteryCtx.fillRect(0, 0, this.opts.width, this.opts.height);
			this.lotteryCtx.restore();
			// text 1;
			this.lotteryCtx.save();
			this.lotteryCtx.font = style;
			this.lotteryCtx.textAlign = cfg.align;
			this.lotteryCtx.fillStyle = cfg.color;
			this.lotteryCtx.fillText(text[0], point[0], point[1]);
			this.lotteryCtx.restore();
			console.log('fill text: '+ text[0]);
			// text other
			for(var i=1; i<line; i++) {
				point[1] = point[1]+(i==1 ? cfg.size/2 : cfg.sizeOther/2)+cfg.sizeOther/2+cfg.space;
				this.lotteryCtx.save();
				this.lotteryCtx.font = styleOther;
				this.lotteryCtx.textAlign = cfg.align;
				this.lotteryCtx.fillStyle = cfg.colorOther;
				this.lotteryCtx.fillText(text[i], point[0], point[1]);
				this.lotteryCtx.restore();
				console.log('fill text: '+ text[i]);
			}
		}
	},
	drawMask : function() {
		console.info('drawMask: '+ this.opts.maskType);
		this.resizeCanvas(this.maskCanvas, this.opts.width, this.opts.height);
		if(this.opts.maskType=='color') {
			this.maskCtx.fillStyle = this.opts.mask;
			this.maskCtx.fillRect(0, 0, this.opts.width, this.opts.height);
			this.maskCtx.globalCompositeOperation = 'destination-out';
			console.log('fill color: '+ this.opts.mask);
			this.drawLottery();
		} else if(this.opts.maskType=='image') {
			var image = new Image(), _this = this;
			image.onload = function() {
				_this.maskCtx.drawImage(this, 0, 0, _this.opts.width, _this.opts.height);
				_this.maskCtx.globalCompositeOperation = 'destination-out';
				_this.drawLottery();
			};
			image.onerror = function() {
				throw new Error('遮罩图片加载失败：'+ _this.opts.mask);
			};
			image.src = this.opts.mask;
			console.log('load image: '+ this.opts.mask);
		}
	},
	resize : function(width, height) {
		console.info('resize: '+ [width, height]);
		width = parseInt(width, 10);
		height = parseInt(height, 10);

		if((isNaN(width) || isNaN(height)) || (this.opts.width==width && this.opts.height==height)) return;
		var widthPct = width/this.originalWidth, heightPct = height/this.originalHeight;
		console.log('size: '+ [this.opts.width, this.opts.height]);
		console.log('original size: '+ [this.originalWidth, this.originalHeight]);
		console.log('resize: '+ [width, height]);
		console.log('pct: '+ [widthPct, heightPct]);
		this.opts.width = width;
		this.opts.height = height;

		this.scalePct = [widthPct, heightPct];

/*
		this.lotteryCtx.scale(widthPct, heightPct);
		this.maskCtx.scale(widthPct, heightPct);
*/

		/*
		this.resizeCanvas(this.lotteryCanvas, this.opts.width, this.opts.height);
		this.resizeCanvas(this.maskCanvas, this.opts.width, this.opts.height);
		*/
	},
	init : function(lottery, lotteryType) {
		console.info('init');
		if(lottery) {
			this.opts.lottery = lottery;
			this.opts.lotteryType = lotteryType || this.checkType(lottery);
			this.parseTextStyle();
		}
/*
		console.log('opts: ');
		console.log(parseObject(this.opts));
*/
		if(this.openCalled) {
			this.openCalled = false;
			this.opts.onopen = this.onopenBak;
		}
		this.getScratchWidth();
		this.originalWidth = this.opts.width;
		this.originalHeight = this.opts.height;
		this.scalePct = [1, 1];
		/*
		this.resizeCanvas(this.lotteryCanvas, this.opts.width, this.opts.height);
		this.resizeCanvas(this.maskCanvas, this.opts.width, this.opts.height);
		*/
		this.drawMask();
	}
};

/**
 * 剔除头尾空格
 * @param t
 * @returns {string}
 */
String.prototype.trim = function(t) {
	var p = /^[\s\t]+|[\s\t]+$/g;
	if(t=='l'||t=='left') p=/^[\s\t]+/g;
	if(t=='r'||t=='right') p=/[\s\t]+$/g;
	return this.replace(p, '');
};
