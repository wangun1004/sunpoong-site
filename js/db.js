// Supabase client + fallback localStorage mode
let _sb = null

function getClient() {
  if (_sb) return _sb
  if (typeof supabase !== 'undefined' &&
      SUPABASE_URL !== 'https://YOUR_PROJECT.supabase.co') {
    _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON)
  }
  return _sb
}

// ── 견적 문의 ──────────────────────────────────────────────
async function submitInquiry(data) {
  const sb = getClient()
  if (sb) {
    const { error } = await sb.from('inquiries').insert([data])
    if (error) throw error
  } else {
    // localStorage fallback (개발용)
    const list = JSON.parse(localStorage.getItem('inquiries') || '[]')
    list.unshift({ ...data, id: Date.now(), status: 'pending', created_at: new Date().toISOString() })
    localStorage.setItem('inquiries', JSON.stringify(list))
  }
}

async function getInquiries({ status, search, page = 1, limit = 20 } = {}) {
  const sb = getClient()
  if (sb) {
    let q = sb.from('inquiries').select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (status && status !== 'all') q = q.eq('status', status)
    if (search) q = q.or(`name.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`)
    const { data, count, error } = await q
    if (error) throw error
    return { data, count }
  } else {
    let list = JSON.parse(localStorage.getItem('inquiries') || '[]')
    if (status && status !== 'all') list = list.filter(r => r.status === status)
    if (search) list = list.filter(r =>
      [r.name, r.phone, r.address].some(v => v?.includes(search)))
    return { data: list.slice((page - 1) * limit, page * limit), count: list.length }
  }
}

async function updateInquiry(id, patch) {
  const sb = getClient()
  if (sb) {
    const { error } = await sb.from('inquiries').update(patch).eq('id', id)
    if (error) throw error
  } else {
    const list = JSON.parse(localStorage.getItem('inquiries') || '[]')
    const i = list.findIndex(r => r.id == id)
    if (i >= 0) { list[i] = { ...list[i], ...patch }; localStorage.setItem('inquiries', JSON.stringify(list)) }
  }
}

// ── 게시판 ─────────────────────────────────────────────────
async function getPosts({ category, page = 1, limit = 15 } = {}) {
  const sb = getClient()
  if (sb) {
    let q = sb.from('board_posts').select('*', { count: 'exact' })
      .order('is_notice', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    if (category && category !== 'all') q = q.eq('category', category)
    const { data, count, error } = await q
    if (error) throw error
    return { data, count }
  } else {
    let list = JSON.parse(localStorage.getItem('board_posts') || defaultPosts())
    if (category && category !== 'all') list = list.filter(r => r.category === category)
    list = list.sort((a, b) => (b.is_notice - a.is_notice) || (new Date(b.created_at) - new Date(a.created_at)))
    return { data: list.slice((page - 1) * limit, page * limit), count: list.length }
  }
}

async function getPost(id) {
  const sb = getClient()
  if (sb) {
    const { data, error } = await sb.from('board_posts')
      .select('*').eq('id', id).single()
    if (error) throw error
    await sb.from('board_posts').update({ views: (data.views || 0) + 1 }).eq('id', id)
    return data
  } else {
    const list = JSON.parse(localStorage.getItem('board_posts') || defaultPosts())
    const post = list.find(r => r.id == id)
    if (post) { post.views = (post.views || 0) + 1; localStorage.setItem('board_posts', JSON.stringify(list)) }
    return post
  }
}

async function createPost(data) {
  const sb = getClient()
  if (sb) {
    const { error } = await sb.from('board_posts').insert([data])
    if (error) throw error
  } else {
    const list = JSON.parse(localStorage.getItem('board_posts') || defaultPosts())
    list.unshift({ ...data, id: Date.now(), views: 0, created_at: new Date().toISOString() })
    localStorage.setItem('board_posts', JSON.stringify(list))
  }
}

async function updatePost(id, patch) {
  const sb = getClient()
  if (sb) {
    const { error } = await sb.from('board_posts').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  } else {
    const list = JSON.parse(localStorage.getItem('board_posts') || defaultPosts())
    const i = list.findIndex(r => r.id == id)
    if (i >= 0) { list[i] = { ...list[i], ...patch }; localStorage.setItem('board_posts', JSON.stringify(list)) }
  }
}

async function deletePost(id) {
  const sb = getClient()
  if (sb) {
    const { error } = await sb.from('board_posts').delete().eq('id', id)
    if (error) throw error
  } else {
    let list = JSON.parse(localStorage.getItem('board_posts') || defaultPosts())
    list = list.filter(r => r.id != id)
    localStorage.setItem('board_posts', JSON.stringify(list))
  }
}

// ── Admin Auth ─────────────────────────────────────────────
async function adminLogin(email, password) {
  const sb = getClient()
  if (sb) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  } else {
    if (email === 'admin@sunpoong.co.kr' && password === 'admin1234') {
      localStorage.setItem('admin_token', 'dev_token')
      return true
    }
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다')
  }
}

