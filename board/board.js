const TABLE_NAME = "board_posts";
const AUTHOR_STORAGE_KEY = "jhzzang12-board-author";
const MAX_CONTENT_LENGTH = 2000;
const BOARD_CONFIG = window.BOARD_CONFIG || null;

const {
  connectionBadge,
  postCount,
  latestAuthor,
  latestTime,
  postForm,
  authorInput,
  titleInput,
  contentInput,
  contentCounter,
  formMessage,
  boardMessage,
  postList,
  refreshButton,
  searchInput,
  submitButton,
} = {
  connectionBadge: document.getElementById("connectionBadge"),
  postCount: document.getElementById("postCount"),
  latestAuthor: document.getElementById("latestAuthor"),
  latestTime: document.getElementById("latestTime"),
  postForm: document.getElementById("postForm"),
  authorInput: document.getElementById("authorInput"),
  titleInput: document.getElementById("titleInput"),
  contentInput: document.getElementById("contentInput"),
  contentCounter: document.getElementById("contentCounter"),
  formMessage: document.getElementById("formMessage"),
  boardMessage: document.getElementById("boardMessage"),
  postList: document.getElementById("postList"),
  refreshButton: document.getElementById("refreshButton"),
  searchInput: document.getElementById("searchInput"),
  submitButton: document.getElementById("submitButton"),
};

let postCache = [];
let supabaseClient = null;

function createSupabaseClient(config) {
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    throw new Error("Supabase 브라우저 클라이언트를 불러오지 못했습니다.");
  }

  return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
}

function normalizeSingleLine(value) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeParagraph(value) {
  return value.trim();
}

function setConnectionState(state, label) {
  connectionBadge.dataset.state = state;
  connectionBadge.textContent = label;
}

function setMessage(target, tone, text) {
  target.dataset.tone = tone;
  target.textContent = text;
}

function clearMessage(target) {
  target.dataset.tone = "";
  target.textContent = "";
}

function updateCounter() {
  contentCounter.textContent = `${contentInput.value.length} / ${MAX_CONTENT_LENGTH}`;
}

function isConfigured() {
  return Boolean(
    BOARD_CONFIG &&
      typeof BOARD_CONFIG.supabaseUrl === "string" &&
      BOARD_CONFIG.supabaseUrl &&
      typeof BOARD_CONFIG.supabaseAnonKey === "string" &&
      BOARD_CONFIG.supabaseAnonKey
  );
}

function disableBoard(reason) {
  setConnectionState("error", "설정 필요");
  setMessage(boardMessage, "error", reason);
  setMessage(formMessage, "error", reason);

  [authorInput, titleInput, contentInput, searchInput, refreshButton, submitButton].forEach((element) => {
    element.disabled = true;
  });
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getReadableError(error) {
  const message = error && error.message ? error.message : "알 수 없는 오류가 발생했습니다.";

  if (error && error.code === "42P01") {
    return "Supabase에 public.board_posts 테이블이 없습니다. supabase/board_posts.sql을 먼저 실행하세요.";
  }

  if (message.includes("row-level security")) {
    return "RLS 정책 때문에 쓰기 또는 읽기가 막혀 있습니다. SQL 파일의 정책을 같이 적용하세요.";
  }

  if (message.includes("Failed to fetch")) {
    return "Supabase 연결에 실패했습니다. 프로젝트 URL과 anon key를 다시 확인하세요.";
  }

  return message;
}

function updateStats(posts) {
  postCount.textContent = String(posts.length);

  if (!posts.length) {
    latestAuthor.textContent = "-";
    latestTime.textContent = "-";
    return;
  }

  latestAuthor.textContent = posts[0].author;
  latestTime.textContent = formatDate(posts[0].created_at);
}

function createPostCard(post) {
  const card = document.createElement("article");
  card.className = "post-card";

  const meta = document.createElement("div");
  meta.className = "post-meta";

  const author = document.createElement("span");
  author.className = "post-author";
  author.textContent = post.author;

  const time = document.createElement("time");
  time.dateTime = post.created_at;
  time.textContent = formatDate(post.created_at);

  meta.append(author, time);

  const title = document.createElement("h3");
  title.textContent = post.title;

  const content = document.createElement("p");
  content.textContent = post.content;

  card.append(meta, title, content);
  return card;
}

function getFilteredPosts() {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    return postCache;
  }

  return postCache.filter((post) => {
    const haystack = `${post.author} ${post.title} ${post.content}`.toLowerCase();
    return haystack.includes(query);
  });
}

