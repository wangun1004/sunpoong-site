// ===== 공통 유틸 =====
function toast(msg, type = 'success') {
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3000)
}

function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatDateTime(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ===== 헤더 / 내비 =====
function initNav() {
  const hamburger = document.querySelector('.hamburger')
  const nav = document.querySelector('nav')
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => nav.classList.toggle('open'))
  }
  // 현재 페이지 active
  const path = location.pathname.split('/').pop() || 'index.html'
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href')
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active')
    }
  })
}

// ===== 게시판 유틸 =====
function categoryLabel(cat) {
  return { notice: '공지', project: '시공사례', news: '뉴스', qna: 'Q&A' }[cat] || cat
}

function statusLabel(s) {
  return { pending: '접수', reviewing: '검토중', completed: '완료', cancelled: '취소' }[s] || s
}

function statusTag(s) {
  const map = {
    pending: 'tag-yellow', reviewing: 'tag-blue',
    completed: 'tag-green', cancelled: 'tag-red'
  }
  return `<span class="tag ${map[s] || 'tag-blue'}">${statusLabel(s)}</span>`
}

// URL 파라미터
function getParam(key) {
  return new URLSearchParams(location.search).get(key)
}

document.addEventListener('DOMContentLoaded', initNav)
