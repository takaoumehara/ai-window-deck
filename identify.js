const params = new URLSearchParams(location.search);
document.getElementById("n").textContent = params.get("n") ?? "";
document.getElementById("label").textContent = params.get("label") ?? "";

// Long enough to look at, short enough not to be in the way.
setTimeout(() => window.close(), Number(params.get("ms") ?? 1800));
