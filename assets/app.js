(function () {
  'use strict'

  const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/
  const API_ROOT = 'https://www.quantacenter.com/open/pages/'
  const FALLBACK_NAME = '我的个人空间'
  const FALLBACK_INITIAL = '塔'
  const PAGE_SIZE = 20

  const md = window.markdownit ? window.markdownit({ html: false, linkify: true }) : null

  function resolveSlug() {
    const fromQuery = new URLSearchParams(location.search).get('slug')
    if (fromQuery && SLUG_PATTERN.test(fromQuery)) return fromQuery
    const first = (location.hostname || '').toLowerCase().split('.')[0]
    return SLUG_PATTERN.test(first) ? first : ''
  }

  const SLUG = resolveSlug()
  const API_BASE = SLUG ? API_ROOT + SLUG : ''

  function text(value) {
    return value == null ? '' : String(value).trim()
  }

  function showFatal(message) {
    const banner = document.createElement('div')
    banner.className = 'fatal'
    banner.textContent = message
    document.body.prepend(banner)
  }

  function showStatus(target, message, isError) {
    if (!target) return
    target.textContent = message
    target.classList.toggle('status--error', Boolean(isError))
  }

  async function fetchApi(path) {
    let response
    try {
      response = await fetch(API_BASE + path, { credentials: 'omit' })
    } catch (error) {
      throw new Error('网络连接失败，请稍后重试')
    }
    let payload = null
    try {
      payload = await response.json()
    } catch (error) {
      payload = null
    }
    if (!response.ok) {
      const message = payload && payload.msg ? payload.msg : '请求失败（HTTP ' + response.status + '）'
      const failure = new Error(message)
      failure.status = response.status
      throw failure
    }
    return payload ? payload.data : null
  }

  function displayName(profile) {
    return text(profile && profile.displayName) || FALLBACK_NAME
  }

  function commentName(comment) {
    return text(comment && comment.authorNickname) || '塔员'
  }

  function firstChar(name) {
    return Array.from(name || FALLBACK_INITIAL)[0] || FALLBACK_INITIAL
  }

  function letterAvatar(name, className) {
    const span = document.createElement('span')
    span.className = className + ' avatar--letter'
    span.textContent = firstChar(name)
    span.setAttribute('aria-hidden', 'true')
    return span
  }

  function createAvatar(name, src, className) {
    if (!src) return letterAvatar(name, className)
    const image = document.createElement('img')
    image.className = className
    image.src = src
    image.alt = name
    image.loading = 'lazy'
    image.addEventListener('error', function () {
      image.replaceWith(letterAvatar(name, className))
    })
    return image
  }

  function safeHttpUrl(value) {
    try {
      const url = new URL(value)
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : ''
    } catch (error) {
      return ''
    }
  }

  function setProfileText(key, value) {
    const next = text(value)
    if (!next) return
    document.querySelectorAll('[data-profile="' + key + '"]').forEach(function (element) {
      element.textContent = next
    })
  }

  function renderSkills(profile) {
    const skills = profile && Array.isArray(profile.skills)
      ? profile.skills.map(text).filter(Boolean).slice(0, 5)
      : []
    document.querySelectorAll('[data-profile="skills"]').forEach(function (list) {
      list.replaceChildren()
      skills.forEach(function (skill) {
        const item = document.createElement('li')
        item.className = 'chip'
        item.textContent = skill
        list.appendChild(item)
      })
      list.hidden = skills.length === 0
    })
  }

  function renderLinks(profile) {
    const links = []
    if (profile) {
      const github = safeHttpUrl(profile.githubUrl)
      const website = safeHttpUrl(profile.websiteUrl)
      const email = text(profile.contactEmail)
      if (github) links.push({ label: 'GitHub', href: github })
      if (website) links.push({ label: '个人主页', href: website })
      if (email) links.push({ label: 'Email', href: 'mailto:' + email })
    }
    document.querySelectorAll('[data-profile="links"]').forEach(function (container) {
      container.replaceChildren()
      links.forEach(function (link) {
        const anchor = document.createElement('a')
        anchor.className = 'link-pill'
        anchor.href = link.href
        anchor.textContent = link.label
        if (link.href.indexOf('http') === 0) {
          anchor.target = '_blank'
          anchor.rel = 'noopener'
        }
        container.appendChild(anchor)
      })
      container.hidden = links.length === 0
    })
  }

  function renderProfile(profile) {
    const name = displayName(profile)
    document.querySelectorAll('[data-profile="name"]').forEach(function (element) {
      element.textContent = name
    })
    document.querySelectorAll('[data-profile="initial"]').forEach(function (element) {
      element.textContent = firstChar(name)
    })
    document.querySelectorAll('[data-profile="avatar"]').forEach(function (slot) {
      slot.replaceChildren(createAvatar(name, profile && profile.avatar, 'avatar avatar--lg'))
    })
    setProfileText('headline', profile && profile.headline)
    setProfileText('bio', profile && profile.bio)
    setProfileText('about-bio', profile && profile.bio)
    renderSkills(profile)
    renderLinks(profile)
  }

  function applyTitle(profile, page) {
    const name = displayName(profile)
    if (page === 'index') {
      document.title = name === FALLBACK_NAME ? FALLBACK_NAME : name + ' · 个人网站'
    } else if (page === 'blog') {
      document.title = '文章 · ' + name
    } else if (page === 'about') {
      document.title = '关于 · ' + name
    }
  }

  function renderMarkdown(source) {
    if (md) return md.render(source || '')
    const pre = document.createElement('pre')
    pre.textContent = source || ''
    return pre.outerHTML
  }

  function formatDate(value) {
    return value ? String(value).slice(0, 10) : ''
  }

  function categoryLabel(category) {
    return { TECH: '技术', PROJECT: '项目', LIFE: '生活' }[category] || category || '文章'
  }

  function postUrl(postId) {
    return 'article.html?id=' + encodeURIComponent(postId)
  }

  function renderPostCard(post) {
    const card = document.createElement('article')
    card.className = 'post-card'

    const meta = document.createElement('div')
    meta.className = 'post-card__meta'
    const tag = document.createElement('span')
    tag.className = 'chip'
    tag.textContent = categoryLabel(post.category)
    const date = document.createElement('span')
    date.textContent = formatDate(post.createdAt)
    meta.append(tag, date)

    const title = document.createElement('h3')
    const link = document.createElement('a')
    link.href = postUrl(post.postId)
    link.textContent = post.title
    title.appendChild(link)

    const excerpt = document.createElement('p')
    excerpt.textContent = post.excerpt || ''

    const foot = document.createElement('p')
    foot.className = 'post-card__foot'
    foot.textContent = (post.commentCount || 0) + ' 条留言'

    card.append(meta, title, excerpt, foot)
    return card
  }

  function renderPostRow(post) {
    const row = document.createElement('article')
    row.className = 'post-row'

    const meta = document.createElement('div')
    meta.className = 'post-row__meta'
    const tag = document.createElement('span')
    tag.className = 'chip'
    tag.textContent = categoryLabel(post.category)
    const date = document.createElement('span')
    date.textContent = formatDate(post.createdAt)
    meta.append(tag, date)

    const title = document.createElement('h3')
    const link = document.createElement('a')
    link.href = postUrl(post.postId)
    link.textContent = post.title
    title.appendChild(link)

    const excerpt = document.createElement('p')
    excerpt.textContent = post.excerpt || ''

    row.append(meta, title, excerpt)
    return row
  }

  async function fetchAllPosts() {
    const all = []
    for (let pageNum = 1; pageNum <= 20; pageNum += 1) {
      const data = await fetchApi('/posts?pageNum=' + pageNum + '&pageSize=50')
      const items = data.items || []
      all.push(...items)
      if (items.length < 50 || all.length >= (data.total || 0)) break
    }
    return all
  }

  function renderComment(comment) {
    const item = document.createElement('div')
    item.className = 'comment'
    const name = commentName(comment)
    item.appendChild(createAvatar(name, comment.authorAvatar, 'avatar avatar--sm'))

    const body = document.createElement('div')
    body.className = 'comment__body'
    const meta = document.createElement('div')
    meta.className = 'comment__meta'
    const reply = comment.replyToNickname ? ' 回复 ' + comment.replyToNickname : ''
    meta.textContent = name + reply + ' · ' + formatDate(comment.createdAt)
    const content = document.createElement('p')
    content.textContent = comment.content
    body.append(meta, content)
    item.appendChild(body)
    return item
  }

  async function initIndex() {
    const list = document.getElementById('latest')
    const status = document.getElementById('latest-status')
    if (!list) return
    try {
      const data = await fetchApi('/posts?pageNum=1&pageSize=6')
      if (!data.items || !data.items.length) {
        showStatus(status, '还没有公开的文章')
        return
      }
      showStatus(status, '')
      data.items.forEach(function (post) {
        list.appendChild(renderPostCard(post))
      })
    } catch (error) {
      showStatus(status, error.message, true)
    }
  }

  async function initBlog() {
    const list = document.getElementById('post-list')
    const status = document.getElementById('list-status')
    const filters = document.getElementById('category-filters')
    const more = document.getElementById('load-more')
    if (!list) return

    let posts = []
    try {
      posts = await fetchAllPosts()
    } catch (error) {
      showStatus(status, error.message, true)
      return
    }

    const state = { category: 'ALL', visible: PAGE_SIZE }

    function render() {
      const filtered = state.category === 'ALL'
        ? posts
        : posts.filter(function (post) { return post.category === state.category })
      list.replaceChildren()
      filtered.slice(0, state.visible).forEach(function (post) {
        list.appendChild(renderPostRow(post))
      })
      showStatus(status, filtered.length ? '共 ' + filtered.length + ' 篇文章' : '这个分类下还没有文章')
      if (more) more.hidden = state.visible >= filtered.length
    }

    if (filters) {
      filters.addEventListener('click', function (event) {
        const button = event.target.closest('button[data-category]')
        if (!button) return
        state.category = button.getAttribute('data-category')
        state.visible = PAGE_SIZE
        filters.querySelectorAll('button').forEach(function (item) {
          item.classList.toggle('is-active', item === button)
        })
        render()
      })
    }
    if (more) {
      more.addEventListener('click', function () {
        state.visible += PAGE_SIZE
        render()
      })
    }
    render()
  }

  async function initArticle(profile) {
    const titleElement = document.getElementById('article-title')
    const metaElement = document.getElementById('article-meta')
    const contentElement = document.getElementById('article-content')
    const status = document.getElementById('article-status')
    const commentsElement = document.getElementById('comments-list')
    const id = new URLSearchParams(location.search).get('id')

    if (!id || !/^\d+$/.test(id)) {
      showStatus(status, '缺少文章 ID', true)
      return
    }

    try {
      const post = await fetchApi('/posts/' + id)
      showStatus(status, '')
      titleElement.textContent = post.title
      metaElement.textContent = categoryLabel(post.category) + ' · ' + formatDate(post.createdAt)
        + ' · ' + (post.commentCount || 0) + ' 条留言'
      contentElement.innerHTML = renderMarkdown(post.content)
      document.title = post.title + ' · ' + displayName(profile)

      if (commentsElement) {
        try {
          const comments = await fetchApi('/posts/' + id + '/comments?pageNum=1&pageSize=50')
          commentsElement.replaceChildren()
          if (!comments.items || !comments.items.length) {
            const empty = document.createElement('div')
            empty.className = 'empty'
            empty.textContent = '还没有留言'
            commentsElement.appendChild(empty)
          } else {
            comments.items.forEach(function (comment) {
              commentsElement.appendChild(renderComment(comment))
            })
          }
        } catch (error) {
          commentsElement.textContent = '留言加载失败：' + error.message
        }
      }
    } catch (error) {
      titleElement.textContent = '文章不存在'
      metaElement.textContent = ''
      contentElement.replaceChildren()
      showStatus(status, error.status === 404 ? '文章不存在或未公开' : error.message, true)
    }
  }

  function markActiveNav() {
    const page = document.body.getAttribute('data-page')
    const href = { index: 'index.html', blog: 'blog.html', article: 'blog.html', about: 'about.html' }[page]
    document.querySelectorAll('.nav a').forEach(function (link) {
      if (link.getAttribute('href') === href) link.classList.add('is-active')
    })
  }

  async function loadProfile() {
    if (!API_BASE) return null
    try {
      const profile = await fetchApi('/profile')
      renderProfile(profile)
      return profile
    } catch (error) {
      renderProfile(null)
      return null
    }
  }

  document.addEventListener('DOMContentLoaded', async function () {
    markActiveNav()
    if (!SLUG) {
      showFatal('无法识别站点标识：请通过 {你的标识}.page.quantacenter.com 访问，或在地址后加 ?slug=你的标识。')
      return
    }
    const profile = await loadProfile()
    const page = document.body.getAttribute('data-page')
    applyTitle(profile, page)
    if (page === 'index') await initIndex()
    else if (page === 'blog') await initBlog()
    else if (page === 'article') await initArticle(profile)
  })
})()
