const log = console.log
const AWS = require('aws-sdk')
const stream = require('stream')
const { pipeline } = stream
const fs = require('fs')
const { set, get, getOr, sortBy, pick } = require('lodash/fp')

const downloadLatestAsteroids = require('./download')

const FIVE_MEGS = 5 * 1024 * 1024

const uploadPart = s3 => bucket => key => uploadID => counter => chunks => isLastPart =>
    s3.uploadPart({
        Bucket: bucket,
        Key: key,
        PartNumber: counter,
        UploadId: uploadID,
        Body: chunks.slice(0, chunks.length)
    })
    .promise()
    .then(
        set('PartNumber', counter)
    )
    .then(
        result =>
            ({
                part: result,
                isLastPart
            })
    )

const LAST_CHONK = Buffer.from("copy pasta coding FTW")

const getFiveMegChunkerStream = () => {
    let chunks = Buffer.from([])
    let smallestSize = FIVE_MEGS
    let largestSize = -1
    let lastSize = 0
    let clone
    return new stream.Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        transform(chunk, encoding, callback) {
            chunks = Buffer.concat([chunks, chunk])
            smallestSize = Math.min(smallestSize, chunks.length)
            largestSize = Math.max(largestSize, chunks.length)
            lastSize = chunks.length
            if(chunks.length < FIVE_MEGS) {
                callback()
                return true
            }
            clone = chunks.slice(0, chunks.length)
            chunks = Buffer.from([])
            callback(undefined, { chunk: clone, isLast: false })
            return true
        },
        flush(callback) {
            callback(undefined, { chunk: clone, isLast: true })
        }
    })

}

const getUploadPartStream = uploadPartPartial => {
    log("getUploadPartStream")
    let chunks = Buffer.from([])
    let counter = 0
    const MAX_CONCURRENCY = 8
    let currentUploads = 0
    let cloneBuffer
    return new stream.Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        transform({ chunk, isLast }, encoding, callback) {
            chunks = Buffer.concat([chunks, chunk])
            counter++
            currentUploads++
            cloneBuffer = chunks.slice(0, chunks.length)
            chunks = Buffer.from([])
        
            log("counter:", counter, "currentUploads:", currentUploads, "chunks.length:", chunks.length, "uploading counter:", counter)
            uploadPartPartial(counter)(cloneBuffer)(isLast)
            .then(
                ({ part, isLastPart }) => {
                    currentUploads--
                    log("isLastPart:", isLastPart, "part:", part, "currentUploads:", currentUploads)
                    
                    if(isLastPart === false) {
                        callback(undefined, JSON.stringify(part))
                    } else {
                        callback(undefined, JSON.stringify(set('isLast', true, part)))
                    }
                }
            )
            .catch(
                error => {
                    currentUploads--
                    this.emit('error', error)
                }
            )
            if(currentUploads < MAX_CONCURRENCY && isLast === false) {
                log("Room fore more uploads, returning true.")
                return true
            } else {
                log("No more room for uploads, returning false.")
                return false
            }
            
        }
    })
}

const getPartsAssemblerStream = s3 => bucket => key => uploadID => {
    log("getPartsAssemblerStream")
    const parts = []
    return new stream.Writable({
        writableObjectMode: true,
        // readableObjectMode: true,
        write(partJSON, encoding, callback) {     
            const part = JSON.parse(partJSON)
            
            log("parsed part:", part)                                                                                                                                                                                                 
            if(getOr(false, 'isLast', part) === false) {
                parts.push(part)
                callback()
                return true
            }
            // log("Part:", part)
            log("Done, uploading all...")
            parts.push(pick(['ETag', 'PartNumber'], part))
            log("parts:", parts)
            s3.completeMultipartUpload({
                Bucket: bucket,
                Key: key,
                UploadId: uploadID,
                MultipartUpload: {
                    Parts: sortBy(['PartNumber'], parts)
                }
            })
            .promise()
            .then(
                result => {
                    log("final upload result:", result)
                    callback(undefined, result)
                }
            )
            .catch(
                error =>
                    log("error completing:", error) ||
                    callback(error)
            )
            return false
        },
    })
}


const downloadLatestAsteroidsAndUploadToS3 = async (event) =>
    new Promise(
        async (success, failure) => {
            const { bucket, asteroidsLatestFilename } = event
            const s3 = new AWS.S3()

            log("Downloading latest asteroids file...")
            const responseStream = await downloadLatestAsteroids()
            // const responseStream = fs.createReadStream('latest_fulldb.csv')
            log("Creating multipart upload...")
            const { UploadId } = await s3.createMultipartUpload({
                Bucket: bucket,
                Key: asteroidsLatestFilename
            })
            .promise()

            
            const parts = []
            let chunks = Buffer.from([])
            const uploadPartPartial = uploadPart(s3)(bucket)(asteroidsLatestFilename)(UploadId)
            
            log("Setting up pipeline...")
            pipeline(
                responseStream,
                getFiveMegChunkerStream(),
                getUploadPartStream(uploadPartPartial),
                getPartsAssemblerStream(s3)(bucket)(asteroidsLatestFilename)(UploadId),
                (err, thing) => {
                  if (err) {
                    console.error('Pipeline failed', err);
                  } else {
                    log(new Date().valueOf())
                    console.log('Pipeline succeeded', thing)
                  }
                }
              )
            // responseStream
            // .pipe(fiveMegStream)
            // .on('data', part => {
            //     parts.push(part)
            //     log("part:", part)
            // })
            // .on('end', async () => {
            //     log("done!")
                
            // })
            // .on('error', error => {
            //     log("stream error:", error)
            //     failure(error)
            // })
        }
    )

const handler = async (event) => {
    log("event:", event)
    try {
        const result = await downloadLatestAsteroidsAndUploadToS3(event)
        log("result:", result)
    } catch(error) {
        log("overall error:", error)
    }
    return event
}

exports.handler = handler

if(require.main === module) {
    // handler({bucket: 'asteroid-files', asteroidsLatestFilename: 'latest-asteroids.csv'})
    // .then(log)
    // .catch(log)
    downloadLatestAsteroids()
    .then(result => log('result:', result))
    .catch(log)
}

