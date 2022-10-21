import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

/**
 * Generate a signed url for an s3 bucket.
 * @param key the key to use as object identifier
 * @param bucketName the s3 bucket name to create a signed url for
 * @param expiration url expiration in ms
 * @returns the signedUrl
 */
export function getUploadUrl(
  key: string,
  bucketName: string,
  expiration: number
): string {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: key,
    Expires: expiration
  })
}
