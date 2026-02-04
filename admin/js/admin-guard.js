window.adminSessionReady = (async () => {
  const { data } = await window.sb.auth.getSession();

  if (!data?.session) {
    window.location.replace("./login.html");
    return null;
  }

  return data.session;
})();
