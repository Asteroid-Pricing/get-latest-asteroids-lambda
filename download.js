const log = console.log
const https = require('https')

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
                    // response.pipe(fs.createWriteStream('db.csv'))
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

// const downloadLatestAsteroids = () =>
//     new Promise(
//         (success, failure) => {
//             const req = https.request(
//                     {
//                     hostname: 'speed.hetzner.de',
//                     port: 443,
//                     path: '/1GB.bin',
//                     method: 'GET'
//                 },
//                 response => {
//                     log("response.statusCode:", response.statusCode, response.statusMessage)
//                     success(response)
//                 }
//             )
//             req.on('error', error => {
//                 log('error:', error)
//                 failure(error)
//             })
//             req.end()
//         }
//     )

module.exports = downloadLatestAsteroids