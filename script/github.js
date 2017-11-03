const path = require('path')
const fs = require('fs')
const _request = require('request')

function getErrorFromBody(body, opts) {
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch (e) {}
  }
  // hide token from logs
  opts.headers.Authorization = 'Token **********'
  // log the request options to help debugging
  body.request = opts
  return new Error(JSON.stringify(body, null, '  '))
}

function request(opts) {
  return new Promise(function(resolve, reject) {
    _request(opts, function(err, response, body) {
      if (err) {
        return reject(err)
      }
      const is2xx = !err && /^2/.test('' + response.statusCode)
      if (!is2xx) {
        return reject(getErrorFromBody(body, opts))
      }
      resolve(body)
    })
  })
}

function options(token, url, method) {
  return {
    method: method || 'GET',
    url: url,
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: 'Token ' + token,
      'User-Agent': 'SKPM-Release-Agent',
    },
  }
}

module.exports = {
  getOrCreateDraftRelease: function(token, repo, tag, branch, changelog) {
    return request(
      options(
        token,
        'https://api.github.com/repos/' + repo + '/releases/tags/' + tag
      )
    )
      .then(function(res) {
        return res
      })
      .catch(function() {
        const opts = options(
          token,
          'https://api.github.com/repos/' + repo + '/releases',
          'POST'
        )
        opts.json = {
          tag_name: tag,
          target_commitish: branch,
          body: '* ' + changelog.join('\n* '),
          name: tag,
          draft: true,
        }
        return request(opts)
      })
  },
  updateAsset: function(token, repo, releaseId, asset, fileName) {
    const name = path.basename(asset)
    const opts = options(
      token,
      'https://uploads.github.com/repos/' +
        repo +
        '/releases/' +
        releaseId +
        '/assets?name=' +
        encodeURIComponent(name),
      'POST'
    )
    const stat = fs.statSync(asset)
    const rd = fs.createReadStream(asset)
    opts.headers['Content-Type'] = 'application/zip'
    opts.headers['Content-Length'] = stat.size
    const us = _request(opts)

    return new Promise(function(resolve, reject) {
      rd.on('error', function(err) {
        return reject(err)
      })
      us.on('error', function(err) {
        return reject(err)
      })
      us.on('end', function() {
        resolve({ name: name })
      })

      rd.pipe(us)
    })
  },
  publishRelease: function(token, repo, releaseId) {
    const opts = options(
      token,
      'https://api.github.com/repos/' + repo + '/releases/' + releaseId,
      'PATCH'
    )
    opts.json = {
      draft: false,
    }
    return request(opts)
  },
}
