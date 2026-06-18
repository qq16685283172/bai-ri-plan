/**
 * 验证精网号是否已报名
 * GET /api/verify?jingwanghao=50207386
 * 返回: { "exists": true/false }
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

async function handleRequest(request) {
  const url = new URL(request.url)

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  const path = url.pathname

  // 验证精网号
  if (path === '/api/verify') {
    const jingwanghao = url.searchParams.get('jingwanghao')
    if (!jingwanghao) {
      return jsonResponse({ error: '缺少精网号参数' }, 400)
    }
    return verifyUser(jingwanghao)
  }

  // 报名（新增精网号）
  if (path === '/api/signup') {
    const jingwanghao = url.searchParams.get('jingwanghao')
    if (!jingwanghao) {
      return jsonResponse({ error: '缺少精网号参数' }, 400)
    }
    return signupUser(jingwanghao)
  }

  // 获取已报名用户数量
  if (path === '/api/count') {
    return getUserCount()
  }

  return jsonResponse({ error: '未知接口' }, 404)
}

async function verifyUser(jingwanghao) {
  try {
    const users = await USERS_KV.get('users', 'json')
    const userList = users?.users || []
    const exists = userList.includes(jingwanghao)
    return jsonResponse({ exists, jingwanghao })
  } catch (e) {
    return jsonResponse({ error: '服务器错误' }, 500)
  }
}

async function signupUser(jingwanghao) {
  try {
    const users = await USERS_KV.get('users', 'json')
    const userList = users?.users || []

    if (userList.includes(jingwanghao)) {
      return jsonResponse({ success: true, message: '已报名用户', isNew: false })
    }

    userList.push(jingwanghao)
    await USERS_KV.put('users', JSON.stringify({ users: userList }))

    return jsonResponse({
      success: true,
      message: '报名成功',
      isNew: true,
      jingwanghao
    })
  } catch (e) {
    return jsonResponse({ error: '服务器错误' }, 500)
  }
}

async function getUserCount() {
  try {
    const users = await USERS_KV.get('users', 'json')
    const userList = users?.users || []
    return jsonResponse({ count: userList.length })
  } catch (e) {
    return jsonResponse({ error: '服务器错误' }, 500)
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  })
}
