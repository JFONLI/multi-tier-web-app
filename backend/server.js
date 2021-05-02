var aws = require('aws-sdk'),
    http = require('http'),
    winston = require('winston'),
    url = require('url'),
    mime = require('mime');

var awsRegion = 'us-east-1',
    bucketName = process.env.BUCKET,
    re_mime_matcher = /image/gi,
    re_filename_extractor = /(\w+\.(png|jpg|gif))$/gi,
    logfile = 'server.log';

// Import required AWS SDK clients and commands for Node.js
// const { SNSClient, PublishCommand } = require("aws-sdk/client-sns");

var username = [];
var email_list = [];


var logger = new winston.Logger({
    transports: [ 
        new winston.transports.File({filename: logfile})
    ]
});

http.createServer(function(req,res){

    req.on('data',function(data){
        console.log(data.toString());
        try{
            var hash = JSON.parse(data.toString());
        }catch(e){
            returnResponse(res,400,logger,'Invalid json: ' + data.toString());
        }
        // console.log(hash,hash.name,hash.email,hash.gender);
        // username.push(hash.name);
        postToSNS(hash);

        /*
        if(!hash.url || !validateUrl(hash.url)){
            returnResponse(res,400,logger,'Invalid url: ' + JSON.parse(hash));
        }

        fetchImage(hash.url,function(error,fetchResult){

            if(error){
                returnResponse(res,400,logger,'Could not fetch image');
            }

            uploadImageToS3(
                bucketName,
                fetchResult.filename,
                fetchResult.body,
                function(error,filename){
                    if(error) {
                        returnResponse(res,400,logger, 'Could not upload image to S3: ' + JSON.stringify(error));
                    }
                    returnResponse(res,200,logger,'uploaded: ' + filename) ;
                }
            );
        });

        */
    });
}).listen(process.env.PORT || 3000);


/*
function validateUrl(string){
    var result = url.parse(string);
    if(result.hostname){
        return true;
    }else{
        return false;
    }
}
*/


function postToSNS(hash){
    if(email_list.includes(hash.email)){
        return;
    }
    
    // console.log(hash,hash.name,hash.email,hash.gender);
    username.push(hash.name);
    email_list.push(hash.email);
    let mes;
    if(hash.gender == 'Male'){
        mes = 'Let’s welcome our new member Mr.' + hash.name +
              '. His contact email is ' + hash.email + '.' + 
              ' We now have the following members in the club:' + username + ' .';
            
    }
    else{
        mes = 'Let’s welcome our new member Ms.' + hash.name +
        '. Her contact email is ' + hash.email + '.' +
        ' We now have the following members in the club:' + username + ' .';
    }

    

    

    var params = {
        Message: mes, /* required */
        TopicArn: 'arn:aws:sns:us-east-1:845588092897:club',
        // Subject: hash.name
    };
    var sns = new aws.SNS({region : awsRegion,apiVersion: '2010-03-31'});
    sns.publish(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });

    // aws.config.update({region: awsRegion});
    // // Create promise and SNS service object
    // var publishTextPromise = new aws.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

    // // Handle promise's fulfilled/rejected states
    // publishTextPromise.then(
    // function(data) {
    //     console.log(`Message ${params.Message} sent to the topic ${params.TopicArn}`);
    //     console.log("MessageID is " + data.MessageId);
    // }).catch(
    //     function(err) {
    //     console.error(err, err.stack);
    // });

    
}


function returnResponse(httpResponse, status, logger, message){

    if(status === 200){
        logger.info(message);
    }else{
        logger.error(message);
    }

    httpResponse.writeHead(status);
    httpResponse.write(message, 
    	function(err){httpResponse.end();});
}
