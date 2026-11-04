const downloadURL = async (filename, url) => {
  if (window.parent !== window && filename.endsWith('.json')) {
    const blob = await (await fetch(url)).blob();
    window.parent.postMessage({p4:{type:'settings-export', name:filename, blob:new Blob([blob],{type:'application/json'})}}, location.protocol === 'file:' ? '*' : location.origin);
    return;
  }
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export default downloadURL;
