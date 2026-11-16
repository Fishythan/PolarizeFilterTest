var canv = document.getElementsByTagName("canvas")[0];
var ctx = canv.getContext("2d");

var imageLayers = [];

var lens = {On:false, angle:0}

function SetLens(on = null, angle = null){
    if(on !== null){
        lens.On = on;
    }
    if(angle !== null){
        lens.angle = angle;
    }
    console.log(lens);
    calcAndDraw();
}

async function addImageLayer(image) {
    // make image a canvas image
    var img = new Image();
    img.src = URL.createObjectURL(image);
    await new Promise((resolve) => {
        img.onload = resolve;
    });

    //get pixel data from image
    var tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    var tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(img, 0, 0, img.width, img.height);
    var canvasImage = tempCtx.getImageData(0, 0, img.width, img.height);
    imageLayers.push(formatData(canvasImage, img.width, img.height));
    calcAndDraw();
    newImageUploader();
}

function newImageUploader(){
    document.getElementById("imageUploader").innerHTML = '<input type=file id="fileInput" accept=".png, .jpg, .jpeg" onchange="addImageLayer(this.files[0])"/>';
}

function formatData(imageData, width, height) {
    var formattedData = [];
    formattedData.width = width;
    formattedData.height = height;
    for (var y = 0; y < height; y++) {
        var row = [];
        for (var x = 0; x < width*4; x+=4) {
            var index = (y * width*4 + x);
            var r = imageData.data[index];
            if(imageData.data[index + 3] == 0||(imageData.data[index]==255)&&(imageData.data[index + 1]==255)&&(imageData.data[index + 2]==255)){
                r = -255;
            }
            row.push(r/255);

        }
        formattedData.push(row);
    }
    // console.log(formattedData);
    console.log(width, height);
    return formattedData;
}
    
function calcAndDraw(){
    var fullImgInfo={};
    var maxWidth = 0;
    var maxHeight = 0;
    for(var i = 0; i < imageLayers.length; i++){
        if(imageLayers[i].width > maxWidth){
            maxWidth = imageLayers[i].width;
        }
        if(imageLayers[i].height > maxHeight){
            maxHeight = imageLayers[i].height;
        }
    }

    fullImgInfo.width = maxWidth;
    fullImgInfo.height = maxHeight;

    var compositeImage = [];

    for(var y = 0; y < maxHeight; y++){
        for(var x = 0; x < maxWidth; x++){
            
            var pixel = { Brightness: 1, angle: 0};
            if(lens.On){
                pixel.angle = lens.angle;
                pixel.Brightness = .5;
            }
            for(var i = 0; i < imageLayers.length; i++){
                if(imageLayers[i][y] == undefined || imageLayers[i][y][x] == undefined){
                    // console.log("oob");
                    continue;
                }
                if(pixel.Brightness == 1&&imageLayers[i][y][x]!=-1){
                    pixel.Brightness = .5;
                    pixel.angle = imageLayers[i][y][x] * 360;
                }else if(imageLayers[i][y][x]!=-1){
                    pixel.Brightness = pixel.Brightness*(Math.cos((pixel.angle-imageLayers[i][y][x] * 360) * Math.PI / 180)*Math.cos((pixel.angle-imageLayers[i][y][x] * 360) * Math.PI / 180))
                    pixel.angle = imageLayers[i][y][x] * 360;
                    // console.log(pixel.Brightness, pixel.angle);
                }
            }

            compositeImage.push(pixel.Brightness*255);
            compositeImage.push(pixel.Brightness*255);
            compositeImage.push(pixel.Brightness*255);
            compositeImage.push(255);

            
        }
    }
    // console.log(compositeImage, imageLayers);
    var imgData = ctx.createImageData(maxWidth, maxHeight);
    imgData.data.set(new Uint8ClampedArray(compositeImage));

    var tempCanvas = document.createElement("canvas");
    tempCanvas.width = maxWidth;
    tempCanvas.height = maxHeight;
    var tempCtx = tempCanvas.getContext("2d");
    tempCtx.putImageData(imgData, 0, 0);

    ctx.drawImage(tempCanvas, 0, 0, canv.width, canv.height);
    
}