function renderPosts() {
  const filteredPosts = getFilteredPosts();
  postList.replaceChildren();

  if (!postCache.length) {
    setMessage(boardMessage, "success", "첫 게시글을 남겨서 이 피드를 채워보세요.");
    return;
  }

  if (!filteredPosts.length) {
    setMessage(boardMessage, "error", "검색 결과가 없습니다. 다른 키워드로 다시 찾아보세요.");
    return;
  }

  clearMessage(boardMessage);

  const fragment = document.createDocumentFragment();
  filteredPosts.forEach((post) => {
    fragment.appendChild(createPostCard(post));
  });
  postList.appendChild(fragment);
}

async function loadPosts(options = {}) {
  const { silent = false } = options;

  if (!supabaseClient) {
    return;
  }

  if (!silent) {
    setMessage(boardMessage, "success", "게시글을 불러오는 중입니다.");
  }

  setConnectionState("loading", "연결 확인 중");

  const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .select("id, author, title, content, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    postCache = [];
    postList.replaceChildren();
    updateStats([]);
    setConnectionState("error", "연결 오류");
    setMessage(boardMessage, "error", getReadableError(error));
    return;
  }

  postCache = data || [];
  updateStats(postCache);
  renderPosts();
  setConnectionState("success", postCache.length ? "Supabase 연결됨" : "연결됨 · 글 없음");

  if (!silent && postCache.length) {
    setMessage(boardMessage, "success", "최신 게시글을 불러왔습니다.");
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  clearMessage(formMessage);

  if (!supabaseClient) {
    return;
  }

  const author = normalizeSingleLine(authorInput.value);
  const title = normalizeSingleLine(titleInput.value);
  const content = normalizeParagraph(contentInput.value);

  if (author.length < 2) {
    setMessage(formMessage, "error", "닉네임은 2자 이상 입력해주세요.");
    authorInput.focus();
    return;
  }

  if (title.length < 2) {
    setMessage(formMessage, "error", "제목은 2자 이상 입력해주세요.");
    titleInput.focus();
    return;
  }

  if (content.length < 5) {
    setMessage(formMessage, "error", "내용은 5자 이상 입력해주세요.");
    contentInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "등록 중...";

  const { error } = await supabaseClient.from(TABLE_NAME).insert([
    {
      author,
      title,
      content,
    },
  ]);

  submitButton.disabled = false;
  submitButton.textContent = "게시하기";

  if (error) {
    setMessage(formMessage, "error", getReadableError(error));
    return;
  }

  window.localStorage.setItem(AUTHOR_STORAGE_KEY, author);
  postForm.reset();
  authorInput.value = author;
  updateCounter();
  setMessage(formMessage, "success", "게시글이 등록됐습니다.");
  await loadPosts({ silent: true });
}

function hydrateAuthor() {
  const savedAuthor = window.localStorage.getItem(AUTHOR_STORAGE_KEY);

  if (savedAuthor) {
    authorInput.value = savedAuthor;
  }
}

function bindEvents() {
  postForm.addEventListener("submit", handleSubmit);
  contentInput.addEventListener("input", updateCounter);
  searchInput.addEventListener("input", renderPosts);
  refreshButton.addEventListener("click", () => {
    loadPosts();
  });
}

function init() {
  hydrateAuthor();
  updateCounter();
  bindEvents();

  if (!isConfigured()) {
    disableBoard(
      "GitHub Environment가 아직 연결되지 않았습니다. github-pages 환경에 PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY를 설정한 뒤 배포하세요."
    );
    return;
  }

  try {
    supabaseClient = createSupabaseClient(BOARD_CONFIG);
  } catch (error) {
    disableBoard(error.message);
    return;
  }

  loadPosts();
}

init();
