const TABLE_NAME = "board_posts";
const PROFILE_TABLE_NAME = "profiles";
const EMAIL_STORAGE_KEY = "jhzzang12-board-email";
const MAX_CONTENT_LENGTH = 2000;
const BOARD_CONFIG = window.BOARD_CONFIG || null;

const {
  connectionBadge,
  postCount,
  latestAuthor,
  latestTime,
  authBadge,
  authForm,
  signInModeButton,
  signUpModeButton,
  displayNameField,
  displayNameInput,
  emailInput,
  passwordInput,
  authSubmitButton,
  authMessage,
  sessionHeadline,
  sessionCopy,
  currentUserName,
  currentUserEmail,
  signOutButton,
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
  authBadge: document.getElementById("authBadge"),
  authForm: document.getElementById("authForm"),
  signInModeButton: document.getElementById("signInModeButton"),
  signUpModeButton: document.getElementById("signUpModeButton"),
  displayNameField: document.getElementById("displayNameField"),
  displayNameInput: document.getElementById("displayNameInput"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  authSubmitButton: document.getElementById("authSubmitButton"),
  authMessage: document.getElementById("authMessage"),
  sessionHeadline: document.getElementById("sessionHeadline"),
  sessionCopy: document.getElementById("sessionCopy"),
  currentUserName: document.getElementById("currentUserName"),
  currentUserEmail: document.getElementById("currentUserEmail"),
  signOutButton: document.getElementById("signOutButton"),
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
let authMode = "signin";
let currentSession = null;
let currentProfile = null;
let boardDisabledReason = "";
let profileLoadError = "";
let isProfileLoading = false;
let isAuthenticating = false;
let isPosting = false;

function createSupabaseClient(config) {
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    throw new Error("Supabase 브라우저 클라이언트를 불러오지 못했습니다.");
  }

  return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

function normalizeSingleLine(value) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeParagraph(value) {
  return value.trim();
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function setConnectionState(state, label) {
  connectionBadge.dataset.state = state;
  connectionBadge.textContent = label;
}

function setAuthState(state, label) {
  authBadge.dataset.state = state;
  authBadge.textContent = label;
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

function getReadableError(error) {
  const message = error && error.message ? error.message : "알 수 없는 오류가 발생했습니다.";
  const lowerMessage = message.toLowerCase();

  if (error && error.code === "42P01" && lowerMessage.includes("profiles")) {
    return "Supabase에 public.profiles 테이블이 없습니다. 최신 supabase/board_posts.sql을 다시 실행하세요.";
  }

  if (error && error.code === "42P01") {
    return "Supabase에 public.board_posts 테이블이 없습니다. 최신 supabase/board_posts.sql을 먼저 실행하세요.";
  }

  if (lowerMessage.includes("row-level security")) {
    return "RLS 정책 때문에 쓰기 또는 읽기가 막혀 있습니다. 최신 supabase/board_posts.sql을 다시 적용하세요.";
  }

  if (lowerMessage.includes("failed to fetch")) {
    return "Supabase 연결에 실패했습니다. 프로젝트 URL과 anon key를 다시 확인하세요.";
  }

  if (lowerMessage.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }

  if (lowerMessage.includes("email not confirmed")) {
    return "이메일 인증을 완료한 뒤 다시 로그인하세요.";
  }

  if (lowerMessage.includes("user already registered")) {
    return "이미 가입된 이메일입니다. 로그인으로 전환해서 진행하세요.";
  }

  if (lowerMessage.includes("password should be at least 6 characters")) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }

  if (lowerMessage.includes("profile not found")) {
    return "사용자 프로필을 찾지 못했습니다. 최신 supabase/board_posts.sql을 실행한 뒤 다시 로그인하세요.";
  }

  if (lowerMessage.includes("authentication required")) {
    return "게시글 작성은 로그인 후에만 가능합니다.";
  }

  return message;
}

function disableBoard(reason) {
  boardDisabledReason = reason;

  setConnectionState("error", "설정 필요");
  setAuthState("error", "설정 필요");
  setMessage(boardMessage, "error", reason);
  setMessage(formMessage, "error", reason);
  setMessage(authMessage, "error", reason);

  [
    authorInput,
    titleInput,
    contentInput,
    searchInput,
    refreshButton,
    submitButton,
    signInModeButton,
    signUpModeButton,
    displayNameInput,
    emailInput,
    passwordInput,
    authSubmitButton,
    signOutButton,
  ].forEach((element) => {
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

function getDisplayNameFromUser(user) {
  if (!user) {
    return "";
  }

  const metadataName = normalizeSingleLine(user.user_metadata?.display_name || "");

  if (metadataName) {
    return metadataName;
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "";
}

function getActiveDisplayName() {
  if (currentProfile?.display_name) {
    return normalizeSingleLine(currentProfile.display_name);
  }

  return getDisplayNameFromUser(currentSession?.user);
}

function getEmailRedirectUrl() {
  if (!window.location || !/^https?:$/.test(window.location.protocol)) {
    return "";
  }

  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";

  if (url.pathname.endsWith("/index.html")) {
    url.pathname = url.pathname.slice(0, -"index.html".length);
  }

  if (!url.pathname.endsWith("/")) {
    url.pathname = `${url.pathname}/`;
  }

  return url.toString();
}

function setAuthMode(mode) {
  authMode = mode === "signup" ? "signup" : "signin";

  const isSignUp = authMode === "signup";
  displayNameField.hidden = !isSignUp;
  authSubmitButton.textContent = isAuthenticating
    ? isSignUp
      ? "가입 중..."
      : "로그인 중..."
    : isSignUp
      ? "회원가입"
      : "로그인";
  passwordInput.autocomplete = isSignUp ? "new-password" : "current-password";

  signInModeButton.classList.toggle("is-active", !isSignUp);
  signUpModeButton.classList.toggle("is-active", isSignUp);
  signInModeButton.setAttribute("aria-pressed", String(!isSignUp));
  signUpModeButton.setAttribute("aria-pressed", String(isSignUp));
}

function updateComposerAccess() {
  if (boardDisabledReason) {
    return;
  }

  const isLoggedIn = Boolean(currentSession?.user);
  const activeDisplayName = getActiveDisplayName();
  const canPost = isLoggedIn && !isProfileLoading && !profileLoadError;

  authorInput.value = canPost ? activeDisplayName : "";
  authorInput.disabled = !canPost;
  titleInput.disabled = !canPost;
  contentInput.disabled = !canPost;
  submitButton.disabled = !canPost || isPosting;
  submitButton.textContent = isPosting ? "등록 중..." : "게시하기";

  if (canPost) {
    clearMessage(formMessage);
    return;
  }

  if (profileLoadError) {
    setMessage(formMessage, "error", profileLoadError);
    return;
  }

  if (isProfileLoading) {
    setMessage(formMessage, "success", "로그인 정보를 확인하는 중입니다. 잠시만 기다려주세요.");
    return;
  }

  setMessage(formMessage, "error", "게시글을 작성하려면 먼저 로그인하세요.");
}

function updateAuthUI() {
  if (boardDisabledReason) {
    return;
  }

  const user = currentSession?.user || null;
  const isLoggedIn = Boolean(user);
  const displayName = getActiveDisplayName();
  const email = currentProfile?.email || user?.email || "-";

  setAuthMode(authMode);

  signInModeButton.disabled = isAuthenticating;
  signUpModeButton.disabled = isAuthenticating;
  displayNameInput.disabled = isAuthenticating;
  emailInput.disabled = isAuthenticating;
  passwordInput.disabled = isAuthenticating;
  authSubmitButton.disabled = isAuthenticating;

  if (!isLoggedIn) {
    authForm.hidden = false;
    signOutButton.hidden = true;
    signOutButton.disabled = true;
    setAuthState("signed-out", "비회원");
    sessionHeadline.textContent = "로그인 후 게시글 작성 가능";
    sessionCopy.textContent = "회원가입 시 입력한 표시 이름이 게시글 작성자명으로 자동 사용됩니다.";
    currentUserName.textContent = "-";
    currentUserEmail.textContent = "-";
    updateComposerAccess();
    return;
  }

  authForm.hidden = true;
  signOutButton.hidden = false;
  signOutButton.disabled = false;
  currentUserName.textContent = displayName || "-";
  currentUserEmail.textContent = email;

  if (isProfileLoading) {
    setAuthState("loading", "프로필 확인 중");
    sessionHeadline.textContent = "작성 권한을 확인하는 중입니다";
    sessionCopy.textContent = "로그인은 완료됐습니다. 프로필과 작성 권한을 확인한 뒤 게시글 작성이 열립니다.";
    updateComposerAccess();
    return;
  }

  if (profileLoadError) {
    setAuthState("error", "프로필 오류");
    sessionHeadline.textContent = "로그인은 됐지만 작성 준비가 끝나지 않았습니다";
    sessionCopy.textContent = profileLoadError;
    updateComposerAccess();
    return;
  }

  setAuthState("authenticated", "로그인됨");
  sessionHeadline.textContent = "작성 준비 완료";
  sessionCopy.textContent = `${displayName || "사용자"} 님으로 로그인되어 있습니다. 제목과 내용을 입력하면 바로 게시글을 등록할 수 있습니다.`;
  updateComposerAccess();
}

async function loadCurrentProfile(userId) {
  const { data, error } = await supabaseClient
    .from(PROFILE_TABLE_NAME)
    .select("display_name, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return {
      profile: null,
      errorMessage: getReadableError(error),
    };
  }

  if (!data) {
    return {
      profile: null,
      errorMessage: "사용자 프로필을 찾지 못했습니다. 최신 supabase/board_posts.sql을 실행한 뒤 다시 로그인하세요.",
    };
  }

  return {
    profile: data,
    errorMessage: "",
  };
}

async function syncSession(session) {
  currentSession = session;
  currentProfile = null;
  profileLoadError = "";
  isProfileLoading = false;

  if (session?.user) {
    isProfileLoading = true;
    setAuthState("loading", "프로필 확인 중");
    updateAuthUI();
    const { profile, errorMessage } = await loadCurrentProfile(session.user.id);
    currentProfile = profile;
    profileLoadError = errorMessage;
    isProfileLoading = false;
  }

  updateAuthUI();
}

async function restoreSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();

    if (error) {
      setMessage(authMessage, "error", getReadableError(error));
      setAuthState("error", "세션 오류");
      updateAuthUI();
      return;
    }

    await syncSession(session);
  } catch (error) {
    setMessage(authMessage, "error", getReadableError(error));
    setAuthState("error", "세션 오류");
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  clearMessage(authMessage);

  if (!supabaseClient || boardDisabledReason) {
    return;
  }

  const email = normalizeEmail(emailInput.value);
  const password = passwordInput.value.trim();
  const displayName = normalizeSingleLine(displayNameInput.value);
  const isSignUp = authMode === "signup";

  if (!email || !email.includes("@")) {
    setMessage(authMessage, "error", "올바른 이메일 주소를 입력해주세요.");
    emailInput.focus();
    return;
  }

  if (isSignUp && displayName.length < 2) {
    setMessage(authMessage, "error", "표시 이름은 2자 이상 입력해주세요.");
    displayNameInput.focus();
    return;
  }

  if (password.length < 6) {
    setMessage(authMessage, "error", "비밀번호는 6자 이상 입력해주세요.");
    passwordInput.focus();
    return;
  }

  isAuthenticating = true;
  setAuthMode(authMode);
  updateAuthUI();

  try {
    if (isSignUp) {
      const signUpOptions = {
        data: {
          display_name: displayName,
        },
      };
      const emailRedirectTo = getEmailRedirectUrl();

      if (emailRedirectTo) {
        signUpOptions.emailRedirectTo = emailRedirectTo;
      }

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: signUpOptions,
      });

      if (error) {
        throw error;
      }

      window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
      passwordInput.value = "";

      if (data.session) {
        setMessage(authMessage, "success", "회원가입과 로그인이 완료되었습니다.");
      } else {
        setAuthMode("signin");
        setMessage(authMessage, "success", "회원가입이 완료되었습니다. 이메일 인증 후 이 게시판 페이지로 돌아와 로그인하세요.");
      }

      return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
    passwordInput.value = "";
    setMessage(authMessage, "success", "로그인되었습니다.");
  } catch (error) {
    setMessage(authMessage, "error", getReadableError(error));
  } finally {
    isAuthenticating = false;
    setAuthMode(authMode);
    updateAuthUI();
  }
}

async function handleSignOut() {
  clearMessage(authMessage);

  if (!supabaseClient || boardDisabledReason) {
    return;
  }

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    setMessage(authMessage, "error", getReadableError(error));
    return;
  }

  titleInput.value = "";
  contentInput.value = "";
  updateCounter();
  setMessage(authMessage, "success", "로그아웃했습니다.");
}

async function handleSubmit(event) {
  event.preventDefault();
  clearMessage(formMessage);

  if (!supabaseClient || boardDisabledReason) {
    return;
  }

  if (!currentSession?.user) {
    setMessage(formMessage, "error", "게시글을 작성하려면 먼저 로그인하세요.");
    return;
  }

  if (isProfileLoading) {
    setMessage(formMessage, "success", "로그인 정보를 확인하는 중입니다. 잠시만 기다려주세요.");
    return;
  }

  if (profileLoadError) {
    setMessage(formMessage, "error", profileLoadError);
    return;
  }

  const title = normalizeSingleLine(titleInput.value);
  const content = normalizeParagraph(contentInput.value);

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

  isPosting = true;
  updateComposerAccess();

  try {
    const { error } = await supabaseClient.from(TABLE_NAME).insert([
      {
        title,
        content,
      },
    ]);

    if (error) {
      throw error;
    }

    titleInput.value = "";
    contentInput.value = "";
    updateCounter();
    setMessage(formMessage, "success", "게시글이 등록됐습니다.");
    await loadPosts({ silent: true });
  } catch (error) {
    setMessage(formMessage, "error", getReadableError(error));
  } finally {
    isPosting = false;
    updateComposerAccess();
  }
}

function hydrateLastEmail() {
  const savedEmail = window.localStorage.getItem(EMAIL_STORAGE_KEY);

  if (savedEmail) {
    emailInput.value = savedEmail;
  }
}

function bindEvents() {
  authForm.addEventListener("submit", handleAuthSubmit);
  signInModeButton.addEventListener("click", () => {
    clearMessage(authMessage);
    setAuthMode("signin");
  });
  signUpModeButton.addEventListener("click", () => {
    clearMessage(authMessage);
    setAuthMode("signup");
  });
  signOutButton.addEventListener("click", handleSignOut);
  postForm.addEventListener("submit", handleSubmit);
  contentInput.addEventListener("input", updateCounter);
  searchInput.addEventListener("input", renderPosts);
  refreshButton.addEventListener("click", () => {
    loadPosts();
  });
}

async function init() {
  hydrateLastEmail();
  updateCounter();
  setAuthMode("signin");
  bindEvents();
  updateAuthUI();

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

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    void syncSession(session);
  });

  await restoreSession();
  await loadPosts();
}

init();