async function adminLogout() {
  const sb = getClient()
  if (sb) await sb.auth.signOut()
  localStorage.removeItem('admin_token')
}

async function isAdminLoggedIn() {
  const sb = getClient()
  if (sb) {
    const { data } = await sb.auth.getSession()
    return !!data.session
  }
  return !!localStorage.getItem('admin_token')
}

// ── 시공 프로젝트 ───────────────────────────────────────────
async function getProjects({ category, page = 1, limit = 20 } = {}) {
  const sb = getClient()
  if (sb) {
    try {
      let q = sb.from('projects').select('*', { count: 'exact' })
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)
      if (category && category !== 'all') q = q.eq('category', category)
      const { data, count, error } = await q
      if (error) throw error
      return { data, count }
    } catch(e) {
      // 테이블 미생성 시 로컬 샘플 데이터로 fallback
      let list = JSON.parse(localStorage.getItem('projects') || defaultProjects())
      if (category && category !== 'all') list = list.filter(r => r.category === category)
      return { data: list.slice((page-1)*limit, page*limit), count: list.length, _fallback: true }
    }
  } else {
    let list = JSON.parse(localStorage.getItem('projects') || defaultProjects())
    if (category && category !== 'all') list = list.filter(r => r.category === category)
    return { data: list.slice((page - 1) * limit, page * limit), count: list.length }
  }
}

async function getAllProjectsAdmin({ page = 1, limit = 20 } = {}) {
  const sb = getClient()
  if (sb) {
    try {
      const { data, count, error } = await sb.from('projects')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)
      if (error) throw error
      return { data, count }
    } catch(e) {
      const list = JSON.parse(localStorage.getItem('projects') || defaultProjects())
      return { data: list.slice((page-1)*limit, page*limit), count: list.length, _fallback: true }
    }
  } else {
    const list = JSON.parse(localStorage.getItem('projects') || defaultProjects())
    return { data: list.slice((page - 1) * limit, page * limit), count: list.length }
  }
}

async function createProject(data) {
  const sb = getClient()
  if (sb) {
    const { data: row, error } = await sb.from('projects').insert([data]).select().single()
    if (error) throw error
    return row
  } else {
    const list = JSON.parse(localStorage.getItem('projects') || defaultProjects())
    const row = { ...data, id: Date.now(), created_at: new Date().toISOString() }
    list.unshift(row)
    localStorage.setItem('projects', JSON.stringify(list))
    return row
  }
}

async function updateProject(id, data) {
  const sb = getClient()
  if (sb) {
    const { error } = await sb.from('projects').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  } else {
    const list = JSON.parse(localStorage.getItem('projects') || defaultProjects())
    const i = list.findIndex(r => r.id == id)
    if (i >= 0) { list[i] = { ...list[i], ...data }; localStorage.setItem('projects', JSON.stringify(list)) }
  }
}

async function deleteProject(id) {
  const sb = getClient()
  if (sb) {
    const { error } = await sb.from('projects').delete().eq('id', id)
    if (error) throw error
  } else {
    let list = JSON.parse(localStorage.getItem('projects') || defaultProjects())
    list = list.filter(r => r.id != id)
    localStorage.setItem('projects', JSON.stringify(list))
  }
}

