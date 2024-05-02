const getTodayString = (includeTime = false) => {
  if (includeTime) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  } else {
    return new Date().toISOString().slice(0, 10);
  }
}

export { getTodayString };
