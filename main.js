/**
 * SES Incoming mesage handler
 * 
 * Lambda function that should be connected to S3 post event
 * On creation of a new file in a bucket, records that new object's
 * key and writes it to an index file
 *
 */

// config settings
var options = {
	S3MailDataBucket: 'maildata_bucket',						// bucket where mailbox metadata is stored
	S3MessageListKeySuffix: '.messagelist.json',		// suffix for message list data
	S3MboxBucketSuffix: '.ses.inbound'							// suffix for individual mailbox buckets
};

var AWS = require('aws-sdk'); 
var async = require('async');
var util = require('util');

var s3 = new AWS.S3();

exports.handler = function(event, context, callback) {

	// Read options from the event.
	// ref: http://docs.aws.amazon.com/AmazonS3/latest/dev/notification-content-structure.html
	//console.log("Reading options from event:\n", util.inspect(event, {depth: 5}));
	var srcBucket = event.Records[0].s3.bucket.name;

	// Object key may have spaces or unicode non-ASCII characters.
	var srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

	var createdTime = event.Records[0].eventTime;
	var mboxName = srcBucket.replace(options.S3MboxBucketSuffix, '');

	//console.log('source:',srcBucket,'key:',srcKey,'mbox:',mboxName,'created:',createdTime);

	// Sanity check: validate that source and destination are different buckets.
	if (srcBucket == options.S3MailDataBucket) {
		callback("Source and destination buckets are the same.");
		return;
	}

	async.waterfall(
		[
			// get message list for mailbox from control bucket
			function getMessageList(next) {
				s3.getObject({
					Bucket: options.S3MailDataBucket,
					Key: mboxName + options.S3MessageListKeySuffix
				},
				next);
			},
			// update message data
			function updateMessageList(response, next) {
				var data = JSON.parse(response.Body); // decode data

				//console.log('updateMessageList:data -',data);

				// add message info to array
				data.messages.push({ key: srcKey, created: createdTime });
				// increment new message counter
				data.new_messages++;

				//console.log('updateMessageList:data modified -',data);

				next(null, data);
			},
			// upload updated messagelist object to control bucket
			function putMessageList(response, next) {

				//console.log('putMessageList:data -',response);

				s3.putObject({
					//ContentType: contentType,
					Bucket: options.S3MailDataBucket,
					Key: mboxName + options.S3MessageListKeySuffix,
					Body: JSON.stringify(response)
				},
				next);
			}
		], function (err) {
			if (err) {
				console.error(
					'Error occurred: ' + err
				);
			} else {
				console.log(
					'Processed message ' + srcBucket + '/' + srcKey
				);
			}
			callback(null, "Processing complete.");
		}
	);

}; // exports.handler