async function uploadProjectImages(projectId, files) {
  const sb = getClient()
  const urls = []
  for (let i = 0; i < Math.min(files.length, 5); i++) {
    const file = files[i]
    const ext = file.name.split('.').pop()
    const path = `${projectId}/${Date.now()}_${i}.${ext}`
    if (sb) {
      const { error } = await sb.storage.from('project-images').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = sb.storage.from('project-images').getPublicUrl(path)
      urls.push(publicUrl)
    } else {
      urls.push(URL.createObjectURL(file))
    }
  }
  return urls
}

function defaultProjects() {
  return JSON.stringify([
    { id: 9, title: '광주 서구 주상복합 해체공사', category: 'rc', description: '연면적 1,200㎡, 지상 5층 RC구조 주상복합 건물 해체공사.', tags: ['연면적 1,200㎡','지상 5층','RC구조','2024'], youtube_url: '', images: [], status: 'published', created_at: '2024-10-01T00:00:00Z' },
    { id: 8, title: '광산구 식품공장 철거공사', category: 'steel', description: '연면적 3,500㎡ 단층 철골구조 식품공장 철거.', tags: ['연면적 3,500㎡','단층','철골구조','2024'], youtube_url: '', images: [], status: 'published', created_at: '2024-08-01T00:00:00Z' },
    { id: 7, title: '북구 아파트 증축 코어 커팅', category: 'cutting', description: '아파트 증축을 위한 벽체 코어 커팅 작업.', tags: ['벽체 커팅','와이어쏘','무진동','2023'], youtube_url: '', images: [], status: 'published', created_at: '2023-11-01T00:00:00Z' },
    { id: 6, title: '동구 대형마트 내부 인테리어 철거', category: 'interior', description: '3,000㎡ 대형마트 내부 인테리어 철거.', tags: ['3,000㎡','야간 작업','2023'], youtube_url: '', images: [], status: 'published', created_at: '2023-09-01T00:00:00Z' },
    { id: 5, title: '남구 폐교 건물 해체공사', category: 'rc', description: '연면적 2,200㎡ 지상 3층 RC구조 폐교 해체.', tags: ['연면적 2,200㎡','지상 3층','RC구조','2023'], youtube_url: '', images: [], status: 'published', created_at: '2023-06-01T00:00:00Z' },
    { id: 4, title: '서구 재개발구역 폐기물 처리', category: 'waste', description: '재개발구역 내 폐콘크리트·폐목재 수집 운반.', tags: ['폐콘크리트 800톤','폐목재 120톤','2022'], youtube_url: '', images: [], status: 'published', created_at: '2022-10-01T00:00:00Z' },
  ])
}

// 샘플 게시글 데이터
function defaultPosts() {
  return JSON.stringify([
    { id: 3, title: '2025년 하절기 안전관리 강화 안내', content: '하절기 폭염에 따른 현장 안전관리를 강화합니다.\n\n• 오전 11시~오후 2시 옥외작업 제한\n• 충분한 수분 및 그늘 휴식\n• 열사병 예방 교육 실시', author: '관리자', category: 'notice', views: 42, is_notice: true, created_at: '2025-06-01T09:00:00Z' },
    { id: 2, title: '광주 서구 ○○동 주상복합 해체공사 완료', content: '연면적 1,200㎡ 철근콘크리트 구조 주상복합 건물 해체공사를 성공적으로 완료하였습니다.', author: '관리자', category: 'project', views: 87, is_notice: false, created_at: '2025-05-15T09:00:00Z' },
    { id: 1, title: '선풍건설산업 홈페이지 오픈 안내', content: '선풍건설산업 공식 홈페이지가 오픈되었습니다. 많은 관심과 이용 부탁드립니다.', author: '관리자', category: 'notice', views: 123, is_notice: false, created_at: '2025-04-01T09:00:00Z' },
  ])
}
