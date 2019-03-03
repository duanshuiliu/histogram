"use strict";

function CanvasW(canvas, imgUrl, contrastCanvas) {
    this.canvas         = $("#"+canvas)[0];
    this.ctx            = this.canvas.getContext("2d");
    this.contrastCanvas = $("#"+contrastCanvas)[0];
    this.contrastCtx    = this.contrastCanvas.getContext("2d");
    this.width  = $(this.canvas).attr('width');
    this.height = $(this.canvas).attr('height');
    this.imgUrl = imgUrl;
}

CanvasW.prototype.init = function(callback) {
    let _this = this;

    let img = new Image();
    img.src = this.imgUrl;
    img.setAttribute('crossOrigin', 'anonymous');

    img.onload = function() {
        _this.drawImage(img);
        callback();
    }
}

// 绘图
CanvasW.prototype.drawImage = function(img) {
    this.ctx.drawImage(img, 0, 0, this.width, this.height);
}

// 获取点数据
CanvasW.prototype.getImgData = function() {
    let imgData = this.ctx.getImageData(0, 0, this.width, this.height);

    return imgData;
}

// 亮度点数据
CanvasW.prototype.transBrightHistogramData = function(data) {
    let histogramData = {};
    let brightData    = [];
    let imgData       = [];
    let temp          = [];

    for(let i in data.data) {
        let level = i%4;

        switch(level) {
            case 0:
                // R
                temp.push(data.data[i]);
                break;
            case 1:
                // G
                temp.push(data.data[i]);
                break;
            case 2:
                // B
                temp.push(data.data[i]);
                break;
            case 3:
                imgData.push(temp);
                temp = [];
                break;
            default:
                break;
        }
    }

    for(let i in imgData) {
        let bright = 0.299*imgData[i][0] + 0.587*imgData[i][1] + 0.114*imgData[i][2];

        bright = Math.floor(bright);

        brightData.push(bright);
    }

    histogramData.data  = [];
    histogramData.label = [];

    for(let i = 0; i <= 255; i++) {
        histogramData.data[i] = 0;
        histogramData.label.push(i);
    }

    for(let i in brightData) {
        histogramData.data[brightData[i]] += 1;
    }

    return histogramData;
}

// 反色
CanvasW.prototype.reverse = function(data) {
    for(let i in data.data) {
        let level = i%4;

        switch(level) {
            case 0:
                // R
                data.data[i] = 255 - data.data[i];
                break;
            case 1:
                // G
                data.data[i] = 255 - data.data[i];
                break;
            case 2:
                // B
                data.data[i] = 255 - data.data[i];
                break;
            case 3:
                break;
            default:
                break;
        }
    }

    this.contrastCtx.clearRect(0, 0, this.width, this.height);
    this.contrastCtx.putImageData(data, 0, 0);

    return data;
}

// 均衡化
CanvasW.prototype.equal = function(data) {
    // 亮度直方图
    let brightHistogramData = this.transBrightHistogramData(data);
    // 灰度直方图
    let grayHistogramData = [];
    let temp              = [];

    for(let i in brightHistogramData.data) {
        if(i == 0) {
            grayHistogramData[i] = brightHistogramData.data[i];
        }else {
            grayHistogramData[i] = grayHistogramData[i-1] + brightHistogramData.data[i];
        }
    }

    // 修改原始数据
    for(let i in data.data) {
        let level = i%4;

        switch(level) {
            case 0:
                // R
                temp.push(data.data[i]);
                break;
            case 1:
                // G
                temp.push(data.data[i]);
                break;
            case 2:
                // B
                temp.push(data.data[i]);
                break;
            case 3:
                let bright    = Math.floor(0.299*temp[0] + 0.587*temp[1] + 0.114*temp[2]);
                let newBright = 255*grayHistogramData[bright]/grayHistogramData[grayHistogramData.length-1];

                let radio = newBright/bright;

                data.data[i-3] = radio*data.data[i-3];
                data.data[i-2] = radio*data.data[i-2];
                data.data[i-1] = radio*data.data[i-1];
                break;
        }
    }
    
    this.contrastCtx.clearRect(0, 0, this.width, this.height);
    this.contrastCtx.putImageData(data, 0, 0);

    return data;
}

// 拉伸
CanvasW.prototype.stretch = function(data) {
    // 亮度直方图
    let brightHistogramData = this.transBrightHistogramData(data);
    // 灰度直方图
    let grayHistogramData = [];
    let temp              = [];

    let minBright = 0;
    let maxBright = 0;

    for(let i in brightHistogramData.data) {
        if(brightHistogramData.data[i] > 0) {
            minBright = i;
            break;
        }
    }

    for(let i in brightHistogramData.data) {
        if(i > 0 && brightHistogramData.data[i-1] > 0 && brightHistogramData.data[i] <= 0) {
            maxBright = i;
            break;
        }
    }

    console.log(minBright, maxBright, brightHistogramData);

    // 修改原始数据
    for(let i in data.data) {
        let level = i%4;

        switch(level) {
            case 0:
                // R
                temp.push(data.data[i]);
                break;
            case 1:
                // G
                temp.push(data.data[i]);
                break;
            case 2:
                // B
                temp.push(data.data[i]);
                break;
            case 3:
                let bright    = Math.floor(0.299*temp[0] + 0.587*temp[1] + 0.114*temp[2]);
                let newBright = Math.floor(200*(bright-minBright)/(maxBright-minBright));

                let radio = newBright/bright;

                data.data[i-3] = radio*data.data[i-3];
                data.data[i-2] = radio*data.data[i-2];
                data.data[i-1] = radio*data.data[i-1];
                break;
        }
    }
    
    this.contrastCtx.clearRect(0, 0, this.width, this.height);
    this.contrastCtx.putImageData(data, 0, 0);

    return data;
}
