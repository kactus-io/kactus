import * as path from 'path'
import * as fs from 'fs'
import * as _request from 'request'

function getErrorFromBody(body: string | any, opts: any) {
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

function request<T>(opts: any): Promise<T> {
  return new Promise(function(resolve, reject) {
    _request(opts, (error: any, response: _request.Response, body: any) => {
      if (error) {
        return reject(error)
      }
      const is2xx = !error && /^2/.test('' + response.statusCode)
      if (!is2xx) {
        return reject(getErrorFromBody(body, opts))
      }
      resolve(body)
    })
  })
}

function options(token: string, url: string, method?: string): any {
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

export function getOrCreateDraftRelease(
  token: string,
  repo: string,
  tag: string,
  branch: string,
  changelog: string[]
): Promise<{ id: string }> {
  return request<{ id: string }>(
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
      return request<{ id: string }>(opts)
    })
}
export function updateAsset(
  token: string,
  repo: string,
  releaseId: string,
  asset: string
): Promise<{ name: string }> {
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
}
export function publishRelease(token: string, repo: string, releaseId: string) {
  const opts = options(
    token,
    'https://api.github.com/repos/' + repo + '/releases/' + releaseId,
    'PATCH'
  )
  opts.json = {
    draft: false,
  }
  return request(opts)
}
