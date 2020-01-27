const log = console.log
const https = require('https')
const AWS = require('aws-sdk')
const stream = require('stream')
const { pipeline } = stream
const fs = require('fs')
const { set, get, getOr, sortBy, pick } = require('lodash/fp')

const FIVE_MEGS = 5 * 1024 * 1024

const downloadLatestAsteroids = () =>
    new Promise(
        (success, failure) => {
            const req = https.request({
                    hostname: 'ssd.jpl.nasa.gov',
                    port: 443,
                    path: '/sbdb_query.cgi',
                    method: 'POST',
                    headers: {
                        'origin': 'https://ssd.jpl.nasa.gov',
                        'upgrade-insecure-requests': 1,
                        'dnt': 1,
                        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryI5CMg9fifgJnfvc6',
                        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36',
                        'X-DevTools-Emulate-Network-Conditions-Client-Id': 'F64DB139B75061A6BE276315A7C5AC1D',
                        'referrer': 'https://ssd.jpl.nasa.gov/sbdb_query.cgi'
                    },
                },
                response => {
                    log("response.statusCode:", response.statusCode, response.statusMessage)
                    response.pipe(fs.createWriteStream('db.csv'))
                    success(response)
                }
            )
            req.on('error', error => {
                log('error:', error)
                failure(error)
            })
            req.write(`------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="obj_group"\r\n\r\nall\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="obj_kind"\r\n\r\nall\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="obj_numbered"\r\n\r\nall\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="OBJ_field"\r\n\r\n0\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="OBJ_op"\r\n\r\n0\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="OBJ_value"\r\n\r\n\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="ORB_field"\r\n\r\n0\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="ORB_op"\r\n\r\n0\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="ORB_value"\r\n\r\n\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="c_fields"\r\n\r\nAaAbAcAdAeAfAgAhAiAjAkAlAmAnAoApAqArAsAtAuAvAwAxAyAzBaBbBcBdBeBfBgBhBiBjBkBlBmBnBoBpBqBrBsBtBuBvBwBxByBzCaCbCcCdCeCfCgChCiCjCkClCmCnCoCpCqCrCsCtCuCvCw\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="table_format"\r\n\r\nCSV\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="max_rows"\r\n\r\n10\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="format_option"\r\n\r\ncomp\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name="query"\r\n\r\nGenerate Table\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name=".cgifields"\r\n\r\nformat_option\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name=".cgifields"\r\n\r\nfield_list\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name=".cgifields"\r\n\r\nobj_kind\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name=".cgifields"\r\n\r\nobj_group\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name=".cgifields"\r\n\r\nobj_numbered\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name=".cgifields"\r\n\r\nast_orbit_class\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name=".cgifields"\r\n\r\ntable_format\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name=".cgifields"\r\n\r\nOBJ_field_set\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name=".cgifields"\r\n\r\nORB_field_set\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name=".cgifields"\r\n\r\npreset_field_set\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6\r\nContent-Disposition: form-data; name=".cgifields"\r\n\r\ncom_orbit_class\r\n------WebKitFormBoundaryI5CMg9fifgJnfvc6--\r\n`)
            req.end()
        }
    )

const uploadPart = s3 => bucket => key => uploadID => counter => chunks => isLast =>
    s3.uploadPart({
        Bucket: bucket,
        Key: key,
        PartNumber: counter,
        UploadId: uploadID,
        Body: chunks.slice(0, chunks.length)
    })
    .promise()
    .then(
        result => {
            log("upload result:", result)
            return result
        }
    )
    .then(
        set('PartNumber', counter)
    )
    .then(
        result =>
            ({
                part: result,
                isLast
            })
    )
const getFiveMegStream = uploadPartPartial => {
    let size = -1
    let lastOne = false
    let counter = 0
    let chunks = Buffer.from([])
    let cloneBuffer
    return new stream.Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        transform(chunk, encoding, callback) {
            if(size === -1) {
                size = chunk.length
            }
            if(chunk.length !== size) {
                log("lastOne incoming")
                lastOne = true
            }
            chunks = Buffer.concat([chunks, chunk])
            if(chunks.length < FIVE_MEGS && lastOne === false) {
                callback()
                return true
            }
            
            counter++
            cloneBuffer = chunks.slice(0, chunks.length)
            uploadPartPartial(counter)(cloneBuffer)(lastOne)
            .then(
                ({ part, isLast }) => {
                    if(isLast === false) {
                        // this.push(JSON.stringify(part))
                        callback(undefined, JSON.stringify(part))
                        return
                    }
                    // this.push(JSON.stringify(set('isLast', true, part)))
                    // this.push(null)
                    callback(undefined, JSON.stringify(set('isLast', true, part)))
                }
            )
            .catch(
                error => {
                    this.emit('error', error)
                }
            )
            chunks = Buffer.from([])
            return false
        }
    })
}

const getPartsAssemblerStream = s3 => bucket => key => uploadID => {
    const parts = []
    return new stream.Writable({
        writableObjectMode: true,
        // readableObjectMode: true,
        write(partJSON, encoding, callback) {     
            const part = JSON.parse(partJSON)
            
            log("part:", part)                                                                                                                                                                                                 
            if(getOr(false, 'isLast', part) === false) {
                parts.push(part)
                callback()
                return true
            }
            // log("Part:", part)
            log("Done, uploading all...")
            parts.push(pick(['ETag', 'PartNumber'], part))
            log(parts)
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

            // const responseStream = await downloadLatestAsteroids()
            const responseStream = fs.createReadStream('latest_fulldb.csv')
            const { UploadId } = await s3.createMultipartUpload({
                Bucket: bucket,
                Key: asteroidsLatestFilename
            })
            .promise()

            
            const parts = []
            let chunks = Buffer.from([])
            const uploadPartPartial = uploadPart(s3)(bucket)(asteroidsLatestFilename)(UploadId)
            
            pipeline(
                responseStream,
                getFiveMegStream(uploadPartPartial),
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

    const result = await downloadLatestAsteroidsAndUploadToS3(event)
    log("result:", result)
    return event
}

module.exports = handler

if(require.main === module) {
    handler({bucket: 'asteroid-files', asteroidsLatestFilename: 'latest-asteroids.csv'})
    .then(log)
    .catch(log)
}

