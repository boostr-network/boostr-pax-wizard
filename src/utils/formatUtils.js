const truncateAddress = (str, start = 0, charsFromStart = 6, charsFromEnd = 4) => {
  return str?.length > 4 ? str?.slice(start, charsFromStart) + '...' + `${charsFromEnd === 0 ? '' : str?.slice(charsFromEnd * -1)}` : str;
};

const slugify = (str) => {
  str = str.replace(/^\s+|\s+$/g, '');
  str = str.toLowerCase();
  // Remove accents, swap ñ for n, etc
  var from = "ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;";
  var to   = "AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------";
  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }
  // Remove invalid chars
  str = str.replace(/[^a-z0-9 -]/g, '')
  // Collapse whitespace and replace by -
  .replace(/\s+/g, '-')
  // Collapse dashes
  .replace(/-+/g, '-');
  return str;
}

const getFileExtension = (str) => {
  return (str.match(/\.([^.]*?)(?=\?|#|$)/) || [])[1];
}

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const truncateString = (str, max) => {
  return str.length > max ? str.substring(0, max) + "..." : str;
}

export { truncateAddress, slugify, getFileExtension, capitalizeFirstLetter, truncateString };
