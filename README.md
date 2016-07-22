# SES-S3 Lambda Helper
This is a helper function used as part of the [imapper-storage-s3ses]() npm module. 

When using the `S3 SDK` to list objects in a bucket, S3 always returns them sorted alphabetically, providing no options to change the sorting. This is a problem, as SES stores each message as a separate file, using a hash as the key. Alphabetizing the keys thus messes up the chronological ordering of messages.

`ses-s3lambda` is set up as an AWS Lambda function which is triggered by the S3 PUT event. It simply appends the new key to a list in a JSON metadata file which `imapper-storage-s3ses` then uses instead of retrieving the object list from the S3 mailbox bucket.

## Usage
Download or clone the repository files.

You shouldn't have to update any of the modules, but if you do decide to run `npm install`, make sure that you delete the aws-sdk and util directories from the `node-modules` directory. `init` is built into Node and `aws-sdk` is provided in the Lambda environment.

Edit the options var at the top of `main.js` to use the appropriate S3 bucket and suffixes in your environment.

Zip up the folder contents. Use `zip` instead of `tar` to avoid issues when uploading to AWS.
```sh
zip -r ses-s3lambda.zip .
```
Finally, create a Lambda function in AWS and upload the zip file. You'll need to set up a trigger based on the S3 PUT event for each mailbox bucket you set up. Multiple mailbox triggers can be set up on the same Lambda function.

For details on setting up the Lambda function, check the [AWS Lambda Developer Guide Amazon S3 Use Case](https://docs.aws.amazon.com/lambda/latest/dg/with-s3.html). It contains a step-by-step tutorial on how to set things up. If you're not very familiar with AWS Lambda, you may want to review the first few chapters of the Developer Guide.
