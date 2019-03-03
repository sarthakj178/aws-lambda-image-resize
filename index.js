const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sharp = require('sharp');

var main = async function(sourceS3, destinationS3, minWidthPixels, resizeRatio) {
    const sourceStream = await s3.getObject({ Bucket: sourceS3.bucket, Key: sourceS3.key }).createReadStream();
    const image = sharp();
    sourceStream.pipe(image);
    const metadata = await image.metadata();
    console.log(metadata);

    var newWidth;
    if (metadata.width <= minWidthPixels) {
        newWidth = metadata.width;
    } else if (metadata.width > minWidthPixels && metadata.width * resizeRatio < minWidthPixels) {
        newWidth = minWidthPixels;
    } else {
        newWidth = resizeRatio * metadata.width;
    }
    const output = await image.resize({width: newWidth}).toBuffer();
    await s3.putObject({
        Bucket: destinationS3.bucket,
        Key: destinationS3.key,
        Body: output
    }).promise();  
}
/**
 * 
 * Sample Input - test-data/resize_image.json
 {
    "sourceS3": {
        "bucket": "clappia",
        "key": "images/test.png"
    }, "destinationS3": {
        "bucket": "clappia",
        "key": "images-compressed/test.png"
    },
    "minWidthPixels": 400,
    "resizeRatio": 0.2
 }
 */

exports.resize_image = async function(event, context, callback) {
    ({sourceS3, destinationS3, minWidthPixels, resizeRatio} = event);
    console.log(sourceS3, destinationS3, minWidthPixels, resizeRatio);
    try {
        main(sourceS3, destinationS3, minWidthPixels, resizeRatio);
        callback(null);
    } catch(err) {
        console.log("Unable to compress", err);
        callback(err);
    }
}